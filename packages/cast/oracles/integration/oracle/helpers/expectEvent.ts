import { DeepPartial, Env, NumberOfExpectedEvent } from '../types';
import { filter, map, take } from 'rxjs/operators';
import {
  ContractNotification,
  ErrorNotification,
  isContractNotification,
  isErrorNotification,
  isRegistryNotification,
  RegistryNotification,
} from '@castframework/models';

export function buildNotificationFilter<
  NotificationType =
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
>(
  notification: DeepPartial<NotificationType & NumberOfExpectedEvent>,
): (notification: NotificationType) => boolean {
  if (isRegistryNotification(notification)) {
    return buildRegistryNotificationFilter(notification);
  }

  if (isContractNotification(notification)) {
    return buildContractNotificationFilter(notification);
  }

  if (isErrorNotification(notification)) {
    return buildErrorNotificationFilter(notification);
  }

  throw new Error(
    `Notification has an unknown type: ${JSON.stringify(notification)}`,
  );
}

export function buildErrorNotificationFilter<
  NotificationType =
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
>(
  notification: Partial<ErrorNotification>,
): (notification: NotificationType) => boolean {
  return (notif: NotificationType) => {
    if (!isErrorNotification(notif)) {
      return false;
    }
    if (
      notification.notificationName &&
      notification.notificationName !== notif.notificationName
    ) {
      return false;
    }

    if (
      notification.transactionHash !== undefined &&
      notification.transactionHash !== notif.transactionHash
    ) {
      return false;
    }

    if (
      notification.message !== undefined &&
      notification.message !== notif.message
    ) {
      return false;
    }

    return true;
  };
}

export function buildRegistryNotificationFilter<
  NotificationType =
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
>(
  notification: Partial<RegistryNotification>,
): (notification: NotificationType) => boolean {
  return (notif: NotificationType) => {
    if (!isRegistryNotification(notif)) {
      return false;
    }
    if (
      notification.notificationName &&
      notification.notificationName !== notif.notificationName
    ) {
      return false;
    }

    if (
      notification.transactionHash !== undefined &&
      notification.transactionHash !== notif.transactionHash
    ) {
      return false;
    }

    if (
      notification.instrumentAddress &&
      notification.instrumentAddress !== notif.instrumentAddress
    ) {
      return false;
    }

    return true;
  };
}

export function buildContractNotificationFilter<
  NotificationType =
    | ContractNotification
    | RegistryNotification
    | ErrorNotification,
>(
  notification: DeepPartial<ContractNotification>,
): (notification: NotificationType) => boolean {
  return (notif: NotificationType) => {
    if (!isContractNotification(notif)) {
      return false;
    }

    if (
      notification.notificationName &&
      notification.notificationName !== notif.notificationName
    ) {
      return false;
    }

    if (
      notification.lightSettlementTransactions &&
      !notif.lightSettlementTransactions.some((lightstx) =>
        notification.lightSettlementTransactions?.some(
          (lightSettlementTransactions) => {
            if (
              lightSettlementTransactions?.id &&
              lightSettlementTransactions?.id !== lightstx.id
            ) {
              return false;
            }
            if (
              lightSettlementTransactions?.participantAccountNumbers &&
              (lightSettlementTransactions?.participantAccountNumbers?.securityDeliverer?.toLowerCase() !==
                lightstx.participantAccountNumbers?.securityDeliverer?.toLowerCase() ||
                lightSettlementTransactions?.participantAccountNumbers?.securityReceiver?.toLowerCase() !==
                  lightstx.participantAccountNumbers.securityReceiver?.toLowerCase() ||
                lightSettlementTransactions?.participantAccountNumbers?.settler?.toLowerCase() !==
                  lightstx.participantAccountNumbers?.settler?.toLowerCase() ||
                lightSettlementTransactions?.participantAccountNumbers?.registrar?.toLowerCase() !==
                  lightstx.participantAccountNumbers.registrar.toLowerCase() ||
                lightSettlementTransactions?.participantAccountNumbers?.securityIssuer?.toLowerCase() !==
                  lightstx.participantAccountNumbers.securityIssuer.toLowerCase())
            ) {
              return false;
            }

            return true;
          },
        ),
      )
    ) {
      return false;
    }

    if (
      notification.transactionHash !== undefined &&
      notification.transactionHash !== notif.transactionHash
    ) {
      return false;
    }

    if (
      notification.instrumentAddress &&
      notification.instrumentAddress !== notif.instrumentAddress
    ) {
      return false;
    }

    if (
      notification.settlementTransactionOperationType !== undefined &&
      notification.settlementTransactionOperationType !==
        notif.settlementTransactionOperationType
    ) {
      return false;
    }

    return true;
  };
}

