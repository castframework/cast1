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
const {subscribeBond} = require('./bond-subscription');

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
            return;
        }

        const registrySub = sub.create(REGISTRY_NOTIFICATION_SUB).subscribe(async (event) => {
            const instrumentAddress = event.data.registryNotification.instrumentAddress;
            console.log('Instrument created:', instrumentAddress);

            console.log('Initiate Subscriptions for bond:', instrumentAddress);
            for (const [index, investor] of investors.entries()) {
                console.log(`Subscription ${index + 1}/${investors.length}`);
                try {
                    await subscribeBond(froClient, fsoClient, ledger, instrumentAddress, investor, bondToForge.issuerId);
                } catch (err) {
                    reject(err);
                }
                console.log(`Subscription ${index + 1}/${investors.length} DONE !`);
            };
            registrySub.unsubscribe();
            resolve();
        });

    })
}
