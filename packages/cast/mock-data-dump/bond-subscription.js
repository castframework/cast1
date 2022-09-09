const {
    InitiateSubscription,
    CONTRACT_NOTIFICATION_SUB,
} = require('./queries/fro');
const {
    GetSettlementTransaction,
    ConfirmPaymentReceived,
    ConfirmPaymentTransferred,
} = require('./queries/fso');
const mockInitiateSubscriptionInput = require('./queries-variables/initiateSubscriptionInput.json');
const sub = require('./subscription');
const { v4: uuid } = require('uuid');
const issuerAccountNumber = generateIban();

exports.subscribeBond = async (froClient, fsoClient, ledger, instrumentAddress, investor, issuerLEI) => {
    return new Promise(async (resolve, reject) => {
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