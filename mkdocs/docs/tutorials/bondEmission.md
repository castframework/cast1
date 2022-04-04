# Emitting a Bond using Forge Oracles

This step by step guide will go through the bond emission process.
At the end of this tutorial you will have emitted and settled a new Forge Bond on
your local environnement.

For this you need to interact with two components : the <span class="froColor">[Forge Registrar Oracle (FRO)](/modules/explorerFRO)</span> and the <span class="fsoColor">[Forge Settlement Oracle (FSO)](/modules/explorerFSO)</span>.

You will find, along these steps, interactive explorers preloaded with sample requests.
If you wish, standalone playgrounds for the <span class="froColor">[FRO](http://localhost:6661/graphql)</span> and <span class="fsoColor">[FSO](http://localhost:6663/graphql)</span> are also available.

## Event Subscription

First of all, you will need to subscribe to specific events on the blockchain.
The different actors use these events to coordinate themselves.
Any Forge Oracle (FO) can do this. For this tutorial, we will be using the <span class="froColor">FRO</span>.

### Registry Notification

Anytime a new contract is emitted by a factory, you will receive a notification here.

<div class="froBorder" >
    <div class="explorer" id="froSubRegistryNotification"></div>
</div>
<button type="button" onclick="javascript:history.back()">Back</button>

### Contracts Notification

This is where you are going to receive all the different notifications from deployed contracts.

<div class="froBorder" >
    <div class="explorer" id="froSubContractNotification"></div>
</div>

<button type="button" onclick="javascript:history.back()">Back</button>

## Getting the Oracle's Ethereum address

In the blockchain, each actor is identified by its address.
To build your new Forge Bond, you will need the address of every actor of the process.
FO provides a *whoami* query for that purpose.

Keep these addresses for the next steps.

<div class="froBorder" >
    <div class="explorer" id="frowhoami"></div>
</div>
<div class="fsoBorder" >
    <div class="explorer" id="fsowhoami"></div>
</div>

## Creating a new Forge Bond

For this part, you need to build an object with the desired parameters for your bond.
In the variables panel of the explorer, replace the placeholder values with the previously kept addresses.

Below is a commented example.

```javascript
{
    "symbol": "202203031112", // anything unique
    "status": "CREATED", // the intial state is CREATED
    "isinCode": "202203031112", // anything unique
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
    "registrarAgentAddress": "MY_FRO_ADDRESS", // has to be a valid address (the format depends on the ledger)
    "settlerAgentAddress": "MY_FSO_ADDRESS", // has to be a valid address (the format depends on the ledger)
    "issuerAddress": "0x23041c3e04a6770df70616608b6b1517735f7fc2", // has to be a valid address (the format depends on the ledger)
    "extendedMaturityDate": "2026-04-03T10:11:18.729",
    "isSoftBullet": false, // whether there is a soft bullet option
    "softBulletPeriodInMonths": 12, // the number of months by which the maturity date is postponed in case the soft bullet option is exercised by the issuer
    "spread": 0,
    "issuerId": "LEI_ISSUER_1",
    "registrarId": "LEI_REGISTRAR",
    "settlementAgentId": "LEI_SETTLEMENT_AGENT"
}
```

Once the mutation is executed, you should receive a `InstrumentListed` notification in the [Registry Notification Subscription](#registry-notification).
Keep that address, it represents your new Bond.

<div class="froBorder" >
    <div class="explorer" id="froCreateBond"></div>
</div>

## Subscribing to the bond

Now that the bond is emitted, investors can subscribe.
For this example, we are using a preconfigured address as an investor.

We now need to build a subscription object.

Replace the placeholder in the variables panel :

- tradeId : with a new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- operationId : with another new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- instrumentAddress : your previously noted new bond address from the [Registry Notification](#registry-notification)

Once the mutation is executed, you should receive a `SubscriptionInitiated` notification in the [Contract Notification Subscription](#contracts-notification) !

<div class="froBorder" >
    <div class="explorer" id="froSubscribe"></div>
</div>

## Settling the Subscription

Now that the subscription has been made on the blockchain, we need to settle the transaction.
In order to settle the cash we need a trusted third party called the "Settler".
To fulfill its role, the settler uses the <span class='fsoColor'>FSO</span>.

In this tutorial we will be using the `INDIRECT` settlement workflow.
In this specific workflow, the settler acts as an escrow.

### Getting the payment information

The required ID should be the 'id' from the "lightSettlementTransactions" array that can be found in the `SubscriptionInitiated` notification of the [Contract Notification Subscription](#contracts-notification).

<div class="fsoBorder" >
    <div class="explorer" id="fsoGetSettlementTransaction"></div>
</div>

The result shows the `movements`, which are the payments made between the buyer, the seller, and the escrow. 
Keep in mind that the buyer sends <ins>cash</ins> to the escrow, but a <ins>token</ins> to the seller.
The escrow then sends the buyer's cash to the seller. The status of the settlement transaction becomes `ACKNOWLEDGED`.

### Confirm the Settler has received the payment

Take the `paymentReference` from the first movement.
This will update the status of the settlement transaction to `PROCESSED`.

Once the mutation is executed, you should receive a `ConfirmPaymentReceived` notification in the [Contract Notification Subscription](#contracts-notification) !

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentReceived"></div>
</div>

### Confirming the Payment has been Transferred to the Issuer

Take the `paymentReference` from the second movement.
This will update the status of the settlement transaction to `SETTLED`.

Once the mutation is executed, you should receive a `ConfirmPaymentTransferred` notification in the [Contract Notification Subscription](#contracts-notification) !

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentTransferred"></div>
</div>

**Congratulations** You have just emitted and subscribed to a Forge Bond !

<script>
    const froEndPoint = 'http://localhost:6661/graphql';
    const fsoEndPoint = 'http://localhost:6663/graphql';

    new window.EmbeddedExplorer({
        target: '#froSubContractNotification',
        endpointUrl: froEndPoint,
        persistExplorerState: false,
        schema: window.getFroSchema(),
        initialState: {
            document: `subscription Subscription {
  contractNotification {
    notificationName
    instrumentAddress
    transactionHash
    lightSettlementTransactions {
      id
    }
  }
}`,
            variables: {},
            displayOptions: {
                showHeadersAndEnvVars: true,
                docsPanelState: 'closed',
            },
            },
    });

    new window.EmbeddedExplorer({
        target: '#froSubRegistryNotification',
        endpointUrl: froEndPoint,
        persistExplorerState: false,
        schema: window.getFroSchema(),
        initialState: {
            document: `subscription Subscription {
  registryNotification {
    notificationName
    instrumentAddress
    instrumentLedger
    transactionHash
  }
}`,
            variables: {},
            displayOptions: {
                showHeadersAndEnvVars: true,
                docsPanelState: 'closed',
            },
            },
    });
    new window.EmbeddedExplorer({
        target: '#frowhoami',
        endpointUrl: froEndPoint,
        persistExplorerState: false,
        schema: window.getFroSchema(),
        initialState: {
            document: `query Query($ledger: Ledger!) {
  whoami(ledger: $ledger)
}`,
            variables: {
                ledger: "ETHEREUM"
            },
            displayOptions: {
                showHeadersAndEnvVars: true,
                docsPanelState: 'closed',
            },
            },
    });
    new window.EmbeddedExplorer({
        target: '#fsowhoami',
        endpointUrl: fsoEndPoint,
        persistExplorerState: false,
        schema: window.getFsoSchema(),
        initialState: {
            document: `query Query($ledger: Ledger!) {
  whoami(ledger: $ledger)
}`,
            variables: {
                ledger: "ETHEREUM"
            },
            displayOptions: {
                showHeadersAndEnvVars: true,
                docsPanelState: 'closed',
            },
            },
    });

    new window.EmbeddedExplorer({
        target: '#froCreateBond',
        endpointUrl: froEndPoint,
        persistExplorerState: false,
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
                "registrarAgentAddress": "MY_FRO_ADDRESS", // has to be a valid address (the format depends on the ledger)
                "settlerAgentAddress": "MY_FSO_ADDRESS", // has to be a valid address (the format depends on the ledger)
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
    target: '#froSubscribe',
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
      },
      displayOptions: {
        showHeadersAndEnvVars: true,
        docsPanelState: 'closed',
      },
    },
  });

    new window.EmbeddedExplorer({
    target: '#fsoGetSettlementTransaction',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
        document: `
query GetSettlementTransaction($getSettlementTransactionId: String!) {
  getSettlementTransaction(id: $getSettlementTransactionId) {
    settlementStatus
    movements {
      paymentReference
    }
  }
}`,
        variables: {
            "getSettlementTransactionId": "MY_SETTLEMENT_TRANSACTION_ID"
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
    },
  });

   new window.EmbeddedExplorer({
    target: '#fsoConfirmPaymentReceived',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
      document: ` mutation ConfirmPaymentReceived($paymentReference: String!) {
        confirmPaymentReceived(paymentReference: $paymentReference)
        }`,
        variables: {
           paymentReference:"THE_FIRST_MOVEMEMENT_REF"
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
        },
  });

  new window.EmbeddedExplorer({
    target: '#fsoConfirmPaymentTransferred',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
      document: ` mutation ConfirmPaymentTransferred($paymentReference: String!) {
            confirmPaymentTransferred(paymentReference: $paymentReference)
            }`,
        variables: {
           paymentReference:"THE_SECOND_MOVEMEMENT_REF"
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
        },
  });

</script>
