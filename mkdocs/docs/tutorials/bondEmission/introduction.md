# Emitting a Bond using Financial Oracles

This step by step guide will go through the bond emission process.
At the end of this tutorial you will have issued and settled a new Forge Bond on
your local environnement.

For this you need to interact with two components : the <span class="froColor">[Financial Registrar Oracle (FRO)](/modules/explorerFRO)</span> and the <span class="fsoColor">[Financial Settlement Oracle (FSO)](/modules/explorerFSO)</span>.

You will find, along these steps, interactive explorers preloaded with sample requests.
If you wish, standalone playgrounds for the <span class="froColor">[FRO](http://localhost:6661/graphql)</span> and <span class="fsoColor">[FSO](http://localhost:6663/graphql)</span> are also available.

Each step of the process is on a different page. It will be necessary to open up multiple pages simultaneously in order to list capture information during subscriptions and use that information in other queries and mutations.

1. <a href="../registryNotification" target="_blank">Registry Notification</a>
2. <a href="../contractNotification" target="_blank">Contract Notification</a>
3. <a href="../FROledgerAddress" target="_blank">FRO Ledger Address</a>
4. <a href="../FSOledgerAddress" target="_blank">FSO Ledger Address</a>
5. <a href="../createBond" target="_blank">Create Bond</a>
6. <a href="../bondSubscription" target="_blank">Bond Subscription</a>
7. <a href="../settlement" target="_blank">Settlement</a>
8. <a href="../receivePayment" target="_blank">Receive Payment</a>
9. <a href="../transferPayment" target="_blank">Transfer Payment</a>

## Event Subscription

First of all, you will need to subscribe to specific events on the blockchain.
The different actors use these events to coordinate themselves.
Any Financial Oracle (FO) can do this. For this tutorial, we will be using the <span class="froColor">FRO</span>.

## Settling the Subscription

Now that the subscription has been made on the blockchain, we need to settle the transaction.
In order to settle the cash we need a trusted third party called the "Settler".
To fulfill its role, the settler uses the <span class='fsoColor'>FSO</span>.

In this tutorial we will be using the `INDIRECT` settlement workflow.
In this specific workflow, the settler acts as an escrow.

### Confirm the Settler has received the payment

Take the `paymentReference` from the first movement.
This will update the status of the settlement transaction to `PROCESSED`.

Once the mutation is executed, you should receive a `ConfirmPaymentReceived` notification in the [Contract Notification Subscription](#contracts-notification) !

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentReceived"></div>
</div>

### Confirming the Payment has been Transferred to the Issuer

Take the `paymentReference` from the second movement.
This will update the status of the settlement transaction to `SETTLED`.

Once the mutation is executed, you should receive a `ConfirmPaymentTransferred` notification in the [Contract Notification Subscription](#contracts-notification) !

<div class="fsoBorder" >
    <div class="explorer" id="fsoConfirmPaymentTransferred"></div>
</div>

**Congratulations** You have just issued and subscribed to a Forge Bond !
