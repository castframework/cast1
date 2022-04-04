pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "./SettlementRepositoryLibrary.sol";
import "./BasicTokenLibrary.sol";
import "./SecurityTokenBalancesLibrary.sol";

library SettlementWorkflowLibrary {
    uint256 private constant CREATED = 0x01;
    uint256 private constant TOKEN_LOCKED = 0x02;
    uint256 private constant CASH_RECEIVED = 0x03;
    uint256 public constant CASH_TRANSFERRED = 0x04;
    uint256 public constant CANCELLED = 0x05;
    uint256 private constant ERROR = 0xFF;

    uint256 private constant SUBSCRIPTION = 0x01;
    uint256 private constant REDEMPTION = 0x02;
    uint256 private constant TRADE = 0x03;

    using SettlementRepositoryLibrary for SettlementRepositoryLibrary.SettlementTransactionRepository;
    using SecurityTokenBalancesLibrary for SecurityTokenBalancesLibrary.SecurityTokenBalances;

    function initiateDVP(
        SettlementRepositoryLibrary.SettlementTransactionRepository
            storage settlementTransactionRepository,
        BasicTokenLibrary.BasicToken storage token,
        uint256 settlementTransactionId
    ) public {
        SettlementRepositoryLibrary.SettlementTransaction
            memory st = settlementTransactionRepository
                .getSettlementTransactionById(settlementTransactionId);

        token.securityTokenBalances.lock(
            st.deliverySenderAccountNumber,
            st.deliveryQuantity
        );

        settlementTransactionRepository.setSettlementTransactionStatus(
            settlementTransactionId,
            TOKEN_LOCKED
        );
    }

    function initiateSubscription(
        SettlementRepositoryLibrary.SettlementTransactionRepository
            storage settlementTransactionRepository,
        BasicTokenLibrary.BasicToken storage token,
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public {
        require(
            token.owner ==
                partialSettlementTransaction.deliverySenderAccountNumber,
            "deliverySenderAccountNumber must match token owner"
        );

        settlementTransactionRepository.createSettlementTransaction(
            partialSettlementTransaction
        );

        initiateDVP(
            settlementTransactionRepository,
            token,
            partialSettlementTransaction.txId
        );

        settlementTransactionRepository.setOperationType(
            partialSettlementTransaction.operationId,
            SUBSCRIPTION
        );
    }

    function initiateTrade(
        SettlementRepositoryLibrary.SettlementTransactionRepository
            storage settlementTransactionRepository,
        BasicTokenLibrary.BasicToken storage token,
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public {
        settlementTransactionRepository.createSettlementTransaction(
            partialSettlementTransaction
        );

        initiateDVP(
            settlementTransactionRepository,
            token,
            partialSettlementTransaction.txId
        );

        settlementTransactionRepository.setOperationType(
            partialSettlementTransaction.operationId,
            TRADE
        );
    }

    // Test

    function initiateRedemption(
        SettlementRepositoryLibrary.SettlementTransactionRepository
            storage settlementTransactionRepository,
        BasicTokenLibrary.BasicToken storage token,
        SettlementRepositoryLibrary.PartialSettlementTransaction[]
            memory partialSettlementTransactions
    ) public {
        for (uint256 i = 0; i < partialSettlementTransactions.length; i++) {
            require(
                token.owner ==
                    partialSettlementTransactions[i]
                        .deliveryReceiverAccountNumber,
                "deliveryReceiverAccountNumber must match token owner"
            );

            settlementTransactionRepository.createSettlementTransaction(
                partialSettlementTransactions[i]
            );

            initiateDVP(
                settlementTransactionRepository,
                token,
                partialSettlementTransactions[i].txId
            );
        }

        settlementTransactionRepository.setOperationType(
            partialSettlementTransactions[0].operationId,
            REDEMPTION
        );
    }

    function cancelSettlementTransaction(
        SettlementRepositoryLibrary.SettlementTransactionRepository
            storage settlementTransactionRepository,
        BasicTokenLibrary.BasicToken storage token,
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public {
        require(
            settlementTransactionRepository
                .settlementTransactionById[partialSettlementTransaction.txId]
                .txId != 0,
            "You can't cancel a not existing Settlement Transaction"
        );

        require(
            settlementTransactionRepository
                .settlementTransactionById[partialSettlementTransaction.txId]
                .status == TOKEN_LOCKED,
            "The settlement transaction is not in TOKEN_LOCKED state"
        );

        token.securityTokenBalances.unlock(
            partialSettlementTransaction.deliverySenderAccountNumber,
            partialSettlementTransaction.deliveryQuantity
        );
        settlementTransactionRepository.setSettlementTransactionStatus(
            partialSettlementTransaction.txId,
            CANCELLED
        );
    }
}
