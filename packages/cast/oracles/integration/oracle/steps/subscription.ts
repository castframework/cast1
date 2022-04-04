import { getInitiateSubscriptionInput } from '../../utils/businessFixtures';
import {
  Currency,
  InitiateSubscriptionInput,
  InstrumentPosition,
  InstrumentType,
} from '@castframework/models';
import { Env, ScenarioData } from '../types';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { getLogger } from '../../../src/utils/logger';
import { subscription } from '../helpers/subscription';
import { confirmPaymentReceived } from '../helpers/confirmPaymentReceived';
import { asyncForEach } from '../../../src/utils/promiseUtils';
import { confirmPaymentTransferred } from '../helpers/confirmPaymentTransferred';
import { validatePosition } from '../helpers/validatePosition';
import {
  expectFroContractNotification,
  expectFsoContractNotification,
} from '../helpers/expectEvent';
import { ContractNotificationName } from '../../../src/shared/env-constant/notificationNames';
import { OPERATION_TYPE_SUBSCRIPTION } from '@castframework/cast-interface-v1';

chai.use(chaiAsPromised);

export async function subscriptionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const logger = getLogger(scenarioData.scenarioName, 'Subscription');

  scenarioData.subscriptionInput = getInitiateSubscriptionInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  ) as InitiateSubscriptionInput;

  const transactionHash = await subscription(
    env,
    scenarioData.subscriptionInput,
  );

  const notifications = await expectFroContractNotification(env, {
    transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        participantAccountNumbers: {
          securityDeliverer: scenarioData.instrumentInput.issuerAddress,
          securityReceiver:
            scenarioData.subscriptionInput.investorAddresses
              .deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.SubscriptionInitiated,
    settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
  });

  if (notifications === null || notifications === undefined) {
    return;
  }

  logger.info(
    `Storing subscription settlement transaction id ${notifications[0].lightSettlementTransactions[0].id}`,
  );

  scenarioData.subscriptionSettlementTransactionIds = [
    notifications[0].lightSettlementTransactions[0].id,
  ];

  await expectFsoContractNotification(env, {
    transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.subscriptionSettlementTransactionIds[0],
        participantAccountNumbers: {
          securityDeliverer: scenarioData.instrumentInput.issuerAddress,
          securityReceiver:
            scenarioData.subscriptionInput.investorAddresses
              .deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.SubscriptionInitiated,
    settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
  });
}

export async function validatePositionsAfterSubscriptionStep(
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

  const expectedIssuerBalance = initialSupply;

  const expectedLockedIssuerBalance =
    scenarioData.subscriptionInput.deliveryQuantity;

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

export async function subscriptionSettlementReceivedStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const transactionHashes = await confirmPaymentReceived(
    env,
    scenarioData.subscriptionSettlementTransactionIds[0],
    scenarioData.subscriptionInput.intermediateAccountIBAN as string,
  );
  await Promise.all([
    expectFsoContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: scenarioData.subscriptionSettlementTransactionIds[0],
          participantAccountNumbers: {
            securityDeliverer: scenarioData.instrumentInput.issuerAddress,
            securityReceiver:
              scenarioData.subscriptionInput.investorAddresses
                .deliveryAccountNumber,
            settler: scenarioData.instrumentInput.settlerAgentAddress as string,
            registrar: scenarioData.instrumentInput
              .registrarAgentAddress as string,
            securityIssuer: scenarioData.instrumentInput
              .issuerAddress as string,
          },
        },
      ],
      notificationName: ContractNotificationName.PaymentReceived,
      settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
    }),

    expectFsoContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: 'no Data',
          participantAccountNumbers: {
            securityDeliverer: scenarioData.instrumentInput.issuerAddress,
            securityReceiver:
              scenarioData.subscriptionInput.investorAddresses
                .deliveryAccountNumber,
            settler: 'no Data',
            registrar: 'no Data',
            securityIssuer: 'no Data',
          },
        },
      ],
      notificationName: ContractNotificationName.Transfer,
      settlementTransactionOperationType: 'no Data',
    }),

    expectFroContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: scenarioData.subscriptionSettlementTransactionIds[0],
          participantAccountNumbers: {
            securityDeliverer: scenarioData.instrumentInput.issuerAddress,
            securityReceiver:
              scenarioData.subscriptionInput.investorAddresses
                .deliveryAccountNumber,
            settler: scenarioData.instrumentInput.settlerAgentAddress as string,
            registrar: scenarioData.instrumentInput
              .registrarAgentAddress as string,
            securityIssuer: scenarioData.instrumentInput
              .issuerAddress as string,
          },
        },
      ],
      notificationName: ContractNotificationName.PaymentReceived,
      settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
    }),

    expectFroContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: 'no Data',
          participantAccountNumbers: {
            securityDeliverer: scenarioData.instrumentInput.issuerAddress,
            securityReceiver:
              scenarioData.subscriptionInput.investorAddresses
                .deliveryAccountNumber,
            settler: 'no Data',
            registrar: 'no Data',
            securityIssuer: 'no Data',
          },
        },
      ],
      notificationName: ContractNotificationName.Transfer,
      settlementTransactionOperationType: 'no Data',
    }),
  ]);
}

export async function subscriptionSettlementTransferredStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  await asyncForEach(
    scenarioData.subscriptionSettlementTransactionIds,
    async (subscriptionSettlementTransactionId) => {
      const transactionHashes = await confirmPaymentTransferred(
        env,
        subscriptionSettlementTransactionId,
        scenarioData.subscriptionInput.intermediateAccountIBAN as string,
      );

      await expectFsoContractNotification(env, {
        transactionHash: transactionHashes[0],
        instrumentAddress: scenarioData.instrumentAddress,
        lightSettlementTransactions: [
          {
            id: subscriptionSettlementTransactionId,
            participantAccountNumbers: {
              securityDeliverer: scenarioData.instrumentInput.issuerAddress,
              securityReceiver:
                scenarioData.subscriptionInput.investorAddresses
                  .deliveryAccountNumber,
              settler: scenarioData.instrumentInput
                .settlerAgentAddress as string,
              registrar: scenarioData.instrumentInput
                .registrarAgentAddress as string,
              securityIssuer: scenarioData.instrumentInput
                .issuerAddress as string,
            },
          },
        ],
        notificationName: ContractNotificationName.PaymentTransferred,
        settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
      });

      await expectFroContractNotification(env, {
        transactionHash: transactionHashes[0],
        instrumentAddress: scenarioData.instrumentAddress,
        lightSettlementTransactions: [
          {
            id: subscriptionSettlementTransactionId,
            participantAccountNumbers: {
              securityDeliverer: scenarioData.instrumentInput.issuerAddress,
              securityReceiver:
                scenarioData.subscriptionInput.investorAddresses
                  .deliveryAccountNumber,
              settler: scenarioData.instrumentInput
                .settlerAgentAddress as string,
              registrar: scenarioData.instrumentInput
                .registrarAgentAddress as string,
              securityIssuer: scenarioData.instrumentInput
                .issuerAddress as string,
            },
          },
        ],
        notificationName: ContractNotificationName.PaymentTransferred,
        settlementTransactionOperationType: OPERATION_TYPE_SUBSCRIPTION,
      });
    },
  );
}

export async function validatePositionsAfterSubscriptionSettlementStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const positions = await env.froClient.getInstrumentPositions(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  );

  // Issuer
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
    initialSupply - scenarioData.subscriptionInput.deliveryQuantity;

  const expectedLockedIssuerBalance = 0;

  const expectedUnLockedIssuerBalance =
    expectedIssuerBalance - expectedLockedIssuerBalance;

  const expectedIssuerPercentage = expectedIssuerBalance / initialSupply;

  await validatePosition(issuerPosition as InstrumentPosition, {
    instrumentAddress: scenarioData.instrumentAddress,
    ledger: scenarioData.ledger,
    balance: expectedIssuerBalance,
    legalEntityAddress: scenarioData.instrumentInput.issuerAddress as string,
    symbol: 'null',
    valueInFiat: 0,
    currency: scenarioData.instrumentInput.currency as Currency,
    percentage: expectedIssuerPercentage,
    unlocked: expectedUnLockedIssuerBalance,
    locked: expectedLockedIssuerBalance,
  });

  // Investor
  const investorPosition = positions.find(
    (position) =>
      position.legalEntityAddress.toLowerCase() ===
      scenarioData.subscriptionInput.investorAddresses.deliveryAccountNumber.toLowerCase(),
  );

  expect(investorPosition).to.exist;

  const expectedInvestorBalance =
    scenarioData.subscriptionInput.deliveryQuantity;

  const expectedLockedInvestorBalance = 0;

  const expectedUnLockedInvestorBalance =
    expectedInvestorBalance - expectedLockedInvestorBalance;

  const expectedInvestorPercentage = expectedInvestorBalance / initialSupply;

  await validatePosition(investorPosition as InstrumentPosition, {
    instrumentAddress: scenarioData.instrumentAddress,
    ledger: scenarioData.ledger,
    balance: expectedInvestorBalance,
    legalEntityAddress:
      scenarioData.subscriptionInput.investorAddresses.deliveryAccountNumber,
    symbol: 'null',
    valueInFiat: 0,
    currency: scenarioData.instrumentInput.currency as Currency,
    percentage: expectedInvestorPercentage,
    unlocked: expectedUnLockedInvestorBalance,
    locked: expectedLockedInvestorBalance,
  });
}

export async function failingSubscriptionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  scenarioData.subscriptionInput = getInitiateSubscriptionInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  ) as InitiateSubscriptionInput;

  const subscriptionPromise = subscription(env, scenarioData.subscriptionInput);

  await expect(subscriptionPromise).to.be.rejectedWith(
    /.* already fully redeemed.*/,
  );
}

export async function failingSubscriptionSettlementTransferred(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  await asyncForEach(
    scenarioData.subscriptionSettlementTransactionIds,
    async (subscriptionSettlementTransactionId) => {
      const paymentTransferredPromise = confirmPaymentTransferred(
        env,
        subscriptionSettlementTransactionId,
        scenarioData.subscriptionInput.intermediateAccountIBAN as string,
      );

      await expect(paymentTransferredPromise).to.be.rejectedWith(
        /.*The settlement transaction is not in CASH_RECEIVED state.*/,
      );
    },
  );
}
