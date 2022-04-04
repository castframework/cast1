from src.common.libs.operators.types import *
from src.common.libs.settlements.types import *
from src.common.libs.balances.types import *

T_forgeBondStorage = sp.TRecord(
    settlementTransactionRepository=T_settlementTransactionRepository,
    balances=T_balances,
    operatorsAuthorizations=T_operatorsAuthorizations,
    entrypointsBigMap=sp.TBigMap(sp.TBytes, sp.TBytes),
    owner=sp.TAddress,
    initialSupply=sp.TNat,
    currentSupply=sp.TNat,
    isinCode=sp.TString,
    name=sp.TString,
    symbol=sp.TString,
    currency=sp.TString,
    eventSinkContractAddress=sp.TAddress
)
