import {
  BlockchainDriver,
  BlockchainSpecificParamsOf,
  CallResult,
  Event,
  TransactionManager,
  TransactionParams,
  TransactionReceipt,
} from '@castframework/transaction-manager';
import { Observable } from 'rxjs';
import BigNumber from 'bignumber.js';
import { SmartContract } from './SmartContract';

type getBalancesOutputsSingle = {
  _address: string;
  _balance: number | BigNumber;
  _locked: number | BigNumber;
};

type SettlementTransactionParams = {
  txId: string | number | BigNumber;
  operationId: string | number | BigNumber;
  deliverySenderAccountNumber: string;
  deliveryReceiverAccountNumber: string;
  deliveryQuantity: number | BigNumber;
  txHash: string;
};

export type InitiateSubscriptionParams = SettlementTransactionParams;

export type InitiateTradeParams = SettlementTransactionParams;

export type InitiateRedemptionParams = SettlementTransactionParams[];

export type CancelTransactionParams = SettlementTransactionParams;

export type ConfirmPaymentTransferredParams = number | BigNumber;
export type ConfirmPaymentReceivedParams = number | BigNumber;
export type CallParams = number | BigNumber;

export type getBalancesResult = getBalancesOutputsSingle[];

export type SingleSettlementTransaction = {
  settlementTransactionId: string;
};

export type ManySettlementTransaction = {
  settlementTransactionIds: string[];
};

export type SettlementTransactionOperationType = {
  settlementTransactionOperationType: string;
};

export const FORGEBOND_CONTRACT_EVENT_ALL_EVENTS = 'allEvents';

export const FORGEBOND_CONTRACT_EVENT_SUBSCRIPTION_INITIATED =
  'SubscriptionInitiated';
export type ForgeBondSubscriptionInitiatedPayload = SingleSettlementTransaction;
export type ForgeBondSubscriptionInitiatedEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_SUBSCRIPTION_INITIATED,
  ForgeBondSubscriptionInitiatedPayload
>;

export const FORGEBOND_CONTRACT_EVENT_TRADE_INITIATED = 'TradeInitiated';
export type ForgeBondTradeInitiatedPayload = SingleSettlementTransaction;
export type ForgeBondTradeInitiatedEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_TRADE_INITIATED,
  ForgeBondTradeInitiatedPayload
>;

export const FORGEBOND_CONTRACT_EVENT_REDEMPTION_INITIATED =
  'RedemptionInitiated';
export type ForgeBondRedemptionInitiatedPayload = ManySettlementTransaction;
export type ForgeBondRedemptionInitiatedEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_REDEMPTION_INITIATED,
  ForgeBondRedemptionInitiatedPayload
>;

export const FORGEBOND_CONTRACT_EVENT_PAYMENT_RECEIVED = 'PaymentReceived';
export type ForgeBondPaymentReceivedPayload = SingleSettlementTransaction &
  SettlementTransactionOperationType;
export type ForgeBondPaymentReceivedEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_PAYMENT_RECEIVED,
  ForgeBondPaymentReceivedPayload
>;

export const FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED =
  'PaymentTransferred';
export type ForgeBondPaymentTransferredPayload = SingleSettlementTransaction &
  SettlementTransactionOperationType;
export type ForgeBondPaymentTransferredEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
  ForgeBondPaymentTransferredPayload
>;

export const FORGEBOND_CONTRACT_EVENT_SETTLEMENT_CANCELED =
  'SettlementTransactionCanceled';
export type ForgeBondSettlementTransactionCanceledPayload =
  SingleSettlementTransaction & SettlementTransactionOperationType;
export type ForgeBondSettlementTransactionCanceledEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_SETTLEMENT_CANCELED,
  ForgeBondSettlementTransactionCanceledPayload
>;

export const FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER = 'Transfer';
export type ForgeBondTransferPayload = {
  _from: string;
  _to: string;
  _value: number;
};

