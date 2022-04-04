pragma solidity 0.8.0;

import "./AbstractInstrumentFactory.sol";
import "./interfaces/ITokenRegistry.sol";
import "./tokens/ForgeBond.sol";
import "./ForgeInstrumentRegistry.sol";

contract ForgeStructuredProductFactory is AbstractInstrumentFactory {
    constructor(address owner) public AbstractInstrumentFactory(owner) {}

    function createStructuredProduct()
        public
        view
        onlyOwner
        returns (string memory)
    {
        return "Expected to fail";
    }
}
