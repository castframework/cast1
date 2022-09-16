# Create Bond

- After creating a bond, save the value of the response which corresponds to the "instrumentAddress".

Below is a commented example.

```javascript
{
  "symbol": "202203031112", // anything you want
  "status": "CREATED", // should be CREATED for now
  "isinCode": "202203031112", // anything you want
  "cfiCode": "202203031112", // anything you want
  "commonCode": "202203031112", // anything you want
  "ledger": "ETHEREUM", // the ledger enumeration is currently "ETHEREUM" and "TEZOS"
  "startDate": "2022-03-03T10:11:18.729", // actual issue date (durations for financial computations(coupons, etc.) are counted from this date)
  "maturityDate": "2026-03-03T10:11:18.729",
  "denomination": 1000000, // face value of one token in the token's currency
  "nominalAmount": 1000000000, // total face value of the issuance -> number of issued tokens = nominalAmount / denomination
  "decimals": null, // number of decimals, used for rounding results of computations in the smart contract
  "currency": "EUR", // ISO code
  "couponRateInBips": 0,
  "couponFrequencyInMonths": 12,
  "firstCouponDate": "2023-04-03T09:11:18.729",
  "isCallable": false, // whether there is a call option
  "callFrequency": "DAILY", // when the call option can be exercised
  "registrarAgentAddress": "0x106f9f9a06c5bb607a8e6c6f2aec0ec4fd303f26", // has to be a valid address (the format depends on the ledger)
  "settlerAgentAddress": "0x58f3988e32cb39aac0b47b3c5384371335341195", // has to be a valid address (the format depends on the ledger)
  "issuerAddress": "0x23041c3e04a6770df70616608b6b1517735f7fc2", // has to be a valid address (the format depends on the ledger)
  "extendedMaturityDate": "2026-04-03T10:11:18.729",
  "isSoftBullet": false, // whether there is a soft bullet option
  "softBulletPeriodInMonths": 12, // the number of months by which the maturity date is postponed in case the soft bullet option is exercised by the issuer
  "spread": 0,
  "issuerId": "LEI_ISSUER_1",
  "registrarId": "LEI_REGISTRAR",
  "settlementAgentId": "LEI_SETTLEMENT_AGENT"
        }
```

Once the mutation is executed, you should receive a `InstrumentListed` notification in the Registry Notification Subscription.
Keep that address, it represents your new Bond.

<div class="froBorder" >
    <div class="explorer" id="createBond"></div>
</div>
<script src="./../../../js/bondEmission.js" type="application/javascript"></script>
<script>
const froEndPoint = 'http://localhost:6661/graphql';
const froSubEndPoint = 'ws://localhost:6661/graphql';

ReactDOM.render(
React.createElement(GraphiQL, {
fetcher: GraphiQL.createFetcher({
  url: froEndPoint,
}),
defaultEditorToolsVisibility: true,
query: createBondMutation,
variables: createBondFROMutationVariables,
}),
document.getElementById('createBond'),
);
</script>