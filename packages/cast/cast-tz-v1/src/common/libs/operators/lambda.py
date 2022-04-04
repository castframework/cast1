from src.globals import *
import src.common.constants.roles as ROLE
from src.common.libs.operators.types import *

OperatorBlocks = SPU.importContract(
    "common/libs/operators/blocks.py")


@safeLambda(S_authorizeOperator)
def authorizeOperator(params: S_authorizeOperator.inputType):
    # Verify sender is registrar
    # self.onlyIssuer(params._sender, params._owner)
    OperatorBlocks.isOperatorWithRoleAuthorized(
        params._sender, params._operatorsAuthorizations, ROLE.REGISTRAR)

    operatorsAuthorizations = sp.local(
        "operatorsAuthorizations", params._operatorsAuthorizations)

    sp.if ~ operatorsAuthorizations.value.contains(params._operator):
        operatorsAuthorizations.value[params._operator] = sp.set(t=sp.TNat)

    # verify if operator is already existant with the same role.
    sp.verify(operatorsAuthorizations.value[params._operator].contains(
        params._operatorRole), message="already authorized")

    operatorsAuthorizations.value[params._operator].add(
        params._operatorRole)

    return operatorsAuthorizations.value


@safeLambda(S_revokeOperatorAuthorization)
def revokeOperatorAuthorization(params):
    OperatorBlocks.isOperatorWithRoleAuthorized(
        params._sender, params._operatorsAuthorizations, ROLE.REGISTRAR)

    operatorsAuthorizations = sp.local(
        "operatorsAuthorizations", params._operatorsAuthorizations)

    sp.verify(operatorsAuthorizations.value.contains(
        params._operator), message="undefined operator")

    sp.verify(operatorsAuthorizations.value[params._operator].contains(
        params._operatorRole), message="undefined operator role")

    operatorsAuthorizations.value[params._operator].remove(
        params._operatorRole)

    return operatorsAuthorizations.value
