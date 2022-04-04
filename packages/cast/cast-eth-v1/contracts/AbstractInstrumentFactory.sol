pragma solidity 0.8.0;

import "./ForgeInstrumentRegistry.sol";

abstract contract AbstractInstrumentFactory {
    address private owner;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the factory owner");
        _;
    }

    event InstrumentCreated();
}
