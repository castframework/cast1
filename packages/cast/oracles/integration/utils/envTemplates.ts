import * as uuid from 'uuid';

import { getLogger } from '../../src/utils/logger';

export type EnvConfig = {
  strPort: number;
  froPort: number;
  fsoPort: number;
  fio1Port: number;
  fio2Port: number;
};

export function defaultEnv(
  envConfig: EnvConfig = {
    froPort: 6660,
    strPort: 6661,
    fsoPort: 6662,
    fio1Port: 6663,
    fio2Port: 6666,
  },
): void {
  const logger = getLogger('defaultEnv');
  logger.info(`Env config: ${JSON.stringify(envConfig)}`);
  const { froPort, fsoPort, strPort, fio1Port, fio2Port } = envConfig;

  // BLOCKCHAIN PARAMETERS
  if (!process.env['BLOCKCHAIN_USE_MOCK']) {
    process.env['BLOCKCHAIN_USE_MOCK'] = 'false';
  }
  if (!process.env['ETH_BLOCKCHAIN_PROVIDE_LOCATION']) {
    if (!process.env['KUBERNETES_SERVICE_HOST']) {
      process.env['ETH_BLOCKCHAIN_PROVIDE_LOCATION'] = 'ws://localhost:8545';
      // process.env['ETH_BLOCKCHAIN_PROVIDE_LOCATION'] = 'ws://localhost:8545';
      process.env['ETH_KEEPALIVE_INTERVAL_IN_SECONDS'] = '0';
    } else {
      process.env['ETH_BLOCKCHAIN_PROVIDE_LOCATION'] =
        'ws://ganache.forge-blockchain:8545';
    }
  }
  process.env['ETH_NUMBER_OF_CONFIRMATION'] = '0';
  process.env['TZ_POLLING_INTERVAL_IN_SECONDS'] = '1';
  if (!process.env['TZ_BLOCKCHAIN_PROVIDE_LOCATION']) {
    if (!process.env['KUBERNETES_SERVICE_HOST']) {
      // process.env['TZ_BLOCKCHAIN_PROVIDE_LOCATION'] = 'http://localhost:20000';
      process.env['TZ_BLOCKCHAIN_PROVIDE_LOCATION'] = 'https://tez.sgforge.fr';
    } else {
      process.env['TZ_BLOCKCHAIN_PROVIDE_LOCATION'] =
        'http://tez.forge-blockchain:20000';
    }
  }
  process.env['ETH_PRIVATE_KEY'] =
    '0x64e02814da99b567a92404a5ac82c087cd41b0065cd3f4c154c14130f1966aaf';
  if (!process.env['ETH_REGISTRY_ADDRESS']) {
    process.env['ETH_REGISTRY_ADDRESS'] = 'whatever';
  }
  process.env['TZ_PRIVATE_KEY'] =
    'edskS7pDdCbAdW9fHURjWysmM3fWg9pyw3YZaf8bHETuwgWegEN4mZqwF47LR8MEbcXsfnHu6T4NQjWzXGWpMHv1hwpmoT8rrV';
  if (!process.env['TZ_REGISTRY_ADDRESS']) {
    process.env['TZ_REGISTRY_ADDRESS'] = 'whatever';
  }

  process.env['POSITION_REPORT_INTERVAL_IN_MINUTE'] = '0';

  // SERVER
  process.env['PORT'] = '6660';

  // DATABASE
  process.env['POSTGRES_HOST'] =
    'sgforge-forge-dev.postgres.database.azure.com';
  process.env['POSTGRES_PORT'] = '5432';
  process.env['POSTGRES_DATABASE'] = 'oracle_with_date';
  process.env['POSTGRES_USER'] = 'postgres@sgforge-forge-dev';
  process.env['POSTGRES_PASSWORD'] = 'ILotieD8ahwa';
  process.env['POSTGRES_SSL'] = 'true';

  // COMPONENTS ADDRESS
  process.env['STR_GQL_URL'] = `http://localhost:${strPort}/graphql`;
  process.env['FSO_GQL_URL'] = `http://localhost:${fsoPort}/graphql`;
  process.env['API_FRO_GQL_EP'] = `http://localhost:${froPort}/graphql`;

  // BUSINESS CONFIGURATION
  process.env['LEI_FORGE'] = '969500FX8K40ZDW4F377';
}

export function randomDbEnv(envConfig?: EnvConfig, prefix = 'tmp'): string {
  defaultEnv(envConfig);

  // Postgres does not like dashes in db names
  const id = uuid.v4().replace(/-/g, '');

  process.env['POSTGRES_DATABASE'] = `${prefix}_${id}`;

  return process.env['POSTGRES_DATABASE'];
}
