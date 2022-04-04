import sys
import os
sys.path.append(os.getcwd())

import smartpy as sp
import src.ForgeInstrumentRegistry.types as Types
from src.ForgeInstrumentRegistry.constants import *

class ForgeInstrumentRegistry(sp.Contract):
    def __init__(self, eventSinkContractAddress, registrarAddress):
        #self.exception_optimization_level = "FullDebug"
        self.init_type(Types.TDataStorage)
        self.init(
            tokensByIsinCode=sp.map(tkey=sp.TString, tvalue=Types.Tinstrument),
            tokensByName=sp.map(tkey=sp.TString, tvalue=Types.Tinstrument),
            eventSinkContractAddress=eventSinkContractAddress,
            registrarAddress=registrarAddress,
            factories=sp.map(tkey=sp.TString, tvalue=sp.TAddress)
        )

    @sp.entry_point
    def authorizeFactory(self, params):
        sp.set_type(params, sp.TRecord(factoryAddress=sp.TAddress, factoryType=sp.TString).layout(("factoryType", "factoryAddress")))
        self.failIfSenderIsNotRegistryOwner()
        self.data.factories[params.factoryType] = params.factoryAddress

    @sp.entry_point
    def unAuthorizeFactory(self, factoryAddress):
        self.failIfSenderIsNotRegistryOwner()

        sp.for x in self.data.factories.items():
            sp.if (x.value == factoryAddress):
                del self.data.factories[x.key]

    @sp.entry_point
    def listInstrument(self, instrument=Types.Tinstrument):
        self.failIfSenderIsNotAuthorizedFactory()
        self.failIfNameExist(instrument.name)
        self.failIfIsinExist(instrument.isin)
        self.data.tokensByIsinCode[instrument.isin] = instrument
        self.data.tokensByName[instrument.name] = instrument
        self.callEventSink(EVENT_INSTRUMENT_LISTED, instrument)

    @sp.entry_point
    def unlistInstrument(self, isin):
        self.failIfSenderIsNotAuthorizedFactory()
        self.failIfIsinDoesNotExist(isin)
        instrument = self.data.tokensByIsinCode[isin]
        self.callEventSink(EVENT_INSTRUMENT_UNLISTED, instrument)
        del self.data.tokensByName[instrument.name]
        del self.data.tokensByIsinCode[isin]

    def failIfNameExist(self, name):
        sp.verify(~ self.data.tokensByName.contains(name),
                  message="Token with this name already exists")

    def failIfIsinExist(self, isinCode):
        sp.verify(~ self.data.tokensByIsinCode.contains(isinCode),
                  message="Token with this isin already exists")

    def failIfIsinDoesNotExist(self, isinCode):
        sp.verify(self.data.tokensByIsinCode.contains(isinCode),
                  message="No Token with this isin exists")

    def failIfSenderIsNotAuthorizedFactory(self):
        present = sp.local('present', False)
        sp.for x in self.data.factories.items():
            sp.if (x.value == sp.sender):
                present.value = True

        sp.verify(present.value,
                  message="Sender is not an authorized factory")
    
    def failIfSenderIsNotRegistryOwner(self):
        sp.verify(self.data.registrarAddress == sp.sender,
                  message="Sender is not the registry owner")


    def callEventSink(self, eventName, params):
        maybeContract = sp.contract(
            t=Types.Tinstrument,
            address=self.data.eventSinkContractAddress,
            entry_point=eventName
        )
        sp.verify(maybeContract.is_some(), "test error")
        c = maybeContract.open_some()
        sp.transfer(params, sp.mutez(0), c)

    # Those are pure getter leave them here for interface remembering
    # As we can run any python code we may extends smartpy to generate
    # metadata for the client to use. Extending smartpy would allow us
    # to keep type safety in getter code.
    #
    # @sp.entry_point
    # def getInstrumentByName(self,name):
    #   pass
    # @sp.entry_point
    # def getInstrumentByIsinCode(self,isin):
    #   pass
    # @sp.entry_point
    # def getAllInstruments(self):
    #   pass

sp.add_compilation_target("ForgeInstrumentRegistry", (ForgeInstrumentRegistry(sp.address("tz1@SINK@"), sp.address("tz1@REGISTRAR@"))))
contract = ForgeInstrumentRegistry(sp.address("tz1@SINK@"), sp.address("tz1@REGISTRAR@"))
