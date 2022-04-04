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
import { buildTokenEMTN } from '../../utils/tokenUtils';
import * as minimist from 'minimist';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const faker = require('faker');

describe('ForgeTokenFactory: createForgeEmtn', function () {
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

    const instrumentRegistry = await Tezos.contract.at(
      networkConfig.contractConfig.REGISTRY,
    );

    const registrarAddress = extractAddressFromSecret(
      networkConfig.keysConfig.REGISTRAR,
    );

    // To test instrument registry methods, we use the registrar address as a factory address
    const op = await instrumentRegistry.methods
      .authorizeFactory('Registrar', registrarAddress)
      .send();

    await op
      .confirmation()
      .catch((error) => console.log(JSON.stringify(error)));

    const factoryAddress = networkConfig.contractConfig.FACTORY_EMTN;

    factoryContract = await Tezos.contract.at(factoryAddress);
    factoryContractStorage = await factoryContract.storage();
    tokenArgs = buildTokenEMTN(
      networkConfig.contractConfig.REGISTRAR,
      networkConfig.contractConfig.ADMIN,
    );

    instrumentRegistryContract = await Tezos.contract.at(
      networkConfig.contractConfig.REGISTRY,
    );
  });

  it('should create a valid ForgeToken (should not fail if no contract exists with same name or isin)', async function () {
    try {
      const createForgeEmtnOp = await factoryContract.methods
        .createForgeEmtn(
          tokenArgs.currency,
          tokenArgs.initialSupply,
          tokenArgs.isinCode,
          tokenArgs.name,
          tokenArgs.owner,
          tokenArgs.registrar,
          networkConfig.contractConfig.REGISTRY,
          tokenArgs.settler,
          tokenArgs.symbol,
        )
        .send();
      await createForgeEmtnOp.confirmation();
      const createForgeEmtnOpHash = createForgeEmtnOp.hash;
      console.log('createForgeEmtnOpHash: ', createForgeEmtnOpHash);

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
      .createForgeEmtn(
        tokenArgs.currency,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.owner,
        tokenArgs.registrar,
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.settler,
        tokenArgs.symbol,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Token with this name already exists*/,
    );
  });

  it('should fail if a contract with the same isin code already exists', async function () {
    tokenArgs.name = faker.name.findName();
    const operationPromise = factoryContract.methods
      .createForgeEmtn(
        tokenArgs.currency,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.owner,
        tokenArgs.registrar,
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.settler,
        tokenArgs.symbol,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Token with this isin already exists*/,
    );
  });

  it('should fail if a creator is not the factory registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.STR);
    const operationPromise = factoryContract.methods
      .createForgeEmtn(
        tokenArgs.currency,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.owner,
        tokenArgs.registrar,
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.settler,
        tokenArgs.symbol,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Calling address should match factory registrar agent*/,
    );
  });

  it('should fail if a creator is not the emtn registrar', async function () {
    await importKey(Tezos, networkConfig.keysConfig.REGISTRAR);
    tokenArgs.registrar = extractAddressFromSecret(
      networkConfig.keysConfig.STR,
    );
    const operationPromise = factoryContract.methods
      .createForgeEmtn(
        tokenArgs.currency,
        tokenArgs.initialSupply,
        tokenArgs.isinCode,
        tokenArgs.name,
        tokenArgs.owner,
        tokenArgs.registrar,
        networkConfig.contractConfig.REGISTRY,
        tokenArgs.settler,
        tokenArgs.symbol,
      )
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Calling address should match emtn registrar agent*/,
    );
  });
});
