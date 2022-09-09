# Confirming the Payment has been Transferred to the Issuer

Take the `paymentReference` from the second movement.
This will update the status of the settlement transaction to `SETTLED`.

Once the mutation is executed, you should receive a `ConfirmPaymentTransferred` notification in the Contract Notification Subscription!

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentTransferred"></div>
</div>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `mutation ConfirmPaymentTransferred($paymentReference: String!) {
    confirmPaymentTransferred(paymentReference: $paymentReference)
}`,
variables: '{ "paymentReference": "THE_SECOND_MOVEMEMENT_REF" }',
}),
document.getElementById('fsoConfirmPaymentTransferred'),
);
</script>