#!/usr/bin/env ts-node

import { distributeTez } from '../tezRedistribution';
import * as minimist from 'minimist';
import { smpLog } from '../logger';
import { getNetworkConfig } from '../utils';

const distribute = async (): Promise<void> => {
  const argv = minimist<{ ['network-folder']: string; amount: number }>(
    process.argv.slice(2),
  );

  const networkFolder = argv['network-folder'] ?? process.env.NETWORK_FOLDER;
  const amount = argv['amount'];

  if (typeof networkFolder !== 'string') {
    throw new Error('Network folder argument must be set');
  }

  if (typeof amount !== 'number') {
    throw new Error('Amount argument must be set');
  }

  if (isNaN(amount) || amount === 0) {
    throw new Error('Incorrect amount argument has been set');
  }

  const networkConfig = getNetworkConfig(networkFolder);

  try {
    await distributeTez(networkConfig, amount);
  } catch (err) {
    smpLog.error(JSON.stringify(err));
    process.exit(1);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
distribute();
