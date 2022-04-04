import { getLogger, Logger, HandleLogsAndErrors } from '../../utils/logger';
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import * as log4js from 'log4js';

import { FsoService } from './fso.service';
import { ForgePubSub } from '../../utils/PubSub.wrapper';
import { errorAsString } from '../../utils/errorAsString';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@Resolver(() => String)
export class FSOResolver {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly fsoService: FsoService,
    private readonly pubSub: ForgePubSub,
  ) {}

  // ne pas effacer cette query inutile :)
  @Query(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async test(): Promise<string> {
    return 'hello, world';
  }

  @Mutation(() => [String])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async confirmPaymentReceived(
    @Args('paymentReference') paymentReference: string,
  ): Promise<string[]> {
    return await this.fsoService.confirmPaymentReceived(paymentReference);
  }

  @Mutation(() => [String])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async confirmPaymentTransferred(
    @Args('paymentReference') paymentReference: string,
  ): Promise<string[]> {
    return await this.fsoService.confirmPaymentTransferred(paymentReference);
  }
}
