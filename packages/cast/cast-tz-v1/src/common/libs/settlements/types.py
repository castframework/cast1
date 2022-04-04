from src.globals import *

from src.common.libs.operators.types import *
from src.common.libs.balances.types import *

T_settlementTransactionId = sp.TNat

T_settlementTransaction = sp.TRecord(
    txId=sp.TNat,
    operationId=sp.TNat,
    deliverySenderAccountNumber=sp.TAddress,
    deliveryReceiverAccountNumber=sp.TAddress,
    deliveryQuantity=sp.TNat,
    status=sp.TNat,
    txHash=sp.TString
)

T_settlementTransactionRepository = sp.TRecord(
    settlementTransactionById=sp.TMap(
        T_settlementTransactionId,
        T_settlementTransaction
    ),
    operationTypeByOperationId=sp.TMap(sp.TNat, sp.TNat),
)

T_settlementTransactionStateless = sp.TRecord(
    txId=sp.TNat,
    operationId=sp.TNat,
    deliverySenderAccountNumber=sp.TAddress,
    deliveryReceiverAccountNumber=sp.TAddress,
    deliveryQuantity=sp.TNat,
    txHash=sp.TString
)

S_confirmPaymentReceived = Signature(
    sp.TRecord(
        txId=sp.TNat,
        sender=sp.TAddress,
        owner=sp.TAddress,
        operatorsAuthorizations=T_operatorsAuthorizations,
        settlementTransactionRepository=T_settlementTransactionRepository,
        balances=T_balances
    ),
    sp.TRecord(
        newSettlementTransactionRepository=T_settlementTransactionRepository,
        newBalances=T_balances
    )
)

S_ConfirmPaymentTransferred = Signature(
    sp.TRecord(
        txId=sp.TNat,
        sender=sp.TAddress,
        owner=sp.TAddress,
        operatorsAuthorizations=T_operatorsAuthorizations,
        settlementTransactionRepository=T_settlementTransactionRepository,
    ),
    T_settlementTransactionRepository
)
