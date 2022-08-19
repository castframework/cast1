import {
  Ledger,
  ContractNotification,
  ErrorNotification,
  HeartbeatNotification,
  InstrumentDetails,
  OracleSettlementTransaction,
  RegistryNotification,
} from '@castframework/models';
import {
  Args,
  Resolver,
  Query,
  Subscription,
  ObjectType,
  registerEnumType,
  Field,
  createUnionType,
  Mutation,
  InputType,
} from '@nestjs/graphql';
import * as log4js from 'log4js';

import { getLogger, Logger } from 'log4js';
import { ForgePubSub } from '../../utils/PubSub.wrapper';
import {
  EVENT_CONTRACT_NOTIFICATION,
  EVENT_ERROR,
  EVENT_HEARTBEAT,
  EVENT_REGISTRY_NOTIFICATION,
} from '../fro/fro.event.constant';
import { FxoSettlementInfoService } from './settlementInfoService.service';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import {
  TransactionId,
  TransactionInfo,
  TransactionStatus,
} from '@castframework/transaction-manager';
import {
  EthereumSpecificParams,
  EthereumSpecificTransactionInfo,
} from '@castframework/blockchain-driver-eth';
import {
  TezosSpecificParams,
  TezosSpecificTransactionInfo,
} from '@castframework/blockchain-driver-tz';
import { HandleLogsAndErrors } from '../../utils/logger';

@ObjectType('TransactionDetails')
class TransactionDetails {
  @Field()
  public to: string;
  @Field({ nullable: true })
  public methodName?: string;
  @Field({ nullable: true })
  public methodParameters?: string;
  @Field({ nullable: true })
  public value?: number;
}
@ObjectType('BlockchainEvent')
class BlockchainEvent {
  @Field()
  public eventName: string;
  @Field()
  public smartContractAddress: string;
  @Field()
  public blockNumber: number;
  @Field()
  public blockHash: string;
  @Field()
  public transactionId: string;
  @Field()
  public payload: string;
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});

const BlockchainSpecificTransactionInfo = createUnionType({
  name: 'BlockchainSpecificTransactionInfo',
  types: () => [EthereumSpecificTransactionInfo, TezosSpecificTransactionInfo],
  resolveType: (value) =>
    value.gasPrice
      ? EthereumSpecificTransactionInfo
      : TezosSpecificTransactionInfo,
});

ObjectType()(EthereumSpecificTransactionInfo);
Field(() => Number, { nullable: true })(
  EthereumSpecificTransactionInfo.prototype,
  'gasLimit',
);
Field(() => Number, { nullable: true })(
  EthereumSpecificTransactionInfo.prototype,
  'gasPrice',
);
ObjectType()(TezosSpecificTransactionInfo);
Field(() => String, { nullable: true })(
  TezosSpecificTransactionInfo.prototype,
  'weNeedAtLeastOneFieldForGraphql',
);

InputType()(EthereumSpecificParams);
ObjectType()(EthereumSpecificParams);
Field(() => Number, { nullable: true })(
  EthereumSpecificParams.prototype,
  'gasPrice',
);
Field(() => Number, { nullable: true })(
  EthereumSpecificParams.prototype,
  'gasLimit',
);
InputType()(TezosSpecificParams);
ObjectType()(TezosSpecificParams);
Field(() => String, { nullable: true })(
  TezosSpecificParams.prototype,
  'eventSinkProperty',
);
@ObjectType('TransactionInfo')
class GraphQLTransactionInfo {
  @Field(() => String)
  id: TransactionId;
  @Field()
  nonce: number;
  @Field(() => TransactionStatus)
  status: TransactionStatus;
  @Field()
  lastStatusTimestamp: Date;
  @Field({ nullable: true })
  blockNumber?: number;
  @Field({ nullable: true })
  sendTimestamp?: Date;
  @Field({ nullable: true })
  sendBlockNumber?: number;
  @Field(() => String, { nullable: true })
  replacedTransactionId?: TransactionId;
  @Field(() => String, { nullable: true })
  replacementTransactionId?: TransactionId;
  @Field({ nullable: true })
  details?: TransactionDetails;
  @Field({ nullable: true })
  currentError?: string;
  @Field(() => [BlockchainEvent], { nullable: true })
  emittedEvents?: BlockchainEvent[];
  @Field(() => BlockchainSpecificTransactionInfo, { nullable: true })
  blockchainSpecificTransactionInfo?:
    | EthereumSpecificTransactionInfo
    | TezosSpecificTransactionInfo;
}