export async function expectFroContractNotification(
  env: Env,
  expectedNotification: DeepPartial<ContractNotification>,
  numberOfExpectedEvent = 1,
): Promise<ContractNotification[] | null | undefined> {
  const expected = {
    ...expectedNotification,
    numberOfExpectedEvent,
  };
  env.awaitingFroContractNotificationsSubject?.next(expected);

  return env.froContractNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.find((match) => match.expectedNotification === expected),
      ),
      filter(
        (value) =>
          !!value &&
          (value.receivedNotifications?.length || 0) >= numberOfExpectedEvent,
      ),
      map((value) => value?.receivedNotifications),
      take(1),
    )
    .toPromise();
}

export async function expectFroRegistryNotification(
  env: Env,
  expectedNotification: Partial<RegistryNotification>,
  numberOfExpectedEvent = 1,
): Promise<RegistryNotification[] | null | undefined> {
  const expected = {
    ...expectedNotification,
    numberOfExpectedEvent,
  };
  env.awaitingFroRegistryNotificationsSubject?.next(expected);

  const notif = await env.froRegistryNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.find((match) => match.expectedNotification === expected),
      ),
      filter(
        (value) =>
          !!value &&
          (value.receivedNotifications?.length || 0) >= numberOfExpectedEvent,
      ),
      map((value) => value?.receivedNotifications),
      take(1),
    )
    .toPromise();

  return notif;
}

export async function expectFroErrorNotification(
  env: Env,
  expectedNotification: Partial<ErrorNotification>,
  numberOfExpectedEvent = 1,
): Promise<ErrorNotification[] | null | undefined> {
  const expected = {
    ...expectedNotification,
    numberOfExpectedEvent,
  };
  env.awaitingFroErrorNotificationsSubject?.next(expected);

  const notification = await env.froErrorNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.find((match) => match.expectedNotification === expected),
      ),
      filter(
        (value) =>
          !!value &&
          (value.receivedNotifications?.length || 0) >= numberOfExpectedEvent,
      ),
      map((value) => value?.receivedNotifications),
      take(1),
    )
    .toPromise();

  return notification;
}

export async function expectFsoContractNotification(
  env: Env,
  expectedNotification: DeepPartial<ContractNotification>,
  numberOfExpectedEvent = 1,
): Promise<ContractNotification[] | null | undefined> {
  const expected = {
    ...expectedNotification,
    numberOfExpectedEvent,
  };
  env.awaitingFsoContractNotificationsSubject?.next(expected);

  return env.fsoContractNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.find((match) => match.expectedNotification === expected),
      ),
      filter(
        (value) =>
          !!value &&
          (value.receivedNotifications?.length || 0) >= numberOfExpectedEvent,
      ),
      map((value) => value?.receivedNotifications),
      take(1),
    )
    .toPromise();
}

export async function expectFsoErrorNotification(
  env: Env,
  expectedNotification: Partial<ErrorNotification>,
  numberOfExpectedEvent = 1,
): Promise<ErrorNotification[] | null | undefined> {
  const expected = {
    ...expectedNotification,
    numberOfExpectedEvent,
  };
  env.awaitingFsoErrorNotificationsSubject?.next(expected);

  return env.fsoErrorNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.find((match) => match.expectedNotification === expected),
      ),
      filter(
        (value) =>
          !!value &&
          (value.receivedNotifications?.length || 0) >= numberOfExpectedEvent,
      ),
      map((value) => value?.receivedNotifications),
      take(1),
    )
    .toPromise();
}
