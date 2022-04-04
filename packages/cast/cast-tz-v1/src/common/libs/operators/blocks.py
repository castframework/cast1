from src.globals import *
import src.common.constants.roles as ROLE
import src.common.constants.settlementStatus as ST_STATUS


def isOperatorWithRoleAuthorized(sender, operatorsAuthorizations, operatorRole):
    sp.verify(operatorsAuthorizations.contains(
        sender), message="undefined operator")

    sp.if (operatorRole == ROLE.REGISTRAR):
        sp.verify(
            operatorsAuthorizations[sender].contains(ROLE.REGISTRAR),
            message="only operator with registrar role can lock token")

    sp.if (operatorRole == ROLE.SETTLER):
        sp.verify(
            operatorsAuthorizations[sender].contains(ROLE.SETTLER),
            message="only operator with settler role can settle token")


def onlyIssuer(sender, owner):
    sp.verify((owner == sender),
              message="Only issuer can perform this action")
