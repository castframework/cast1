from src.globals import *
from src.common.libs.balances.types import *


def lock(balances: T_balances, account: sp.TAddress, quantity: sp.TNat) -> T_balances:
    sp.verify(
        balances.contains(account),
        message="Attempt to lock empty balances"
    )
    sp.verify(
        balances[account].balance -
        balances[account].locked >= sp.to_int(quantity),
        message="Can not lock value : insufficient disposable balance"
    )

    M_newBalances = sp.local('balancesInLock', balances).value

    M_newBalances[account].locked = balances[account].locked + quantity

    return M_newBalances
