pragma solidity 0.8.0;

import "./SecurityTokenBalancesLibrary.sol";

library BasicTokenLibrary {
    struct BasicToken {
        address owner;
        uint256 initialSupply;
        uint256 currentSupply;
        string name;
        string symbol;
        string isinCode;
        address settler;
        address registrar;
        SecurityTokenBalancesLibrary.SecurityTokenBalances securityTokenBalances;
    }
    event Dummy(); // Needed otherwise typechain has no output

    struct BasicTokenInput {
        uint256 initialSupply;
        string isinCode;
        string name;
        string symbol;
        uint256 denomination;
        uint256 divisor;
        uint256 startDate;
        uint256 initialMaturityDate;
        uint256 firstCouponDate;
        uint256 couponFrequencyInMonths;
        uint256 interestRateInBips;
        bool callable;
        bool isSoftBullet;
        uint256 softBulletPeriodInMonths;
        string currency;
        address registrar;
        address settler;
        address owner;
    }

    struct Bond {
        uint256 denomination;
        uint256 divisor;
        uint256 startDate;
        uint256 maturityDate;
        uint256 currentMaturityDate;
        uint256 firstCouponDate;
        uint256 couponFrequencyInMonths;
        uint256 interestRateInBips;
        bool callable;
        bool isSoftBullet;
        uint256 softBulletPeriodInMonths;
        string termsheetUrl;
        string currency;
        mapping(address => uint256) tokensToBurn;
        uint256 state;
    }
}
