import 'mocha';
import * as faker from 'faker';
import * as log4js from 'log4js';
import { expect } from 'chai';
import { getLogger } from 'log4js';
import {
  TransactionManager,
  TransactionParams,
  TransactionStatus,
} from '@castframework/transaction-manager';
import {
  PrivateKeySigner,
  TezosBlockchainDriver,
} from '@castframework/blockchain-driver-tz';
import { ForgeBondFactory } from '../src/ForgeBondFactory';
import { first, multicast } from 'rxjs/operators';
import { ConnectableObservable, Observable, ReplaySubject } from 'rxjs';
import {
  ForgeTokenFactoryEventMappers,
  ForgeTokenFactoryViewMappers,
} from '../src/blockchainSpecific/tz/viewMapper';
import { uuidToBn, uuidToFixed } from './ethereum.spec';
import {
  ForgeBond,
  ForgeTokenEventMappers,
  ForgeTokenViewMappers,
} from '../src';

type ObservableToConnectableObservable<T> = ConnectableObservable<
  T extends Observable<infer U> ? U : never
>;

const config = {
  level: 'trace',
  pattern: '%d{yyyy/MM/dd hh:mm:ss.SSS} %p %c %m',
};
log4js.configure({
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: `${config.pattern}`,
      },
    },
  },
  categories: {
    default: {
      appenders: ['console'],
      level: config.level,
    },
  },
});

it('Tests TEZOS', async () => {
  const logger = getLogger('main');
  const driver = new TezosBlockchainDriver({
    config: {
      pollingIntervalInSeconds: 1,
      defaultConfirmationCount: 1,
    },
    signer: new PrivateKeySigner(
      'edskS7pDdCbAdW9fHURjWysmM3fWg9pyw3YZaf8bHETuwgWegEN4mZqwF47LR8MEbcXsfnHu6T4NQjWzXGWpMHv1hwpmoT8rrV',
    ),
    nodeURL: 'https://localhost:20000/',
  });

  driver.setLogger(getLogger('Driver Tezos'));
  await driver.initialize();

  const transactionManager = new TransactionManager({
    logger: getLogger('TransactionManager'),
    driver: driver,
  });

  const forgeBondFactory = new ForgeBondFactory(
    'KT1TFkxzgGLmTS8xnZAXNdSj5uoyCgFLTZNQ',
    transactionManager,
    {
      viewMappers: ForgeTokenFactoryViewMappers,
      eventMappers: ForgeTokenFactoryEventMappers,
    },
  );

  const instrumentListed = forgeBondFactory
    .InstrumentListed()
    .pipe(
      multicast(() => new ReplaySubject(1)),
    ) as unknown as ObservableToConnectableObservable<
    ReturnType<ForgeBondFactory<TezosBlockchainDriver>['InstrumentListed']>
  >;

  instrumentListed.connect();

  const owner = 'tz1QTRauCaAjnRt3dB2Z364vBmMyAmieyWSa';

  const createForgeBondParams = {
    initialSupply: 1000,
    isinCode: faker.random.alphaNumeric(10),
    name: faker.random.alphaNumeric(10),
    symbol: faker.random.alphaNumeric(10),
    denomination: 100,
    divisor: 1000,
    startDate: 1577833200,
    initialMaturityDate: 1609455600,
    firstCouponDate: 1578265200,
    couponFrequencyInMonths: 10,
    interestRateInBips: 10,
    callable: true,
    isSoftBullet: true,
    softBulletPeriodInMonths: 10,
    currency: 'EUR',
    registrar: 'tz1es1Cci5T4NWhYHep7gnj3M3aF7Vq9CiLL',
    settler: 'tz1NF3vkkDAozuVrBKTWTmALULPkbVsa53r2',
    owner: owner,
  };

  const result = await forgeBondFactory.createForgeBond(createForgeBondParams);

  logger.info(`createForgeBond result TxId: `, result.transactionId);

  const resultWaitForConfirmation =
    await transactionManager.waitForConfirmation(result.transactionId);
  expect(resultWaitForConfirmation).to.not.throw;

  logger.info(`result Wait For Confirmation: `, resultWaitForConfirmation);

  const transactionInfo = await transactionManager.getTransactionInfo(
    result.transactionId,
  );

  expect(transactionInfo.transactionId).to.be.equal(result.transactionId);
  expect(transactionInfo.transactionStatus).to.be.equal(
    TransactionStatus.CONFIRMED,
  );
  const transactionsInfo = await transactionManager.getTransactionsInfo();
  expect(transactionsInfo.length).to.be.equal(1);

  logger.info(`waiting for instrumentListed event`);

  const instrumentListedEvent = await instrumentListed
    .pipe(first())
    .toPromise();

  logger.info(
    `instrumentListedEvent: ${JSON.stringify(instrumentListedEvent)}`,
  );

  const newInstrumentAddress = instrumentListedEvent.payload._instrumentAddress;

  logger.info(`New instrument address: ${newInstrumentAddress}`);

  const bond = new ForgeBond(newInstrumentAddress, transactionManager, {
    viewMappers: ForgeTokenViewMappers,
    eventMappers: ForgeTokenEventMappers,
  });

  const transactionParams: TransactionParams = {
    previousTransactions: [result.transactionId],
  };

  logger.info(
    `initiateSubscription with previous transaction `,
    result.transactionId,
  );

  const resultSubscription = await bond.initiateSubscription(
    {
      txId: 1,
      operationId: 2,
      deliverySenderAccountNumber: 'tz1QTRauCaAjnRt3dB2Z364vBmMyAmieyWSa',
      deliveryReceiverAccountNumber: 'tz1fuNat5UWJtPQMSFN3CfZkUsorcAV5Xpb9',
      deliveryQuantity: 100,
      txHash: 'txHash',
    },
    transactionParams,
  );

  await transactionManager.close();
}).timeout(60000);
