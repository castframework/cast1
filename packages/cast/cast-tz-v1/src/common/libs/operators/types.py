from src.globals import *

T_operatorsAuthorizations = sp.TMap(sp.TAddress, sp.TSet(sp.TNat))

inputT = sp.TRecord(
    _owner=sp.TAddress,
    _sender=sp.TAddress,
    _operatorsAuthorizations=T_operatorsAuthorizations,
    _operator=sp.TAddress,
    _operatorRole=sp.TNat
)

S_ModifyOperatorAutorization = Signature(
    sp.TRecord(
        _owner=sp.TAddress,
        _sender=sp.TAddress,
        _operatorsAuthorizations=T_operatorsAuthorizations,
        _operator=sp.TAddress,
        _operatorRole=sp.TNat
    ),
    T_operatorsAuthorizations
)

S_revokeOperatorAuthorization = S_ModifyOperatorAutorization
S_authorizeOperator = S_ModifyOperatorAutorization
