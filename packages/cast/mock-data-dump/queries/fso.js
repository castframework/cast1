const gql = require('graphql-tag');

exports.WhoamiFSO = gql`
  query Query($ledger: Ledger!) {
    whoami(ledger: $ledger)
  }
`;

exports.GetSettlementTransaction = gql`
  query GetSettlementTransaction($getSettlementTransactionId: String!) {
    getSettlementTransaction(id: $getSettlementTransactionId) {
      settlementStatus
      movements {
        paymentReference
      }
    }
  }
`;

exports.ConfirmPaymentReceived = gql`
  mutation ConfirmPaymentReceived($paymentReference: String!) {
    confirmPaymentReceived(paymentReference: $paymentReference)
  }
`;

exports.ConfirmPaymentTransferred = gql`
  mutation ConfirmPaymentTransferred($paymentReference: String!) {
    confirmPaymentTransferred(paymentReference: $paymentReference)
  }
`;
