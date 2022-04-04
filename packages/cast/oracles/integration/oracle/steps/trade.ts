import { getInitiateTradeInput } from '../../utils/businessFixtures';
import {
  Currency,
  InstrumentPosition,
  InstrumentType,
} from '@castframework/models';
import { Env, ScenarioData } from '../types';
import { getLogger } from '../../../src/utils/logger';
import { confirmPaymentReceived } from '../helpers/confirmPaymentReceived';
import { confirmPaymentTransferred } from '../helpers/confirmPaymentTransferred';
import { cancelSettlementTransaction, trade } from '../helpers/trade';
import {
  expectFroContractNotification,
  expectFsoContractNotification,
} from '../helpers/expectEvent';
import { ContractNotificationName } from '../../../src/shared/env-constant/notificationNames';
import { validatePosition } from '../helpers/validatePosition';
import { expect } from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { OPERATION_TYPE_TRADE } from '@castframework/cast-interface-v1';

chai.use(chaiAsPromised);

export async function tradeStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const logger = getLogger(scenarioData.scenarioName, 'Trade');
  scenarioData.tradeInput = getInitiateTradeInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  );
  const transactionHash = await trade(env, scenarioData.tradeInput);
  const notifications = await expectFroContractNotification(env, {
    transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.TradeInitiated,
    settlementTransactionOperationType: OPERATION_TYPE_TRADE,
  });

  if (notifications === null || notifications === undefined) {
    return;
  }

  logger.info(
    `Storing trade transaction id ${notifications[0].lightSettlementTransactions[0].id[0]}`,
  );

  scenarioData.tradeSettlementTransactionId =
    notifications[0].lightSettlementTransactions[0].id;

  await expectFsoContractNotification(env, {
    transactionHash: transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.tradeSettlementTransactionId,
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.TradeInitiated,
    settlementTransactionOperationType: OPERATION_TYPE_TRADE,
  });
}

export async function tradeSettlementReceivedStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const transactionHashes = await confirmPaymentReceived(
    env,
    scenarioData.tradeSettlementTransactionId,
    scenarioData.tradeInput.sellerAddresses.paymentAccountNumber,
  );

  await Promise.all([
    expectFsoContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      settlementTransactionOperationType: OPERATION_TYPE_TRADE,
      notificationName: ContractNotificationName.PaymentReceived,
      lightSettlementTransactions: [
        {
          id: scenarioData.tradeSettlementTransactionId,
          participantAccountNumbers: {
            securityDeliverer:
              scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
            securityReceiver:
              scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
            settler: scenarioData.instrumentInput.settlerAgentAddress as string,
            registrar: scenarioData.instrumentInput
              .registrarAgentAddress as string,
            securityIssuer: scenarioData.instrumentInput
              .issuerAddress as string,
          },
        },
      ],
    }),

    expectFsoContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: 'no Data',
          participantAccountNumbers: {
            securityDeliverer:
              scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
            securityReceiver:
              scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
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
          id: scenarioData.tradeSettlementTransactionId,
          participantAccountNumbers: {
            securityDeliverer:
              scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
            securityReceiver:
              scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
            settler: scenarioData.instrumentInput.settlerAgentAddress as string,
            registrar: scenarioData.instrumentInput
              .registrarAgentAddress as string,
            securityIssuer: scenarioData.instrumentInput
              .issuerAddress as string,
          },
        },
      ],
      notificationName: ContractNotificationName.PaymentReceived,
      settlementTransactionOperationType: OPERATION_TYPE_TRADE,
    }),

    expectFroContractNotification(env, {
      transactionHash: transactionHashes[0],
      instrumentAddress: scenarioData.instrumentAddress,
      lightSettlementTransactions: [
        {
          id: 'no Data',
          participantAccountNumbers: {
            securityDeliverer:
              scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
            securityReceiver:
              scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
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

export async function tradeSettlementTransferredStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const transactionHashes = await confirmPaymentTransferred(
    env,
    scenarioData.tradeSettlementTransactionId,
    scenarioData.tradeInput.buyerAddresses.paymentAccountNumber,
  );

  await expectFsoContractNotification(env, {
    transactionHash: transactionHashes[0],
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.tradeSettlementTransactionId,
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.PaymentTransferred,
    settlementTransactionOperationType: OPERATION_TYPE_TRADE,
  });

  await expectFroContractNotification(env, {
    transactionHash: transactionHashes[0],
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.tradeSettlementTransactionId,
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.PaymentTransferred,
    settlementTransactionOperationType: OPERATION_TYPE_TRADE,
  });
}

export async function failingTradeStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  scenarioData.tradeInput = getInitiateTradeInput(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  );

  const tradePromise = trade(env, scenarioData.tradeInput);

  await expect(tradePromise).to.be.rejectedWith(/.* already fully redeemed.*/);
}

export async function validatePositionsAfterTradeStep(
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
    initialSupply -
    scenarioData.subscriptionInput.deliveryQuantity -
    scenarioData.tradeInput.deliveryQuantity;

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

  // Investor 2
  const investor2Position = positions.find(
    (position) =>
      position.legalEntityAddress.toLowerCase() ===
      scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber.toLowerCase(),
  );

  expect(investor2Position).to.exist;

  const expectedInvestor2Balance = scenarioData.tradeInput.deliveryQuantity;

  const expectedLockedInvestor2Balance = 0;

  const expectedUnLockedInvestor2Balance =
    expectedInvestor2Balance - expectedLockedInvestor2Balance;

  const expectedInvestor2Percentage = expectedInvestor2Balance / initialSupply;

  await validatePosition(investor2Position as InstrumentPosition, {
    instrumentAddress: scenarioData.instrumentAddress,
    ledger: scenarioData.ledger,
    balance: expectedInvestor2Balance,
    legalEntityAddress:
      scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
    symbol: 'null',
    valueInFiat: 0,
    currency: scenarioData.instrumentInput.currency as Currency,
    percentage: expectedInvestor2Percentage,
    unlocked: expectedUnLockedInvestor2Balance,
    locked: expectedLockedInvestor2Balance,
  });
}

export async function tradeCancelSettlementTransactionStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const cancelSettlementTransactionInput = {
    settlementTransactionId: scenarioData.tradeSettlementTransactionId,
    instrumentAddress: scenarioData.instrumentAddress,
    instrumentLedger: scenarioData.ledger,
  };
  const transactionHash = await cancelSettlementTransaction(
    env,
    cancelSettlementTransactionInput,
  );

  await expectFroContractNotification(env, {
    transactionHash: transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.tradeSettlementTransactionId,
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.SettlementTransactionCanceled,
    settlementTransactionOperationType:
      'No Settlement Transaction Operation Type',
  });

  await expectFsoContractNotification(env, {
    transactionHash: transactionHash,
    instrumentAddress: scenarioData.instrumentAddress,
    lightSettlementTransactions: [
      {
        id: scenarioData.tradeSettlementTransactionId,
        participantAccountNumbers: {
          securityDeliverer:
            scenarioData.tradeInput.sellerAddresses.deliveryAccountNumber,
          securityReceiver:
            scenarioData.tradeInput.buyerAddresses.deliveryAccountNumber,
          settler: scenarioData.instrumentInput.settlerAgentAddress as string,
          registrar: scenarioData.instrumentInput
            .registrarAgentAddress as string,
          securityIssuer: scenarioData.instrumentInput.issuerAddress as string,
        },
      },
    ],
    notificationName: ContractNotificationName.SettlementTransactionCanceled,
    settlementTransactionOperationType:
      'No Settlement Transaction Operation Type',
  });
}
