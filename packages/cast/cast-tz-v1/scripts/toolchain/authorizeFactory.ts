import { NetworkConfig, TezosAddress } from './type';
import { TezosOperationError } from '@taquito/taquito';
import { extractAddressFromSecret, getTezosToolkit } from './utils';
import * as util from 'util';
import { smpLog } from './logger';
import { InMemorySigner } from '@taquito/signer';

export async function authorizeFactory(
  instrumentRegistryAddress: TezosAddress,
  factoryAddress: TezosAddress,
  networkConfig: NetworkConfig,
): Promise<void> {
  try {
    smpLog.info(
      `authorizeFactory for registry: ${instrumentRegistryAddress} and factory: ${factoryAddress}`,
    );

    const toolkit = await getTezosToolkit(networkConfig);
    const instrumentRegistry = await toolkit.contract.at(
      instrumentRegistryAddress,
    );

    const adminAddress = extractAddressFromSecret(networkConfig.coinbase);
    const registrarAddress = extractAddressFromSecret(
      networkConfig.keysConfig.REGISTRAR,
    );

    if (adminAddress !== registrarAddress) {
      toolkit.setProvider({
        signer: new InMemorySigner(networkConfig.keysConfig.REGISTRAR),
      });
    }
    const op = await instrumentRegistry.methods
      .authorizeFactory('EMTN', factoryAddress)
      .send();

    await op
      .confirmation()
      .catch((error) => console.log(JSON.stringify(error)));

    toolkit.setProvider({
      signer: new InMemorySigner(networkConfig.coinbase),
    });
    smpLog.info(
      `authorizeFactory ok - hash: ${op.hash} with consumedGas[${op.consumedGas}] fee[${op.fee}]`,
    );
  } catch (e) {
    if (e instanceof TezosOperationError) {
      smpLog.error(util.inspect(e.errors, false, null, true));
    } else {
      smpLog.error(
        `PublicNode Error ${
          e instanceof Error ? e.message : JSON.stringify(e)
        }`,
      );
    }
    throw e;
  }
}
