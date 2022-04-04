import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Ledger,
  ContractNotification,
  ErrorNotification,
  InstrumentPosition,
  OracleSettlementTransaction,
  RegistryNotification,
} from '@castframework/models';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { errorAsString } from '../../utils/errorAsString';
import {
  contractNotificationSubscription,
  contractNotificationSubscriptionVariables,
  errorNotificationSubscription,
  errorNotificationSubscriptionVariables,
  GetInstrumentPositionsQuery,
  GetInstrumentPositionsQueryVariables,
  GetSettlementTransactionQuery,
  GetSettlementTransactionQueryVariables,
  GetSettlementTransactionsQuery,
  GetSettlementTransactionsQueryVariables,
  heartbeatNotificationSubscription,
  registryNotificationSubscription,
  registryNotificationSubscriptionVariables,
  contractNotification,
  errorNotification,
  heartbeatNotification,
  registryNotification,
  GetInstrumentPositions,
  GetSettlementTransaction,
  GetSettlementTransactions,
} from './generated/graphql';
import { ApolloClient, FetchResult } from '@apollo/client/core';
import { FioClientConfig } from './fioClient.config';
import { Observable, Subject } from 'rxjs';
import {
  extractGraphqlErrorMessageFromApolloError,
  getApolloClient,
  getSchema,
} from '../../shared/utils/oracleUtils';
import * as generatedSchema from './generated/schema.json';
import { query, subscribe } from '../../shared/utils/graphQLUtils';

@Injectable()
export class FioClientService implements OnModuleDestroy {
  private heartbeatCounter: number | null = null;
  private subscriptionClient: SubscriptionClient;
  private apolloClient: ApolloClient<any>;
  private logger: Logger = getLogger(this.constructor.name);
  private _promiseRegister: {
    [key: string]: Promise<any>;
  } = {};
  private _promiseResolver: {
    [key: string]: {
      resolve: (value: any) => any;
      reject: (reason: any) => any;
    };
  } = {};
  private errorNotifications = new Subject<ErrorNotification>();
  public contractNotifications = new Subject<ContractNotification>();
  private registryNotifications = new Subject<RegistryNotification>();
  private clientName = 'fio';

  private subscribed = false;
  public constructor(private readonly fioClientConfig: FioClientConfig) {
    const schema = getSchema(generatedSchema);
    const [client, subscriptionClient] = getApolloClient(
      {
        graphQlEndpoint: fioClientConfig.fioGraphQLEndpoint,
        graphQlSubscriptionEndpoint: fioClientConfig.fioGraphQLEndpoint,
      },
      schema,
      this.clientName + '-client',
    );

    this.apolloClient = client;
    this.subscriptionClient = subscriptionClient;

    this.setupSubscriptionClientEventHandlers();
  }

  public getErrorNotifications(): Observable<ErrorNotification> {
    return this.errorNotifications.asObservable();
  }
  public getContractNotifications(): Observable<ContractNotification> {
    return this.contractNotifications.asObservable();
  }
  public getRegistryNotifications(): Observable<RegistryNotification> {
    return this.registryNotifications.asObservable();
  }

