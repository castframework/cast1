import { Ledger } from '@castframework/models';

import Web3Utils = require('web3-utils');
import { validateContractAddress, ValidationResult } from '@taquito/utils';

export function validateLedgerContractAddress(
  address: string,
  ledger: Ledger,
): boolean {
  switch (ledger) {
    case Ledger.ETHEREUM:
      return Web3Utils.isAddress(address);
    case Ledger.TEZOS:
      return validateContractAddress(address) === ValidationResult.VALID;
    default:
      throw new Error(`Ledger ${ledger} not handled`);
  }
}
