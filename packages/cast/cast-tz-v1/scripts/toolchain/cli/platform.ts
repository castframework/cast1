#!/usr/bin/env ts-node

import * as minimist from 'minimist';
import { originateFromPathWithContext } from '../contractOriginator';
import {
  exportContractConfig,
  extractAddressFromSecret,
  getNetworkConfig,
  getObjectFromFile,
} from '../utils';
import { bindLambda } from '../bindLambda';
import { smpLog } from '../logger';
import { authorizeFactory } from '../authorizeFactory';

async function dothestuff(): Promise<void> {
  const argv = minimist<{ ['network-folder']: string }>(process.argv.slice(2));

  const networkFolder = argv['network-folder'] ?? process.env.NETWORK_FOLDER;

  const originationFile = `origination.json`;
  const networkConfig = getNetworkConfig(networkFolder);
  const sequence = getObjectFromFile(originationFile);

  const context = {
    ADMIN: extractAddressFromSecret(networkConfig.keysConfig.SG_FORGE),
    REGISTRAR: extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
  };

  smpLog.debug(
    `Platform sequence : ${JSON.stringify(sequence, undefined, ' ')}`,
  );
  smpLog.debug(`Context: ${JSON.stringify(context, undefined, ' ')}`);

  for (const { action, ...params } of sequence) {
    switch (action) {
      case 'originate':
        smpLog.debug(`originate action : ${JSON.stringify(params)}`);
        context[params.register] = await originateFromPathWithContext(
          params.path,
          context,
          networkConfig,
        );
        break;

      case 'bind':
        smpLog.debug(`bind action : ${JSON.stringify(params)}`);
        await bindLambda(
          context[params.lambda],
          context[params.target],
          networkConfig,
        );
        break;

      case 'authorizeFactory':
        smpLog.debug(`authorizeFactory action : ${JSON.stringify(params)}`);
        await authorizeFactory(
          context[params.registry],
          context[params.target],
          networkConfig,
        );
        break;

      default:
        smpLog.warning(`Unknown action : ${action}`);
        break;
    }
  }

  smpLog.debug('Exporting contract configuration');
  exportContractConfig(networkFolder, context);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
dothestuff();
