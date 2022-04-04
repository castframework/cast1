import { ForgeBondInstance } from '../../../../dist/types';
import * as constants from '../../constants';
import { assertEvent, assertEventArgs } from '../../utils/events';
import { buildForgeBond } from '../../utils/builders';
import BigNumber from 'bignumber.js';

const settlementTransactionId1 = '100000000000000000000000000000000000001';
const settlementTransactionId2 = '200000000000000000000000000000000000002';
const settlementTransactionId3 = '300000000000000000000000000000000000003';

const TOKEN_LOCKED = 2;
const CASH_RECEIVED = 3;
const CASH_SENT = 4;
const CANCELED = 5;
const SUBSCRIPTION = 0x1;
const operationId = 0xdab;
const txHash = '0xABBA';

const fromRegistrarTransactionDetails = { from: constants.registrar };

const fromSettlerTransactionDetails = { from: constants.settler };

contract('ForgeBond', (accounts) => {
  let forgeBond: ForgeBondInstance;

  context('Transfer - initiateSubscription ', async function () {
    beforeEach(async function () {
      forgeBond = await buildForgeBond(constants.owner);
    });
    it('should succeed when issuer balance is lower than the transaction quantity', async function () {
      const settlementTransaction1 = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 1000,
        txHash,
      };
      const settlementTransaction2 = {
        txId: settlementTransactionId2,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: 23,
        txHash,
      };
      await forgeBond.initiateSubscription(
        settlementTransaction1,
        fromRegistrarTransactionDetails,
      );
      await forgeBond
        .initiateSubscription(
          settlementTransaction2,
          fromRegistrarTransactionDetails,
        )
        .then((res) => {
          const index = assertEvent(res, 'SubscriptionInitiated');
          assertEventArgs(
            res,
            index,
            'settlementTransactionId',
            settlementTransactionId2,
          );
        })
        .then(async () =>
          assert.equal(
            (
              await forgeBond.getCurrentState(settlementTransactionId1)
            ).toNumber(),
            TOKEN_LOCKED,
          ),
        );
      await forgeBond.getOperationType(operationId).then((res) => {
        assert.equal(
          res.toNumber(),
          SUBSCRIPTION,
          'operationType store in the smartContract should be SUBSCRIPTION',
        );
      });
    });
    it('should succeed when issuer balance is equal to the transaction quantity', async function () {
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 10000,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then((res) => {
          const index = assertEvent(res, 'SubscriptionInitiated');
          assertEventArgs(
            res,
            index,
            'settlementTransactionId',
            settlementTransactionId1,
          );
        })
        .then(async () =>
          assert.equal(
            (
              await forgeBond.getCurrentState(settlementTransactionId1)
            ).toNumber(),
            TOKEN_LOCKED,
          ),
        );
      await forgeBond.getOperationType(operationId).then((res) => {
        assert.equal(
          res.toNumber(),
          SUBSCRIPTION,
          'operationType store in the smartContract should be SUBSCRIPTION',
        );
      });
    });
    it('should fail when not enough token are available on the issuer balance (first transaction)', async function () {
      let res: boolean | undefined;
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 10001,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() => {
          res = true;
        })
        .catch(() => {
          res = false;
        });
      assert.isNotOk(res, 'initiateSubscription should not succeed');
      await forgeBond.getOperationType(operationId).then((res) => {
        assert.equal(
          res.toNumber(),
          0,
          'operationType store in the smartContract should not be SUBSCRIPTION',
        );
      });
    });
    it('should fail when not enough token are available on the issuer balance (second transaction)', async function () {
      let res: boolean | undefined;
      const settlementTransaction1 = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 23,
        txHash,
      };
      const settlementTransaction2 = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: 10000,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction1,
          fromRegistrarTransactionDetails,
        )
        .then(() =>
          forgeBond.initiateSubscription(
            settlementTransaction2,
            fromRegistrarTransactionDetails,
          ),
        )

        .then(() => {
          res = true;
        })
        .catch(() => {
          res = false;
        });
      assert.isNotOk(res, 'initiateSubscription should not succeed');
    });
    it('should fail when operator is not authorised', async function () {
      let res: boolean | undefined;
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 23,
        txHash,
      };
      await forgeBond.initiateSubscription
        .call(settlementTransaction, {
          from: constants.investor1Address,
        })
        .then(() => {
          res = true;
        })
        .catch(() => {
          res = false;
        });
      assert.isNotOk(res, 'initiateSubscription should not succeed');
    });
    it('should fail when deliverySenderAccountNumber is not issuer', async function () {
      let res: boolean | undefined;
      let errorMessage: string | undefined;
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.investor2Address, // Not the owner
        deliveryReceiverAccountNumber: constants.investor1Address,
        deliveryQuantity: 1,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() => {
          res = true;
        })
        .catch((error: any) => {
          res = false;
          errorMessage = error.reason;
        });
      assert.isNotOk(res, 'initiateSubscription should not succeed');
      assert.equal(
        errorMessage,
        'deliverySenderAccountNumber must match token owner',
      );
    });
  });
  context('Transfer - confirmPaymentReceived ', async function () {
    it('should change subscription status to CASH_RECEIVED', async function () {
      const quantity = 1000;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction1 = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      const settlementTransaction2 = {
        txId: settlementTransactionId2,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: 23,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction1,
          fromRegistrarTransactionDetails,
        )

        .then(() =>
          forgeBond.initiateSubscription(
            settlementTransaction2,
            fromRegistrarTransactionDetails,
          ),
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId2,
            fromSettlerTransactionDetails,
          ),
        )
        .then(async () => {
          assert.equal(
            (
              await forgeBond.getCurrentState(settlementTransactionId1)
            ).toNumber(),
            CASH_RECEIVED,
          );
          assert.equal(
            (
              await forgeBond.getCurrentState(settlementTransactionId2)
            ).toNumber(),
            CASH_RECEIVED,
          );
        });
      await forgeBond.getOperationType(operationId).then((res) => {
        assert.equal(
          res.toNumber(),
          SUBSCRIPTION,
          'operationType store in the smartContract should be SUBSCRIPTION',
        );
      });
    });
    it('should emit PaymentReceived event', async function () {
      const quantity = 1000;
      const subscriptionCode = 0x01;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(async (res) => {
          const index = assertEvent(res, 'PaymentReceived');
          assertEventArgs(
            res,
            index,
            'settlementTransactionId',
            settlementTransactionId1,
          );
          assertEventArgs(
            res,
            index,
            'settlementTransactionOperationType',
            new BigNumber(subscriptionCode).toFixed(),
          );
        });
    });
  });
  context('Transfer - confirmPaymentTransferred ', async function () {
    it('should change subscription status to CASH_SENT', async function () {
      const quantity = 1000;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(() =>
          forgeBond.confirmPaymentTransferred(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(async () =>
          assert.equal(
            (
              await forgeBond.getCurrentState(settlementTransactionId1)
            ).toNumber(),
            CASH_SENT,
          ),
        );
    });
    it('should emit PaymentTransferred event', async function () {
      const quantity = 1000;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId1,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(() =>
          forgeBond.confirmPaymentTransferred(
            settlementTransactionId1,
            fromSettlerTransactionDetails,
          ),
        )
        .then(async (res) => {
          const index = assertEvent(res, 'PaymentTransferred');
          assertEventArgs(
            res,
            index,
            'settlementTransactionId',
            settlementTransactionId1,
          );
        });
    });
  });
  context('cancelSettlementTransaction ', async function () {
    it('should cancelTransaction + emit SettlementTransactionCanceled event', async function () {
      const quantity = 1000;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId3,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond
        .initiateTrade(settlementTransaction, fromRegistrarTransactionDetails)
        .then(() =>
          forgeBond.cancelSettlementTransaction(
            settlementTransaction,
            fromRegistrarTransactionDetails,
          ),
        )
        .then(async (res) => {
          const index = assertEvent(res, 'SettlementTransactionCanceled');
          assertEventArgs(
            res,
            index,
            'settlementTransactionId',
            settlementTransactionId3,
          );
        });
      await forgeBond.getCurrentState(settlementTransactionId3).then((res) => {
        assert.equal(
          res.toNumber(),
          CANCELED,
          'operationType store in the smartContract should be CANCELLED',
        );
      });
    });
    it('should fail calling cancelSettlementTransaction if settlementTransaction status !== tockenLocked', async function () {
      const quantity = 1000;
      let res: boolean | undefined;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId3,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond;
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() =>
          forgeBond.confirmPaymentReceived(
            settlementTransactionId3,
            fromSettlerTransactionDetails,
          ),
        )
        .then(() =>
          forgeBond.cancelSettlementTransaction(
            settlementTransaction,
            fromRegistrarTransactionDetails,
          ),
        )
        .then(() => {
          res = true;
        })
        .catch(() => {
          res = false;
        });
      assert.isNotOk(res, 'cancelSettlementTransaction should not succeed');
      await forgeBond.getCurrentState(settlementTransactionId3).then((res) => {
        assert.equal(
          res.toNumber(),
          CASH_RECEIVED,
          'operationType store in the smartContract should be CASH_RECEIVED',
        );
      });
    });

    it('should fail calling cancelSettlementTransaction for a not existing transactionId', async function () {
      const quantity = 1000;
      let res: boolean | undefined;
      forgeBond = await buildForgeBond(constants.owner);
      const settlementTransaction = {
        txId: settlementTransactionId3,
        operationId,
        deliverySenderAccountNumber: constants.owner,
        deliveryReceiverAccountNumber: constants.investor2Address,
        deliveryQuantity: quantity,
        txHash,
      };
      await forgeBond;
      await forgeBond
        .initiateSubscription(
          settlementTransaction,
          fromRegistrarTransactionDetails,
        )
        .then(() => {
          settlementTransaction.txId = settlementTransactionId2;
          return forgeBond.cancelSettlementTransaction(
            settlementTransaction,
            fromRegistrarTransactionDetails,
          );
        })
        .then(() => {
          res = true;
        })
        .catch(() => {
          res = false;
        });
      assert.isNotOk(res, 'cancelSettlementTransaction should not succeed');
      await forgeBond.getCurrentState(settlementTransactionId3).then((res) => {
        assert.equal(
          res.toNumber(),
          TOKEN_LOCKED,
          'operationType store in the smartContract should be TOKEN_LOCKED',
        );
      });
    });
  });
});
