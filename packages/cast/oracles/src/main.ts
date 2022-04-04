import {
  configureLogger,
  getNestJsLoggerService,
  getLogger,
} from './utils/logger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as minimist from 'minimist';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';

import { AppModule } from './app.dyno.module';
import { Mode } from './mode';
import { SharedModule } from './shared.module';
import { parse } from 'qs';
import * as cors from 'cors';
import { SharedConfig } from './shared/shared.config';
import { ShutdownService } from './shared/services/shutdown.service';
import './tracer';
import { ExtendedClassSerializerInterceptor } from './interceptors/extended-class-serializer-interceptor';

configureLogger();
const logger = getLogger('Main');

const corsOrigin = [
  /localhost:[0-9]*$/,
  /forge.local$/,
  /sgforge.org$/,
  /sgforge.com$/,
  /sgforge.fr$/,
];

async function bootstrap(): Promise<void> {
  const argv = minimist(process.argv.slice(2));

  logger.debug(`Called with args : ${JSON.stringify(argv)}`);

  const modes = Array.isArray(argv.mode) ? argv.mode : [argv.mode];

  // if no arg run only the settlement transaction repository (STR)
  const module = argv.mode
    ? AppModule.forRoot(modes)
    : AppModule.forRoot([Mode.STR]);

  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const app = await NestFactory.create<NestExpressApplication>(
    module,
    new ExpressAdapter(),
    {
      cors: {
        origin: corsOrigin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        preflightContinue: true,
        optionsSuccessStatus: 204,
        credentials: true,
      },
      logger: getNestJsLoggerService('Main'),
    },
  );
  app.enable('trust proxy');
  app.set('query parser', (str: string) =>
    parse(str, { arrayLimit: Infinity }),
  );
  app.use(helmet({
      contentSecurityPolicy: false,
  }));
  app.use(compression());
  app.get(ShutdownService).subscribeToShutdown(() => app.close());

  (app as any).options('*', cors({ origin: corsOrigin }));

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ExtendedClassSerializerInterceptor(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: false,
      dismissDefaultMessages: true,
      validationError: {
        target: false,
      },
    }),
  );

  app.enableCors();
  const { port } = app.select(SharedModule).get(SharedConfig);
  await app.listen(port);

  logger.info(`Server started`);

  logger.debug(`server running on port ${port}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
