import BigNumber from 'bignumber.js';
import uuidToHex = require('uuid-to-hex');

export function bnToUuid(bn: BigNumber): string {
  const hex = bn.toString(16).padStart(32, '0');
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20)
  );
}

// Mauvaise idee d'utiliser ca pour passer en parametre a web3
export function uuidToBn(uuid: string): BigNumber {
  const hexa: number = uuidToHex(uuid);
  return new BigNumber(hexa, 16);
}

export function collapseToBigNumber(
  notSureWhatItIs: string | number | BigNumber,
  base?: 16,
): BigNumber {
  switch (typeof notSureWhatItIs) {
    case 'number':
      return new BigNumber(notSureWhatItIs);
    case 'string':
      return new BigNumber(notSureWhatItIs, base);
    default:
      return notSureWhatItIs;
  }
}

export function uuidToFixed(uuid: string): string {
  return uuidToBn(uuid).toFixed();
}
