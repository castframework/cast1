pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;
import "./IterableBalances.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @dev Models a address -> uint mapping where it is possible to iterate over all keys.
library SecurityTokenBalancesLibrary {
    using IterableBalances for IterableBalances.iterableBalances;
    using SafeMath for uint256;

    struct SecurityTokenBalances {
        address issuer;
        IterableBalances.iterableBalances iterableBalances;
    }

    struct Balance {
        address _address;
        uint256 _balance;
        uint256 _locked;
    }

    event Transfer(address indexed _from, address indexed _to, uint256 _value); // Only for erc20 explorer

    function setIssuer(SecurityTokenBalances storage self, address key) public {
        self.issuer = key;
    }

    function mint(
        SecurityTokenBalances storage self,
        address key,
        uint256 balance
    ) public {
        require(key == self.issuer, "Only issuer balance can be minted");
        self.iterableBalances.insert(key, balance);
    }

    function lock(
        SecurityTokenBalances storage self,
        address key,
        uint256 valueToLock
    ) public {
        require(
            self.iterableBalances.balances[key].balance -
                self.iterableBalances.balances[key].locked >=
                valueToLock,
            "Can not lock value : insufficient disposable balance"
        );

        self.iterableBalances.balances[key].locked += valueToLock;
    }

    function unlock(
        SecurityTokenBalances storage self,
        address key,
        uint256 valueToUnlock
    ) public {
        require(
            self.iterableBalances.balances[key].balance >= valueToUnlock,
            "Can not unlock value : insufficient balance"
        );
        require(
            self.iterableBalances.balances[key].locked >= valueToUnlock,
            "Can not unlock value : insufficient locked balance"
        );

        self.iterableBalances.balances[key].locked -= valueToUnlock;
    }

    function burn(
        SecurityTokenBalances storage self,
        address _from,
        uint256 _value
    ) public {
        require(
            self.iterableBalances.balances[_from].balance -
                self.iterableBalances.balances[_from].locked >=
                _value,
            "Can not burn value : insufficient disposable balance"
        );

        self.iterableBalances.balances[_from].balance -= _value;

        emit Transfer(_from, address(0), _value);
    }

    function transferLocked(
        SecurityTokenBalances storage self,
        address _from,
        address _to,
        uint256 _value
    ) external {
        unlock(self, _from, _value);

        self.iterableBalances.balances[_from].balance -= _value;

        self.iterableBalances.insert(
            _to,
            self.iterableBalances.balances[_to].balance + _value
        );

        emit Transfer(_from, _to, _value);
    }

    function getBalance(SecurityTokenBalances storage self, address _address)
        external
        view
        returns (uint256 balance)
    {
        return self.iterableBalances.balances[_address].balance;
    }

    function getFullBalance(
        SecurityTokenBalances storage self,
        address _address
    ) external view returns (Balance memory value) {
        return
            Balance(
                _address,
                self.iterableBalances.balances[_address].balance,
                self.iterableBalances.balances[_address].locked
            );
    }

    function getFullBalances(SecurityTokenBalances storage self)
        public
        view
        returns (Balance[] memory value)
    {
        address tokenHolder = address(0);
        uint256 balance;
        uint256 locked;
        uint256 balancesSize = self.iterableBalances.size;
        Balance[] memory addressBalanceArray = new Balance[](balancesSize);
        for (
            uint256 index = self.iterableBalances.iterate_start();
            self.iterableBalances.iterate_valid(index);
            index = self.iterableBalances.iterate_next(index)
        ) {
            (tokenHolder, balance, locked) = self.iterableBalances.iterate_get(
                index
            );
            addressBalanceArray[index] = Balance(tokenHolder, balance, locked);
        }

        return addressBalanceArray;
    }

    function totalSupply(SecurityTokenBalances storage self)
        public
        view
        returns (uint256)
    {
        uint256 total = 0;
        uint256 balance;
        uint256 locked;

        for (
            uint256 index = self.iterableBalances.iterate_start();
            self.iterableBalances.iterate_valid(index);
            index = self.iterableBalances.iterate_next(index)
        ) {
            (, balance, locked) = self.iterableBalances.iterate_get(index);

            total += balance + locked;
        }

        return total;
    }
}
