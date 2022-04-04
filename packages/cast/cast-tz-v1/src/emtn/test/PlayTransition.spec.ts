import {
  TezosOperationError,
  TezosOperationErrorWithMessage,
  TezosToolkit,
} from '@taquito/taquito';
import { importKey } from '@taquito/signer';
import { assert, expect } from 'chai';
import { BigNumber } from 'bignumber.js';
const faker = require('faker');
import {
  extractAddressFromSecret,
  getNetworkConfig,
  getTezosToolkitRegistrar,
} from '../../../scripts/toolchain/utils';
import { NetworkConfig } from '../../../scripts/toolchain/type';
import {
  buildCustomTokenEMTN,
  buildSubscriptionArgs,
  CASH_RECEIVED,
  CASH_SENT,
} from '../../utils/tokenUtils';
import * as minimist from 'minimist';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

function getRandomInt(max): number {
  return Math.floor(Math.random() * Math.floor(max));
}

const subscriptionId = getRandomInt(1000000000);
let investor: string;

describe('ForgeToken entrypoints testing', function () {
  let forgeToken;
  let tokenContractAddress;
  let Tezos: TezosToolkit;
  let networkConfig: NetworkConfig;
  let token;

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
    const op = await instrumentRegistry.methods.authorizeFactory('Registrar', registrarAddress)
      .send();

    await op
      .confirmation()
      .catch((error) => console.log(JSON.stringify(error)));

    console.log('===== BEGIN BEFORE HOOK =====');
    const forgeTokenFactoryContract = await Tezos.contract.at(
      networkConfig.contractConfig.FACTORY_EMTN,
    );

    console.log('CREATEFORGEEMTN');
    token = buildCustomTokenEMTN(
      networkConfig.contractConfig.ADMIN,
      networkConfig.contractConfig.ADMIN,
      extractAddressFromSecret(networkConfig.keysConfig.ISSUER_1),
    );

    investor = extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR);

    const forgeTokenContract = await forgeTokenFactoryContract.methods
      .createForgeEmtn(
        token.currency,
        token.initialSupply,
        token.isinCode,
        token.name,
        token.owner,
        extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
        networkConfig.contractConfig.REGISTRY,
        token.settler,
        token.symbol,
      )
      .send();

    console.log('CONFIRMATION');

    await forgeTokenContract.confirmation();

    const instrumentRegistryContract = await Tezos.contract.at(
      networkConfig.contractConfig.REGISTRY,
    );
    const registryStorage = (await instrumentRegistryContract.storage()) as any;

    const bigMapResult = await registryStorage.tokensByIsinCode.get(
      token.isinCode,
    );
    tokenContractAddress = bigMapResult.address;

    console.log('CONTRACT AT');

    forgeToken = await Tezos.contract.at(tokenContractAddress);

    console.log('CREATE SUBSCRIPTION');

    const subscriptionTicketManager = await forgeToken.methods
      .initiateSubscription(
        ...buildSubscriptionArgs(
          extractAddressFromSecret(networkConfig.keysConfig.REGISTRAR),
          2,
          subscriptionId,
          token.owner,
        ),
      )
      .send();

    console.log('CONFIRMATION SUBSCRIPTIONTICKRTMANAGER');

    await subscriptionTicketManager.confirmation();

    console.log('new tokenContractAddress: ', tokenContractAddress);
    console.log('===== END BEFORE HOOK =====');
  });

  it('confirm - CASH RECEIVED, should fail when sender has not the settler role', async function () {
    const subscriptionTicketManager = forgeToken.methods
      .confirmPaymentReceived(subscriptionId)
      .send();
    await expect(subscriptionTicketManager).to.be.rejectedWith(
      /.*only operator with settler role can settle token*/,
    );
  });

  it('confirm - CASH TRANSFERRED, should fail when sender has not the settler role', async function () {
    const subscriptionTicketManager = forgeToken.methods
      .confirmPaymentTransferred(subscriptionId)
      .send();
    await expect(subscriptionTicketManager).to.be.rejectedWith(
      /.*only operator with settler role can settle token*/,
    );
  });

  it('confirmPaymentReceived - CASH RECEIVED, should transfer balance from issuer to investor and change status', async function () {
    try {
      await importKey(Tezos, networkConfig.keysConfig.ISSUER_1);

      const updatedContract = await Tezos.contract.at(tokenContractAddress);

      const storage = (await updatedContract.storage()) as any;

      console.log(subscriptionId);
      console.log(
        storage.settlementTransactionRepository.settlementTransactionById.get(
          subscriptionId.toString(),
        ),
      );

      const newTicketManager = await updatedContract.methods
        .confirmPaymentReceived(subscriptionId)
        .send();
      await newTicketManager.confirmation(1, 1);
      const newStorage = (await updatedContract.storage()) as any;

      const finalIssuerBalanceBN = await newStorage.balances.get(token.owner);
      const finalInvestorBalanceBN = await newStorage.balances.get(investor);

      const finaleIssuerBalance = new BigNumber(
        finalIssuerBalanceBN.balance,
      ).toNumber();

      const finalInvestorBalance = new BigNumber(
        finalInvestorBalanceBN.balance,
      ).toNumber();

      const issuerBalanceExpectation = token.initialSupply - 2;
      const investorBalanceExpectation = 2;

      const subscriptionTickerManagerBigMap =
        await newStorage.settlementTransactionRepository.settlementTransactionById.get(
          subscriptionId.toString(),
        );
      const subscriptionTickerManagerStatusBN =
        subscriptionTickerManagerBigMap.status;
      const subscriptionTickerManagerStatus = new BigNumber(
        subscriptionTickerManagerStatusBN,
      ).toNumber();

      assert.equal(finaleIssuerBalance, issuerBalanceExpectation);
      assert.equal(finalInvestorBalance, investorBalanceExpectation);
      assert.equal(subscriptionTickerManagerStatus, CASH_RECEIVED);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
      }
      throw e;
    }
  });

  it('confirmPaymentTransferred - CASH SENT, should subscriptionTicket status change to CASH_SENT', async function () {
    try {
      await importKey(Tezos, networkConfig.keysConfig.ISSUER_1);

      const updatedContract = await Tezos.contract.at(tokenContractAddress);

      const subscriptionTicketManager = await updatedContract.methods
        .confirmPaymentTransferred(subscriptionId)
        .send();
      await subscriptionTicketManager.confirmation(1, 1);
      const newStorage = (await updatedContract.storage()) as any;

      const subscriptionTickerManagerBigMap =
        await newStorage.settlementTransactionRepository.settlementTransactionById.get(
          subscriptionId.toString(),
        );
      const subscriptionTickerManagerStatusBN =
        subscriptionTickerManagerBigMap.status;
      const subscriptionTickerManagerStatus = new BigNumber(
        subscriptionTickerManagerStatusBN,
      ).toNumber();

      assert.equal(subscriptionTickerManagerStatus, CASH_SENT);
    } catch (e) {
      if (e instanceof TezosOperationError) {
        console.log(
          'MESSAGE: ',
          (e.errors[1] as TezosOperationErrorWithMessage).with.string,
        );
      }
      throw e;
    }
  });
});
