# Registry Notification

Anytime a new contract is issued by a factory, you will receive a notification here.
Launch the subscription and continue the bond emission process.
You will be returning here later on in the process to see the registry notifications received.

<div class="froBorder" >
    <div class="explorer" id="froSubRegistryNotification"></div>
</div>
<script>
const froEndPoint = 'http://localhost:6661/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';

    ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  subscriptionUrl: froSubEndPoint,
  url: froEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `subscription Subscription {
    registryNotification {
        notificationName
        instrumentAddress
        instrumentLedger
        transactionHash
    }
}`
}),
document.getElementById('froSubRegistryNotification'),
);
</script>