  public async getInstrumentPositions(
    instrumentAddress: string,
    instrumentLedger: Ledger,
  ): Promise<InstrumentPosition[]> {
    const result = await query<
      GetInstrumentPositionsQuery,
      GetInstrumentPositionsQueryVariables
    >(
      {
        query: GetInstrumentPositions,
        variables: {
          ledger: instrumentLedger,
          instrumentAddress: instrumentAddress,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data.getInstrumentPositions as InstrumentPosition[];
  }

  public async getSettlementTransaction(
    id: string,
  ): Promise<OracleSettlementTransaction> {
    const result = await query<
      GetSettlementTransactionQuery,
      GetSettlementTransactionQueryVariables
    >(
      { query: GetSettlementTransaction, variables: { id } },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data.getSettlementTransaction as OracleSettlementTransaction;
  }
  public async getSettlementTransactions(): Promise<
    OracleSettlementTransaction[]
  > {
    const result = await query<
      GetSettlementTransactionsQuery,
      GetSettlementTransactionsQueryVariables
    >(
      { query: GetSettlementTransactions },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data
      .getSettlementTransactions as OracleSettlementTransaction[];
  }

  public onModuleDestroy(): void {
    this.logger.debug('Stopping FIO client service');
    this.apolloClient.stop();
    // this dirty trick is necessary because SubscriptionClient.close() does not work well when inside a reconnect loop
    // (as SubscriptionClient.client is null most of the time, the reconnect timeout is never cleared)
    (this.subscriptionClient as any).reconnect = false;
    this.subscriptionClient.close();
  }

  public getRegisteredPromise<T = any>(transactionHash: string): Promise<T> {
    this._promiseRegister[transactionHash] = new Promise((resolve, reject) => {
      this._promiseResolver[transactionHash] = {
        resolve,
        reject,
      };
    });

    return this._promiseRegister[transactionHash];
  }

  private graphQlErrorForwarder(e: any): void {
    const error = extractGraphqlErrorMessageFromApolloError(e);
    throw new Error(error);
  }

  private setupSubscriptionClientEventHandlers(): void {
    this.subscriptionClient.onConnected(() => {
      this.logger.debug('SubscriptionClient received Connected event');
      this.initReturnsCanal();
    });
    this.subscriptionClient.onConnecting(() =>
      this.logger.debug('SubscriptionClient received Connecting event'),
    );
    this.subscriptionClient.onDisconnected(() =>
      this.logger.debug('SubscriptionClient received Disconnected event'),
    );
    this.subscriptionClient.onReconnected(() => {
      this.logger.debug('SubscriptionClient received Reconnected event');
      this.initReturnsCanal();
    });
    this.subscriptionClient.onReconnecting(() =>
      this.logger.debug('SubscriptionClient received Reconnecting event'),
    );
    this.subscriptionClient.onError((err) =>
      this.logger.debug(
        `SubscriptionClient received Error event : error[${errorAsString(
          err.error,
        )}] message[${err.message}] type[${err.type}]`,
      ),
    );
  }

  private initReturnsCanal(): void {
    if (this.subscribed) return;
    this.subscribed = true;
    this.logger.debug('Subscribing to FIO events');

    subscribe<
      errorNotificationSubscription,
      errorNotificationSubscriptionVariables
    >(
      {
        query: errorNotification,
      },
      this.apolloClient,
      this.logger,
      this.clientName,
    ).subscribe(
      (error) => this.errorNotificationHandler(error),
      (error) => this.errorHandler(error),
    );

    subscribe<
      registryNotificationSubscription,
      registryNotificationSubscriptionVariables
    >(
      {
        query: registryNotification,
      },
      this.apolloClient,
      this.logger,
      this.clientName,
    ).subscribe(
      (event) => this.registryNotificationHandler(event),
      (error) => this.errorHandler(error),
    );

    subscribe<
      contractNotificationSubscription,
      contractNotificationSubscriptionVariables
    >(
      {
        query: contractNotification,
      },
      this.apolloClient,
      this.logger,
      this.clientName,
    ).subscribe(
      (event) => this.contractNotificationHandler(event),
      (error) => this.errorHandler(error),
    );

    this.apolloClient
      .subscribe({
        query: heartbeatNotification,
      })
      .subscribe(
        (event) => this.heartbeatNotificationHandler(event),
        (error) => this.errorHandler(error),
      );
  }

  private errorHandler = (error: any): void => {
    this.logger.error(`Subscribe error[${JSON.stringify(error)}]`);
  };

  private errorNotificationHandler(
    event: FetchResult<errorNotificationSubscription>,
  ): void {
    this.logger.debug(
      `errorNotificationHandler with event[${JSON.stringify(event)}]`,
    );
    if (event.data?.errorNotification) {
      const { transactionHash, message } = event.data.errorNotification;

      this.errorNotifications.next(
        new ErrorNotification(transactionHash as string, message as string),
      );

      this.logger.debug(
        `Received error for call [${transactionHash}] with message[${message}]`,
      );

      if (transactionHash && this._promiseRegister[transactionHash]) {
        this._promiseResolver[transactionHash].reject(message);
        delete this._promiseRegister[transactionHash];
        delete this._promiseResolver[transactionHash];
      }
    }
  }

  private heartbeatNotificationHandler = (
    event: FetchResult<heartbeatNotificationSubscription>,
  ): void => {
    if (event.data?.heartbeatNotification) {
      const { blockInfos, timestamp } = event.data.heartbeatNotification;

      if (
        this.heartbeatCounter === null ||
        this.heartbeatCounter >= this.fioClientConfig.heartbeatLogPeriod
      ) {
        this.logger.trace(`Received Heartbeat with timestamp[${timestamp}]`);
        for (const ledgerInfo of blockInfos) {
          this.logger.trace(
            `Received infos for ledger[${ledgerInfo.ledger}] blockNumber[${ledgerInfo.blockNumber}]`,
          );
        }
        this.heartbeatCounter = 0;
      } else {
        this.heartbeatCounter++;
      }
    }
  };

  private registryNotificationHandler = (
    event: FetchResult<registryNotificationSubscription>,
  ): void => {
    this.logger.debug(
      `registryNotificationHandler with event[${JSON.stringify(event)}]`,
    );
    const {
      transactionHash,
      instrumentAddress,
      notificationName,
      instrumentLedger,
    } = event.data?.registryNotification as RegistryNotification;

    this.registryNotifications.next(
      new RegistryNotification(
        notificationName,
        instrumentAddress,
        instrumentLedger,
        transactionHash,
      ),
    );

    this.logger.debug(
      `Received RegistryNotification for call [${transactionHash}]: ${JSON.stringify(
        event,
      )}`,
    );

    if (transactionHash && this._promiseResolver[transactionHash]) {
      this._promiseResolver[transactionHash].resolve(instrumentAddress);
      delete this._promiseRegister[transactionHash];
      delete this._promiseResolver[transactionHash];
    }
  };

  private contractNotificationHandler = async (
    event: FetchResult<contractNotificationSubscription>,
  ): Promise<void> => {
    this.logger.debug(
      `contractNotificationHandler with event[${JSON.stringify(event)}]`,
    );
    if (event.data?.contractNotification) {
      const {
        notificationName,
        transactionHash,
        instrumentAddress,
        lightSettlementTransactions,
        settlementTransactionOperationType,
      } = event.data.contractNotification;

      this.logger.debug(
        `Received Contract Notification [${notificationName}] for Instrument [${instrumentAddress}] with lightSettlementTransactions [${JSON.stringify(
          lightSettlementTransactions,
        )}]`,
      );

      this.contractNotifications.next(
        new ContractNotification(
          notificationName,
          instrumentAddress,
          transactionHash || 'no transactionHash',
          lightSettlementTransactions,
          settlementTransactionOperationType,
        ),
      );

      if (transactionHash && this._promiseResolver[transactionHash]) {
        this._promiseResolver[transactionHash].resolve(true);
        delete this._promiseRegister[transactionHash];
        delete this._promiseResolver[transactionHash];
      }
    }
  };
}
