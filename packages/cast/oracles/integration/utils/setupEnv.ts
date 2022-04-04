import * as getPort from 'get-port';
import { randomDbEnv } from './envTemplates';
import { createDb, deleteDb } from './db';
import { getLogger } from 'log4js';
import { initTestFactory } from './initTestFactory';
import { Mode } from '../../src/mode';
import {
  FroClientConfig,
  FroClientService,
  FsoClientConfig,
  FsoClientService,
} from '@castframework/oracle-clients';
import { configureLogger } from '../../src/utils/logger';
import { map, scan, shareReplay, startWith } from 'rxjs/operators';
import { DeepPartial, Env, NumberOfExpectedEvent } from '../oracle/types';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { buildNotificationFilter } from '../oracle/helpers/expectEvent';
import {
  ContractNotification,
  ErrorNotification,
  RegistryNotification,
} from '@castframework/models';
import { ethPrivateKeys, tezosPrivateKeys } from './businessFixtures';

export type EnvParams = {
  name: string;
};

export type Match<
  NotificationType extends
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
> = {
  receivedNotifications?: NotificationType[] | null;
  expectedNotification?: DeepPartial<
    NotificationType & NumberOfExpectedEvent
  > | null;
};

export function generateNotificationFeeds<
  NotificationType extends
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
>(
  allNotifications: Observable<NotificationType>,
): {
  awaitingNotificationsSubject: Subject<
    DeepPartial<NotificationType & NumberOfExpectedEvent>
  >;
  notificationsMatches: Observable<Match<NotificationType>[]>;
  subscription: Subscription;
} {
  const logger = getLogger('generateNotificationFeeds');
  const awaitingNotificationsSubject = new Subject<
    DeepPartial<NotificationType & NumberOfExpectedEvent>
  >();

  const awaitingNotifications = awaitingNotificationsSubject.pipe(
    scan(
      (notifications, notification) => [...notifications, notification],
      [] as DeepPartial<NotificationType & NumberOfExpectedEvent>[],
    ),
    startWith([] as DeepPartial<NotificationType & NumberOfExpectedEvent>[]),
  );

  const accumulatedNotifications = allNotifications.pipe(
    scan(
      (notifications, notification) => [...notifications, notification],
      [] as NotificationType[],
    ),
    startWith([] as NotificationType[]),
  );

  const notificationsMatches: Observable<Match<NotificationType>[]> =
    combineLatest([accumulatedNotifications, awaitingNotifications]).pipe(
      map(([notifications, awaitingNotifications]) => {
        const matches: Match<NotificationType>[] = [];

        awaitingNotifications.forEach((expectedNotification) => {
          const notificationFilter =
            buildNotificationFilter(expectedNotification);

          const matchingNotifications =
            notifications.filter(notificationFilter);

          matches.push({
            expectedNotification,
            receivedNotifications: matchingNotifications,
          });
        });

        const matchedNotifications = matches
          .map((match) => match.receivedNotifications)
          .flat();

        const untreatedNotifications = notifications.filter(
          (notification) => !matchedNotifications.includes(notification),
        );

        untreatedNotifications.forEach((untreatedNotification) => {
          matches.push({
            expectedNotification: null,
            receivedNotifications: [untreatedNotification],
          });
        });

        return matches;
      }),
      shareReplay(1),
    );

  const subscription = notificationsMatches.subscribe();

  return {
    awaitingNotificationsSubject,
    notificationsMatches,
    subscription,
  };
}

