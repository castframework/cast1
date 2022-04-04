import { TezosOperationError, TezosToolkit } from '@taquito/taquito';
import { importKey } from '@taquito/signer';
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import { REGISTRAR_ROLE } from '../../utils/tokenUtils';
import * as minimist from 'minimist';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const faker = require('faker');

const tokenArgs = {
  registrar: 'tz1djN1zPWUYpanMS1YhKJ2EmFSYs6qjf4bW',
  settler: 'tz1XrCvviH8CqoHMSKpKuznLArEa1yR9U7ep',
  owner: 'tz1djN1zPWUYpanMS1YhKJ2EmFSYs6qjf4bW',
  initialSupply: 200,
  isinCode: faker.name.findName(), // generated randomly
  name: faker.name.findName(), // generated randomly
  symbol: 'mo',
  currency: 'EUR',
};

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
        networkConfig.contractConfig.FACTORY_EMTN,
      );

      console.log('Originating new token contract...');

      const createForgeTokenOp = await factoryContract.methods
        .createForgeEmtn(
          tokenArgs.currency,
          tokenArgs.initialSupply,
          tokenArgs.isinCode,
          tokenArgs.name,
          networkConfig.contractConfig.ADMIN,
          extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
          networkConfig.contractConfig.REGISTRY,
          tokenArgs.settler,
          tokenArgs.symbol,
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
