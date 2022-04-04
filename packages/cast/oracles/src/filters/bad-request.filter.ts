import { getLogger, Logger } from '../utils/logger';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import * as _ from 'lodash';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

@Catch(BadRequestException)
export class HttpExceptionFilter implements ExceptionFilter {
  protected logger: Logger = getLogger(this.constructor.name);

  public reflector: Reflector;
  public constructor(reflector: Reflector) {
    this.reflector = reflector;
  }

  public catch(exception: BadRequestException, host: ArgumentsHost): void {
    this.logger.debug(`exception[${JSON.stringify(exception)}]`);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    this.logger.debug(`response[${JSON.stringify(response)}]`);
    let statusCode = exception.getStatus();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = exception.getResponse() as any;

    if (_.isArray(r.message) && r.message[0] instanceof ValidationError) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      const validationErrors = r.message as ValidationError[];
      this._validationFilter(validationErrors);
    }

    r.statusCode = statusCode;
    response.status(statusCode).json(r);
  }

  protected _validationFilter(validationErrors: ValidationError[]): void {
    for (const validationError of validationErrors) {
      for (const [constraintKey, constraint] of Object.entries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validationError.constraints as any,
      )) {
        // convert default messages
        if (!constraint && validationError.constraints !== undefined) {
          // convert error message to error.fields.{key} syntax for i18n translation
          validationError.constraints[constraintKey] =
            'error.fields.' + _.snakeCase(constraintKey);
        }
      }
      if (!_.isEmpty(validationError.children)) {
        this._validationFilter(validationError.children??[]);
      }
    }
  }
}
