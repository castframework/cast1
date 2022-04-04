import { Env } from '../types';
import { map, take } from 'rxjs/operators';
import { getLogger } from '../../../src/utils/logger';
import { expect } from 'chai';

async function checkUnexpectedNotifications(env: Env): Promise<string[]> {
  const errorMessages: string[] = [];

  const unexpectedFroRegistryNotifications =
    await env.froRegistryNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => !match.expectedNotification),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFroRegistryNotifications?.length !== 0) {
    errorMessages.push(
      `Untreated FRO registry notifications: ${JSON.stringify(
        unexpectedFroRegistryNotifications,
      )}`,
    );
  }

  const unexpectedFroContractNotifications =
    await env.froContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => !match.expectedNotification),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFroContractNotifications?.length !== 0) {
    errorMessages.push(
      `Untreated FRO contract notifications: ${JSON.stringify(
        unexpectedFroContractNotifications,
      )}`,
    );
  }

  const unexpectedFroErrorNotifications = await env.froErrorNotificationsMatches
    ?.pipe(
      map((matches) => matches.filter((match) => !match.expectedNotification)),
      take(1),
    )
    .toPromise();

  if (unexpectedFroErrorNotifications?.length !== 0) {
    errorMessages.push(
      `Untreated FRO error notifications: ${JSON.stringify(
        unexpectedFroErrorNotifications,
      )}`,
    );
  }

  const unexpectedFsoContractNotifications =
    await env.fsoContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => !match.expectedNotification),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFsoContractNotifications?.length !== 0) {
    errorMessages.push(
      `Untreated FSO contract notifications: ${JSON.stringify(
        unexpectedFsoContractNotifications,
      )}`,
    );
  }

  const unexpectedFsoErrorNotifications = await env.fsoErrorNotificationsMatches
    ?.pipe(
      map((matches) => matches.filter((match) => !match.expectedNotification)),
      take(1),
    )
    .toPromise();

  if (unexpectedFsoErrorNotifications?.length !== 0) {
    errorMessages.push(
      `Untreated FSO error notifications: ${JSON.stringify(
        unexpectedFsoErrorNotifications,
      )}`,
    );
  }

  return errorMessages;
}

async function checkNotReceivedNotifications(env: Env): Promise<string[]> {
  const errorMessages: string[] = [];

  const unexpectedFroRegistryNotifications =
    await env.froRegistryNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => match.receivedNotifications?.length === 0),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFroRegistryNotifications?.length !== 0) {
    errorMessages.push(
      `Not received FRO registry notifications: ${JSON.stringify(
        unexpectedFroRegistryNotifications,
      )}`,
    );
  }

  const unexpectedFroContractNotifications =
    await env.froContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => match.receivedNotifications?.length === 0),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFroContractNotifications?.length !== 0) {
    errorMessages.push(
      `Not received FRO contract notifications: ${JSON.stringify(
        unexpectedFroContractNotifications,
      )}`,
    );
  }

  const unexpectedFroErrorNotifications = await env.froErrorNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.filter((match) => match.receivedNotifications?.length === 0),
      ),
      take(1),
    )
    .toPromise();

  if (unexpectedFroErrorNotifications?.length !== 0) {
    errorMessages.push(
      `Not received FRO error notifications: ${JSON.stringify(
        unexpectedFroErrorNotifications,
      )}`,
    );
  }

  const unexpectedFsoContractNotifications =
    await env.fsoContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter((match) => match.receivedNotifications?.length === 0),
        ),
        take(1),
      )
      .toPromise();

  if (unexpectedFsoContractNotifications?.length !== 0) {
    errorMessages.push(
      `Not received FSO contract notifications: ${JSON.stringify(
        unexpectedFsoContractNotifications,
      )}`,
    );
  }

  const unexpectedFsoErrorNotifications = await env.fsoErrorNotificationsMatches
    ?.pipe(
      map((matches) =>
        matches.filter((match) => match.receivedNotifications?.length === 0),
      ),
      take(1),
    )
    .toPromise();

  if (unexpectedFsoErrorNotifications?.length !== 0) {
    errorMessages.push(
      `Not received FSO error notifications: ${JSON.stringify(
        unexpectedFsoErrorNotifications,
      )}`,
    );
  }

  return errorMessages;
}

