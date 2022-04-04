import { getLogger, getTypeOrmLogger, Logger } from './utils/logger';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { contextMiddleware } from './middlewares';
import { FIOModule } from './modules/fio/fio.module';
import { FROModule } from './modules/fro/fro.module';
import { FSOModule } from './modules/fso/fso.module';
import { STRModule } from './modules/str/str.module';
import { SharedModule } from './shared.module';
import { Mode } from './mode';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { Movement, STRSettlementTransaction } from '@castframework/models';
import { ConfigModule } from './modules/config/config.module';
import { DatabaseConfig } from './database.config';

@Module({})
export class AppModule implements NestModule {
  private static logger: Logger = getLogger(AppModule.name);
  public static forRoot(modeRequested: string[]): DynamicModule {
    const imports = [SharedModule];

    let connectToDb = false; // A refactor c'est pas sexy

    this.logger.info(`Starting with modes : ${modeRequested}`);

    modeRequested.forEach((mode) => {
      switch (mode) {
        case Mode.STR:
          connectToDb = true;
          imports.push(STRModule);
          break;

        case Mode.FRO:
          imports.push(FROModule);
          break;

        case Mode.FSO:
          imports.push(FSOModule);
          break;

        case Mode.FIO:
          imports.push(FIOModule);
          break;

        default:
          this.logger.error(`Unknown mode requested : ${mode}`);
          return null;
      }
    });

    const dbWrapping = connectToDb
      ? [
          TypeOrmModule.forRootAsync({
            imports: [...imports, ConfigModule.forConfig(DatabaseConfig)],
            useFactory: (dbConfig: DatabaseConfig): TypeOrmModuleOptions => {
              const loggerOptions: LoggerOptions = true; // this.nodeEnv === 'development'; // TODO
              const params: TypeOrmModuleOptions = {
                entities: this.getEntities(modeRequested),
                synchronize: true,
                keepConnectionAlive: false,
                type: 'postgres',
                host: dbConfig.host,
                port: dbConfig.port,
                username: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database,
                migrationsRun: true,
                logging: loggerOptions,
                logger: getTypeOrmLogger(loggerOptions),
                namingStrategy: new SnakeNamingStrategy(),
                ssl: dbConfig.ssl === true ? {} : undefined,
              };
              this.logger.debug(
                `Using following params for db connection : ${JSON.stringify({
                  ...params,
                  password: 'REDACTED',
                })}`,
              );
              return params;
            },
            inject: [DatabaseConfig],
          }),
        ]
      : imports;

    return {
      module: AppModule,
      imports: dbWrapping,
    };
  }

  static getEntities(requestedMode: string[]): NewableFunction[] {
    const res: NewableFunction[] = [];
    requestedMode.forEach((mode) => {
      switch (mode) {
        case Mode.STR:
          res.push(STRSettlementTransaction);
          res.push(Movement);
          break;
      }
    });

    return res;
  }

  public configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(contextMiddleware).forRoutes('*');
  }
}
