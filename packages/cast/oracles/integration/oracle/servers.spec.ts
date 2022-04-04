import { INestApplication } from '@nestjs/common';
import * as getPort from 'get-port';

import { Mode } from '../../src/mode';

import { randomDbEnv } from '../utils/envTemplates';
import { initTestFactory } from '../utils/initTestFactory';
import { configureLogger } from '../../src/utils/logger';
import { createDb } from '../utils/db';
import { before } from 'mocha';

let app: INestApplication;

describe('Servers tests', async () => {
  before(async function () {
    this.timeout(10000);
    const dbName = randomDbEnv(undefined, 'it_servers');
    configureLogger();
    await createDb(dbName);
  });

  describe('[SERVER] No connection tests', () => {
    it(`FRO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FRO], await getPort());
      return app.close();
    });
    it(`FIO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FIO], await getPort());
      return app.close();
    });
    it(`FSO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FSO], await getPort());
      return app.close();
    });
  });

  describe('[SERVER] No Connection but Database Tests', () => {
    it(`STR starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.STR], await getPort());
      return app.close();
    }).timeout(10000);
  });

  describe('[SERVER] Test with Blockchain connection', () => {
    if (process.env['BLOCKCHAIN_USE_MOCK'] === 'true') {
      return;
    }
    it(`FRO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FRO], await getPort());
      return app.close();
    });
    it(`FIO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FIO], await getPort());
      return app.close();
    });
    it(`FSO starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.FSO], await getPort());
      return app.close();
    });
    it(`STR starts and stop gracefully`, async () => {
      app = await initTestFactory([Mode.STR], await getPort());
      return app.close();
    }).timeout(20000);
  });
});
