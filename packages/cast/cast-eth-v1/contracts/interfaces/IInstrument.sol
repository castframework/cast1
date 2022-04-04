pragma solidity 0.8.0;

// For the moment, only Type Bond in ETH
interface IInstrument {
    function getType() external view returns (string memory);
}
