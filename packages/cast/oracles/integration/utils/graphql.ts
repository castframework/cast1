import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getLogger } from '../../src/utils/logger';
import delay from 'delay';

export type GraphQLSubscriptionEvent<T extends string, U> = {
  [key in T]: U;
};

export type GraphQLContractNotification<T extends string, U> = {
  [key in T]: U;
};

export type GraphQLRegistryNotification<T extends string, U> = {
  [key in T]: U;
};

export function graphqlRequestWithAuth(
  app: INestApplication,
  authToken: string,
  graphql: Record<string, any>,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/graphql')
    .set('Authorization', `Bearer ${authToken}`)
    .send(graphql)
    .expect(200);
}

export async function waitForEvent<T>(
  eventQueue: T[],
  timeoutMs: number,
  eventName: string,
): Promise<T> {
  const logger = getLogger(`waitForEvent(${eventName})`);
  const timeoutTime = Date.now() + timeoutMs;
  while (eventQueue.length === 0 && Date.now() < timeoutTime) {
    await delay(10);
  }
  if (eventQueue.length === 0) {
    throw new Error(`timeout waiting for event ${eventName}`);
  }
  const event: T = eventQueue.shift() as T;
  logger.debug(`Received event : ${JSON.stringify(event)}`);
  return event;
}
