import * as log4js from 'log4js';
import { LoggerService } from '@nestjs/common';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';
import { errorAsString } from './errorAsString';
export { Logger } from 'log4js';

const config = {
  level: process.env['LOG_LEVEL'] ?? 'trace',
  pattern: process.env['LOG_PATTERN'] ?? '%d{yyyy/MM/dd hh:mm:ss.SSS} %p %c %m',
};

export function getLogger(...components: string[]): log4js.Logger {
  return log4js.getLogger(components.map((c) => c.replace(/ /g, '')).join('-'));
}

export function configureLogger(): void {
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: `${config.pattern}`,
        },
      },
    },
    categories: {
      default: {
        appenders: ['console'],
        level: config.level,
      },
    },
  });
  getLogger('configureLogger').debug(
    `Logger configured with config[${JSON.stringify(config)}]`,
  );
}

export function configureLoggerFile(): void {
  log4js.configure({
    appenders: { file: { type: 'file', filename: 'error.log' } },
    categories: {
      default: {
        appenders: ['file'],
        level: config.level,
      },
    },
  });
}

export function shutdownLogger(): void {
  getLogger().info('Shutting down logger');
  log4js.shutdown(() => undefined);
}

class NestJsWrappedLogger implements LoggerService {
  private _logger: log4js.Logger;

  public constructor(logger: log4js.Logger) {
    this._logger = logger;
  }

  public log(message: any, context?: string): any {
    return this._logger.debug(message);
  }

  public error(message: any, context?: string): any {
    return this._logger.error(message);
  }

  public warn(message: any, context?: string): any {
    return this._logger.warn(message);
  }

  public debug(message: any, context?: string): any {
    return this._logger.debug(message);
  }

  public verbose(message: any, context?: string): any {
    return this._logger.trace(message);
  }
}

export function getNestJsLoggerService(category: string): LoggerService {
  return new NestJsWrappedLogger(getLogger(category));
}

class TypeOrmWrappedLogger implements TypeOrmLogger {
  private _logger: log4js.Logger;
  private _options: LoggerOptions;

  public constructor(logger: log4js.Logger, options: LoggerOptions) {
    this._logger = logger;
    this._options = options;
  }
  public logQuery(
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): void {
    if (
      this._options === 'all' ||
      this._options === true ||
      (Array.isArray(this._options) && this._options.indexOf('query') !== -1)
    ) {
      const sql =
        query +
        (parameters && parameters.length
          ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
          : '');
      this._logger.trace('query' + ': ' + sql);
    }
  }
  public logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): void {
    if (
      this._options === 'all' ||
      this._options === true ||
      (Array.isArray(this._options) && this._options.indexOf('error') !== -1)
    ) {
      const sql =
        query +
        (parameters && parameters.length
          ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
          : '');
      this._logger.warn('query failed: ' + sql);
      this._logger.warn('error:', error);
    }
  }
  public logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): void {
    const sql =
      query +
      (parameters && parameters.length
        ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
        : '');
    this._logger.debug('query is slow: ' + sql);
    this._logger.debug('execution time: ' + time);
  }
  public logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
    if (
      this._options === 'all' ||
      (Array.isArray(this._options) && this._options.indexOf('schema') !== -1)
    ) {
      this._logger.debug(message);
    }
  }
  public logMigration(message: string, queryRunner?: QueryRunner): void {
    this._logger.debug(message);
  }
  public log(
    level: 'log' | 'info' | 'warn',
    message: any,
    queryRunner?: QueryRunner,
  ): void {
    switch (level) {
      case 'log':
        if (
          this._options === 'all' ||
          (Array.isArray(this._options) && this._options.indexOf('log') !== -1)
        )
          this._logger.debug(message);
        break;
      case 'info':
        if (
          this._options === 'all' ||
          (Array.isArray(this._options) && this._options.indexOf('info') !== -1)
        )
          this._logger.debug(message);
        break;
      case 'warn':
        if (
          this._options === 'all' ||
          (Array.isArray(this._options) && this._options.indexOf('warn') !== -1)
        )
          this._logger.warn(message);
        break;
    }
  }

  protected stringifyParams(parameters: any[]): any[] | string {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      // most probably circular objects in parameters
      return parameters;
    }
  }
}

export function getTypeOrmLogger(options: LoggerOptions): TypeOrmLogger {
  return new TypeOrmWrappedLogger(getLogger('typeorm'), options);
}

export function HandleLogsAndErrors(level: log4js.Level) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const logger = getLogger(target.constructor.name, propertyKey);
    const targetMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      logger.log(level.levelStr, `Called with args ${JSON.stringify(args)}`);
      try {
        const result = await targetMethod.apply(this, args);
        logger.log(level.levelStr, `Returning ${JSON.stringify(result)}`);
        return result;
      } catch (e) {
        this.logger.error(
          `Error during call with args ${JSON.stringify(args)}: ${errorAsString(
            e,
          )}`,
        );
        throw new Error(errorAsString(e));
      }
    };
  };
}
