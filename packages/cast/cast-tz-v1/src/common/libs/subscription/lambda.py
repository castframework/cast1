from src.globals import *
import src.common.constants.roles as ROLE
import src.common.constants.settlementStatus as ST_STATUS
import src.common.constants.operations as OP
from src.common.libs.settlements.types import *
from src.common.libs.subscription.types import *

Operator = SPU.importContract(
    "common/libs/operators/blocks.py")
Settlement = SPU.importContract(
    "common/libs/settlements/blocks.py")
Balances = SPU.importContract(
    "common/libs/balances/blocks.py")


@safeLambda(S_initiateSubscription)
def initiateSubscription(params):
    Operator.isOperatorWithRoleAuthorized(
        params.sender,
        params.operatorsAuthorizations,
        ROLE.REGISTRAR
    )

    M_stR = sp.local(
        "settlementRepositoryTransaction",
        params.settlementTransactionRepository
    ).value

    M_balances = sp.local("balances", params.balances).value

    st = params.newSettlementTransaction
    txId = params.newSettlementTransaction.txId
    operationId = params.newSettlementTransaction.operationId

    # Settlement.abortIfSettlementTransactionIdExist(M_stR, txId)

    M_balances = Balances.lock(
        M_balances,
        st.deliverySenderAccountNumber,
        st.deliveryQuantity
    )

    M_stR.settlementTransactionById[txId] = Settlement.addStateToSatelessST(
        st,
        ST_STATUS.TOKEN_LOCKED
    )
    M_stR.operationTypeByOperationId[operationId] = OP.SUBSCRIPTION

    return sp.record(
        newSettlementRepository=M_stR,
        newBalances=M_balances,
    )
