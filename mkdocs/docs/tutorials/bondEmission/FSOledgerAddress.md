<script src="../../../js/bondEmission.js"></script>

# FSO Ledger Address

In the blockchain, each actor is identified by its address.
To build your new Bond, you will need the address of every actor of the process.
An Oracle provides a *whoami* query for that purpose.

Run the below query to get the FSO's address on the given ledger.

<div class="fsoBorder" >
    <div class="explorer" id="fsowhoami"></div>
</div>
<script>
const fsoEndPoint = 'http://localhost:6663/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: fsoEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `query Query($ledger: Ledger!) {
    whoami(ledger: $ledger)
}`,
variables: '{ "ledger": "ETHEREUM" }'
}),
document.getElementById('fsowhoami'),
);
</script>
