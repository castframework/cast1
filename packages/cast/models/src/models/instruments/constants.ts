import { registerEnumType } from '@nestjs/graphql';

export enum InstrumentType {
  // Should match class name
  Bond = 'Bond',
  EMTN = 'EMTN',
}
registerEnumType(InstrumentType, {
  name: 'InstrumentType',
});

export enum InstrumentStatus {
  CREATED = 'CREATED',
  ISSUED = 'ISSUED',
  REDEEMED = 'REDEEMED',
  CANCELLED = 'CANCELLED',
}
registerEnumType(InstrumentStatus, {
  name: 'InstrumentStatus',
});

export enum EmtnType {
  type1 = 'type1',
  type2 = 'type2',
}
registerEnumType(EmtnType, {
  name: 'EmtnType',
});

export enum Underlying {
  UDL1 = 'UDL1',
  IND1D120 = 'IND1D120',
}
registerEnumType(Underlying, {
  name: 'Underlying',
});
