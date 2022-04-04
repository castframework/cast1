import * as hash from 'object-hash';
import {
  Ledger,
  MovementType,
  CreateMovementInput,
  CreateOracleSettlementTransactionInput,
  Currency,
  SettlementTransactionType,
  ParticipantAdresses,
  SettlementModel,
} from '@castframework/models';
import { v4 } from 'uuid';

export function computePaymentReference(
  operationId: string,
  movementId: string,
): string {
  const hashOptions = {
    algorithm: 'sha1' as const,
    respectType: false,
  };

  return hash(
    {
      operationId,
      movementId,
    },
    hashOptions,
  ).substring(0, 16);
}

export function hashSettlementTransaction(
  settlementTransaction: Omit<CreateOracleSettlementTransactionInput, 'hash'>,
): string {
  const hashOptions = {
    algorithm: 'sha1' as const,
    respectType: false,
    excludeKeys: (key) => key === 'movements',
  };

  return hash(settlementTransaction, hashOptions);
}

export function generateCashMovementInput(
  senderAddresses: Pick<ParticipantAdresses, 'paymentAccountNumber'>,
  receiverAddresses: Pick<ParticipantAdresses, 'paymentAccountNumber'>,
  operationId: string,
): CreateMovementInput {
  const movementId = v4();
  return {
    id: movementId,
    movementType: MovementType.CASH,
    senderAccountNumber: senderAddresses.paymentAccountNumber,
    receiverAccountNumber: receiverAddresses.paymentAccountNumber,
    paymentReference: computePaymentReference(operationId, movementId),
  };
}

export function generateTokenMovementInput(
  senderAddresses: ParticipantAdresses,
  receiverAddresses: ParticipantAdresses,
): CreateMovementInput {
  return {
    id: v4(),
    movementType: MovementType.TOKEN,
    senderAccountNumber: receiverAddresses.deliveryAccountNumber,
    receiverAccountNumber: senderAddresses.deliveryAccountNumber,
  };
}

export function generateSettlementTransactionInput(
  deliveryQuantity: number,
  paymentAmount: number,
  paymentCurrency: Currency,
  settlementDate: Date,
  operationId: string,
  instrumentAddress: string,
  instrumentLedger: Ledger,
  paymentSenderAddresses: ParticipantAdresses,
  paymentReceiverAddresses: ParticipantAdresses,
  movements: CreateMovementInput[],
  additionalReaderAddresses: string[],
  tradeId: string,
  tradeDate: Date,
  settlementModel: SettlementModel,
  holdableTokenAddress?: string,
  intermediateAccountIBAN?: string,
): CreateOracleSettlementTransactionInput {
  const settlementTransactionWithoutHash = {
    id: v4(),
    settlementType: SettlementTransactionType.DVP,
    settlementDate,
    operationId,
    instrumentPublicAddress: instrumentAddress,
    instrumentLedger,
    deliveryQuantity: deliveryQuantity,
    deliveryReceiverAccountNumber: paymentSenderAddresses.deliveryAccountNumber,
    deliverySenderAccountNumber: paymentReceiverAddresses.deliveryAccountNumber,
    paymentAmount: paymentAmount,
    paymentCurrency: paymentCurrency,
    paymentReceiverAccountNumber: paymentReceiverAddresses.paymentAccountNumber,
    paymentSenderAccountNumber: paymentSenderAddresses.paymentAccountNumber,
    movements,
    additionalReaderAddresses,
    tradeId,
    tradeDate,
    settlementModel: settlementModel,
    holdableTokenAddress: holdableTokenAddress,
    intermediateAccountIBAN: intermediateAccountIBAN,
    paymentSenderLegalEntityId: paymentSenderAddresses.legalEntityId,
    paymentReceiverLegalEntityId: paymentReceiverAddresses.legalEntityId,
  };

  return {
    ...settlementTransactionWithoutHash,
    hash: hashSettlementTransaction(settlementTransactionWithoutHash),
  };
}
