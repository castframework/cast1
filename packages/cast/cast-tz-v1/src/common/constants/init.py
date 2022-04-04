import smartpy as sp
from src.common.libs.balances.types import *
from src.common.libs.settlements.types import *

balancesInit = sp.map(tkey=sp.TAddress, tvalue=T_balance)

settlementTransactionRepositoryInit = sp.record(
    settlementTransactionById=sp.map(
        tkey=T_settlementTransactionId, tvalue=T_settlementTransaction),
    operationTypeByOperationId=sp.map(tkey=sp.TNat, tvalue=sp.TNat),
)

operatorsAuthorizationsInit = sp.map(sp.TAddress, sp.TSet(sp.TNat))
