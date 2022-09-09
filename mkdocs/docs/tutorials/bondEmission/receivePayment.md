# Confirm the Settler has Received the Payment

Take the `paymentReference` from the first movement.
This will update the status of the settlement transaction to `PROCESSED`.

Once the mutation is executed, you should receive a `ConfirmPaymentReceived` notification in the Contract Notification Subscription!

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentReceived"></div>
</div>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `mutation ConfirmPaymentReceived($paymentReference: String!) {
    confirmPaymentReceived(paymentReference: $paymentReference)
}`,
variables: '{ "paymentReference": "THE_FIRST_MOVEMEMENT_REF" }',
}),
document.getElementById('fsoConfirmPaymentReceived'),
);
</script>