# Explorer FSO (Forge Settlement Oracle)

The <span class="fsoColor">Forge Settlement Oracle (FSO)</span> is designed to provide important DvP (Delivery vs Payment) functionalities when the issuer and investor are prepared to complete the trade. This oracle can be connected to an outside entity to extend payment options.

This workflow exposes the settlement agent operations!
## Subscribe to notification feeds

Listening for contract creation.

<div class="fsoBorder" >
  <div class="explorer" id="fsoSubscribeToContractCreation"></div>
</div>

## Confirm Payment Received

Confirm the payment received from the buyer on the escrow account.

<div class="fsoBorder" >
  <div class="explorer" id="fsoConfirmPaymentReceived"></div>
</div>

## Confirm Payment Transferred

Confirm the payment sent to the seller.

<div class="fsoBorder" >
  <div class="explorer" id="fsoConfirmPaymentTransferred"></div>
</div>

<script>
  var fsoEndPoint = 'http://localhost:6663/graphql'
  new window.EmbeddedExplorer({
    target: '#fsoSubscribeToContractCreation',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
      document: `subscription {
            contractNotification {
                notificationName
                instrumentAddress
                transactionHash
                lightSettlementTransactions {
                    id
                    participantAccountNumbers {
                        securityDeliverer
                        securityReceiver  
                    }
                }
            }
        }`,
        variables: {
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
        },
  });

   new window.EmbeddedExplorer({
    target: '#fsoConfirmPaymentReceived',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
      document: ` mutation ConfirmPaymentReceived($paymentReference: String!) {
        confirmPaymentReceived(paymentReference: $paymentReference)
        }`,
        variables: {
           paymentReference:"787e6d73fd4c7804"
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
        },
  });

  new window.EmbeddedExplorer({
    target: '#fsoConfirmPaymentTransferred',
    endpointUrl: fsoEndPoint,
    schema: window.getFsoSchema(),
    initialState: {
      document: ` mutation ConfirmPaymentTransferred($paymentReference: String!) {
            confirmPaymentTransferred(paymentReference: $paymentReference)
            }`,
        variables: {
           paymentReference:"787e6d73fd4c7804"
        },
        displayOptions: {
            showHeadersAndEnvVars: true,
            docsPanelState: 'closed',
        },
        },
  });
</script>
