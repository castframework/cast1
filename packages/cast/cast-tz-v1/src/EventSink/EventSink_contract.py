import sys
import os
sys.path.append(os.getcwd())

import smartpy as sp
import src.ForgeInstrumentRegistry.types as InstrumentTypes
from src.EventSink.types import *


class EventSink(sp.Contract):
    def __init__(self):
        self.init()

    @sp.entry_point
    def forgeBondCreated(self, params):
        sp.set_type(params, T_forgeBondCreatedInput)

    @sp.entry_point
    def forgeStructuredProductCreated(self, params):
        sp.set_type(params, T_forgeStructuredProductCreatedInput)

    @sp.entry_point
    def SubscriptionInitiated(self, params):
        sp.set_type(params, T_SubscriptionInitiatedInput)

    @sp.entry_point
    def PaymentTransferred(self, params):
        sp.set_type(params, T_PaymentTransferredInput)

    @sp.entry_point
    def PaymentReceived(self, params):
        sp.set_type(params, T_PaymentReceivedInput)

    @sp.entry_point
    def newOperator(self, params):
        sp.set_type(params, T_newOperatorInput)

    @sp.entry_point
    def revokeOperator(self, params):
        sp.set_type(params, T_revokeOperatorInput)

    @sp.entry_point
    def InstrumentListed(self, params):
        sp.set_type(params, InstrumentTypes.Tinstrument)

    @sp.entry_point
    def InstrumentUnlisted(self, params):
        sp.set_type(params, InstrumentTypes.Tinstrument)

    @sp.entry_point
    def Transfer(self, params):
        sp.set_type(params, T_TransferInput)

sp.add_compilation_target("EventSink", (EventSink()))
contract = EventSink()
