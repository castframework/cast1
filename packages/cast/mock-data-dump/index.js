const {
  CreateBond,
  InitiateSubscription,
  WhoamiFRO,
  REGISTRY_NOTIFICATION_SUB,
  CONTRACT_NOTIFICATION_SUB,
} = require('./queries/fro');
const {
  WhoamiFSO,
  GetSettlementTransaction,
  ConfirmPaymentReceived,
  ConfirmPaymentTransferred,
} = require('./queries/fso');
const sub = require('./subscription');
const mockBond = require('./mocks/bond.json');
const mockInitiateSubscriptionInput = require('./mocks/initiateSubscriptionInput.json');
const { GraphQLClient } = require('graphql-request');
const { v4: uuid } = require('uuid');

const froEndpoint = 'http://localhost:6661/graphql';
const fsoEndpoint = 'http://localhost:6663/graphql';
const froClient = new GraphQLClient(froEndpoint);
const fsoClient = new GraphQLClient(fsoEndpoint);

async function main() {
  const froAddress = await froClient.request(WhoamiFRO, { ledger: 'ETHEREUM' });
  const fsoAddress = await fsoClient.request(WhoamiFSO, { ledger: 'ETHEREUM' });

  console.log('FRO Address:', froAddress.whoami);
  console.log('FSO Address:', fsoAddress.whoami);

  let bond = {
    ...mockBond,
    symbol: '12345678912345678912345678',
    isinCode: '12345678912345678912345678',
    registrarAgentAddress: froAddress.whoami,
    settlerAgentAddress: fsoAddress.whoami,
  };
  await froClient.request(CreateBond, { bond });

  sub.create(REGISTRY_NOTIFICATION_SUB).subscribe(async (event) => {
    const instrumentAddress = event.data.registryNotification.instrumentAddress;
    console.log('Instrument created:', instrumentAddress);

    let initiateSubscriptionInput = {
      ...mockInitiateSubscriptionInput,
      instrumentAddress,
      operationId: uuid(),
      tradeId: uuid(),
    };
    await froClient.request(InitiateSubscription, { initiateSubscriptionInput });
  });
  sub.create(CONTRACT_NOTIFICATION_SUB).subscribe(async (event) => {
    if (event.data.contractNotification.notificationName === 'SubscriptionInitiated') {
      const getSettlementTransactionId =
        event.data.contractNotification.lightSettlementTransactions[0].id;
      console.log('Settlement transaction Id:', getSettlementTransactionId);

      const settlementTransaction = await fsoClient.request(GetSettlementTransaction, {
        getSettlementTransactionId,
      });
      const firstMovementRef =
        settlementTransaction.getSettlementTransaction.movements[0].paymentReference;
      const secondMovementRef =
        settlementTransaction.getSettlementTransaction.movements[1].paymentReference;
      console.log(
        'Settlement Status:',
        settlementTransaction.getSettlementTransaction.settlementStatus
      );

      await fsoClient.request(ConfirmPaymentReceived, {
        paymentReference: firstMovementRef,
      });
      console.log('Settlement Status: PROCESSED');

      await fsoClient.request(ConfirmPaymentTransferred, {
        paymentReference: secondMovementRef,
      });
      console.log('Settlement Status: SETTLED');
    }
  });
}

main();
