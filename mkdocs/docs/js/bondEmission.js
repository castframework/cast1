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