export type ForgeBondTransferEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER,
  {
    _from: string;
    _to: string;
    _value: number;
  }
>;

export type ForgeBondAllEvents =
  | ForgeBondSubscriptionInitiatedEvent
  | ForgeBondTradeInitiatedEvent
  | ForgeBondRedemptionInitiatedEvent
  | ForgeBondPaymentReceivedEvent
  | ForgeBondPaymentTransferredEvent
  | ForgeBondSettlementTransactionCanceledEvent
  | ForgeBondTransferEvent;

export const OPERATION_TYPE_SUBSCRIPTION_VALUE = '1';
export const OPERATION_TYPE_SUBSCRIPTION = 'Subscription';

export const OPERATION_TYPE_REDEMPTION_VALUE = '2';
export const OPERATION_TYPE_REDEMPTION = 'Redemption';

export const OPERATION_TYPE_TRADE_VALUE = '3';
export const OPERATION_TYPE_TRADE = 'Trade';

export type SettlementTransactionTypeCodeValue =
  | typeof OPERATION_TYPE_SUBSCRIPTION_VALUE
  | typeof OPERATION_TYPE_REDEMPTION_VALUE
  | typeof OPERATION_TYPE_TRADE_VALUE;

export type SettlementTransactionTypeCode =
  | typeof OPERATION_TYPE_SUBSCRIPTION
  | typeof OPERATION_TYPE_REDEMPTION
  | typeof OPERATION_TYPE_TRADE;

export const SettlementTransactionTypeCodeMap: Record<
  SettlementTransactionTypeCodeValue,
  SettlementTransactionTypeCode
> = {
  [OPERATION_TYPE_SUBSCRIPTION_VALUE]: OPERATION_TYPE_SUBSCRIPTION,
  [OPERATION_TYPE_REDEMPTION_VALUE]: OPERATION_TYPE_REDEMPTION,
  [OPERATION_TYPE_TRADE_VALUE]: OPERATION_TYPE_TRADE,
};

export type ForgeBondAllEventsPayload = ForgeBondAllEvents['payload'];
export type ForgeBondAllEventsEventName = ForgeBondAllEvents['eventName'];

export class ForgeBond<
  Driver extends BlockchainDriver<unknown, unknown>,
