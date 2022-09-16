# Confirm Payment Received

Confirm the payment received from the buyer on the escrow account.

<div class="fsoBorder" >
  <div class="explorer" id="fsoConfirmPaymentReceived"></div>
</div>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';
ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({ url: fsoEndPoint }),
defaultEditorToolsVisibility: true,
query: `mutation ConfirmPaymentReceived($paymentReference: String!) {
    confirmPaymentReceived(paymentReference: $paymentReference)
}`,
variables: '{ "paymentReference": "THE_FIRST_MOVEMEMENT_REF" }',
}),
document.getElementById('fsoConfirmPaymentReceived'),
);
</script>