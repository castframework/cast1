# GetSettlementTransactions

- This method returns the list of all the existing settlement transactions that you are allowed to see.

<div class="froBorder" >
    <div class="explorer" id="froGetSettlementTransactions"></div>
</div>

The result shows the `movements`, which are the payments made between the buyer, the seller, and the escrow. 
Keep in mind that the buyer sends <ins>cash</ins> to the escrow, but a <ins>token</ins> to the seller.
The escrow then sends the buyer's cash to the seller. The status of the settlement transaction becomes `ACKNOWLEDGED`.

<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const froEndPoint = 'http://localhost:6661/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: froEndPoint,
}),
defaultEditorToolsVisibility: true,
query: getSettlementTransactionFROQuery,
}),
document.getElementById('froGetSettlementTransactions'),
);
</script>