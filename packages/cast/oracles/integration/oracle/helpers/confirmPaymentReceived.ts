import { Env } from '../types';
import { getLogger } from '../../../src/utils/logger';

export async function confirmPaymentReceived(
  env: Env,
  settlementTransactionId: string,
  settlerPaymentAccountNumber: string,
): Promise<string[]> {
  const logger = getLogger('confirmPaymentTransferred');

  const settlementTransaction = await env.fsoClient.getSettlementTransaction(
    settlementTransactionId,
  );

  const paymentReference = settlementTransaction.movements?.find(
    (elt) => elt.receiverAccountNumber === settlerPaymentAccountNumber,
  )?.paymentReference;

  try {
    if (paymentReference === undefined) {
      throw new Error('paymentReference undefined - confirmPaymentReceived');
    }
    return await env.fsoClient.confirmPaymentReceived(paymentReference);
  } catch (e) {
    logger.warn(`fso client threw an error: ${e.toString()}`);
    throw e;
  }
}
