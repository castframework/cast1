import { getLogger, Logger, HandleLogsAndErrors } from '../../utils/logger';
import { ForgePubSub } from '../../utils/PubSub.wrapper';

import {
  CreateBondInput,
  CreateEMTNInput,
  InitiateRedemptionInput,
  InitiateSubscriptionInput,
  InitiateTradeInput,
  ForgeOperationType,
  CancelSettlementTransactionInput,
} from '@castframework/models';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import * as log4js from 'log4js';

import { EVENT_PLATFORM_LEVEL_PREPARED } from './fro.event.constant';
import { FroService } from './fro.service';
import { FroRedemptionService } from './fro.redemption.service';
import { FroOperationService } from './fro.operation.service';

@Resolver(() => String)
export class FROResolver {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly froService: FroService,
    private readonly pubSub: ForgePubSub,
    private readonly froRedemptionService: FroRedemptionService,
    private readonly froOperationService: FroOperationService,
  ) {}

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async createBond(
    @Args('bond')
    bond: CreateBondInput,
  ): Promise<string> {
    return await this.froService.createBond(bond);
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async initiateSubscription(
    @Args('initiateSubscriptionInput')
    initiateSubscriptionInput: InitiateSubscriptionInput,
  ): Promise<string> {
    return await this.froOperationService.initiateOperation(
      initiateSubscriptionInput,
      ForgeOperationType.SUBSCRIPTION,
    );
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async setupPlatformLevel(
    @Args('level') level: number,
  ): Promise<boolean> {
    const plateformPrepare = await this.froService.setupPlatformLevel(level);
    await this.pubSub.publish(EVENT_PLATFORM_LEVEL_PREPARED, plateformPrepare);
    return plateformPrepare;
  }

  // ne pas effacer cette query inutile :)
  @Query(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async test(): Promise<string> {
    return 'hello world';
  }

  ///// Structured Products

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async createEMTN(
    @Args('EMTN')
    EMTN: CreateEMTNInput,
  ): Promise<string> {
    return await this.froService.createEMTN(EMTN);
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async initiateRedemption(
    @Args('initiateRedemptionInput')
    initiateRedemptionInput: InitiateRedemptionInput,
  ): Promise<string> {
    return await this.froRedemptionService.initiateRedemption(
      initiateRedemptionInput,
    );
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async cancelSettlementTransaction(
    @Args('cancelSettlementTransactionInput')
    cancelSettlementTransactionInput: CancelSettlementTransactionInput,
  ): Promise<string> {
    return await this.froOperationService.cancelSettlementTransaction(
      cancelSettlementTransactionInput,
    );
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async initiateTrade(
    @Args('initiateTradeInput')
    initiateTradeInput: InitiateTradeInput,
  ): Promise<string> {
    return await this.froOperationService.initiateOperation(
      initiateTradeInput,
      ForgeOperationType.TRADE,
    );
  }
}
