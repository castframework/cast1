pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "./AbstractInstrumentFactory.sol";
import "./tokens/ForgeBond.sol";
import "./ForgeInstrumentRegistry.sol";

contract ForgeBondFactory is AbstractInstrumentFactory {
    constructor(address owner) public AbstractInstrumentFactory(owner) {}

    function createForgeBond(
        address registryAddress,
        BasicTokenLibrary.BasicTokenInput memory basicTokenInput
    ) public onlyOwner returns (address) {
        require(
            msg.sender == basicTokenInput.registrar,
            "Calling address should match registrar agent"
        );

        address result = address(new ForgeBond(basicTokenInput));

        ForgeInstrumentRegistry forgeInstrumentRegistry = ForgeInstrumentRegistry(
                registryAddress
            );

        forgeInstrumentRegistry.listInstrument(
            string(basicTokenInput.name),
            string(basicTokenInput.isinCode),
            result
        );

        emit InstrumentListed(result);

        return result;
    }

    event InstrumentListed(address _instrumentAddress);
}
