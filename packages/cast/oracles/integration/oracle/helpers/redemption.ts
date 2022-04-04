import { Env } from '../types';
import { InitiateRedemptionInput } from '@castframework/models';
import { getLogger } from '../../../src/utils/logger';

export async function redemption(
  env: Env,
  redemptionInput: InitiateRedemptionInput,
): Promise<string> {
  const logger = getLogger('redemption');

  try {
    return await env.froClient.initiateRedemption(redemptionInput);
  } catch (e) {
    logger.warn(`fro client threw an error: ${e.toString()}`);
    throw e;
  }
}
