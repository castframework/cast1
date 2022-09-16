# Confirm Payment Transferred

Confirm the payment sent to the seller.

<div class="fsoBorder" >
  <div class="explorer" id="fsoConfirmPaymentTransferred"></div>
</div>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';
ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({ url: fsoEndPoint }),
defaultEditorToolsVisibility: true,
query: `mutation ConfirmPaymentTransferred($paymentReference: String!) {
    confirmPaymentTransferred(paymentReference: $paymentReference)
}`,
variables: '{ "paymentReference": "THE_SECOND_MOVEMEMENT_REF" }',
}),
document.getElementById('fsoConfirmPaymentTransferred'),
);
</script>