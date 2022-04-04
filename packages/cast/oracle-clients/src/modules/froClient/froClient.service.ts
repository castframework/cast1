import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Ledger,
  ContractNotification,
  CreateBondInput,
  CreateEMTNInput,
  ErrorNotification,
  InitiateSubscriptionInput,
  InitiateRedemptionInput,
  InstrumentPosition,
  OracleSettlementTransaction,
  RegistryNotification,
} from '@castframework/models';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import {
  errorAsString,
  graphqlErrorsAsString,
} from '../../utils/errorAsString';
import {
  contractNotificationSubscription,
  contractNotificationSubscriptionVariables,
  CreateBondMutation,
  CreateBondMutationVariables,
  CreateEMTNMutation,
  CreateEMTNMutationVariables,
  errorNotificationSubscription,
  errorNotificationSubscriptionVariables,
  GetInstrumentDetailsQuery,
  GetInstrumentDetailsQueryVariables,
  GetInstrumentPositionsQuery,
  GetInstrumentPositionsQueryVariables,
  GetSettlementTransactionsQuery,
  GetSettlementTransactionsQueryVariables,
  GetTransactionInfoQuery,
  GetTransactionInfoQueryVariables,
  InitiateRedemptionMutation,
  InitiateRedemptionMutationVariables,
  InitiateSubscriptionMutation,
  InitiateSubscriptionMutationVariables,
  InitiateTradeInput,
  InitiateTradeMutation,
  InitiateTradeMutationVariables,
  registryNotificationSubscription,
  registryNotificationSubscriptionVariables,
  CreateBond,
  CreateEMTN,
  InitiateRedemption,
  InitiateSubscription,
  InitiateTrade,
  errorNotification,
  registryNotification,
  contractNotification,
  GetInstrumentPositions,
  GetSettlementTransactions,
  GetTransactionInfo,
  GetInstrumentDetails,
  testQuery,
  CancelSettlementTransactionInput,
  CancelSettlementTransactionMutation,
  CancelSettlementTransactionMutationVariables,
  CancelSettlementTransaction,
} from './generated/graphql';
import { ApolloClient, FetchResult } from '@apollo/client/core';
import { FroClientConfig } from './froClient.config';
import { Observable, Subject } from 'rxjs';
import { RegistryNotificationName } from '../../shared/env-constant/notificationNames';
import {
  extractGraphqlErrorMessageFromApolloError,
  getApolloClient,
  getSchema,
} from '../../shared/utils/oracleUtils';
import * as generatedSchema from './generated/schema.json';

import {
  heartbeatNotification,
  heartbeatNotificationSubscription,
} from '../fioClient/generated/graphql';
import { mutate, query, subscribe } from '../../shared/utils/graphQLUtils';
@Injectable()
export class FroClientService implements OnModuleDestroy {
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
  private contractNotifications = new Subject<ContractNotification>();
  private registryNotifications = new Subject<RegistryNotification>();
  private clientName = 'fro';

  private subscribed = false;

