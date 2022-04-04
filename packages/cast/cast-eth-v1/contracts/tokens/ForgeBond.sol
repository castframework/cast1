pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;
import "../libraries/BasicTokenLibrary.sol";
import "../libraries/OperatorManagerLibrary.sol";
import "../libraries/SecurityTokenBalancesLibrary.sol";
import "../libraries/IterableBalances.sol";
import "../libraries/SettlementRepositoryLibrary.sol";
import "../libraries/SettlementWorkflowLibrary.sol";
import "../interfaces/IBasicToken.sol";
import "../interfaces/IInstrument.sol";
import "../interfaces/IOperatorManager.sol";
import "../interfaces/ISettlement.sol";

contract ForgeBond is IBasicToken, IOperatorManager, ISettlement, IInstrument {
    using BasicTokenLibrary for BasicTokenLibrary.BasicToken;
    using BasicTokenLibrary for BasicTokenLibrary.Bond;

    using SecurityTokenBalancesLibrary for SecurityTokenBalancesLibrary.SecurityTokenBalances;
    using OperatorManagerLibrary for OperatorManagerLibrary.OperatorManager;
    using SettlementRepositoryLibrary for SettlementRepositoryLibrary.SettlementTransactionRepository;

    BasicTokenLibrary.BasicToken private token;
    BasicTokenLibrary.Bond private bond;
    OperatorManagerLibrary.OperatorManager private operatorManager;
    SettlementRepositoryLibrary.SettlementTransactionRepository
        private settlementTransactionRepository;

    uint256 public constant REGISTRAR_ROLE = 0x01;
    uint256 public constant SETTLER_ROLE = 0x02;

    // bond state Type
    uint256 private constant STATE_CREATED = 0x01;
    uint256 private constant STATE_RUNNING = 0x02;
    uint256 private constant STATE_REDEEMED = 0x03;

    // operation Type
    uint256 private constant SUBSCRIPTION = 0x01;
    uint256 private constant REDEMPTION = 0x02;
    uint256 private constant TRADE = 0x03;

    // Settlement Status
    uint256 private constant CREATED = 0x01;
    uint256 private constant TOKEN_LOCKED = 0x02;
    uint256 private constant CASH_RECEIVED = 0x03;
    uint256 public constant CASH_TRANSFERRED = 0x04;
    uint256 public constant CANCELLED = 0x05;
    uint256 private constant ERROR = 0xFF;

    event Transfer(address indexed _from, address indexed _to, uint256 _value); // Only for erc20 explorer

    constructor(BasicTokenLibrary.BasicTokenInput memory basicTokenInput)
        public
    {
        token.owner = basicTokenInput.owner;
        token.initialSupply = basicTokenInput.initialSupply;
        token.currentSupply = basicTokenInput.initialSupply;
        token.isinCode = basicTokenInput.isinCode;
        token.name = basicTokenInput.name;
        token.symbol = basicTokenInput.symbol;
        token.settler = basicTokenInput.settler;
        token.registrar = basicTokenInput.registrar;
        token.securityTokenBalances.setIssuer(token.owner);
        token.securityTokenBalances.mint(token.owner, token.initialSupply);
        bond.denomination = basicTokenInput.denomination;
        bond.divisor = basicTokenInput.divisor;
        bond.startDate = basicTokenInput.startDate;
        bond.maturityDate = basicTokenInput.initialMaturityDate;
        bond.currentMaturityDate = bond.maturityDate;
        bond.firstCouponDate = basicTokenInput.firstCouponDate;
        bond.couponFrequencyInMonths = basicTokenInput.couponFrequencyInMonths;
        bond.interestRateInBips = basicTokenInput.interestRateInBips;
        bond.callable = basicTokenInput.callable;
        bond.isSoftBullet = basicTokenInput.isSoftBullet;
        bond.state = STATE_CREATED;
        bond.currency = basicTokenInput.currency;
        bond.softBulletPeriodInMonths = basicTokenInput
            .softBulletPeriodInMonths;
        operatorManager.authorizeOperator(REGISTRAR_ROLE, token.registrar);
        operatorManager.authorizeOperator(SETTLER_ROLE, token.settler);
    }

    // Basic Token
    function owner() public view returns (address) {
        return token.owner;
    }

    function settler() public view returns (address) {
        return token.settler;
    }

    function registrar() public view returns (address) {
        return token.registrar;
    }

    function initialSupply() public view returns (uint256) {
        return token.initialSupply;
    }

    function currentSupply() public view returns (uint256) {
        return token.currentSupply;
    }

    function name() public view returns (string memory) {
        return token.name;
    }

    function symbol() public view returns (string memory) {
        return token.symbol;
    }

    function isinCode() public view returns (string memory) {
        return token.isinCode;
    }

    // Bond
    function denomination() public view returns (uint256) {
        return bond.denomination;
    }

    function divisor() public view returns (uint256) {
        return bond.divisor;
    }

    function startDate() public view returns (uint256) {
        return bond.startDate;
    }

    function maturityDate() public view returns (uint256) {
        return bond.maturityDate;
    }

    function currentMaturityDate() public view returns (uint256) {
        return bond.currentMaturityDate;
    }

    function firstCouponDate() public view returns (uint256) {
        return bond.firstCouponDate;
    }

    function couponFrequencyInMonths() public view returns (uint256) {
        return bond.couponFrequencyInMonths;
    }

    function interestRateInBips() public view returns (uint256) {
        return bond.interestRateInBips;
    }

    function callable() public view returns (bool) {
        return bond.callable;
    }

    function isSoftBullet() public view returns (bool) {
        return bond.isSoftBullet;
    }

    function softBulletPeriodInMonths() public view returns (uint256) {
        return bond.softBulletPeriodInMonths;
    }

    function currency() public view returns (string memory) {
        return bond.currency;
    }

    function state() public view returns (uint256) {
        return bond.state;
    }

    function getType() public view override returns (string memory) {
        return "Bond";
    }

    // Modifiers
    modifier issuerOnly() {
        require(
            msg.sender == token.owner,
            "Only issuer can perform this action"
        );
        _;
    }

    modifier registrarOnly() {
        require(
            operatorManager.isOperatorWithRoleAuthorized(
                msg.sender,
                REGISTRAR_ROLE
            ),
            "Only a registrar can perform this action"
        );
        _;
    }

    modifier settlerOnly() {
        require(
            operatorManager.isOperatorWithRoleAuthorized(
                msg.sender,
                SETTLER_ROLE
            ),
            "Only a settler can perform this action"
        );
        _;
    }

    // [ERC-20] Only
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return token.securityTokenBalances.getBalance(_owner);
    }

    function transfer(address _to, uint256 _value)
        public
        pure
        returns (bool success)
    {
        return false;
    }

    function decimals() public pure returns (uint8) {
        return 0;
    }

    function totalSupply() public view returns (uint256) {
        return token.securityTokenBalances.totalSupply();
    }

    function burn(uint256 quantity) public registrarOnly {
        token.securityTokenBalances.burn(token.owner, quantity);
    }

    // IBasicToken

    function getFullBalances()
        public
        view
        returns (SecurityTokenBalancesLibrary.Balance[] memory value)
    {
        return token.securityTokenBalances.getFullBalances();
    }

    function getBalance(address _address) public view returns (uint256 value) {
        return token.securityTokenBalances.getBalance(_address);
    }

    // IOperatorManager
    function authorizeOperator(uint256 _roleName, address _operatorAddress)
        public
        override
        issuerOnly
    {
        operatorManager.authorizeOperator(_roleName, _operatorAddress);
    }

    function isOperatorWithRoleAuthorized(
        address _operatorAddress,
        uint256 _roleName
    ) public view override returns (bool) {
        return
            operatorManager.isOperatorWithRoleAuthorized(
                _operatorAddress,
                _roleName
            );
    }

    function revokeOperatorAuthorization(
        address _operatorAddress,
        uint256 _roleName
    ) public override issuerOnly {
        operatorManager.revokeOperatorAuthorization(
            _operatorAddress,
            _roleName
        );
    }

    // ISettlement
    function initiateSubscription(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public override registrarOnly {
        require(
            bond.state < STATE_REDEEMED,
            "Instrument already fully redeemed"
        );
        SettlementWorkflowLibrary.initiateSubscription(
            settlementTransactionRepository,
            token,
            partialSettlementTransaction
        );
        bond.state = STATE_RUNNING;
        emit SubscriptionInitiated(partialSettlementTransaction.txId);
    }

    function initiateTrade(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public override registrarOnly {
        require(
            bond.state < STATE_REDEEMED,
            "Instrument already fully redeemed"
        );
        SettlementWorkflowLibrary.initiateTrade(
            settlementTransactionRepository,
            token,
            partialSettlementTransaction
        );
        bond.state = STATE_RUNNING;
        emit TradeInitiated(partialSettlementTransaction.txId);
    }

    function confirmPaymentReceived(uint256 _settlementTransactionId)
        external
        override
        settlerOnly
    {
        uint256 settlementTransactionOperationType = settlementTransactionRepository
                .getOperationTypeForSettlementTransaction(
                    _settlementTransactionId
                );

        if (settlementTransactionOperationType == SUBSCRIPTION) {
            handleConfirmPaymentReceived(_settlementTransactionId);
        } else if (settlementTransactionOperationType == REDEMPTION) {
            handleConfirmPaymentReceived(_settlementTransactionId);
        } else if (settlementTransactionOperationType == TRADE) {
            handleConfirmPaymentReceived(_settlementTransactionId);
        } else {
            revert("If you see this, this is really bad");
        }

        emit PaymentReceived(
            _settlementTransactionId,
            settlementTransactionOperationType
        );
    }

    function handleConfirmPaymentReceived(uint256 settlementTransactionId)
        internal
    {
        SettlementRepositoryLibrary.SettlementTransaction
            memory st = settlementTransactionRepository
                .getSettlementTransactionById(settlementTransactionId);

        require(
            st.status == TOKEN_LOCKED,
            "The settlement transaction is not in TOKEN_LOCKED state"
        );

        token.securityTokenBalances.transferLocked(
            st.deliverySenderAccountNumber,
            st.deliveryReceiverAccountNumber,
            st.deliveryQuantity
        );

        if (
            settlementTransactionRepository.getOperationType(st.operationId) ==
            REDEMPTION
        ) {
            token.securityTokenBalances.burn(
                st.deliveryReceiverAccountNumber,
                st.deliveryQuantity
            );
        }

        settlementTransactionRepository.setSettlementTransactionStatus(
            settlementTransactionId,
            CASH_RECEIVED
        );
    }

    function confirmPaymentTransferred(uint256 _settlementTransactionId)
        external
        override
        settlerOnly
    {
        SettlementRepositoryLibrary.SettlementTransaction
            memory st = settlementTransactionRepository
                .getSettlementTransactionById(_settlementTransactionId);

        require(
            st.status == CASH_RECEIVED,
            "The settlement transaction is not in CASH_RECEIVED state"
        );

        uint256 settlementTransactionOperationType = settlementTransactionRepository
                .getOperationTypeForSettlementTransaction(
                    _settlementTransactionId
                );
        emit PaymentTransferred(
            _settlementTransactionId,
            settlementTransactionOperationType
        );

        settlementTransactionRepository.setSettlementTransactionStatus(
            _settlementTransactionId,
            CASH_TRANSFERRED
        );
    }

    function getCurrentState(uint256 _settlementTransactionId)
        external
        view
        returns (uint256)
    {
        return
            settlementTransactionRepository
                .getSettlementTransactionById(_settlementTransactionId)
                .status;
    }

    function getOperationType(uint256 _operationId)
        external
        view
        returns (uint256)
    {
        return settlementTransactionRepository.getOperationType(_operationId);
    }

    function initiateRedemption(
        SettlementRepositoryLibrary.PartialSettlementTransaction[]
            memory partialSettlementTransactions
    ) public override registrarOnly {
        require(
            bond.state < STATE_REDEEMED,
            "Instrument already fully redeemed"
        );
        uint256[] memory ids = new uint256[](
            partialSettlementTransactions.length
        );

        SettlementWorkflowLibrary.initiateRedemption(
            settlementTransactionRepository,
            token,
            partialSettlementTransactions
        );

        for (uint256 i = 0; i < partialSettlementTransactions.length; i++) {
            ids[i] = partialSettlementTransactions[i].txId;
        }
        bond.state = STATE_REDEEMED;
        emit RedemptionInitiated(ids);
    }

    function cancelSettlementTransaction(
        SettlementRepositoryLibrary.PartialSettlementTransaction
            memory partialSettlementTransaction
    ) public override registrarOnly {
        SettlementWorkflowLibrary.cancelSettlementTransaction(
            settlementTransactionRepository,
            token,
            partialSettlementTransaction
        );

        emit SettlementTransactionCanceled(partialSettlementTransaction.txId);
    }
}