export async function setupEnv(params: EnvParams): Promise<Env> {
  configureLogger();
  const logger = getLogger(params.name);

  const FRO_PORT = await getPort({ port: 6660 });
  const STR_PORT = await getPort({ port: 6661 });
  const FSO_PORT = await getPort({ port: 6662 });
  const FIO1_PORT = await getPort({ port: 6663 });
  const FIO2_PORT = await getPort({ port: 6663 });
  const FIO3_PORT = await getPort({ port: 6667 });

  const dbName = randomDbEnv(
    {
      fsoPort: FSO_PORT,
      strPort: STR_PORT,
      froPort: FRO_PORT,
      fio1Port: FIO1_PORT,
      fio2Port: FIO2_PORT,
    },
    params.name,
  );
  logger.info(`Creating db: ${dbName}`);
  await createDb(dbName);

  logger.info(`Created db: ${dbName}`);

  logger.info(`Starting fro server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['REGISTRAR'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['REGISTRAR'];
  const froServer = await initTestFactory([Mode.FRO], FRO_PORT);

  logger.info(`Starting str server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['STR'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['STR'];
  const strServer = await initTestFactory([Mode.STR], STR_PORT);

  logger.info(`Starting fso server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['SETTLEMENT_AGENT'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['SETTLEMENT_AGENT'];
  const fsoServer = await initTestFactory([Mode.FSO], FSO_PORT);

  logger.info(`Starting fio1 server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['DEALER_1'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['DEALER_1'];
  const fio1Server = await initTestFactory([Mode.FIO], FIO1_PORT);

  logger.info(`Starting fio2 server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['DEALER_2'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['DEALER_2'];
  const fio2Server = await initTestFactory([Mode.FIO], FIO2_PORT);

  logger.info(`Starting fio3 server`);
  process.env['ETH_PRIVATE_KEY'] = ethPrivateKeys['ISSUER_1'];
  process.env['TZ_PRIVATE_KEY'] = tezosPrivateKeys['ISSUER_1'];
  const fio3Server = await initTestFactory([Mode.FIO], FIO3_PORT);

  const froClientConfig: FroClientConfig = {
    froGraphQLEndpoint: `http://localhost:${FRO_PORT}/graphql`,
    heartbeatLogPeriod: 100,
  };
  const fsoClientConfig: FsoClientConfig = {
    fsoGraphQLEndpoint: `http://localhost:${FSO_PORT}/graphql`,
    heartbeatLogPeriod: 100,
  };

  const froClient = new FroClientService(froClientConfig);
  const fsoClient = new FsoClientService(fsoClientConfig);

  const env: Env = {
    name: params.name,
    dbName: dbName,
    logger,
    froClient,
    fsoClient,
    froServer,
    strServer,
    fsoServer,
    fio1Server,
    fio2Server,
    fio3Server,
    awaitingFroErrorNotificationsSubject: null,
    froErrorNotificationsMatches: null,
    awaitingFroContractNotificationsSubject: null,
    froContractNotificationsMatches: null,
    awaitingFroRegistryNotificationsSubject: null,
    froRegistryNotificationsMatches: null,
    awaitingFsoContractNotificationsSubject: null,
    fsoContractNotificationsMatches: null,
    awaitingFsoErrorNotificationsSubject: null,
    fsoErrorNotificationsMatches: null,
    contractNotificationsSubscriptions: [],
  };

  initNotificationFeeds(env);

  return env;
}

export function initNotificationFeeds(env: Env) {
  const logger = getLogger('initNotificationFeeds');
  env.contractNotificationsSubscriptions.forEach((subscription) =>
    subscription.unsubscribe(),
  );

  const {
    awaitingNotificationsSubject: awaitingFroErrorNotificationsSubject,
    notificationsMatches: froErrorNotificationsMatches,
    subscription: froErrorNotificationsSubscription,
  } = generateNotificationFeeds(env.froClient.getErrorNotifications());

  const {
    awaitingNotificationsSubject: awaitingFroContractNotificationsSubject,
    notificationsMatches: froContractNotificationsMatches,
    subscription: froContractNotificationsSubscription,
  } = generateNotificationFeeds(env.froClient.getContractNotifications());

  const {
    awaitingNotificationsSubject: awaitingFroRegistryNotificationsSubject,
    notificationsMatches: froRegistryNotificationsMatches,
    subscription: froRegistryNotificationsSubscription,
  } = generateNotificationFeeds(env.froClient.getRegistryNotifications());

  const {
    awaitingNotificationsSubject: awaitingFsoContractNotificationsSubject,
    notificationsMatches: fsoContractNotificationsMatches,
    subscription: fsoContractNotificationsSubscription,
  } = generateNotificationFeeds(env.fsoClient.getContractNotifications());

  const {
    awaitingNotificationsSubject: awaitingFsoErrorNotificationsSubject,
    notificationsMatches: fsoErrorNotificationsMatches,
    subscription: fsoErrorNotificationsSubscription,
  } = generateNotificationFeeds(env.fsoClient.getErrorNotifications());

  env.awaitingFroErrorNotificationsSubject =
    awaitingFroErrorNotificationsSubject;
  env.froErrorNotificationsMatches = froErrorNotificationsMatches;
  env.awaitingFroContractNotificationsSubject =
    awaitingFroContractNotificationsSubject;
  env.froContractNotificationsMatches = froContractNotificationsMatches;
  env.awaitingFroRegistryNotificationsSubject =
    awaitingFroRegistryNotificationsSubject;
  env.froRegistryNotificationsMatches = froRegistryNotificationsMatches;
  env.awaitingFsoContractNotificationsSubject =
    awaitingFsoContractNotificationsSubject;
  env.fsoContractNotificationsMatches = fsoContractNotificationsMatches;
  env.awaitingFsoErrorNotificationsSubject =
    awaitingFsoErrorNotificationsSubject;
  env.fsoErrorNotificationsMatches = fsoErrorNotificationsMatches;
  env.contractNotificationsSubscriptions = [
    froErrorNotificationsSubscription,
    froContractNotificationsSubscription,
    froRegistryNotificationsSubscription,
    fsoContractNotificationsSubscription,
    fsoErrorNotificationsSubscription,
  ];
}

export async function shutdownEnv(env: Env): Promise<void> {
  env.logger.info(`Shutdown environment ${env.name}`);

  env.logger.info(`Shutdown fro client`);
  await env.froClient.onModuleDestroy();

  env.logger.info(`Shutdown fso client`);
  await env.fsoClient.onModuleDestroy();

  env.logger.info(`Shutdown fio1 server`);
  await env.fio1Server.close();

  env.logger.info(`Shutdown fio2 server`);
  await env.fio2Server.close();

  env.logger.info(`Shutdown fio3 server`);
  await env.fio3Server.close();

  env.logger.info(`Shutdown fso server`);
  await env.fsoServer.close();

  env.logger.info(`Shutdown fro server`);
  await env.froServer.close();

  env.logger.info(`Shutdown str server`);
  await env.strServer.close();

  env.logger.info(`Delete database`);
  await deleteDb(env.dbName);

  env.logger.info(`Shutdown finished`);
}