async function checkNumberOfNotifications(env: Env): Promise<string[]> {
  const errorMessages: string[] = [];

  const unevenNumberFroRegistryNotifications =
    (await env.froRegistryNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter(
            (match) =>
              !!match.receivedNotifications &&
              !!match.expectedNotification &&
              match.expectedNotification.numberOfExpectedEvent !==
                match.receivedNotifications.length,
          ),
        ),
        take(1),
      )
      .toPromise()) ?? [];

  if (unevenNumberFroRegistryNotifications?.length !== 0) {
    errorMessages.push(
      ...unevenNumberFroRegistryNotifications.map(
        (notif) =>
          `Number of received event did not match the number of expected event for fro registry notification: expected ${
            notif.expectedNotification?.numberOfExpectedEvent
          }, received ${
            notif.receivedNotifications?.length
          }. Expected notification: ${JSON.stringify(
            notif.expectedNotification,
          )}, Received notifications: ${notif.receivedNotifications}`,
      ),
    );
  }

  const unevenNumberFroContractNotifications =
    (await env.froContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter(
            (match) =>
              !!match.receivedNotifications &&
              !!match.expectedNotification &&
              match.expectedNotification.numberOfExpectedEvent !==
                match.receivedNotifications.length,
          ),
        ),
        take(1),
      )
      .toPromise()) ?? [];

  if (unevenNumberFroContractNotifications?.length !== 0) {
    errorMessages.push(
      ...unevenNumberFroContractNotifications.map(
        (notif) =>
          `Number of received event did not match the number of expected event for fro contract notification: expected ${
            notif.expectedNotification?.numberOfExpectedEvent
          }, received ${
            notif.receivedNotifications?.length
          }. Expected notification: ${JSON.stringify(
            notif.expectedNotification,
          )}, Received notifications: ${notif.receivedNotifications}`,
      ),
    );
  }

  const unevenNumberFroErrorNotifications =
    (await env.froErrorNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter(
            (match) =>
              !!match.receivedNotifications &&
              !!match.expectedNotification &&
              match.expectedNotification.numberOfExpectedEvent !==
                match.receivedNotifications.length,
          ),
        ),
        take(1),
      )
      .toPromise()) ?? [];

  if (unevenNumberFroErrorNotifications?.length !== 0) {
    errorMessages.push(
      ...unevenNumberFroErrorNotifications.map(
        (notif) =>
          `Number of received event did not match the number of expected event for fro error notification: expected ${
            notif.expectedNotification?.numberOfExpectedEvent
          }, received ${
            notif.receivedNotifications?.length
          }. Expected notification: ${JSON.stringify(
            notif.expectedNotification,
          )}, Received notifications: ${notif.receivedNotifications}`,
      ),
    );
  }

  const unevenNumberFsoContractNotifications =
    (await env.fsoContractNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter(
            (match) =>
              !!match.receivedNotifications &&
              !!match.expectedNotification &&
              match.expectedNotification.numberOfExpectedEvent !==
                match.receivedNotifications.length,
          ),
        ),
        take(1),
      )
      .toPromise()) ?? [];

  if (unevenNumberFsoContractNotifications?.length !== 0) {
    errorMessages.push(
      ...unevenNumberFsoContractNotifications.map(
        (notif) =>
          `Number of received event did not match the number of expected event for fso contract notification: expected ${
            notif.expectedNotification?.numberOfExpectedEvent
          }, received ${
            notif.receivedNotifications?.length
          }. Expected notification: ${JSON.stringify(
            notif.expectedNotification,
          )}, Received notifications: ${notif.receivedNotifications}`,
      ),
    );
  }

  const unevenNumberFsoErrorNotifications =
    (await env.fsoErrorNotificationsMatches
      ?.pipe(
        map((matches) =>
          matches.filter(
            (match) =>
              !!match.receivedNotifications &&
              !!match.expectedNotification &&
              match.expectedNotification.numberOfExpectedEvent !==
                match.receivedNotifications.length,
          ),
        ),
        take(1),
      )
      .toPromise()) ?? [];

  if (unevenNumberFsoErrorNotifications?.length !== 0) {
    errorMessages.push(
      ...unevenNumberFsoErrorNotifications.map(
        (notif) =>
          `Number of received event did not match the number of expected event for fso error notification: expected ${
            notif.expectedNotification?.numberOfExpectedEvent
          }, received ${
            notif.receivedNotifications?.length
          }. Expected notification: ${JSON.stringify(
            notif.expectedNotification,
          )}, Received notifications: ${notif.receivedNotifications}`,
      ),
    );
  }

  return errorMessages;
}

export async function checkNotificationFeeds(env: Env): Promise<void> {
  const logger = getLogger('checkNotificationFeeds');

  const unexpectedErrorMessages = await checkUnexpectedNotifications(env);
  const notReceivedErrorMessages = await checkNotReceivedNotifications(env);
  const notMatchingNumberOfNotificationMessages =
    await checkNumberOfNotifications(env);
  unexpectedErrorMessages.forEach((errorMessage) => logger.error(errorMessage));
  notReceivedErrorMessages.forEach((errorMessage) =>
    logger.error(errorMessage),
  );
  notMatchingNumberOfNotificationMessages.forEach((errorMessage) =>
    logger.error(errorMessage),
  );

  if (
    unexpectedErrorMessages.length !== 0 ||
    notReceivedErrorMessages.length !== 0 ||
    notMatchingNumberOfNotificationMessages.length !== 0
  ) {
    expect.fail('Notification feed check fail, check errors above');
  }
}
