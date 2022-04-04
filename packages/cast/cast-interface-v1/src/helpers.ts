import { b58encode, prefix } from '@castframework/blockchain-driver-tz';
import {
  ManySettlementTransaction,
  SettlementTransactionOperationType,
  SingleSettlementTransaction,
} from './ForgeBond';

export function isSingleSettlementTransaction(
  payload: SingleSettlementTransaction | ManySettlementTransaction,
): payload is SingleSettlementTransaction {
  return payload && 'settlementTransactionId' in payload;
}

export function isManySettlementTransaction(
  payload: SingleSettlementTransaction | ManySettlementTransaction,
): payload is SingleSettlementTransaction {
  return payload && 'settlementTransactionIds' in payload;
}

export function isSettlementTransactionOperationType(
  data: any,
): data is SettlementTransactionOperationType {
  return data && typeof data.settlementTransactionOperationType === 'string';
}

export function hex2buf(hex: any): Uint8Array {
  return new Uint8Array(
    hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16);
    }),
  );
}

export function hexToAddress(hex: string): string {
  let address, newPrefix;
  if (hex.substring(0, 2) == '00') {
    if (hex.substring(2, 4) == '00') newPrefix = prefix.tz1;
    if (hex.substring(2, 4) == '01') newPrefix = prefix.tz2;
    if (hex.substring(2, 4) == '02') newPrefix = prefix.tz3;
    address = hex.substring(4, 44);
  } else if (hex.substring(0, 2) == '01') {
    newPrefix = prefix.KT;
    address = hex.substring(2, 42);
  }
  return b58encode(hex2buf(address), newPrefix);
}
