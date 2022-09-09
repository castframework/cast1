# Bond Subscription

Now that the bond is issued, investors can subscribe.
For this example, we are using a preconfigured address as an investor.

We now need to build a subscription object.

Replace the placeholder in the variables panel :

- tradeId : with a new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- operationId : with another new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- instrumentAddress : your previously noted new bond address from the Registry Notification.

Once the mutation is executed, you should receive a `SubscriptionInitiated` notification in the Contract Notification Subscription!

<div class="froBorder" >
    <div class="explorer" id="froSubscribe"></div>
</div>
<script>
const froEndPoint = 'http://localhost:6661/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: froEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `mutation InitiateSubscription($initiateSubscriptionInput: InitiateSubscriptionInput!) {
    initiateSubscription(initiateSubscriptionInput: $initiateSubscriptionInput)
  }
}`,
variables: '{ "initiateSubscriptionInput": { "settlementModel": "INDIRECT", "intermediateAccountIBAN": "FR7630003011300300000000000", "holdableTokenAddress": null, "settlementDate": "2022-04-04T08:44:32.785Z", "operationId": "MY_OPERATION_ID", "instrumentAddress": "MY_BOND_CONTRACT_ADDRESS", "instrumentLedger": "ETHEREUM", "additionalReaderAddresses": [], "tradeId": "MY_TRADE_ID", "tradeDate": "2022-03-04T09:44:32.785", "issuerAddresses": { "legalEntityId": "LEI_ISSUER_1", "paymentAccountNumber": "FR7630003011300400000000000" }, "investorAddresses": { "deliveryAccountNumber": "0x95d1883c3fc1d702538ea26c47e94f78f2f6ac68", "legalEntityId": "LEI_INVESTOR_1", "paymentAccountNumber": "FR7630003011300500000000000" }, "deliveryQuantity": 1, "paymentAmount": 980000, "paymentCurrency": "EUR" } }',
}),
document.getElementById('froSubscribe'),
);
</script>