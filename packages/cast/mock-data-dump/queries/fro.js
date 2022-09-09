const gql = require('graphql-tag');

exports.WhoamiFRO = gql`
  query Query($ledger: Ledger!) {
    whoami(ledger: $ledger)
  }
`;

exports.CreateBond = gql`
  mutation CreateBond($bond: CreateBondInput!) {
    createBond(bond: $bond)
  }
`;

exports.InitiateSubscription = gql`
  mutation InitiateSubscription($initiateSubscriptionInput: InitiateSubscriptionInput!) {
    initiateSubscription(initiateSubscriptionInput: $initiateSubscriptionInput)
  }
`;

exports.REGISTRY_NOTIFICATION_SUB = gql`
  subscription Subscription {
    registryNotification {
      notificationName
      instrumentAddress
      instrumentLedger
      transactionHash
    }
  }
`;

exports.CONTRACT_NOTIFICATION_SUB = gql`
  subscription Subscription {
    contractNotification {
      notificationName
      instrumentAddress
      transactionHash
      lightSettlementTransactions {
        id
      }
    }
  }
`;
