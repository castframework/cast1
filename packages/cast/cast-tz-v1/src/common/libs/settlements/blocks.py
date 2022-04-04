from src.globals import *
import src.common.constants.roles as ROLE
import src.common.constants.settlementStatus as ST_STATUS
from src.common.libs.subscription.types import *


def isSettlementTransactionStatusCorrect(SettlementTransactionRepository, settlementTransactionId, expectedStatus):
    sp.if (expectedStatus == ST_STATUS.TOKEN_LOCKED):
        sp.verify(
            SettlementTransactionRepository.settlementTransactionById[
                settlementTransactionId].status == ST_STATUS.TOKEN_LOCKED,
            message="subscription ticket not locked"
        )

    sp.if (expectedStatus == ST_STATUS.CASH_RECEIVED):
        sp.verify(
            SettlementTransactionRepository.settlementTransactionById[
                settlementTransactionId].status == ST_STATUS.CASH_RECEIVED,
            message="Cash Not received"
        )


def abortIfSettlementTransactionIdExist(stR, txId):
    sp.verify(
        ~stR.settlementTransactionById.contains(txId),
        message="settlementTransactionId already in use"
    )


def abortIfOperationExist(settlementTransactionRepository, operationId):
    sp.verify(
        ~ settlementTransactionRepository.operationTypeByOperationId.contains(
            operationId),
        message="operation already exist"
    )


def checkState(state):
    sp.verify(
        ((state == ST_STATUS.CASH_RECEIVED) | (state == ST_STATUS.CASH_SENT)),
        message="state not defined"
    )


def addStateToSatelessST(st: T_settlementTransactionStateless, state: ST_STATUS) -> T_settlementTransaction:
    return sp.record(
        txId=st.txId,
        operationId=st.operationId,
        deliverySenderAccountNumber=st.deliverySenderAccountNumber,
        deliveryReceiverAccountNumber=st.deliveryReceiverAccountNumber,
        deliveryQuantity=st.deliveryQuantity,
        status=state,
        txHash=st.txHash
    )
