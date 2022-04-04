from src.globals import *
import src.common.constants.roles as ROLE
import src.common.constants.settlementStatus as ST_STATUS
from src.common.libs.subscription.types import *

OperatorBlocks = SPU.importContract(
    "common/libs/operators/blocks.py")
SettlementBlocks = SPU.importContract(
    "common/libs/settlements/blocks.py")


@safeLambda(S_confirmPaymentReceived)
def confirmPaymentReceived(params):
    OperatorBlocks.isOperatorWithRoleAuthorized(
        params.sender,
        params.operatorsAuthorizations,
        ROLE.SETTLER
    )

    M_str = sp.local(
        "settlementTransactionRepository",
        params.settlementTransactionRepository
    ).value

    M_balances = sp.local("balances", params.balances).value

    # SettlementBlocks.isSettlementTransactionStatusCorrect(
    #     M_str,
    #     params.txId,
    #     ST_STATUS.TOKEN_LOCKED
    # )

    txId = params.txId

    issuer = params.owner

    investor = M_str.settlementTransactionById[txId].deliveryReceiverAccountNumber

    amount = M_str.settlementTransactionById[txId].deliveryQuantity

    sp.if ~ M_balances.contains(investor):
        M_balances[investor] = sp.record(locked=sp.nat(0), balance=sp.nat(0))

    M_balances[investor].balance += amount
    M_balances[issuer].balance = sp.as_nat(M_balances[issuer].balance - amount)
    M_balances[issuer].locked = sp.as_nat(M_balances[issuer].locked - amount)
    M_str.settlementTransactionById[txId].status = ST_STATUS.CASH_RECEIVED

    return sp.record(
        newSettlementTransactionRepository=M_str,
        newBalances=M_balances
    )


@safeLambda(S_ConfirmPaymentTransferred)
def confirmPaymentTransferred(params):
    OperatorBlocks.isOperatorWithRoleAuthorized(
        params.sender,
        params.operatorsAuthorizations,
        ROLE.SETTLER
    )
    txId = params.txId

    M_str = sp.local(
        "settlementTransactionRepository",
        params.settlementTransactionRepository
    ).value

    SettlementBlocks.isSettlementTransactionStatusCorrect(
        M_str,
        txId,
        ST_STATUS.CASH_RECEIVED
    )

    M_str.settlementTransactionById[txId].status = ST_STATUS.CASH_SENT

    return M_str
