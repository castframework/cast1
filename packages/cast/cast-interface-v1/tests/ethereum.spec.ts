import 'mocha';
import { expect } from 'chai';
import { AbiItem } from 'web3-utils';
import * as faker from 'faker';
import * as log4js from 'log4js';
import { getLogger } from 'log4js';
import {
  TransactionManager,
  TransactionParams,
  TransactionStatus,
} from '@castframework/transaction-manager';
import {
  EthereumBlockchainDriver,
  PrivateKeySigner,
} from '@castframework/blockchain-driver-eth';
import { CreateForgeBondParams, ForgeBond, ForgeBondFactory } from '../src';
import { first, multicast } from 'rxjs/operators';
import { ConnectableObservable, Observable, ReplaySubject } from 'rxjs';
import ForgeBondFactoryABI from '../src/blockchainSpecific/eth/abi/ForgeBondFactory.json';
import ForgeBondABI from '../src/blockchainSpecific/eth/abi/ForgeBond.json';
import BigNumber from 'bignumber.js';
import uuidToHex = require('uuid-to-hex');
const forgeBondFactoryAbi = ForgeBondFactoryABI as unknown as AbiItem;
const forgeBondAbi = ForgeBondABI as unknown as AbiItem;

type ObservableToConnectableObservable<T> = ConnectableObservable<
  T extends Observable<infer U> ? U : never
>;

export function uuidToBn(uuid: string): BigNumber {
  const hexa: number = uuidToHex(uuid);
  return new BigNumber(hexa, 16);
}
export function uuidToFixed(uuid: string): string {
  return uuidToBn(uuid).toFixed();
}

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

it('Tests ETHEREUM', async () => {
  const logger = getLogger('main');
  const driver = new EthereumBlockchainDriver({
    config: {
      numberOfConfirmation: 1,
      eventDelayInBlocks: 0,
    },
    signer: new PrivateKeySigner(
      '0x64e02814da99b567a92404a5ac82c087cd41b0065cd3f4c154c14130f1966aaf',
    ),
    nodeURL: 'ws://localhost:8545',
  });

  const transactionManager = new TransactionManager({
    logger: getLogger('TransactionManager'),
    driver: driver,
  });

  const forgeBondFactory = new ForgeBondFactory(
    '0xBE5adfA7d780e1250b5f63795Ed2D2a012754F2e',
    transactionManager,
    { abi: forgeBondFactoryAbi },
  );

  const instrumentListed = forgeBondFactory
    .InstrumentListed()
    .pipe(
      multicast(() => new ReplaySubject(1)),
    ) as unknown as ObservableToConnectableObservable<
    ReturnType<ForgeBondFactory<EthereumBlockchainDriver>['InstrumentListed']>
  >;

  instrumentListed.connect();

  const owner = '0xd5cC383881D6d9A7dc1891A0235E11D03Cb992d3';
  const registryAddress = '0xd4039eB67CBB36429Ad9DD30187B94f6A5122215';
  const createForgeBondParams: CreateForgeBondParams = {
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
    registrar: '0xd4039eB67CBB36429Ad9DD30187B94f6A5122215',
    settler: '0x7633Fe8542c2218B5A25777477F63D395aA5aFB4',
    owner: owner,
  };

  const result = await forgeBondFactory.createForgeBond(
    registryAddress,
    createForgeBondParams,
  );
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
    abi: forgeBondAbi,
  });

  const resultWaitForConfirmation =
    await transactionManager.waitForConfirmation(result.transactionId);
  expect(resultWaitForConfirmation).to.not.throw;

  const transactionInfo = await transactionManager.getTransactionInfo(
    result.transactionId,
  );

  expect(transactionInfo.id).to.be.equal(result.transactionId);
  expect(transactionInfo.status).to.be.equal(TransactionStatus.CONFIRMED);

  const transactionsInfo = await transactionManager.getTransactionsInfo();
  expect(transactionsInfo.length).to.be.equal(1);

  const ownerResponse = await bond.owner();

  logger.info(`Owner: ${ownerResponse}`);

  expect(ownerResponse).to.be.equal(owner);

  const transactionParams: TransactionParams = {
    previousTransactions: [result.transactionId],
  };

  logger.info(
    `initiateSubscription with previous transaction `,
    result.transactionId,
  );

  const resultSubscription = await bond.initiateSubscription(
    {
      txId: uuidToFixed('eb0efc18-09ec-4ac9-bf0a-b9ef0058bd6b'),
      txHash: 'txHash',
      operationId: uuidToFixed('ba4d9c75-d9c8-4345-87a6-1b70db218324'),
      deliverySenderAccountNumber: '0xd5cC383881D6d9A7dc1891A0235E11D03Cb992d3',
      deliveryReceiverAccountNumber:
        '0xE3d6839A6E8615E0E9Bb6335CbbE7243744F12F3',
      deliveryQuantity: 100,
    },
    transactionParams,
  );

  logger.info('Closing');
  await transactionManager.close();
}).timeout(60000);
