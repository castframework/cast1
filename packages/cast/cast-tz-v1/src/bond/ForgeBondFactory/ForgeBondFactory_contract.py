import sys
import os
sys.path.append(os.getcwd())

import smartpy as sp
from src.bond.ForgeBondFactory.constants import *
from src.common.constants.init import *
import src.common.constants.roles as ROLE
import src.smpUtils as smpUtils

ForgeBond = smpUtils.importContract(
    "bond/ForgeBond/ForgeBond_contract.py").ForgeBond


class ForgeBondFactory(sp.Contract):
    def __init__(self, admin, eventSinkContractAddress, registrarAddress):

        self.forgeBond = ForgeBond()

        self.init(
            admin=admin,
            entrypointsBigMap=sp.big_map(
                tkey=sp.TBytes,
                tvalue=sp.TBytes
            ),
            eventSinkContractAddress=eventSinkContractAddress,
            registrarAddress=registrarAddress
        )

    def newInitialBalances(self, initialSupply, issuer):
        return sp.map({
            issuer: sp.record(balance=initialSupply, locked=sp.nat(0))
        })

    def createForgeBondContract(self, registryAddress, owner, registrar, settler, initialSupply, isinCode, name, symbol, currency):

        createdForgeBondAddress = sp.create_contract(
            storage=sp.record(
                settlementTransactionRepository=sp.record(
                    settlementTransactionById=sp.map(
                        tkey=T_settlementTransactionId, tvalue=T_settlementTransaction),
                    operationTypeByOperationId=sp.map(
                        tkey=sp.TNat, tvalue=sp.TNat),
                ),
                operatorsAuthorizations=sp.map({
                    registrar: sp.set([ROLE.REGISTRAR]),
                    settler: sp.set([ROLE.SETTLER])
                }),
                entrypointsBigMap=self.data.entrypointsBigMap,
                owner=owner,
                initialSupply=initialSupply,
                currentSupply=initialSupply,
                isinCode=isinCode,
                name=name,
                symbol=symbol,
                currency=currency,
                eventSinkContractAddress=self.data.eventSinkContractAddress,
                balances=self.newInitialBalances(initialSupply, owner)
            ),
            contract=self.forgeBond
        )

        sp.set_type(createdForgeBondAddress, sp.TAddress)

        self.callInstrumentRegistry(registryAddress, sp.record(
            name=name,
            isin=isinCode,
            address=createdForgeBondAddress,
        ))

        return createdForgeBondAddress

    def callEventSink(self, params):
        entryPointName = "forgeBondCreated"

        maybeContract = sp.contract(
            t=sp.TRecord(owner=sp.TAddress, registrar=sp.TAddress, settler=sp.TAddress, tokenAddress=sp.TAddress,
                         tokenMetadata=sp.TRecord(name=sp.TString, symbol=sp.TString, initialSupply=sp.TNat, isinCode=sp.TString, currency=sp.TString)),
            address=self.data.eventSinkContractAddress,
            entry_point=entryPointName
        )
        sp.verify(maybeContract.is_some(), "Bad event sink contract address")
        contract = maybeContract.open_some()

        sp.transfer(params, sp.mutez(0), contract)

    def callInstrumentRegistry(self, registryAddress, params):
        maybeContract = sp.contract(
            t=sp.TRecord(
                name=sp.TString,
                isin=sp.TString,
                address=sp.TAddress,
            ),
            address=registryAddress,
            entry_point=REGISTRY_ENTRY_POINT,
        )
        sp.verify(maybeContract.is_some(), "Bad instrument registry address")
        contract = maybeContract.open_some()

        sp.transfer(params, sp.mutez(0), contract)

    def failISenderIsNotFactoryRegistrar(self):
        sp.verify(sp.sender == self.data.registrarAddress,
                        message="Calling address should match factory registrar agent")

    @ sp.entry_point
    def createForgeBond(self, params):

        sp.set_type(params, sp.TRecord(registryAddress = sp.TAddress,
         initialSupply = sp.TNat,
         isinCode = sp.TString,
         name = sp.TString,
         symbol = sp.TString,
         denomination = sp.TNat,
         divisor = sp.TNat,
         startDate = sp.TNat,
         initialMaturityDate = sp.TNat,
         firstCouponDate = sp.TNat,
         couponFrequencyInMonths = sp.TNat,
         interestRateInBips = sp.TNat,
         callable = sp.TBool,
         isSoftBullet = sp.TBool,
         softBulletPeriodInMonths = sp.TNat,
        currency = sp.TString,
         registrar = sp.TAddress,
         settler = sp.TAddress,
         owner = sp.TAddress).layout(("registryAddress",
         ("initialSupply",
         ("isinCode",
         ("name",
         ("symbol",
         ("denomination",
         ("divisor",
         ("startDate",
         ("initialMaturityDate",
         ("firstCouponDate",
         ("couponFrequencyInMonths",
         ("interestRateInBips",
         ("callable",
         ("isSoftBullet",
         ("softBulletPeriodInMonths",
         ("currency",
         ("registrar",
         ("settler",
        "owner"))))))))))))))))))))

        self.failISenderIsNotFactoryRegistrar()
        sp.verify(sp.sender == params.registrar,
                  message="Calling address should match bond registrar agent")

        # TODO: Check if entrypoints are built

        createdForgeBondAddress = self.createForgeBondContract(
            registryAddress=params.registryAddress,
            owner=params.owner,
            initialSupply=params.initialSupply,
            isinCode=params.isinCode,
            name=params.name,
            symbol=params.symbol,
            currency=params.currency,
            settler=params.settler,
            registrar=params.registrar
        )

    @sp.entry_point
    def upgrade(self, params):
        sp.set_type(params, sp.TMap(sp.TBytes, sp.TBytes))

        sp.verify(((sp.sender == self.data.admin) | (
            sp.source == self.data.admin)), message="only admin can upgrade")

        sp.for x in params.items():
            self.data.entrypointsBigMap[x.key] = x.value

contract = ForgeBondFactory(
    sp.address("tz1@ADMIN@"),  # admin
    sp.address("tz1@SINK@"),  # Event Sink
    sp.address("tz1@REGISTRAR@")  # registrar
)
sp.add_compilation_target("ForgeBondFactory", contract)
