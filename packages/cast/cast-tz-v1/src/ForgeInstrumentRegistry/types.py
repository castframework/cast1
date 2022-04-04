import smartpy as sp

Tinstrument = sp.TRecord(
    name=sp.TString,
    isin=sp.TString,
    address=sp.TAddress,
)

TinstrumentMap = sp.TMap(
    sp.TString,
    Tinstrument,
)

TfactoryMap = sp.TMap(
    sp.TString,
    sp.TAddress,
)

TDataStorage = sp.TRecord(
    tokensByIsinCode=TinstrumentMap,
    tokensByName=TinstrumentMap,
    eventSinkContractAddress=sp.TAddress,
    registrarAddress=sp.TAddress,
    factories=TfactoryMap,
)
