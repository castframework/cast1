# Settlement

The required ID should be the 'id' from the "lightSettlementTransactions" array that can be found in the `SubscriptionInitiated` notification of the Contract Notification Subscription.

<div class="fsoBorder" >
    <div class="explorer" id="fsoGetSettlementTransaction"></div>
</div>

The result shows the `movements`, which are the payments made between the buyer, the seller, and the escrow. 
Keep in mind that the buyer sends <ins>cash</ins> to the escrow, but a <ins>token</ins> to the seller.
The escrow then sends the buyer's cash to the seller. The status of the settlement transaction becomes `ACKNOWLEDGED`.

<script>

</script>