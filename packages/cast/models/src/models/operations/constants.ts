import { registerEnumType } from '@nestjs/graphql';

export enum OperationType {
  EMTNIssuance = 'EMTNIssuance',
  BondIssuance = 'BondIssuance',
  Allocation = 'Allocation',

  // This is only needed for TypeORM.
  // When querying for every Issuance, TypeORM will query for operations with type EMTNIssuance, BondIssuance or Issuance.
  // If Issuance isn't part of the enum it will emit a warn...
  Issuance = 'Issuance',
}
registerEnumType(OperationType, {
  name: 'OperationType',
});

export enum SyndicateType {
  SYNDICATED = 'SYNDICATED',
  NOTSYNDICATED = 'NOTSYNDICATED',
}
registerEnumType(SyndicateType, { name: 'SyndicateType' });

export enum SettlementModel {
  DIRECT = 'DIRECT',
  INDIRECT = 'INDIRECT',
}
registerEnumType(SettlementModel, {
  name: 'SettlementModel',
});

export enum Currency {
  EUR = 'EUR',
}
registerEnumType(Currency, {
  name: 'Currency',
});

export enum Frequency {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
  WEEKLY = 'WEEKLY',
}
registerEnumType(Frequency, {
  name: 'Frequency',
});
