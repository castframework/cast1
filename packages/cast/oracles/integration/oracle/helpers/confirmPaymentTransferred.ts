import { Env } from '../types';
import { getLogger } from '../../../src/utils/logger';

export async function confirmPaymentTransferred(
  env: Env,
  settlementTransactionId: string,
  settlerPaymentAccountNumber: string,
): Promise<string[]> {
  const logger = getLogger('confirmPaymentTransferred');

  const settlementTransaction = await env.fsoClient.getSettlementTransaction(
    settlementTransactionId,
  );

  const paymentReference = settlementTransaction.movements?.find(
    (elt) => elt.senderAccountNumber === settlerPaymentAccountNumber,
  )?.paymentReference;

  try {
    if (paymentReference === undefined) {
      throw 'paymentReference undefined - confirmPaymentTransferred';
    }
    const transactionHashes = await env.fsoClient.confirmPaymentTransferred(
      paymentReference,
    );
    return transactionHashes;
  } catch (e) {
    logger.warn(`fso client threw an error: ${e.toString()}`);
    throw e;
  }
}
