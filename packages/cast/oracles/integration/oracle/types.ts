import {
  Ledger,
  ContractNotification,
  CreateBondInput,
  CreateEMTNInput,
  ErrorNotification,
  InitiateRedemptionInput,
  InitiateSubscriptionInput,
  InitiateTradeInput,
  InstrumentType,
  RegistryNotification,
} from '@castframework/models';
import { Logger } from 'log4js';
import {
  FroClientService,
  FsoClientService,
} from '@castframework/oracle-clients';
import { Observable, Subject, Subscription } from 'rxjs';
import { INestApplication } from '@nestjs/common';
import { Match } from '../utils/setupEnv';

export type NumberOfExpectedEvent = {
  numberOfExpectedEvent: number;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Env = {
  name: string;
  dbName: string;
  logger: Logger;
  froClient: FroClientService;
  fsoClient: FsoClientService;
  awaitingFroErrorNotificationsSubject: Subject<
    Partial<ErrorNotification & NumberOfExpectedEvent>
  > | null;
  froErrorNotificationsMatches: Observable<Match<ErrorNotification>[]> | null;
  awaitingFroContractNotificationsSubject: Subject<
    DeepPartial<ContractNotification & NumberOfExpectedEvent>
  > | null;
  froContractNotificationsMatches: Observable<
    Match<ContractNotification>[]
  > | null;
  awaitingFroRegistryNotificationsSubject: Subject<
    Partial<RegistryNotification & NumberOfExpectedEvent>
  > | null;
  froRegistryNotificationsMatches: Observable<
    Match<RegistryNotification>[]
  > | null;

  awaitingFsoErrorNotificationsSubject: Subject<
    Partial<ErrorNotification & NumberOfExpectedEvent>
  > | null;
  fsoErrorNotificationsMatches: Observable<Match<ErrorNotification>[]> | null;
  awaitingFsoContractNotificationsSubject: Subject<
    DeepPartial<ContractNotification & NumberOfExpectedEvent>
  > | null;
  fsoContractNotificationsMatches: Observable<
    Match<ContractNotification>[]
  > | null;

  contractNotificationsSubscriptions: Subscription[];
  froServer: INestApplication;
  strServer: INestApplication;
  fsoServer: INestApplication;
  fio1Server: INestApplication;
  fio2Server: INestApplication;
  fio3Server: INestApplication;
};

export type ScenarioData<Type extends InstrumentType> = {
  scenarioName: string;

  instrumentType: Type;
  ledger: Ledger;

  // Issuance
  instrumentInput: Type extends InstrumentType.Bond
    ? CreateBondInput
    : Type extends InstrumentType.EMTN
    ? CreateEMTNInput
    : never;

  instrumentAddress: string;

  // Subscription
  subscriptionInput: InitiateSubscriptionInput;
  subscriptionSettlementTransactionIds: string[];

  // Trade
  tradeInput: InitiateTradeInput; // Will be generated
  tradeSettlementTransactionId: string; // Will be generated

  // Redemption
  redemptionInput: InitiateRedemptionInput;
  redemptionSettlementTransactionIds: string[];
};
