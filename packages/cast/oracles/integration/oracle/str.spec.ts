import { AuthClaimService } from '../../src/shared/services/authClaim.service';
import { INestApplication } from '@nestjs/common';
import { expect } from 'chai';

import { Mode } from '../../src/mode';
import { SharedModule } from '../../src/shared.module';
import { initTestFactory } from '../utils/initTestFactory';
import { defaultEnv } from '../utils/envTemplates';
import { getCreateOracleSettlementTransactionInput } from '../utils/businessFixtures';
import { graphqlRequestWithAuth } from '../utils/graphql';
import { CreateOracleSettlementTransactionInput } from '@castframework/models';

import {
  configureLoggerFile,
  getNestJsLoggerService,
} from '../../src/utils/logger';
import { SharedConfig } from '../../src/shared/shared.config';

configureLoggerFile();
const Logger = getNestJsLoggerService('str.spec');

const settlementTransactionQuery = `
query SettlementTransactionQuery($id: String){
  getSettlementTransactions(id: $id) {
        id
    }
}
`;

// TODO: update
const settlementTransactionMutation = `
mutation settlementTransactionMutation($newSettlementTransaction: SettlementTransactionInput!){
  createSettlementTransaction(SettlementTransaction: $newSettlementTransaction){
      id
      tradeId
      instrumentId
      instrumentPublicAddress
      settlementType
      paymentSenderAccountNumber
      deliveryReceiverAccountNumber
      paymentReceiverAccountNumber
      deliverySenderAccountNumber
    }
}
`;

defaultEnv();

describe('Forge SettlementTransaction Repository', () => {
  let app: INestApplication;
  let auth: AuthClaimService;

  before(async function () {
    this.timeout(100000);
    app = await initTestFactory([Mode.FRO, Mode.STR], 6661);
    const sharedConfig = app.select(SharedModule).get(SharedConfig);
    auth = new AuthClaimService(sharedConfig);
  });

  it(`Should expose SettlementTransactions`, () => {
    return graphqlRequestWithAuth(app, auth.getEthClaim('localhost'), {
      query: settlementTransactionQuery,
      operationName: 'SettlementTransactionQuery',
    });
  });

  it(`Should accept a new SettlementTransaction`, async () => {
    const initiateSubscriptionInput: CreateOracleSettlementTransactionInput =
      getCreateOracleSettlementTransactionInput();
    await graphqlRequestWithAuth(app, auth.getEthClaim('localhost'), {
      query: settlementTransactionMutation,
      variables: { initiateSubscriptionInput },
    });

    return graphqlRequestWithAuth(app, auth.getEthClaim('localhost'), {
      query: settlementTransactionQuery,
      operationName: 'SettlementTransactionQuery',
      variables: { id: initiateSubscriptionInput.id },
    }).then((response) => {
      //console.dir(response.body.data);
      expect(response.body.data.getSettlementTransactions[0].id).to.equal(
        initiateSubscriptionInput.id,
      );
    });
  }).timeout(10000);

  after(async function () {
    this.timeout(100000);
    if (Logger.verbose) {
      Logger.verbose('Closing server test application (takes time...)');
    }
    return app.close();
  });
});
