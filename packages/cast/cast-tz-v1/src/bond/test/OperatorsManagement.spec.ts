import { TezosOperationError, TezosToolkit } from '@taquito/taquito';
import { importKey } from '@taquito/signer';
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import * as minimist from 'minimist';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const faker = require('faker');

const tokenArgs = {
  registrar: 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6',
  settler: 'tz1XrCvviH8CqoHMSKpKuznLArEa1yR9U7ep',
  owner: 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6',
  denomination: 1753660800,
  divisor: 1438041600,
  startDate: 12,
  initialMaturityDate: 36,
  firstCouponDate: 1,
  couponFrequencyInMonths: 1,
  interestRateInBips: 24,
  callable: true,
  isSoftBullet: true,
  softBulletPeriodInMonths: 1234,
  initialSupply: 2000,
  isinCode: faker.name.findName(), // generated randomly
  name: faker.name.findName(), // generated randomly
  symbol: 'mo',
  currency: 'EUR',
};

const TOKEN_LOCKED = 2;
const ERROR = 255;
const REGISTRAR_ROLE = 1;
const SETTLER_ROLE = 2;

describe('ForgeToken: authorizeOperator & revokeOperatorAuthozization', function () {
  let factoryContract;
  let tokenContractAddress;
  let tokenContract;
  let Tezos: TezosToolkit;
  let networkConfig: NetworkConfig;

  before(async function () {
    try {
      const argv = minimist<{ ['network-folder']: string }>(
        process.argv.slice(2),
      );
      const networkFolder =
        argv['network-folder'] ?? process.env.NETWORK_FOLDER;
      networkConfig = getNetworkConfig(networkFolder);
      Tezos = await getTezosToolkitRegistrar(networkConfig);

      console.log('===== BEGIN BEFORE HOOK =====');
      factoryContract = await Tezos.contract.at(
        networkConfig.contractConfig.FACTORY_BOND,
      );

      console.log('Originating new token contract...');

      const createForgeTokenOp = await factoryContract.methods
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
          extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
          tokenArgs.settler,
          networkConfig.contractConfig.ADMIN,
        )
        .send();

      await createForgeTokenOp.confirmation();

      const instrumentRegistryContract = await Tezos.contract.at(
        networkConfig.contractConfig.REGISTRY,
      );
      const registryStorage =
        (await instrumentRegistryContract.storage()) as any;

      const bigMapResult = await registryStorage.tokensByIsinCode.get(
        tokenArgs.isinCode,
      );
      tokenContractAddress = bigMapResult.address;

      console.log('new tokenContractAddress: ', tokenContractAddress);

      tokenContract = await Tezos.contract.at(tokenContractAddress);

      console.log('===== END BEFORE HOOK =====');
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log('MESSAGE: ', e.errors);
      }
      throw e;
    }
  });

  it('should fail when authorizeOperator() not called by registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.STR);
    const authorizeOperatorOp = tokenContract.methods
      .run(
        networkConfig.contractConfig.ADMIN,
        REGISTRAR_ROLE,
        'callAuthorizeOperator',
      )
      .send();
    await expect(authorizeOperatorOp).to.be.rejectedWith(
      /.*undefined operator*/,
    );
  });

  it('should fail when revokeOperatorAuthorization() not called by registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.STR);
    const authorizeOperatorOp = tokenContract.methods
      .run(
        networkConfig.contractConfig.ADMIN,
        REGISTRAR_ROLE,
        'callRevokeOperatorAuthorization',
      )
      .send();

    await expect(authorizeOperatorOp).to.be.rejectedWith(
      /.*undefined operator*/,
    );
  });

  it('should name a new operator with his role', async function () {});

  it('should revoke operator authorization', async function () {});
});
