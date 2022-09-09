# FRO Ledger Address

In the blockchain, each actor is identified by its address.
To build your new Bond, you will need the address of every actor of the process.
An Oracle provides a *whoami* query for that purpose.

Run the below query to get the FRO's address on the given ledger.

<div class="froBorder" >
    <div class="explorer" id="frowhoami"></div>
</div>
<script>
const froEndPoint = 'http://localhost:6661/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: froEndPoint,
}),
defaultEditorToolsVisibility: true,
query: `query Query($ledger: Ledger!) {
    whoami(ledger: $ledger)
}`,
variables: '{ "ledger": "ETHEREUM" }'
}),
document.getElementById('frowhoami'),
);
</script>