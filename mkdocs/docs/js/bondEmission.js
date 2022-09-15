const registryNotificationQuery = `subscription Subscription {
  registryNotification {
      notificationName
      instrumentAddress
      instrumentLedger
      transactionHash
  }
}`;
const contractNotificationQuery = `subscription Subscription {
  contractNotification {
      notificationName
      instrumentAddress
      transactionHash
      lightSettlementTransactions {
          id
      }
  }
}`;
const contractNotificationFSOQuery = `subscription Subscription {
  contractNotification {
    notificationName
    instrumentAddress
    transactionHash
    lightSettlementTransactions {
        id
        participantAccountNumbers {
            securityDeliverer
            securityReceiver  
        }
    }
  }
}
`;
const initiateSubscriptionMutation = `mutation InitiateSubscription($initiateSubscriptionInput: InitiateSubscriptionInput!) {
  initiateSubscription(initiateSubscriptionInput: $initiateSubscriptionInput)
}`;
const initiateSubscriptionMutationVariables = `{
  "initiateSubscriptionInput": {
    "settlementModel": "INDIRECT",
    "intermediateAccountIBAN": "FR7630003011300300000000000",
    "holdableTokenAddress": null,
    "settlementDate": "2022-04-04T08:44:32.785Z",
    "operationId": "MY_OPERATION_ID",
    "instrumentAddress": "MY_BOND_CONTRACT_ADDRESS",
    "instrumentLedger": "ETHEREUM",
    "additionalReaderAddresses": [],
    "tradeId": "MY_TRADE_ID",
    "tradeDate": "2022-03-04T09:44:32.785",
    "issuerAddresses": {
      "legalEntityId": "LEI_ISSUER_1",
      "paymentAccountNumber": "FR7630003011300400000000000"
    },
    "investorAddresses": {
      "deliveryAccountNumber": "0x95d1883c3fc1d702538ea26c47e94f78f2f6ac68",
      "legalEntityId": "LEI_INVESTOR_1",
      "paymentAccountNumber": "FR7630003011300500000000000"
    }, 
    "deliveryQuantity": 1,
    "paymentAmount": 980000,
    "paymentCurrency": "EUR"
  }
}`;
const createBondMutation = `mutation CreateBond($bond: CreateBondInput!) {
  createBond(bond: $bond)
}`;
const createBondMutationVariables = `{
  "bond": {
    "symbol": "202203031112",
    "status": "CREATED",
    "isinCode": "202203031112",
    "cfiCode": "202203031112",
    "commonCode": "202203031112",
    "ledger": "ETHEREUM",
    "startDate": "2022-03-03T10:11:18.729",
    "maturityDate": "2026-03-03T10:11:18.729",
    "denomination": 1000000,
    "nominalAmount": 1000000000,
    "decimals": null,
    "currency": "EUR",
    "couponRateInBips": 0,
    "couponFrequencyInMonths": 12,
    "firstCouponDate": "2023-04-03T09:11:18.729",
    "isCallable": false,
    "callFrequency": "DAILY",
    "registrarAgentAddress": "MY_FRO_ADDRESS",
    "settlerAgentAddress": "MY_FSO_ADDRESS",
    "issuerAddress": "0x23041c3e04a6770df70616608b6b1517735f7fc2",
    "extendedMaturityDate": "2026-04-03T10:11:18.729",
    "isSoftBullet": false,
    "softBulletPeriodInMonths": 12,
    "spread": 0,
    "issuerId": "LEI_ISSUER_1",
    "registrarId": "LEI_REGISTRAR",
    "settlementAgentId": "LEI_SETTLEMENT_AGENT"
  }
}`;
const getSettlementTransactionQuery = `query GetSettlementTransaction($getSettlementTransactionId: String!) {
  getSettlementTransaction(id: $getSettlementTransactionId) {
    settlementStatus
    movements {
      paymentReference
    }
  }
}`;
const createBondFROMutationVariables = `{
  "bond": {
    "symbol": "202203031112",
    "status": "CREATED",
    "isinCode": "202203031112",
    "cfiCode": "202203031112",
    "commonCode": "202203031112",
    "ledger": "ETHEREUM",
    "startDate": "2022-03-03T10:11:18.729",
    "maturityDate": "2026-03-03T10:11:18.729",
    "denomination": 1000000,
    "nominalAmount": 1000000000,
    "decimals": null,
    "currency": "EUR",
    "couponRateInBips": 0,
    "couponFrequencyInMonths": 12,
    "firstCouponDate": "2023-04-03T09:11:18.729",
    "isCallable": false,
    "callFrequency": "DAILY",
    "registrarAgentAddress": "0x106f9f9a06c5bb607a8e6c6f2aec0ec4fd303f26",
    "settlerAgentAddress": "0x58f3988e32cb39aac0b47b3c5384371335341195",
    "issuerAddress": "0x23041c3e04a6770df70616608b6b1517735f7fc2",
    "extendedMaturityDate": "2026-04-03T10:11:18.729",
    "isSoftBullet": false,
    "softBulletPeriodInMonths": 12,
    "spread": 0,
    "issuerId": "LEI_ISSUER_1",
    "registrarId": "LEI_REGISTRAR",
    "settlementAgentId": "LEI_SETTLEMENT_AGENT"
  }
}`;
const initiateSubscriptionFROMutationVariables = `{
  "initiateSubscriptionInput": {
    "settlementModel": "INDIRECT",
    "intermediateAccountIBAN": "FR7630003011300300000000000",
    "holdableTokenAddress": null,
    "settlementDate": "2022-04-04T08:44:32.785Z",
    "operationId": "974a2dcc-a241-447f-8ea2-82b00cf818bb",
    "instrumentAddress": "0x7811126D6F73daa25832828af88702EB529fe820",
    "instrumentLedger": "ETHEREUM",
    "additionalReaderAddresses": [],
    "tradeId": "45e18171-b487-4a0e-9487-c3a7bc082c8d",
    "tradeDate": "2022-03-04T09:44:32.785",
    "issuerAddresses": {
      "legalEntityId": "LEI_ISSUER_1",
      "paymentAccountNumber": "FR7630003011300400000000000"
    },
    "investorAddresses": {
      "deliveryAccountNumber": "0xee39c0435ab3c4a205e9e117dcea0cc7610d7dc3",
      "legalEntityId": "LEI_INVESTOR_1",
      "paymentAccountNumber": "FR7630003011300500000000000"
    },
    "deliveryQuantity": 1,
    "paymentAmount": 980000,
    "paymentCurrency": "EUR"
  }
}`;
const getSettlementTransactionFROQuery = `query GetSettlementTransactions {
  getSettlementTransactions {
    deliveryQuantity
    deliveryReceiverAccountNumber
    deliverySenderAccountNumber
    hash
    id
    instrumentLedger
    instrumentPublicAddress
    paymentSenderLegalEntityId
    paymentReceiverLegalEntityId
    movements {
      id
      paymentReference
      receiverAccountNumber
      senderAccountNumber
      movementType
    }
    operationId
    paymentAmount
    paymentCurrency
    paymentReceiverAccountNumber
    paymentSenderAccountNumber
    settlementDate
    settlementStatus
    settlementType
    additionalReaderAddresses
    tradeDate
    tradeId
    settlementModel
    intermediateAccountIBAN
    holdableTokenAddress
  }
}`;



