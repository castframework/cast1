# Contract Notification

This is where you are going to receive all the different notifications from deployed contracts.

<div class="froBorder" >
    <div class="explorer" id="froSubContractNotification"></div>
</div>
<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const froEndPoint = 'http://localhost:6661/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';
const fetcher = GraphiQL.createFetcher({
  url: froEndPoint,
  legacyWsClient: new SubscriptionsTransportWs.SubscriptionClient(froSubEndPoint, { reconnect: true })
});
ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: fetcher,
defaultEditorToolsVisibility: true,
query: contractNotificationQuery
}),
document.getElementById('froSubContractNotification'),
);
</script>