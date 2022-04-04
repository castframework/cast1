import smartpy as sp

T_balance = sp.TRecord(balance=sp.TNat, locked=sp.TNat)

T_balances = sp.TMap(
    sp.TAddress, T_balance
)
