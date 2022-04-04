import { NetworkConfig, TezosAddress } from './type';
import { TezosOperationError } from '@taquito/taquito';
import { getTezosToolkit } from './utils';
import * as util from 'util';
import { smpLog } from './logger';

export async function bindLambda(
  lambdaBuilder: TezosAddress,
  targetContract: TezosAddress,
  network: NetworkConfig,
): Promise<void> {
  try {
    const toolkit = await getTezosToolkit(network);

    const builderContract = await toolkit.contract.at(lambdaBuilder);
    smpLog.info(`Building lambda at ${lambdaBuilder}`);
    const buildOp = await builderContract.methods
      .buildCreateAndPlay('unit')
      .send();

    await buildOp.confirmation();
    smpLog.debug(
      `buildCreateAndPlay ok - hash: ${buildOp.hash} with consumedGas[${buildOp.consumedGas}] fee[${buildOp.fee}]`,
    );

    // bind
    smpLog.info(
      `Binding Lambda [${lambdaBuilder}] to contract [${targetContract}]`,
    );
    const sendOp = await builderContract.methods
      .sendCreateAndPlay(targetContract)
      .send();

    await sendOp.confirmation();
    smpLog.debug(
      `sendCreateAndPlay ok - hash: ${sendOp.hash} with consumedGas[${sendOp.consumedGas}] fee[${sendOp.fee}]`,
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
    throw e
  }
}
