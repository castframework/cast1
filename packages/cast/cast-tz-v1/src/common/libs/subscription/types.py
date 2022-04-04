from src.globals import *
from src.common.libs.balances.types import *
from src.common.libs.operators.types import *
from src.common.libs.settlements.types import *

T_initiateSubscriptionInput = sp.TRecord(
    sender=sp.TAddress,
    newSettlementTransaction=T_settlementTransactionStateless,
    settlementTransactionRepository=T_settlementTransactionRepository,
    operatorsAuthorizations=T_operatorsAuthorizations,
    balances=T_balances
)

T_initiateSubscriptionOutput = sp.TRecord(
    newSettlementRepository=T_settlementTransactionRepository,
    newBalances=T_balances
)

S_initiateSubscription = Signature(
    T_initiateSubscriptionInput, T_initiateSubscriptionOutput)
