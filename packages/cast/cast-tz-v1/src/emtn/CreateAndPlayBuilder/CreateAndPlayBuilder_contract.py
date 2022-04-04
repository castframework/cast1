import sys
import os
sys.path.append(os.getcwd())

from src.globals import *

import src.emtn.CreateAndPlayBuilder.lambdaName as NAME

OperatorLambda = SPU.importContract("common/libs/operators/lambda.py")
SubscriptionLambda = SPU.importContract("common/libs/subscription/lambda.py")
SettlementLambda = SPU.importContract("common/libs/settlements/lambda.py")


class CreateAndPlayBuilder(sp.Contract):
    def __init__(self, admin):
        self.init(
            bytesScripts=sp.big_map(
                tkey=sp.TBytes,
                tvalue=sp.TBytes
            ),
            administrator=admin,
        )

    @sp.entry_point
    def buildCreateAndPlay(self):

        callInitiateSubscription = sp.some(
            sp.build_lambda(SubscriptionLambda.initiateSubscription))
        self.data.bytesScripts[sp.pack(NAME.INITIATE_SUBSCRIPTION)] = sp.pack(
            callInitiateSubscription.open_some())

        callConfirmPaymentReceived = sp.some(
            sp.build_lambda(SettlementLambda.confirmPaymentReceived))
        self.data.bytesScripts[sp.pack(NAME.CONFIRM_PAYMENT_RECEIVED)] = sp.pack(
            callConfirmPaymentReceived.open_some())

        callConfirmPaymentTransferred = sp.some(
            sp.build_lambda(SettlementLambda.confirmPaymentTransferred))
        self.data.bytesScripts[sp.pack(NAME.CONFIRM_PAYMENT_TRANSFERRED)] = sp.pack(
            callConfirmPaymentTransferred.open_some())

        callAuthorizeOperator = sp.some(
            sp.build_lambda(OperatorLambda.authorizeOperator))
        self.data.bytesScripts[sp.pack(NAME.AUTHORIZE_OPERATOR)] = sp.pack(
            callAuthorizeOperator.open_some())

        callRevokeOperatorAuthorization = sp.some(
            sp.build_lambda(OperatorLambda.revokeOperatorAuthorization))
        self.data.bytesScripts[sp.pack(NAME.REVOKE_OPERATOR_AUTHORIZATION)] = sp.pack(
            callRevokeOperatorAuthorization.open_some())

    @sp.entry_point
    def sendCreateAndPlay(self, factoryAddress):

        entryPoints = {
            sp.pack(NAME.INITIATE_SUBSCRIPTION): self.data.bytesScripts[sp.pack(NAME.INITIATE_SUBSCRIPTION)],
            sp.pack(NAME.CONFIRM_PAYMENT_RECEIVED): self.data.bytesScripts[sp.pack(NAME.CONFIRM_PAYMENT_RECEIVED)],
            sp.pack(NAME.CONFIRM_PAYMENT_TRANSFERRED): self.data.bytesScripts[sp.pack(NAME.CONFIRM_PAYMENT_TRANSFERRED)],
            sp.pack(NAME.AUTHORIZE_OPERATOR): self.data.bytesScripts[sp.pack(NAME.AUTHORIZE_OPERATOR)],
            sp.pack(NAME.REVOKE_OPERATOR_AUTHORIZATION): self.data.bytesScripts[sp.pack(NAME.REVOKE_OPERATOR_AUTHORIZATION)],
        }

        EPType = sp.TMap(sp.TBytes, sp.TBytes)

        sp.transfer(
            entryPoints,
            sp.tez(0),
            sp.contract(
                t=EPType,
                address=factoryAddress,
                entry_point="upgrade"
            ).open_some()
        )

sp.add_compilation_target("CreateAndPlayBuilder", CreateAndPlayBuilder(sp.address("tz1@ADMIN@")))
contract = CreateAndPlayBuilder(sp.address("tz1@ADMIN@"))
