import { Env } from '../types';
import { getLogger } from '../../../src/utils/logger';
import { InitiateSubscriptionInput } from '@castframework/models';

export async function subscription(
  env: Env,
  subscriptionInput: InitiateSubscriptionInput,
): Promise<string> {
  const logger = getLogger('subscription');

  try {
    const transactionHash = await env.froClient.initiateSubscription(
      subscriptionInput,
    );
    return transactionHash;
  } catch (e) {
    logger.warn(`fro client threw an error: ${e.toString()}`);
    throw e;
  }
}
