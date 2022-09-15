# Subscribe to notification feeds

Listening for contract creation.

<div class="fsoBorder" >
  <div class="explorer" id="fsoSubscribeToContractCreation"></div>
</div>
<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';
const fsoSubEndPoint = 'ws://localhost:6663/graphql';
const fetcher = GraphiQL.createFetcher({
  url: fsoEndPoint,
  legacyWsClient: new SubscriptionsTransportWs.SubscriptionClient(fsoSubEndPoint, { reconnect: true })
});
ReactDOM.render(
React.createElement(GraphiQL, { defaultEditorToolsVisibility: true, fetcher: fetcher, query: contractNotificationFSOQuery }),
document.getElementById('fsoSubscribeToContractCreation'),
);
</script>