import { getLogger, Logger, HandleLogsAndErrors } from '../../utils/logger';
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Query, Resolver } from '@nestjs/graphql';
import * as log4js from 'log4js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@Resolver(() => String)
export class DataProviderResolver {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor() {}

  // At least one query required to generate a schema
  @Query(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async test(): Promise<string> {
    return 'hello, world';
  }
}
