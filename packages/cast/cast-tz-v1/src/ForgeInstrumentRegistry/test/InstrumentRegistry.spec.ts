import {
  TezosOperationError,
  TezosOperationErrorWithMessage,
  TezosToolkit,
} from '@taquito/taquito';
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';
import { InMemorySigner } from '@taquito/signer';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import * as minimist from 'minimist';
import * as chai from 'chai';
import { assert, expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const faker = require('faker');

describe('ForgeInstrumentRegistry', function () {
  let instrumentRegistry;
  let Tezos: TezosToolkit;
  const factoryAddress = 'KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9';
  let networkConfig: NetworkConfig;



  before(async function () {
    const argv = minimist<{ ['network-folder']: string }>(
      process.argv.slice(2),
    );
    const networkFolder = argv['network-folder'] ?? process.env.NETWORK_FOLDER;
    networkConfig = getNetworkConfig(networkFolder);
    Tezos = await getTezosToolkitRegistrar(networkConfig);

    instrumentRegistry = await Tezos.contract.at(
      networkConfig.contractConfig.REGISTRY,
    );
    await instrumentRegistry.storage();

    const registrarAddress = extractAddressFromSecret(
      networkConfig.keysConfig.REGISTRAR,
    );

    // To test instrument registry methods, we use the registrar address as a factory address
    const op = await instrumentRegistry.methods.authorizeFactory('Registrar', registrarAddress)
      .send();

    await op
      .confirmation()
      .catch((error) => console.log(JSON.stringify(error)));

  });

  it('Should authorize a new Factory', async function () {
    try {
      const isin = faker.datatype.uuid();
      const name = faker.commerce.productName();
      console.log({ isin, name });
      Tezos.setProvider({
        signer: new InMemorySigner(networkConfig.keysConfig.REGISTRAR),
      });
      const op = await instrumentRegistry.methods
        .authorizeFactory('Other', factoryAddress)
        .send();

      await op
        .confirmation()
        .catch((error) => console.log(JSON.stringify(error)));

      const newStorage = await instrumentRegistry.storage();
      const authorizedFactories = Array.from(newStorage.factories.values());
      console.log({ authorizedFactories });
      expect(authorizedFactories).to.contains(factoryAddress);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
        console.log(e.errors);
        expect(e).to.be.undefined;
      } else {
        throw e;
      }
    }
  });

  it('Should unAuthorizeFactory a Factory', async function () {
    try {
      const isin = faker.datatype.uuid();
      const name = faker.commerce.productName();
      console.log({ isin, name });

      const op = await instrumentRegistry.methods
        .unAuthorizeFactory(factoryAddress)
        .send();

      await op
        .confirmation()
        .catch((error) => console.log(JSON.stringify(error)));

      const newStorage = await instrumentRegistry.storage();
      const authorizedFactories = Array.from(newStorage.factories.values());
      expect(authorizedFactories).to.not.contains(factoryAddress);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
        console.log(e.errors);
        expect(e).to.be.undefined;
      } else {
        throw e;
      }
    }
  });

  it('Should register a new instrument', async function () {
    try {
      const isin = faker.datatype.uuid();
      const name = faker.commerce.productName();

      console.log({ isin, name });

      const op = await instrumentRegistry.methods
        .listInstrument('KT1V43AmTSkDCc2Qr6riJ9VRaBtTAh7CqRJf', isin, name)
        .send();

      await op
        .confirmation()
        .catch((error) => console.log(JSON.stringify(error)));

      const newStorage = await instrumentRegistry.storage();
      assert.equal(
        newStorage.tokensByIsinCode.has(isin),
        true,
        'tokensByIsinCode map should the right key stored inside',
      );
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
        console.log(e.errors);
        expect(e).to.be.undefined;
      } else {
        throw e;
      }
    }
  });

  it('Should unregister an instrument', async function () {
    try {
      const isin = faker.datatype.uuid();

      console.log({ isin });

      const opAdd = await instrumentRegistry.methods
        .listInstrument(
          'KT1V43AmTSkDCc2Qr6riJ9VRaBtTAh7CqRJf',
          isin,
          faker.commerce.productName(),
        )
        .send();

      await opAdd.confirmation();

      console.log('Now delete');

      const opDel = await instrumentRegistry.methods
        .unlistInstrument(isin)
        .send();

      await opDel.confirmation();

      const newStorage = await instrumentRegistry.storage();
      assert.equal(
        newStorage.tokensByIsinCode.has(isin),
        false,
        'tokensByIsinCode map should the right key stored inside',
      );
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'Error message : ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
        console.log(e.errors);
        expect(e).to.be.undefined;
      } else {
        throw e;
      }
    }
  });

  it('should fail when listInstrument() not called by registrar', async function () {
    Tezos.setProvider({
      signer: new InMemorySigner(networkConfig.keysConfig.STR),
    });
    const isin = faker.datatype.uuid();
    const name = faker.commerce.productName();

    const operationPromise = instrumentRegistry.methods
      .listInstrument('KT1V43AmTSkDCc2Qr6riJ9VRaBtTAh7CqRJf', isin, name)
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Sender is not an authorized factory*/,
    );
  });

  it('should fail when authorizeFactory() not called by owner', async function () {
    Tezos.setProvider({
      signer: new InMemorySigner(networkConfig.keysConfig.STR),
    });

    const operationPromise = instrumentRegistry.methods
      .authorizeFactory('Bond', factoryAddress)
      .send();
    await expect(operationPromise).to.be.rejectedWith(
      /.*Sender is not the registry owner*/,
    );
  });
});
