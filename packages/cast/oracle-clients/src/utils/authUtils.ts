import { Ledger } from '@castframework/models';
import { jwsHeader } from '@castframework/chain-auth';
import { BiMap } from './mapping';

const AlgChain = new BiMap<jwsHeader['alg'], Ledger>({
  ETH: Ledger.ETHEREUM,
  TZ: Ledger.TEZOS,
});

export function chainToAlg(ledger: Ledger): jwsHeader['alg'] {
  const res = AlgChain.rev(ledger);

  if (!res) {
    throw new Error('Unknow in mapping');
  }

  return res;
}