  public constructor(private readonly froClientConfig: FroClientConfig) {
    const schema = getSchema(generatedSchema);
    const [client, subscriptionClient] = getApolloClient(
      {
        graphQlEndpoint: froClientConfig.froGraphQLEndpoint,
        graphQlSubscriptionEndpoint: froClientConfig.froGraphQLEndpoint,
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

  public async createBond(bond: CreateBondInput): Promise<{
    instrumentAddress: string;
    transactionHash: string;
  }> {
    const logger = getLogger(this.constructor.name, 'createBond');

    logger.debug(`Requesting FRO to create bond`, JSON.stringify(bond));

    const response = await mutate<
      CreateBondMutation,
      CreateBondMutationVariables
    >(
      {
        mutation: CreateBond,
        variables: {
          bond,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.createBond === null ||
      response?.data?.createBond === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on createBond call',
      );
    }

    const transactionHash = response.data.createBond;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    const instrumentAddress = await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received confirmation for transactionHash ${transactionHash}.`,
    );

    return {
      instrumentAddress,
      transactionHash,
    };
  }

  public async createEMTN(emtn: CreateEMTNInput): Promise<{
    instrumentAddress: string;
    transactionHash: string;
  }> {
    const logger = getLogger(this.constructor.name, 'createEMTN');

    logger.debug(`Requesting FRO to create EMTN`, JSON.stringify(emtn));

    const response = await mutate<
      CreateEMTNMutation,
      CreateEMTNMutationVariables
    >(
      {
        mutation: CreateEMTN,
        variables: {
          EMTN: emtn,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.createEMTN === null ||
      response?.data?.createEMTN === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on createEMTN call',
      );
    }

    const transactionHash = response.data.createEMTN;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    const instrumentAddress = await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received confirmation for transactionHash ${transactionHash}.`,
    );

    return {
      instrumentAddress,
      transactionHash,
    };
  }

  public async getInstrumentDetails(
    instrumentAddress: string,
    instrumentLedger: Ledger,
  ): Promise<GetInstrumentDetailsQuery['getInstrumentDetails']> {
    const result = await query<
      GetInstrumentDetailsQuery,
      GetInstrumentDetailsQueryVariables
    >(
      {
        query: GetInstrumentDetails,
        variables: {
          instrumentLedger: instrumentLedger,
          instrumentAddress: instrumentAddress,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data.getInstrumentDetails;
  }

  public async getTransactionInfo(
    ledger: Ledger,
    transactionId: string,
  ): Promise<GetTransactionInfoQuery['getTransactionInfo']> {
    const result = await query<
      GetTransactionInfoQuery,
      GetTransactionInfoQueryVariables
    >(
      {
        query: GetTransactionInfo,
        variables: {
          ledger: ledger,
          transactionId: transactionId,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data.getTransactionInfo;
  }

  public async initiateSubscription(
    initiateSubscriptionInput: InitiateSubscriptionInput,
  ): Promise<string> {
    const logger = getLogger(this.constructor.name, 'initiateSubscription');

    logger.debug(
      `Requesting FRO to initiate subscription`,
      JSON.stringify(initiateSubscriptionInput),
    );

    const response = await mutate<
      InitiateSubscriptionMutation,
      InitiateSubscriptionMutationVariables
    >(
      {
        mutation: InitiateSubscription,
        variables: {
          initiateSubscriptionInput: initiateSubscriptionInput,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.initiateSubscription === null ||
      response?.data?.initiateSubscription === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on initiateSubscription call',
      );
    }

    const transactionHash = response.data.initiateSubscription;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received confirmation for transactionHash ${transactionHash}.`,
    );

    return transactionHash;
  }

  public async initiateRedemption(
    initiateRedemptionInput: InitiateRedemptionInput,
  ): Promise<string> {
    const logger = getLogger(this.constructor.name, 'initiateRedemption');

    logger.debug(
      `Requesting FRO to initiate redemption`,
      JSON.stringify(initiateRedemptionInput),
    );

    const response = await mutate<
      InitiateRedemptionMutation,
      InitiateRedemptionMutationVariables
    >(
      {
        mutation: InitiateRedemption,
        variables: {
          initiateRedemptionInput: initiateRedemptionInput,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );
    
    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.initiateRedemption === null ||
      response?.data?.initiateRedemption === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on createSubscription call',
      );
    }

    const transactionHash = response.data.initiateRedemption;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    return transactionHash;
  }

  public async initiateTrade(
    initiateTradeInput: InitiateTradeInput,
  ): Promise<string> {
    const logger = getLogger(this.constructor.name, 'initiateTrade');

    logger.debug(
      `Requesting FRO to initiate trade`,
      JSON.stringify(initiateTradeInput),
    );

    const response = await mutate<
      InitiateTradeMutation,
      InitiateTradeMutationVariables
    >(
      {
        mutation: InitiateTrade,
        variables: {
          initiateTradeInput: initiateTradeInput,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.initiateTrade === null ||
      response?.data?.initiateTrade === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on initiateTrade call',
      );
    }

    const transactionHash = response.data.initiateTrade;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received confirmation for transactionHash ${transactionHash}.`,
    );

    return transactionHash;
  }

  public async cancelSettlementTransaction(
    cancelSettlementTransactionInput: CancelSettlementTransactionInput,
  ): Promise<string> {
    const logger = getLogger(
      this.constructor.name,
      'cancelSettlementTransaction',
    );

    logger.debug(
      `Requesting FRO to cancel Settlement Transaction`,
      JSON.stringify(cancelSettlementTransactionInput),
    );

    const response = await mutate<
      CancelSettlementTransactionMutation,
      CancelSettlementTransactionMutationVariables
    >(
      {
        mutation: CancelSettlementTransaction,
        variables: {
          cancelSettlementTransactionInput: cancelSettlementTransactionInput,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    logger.debug(`Response from FRO`, JSON.stringify(response));

    if (
      response?.data?.cancelSettlementTransaction === null ||
      response?.data?.cancelSettlementTransaction === undefined
    ) {
      throw new Error(
        response?.errors
          ? graphqlErrorsAsString(response.errors)
          : 'Bad response from FRO on cancelSettlementTransaction call',
      );
    }

    const transactionHash = response.data.cancelSettlementTransaction;

    logger.debug(
      `Received transactionHash ${transactionHash}. Waiting for confirmation`,
    );

    await this.getRegisteredPromise(transactionHash);

    logger.debug(
      `Received confirmation for transactionHash ${transactionHash}.`,
    );

    return transactionHash;
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

  public async test(): Promise<string> {
    const result = await query(
      {
        query: testQuery,
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    return result.data.test;
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
    this.logger.debug('Stopping FRO client service');
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
    this.logger.debug('Subscribing to FRO events');

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
      this.logger.debug(
        `Received error with transaction hash [${transactionHash}] with message[${message}]`,
      );

      this.errorNotifications.next(
        new ErrorNotification(transactionHash, errorAsString(message)),
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
        this.heartbeatCounter >= this.froClientConfig.heartbeatLogPeriod
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
      instrumentLedger,
      notificationName,
    } = event.data?.registryNotification as RegistryNotification;

    this.logger.debug(
      `Received RegistryNotification with transaction hash [${transactionHash}]: ${JSON.stringify(
        event,
      )}`,
    );

    this.registryNotifications.next(
      new RegistryNotification(
        notificationName as RegistryNotificationName,
        instrumentAddress,
        instrumentLedger,
        transactionHash,
      ),
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
