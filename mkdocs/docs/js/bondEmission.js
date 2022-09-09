const froEndPoint = 'http://localhost:6661/graphql';
// const fsoEndPoint = 'http://localhost:6663/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';

// ReactDOM.render(
// React.createElement(GraphiQL, {
// fetcher: GraphiQL.createFetcher({
//   url: fsoEndPoint,
// }),
// defaultEditorToolsVisibility: true,
// query: "query GetSettlementTransaction($getSettlementTransactionId: String!) { getSettlementTransaction(id: $getSettlementTransactionId) { settlementStatus movements { paymentReference } } }",
// variables: {
//   "getSettlementTransactionId": "MY_SETTLEMENT_TRANSACTION_ID"
// },
// }),
// document.getElementById('fsoGetSettlementTransaction'),
// );
ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: "mutation ConfirmPaymentReceived($paymentReference: String!) { confirmPaymentReceived(paymentReference: $paymentReference) }",
variables: {
  paymentReference:"THE_FIRST_MOVEMEMENT_REF"
},
}),
document.getElementById('fsoConfirmPaymentReceived'),
);
ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: "mutation ConfirmPaymentTransferred($paymentReference: String!) { confirmPaymentTransferred(paymentReference: $paymentReference) }",
variables: {
  paymentReference:"THE_SECOND_MOVEMEMENT_REF"
},
}),
document.getElementById('fsoConfirmPaymentTransferred'),
);