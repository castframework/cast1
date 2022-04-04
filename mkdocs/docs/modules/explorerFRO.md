# Explorer FRO (Forge Registrar Oracle)

The <span class="froColor">Forge Registration Oracle (FRO)</span> is designed to start the process of an issuance, declaration of investors and interests, creation of instruments, and many more procedures. <br>
<br>
At the beginning of an issuance (bond or EMNT), issuers and investors communicate their parameters to the registrar, who then sends that information to the blockchain via the FRO. This means that the FRO launches the issuance, declares the issuer and each investor, creates the instrument, and even generates the trades and settlement transactions.
<br>
<br>
This workflow exposes the registrar agent operations!

## Create Bond

- After creating a bond, save the value of the response which corresponds to the "instrumentAddress".

<div class="froBorder" >
    <div class="explorer" id="createBond"></div>
</div>

## Initiate Subscription

You should adapt these 3 variables to your own :

- "uuid": <span class="gen-uuid"><div class="lds-dual-ring"></div></span> or use https://www.uuidgenerator.net/version4
- "operationId": <span class="gen-uuid"><div class="lds-dual-ring"></div></span> or use https://www.uuidgenerator.net/version4
- "instrumentAddress": use the preserved instrumentAddress from previous mutation

<div class="froBorder" >
  <div class="explorer" id="initiateSubscription"></div>
</div>

## GetSettlementTransactions

- This method returns the list of all the existing settlement transactions that you are allowed to see.

<div class="froBorder" >
  <div class="explorer" id="getSettlementTransactions"></div>
</div>

<script>
  new window.EmbeddedExplorer({
    target: '#createBond',
    endpointUrl: 'http://localhost:6661/graphql',
    schema: window.getFroSchema(),
    initialState: {
      document: `mutation CreateBond($bond: CreateBondInput!) {
        createBond(bond: $bond)
      }
    }
    }`,
      variables: {
        bond: {
          "symbol": "202203031112", // anything you want
          "status": "CREATED", // should be CREATED for now
          "isinCode": "202203031112", // anything you want
          "cfiCode": "202203031112", // anything you want
          "commonCode": "202203031112", // anything you want
          "ledger": "ETHEREUM", // the ledger enumeration is currently "ETHEREUM" and "TEZOS"
          "startDate": "2022-03-03T10:11:18.729", // actual issue date (durations for financial computations(coupons, etc.) are counted from this date)
          "maturityDate": "2026-03-03T10:11:18.729",
          "denomination": 1000000, // face value of one token in the token's currency
          "nominalAmount": 1000000000, // total face value of the issuance -> number of issued tokens = nominalAmount / denomination
          "decimals": null, // number of decimals, used for rounding results of computations in the smart contract
          "currency": "EUR", // ISO code
          "couponRateInBips": 0,
          "couponFrequencyInMonths": 12,
          "firstCouponDate": "2023-04-03T09:11:18.729",
          "isCallable": false, // whether there is a call option
          "callFrequency": "DAILY", // when the call option can be exercised
          "registrarAgentAddress": "0x106f9f9a06c5bb607a8e6c6f2aec0ec4fd303f26", // has to be a valid address (the format depends on the ledger)
          "settlerAgentAddress": "0x58f3988e32cb39aac0b47b3c5384371335341195", // has to be a valid address (the format depends on the ledger)
          "issuerAddress": "0x23041c3e04a6770df70616608b6b1517735f7fc2", // has to be a valid address (the format depends on the ledger)
          "extendedMaturityDate": "2026-04-03T10:11:18.729",
          "isSoftBullet": false, // whether there is a soft bullet option
          "softBulletPeriodInMonths": 12, // the number of months by which the maturity date is postponed in case the soft bullet option is exercised by the issuer
          "spread": 0,
          "issuerId": "LEI_ISSUER_1",
          "registrarId": "LEI_REGISTRAR",
          "settlementAgentId": "LEI_SETTLEMENT_AGENT"
        }
      },
      displayOptions: {
        showHeadersAndEnvVars: true,
        docsPanelState: 'closed',
      },
    },
  });
  
  new window.EmbeddedExplorer({
    target: '#initiateSubscription',
    endpointUrl: 'http://localhost:6661/graphql',
    schema: window.getFroSchema(),
    initialState: {
      document: `
      mutation InitiateSubscription(
        $initiateSubscriptionInput: InitiateSubscriptionInput!
      ) {
        initiateSubscription(
          initiateSubscriptionInput: $initiateSubscriptionInput
        )
        }
      }`,
      variables: {
        initiateSubscriptionInput: {
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
      },
      displayOptions: {
        showHeadersAndEnvVars: true,
        docsPanelState: 'closed',
      },
    },
  });

  new window.EmbeddedExplorer({
    target: '#getSettlementTransactions',
    endpointUrl: 'http://localhost:6661/graphql',
    schema: window.getFroSchema(),
    initialState: {
      document: `
      query GetSettlementTransactions {
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
    }
      }`,
      displayOptions: {
        showHeadersAndEnvVars: true,
        docsPanelState: 'closed',
      },
    },
  });


</script>