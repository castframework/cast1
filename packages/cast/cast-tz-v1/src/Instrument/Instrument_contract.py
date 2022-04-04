import sys
import os
sys.path.append(os.getcwd())

import smartpy as sp
from src.Instrument.types import *
from src.common.debug import *

class Instrument(sp.Contract):
    def __init__(self):
        self.exception_optimization_level = DEBUG_LEVEL
        self.init()
    
    # @sp.onchain_view()
    # def getType(self):
    #     sp.result(self.data.instrumentType)

sp.add_compilation_target("Instrument", (Instrument()))
contract = Instrument()
