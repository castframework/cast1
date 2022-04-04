import smartpy as sp

T_tokenMetadata = sp.TRecord(
    name=sp.TString,
    symbol=sp.TString,
    initialSupply=sp.TNat,
    isinCode=sp.TString
)

T_forgeBondCreatedInput = sp.TRecord(
    owner=sp.TAddress,
    registrar=sp.TAddress,
    settler=sp.TAddress,
    tokenAddress=sp.TAddress,
    tokenMetadata=T_tokenMetadata
)

T_forgeStructuredProductCreatedInput = T_forgeBondCreatedInput

T_LightNotif = sp.TRecord(settlementId=sp.TNat)

T_SubscriptionInitiatedInput = T_LightNotif

T_paymentNotif = sp.TRecord(
    settlementId=sp.TNat, settlementTransactionOperationType=sp.TNat)

T_PaymentTransferredInput = T_paymentNotif

T_PaymentReceivedInput = T_paymentNotif

T_operatorChange = sp.TRecord(
    by=sp.TAddress, operator=sp.TAddress, operatorRole=sp.TNat)

T_newOperatorInput = T_operatorChange

T_revokeOperatorInput = T_operatorChange

T_TransferInput = sp.TRecord(
    _from=sp.TAddress,
    _to=sp.TAddress,
    _value=sp.TNat,
)