@Resolver(() => String)
export class FXOResolver {
  private logger: Logger = getLogger(this.constructor.name);
  public constructor(
    private readonly fxoService: FxoSettlementInfoService,
    private readonly authService: AuthClaimService,
    private readonly pubSub: ForgePubSub,
  ) {}

  @Query(() => [OracleSettlementTransaction])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransactions(
    @Args({
      name: 'instrumentAddress',
      nullable: true,
      type: () => String,
    })
    instrumentAddress?: string,
    @Args({
      name: 'instrumentLedger',
      nullable: true,
      type: () => Ledger,
    })
    instrumentLedger?: Ledger,
  ): Promise<OracleSettlementTransaction[]> {
    return await this.fxoService.getSettlementTransactions(
      instrumentLedger,
      instrumentAddress,
    );
  }

  @Query(() => [OracleSettlementTransaction])
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getSettlementTransactionsByPaymentReference(
    @Args({
      name: 'paymentReference',
      nullable: true,
      type: () => String,
    })
    paymentReference?: string,
  ): Promise<OracleSettlementTransaction[] | undefined> {
    return await this.fxoService.getSettlementTransactionsByPaymentReference(
      paymentReference,
    );
  }

  @Query(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async whoami(
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
  ): Promise<string> {
    return await this.authService.whoAmI(ledger);
  }

  @Query(() => OracleSettlementTransaction, { nullable: true })
  public async getSettlementTransaction(
    @Args({
      name: 'id',
      type: () => String,
    })
    id: string,
  ): Promise<OracleSettlementTransaction | null> {
    return await this.fxoService.getSettlementTransaction(id);
  }

  @Query(() => [String], { nullable: true })
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getAllInstruments(
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
  ): Promise<string[] | null> {
    return await this.fxoService.getAllInstruments(ledger);
  }

  @Query((returns) => InstrumentDetails)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getInstrumentDetails(
    @Args('contractAddress') contractAddress: string,
    @Args({
      name: 'instrumentLedger',
      type: () => Ledger,
    })
    instrumentLedger: Ledger,
  ): Promise<InstrumentDetails | null> {
    return await this.fxoService.getInstrumentDetails(
      contractAddress,
      instrumentLedger,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Subscription(() => ContractNotification, {
    nullable: true,
  })
  public contractNotification(): AsyncIterator<ContractNotification> {
    this.logger.debug(`Received subscription ContractNotification`);
    const result: AsyncIterator<ContractNotification> =
      this.pubSub.asyncIterator<ContractNotification>(
        EVENT_CONTRACT_NOTIFICATION,
      );
    this.logger.debug(`subscription ContractNotification: ok`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Subscription(() => ContractNotification, {
    nullable: true,
    resolve: (value) => value.contractNotification,
    filter: (payload, variables) =>
      payload.contractNotification.instrumentAddress ===
      variables.instrumentAddress,
  })
  public contractNotificationForInstrumentAddress(
    @Args({
      name: 'instrumentAddress',
      type: () => String,
    })
    instrumentAddress: string,
  ): AsyncIterator<ContractNotification> {
    this.logger.debug(
      `Received subscription contractNotificationForInstrumentAddress with instrument address: ${instrumentAddress}`,
    );
    const result: AsyncIterator<ContractNotification> =
      this.pubSub.asyncIterator<ContractNotification>(
        EVENT_CONTRACT_NOTIFICATION,
      );
    this.logger.debug(
      `subscription contractNotificationForInstrumentAddress: ok`,
    );
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Subscription(() => ErrorNotification, { nullable: true })
  public errorNotification(): AsyncIterator<ErrorNotification> {
    this.logger.debug(`Received subscription errorNotification`);
    const result: AsyncIterator<ErrorNotification> =
      this.pubSub.asyncIterator<ErrorNotification>(EVENT_ERROR);
    this.logger.debug(`subscription errorNotification: ok`);
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Subscription(() => HeartbeatNotification, { nullable: true })
  public heartbeatNotification(): AsyncIterator<HeartbeatNotification> {
    this.logger.debug(`Received subscription heartbeatNotification`);
    const result: AsyncIterator<HeartbeatNotification> =
      this.pubSub.asyncIterator<HeartbeatNotification>(EVENT_HEARTBEAT);
    this.logger.debug(`subscription heartbeatNotification: ok`);
    return result;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Subscription((returns) => RegistryNotification, { nullable: true })
  public registryNotification(): AsyncIterator<RegistryNotification> {
    this.logger.debug(`Received subscription RegistryNotification`);
    const result: AsyncIterator<RegistryNotification> =
      this.pubSub.asyncIterator<RegistryNotification>(
        EVENT_REGISTRY_NOTIFICATION,
      );
    this.logger.debug(`subscription RegistryNotification: ok`);
    return result;
  }

  @Query((returns) => GraphQLTransactionInfo)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async getTransactionInfo(
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
    @Args('transactionId')
    transactionId: string,
  ): Promise<GraphQLTransactionInfo> {
    const transactionInfo = await this.fxoService.getTransactionInfo(
      ledger,
      transactionId,
    );
    const result = this.convertTransactionInfo(transactionInfo);
    return result;
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async boostTransaction(
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
    @Args('transactionId')
    transactionId: string,
    @Args({
      name: 'ethereumSpecificParams',
      type: () => EthereumSpecificParams,
      nullable: true,
    })
    ethereumSpecificParams?: EthereumSpecificParams,
    @Args({
      name: 'tezosSpecificParams',
      type: () => TezosSpecificParams,
      nullable: true,
    })
    tezosSpecificParams?: TezosSpecificParams,
  ): Promise<string> {
    const transactionReceipt = await this.fxoService.boostTransaction(
      ledger,
      transactionId,
      ledger === Ledger.ETHEREUM ? ethereumSpecificParams : tezosSpecificParams,
    );
    return transactionReceipt.transactionId;
  }

  @Mutation(() => String)
  @HandleLogsAndErrors(log4js.levels.DEBUG)
  public async cancelTransaction(
    @Args({
      name: 'ledger',
      type: () => Ledger,
    })
    ledger: Ledger,
    @Args('transactionId')
    transactionId: string,
    @Args({
      name: 'ethereumSpecificParams',
      type: () => EthereumSpecificParams,
      nullable: true,
    })
    ethereumSpecificParams?: EthereumSpecificParams,
    @Args({
      name: 'tezosSpecificParams',
      type: () => TezosSpecificParams,
      nullable: true,
    })
    tezosSpecificParams?: TezosSpecificParams,
  ): Promise<string> {
    const cancelReceipt = await this.fxoService.cancelTransaction(
      ledger,
      transactionId,
      ledger === Ledger.ETHEREUM ? ethereumSpecificParams : tezosSpecificParams,
    );
    return cancelReceipt.transactionId;
  }

  private convertTransactionInfo(
    transactionInfo: TransactionInfo<
      EthereumSpecificTransactionInfo | TezosSpecificTransactionInfo,
      EthereumSpecificParams | TezosSpecificParams
    >,
  ): GraphQLTransactionInfo {
    const result = new GraphQLTransactionInfo();
    result.id = transactionInfo.id;
    result.nonce = transactionInfo.nonce;
    result.status = transactionInfo.status;
    result.lastStatusTimestamp = transactionInfo.lastStatusTimestamp;
    result.blockNumber = transactionInfo.blockNumber;
    result.sendTimestamp = transactionInfo.sendTimestamp;
    result.sendBlockNumber = transactionInfo.sendBlockNumber;
    result.replacedTransactionId = transactionInfo.replacedTransactionId;
    result.replacementTransactionId = transactionInfo.replacementTransactionId;
    if (transactionInfo.details !== undefined) {
      result.details = new TransactionDetails();
      result.details.to = transactionInfo.details.to;
      result.details.methodName = transactionInfo.details.methodName;
      result.details.methodParameters = JSON.stringify(
        transactionInfo.details.methodParameters,
      );
    }
    result.currentError = transactionInfo.currentError;
    if (transactionInfo.emittedEvents !== undefined) {
      result.emittedEvents = transactionInfo.emittedEvents
        .filter((event) => event.eventName !== undefined)
        .map((event) => ({
          eventName: event.eventName,
          smartContractAddress: event.smartContractAddress,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          transactionId: event.transactionId,
          payload: JSON.stringify(event.payload),
        }));
    }
    if (transactionInfo.blockchainSpecificTransactionInfo !== undefined) {
      result.blockchainSpecificTransactionInfo =
        transactionInfo.blockchainSpecificTransactionInfo;
    }
    return result;
  }
}
