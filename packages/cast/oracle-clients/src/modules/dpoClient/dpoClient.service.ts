import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ContractNotification,
  ErrorNotification,
  RegistryNotification,
  DataProviderNotification,
} from '@castframework/models';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { errorAsString } from '../../utils/errorAsString';
import {
  errorNotificationSubscription,
  errorNotificationSubscriptionVariables,
  errorNotification,
  dpoNotification,
  testQuery,
  dpoNotificationSubscription,
  dpoNotificationSubscriptionVariables,
} from './generated/graphql';
import { ApolloClient, FetchResult } from '@apollo/client/core';
import { DpoClientConfig } from './dpoClient.config';
import { Observable, Subject } from 'rxjs';
import {
  extractGraphqlErrorMessageFromApolloError,
  getApolloClient,
  getSchema,
} from '../../shared/utils/oracleUtils';
import * as generatedSchema from './generated/schema.json';
import { query, subscribe } from '../../shared/utils/graphQLUtils';
@Injectable()
export class DpoClientService implements OnModuleDestroy {
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
  private dpoNotifications = new Subject<DataProviderNotification>();
  private contractNotifications = new Subject<ContractNotification>();
  private registryNotifications = new Subject<RegistryNotification>();
  private clientName = 'dpo';

  private subscribed = false;

  public constructor(private readonly dpoClientConfig: DpoClientConfig) {
    const schema = getSchema(generatedSchema);
    const [client, subscriptionClient] = getApolloClient(
      {
        graphQlEndpoint: dpoClientConfig.dpoGraphQLEndpoint,
        graphQlSubscriptionEndpoint: dpoClientConfig.dpoGraphQLEndpoint,
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

  public getDpoNotifications(): Observable<DataProviderNotification> {
    return this.dpoNotifications.asObservable();
  }

  public getContractNotifications(): Observable<ContractNotification> {
    return this.contractNotifications.asObservable();
  }

  public getRegistryNotifications(): Observable<RegistryNotification> {
    return this.registryNotifications.asObservable();
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

  public onModuleDestroy(): void {
    this.logger.debug('Stopping DPO client service');
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
    this.logger.debug('Subscribing to DPO events');

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
      dpoNotificationSubscription,
      dpoNotificationSubscriptionVariables
    >(
      {
        query: dpoNotification,
      },
      this.apolloClient,
      this.logger,
      this.clientName,
    ).subscribe(
      (event) => this.dpoNotificationHandler(event),
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

  private dpoNotificationHandler = async (
    event: FetchResult<dpoNotificationSubscription>,
  ): Promise<void> => {
    this.logger.debug(
      `dpoNotificationHandler with event[${JSON.stringify(event)}]`,
    );
    if (event.data?.dpoNotification) {
      const { transactionHash } = event.data.dpoNotification;
      this.logger.debug(
        `Received DPO notification with transaction hash [${transactionHash}]`,
      );

      if (transactionHash && this._promiseResolver[transactionHash]) {
        this._promiseResolver[transactionHash].resolve(true);
        delete this._promiseRegister[transactionHash];
        delete this._promiseResolver[transactionHash];
      }
    }
  };
}
