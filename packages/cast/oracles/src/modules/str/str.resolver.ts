import { getLogger, Logger, HandleLogsAndErrors } from '../../utils/logger';
import { AuthUser } from '../../decorators/auth-user.decorator';
import * as log4js from 'log4js';

import {
  Ledger,
  CreateOracleSettlementTransactionInput,
  STRSettlementTransaction,
} from '@castframework/models';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { SettlementTransactionService } from './str.service';
import { ChainRolesGuard, ChainUser } from '../../guards/ChainRoles.guard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@Resolver((of) => STRSettlementTransaction)
export class SettlementTransactionResolver {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly settlementTransactionService: SettlementTransactionService,
  ) {}

  @UseGuards(ChainRolesGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query((returns) => [STRSettlementTransaction], { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransactions(
    @AuthUser()
    user: ChainUser,
    @Args({
      name: 'instrumentAddress',
      nullable: true,
      type: () => String,
    })
    instrumentAddress?: string,
  ): Promise<STRSettlementTransaction[]> {
    return await this.settlementTransactionService.getSettlementTransactions(
      user,
      instrumentAddress,
    );
  }

  @UseGuards(ChainRolesGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query((returns) => [STRSettlementTransaction])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransactionByTimeFrame(
    @AuthUser()
    user: ChainUser,
    @Args('begin')
    begin: Date,
    @Args('end')
    end: Date,
  ): Promise<STRSettlementTransaction[]> {
    return await this.settlementTransactionService.getSettlementTransactionByTimeFrame(
      user,
      begin,
      end,
    );
  }

  @UseGuards(ChainRolesGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query((returns) => STRSettlementTransaction, { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransaction(
    @AuthUser()
    user: ChainUser,
    @Args({
      name: 'id',
      type: () => String,
    })
    id: string,
  ): Promise<STRSettlementTransaction | null> {
    return await this.settlementTransactionService.getSettlementTransaction(
      user,
      id,
    );
  }

  @UseGuards(ChainRolesGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Query((returns) => [STRSettlementTransaction], { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransactionsByPaymentReference(
    @AuthUser() user: ChainUser,
    @Args({
      name: 'paymentReference',
      nullable: true,
      type: () => String,
    })
    paymentReference?: string,
  ): Promise<STRSettlementTransaction[]> {
    return await this.settlementTransactionService.getSettlementTransactionsByPaymentReference(
      user,
      paymentReference as string,
    );
  }

  @Query((returns) => Ledger, { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getLedgerForTransaction(
    @Args('transactionId')
    transactionId: string,
  ): Promise<Ledger | null> {
    return await this.settlementTransactionService.getLedgerForTransactionId(
      transactionId,
    );
  }

  @Query((returns) => Ledger, { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getLedgerForPaymentReference(
    @Args('paymentReference')
    paymentReference: string,
  ): Promise<Ledger | null> {
    return await this.settlementTransactionService.getLedgerForPaymentReference(
      paymentReference,
    );
  }

  @UseGuards(ChainRolesGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Mutation((returns) => STRSettlementTransaction, { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async createSettlementTransaction(
    @Args('settlementTransaction')
    settlementTransaction: CreateOracleSettlementTransactionInput,
    @AuthUser() user?: ChainUser,
  ): Promise<STRSettlementTransaction | undefined> {
    return await this.settlementTransactionService.create(
      settlementTransaction,
      user as ChainUser,
    );
  }
}
