# Registry Notification

Anytime a new contract is issued by a factory, you will receive a notification here.
Launch the subscription and continue the bond emission process.
You will be returning here later on in the process to see the registry notifications received.

<div class="froBorder" >
    <div class="explorer" id="froSubRegistryNotification"></div>
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
query: registryNotificationQuery
}),
document.getElementById('froSubRegistryNotification'),
);
</script>