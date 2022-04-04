import {
  TezosOperationError,
  TezosOperationErrorWithMessage,
  TezosToolkit,
} from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import { assert, expect } from 'chai';
import { importKey } from '@taquito/signer';
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';

import * as faker from 'faker';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import {
  buildSubscriptionArgs,
  buildTokenEMTN,
  ERROR,
  TOKEN_LOCKED,
} from '../../utils/tokenUtils';
import * as minimist from 'minimist';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
describe('ForgeToken: createSubscription', function () {
  let factoryContract;
  let tokenContractAddress;
  let tokenContract;
  let tokenStorage;
  let Tezos: TezosToolkit;
  let networkConfig: NetworkConfig;
  let tokenArgs;

  before(async function () {
    try {
      const argv = minimist<{ ['network-folder']: string }>(
        process.argv.slice(2),
      );
      const networkFolder =
        argv['network-folder'] ?? process.env.NETWORK_FOLDER;
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

      console.log('===== BEGIN BEFORE HOOK =====');

      factoryContract = await Tezos.contract.at(
        networkConfig.contractConfig.FACTORY_EMTN,
      );
      tokenArgs = buildTokenEMTN(
        networkConfig.contractConfig.REGISTRAR,
        networkConfig.contractConfig.ADMIN,
      );

      console.log('Originating new token contract...');

      const createForgeTokenOp = await factoryContract.methods
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

  it('should lock seller token when his balance is higher than the transaction AMOUNT', async function () {
    try {
      const args = buildSubscriptionArgs(
        extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
        11,
        1,
        tokenArgs.owner,
      );

      const createSubscriptionOp = await tokenContract.methods
        .initiateSubscription(...args)
        .send();
      await createSubscriptionOp.confirmation();
      const createSubscriptionOpHash = createSubscriptionOp.hash;
      console.log('1. createSubscriptionOpHash: ', createSubscriptionOpHash);

      tokenStorage = await tokenContract.storage();

      const subscriptionTicket =
        await tokenStorage.settlementTransactionRepository.settlementTransactionById.get(
          '1',
        );

      const status = new BigNumber(subscriptionTicket.status).toNumber();

      assert.equal(status, TOKEN_LOCKED);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
        console.log(e.errors);
      }
      throw e;
    }
  });

  it('should lock seller token when his balance is equal to the transaction AMOUNT', async function () {
    try {
      const args = buildSubscriptionArgs(
        extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
        1,
        2,
        tokenArgs.owner,
      );

      const createSubscriptionOp = await tokenContract.methods
        .initiateSubscription(...args)
        .send();
      await createSubscriptionOp.confirmation();
      const createSubscriptionOpHash = createSubscriptionOp.hash;
      console.log('2. createSubscriptionOpHash: ', createSubscriptionOpHash);

      tokenStorage = await tokenContract.storage();
      const subscriptionTicket =
        await tokenStorage.settlementTransactionRepository.settlementTransactionById.get(
          '2',
        );

      console.log(tokenStorage.settlementTransactionRepository);

      const status = new BigNumber(subscriptionTicket.status).toNumber();

      assert.equal(status, TOKEN_LOCKED);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log('MESSAGE: ', e.errors);
      }
      throw e;
    }
  });

  it('should fail when using a subscriptiondId already in use', async function () {
    const args = buildSubscriptionArgs(
      extractAddressFromSecret(networkConfig.keysConfig.STR),
      1,
      2,
      tokenArgs.owner,
    );
    const createSubscriptionPromise = tokenContract.methods
      .initiateSubscription(...args)
      .send();
    await expect(createSubscriptionPromise).to.be.rejectedWith(
      /.*settlementTransactionId already used*/,
    );
  });

  it('should fail when deliverySenderAccountNumber is not issuer', async function () {
    const args = buildSubscriptionArgs(
      extractAddressFromSecret(networkConfig.keysConfig.STR),
      1,
      139, // Unique txid
      'tz1ebLQeTHzVFFgD5fbYU1EsbP6NaBojygWG', // not the owner, vérifier que registrat est une adresse tz
    );
    const createSubscriptionPromise = tokenContract.methods
      .initiateSubscription(...args)
      .send();
    await expect(createSubscriptionPromise).to.be.rejectedWith(
      /.*deliverySenderAccountNumber must match token owner*/,
    );
  });

  it('should fail when not enough token are available on the seller balance (subscription created with ERROR status)', async function () {
    try {
      const args = buildSubscriptionArgs(
        extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
        100000,
        3,
        tokenArgs.owner,
      );

      const createSubscriptionOp = await tokenContract.methods
        .initiateSubscription(...args)
        .send();
      await createSubscriptionOp.confirmation();
      const createSubscriptionOpHash = createSubscriptionOp.hash;
      console.log('3. createSubscriptionOpHash: ', createSubscriptionOpHash);

      tokenStorage = await tokenContract.storage();
      const subscriptionTicket =
        await tokenStorage.settlementTransactionRepository.settlementTransactionById.get(
          '3',
        );

      const status = new BigNumber(subscriptionTicket.status).toNumber();

      assert.equal(status, ERROR);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
      } else {
        throw e;
      }
    }
  });

  it('should fail when operator is not authorised', async function () {
    await importKey(Tezos, networkConfig.keysConfig.STR);
    const args = buildSubscriptionArgs(
      extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
      1,
      faker.random.number(10000),
      tokenArgs.owner,
    );
    const operationPromise = tokenContract.methods
      .initiateSubscription(...args)
      .send();
    await expect(operationPromise).to.be.rejectedWith(/.*undefined operator*/);
  });
});
