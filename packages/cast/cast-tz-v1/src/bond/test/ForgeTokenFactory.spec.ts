import {
  TezosOperationError,
  TezosOperationErrorWithMessage,
  TezosToolkit,
} from '@taquito/taquito';
import { importKey } from '@taquito/signer';
import { assert, expect } from 'chai';
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import { buildTokenBond } from '../../utils/tokenUtils';
import * as minimist from 'minimist';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const faker = require('faker');

describe('ForgeTokenFactory: createForgeBond', function () {
  let factoryContract;
  let factoryContractStorage;
  let instrumentRegistryContract;
  let Tezos: TezosToolkit;
  let networkConfig: NetworkConfig;
  let tokenArgs;

  before(async function () {
    const argv = minimist<{ ['network-folder']: string }>(
      process.argv.slice(2),
    );
    const networkFolder = argv['network-folder'] ?? process.env.NETWORK_FOLDER;
    networkConfig = getNetworkConfig(networkFolder);
    Tezos = await getTezosToolkitRegistrar(networkConfig);

    const factoryAddress = networkConfig.contractConfig.FACTORY_BOND;

    factoryContract = await Tezos.contract.at(factoryAddress);
    factoryContractStorage = await factoryContract.storage();
    tokenArgs = buildTokenBond(
      networkConfig.contractConfig.REGISTRAR,
      networkConfig.contractConfig.ADMIN,
    );

    instrumentRegistryContract = await Tezos.contract.at(
      networkConfig.contractConfig.REGISTRY,
    );
  });

  it('should create a valid ForgeToken (should not fail if no contract exists with same name or isin)', async function () {
    try {
      const createForgeBondOp = await factoryContract.methods
        .createForgeBond(
          networkConfig.contractConfig.REGISTRY,
          tokenArgs.initialSupply,
          tokenArgs.isinCode,
          tokenArgs.name,
          tokenArgs.symbol,
          tokenArgs.denomination,
          tokenArgs.divisor,
          tokenArgs.startDate,
          tokenArgs.initialMaturityDate,
          tokenArgs.firstCouponDate,
          tokenArgs.couponFrequencyInMonths,
          tokenArgs.interestRateInBips,
          tokenArgs.callable,
          tokenArgs.isSoftBullet,
          tokenArgs.softBulletPeriodInMonths,
          tokenArgs.currency,
          tokenArgs.registrar,
          tokenArgs.settler,
          tokenArgs.owner,
        )
        .send();
      await createForgeBondOp.confirmation();
      const createForgeBondOpHash = createForgeBondOp.hash;
      console.log('createForgeBondOpHash: ', createForgeBondOpHash);

      const afterInstrumentRegistryStorage =
        await instrumentRegistryContract.storage();

      // cannot have bigMap size now
      // assert.equal(
      //   beforeInstrumentRegistryStorage.tokensByIsinCode.size + 1,
      //   afterInstrumentRegistryStorage.tokensByIsinCode.size,
      //   'tokens set length is not incremented by 1.',
      // );
      assert.isNotNull(
        afterInstrumentRegistryStorage.tokensByName.get(tokenArgs.name),
        'Unexistant token name.',
      );
      assert.isNotNull(
        afterInstrumentRegistryStorage.tokensByIsinCode.get(tokenArgs.isinCode),
        'Unexistant token isinCode.',
      );

      const { address: newTokenAddress } =
        await afterInstrumentRegistryStorage.tokensByName.get(tokenArgs.name);
      const newTokenContract = await Tezos.contract.at(newTokenAddress);
      const newTokenStorage: any = await newTokenContract.storage();

      assert.equal(
        newTokenStorage.initialSupply,
        tokenArgs.initialSupply,
        'Not same initialSupply.',
      );

      assert.equal(newTokenStorage.owner, tokenArgs.owner, 'Not same owner.');
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with,
        );
      }
      throw e;
    }
  });

  it('should fail if a contract with the same name already exists', async function () {
    const operationPromise = factoryContract.methods
      .createForgeBond(
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.symbol,
        tokenArgs.denomination,
        tokenArgs.divisor,
        tokenArgs.startDate,
        tokenArgs.initialMaturityDate,
        tokenArgs.firstCouponDate,
        tokenArgs.couponFrequencyInMonths,
        tokenArgs.interestRateInBips,
        tokenArgs.callable,
        tokenArgs.isSoftBullet,
        tokenArgs.softBulletPeriodInMonths,
        tokenArgs.currency,
        tokenArgs.registrar,
        tokenArgs.settler,
        tokenArgs.owner,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Token with this name already exists*/,
    );
  });

  it('should fail if a contract with the same isin code already exists', async function () {
    tokenArgs.name = faker.name.findName();
    const operationPromise = factoryContract.methods
      .createForgeBond(
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.symbol,
        tokenArgs.denomination,
        tokenArgs.divisor,
        tokenArgs.startDate,
        tokenArgs.initialMaturityDate,
        tokenArgs.firstCouponDate,
        tokenArgs.couponFrequencyInMonths,
        tokenArgs.interestRateInBips,
        tokenArgs.callable,
        tokenArgs.isSoftBullet,
        tokenArgs.softBulletPeriodInMonths,
        tokenArgs.currency,
        tokenArgs.registrar,
        tokenArgs.settler,
        tokenArgs.owner,
      )
      .send();

    await expect(operationPromise).to.be.rejectedWith(
      /.*Token with this isin already exists*/,
    );
  });

  it('should fail if a creator is not the factory registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.STR);
    const operationPromise = factoryContract.methods
      .createForgeBond(
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.symbol,
        tokenArgs.denomination,
        tokenArgs.divisor,
        tokenArgs.startDate,
        tokenArgs.initialMaturityDate,
        tokenArgs.firstCouponDate,
        tokenArgs.couponFrequencyInMonths,
        tokenArgs.interestRateInBips,
        tokenArgs.callable,
        tokenArgs.isSoftBullet,
        tokenArgs.softBulletPeriodInMonths,
        tokenArgs.currency,
        tokenArgs.registrar,
        tokenArgs.settler,
        tokenArgs.owner,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Calling address should match factory registrar agent*/,
    );
  });

  it('should fail if a creator is not the bond registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.REGISTRAR);
    tokenArgs.registrar = extractAddressFromSecret(
      networkConfig.keysConfig.STR,
    );
    const operationPromise = factoryContract.methods
      .createForgeBond(
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.symbol,
        tokenArgs.denomination,
        tokenArgs.divisor,
        tokenArgs.startDate,
        tokenArgs.initialMaturityDate,
        tokenArgs.firstCouponDate,
        tokenArgs.couponFrequencyInMonths,
        tokenArgs.interestRateInBips,
        tokenArgs.callable,
        tokenArgs.isSoftBullet,
        tokenArgs.softBulletPeriodInMonths,
        tokenArgs.currency,
        tokenArgs.registrar,
        tokenArgs.settler,
        tokenArgs.owner,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Calling address should match bond registrar agent*/,
    );
  });
});
