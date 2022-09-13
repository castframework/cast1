# Bond Subscription

Now that the bond is issued, investors can subscribe.
For this example, we are using a preconfigured address as an investor.

We now need to build a subscription object.

Replace the placeholder in the variables panel :

- tradeId : with a new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- operationId : with another new uuid : e.g. <span class="gen-uuid"><div class="lds-dual-ring"></div></span>
- instrumentAddress : your previously noted new bond address from the Registry Notification.

Once the mutation is executed, you should receive a `SubscriptionInitiated` notification in the Contract Notification Subscription!

<div class="froBorder" >
    <div class="explorer" id="froSubscribe"></div>
</div>
<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const froEndPoint = 'http://localhost:6661/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({ url: froEndPoint }),
defaultEditorToolsVisibility: true,
query: initiateSubscriptionMutation,
variables: initiateSubscriptionMutationVariables,
}),
document.getElementById('froSubscribe'),
);
</script>