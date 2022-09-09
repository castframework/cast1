# Contract Notification

This is where you are going to receive all the different notifications from deployed contracts.

<div class="froBorder" >
    <div class="explorer" id="froSubContractNotification"></div>
</div>
<script>
const froEndPoint = 'http://localhost:6661/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';

ReactDOM.render(
    React.createElement(GraphiQL, {
    fetcher: GraphiQL.createFetcher({ subscriptionUrl: froSubEndPoint, url: froEndPoint }),
    defaultEditorToolsVisibility: true,
    query: `subscription Subscription {
    contractNotification {
        notificationName
        instrumentAddress
        transactionHash
        lightSettlementTransactions {
            id
        }
    }
}`
}),
document.getElementById('froSubContractNotification'),
);
</script>