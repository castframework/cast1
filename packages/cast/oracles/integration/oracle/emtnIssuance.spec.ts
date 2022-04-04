import delay from 'delay';
import { describe } from 'mocha';
import { step } from 'mocha-steps';
import {
  initNotificationFeeds,
  setupEnv,
  shutdownEnv,
} from '../utils/setupEnv';
import { Env, ScenarioData } from './types';
import {
  subscriptionSettlementReceivedStep,
  subscriptionSettlementTransferredStep,
  subscriptionStep,
  validatePositionsAfterSubscriptionSettlementStep,
  validatePositionsAfterSubscriptionStep,
} from './steps/subscription';
import { checkNotificationFeeds } from './helpers/checkNotificationFeeds';
import { Ledger, InstrumentType } from '@castframework/models';
import { createEmtnStep } from './steps/createEmtn';
import { validatePositionsAfterIssuanceStep } from './steps/issuance';

const networkDelay = 5;

const scenarioData: ScenarioData<InstrumentType.EMTN> = {
  scenarioName: 'EMTN Issuance IT',

  ledger: Ledger.TEZOS,
  instrumentType: InstrumentType.EMTN,

  // Issuance
  instrumentInput: null as any, // Will be generated

  instrumentAddress: null as any, // Will be generated

  // Subscription data
  subscriptionInput: null as any, // Will be generated
  subscriptionSettlementTransactionIds: [], // Will be generated

  // Trade data
  tradeInput: null as any, // Will be generated
  tradeSettlementTransactionId: null as any, // Will be generated

  // Redemption data
  redemptionInput: null as any, // Will be generated
  redemptionSettlementTransactionIds: [], // Will be generated
};

describe(scenarioData.scenarioName, () => {
  let env: Env;

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const startAll = async function () {
    this.timeout(100000);
    env = await setupEnv({
      name: 'scenario',
    });
    await delay(10000);
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const closeAll = async function () {
    this.timeout(100000);
    await shutdownEnv(env);
  };

  describe(`EMTN issuance - issuance and subscription`, () => {
    before(startAll);

    after(closeAll);

    beforeEach('Reset event feeds', () => {
      initNotificationFeeds(env);
    });

    afterEach('Check event feeds', async () => {
      await checkNotificationFeeds(env);
    });

    step('Create instrument', async () => {
      await createEmtnStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    step('Validate positions after issuance', async () => {
      await validatePositionsAfterIssuanceStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    // step('Validate instrument details', async () => {
    //   await validateEmtnDetailsStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);

    step('Subscription', async () => {
      await subscriptionStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    step('Validate positions after subscription', async () => {
      await validatePositionsAfterSubscriptionStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    // step('Settlement transferred before received should fail', async () => {
    //   await failingSubscriptionSettlementTransferred(env, scenarioData);
    // }).timeout(60000 * networkDelay);

    step('Subscription settlement received', async () => {
      await subscriptionSettlementReceivedStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    step('Subscription settlement transferred', async () => {
      await subscriptionSettlementTransferredStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    step('Validate positions after subscription settlement', async () => {
      await validatePositionsAfterSubscriptionSettlementStep(env, scenarioData);
    }).timeout(60000 * networkDelay);

    // step('Trade', async () => {
    //   await tradeStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Trade settlement received', async () => {
    //   await tradeSettlementReceivedStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Trade settlement transferred', async () => {
    //   await tradeSettlementTransferredStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Redemption', async () => {
    //   await redemptionStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Redemption settlement received', async () => {
    //   await redemptionSettlementReceivedStep(env, scenarioData);
    // }).timeout(5 * 60000 * networkDelay);
    //
    // step('Redemption settlement transferred', async () => {
    //   await redemptionSettlementTransferredStep(env, scenarioData);
    // }).timeout(5 * 60000 * networkDelay);
    //
    // step('Validate positions after redemption', async () => {
    //   await validatePositionsAfterRedemptionStep(env, scenarioData);
    // }).timeout(5 * 60000 * networkDelay);
    //
    // step('Redemption on redeemed instrument should fail', async () => {
    //   await failingRedemptionStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Subscription on redeemed instrument should fail', async () => {
    //   await failingSubscriptionStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
    //
    // step('Trade on redeemed instrument should fail', async () => {
    //   await failingTradeStep(env, scenarioData);
    // }).timeout(60000 * networkDelay);
  });
}).timeout(180000 * networkDelay);
