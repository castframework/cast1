const {
    CreateBond,
    InitiateSubscription,
    REGISTRY_NOTIFICATION_SUB,
    CONTRACT_NOTIFICATION_SUB,
  } = require('./queries/fro');
  const {
    GetSettlementTransaction,
    ConfirmPaymentReceived,
    ConfirmPaymentTransferred,
  } = require('./queries/fso');
  const mockBond = require('./mocks/bond.json');
  const mockInitiateSubscriptionInput = require('./mocks/initiateSubscriptionInput.json');
  const sub = require('./subscription');
  const { v4: uuid } = require('uuid');

exports.bondCreation = async (froClient, froAddress, fsoClient, fsoAddress, ledger, bondToCreate) => {
    return new Promise(async (resolve, reject) => {
        let bond = {
            ...mockBond,
            ...bondToCreate,
            registrarAgentAddress: froAddress,
            settlerAgentAddress: fsoAddress,
            ledger
          };
        console.log('Creating bond for:', bondToCreate.symbol);

        try {
            await froClient.request(CreateBond, { bond });
        } catch(err) {
            if(err.response.errors[0].message.includes('Bond with this name already exists')) {
                console.error(`!! Bond ${bondToCreate.symbol} already exists`);
            } else {
                console.error(err);
            }
            reject();
        }
        
        const registrySub = sub.create(REGISTRY_NOTIFICATION_SUB).subscribe(async (event) => {
            const instrumentAddress = event.data.registryNotification.instrumentAddress;
            console.log('Instrument created:', instrumentAddress);

            let initiateSubscriptionInput = {
            ...mockInitiateSubscriptionInput,
            instrumentAddress,
            operationId: uuid(),
            tradeId: uuid(),
            instrumentLedger: ledger
            };
            await froClient.request(InitiateSubscription, { initiateSubscriptionInput });
            registrySub.unsubscribe();
        });
        const contractSub = sub.create(CONTRACT_NOTIFICATION_SUB).subscribe(async (event) => {
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
            contractSub.unsubscribe();
            resolve();
            }
        });
    })
}