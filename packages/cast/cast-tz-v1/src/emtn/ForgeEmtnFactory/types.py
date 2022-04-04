import smartpy as sp

subscriptionIdType = sp.TNat

subscriptionTicketType = sp.TRecord(
    investor=sp.TAddress, quantity=sp.TNat, status=sp.TNat)

balancesType = sp.TRecord(data=sp.TMap(
    sp.TAddress, sp.TRecord(keyIndex=sp.TNat, value=sp.TNat)))

balancesInit = sp.record(data=sp.map(
    tkey=sp.TAddress, tvalue=sp.TRecord(keyIndex=sp.TNat, value=sp.TNat)))

subscriptionTicketManagerType = sp.TRecord(
    subscriptionsIdByIssuer=sp.TMap(sp.TAddress, sp.TSet(subscriptionIdType)),
    subscriptionTicket=sp.TMap(sp.TNat, subscriptionTicketType),
    balances=balancesType
)

subscriptionTicketManagerInit = sp.record(
    subscriptionsIdByIssuer=sp.map(
        tkey=sp.TAddress, tvalue=sp.TSet(subscriptionIdType)),
    subscriptionTicket=sp.map(tkey=sp.TNat, tvalue=subscriptionTicketType),
    balances=balancesInit
)

operatorsAuthorizationsType = sp.TMap(sp.TAddress, sp.TSet(sp.TNat))

operatorsAuthorizationsInit = sp.map(sp.TAddress, sp.TSet(sp.TNat))
