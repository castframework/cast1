import sys
import os
sys.path.append(os.getcwd())

import smartpy as sp
import src.smpUtils as smpUtils

from src.bond.ForgeBond.types import *
import src.EventSink.constants as EVENT
import src.bond.CreateAndPlayBuilder.lambdaName as LAMBDA
import src.common.constants.roles as ROLE
import src.common.constants.settlementStatus as ST_STATUS
import src.EventSink.types as T_Event
from src.common.constants.init import *
import src.common.constants.operations as OP

from src.common.libs.subscription.types import *
from src.common.libs.settlements.types import *
from src.common.debug import *

Instrument = smpUtils.importContract(
    "Instrument/Instrument_contract.py").Instrument


class ForgeBond(Instrument):
    def __init__(self):
        self.exception_optimization_level = DEBUG_LEVEL
        self.init_type(T_forgeBondStorage)
        #self.update_initial_storage(instrumentType='Bond')

    ############# FOR TEST PURPOSES #############
    @sp.entry_point
    def upgrade(self, params):

        sp.verify(((sp.sender == self.data.owner) | (
            sp.source == self.data.owner)), message="only owner can upgrade")

        sp.for x in params.items():
            self.data.entrypointsBigMap[x.key] = x.value

    def callEventSinkWithSettlementId(self, settlementId, eventName):

        maybeContract = sp.contract(
            t=T_Event.T_LightNotif,
            address=self.data.eventSinkContractAddress,
            entry_point=eventName
        )
        sp.verify(maybeContract.is_some(), "Bad event sink contract address")

        sp.transfer(
            sp.record(
                settlementId=settlementId,
            ),
            sp.mutez(0),
            maybeContract.open_some()
        )

    def callEventSinkWithSettlementIdAndSettlementTransactionOperationType(self, settlementId, settlementTransactionOperationType, eventName):

        maybeContract = sp.contract(
            t=T_Event.T_paymentNotif,
            address=self.data.eventSinkContractAddress,
            entry_point=eventName
        )
        sp.verify(maybeContract.is_some(), "Bad event sink contract address")

        sp.transfer(
            sp.record(
                settlementId=settlementId,
                settlementTransactionOperationType=settlementTransactionOperationType,
            ),
            sp.mutez(0),
            maybeContract.open_some()
        )

    def callOperatorEventSink(self, operator, operatorRole, eventName):
        maybeContract = sp.contract(
            t=T_Event.T_operatorChange,
            address=self.data.eventSinkContractAddress,
            entry_point=eventName
        )
        sp.verify(maybeContract.is_some(), "Bad event sink contract address")

        sp.transfer(
            sp.record(by=sp.sender, operator=operator,
                      operatorRole=operatorRole),
            sp.tez(0),
            maybeContract.open_some())

    def callEventSinkTransfer(self, txId, stR):
        st = stR.settlementTransactionById[txId]

        transferInfo = sp.record(
            _from=st.deliverySenderAccountNumber,
            _to=st.deliveryReceiverAccountNumber,
            _value=st.deliveryQuantity,
        )

        sp.set_type(transferInfo, T_Event.T_TransferInput)

        maybeContract = sp.contract(
            t=T_Event.T_TransferInput,
            address=self.data.eventSinkContractAddress,
            entry_point=EVENT.TRANSFER
        )
        sp.verify(maybeContract.is_some(), "Bad event sink contract address")

        sp.transfer(
            transferInfo,
            sp.tez(0),
            maybeContract.open_some())



    ############# ENTRYPOINTS: #############

    ############# initiateSubscription #############

    @sp.entry_point
    def initiateSubscription(self, params):
        sp.set_type(params, sp.TRecord(txId = sp.TNat, operationId = sp.TNat, deliverySenderAccountNumber = sp.TAddress, deliveryReceiverAccountNumber = sp.TAddress, deliveryQuantity = sp.TNat, txHash = sp.TString).layout(("txId", ("operationId", ("deliverySenderAccountNumber",("deliveryReceiverAccountNumber",("deliveryQuantity","txHash")))))))

        L_initSubscription = loadLambda(
            self.data.entrypointsBigMap,
            LAMBDA.INITIATE_SUBSCRIPTION,
            S_initiateSubscription
        )

        sp.verify(~self.data.settlementTransactionRepository.settlementTransactionById.contains(
            params.txId), message="settlementTransactionId already used")

        sp.verify_equal(self.data.owner, params.deliverySenderAccountNumber, message="deliverySenderAccountNumber must match token owner")

        newSettlementTransaction = sp.record(
            txId=params.txId,
            operationId=params.operationId,
            deliverySenderAccountNumber=params.deliverySenderAccountNumber,
            deliveryReceiverAccountNumber=params.deliveryReceiverAccountNumber,
            deliveryQuantity=params.deliveryQuantity,
            txHash=params.txHash
        )

        result = L_initSubscription(sp.record(
            sender=sp.sender,
            newSettlementTransaction=newSettlementTransaction,
            settlementTransactionRepository=self.data.settlementTransactionRepository,
            operatorsAuthorizations=self.data.operatorsAuthorizations,
            balances=self.data.balances
        ))

        self.data.settlementTransactionRepository = result.newSettlementRepository
        self.data.balances = result.newBalances

        self.callEventSinkWithSettlementId(
            settlementId=params.txId,
            eventName=EVENT.SUBSCRIPTION_INITIATED
        )

    ############# confirmPaymentReceived #############

    @sp.entry_point
    def confirmPaymentReceived(self, params):

        sp.verify(
            self.data.settlementTransactionRepository.settlementTransactionById[
                params.txId].status == ST_STATUS.TOKEN_LOCKED,
            message="subscription ticket not locked"
        )

        L_confirmPaymentReceived = loadLambda(
            self.data.entrypointsBigMap,
            LAMBDA.CONFIRM_PAYMENT_RECEIVED,
            S_confirmPaymentReceived
        )

        result = L_confirmPaymentReceived(sp.record(
            txId=params.txId,
            sender=sp.sender,
            owner=self.data.owner,
            operatorsAuthorizations=self.data.operatorsAuthorizations,
            settlementTransactionRepository=self.data.settlementTransactionRepository,
            balances=self.data.balances
        ))

        self.data.settlementTransactionRepository = result.newSettlementTransactionRepository
        self.data.balances = result.newBalances

        self.callEventSinkTransfer(params.txId, self.data.settlementTransactionRepository)

        self.callEventSinkWithSettlementIdAndSettlementTransactionOperationType(
            settlementId=params.txId,
            settlementTransactionOperationType=OP.SUBSCRIPTION,
            eventName=EVENT.PAYMENT_RECEIVED
        )

    ############# confirmPaymentTransferred #############

    @sp.entry_point
    def confirmPaymentTransferred(self, params):

        L_confirmPaymentTransferred = loadLambda(
            self.data.entrypointsBigMap,
            LAMBDA.CONFIRM_PAYMENT_TRANSFERRED,
            S_ConfirmPaymentTransferred
        )

        result = L_confirmPaymentTransferred(sp.record(
            txId=params.txId,
            sender=sp.sender,
            owner=self.data.owner,
            operatorsAuthorizations=self.data.operatorsAuthorizations,
            settlementTransactionRepository=self.data.settlementTransactionRepository,
        ))

        self.data.settlementTransactionRepository = result

        self.callEventSinkWithSettlementIdAndSettlementTransactionOperationType(
            settlementId=params.txId,
            settlementTransactionOperationType=OP.SUBSCRIPTION,
            eventName=EVENT.PAYMENT_TRANSFERRED
        )

    ############# authorizeOperator & revokeOperatorAuthorization #############

    @sp.entry_point
    def run(self, params):
        sp.set_type(params, sp.TRecord(entrypointName=sp.TString,
                                       _operator=sp.TAddress, _operatorRole=sp.TNat))

        # entrypointName = callAuthorizeOperator or callRevokeOperatorAuthorization
        epBytesScript = self.data.entrypointsBigMap[sp.pack(
            params.entrypointName)]

        epScript = sp.unpack(
            epBytesScript,
            t=sp.TLambda(
                sp.TRecord(
                    _owner=sp.TAddress,
                    _sender=sp.TAddress,
                    _operatorsAuthorizations=T_operatorsAuthorizations,
                    _operator=sp.TAddress,
                    _operatorRole=sp.TNat
                ),
                T_operatorsAuthorizations
            ))

        epParams = sp.record(
            _owner=self.data.owner,
            _sender=sp.sender,
            _operatorsAuthorizations=self.data.operatorsAuthorizations,
            _operator=params._operator,
            _operatorRole=params._operatorRole
        )

        updatedOperatorsAuthorizations = epScript.open_some()(epParams)

        self.data.operatorsAuthorizations = updatedOperatorsAuthorizations

        # EventSink call will be fired according to entrypoint name passed in params only after operation success.

        sp.if (params.entrypointName == LAMBDA.AUTHORIZE_OPERATOR):
            self.callOperatorEventSink(
                params._operator, params._operatorRole, "newOperator")
        sp.if (params.entrypointName == LAMBDA.REVOKE_OPERATOR_AUTHORIZATION):
            self.callOperatorEventSink(
                params._operator, params._operatorRole, "revokeOperator")

sp.add_compilation_target("ForgeBond", (ForgeBond()))
contract = ForgeBond()
