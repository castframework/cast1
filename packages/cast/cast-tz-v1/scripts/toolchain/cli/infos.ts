#!/usr/bin/env ts-node

import * as minimist from 'minimist';
import { smpLog } from '../logger';
import { getNetworkConfig } from '../utils';
import { printInfos } from '../printInfos';

const doTheStuff = async (): Promise<void> => {
  const argv = minimist<{ ['network-folder']: string; amount: number }>(
    process.argv.slice(2),
  );

  const networkFolder = argv['network-folder'] ?? process.env.NETWORK_FOLDER;
  const networkConfig = getNetworkConfig(networkFolder);

  try {
    await printInfos(networkConfig);
  } catch (err) {
    smpLog.error(JSON.stringify(err));
    process.exit(1);
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
doTheStuff();
