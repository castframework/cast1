import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  errorAsString,
  graphqlErrorsAsString,
} from '../../utils/errorAsString';
import {
  ConfirmPaymentReceived,
  ConfirmPaymentReceivedMutation,
  ConfirmPaymentReceivedMutationVariables,
  ConfirmPaymentTransferred,
  ConfirmPaymentTransferredMutation,
  ConfirmPaymentTransferredMutationVariables,
  contractNotification,
  contractNotificationSubscription,
  contractNotificationSubscriptionVariables,
  errorNotification,
  errorNotificationSubscription,
  errorNotificationSubscriptionVariables,
  GetSettlementTransaction,
  GetSettlementTransactionQuery,
  GetSettlementTransactionQueryVariables,
  GetSettlementTransactionsByPaymentReference,
  GetSettlementTransactionsByPaymentReferenceQuery,
  GetSettlementTransactionsByPaymentReferenceQueryVariables,
  heartbeatNotification,
  heartbeatNotificationSubscription,
} from './generated/graphql';
import { ApolloClient, FetchResult } from '@apollo/client/core';
import { FsoClientConfig } from './fsoClient.config';
import {
  ContractNotification,
  ErrorNotification,
  OracleSettlementTransaction,
  RegistryNotification,
} from '@castframework/models';
import { Observable, Subject } from 'rxjs';
import {
  extractGraphqlErrorMessageFromApolloError,
  getApolloClient,
  getSchema,
} from '../../shared/utils/oracleUtils';
import * as generatedSchema from './generated/schema.json';
import { mutate, query, subscribe } from '../../shared/utils/graphQLUtils';

@Injectable()
export class FsoClientService implements OnModuleDestroy {
  private heartbeatCounter: number | null = null;
  private subscriptionClient: SubscriptionClient;
  private apolloClient: ApolloClient<any>;
  private logger: Logger = getLogger(this.constructor.name);
  private clientName = 'fso';
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
  private contractNotifications = new Subject<ContractNotification>();
  private registryNotifications = new Subject<RegistryNotification>(); // Not implemented

  private subscribed = false;

  public constructor(private readonly fsoClientConfig: FsoClientConfig) {
    const schema = getSchema(generatedSchema);
    const [client, subscriptionClient] = getApolloClient(
      {
        graphQlEndpoint: fsoClientConfig.fsoGraphQLEndpoint,
        graphQlSubscriptionEndpoint: fsoClientConfig.fsoGraphQLEndpoint,
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

  public async confirmPaymentReceived(
    paymentReference: string,
  ): Promise<string[]> {
    const response = await mutate<
      ConfirmPaymentReceivedMutation,
      ConfirmPaymentReceivedMutationVariables
    >(
      {
        mutation: ConfirmPaymentReceived,
        variables: {
          paymentReference,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    if (
      response?.data?.confirmPaymentReceived === null ||
      response?.data?.confirmPaymentReceived === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on confirmPaymentReceived call',
      );
    }

    const transactionHashes = response.data.confirmPaymentReceived;

    await Promise.all(
      transactionHashes.map((transactionHash) =>
        this.getRegisteredPromise(transactionHash),
      ),
    );

    return transactionHashes;
  }

  public async confirmPaymentTransferred(
    paymentReference: string,
  ): Promise<string[]> {
    const response = await mutate<
      ConfirmPaymentTransferredMutation,
      ConfirmPaymentTransferredMutationVariables
    >(
      {
        mutation: ConfirmPaymentTransferred,
        variables: {
          paymentReference,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    if (
      response?.data?.confirmPaymentTransferred === null ||
      response?.data?.confirmPaymentTransferred === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on confirmPaymentTransferred call',
      );
    }

    const transactionHashes = response.data.confirmPaymentTransferred;

    await Promise.all(
      transactionHashes.map((transactionHash) =>
        this.getRegisteredPromise(transactionHash),
      ),
    );

    return transactionHashes;
  }

  public async getSettlementTransaction(
    id: string,
  ): Promise<OracleSettlementTransaction> {
    const settlementTransaction = await query<
      GetSettlementTransactionQuery,
      GetSettlementTransactionQueryVariables
    >(
      {
        query: GetSettlementTransaction,
        variables: {
          id,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    this.logger.debug(JSON.stringify(settlementTransaction));

    return settlementTransaction.data
      .getSettlementTransaction as OracleSettlementTransaction;
  }

  public async getSettlementTransactionsByPaymentReference(
    paymentReference?: string | undefined,
  ): Promise<OracleSettlementTransaction[] | undefined> {
    const result = await query<
      GetSettlementTransactionsByPaymentReferenceQuery,
      GetSettlementTransactionsByPaymentReferenceQueryVariables
    >(
      {
        query: GetSettlementTransactionsByPaymentReference,
        variables: {
          paymentReference,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data
      .getSettlementTransactionsByPaymentReference as OracleSettlementTransaction[];
  }

  private initReturnsCanal(): void {
    if (this.subscribed) return;
    this.subscribed = true;
    this.logger.debug('Subscribing to FSO events');

    {
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
    }

    {
      subscribe(
        {
          query: heartbeatNotification,
        },
        this.apolloClient,
        this.logger,
        this.clientName,
      ).subscribe(
        (event) => this.heartbeatNotificationHandler(event),
        (error) => this.errorHandler(error),
      );
    }

    {
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
    }
  }

  private errorNotificationHandler(
    event: FetchResult<errorNotificationSubscription>,
  ): void {
    this.logger.debug(
      `errorNotificationHandler with event[${JSON.stringify(event)}]`,
    );
    if (event.data?.errorNotification) {
      const { transactionHash, message } = event.data.errorNotification;
      this.logger.debug(
        `Received error for call [${transactionHash}] with message[${message}]`,
      );

      this.errorNotifications.next(
        new ErrorNotification(
          transactionHash || 'No transactionHash',
          errorAsString(message),
        ),
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
        this.heartbeatCounter >= this.fsoClientConfig.heartbeatLogPeriod
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
      } = event.data.contractNotification as ContractNotification;

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

  private errorHandler = (error: any): void => {
    this.logger.error(`Subscribe error[${JSON.stringify(error)}]`);
  };

  public onModuleDestroy(): void {
    this.logger.debug('Stopping FSO client service');
    this.apolloClient.stop();
    // this dirty trick is necessary because SubscriptionClient.close() does not work well when inside a reconnect loop
    // (as SubscriptionClient.client is null most of the time, the reconnect timeout is never cleared)
    (this.subscriptionClient as any).reconnect = false;
    this.subscriptionClient.close();
  }

  public getRegisteredPromise<T = any>(
    transactionHash: string,
  ): {
    transactionHash: string;
    promise: Promise<T>;
  } {
    this._promiseRegister[transactionHash] = new Promise((resolve, reject) => {
      this._promiseResolver[transactionHash] = {
        resolve,
        reject,
      };
    });

    return { transactionHash, promise: this._promiseRegister[transactionHash] };
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
}
