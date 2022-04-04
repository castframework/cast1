pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IOperatorManager.sol";
import "./SecurityTokenBalancesLibrary.sol";
import "./BasicTokenLibrary.sol";

library SettlementRepositoryLibrary {
    using SecurityTokenBalancesLibrary for SecurityTokenBalancesLibrary.SecurityTokenBalances;
    using SettlementRepositoryLibrary for SettlementRepositoryLibrary.SettlementTransactionRepository;

    using BasicTokenLibrary for BasicTokenLibrary.BasicToken;

    uint256 private constant CREATED = 0x01;
    uint256 private constant TOKEN_LOCKED = 0x02;
    uint256 private constant CASH_RECEIVED = 0x03;
    uint256 public constant CASH_TRANSFERRED = 0x04;
    uint256 public constant CANCELLED = 0x05;
    uint256 private constant ERROR = 0xFF;

    struct SettlementTransactionRepository {
        mapping(uint256 => SettlementTransaction) settlementTransactionById; // mapping ( settlementtransactionId => settlementtransaction)
        mapping(uint256 => uint256) operationTypeByOperationId; // operationId -> operationType
    }

    struct SettlementTransaction {
        uint256 txId;
        uint256 operationId;
        address deliverySenderAccountNumber;
        address deliveryReceiverAccountNumber;
        uint256 deliveryQuantity;
        uint256 status;
        string txHash;
    }

    struct PartialSettlementTransaction {
        uint256 txId;
        uint256 operationId;
        address deliverySenderAccountNumber; // redemption investor - subscription issuer
        address deliveryReceiverAccountNumber; // redemption issuer - subscription investor
        uint256 deliveryQuantity;
        string txHash;
    }

    function getSettlementTransactionById(
        SettlementTransactionRepository storage settlementTransactionRepository,
        uint256 id
    ) public view returns (SettlementTransaction memory) {
        SettlementTransaction
            storage settlementTransaction = settlementTransactionRepository
                .settlementTransactionById[id];

        return settlementTransaction;
        // the return will be copied on memory to ensure no unwanted mutation
        // can be done. This have an impact on gas consumption as memory
        // expansion cost gas.
    }

    function setSettlementTransactionStatus(
        SettlementTransactionRepository storage settlementTransactionRepository,
        uint256 txId,
        uint256 status
    ) internal {
        require(
            status == CREATED ||
                status == TOKEN_LOCKED ||
                status == CASH_RECEIVED ||
                status == CASH_TRANSFERRED ||
                status == CANCELLED ||
                status == ERROR,
            "Can not set status : Invalid Status"
        );

        SettlementTransaction
            storage settlementTransaction = settlementTransactionRepository
                .settlementTransactionById[txId];
        settlementTransaction.status = status;
    }

    function createSettlementTransaction(
        SettlementTransactionRepository storage settlementTransactionRepository,
        PartialSettlementTransaction memory partialSettlementTransaction
    ) internal {
        require(
            settlementTransactionRepository
                .settlementTransactionById[partialSettlementTransaction.txId]
                .txId != partialSettlementTransaction.txId,
            "Settlement Transaction already exist with this id"
        );

        SettlementTransaction
            memory newSettlementTransaction = SettlementTransaction({
                txId: partialSettlementTransaction.txId,
                operationId: partialSettlementTransaction.operationId,
                deliverySenderAccountNumber: partialSettlementTransaction
                    .deliverySenderAccountNumber,
                deliveryReceiverAccountNumber: partialSettlementTransaction
                    .deliveryReceiverAccountNumber,
                deliveryQuantity: partialSettlementTransaction.deliveryQuantity,
                txHash: partialSettlementTransaction.txHash,
                status: CREATED
            });
        settlementTransactionRepository.settlementTransactionById[
                partialSettlementTransaction.txId
            ] = newSettlementTransaction;
    }

    // Operation type management

    function getOperationType(
        SettlementTransactionRepository storage settlementTransactionRepository,
        uint256 _operationId
    ) external view returns (uint256) {
        return
            settlementTransactionRepository.operationTypeByOperationId[
                _operationId
            ];
    }

    function getOperationTypeForSettlementTransaction(
        SettlementTransactionRepository storage settlementTransactionRepository,
        uint256 _settlementTransactionId
    ) external view returns (uint256) {
        return
            settlementTransactionRepository.operationTypeByOperationId[
                settlementTransactionRepository
                    .settlementTransactionById[_settlementTransactionId]
                    .operationId
            ];
    }

    function setOperationType(
        SettlementTransactionRepository storage settlementTransactionRepository,
        uint256 _operationId,
        uint256 _operationType
    ) internal {
        settlementTransactionRepository.operationTypeByOperationId[
                _operationId
            ] = _operationType;
    }
}
