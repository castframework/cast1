# Settlement

Now that the subscription has been made on the blockchain, we need to settle the transaction.
In order to settle the cash we need a trusted third party called the "Settler".
To fulfill its role, the settler uses the <span class='fsoColor'>FSO</span>.

The required ID should be the 'id' from the "lightSettlementTransactions" array that can be found in the `SubscriptionInitiated` notification of the Contract Notification Subscription.

<div class="fsoBorder" >
    <div class="explorer" id="fsoGetSettlementTransaction"></div>
</div>

The result shows the `movements`, which are the payments made between the buyer, the seller, and the escrow. 
Keep in mind that the buyer sends <ins>cash</ins> to the escrow, but a <ins>token</ins> to the seller.
The escrow then sends the buyer's cash to the seller. The status of the settlement transaction becomes `ACKNOWLEDGED`.

<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: getSettlementTransactionQuery,
variables: '{ "getSettlementTransactionId": "MY_SETTLEMENT_TRANSACTION_ID" }',
}),
document.getElementById('fsoGetSettlementTransaction'),
);
</script>