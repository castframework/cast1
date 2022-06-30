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
const mockBond = require('./queries-variables/createBondInput.json');
const mockInitiateSubscriptionInput = require('./queries-variables/initiateSubscriptionInput.json');
const sub = require('./subscription');
const { v4: uuid } = require('uuid');
const investors = require('./mock-investors.json');
const issuerAccountNumber = generateIban();

exports.forgeBond = async (froClient, froAddress, fsoClient, fsoAddress, ledger, bondToForge) => {
    return new Promise(async (resolve, reject) => {
        let bond = {
            ...mockBond,
            ...bondToForge,
            registrarAgentAddress: froAddress,
            settlerAgentAddress: fsoAddress,
            ledger
        };
        console.log('Creating bond for:', bondToForge.symbol);

        try {
            await froClient.request(CreateBond, { bond });
        } catch (err) {
            reject(err);
        }

        const registrySub = sub.create(REGISTRY_NOTIFICATION_SUB).subscribe(async (event) => {
            const instrumentAddress = event.data.registryNotification.instrumentAddress;
            console.log('Instrument created:', instrumentAddress);

            console.log('Initiate Subscriptions for bond:', instrumentAddress);
            const issuerLEI = bondToForge.issuerId;
            for (const [index, investor] of investors.entries()) {
                let initiateSubscriptionInput = {
                    ...mockInitiateSubscriptionInput,
                    ...{
                        'issuerAddresses': {
                            'legalEntityId': issuerLEI,
                            'paymentAccountNumber': issuerAccountNumber
                        }
                    },
                    ...investor,
                    instrumentAddress,
                    operationId: uuid(),
                    tradeId: uuid(),
                    instrumentLedger: ledger
                };
                await froClient.request(InitiateSubscription, { initiateSubscriptionInput });
                console.log(`Subscription ${index + 1}/${investors.length}`);
            };
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

function generateIban() {
    let rdx = "";
    for (let index = 0; index < 11; index++) {
        rdx += Math.floor(Math.random() * 10).toString();
    }
    return "FR76300030113004" + rdx;
}