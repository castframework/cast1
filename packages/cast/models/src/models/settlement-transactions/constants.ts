import { registerEnumType } from '@nestjs/graphql';

export enum SettlementTransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  REJECTED = 'REJECTED',
  UNPROCESSED = 'UNPROCESSED',
  PROCESSED = 'PROCESSED',
  SETTLED = 'SETTLED',
  CANCELED = 'CANCELED',
}
registerEnumType(SettlementTransactionStatus, {
  name: 'SettlementTransactionStatus',
});

export enum SettlementTransactionType {
  DVP = 'DVP',
  PFOD = 'PFOD',
  DWP = 'DWP',
  FOP = 'FOP',
}
registerEnumType(SettlementTransactionType, {
  name: 'SettlementTransactionType',
});

export enum MovementType {
  CASH = 'CASH',
  TOKEN = 'TOKEN',
}
registerEnumType(MovementType, {
  name: 'MovementType',
});
