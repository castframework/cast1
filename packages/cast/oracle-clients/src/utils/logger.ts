import * as log4js from 'log4js';
import { LoggerService } from '@nestjs/common';
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
