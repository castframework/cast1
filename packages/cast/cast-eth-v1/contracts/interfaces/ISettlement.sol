pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "../libraries/SettlementRepositoryLibrary.sol";

interface ISettlement {
    function initiateSubscription(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            calldata partialSettlementTransaction
    ) external;

    function initiateTrade(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            calldata partialSettlementTransaction
    ) external;

    function initiateRedemption(
        SettlementRepositoryLibrary.PartialSettlementTransaction[]
            calldata settlementTransaction
    ) external;

    function cancelSettlementTransaction(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            calldata partialSettlementTransaction
    ) external;

    function confirmPaymentReceived(uint256 settlementTransactionId) external;

    function confirmPaymentTransferred(uint256 settlementTransactionId)
        external;

    event SubscriptionInitiated(uint256 settlementTransactionId);
    event TradeInitiated(uint256 settlementTransactionId);
    event RedemptionInitiated(uint256[] settlementTransactionIds);
    event PaymentReceived(
        uint256 settlementTransactionId,
        uint256 settlementTransactionOperationType
    );
    event PaymentTransferred(
        uint256 settlementTransactionId,
        uint256 settlementTransactionOperationType
    );
    event SettlementTransactionCanceled(uint256 settlementTransactionId);
}
