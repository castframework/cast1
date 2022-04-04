import { Env } from '../types';
import {
  InitiateTradeInput,
  CancelSettlementTransactionInput,
} from '@castframework/models';
import { getLogger } from '../../../src/utils/logger';

export async function trade(
  env: Env,
  tradeInput: InitiateTradeInput,
): Promise<string> {
  const logger = getLogger('trade');

  try {
    const transactionHash = await env.froClient.initiateTrade(tradeInput);
    return transactionHash;
  } catch (e) {
    logger.warn(`fro client threw an error: ${e.toString()}`);
    throw e;
  }
}

export async function cancelSettlementTransaction(
  env: Env,
  cancelSettlementTransactionInput: CancelSettlementTransactionInput,
): Promise<string> {
  const logger = getLogger('cancelSettlementTransaction');

  try {
    const transactionHash = await env.froClient.cancelSettlementTransaction(
      cancelSettlementTransactionInput,
    );
    return transactionHash;
  } catch (e) {
    logger.warn(`fro client threw an error: ${e.toString()}`);
    throw e;
  }
}
