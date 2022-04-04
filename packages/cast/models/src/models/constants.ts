import { registerEnumType } from '@nestjs/graphql';

export enum Ledger {
  ETHEREUM = 'ETHEREUM',
  TEZOS = 'TEZOS',
}
registerEnumType(Ledger, {
  name: 'Ledger',
});
