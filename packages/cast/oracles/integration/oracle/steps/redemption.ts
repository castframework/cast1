import { getInitiateRedemptionInput } from '../../utils/businessFixtures';
import {
  Currency,
  InitiateRedemptionInput,
  InstrumentPosition,
  InstrumentType,
  ParticipantAdresses,
} from '@castframework/models';
import { Env, ScenarioData } from '../types';
import { getLogger } from '../../../src/utils/logger';
import { confirmPaymentReceived } from '../helpers/confirmPaymentReceived';
import { asyncForEach } from '../../../src/utils/promiseUtils';
import { confirmPaymentTransferred } from '../helpers/confirmPaymentTransferred';
import { redemption } from '../helpers/redemption';
import {
  expectFroContractNotification,
  expectFsoContractNotification,
} from '../helpers/expectEvent';
import { ContractNotificationName } from '../../../src/shared/env-constant/notificationNames';
import { validatePosition } from '../helpers/validatePosition';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { OPERATION_TYPE_REDEMPTION } from '@castframework/cast-interface-v1';

chai.use(chaiAsPromised);

export async function redemptionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const logger = getLogger(scenarioData.scenarioName, 'Redemption');
  scenarioData.redemptionInput = getInitiateRedemptionInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  ) as InitiateRedemptionInput;
  const transactionHash = await redemption(env, scenarioData.redemptionInput);

  const notifications = await expectFroContractNotification(env, {
    transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.subscriptionInput.investorAddresses
              .deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
      {
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.RedemptionInitiated,
  });

  if (notifications === null || notifications === undefined) {
    return;
  }

  scenarioData.redemptionSettlementTransactionIds =
    notifications[0].lightSettlementTransactions.map(
      (lightNotif) => lightNotif.id,
    );

  logger.info(
    `Storing redemption settlement transaction ids ${JSON.stringify(
      scenarioData.redemptionSettlementTransactionIds,
    )}`,
  );

  await expectFsoContractNotification(env, {
    transactionHash: transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.subscriptionInput.investorAddresses
              .deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
      {
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.RedemptionInitiated,
  });
}

export async function redemptionSettlementReceivedStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const logger = getLogger(
    scenarioData.scenarioName,
    'redemptionSettlementReceivedStep',
  );

  const settlerAddresses =
    scenarioData.redemptionInput.participantsAddresses.find(
      (participant) =>
        participant.deliveryAccountNumber.toLowerCase() ===
        scenarioData.instrumentInput.settlerAgentAddress?.toLowerCase(),
    );

  const transactionHashes = await confirmPaymentReceived(
    env,
    scenarioData.redemptionSettlementTransactionIds[0],
    (settlerAddresses as ParticipantAdresses).paymentAccountNumber,
  );

  const paymentReceivedParticipantsBySettlementTransactionId = {
    // From subscription
    [scenarioData.redemptionSettlementTransactionIds[0]]: {
      securityDeliverer:
        scenarioData.subscriptionInput.investorAddresses.deliveryAccountNumber,
      securityReceiver: scenarioData.instrumentInput.issuerAddress,
      settler: scenarioData.instrumentInput.settlerAgentAddress as string,
      registrar: scenarioData.instrumentInput.registrarAgentAddress,
      securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
    },
    // From trade
    [scenarioData.redemptionSettlementTransactionIds[1]]: {
      securityDeliverer:
        scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
      securityReceiver: scenarioData.instrumentInput.issuerAddress,
      settler: scenarioData.instrumentInput.settlerAgentAddress as string,
      registrar: scenarioData.instrumentInput.registrarAgentAddress,
      securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
    },
  };

  const transferParticipantsBySettlementTransactionId = {
    // From subscription
    [scenarioData.redemptionSettlementTransactionIds[0]]: {
      securityDeliverer:
        scenarioData.subscriptionInput.investorAddresses.deliveryAccountNumber,
      securityReceiver: scenarioData.instrumentInput.issuerAddress,
      settler: 'no Data',
      registrar: 'no Data',
      securityIssuer: 'no Data',
    },
    // From trade
    [scenarioData.redemptionSettlementTransactionIds[1]]: {
      securityDeliverer:
        scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
      securityReceiver: scenarioData.instrumentInput.issuerAddress,
      settler: 'no Data',
      registrar: 'no Data',
      securityIssuer: 'no Data',
    },
  };

  const burnParticipants = {
    securityDeliverer: scenarioData.instrumentInput.issuerAddress,
    securityReceiver: '0x0000000000000000000000000000000000000000',
    settler: 'no Data',
    registrar: 'no Data',
    securityIssuer: 'no Data',
  };

  logger.info('Await all events');
  await Promise.all(
    scenarioData.redemptionSettlementTransactionIds.map(
      async (settlementTransactionId) =>
        Promise.all([
          expectFsoContractNotification(env, {
            // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
            instrumentAddress: scenarioData.instrumentAddress,
            lightSettlementTransactions: [
              {
                id: settlementTransactionId,
                participantAccountNumbers:
                  paymentReceivedParticipantsBySettlementTransactionId[
                    settlementTransactionId
                  ],
              },
            ],
            notificationName: ContractNotificationName.PaymentReceived,
            settlementTransactionOperationType: OPERATION_TYPE_REDEMPTION,
          }),
          expectFsoContractNotification(env, {
            // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
            instrumentAddress: scenarioData.instrumentAddress,
            lightSettlementTransactions: [
              {
                id: 'no Data',
                participantAccountNumbers:
                  transferParticipantsBySettlementTransactionId[
                    settlementTransactionId
                  ],
              },
            ],
            notificationName: ContractNotificationName.Transfer,
          }),
          expectFsoContractNotification(
            env,
            {
              // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
              instrumentAddress: scenarioData.instrumentAddress,
              lightSettlementTransactions: [
                {
                  id: 'no Data',
                  participantAccountNumbers: burnParticipants,
                },
              ],
              notificationName: ContractNotificationName.Transfer,
            },
            2,
          ),
          expectFroContractNotification(env, {
            // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
            instrumentAddress: scenarioData.instrumentAddress,
            lightSettlementTransactions: [
              {
                id: settlementTransactionId,
                participantAccountNumbers:
                  paymentReceivedParticipantsBySettlementTransactionId[
                    settlementTransactionId
                  ],
              },
            ],
            notificationName: ContractNotificationName.PaymentReceived,
            settlementTransactionOperationType: OPERATION_TYPE_REDEMPTION,
          }),
          expectFroContractNotification(env, {
            // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
            instrumentAddress: scenarioData.instrumentAddress,

            lightSettlementTransactions: [
              {
                id: 'no Data',
                participantAccountNumbers:
                  transferParticipantsBySettlementTransactionId[
                    settlementTransactionId
                  ],
              },
            ],
            notificationName: ContractNotificationName.Transfer,
          }),
          expectFroContractNotification(
            env,
            {
              // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
              instrumentAddress: scenarioData.instrumentAddress,
              lightSettlementTransactions: [
                {
                  id: 'no Data',
                  participantAccountNumbers: burnParticipants,
                },
              ],
              notificationName: ContractNotificationName.Transfer,
            },
            2,
          ),
        ]),
    ),
  );
  logger.info('Await all events return');
}

export async function redemptionSettlementTransferredStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const settlerAddresses =
    scenarioData.redemptionInput.participantsAddresses.find(
      (participant) =>
        participant.deliveryAccountNumber.toLowerCase() ===
        scenarioData.instrumentInput.settlerAgentAddress?.toLowerCase(),
    );

  await asyncForEach(
    scenarioData.redemptionSettlementTransactionIds,
    async (subscriptionSettlementTransactionId) => {
      const transactionHash = await confirmPaymentTransferred(
        env,
        subscriptionSettlementTransactionId,
        (settlerAddresses as ParticipantAdresses).paymentAccountNumber,
      );

      const paymentTransferredParticipantsBySettlementTransactionId = {
        // From subscription
        [scenarioData.redemptionSettlementTransactionIds[0]]: {
          securityDeliverer:
            scenarioData.subscriptionInput.investorAddresses
              .deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput.registrarAgentAddress,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
        // From trade
        [scenarioData.redemptionSettlementTransactionIds[1]]: {
          securityDeliverer:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          securityReceiver: scenarioData.instrumentInput.issuerAddress,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput.registrarAgentAddress,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      };

      await Promise.all([
        expectFsoContractNotification(env, {
          // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
          instrumentAddress: scenarioData.instrumentAddress,
          lightSettlementTransactions: [
            {
              id: subscriptionSettlementTransactionId,
              participantAccountNumbers:
                paymentTransferredParticipantsBySettlementTransactionId[
                  subscriptionSettlementTransactionId
                ],
            },
          ],
          notificationName: ContractNotificationName.PaymentTransferred,
          settlementTransactionOperationType: OPERATION_TYPE_REDEMPTION,
        }),
        expectFroContractNotification(env, {
          // transactionHash: transactionHashes[0], We cannot be sure which one of transactionHashes correspond to this settlement transaction
          instrumentAddress: scenarioData.instrumentAddress,
          lightSettlementTransactions: [
            {
              id: subscriptionSettlementTransactionId,
              participantAccountNumbers:
                paymentTransferredParticipantsBySettlementTransactionId[
                  subscriptionSettlementTransactionId
                ],
            },
          ],
          notificationName: ContractNotificationName.PaymentTransferred,
          settlementTransactionOperationType: OPERATION_TYPE_REDEMPTION,
        }),
      ]);
    },
  );
}

export async function validatePositionsAfterRedemptionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const positions = await env.froClient.getInstrumentPositions(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  );

  const issuerPosition = positions.find(
    (position) =>
      position.legalEntityAddress.toLowerCase() ===
      scenarioData.instrumentInput.issuerAddress?.toLowerCase(),
  );

  expect(issuerPosition).to.exist;

  const initialSupply =
    (scenarioData.instrumentInput.nominalAmount as number) /
    (scenarioData.instrumentInput.denomination as number);

  const expectedIssuerBalance =
    initialSupply -
    scenarioData.subscriptionInput.deliveryQuantity -
    scenarioData.tradeInput.deliveryQuantity;

  const expectedLockedIssuerBalance = 0;

  const expectedUnLockedIssuerBalance =
    expectedIssuerBalance - expectedLockedIssuerBalance;

  const expectedPercentage = expectedIssuerBalance / initialSupply;

  await validatePosition(issuerPosition as InstrumentPosition, {
    instrumentAddress: scenarioData.instrumentAddress,
    ledger: scenarioData.ledger,
    balance: expectedIssuerBalance,
    legalEntityAddress: scenarioData.instrumentInput.issuerAddress as string,
    symbol: 'null',
    valueInFiat: 0,
    currency: scenarioData.instrumentInput.currency as Currency,
    percentage: expectedPercentage,
    unlocked: expectedUnLockedIssuerBalance,
    locked: expectedLockedIssuerBalance,
  });
}

export async function failingRedemptionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  scenarioData.redemptionInput = getInitiateRedemptionInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  ) as InitiateRedemptionInput;
  const redemptionPromise = redemption(env, scenarioData.redemptionInput);

  await expect(redemptionPromise).to.be.rejectedWith(
    /.*already fully redeemed.*/,
  );
}
