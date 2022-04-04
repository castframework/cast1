# Features

NodeJS Oracle interacts with Forge Smart Contracts on Blockchains. Only Ethereum and Tezos are supported at the moment.  
It can:
- Listen to blockchain events
- Send transactions to a blockchain  

This project leverage the power of [NestJS](https://docs.nestjs.com/) to expose a [GraphQL](https://graphql.org/) API to communicate with Blockchains.

# Descriptions

- Forge Registration Oracle (FRO): designed to start the process of an issuance, declaration of investors and interests, creation of instruments, and many more procedures. At the beginning of an issuance (bond or EMNT), issuers and investors communicate their parameters to the registrar, who then sends that information to the blockchain via the FRO. This means that the FRO launches the issuance, declares the issuer and each investor, creates the instrument, and even generates the trades and settlement transactions.
- Forge Investment Oracle (FIO): designed to be a listener for investors and issuers on the blockchain. This is the way in which these parties can receive information on the transactions which concern them. This oracle can be used as a source of information in order to receive accurate information on transactions.
- Forge Settlement Oracle (FSO): designed to provide important DvP (Delivery vs Payment) functionalities when the issuer and investor are prepared to complete the trade. This oracle can be connected to an outside entity to extend payment options.

Each oracle has a dedicated GraphQL Playground (/graphql) which can be used as an interface for testing. See the `docker-compose.yml` file for the port number of each site as created on the local environment.

# Example Scenario

Examples of queries and mutations can be found in the directory /docs
The following procedure can be performed to test the scenario of a bond issuance:

1. In the FRO (localhost:6661/graphql), Run the registryNotification and contractNotification queries in separate tabs in the GraphQL Playground in order to have listeners for these notifications. These same subscriptions can also be launched from the FIO (localhost:6664/graphql).
2. Run the whoAmI query on the Ethereum Ledger in order to get the address for the Ethereum Ledger.
3. Run the CreateBond mutation. For the CreateBondInput which is needed as an argument, use the `createBond_variables_ETHEREUM.json` file. Once sent, the  `registryNotification` subscription will display an `InstrumentListed` notification, with the address of the listed instrument.
4. Run the initiateSubscription mutation. For the SubscriptionInput argument, use the `initiateSubscription_variables_ETHEREUM.json` file. Once sent, the `contractNotification` subcription will display a `SubscriptionInitiated` notification.
5. Run the initiateTrade mutation. Use the accompanying example file for the InitiateTradeInput argument. The seller should have the address previously used for the issuer, and the buyer should have that of the investor. Once sent, the `contractNotification` subcription will display a `TradeInitiated` notification.
6. Now, run the getSettlementTransaction query from the FSO (localhost:6663/graphql). The ID needed should come from the `id` of an object from the `lightSettlementTransactions` array found in the TradeInitiation notification. The result shows the `movements`, which are the payments made between the buyer, seller, and escrow. Note that the buyer sends cash to the escrow, and a token to the seller. The escrow sends the buyer's cash to the seller. The status of the settlement transaction is `ACKNOWLEDGED`. 
7. Send the `confirmPaymentReceived` mutation from the FSO. The payment reference to send is that of the buyer to the escrow in the list of `movements`. This updates the status of the settlement transaction to `PROCESSED`.
8. Send the `confirmPaymentTransferred` mutation from the FSO. The payment reference to send is that of the escrow to the issuer in the list of `movements`. This updates the status of the settlement transaction to `SETTLED`.

# Folder Structure
```
.
├── integration         Integration tests
├── src
│    ├── constants
│    ├── decorators     
│    ├── ethUtils       Utility code for ethereum
│    ├── filters        Global exception catchers
│    ├── guards         Authentication verification
│    ├── modules
│    │   ├── fio 
│    │   ├── fmo
│    │   ├── fro
│    │   ├── fso
│    │   └── str
│    ├── shared         Code shared between all modules
│    └── utils          Utility code
└── tests
    └── unit            Unit tests

```

# License

Apache 2.0
