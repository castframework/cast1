import { registerEnumType } from '@nestjs/graphql';

export enum ContractNotificationName {
  SubscriptionInitiated = 'SubscriptionInitiated',
  TradeInitiated = 'TradeInitiated',
  RedemptionInitiated = 'RedemptionInitiated',
  PaymentReceived = 'PaymentReceived',
  PaymentTransferred = 'PaymentTransferred',
  Transfer = 'Transfer',
  SettlementTransactionCanceled = 'SettlementTransactionCanceled',
}

registerEnumType(ContractNotificationName, {
  name: 'ContractNotificationName',
});

export enum RegistryNotificationName {
  InstrumentListed = 'InstrumentListed',
  InstrumentUnlisted = 'InstrumentUnlisted',
}

registerEnumType(RegistryNotificationName, {
  name: 'RegistryNotificationName',
});

export enum HeartbeatNotificationName {
  Heartbeat = 'Heartbeat',
}

registerEnumType(HeartbeatNotificationName, {
  name: 'HeartbeatNotificationName',
});

export enum ErrorNotificationName {
  Error = 'Error',
}

registerEnumType(ErrorNotificationName, {
  name: 'ErrorNotificationName',
});
