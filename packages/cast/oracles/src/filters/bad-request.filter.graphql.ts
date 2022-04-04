import { getLogger, Logger } from '../utils/logger';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import * as _ from 'lodash';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './bad-request.filter';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch(BadRequestException)
export class GraphqlHttpExceptionFilter extends HttpExceptionFilter {
  protected logger: Logger = getLogger(this.constructor.name);
  public constructor(reflector: Reflector) {
    super(reflector);
  }

  public catch(exception: BadRequestException, host: ArgumentsHost): void {
    this.logger.debug(`exception[${JSON.stringify(exception)}]`);
    const gqlHost = GqlArgumentsHost.create(host);
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
}