> extends SmartContract<Driver> {
  constructor(
    smartContractAddress: string,
    transactionManager: TransactionManager<Driver>,
    contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<Driver>
    > = {},
  ) {
    super(
      smartContractAddress,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }

  public async CONFIRM_PAYMENT_RECEIVED(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'CONFIRM_PAYMENT_RECEIVED',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async SETTLER_ROLE(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('SETTLER_ROLE', [], transactionBlockchainSpecificParams);
  }

  public async REGISTRAR_ROLE(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'REGISTRAR_ROLE',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async owner(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('owner', [], transactionBlockchainSpecificParams);
  }

  public async settler(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('settler', [], transactionBlockchainSpecificParams);
  }

  public async registrar(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('registrar', [], transactionBlockchainSpecificParams);
  }

  public async initialSupply(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('initialSupply', [], transactionBlockchainSpecificParams);
  }

  public async currentSupply(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('currentSupply', [], transactionBlockchainSpecificParams);
  }

  public async state(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('state', [], transactionBlockchainSpecificParams);
  }

  public async currency(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('currency', [], transactionBlockchainSpecificParams);
  }

  public async name(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('name', [], transactionBlockchainSpecificParams);
  }

  public async symbol(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('symbol', [], transactionBlockchainSpecificParams);
  }

  public async isinCode(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('isinCode', [], transactionBlockchainSpecificParams);
  }

  public async denomination(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('denomination', [], transactionBlockchainSpecificParams);
  }

  public async divisor(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('divisor', [], transactionBlockchainSpecificParams);
  }

  public async startDate(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('startDate', [], transactionBlockchainSpecificParams);
  }

  public async maturityDate(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call('maturityDate', [], transactionBlockchainSpecificParams);
  }

  public async currentMaturityDate(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'currentMaturityDate',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async firstCouponDate(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'firstCouponDate',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async couponFrequencyInMonths(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'couponFrequencyInMonths',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async interestRateInBips(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'interestRateInBips',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async callable(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<boolean>> {
    return this._call('callable', [], transactionBlockchainSpecificParams);
  }

  public async isSoftBullet(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<boolean>> {
    return this._call('isSoftBullet', [], transactionBlockchainSpecificParams);
  }

  public async softBulletPeriodInMonths(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call(
      'softBulletPeriodInMonths',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async getType(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call('getType', [], transactionBlockchainSpecificParams);
  }

  public async getBalance(
    address: string,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call<[string], number | BigNumber>(
      'getBalance',
      [address],
      transactionBlockchainSpecificParams,
    );
  }

  public async getFullBalances(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<getBalancesResult>> {
    return this._call<never[], getBalancesResult>(
      'getFullBalances',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async getCurrentState(
    settlementTransactionId: string | number | BigNumber,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<number | BigNumber>> {
    return this._call<[string | number | BigNumber], number | BigNumber>(
      'getCurrentState',
      [settlementTransactionId],
      transactionBlockchainSpecificParams,
    );
  }

  public async getOperationType(
    operationId: number | BigNumber,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<string>> {
    return this._call<[number | BigNumber], string>(
      'getOperationType',
      [operationId],
      transactionBlockchainSpecificParams,
    );
  }

  public async isOperatorWithRoleAuthorized(
    operatorAddress: string,
    roleName: number | BigNumber,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<boolean>> {
    return this._call<[string, number | BigNumber], boolean>(
      'isOperatorWithRoleAuthorized',
      [operatorAddress, roleName],
      transactionBlockchainSpecificParams,
    );
  }

  public async initiateSubscription(
    initiateSubscriptionParams: InitiateSubscriptionParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[InitiateSubscriptionParams]>(
      'initiateSubscription',
      [initiateSubscriptionParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async initiateTrade(
    initiateTradeParams: InitiateTradeParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[InitiateTradeParams]>(
      'initiateTrade',
      [initiateTradeParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async initiateRedemption(
    initiateRedemptionParams: InitiateRedemptionParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[InitiateRedemptionParams]>(
      'initiateRedemption',
      [initiateRedemptionParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async confirmPaymentTransferred(
    confirmPaymentTransferredParams: ConfirmPaymentTransferredParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[ConfirmPaymentTransferredParams]>(
      'confirmPaymentTransferred',
      [confirmPaymentTransferredParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async confirmPaymentReceived(
    confirmPaymentReceivedParams: ConfirmPaymentReceivedParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[ConfirmPaymentReceivedParams]>(
      'confirmPaymentReceived',
      [confirmPaymentReceivedParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public SubscriptionInitiated(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondSubscriptionInitiatedEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_SUBSCRIPTION_INITIATED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public TradeInitiated(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondSubscriptionInitiatedEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_TRADE_INITIATED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public RedemptionInitiated(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondSubscriptionInitiatedEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_REDEMPTION_INITIATED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public PaymentReceived(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondPaymentReceivedEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_PAYMENT_RECEIVED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public PaymentTransferred(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondPaymentTransferredEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_PAYMENT_TRANSFERRED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public SettlementTransactionCanceled(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondSettlementTransactionCanceledEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_SETTLEMENT_CANCELED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public Transfer(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondTransferEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_TOKEN_TRANSFER,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public allEvents(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondAllEvents> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_ALL_EVENTS,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public async cancelSettlementTransaction(
    cancelTransactionParams: CancelTransactionParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[CancelTransactionParams]>(
      'cancelSettlementTransaction',
      [cancelTransactionParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }
}
