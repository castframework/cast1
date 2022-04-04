pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IInstrumentRegistry.sol";
import "./tokens/ForgeBond.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ForgeInstrumentRegistry is IInstrumentRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(string => address) private instrumentsByName;
    mapping(string => address) private instrumentsByIsinCode;
    mapping(string => string) private isinToName;
    address[] private instruments;
    address private owner;

    string[] private factoryTypes;
    mapping(string => address) public factories; // factoryType => factory address

    constructor(address _owner) public {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the registry owner");
        _;
    }

    modifier onlyAuthorizedFactory() {
        require(
            isFactoryAuthorized(msg.sender),
            "Calling contract is not authorized"
        );
        _;
    }

    function getAllFactoryTypes() external view returns (string[] memory) {
        return factoryTypes;
    }

    function getFactory(string calldata factoryType)
        external
        view
        returns (address)
    {
        return factories[factoryType];
    }

    function authorizeFactory(
        string calldata factoryType,
        address factoryAddress
    ) external onlyOwner {
        require(factoryAddress != address(0), "Cannot authorize zero address");

        if (factories[factoryType] == address(0)) {
            factoryTypes.push(factoryType);
        }

        factories[factoryType] = factoryAddress;
    }

    function unAuthorizeFactory(address factoryAddress) external onlyOwner {
        require(
            factoryAddress != address(0),
            "Cannot unauthorize zero address"
        );

        uint256 nbFactories = factoryTypes.length;
        for (uint256 i = 0; i < nbFactories; i++) {
            if (factories[factoryTypes[i]] == factoryAddress) {
                delete factories[factoryTypes[i]];
                factoryTypes[i] = factoryTypes[nbFactories - 1];
                factoryTypes.pop();
                return;
            }
        }
        require(false, "Factory not found");
    }

    function isFactoryAuthorized(address factoryAddress)
        public
        view
        returns (bool)
    {
        uint256 nbFactories = factoryTypes.length;
        for (uint256 i = 0; i < nbFactories; i++) {
            if (factories[factoryTypes[i]] == factoryAddress) {
                return true;
            }
        }
        return false;
    }

    function listInstrument(
        string calldata name,
        string calldata isinCode,
        address instrumentAddress
    ) external override onlyAuthorizedFactory {
        require(
            instrumentsByName[name] == address(0),
            "Bond with this name already exists"
        );
        require(
            instrumentsByIsinCode[isinCode] == address(0),
            "Bond with this isin already exists"
        );

        instrumentsByName[name] = instrumentAddress;
        instrumentsByIsinCode[isinCode] = instrumentAddress;
        isinToName[isinCode] = name;
        instruments.push(instrumentAddress);

        emit InstrumentListed(name, isinCode, instrumentAddress);
    }

    function unListInstrument(string calldata isin)
        external
        override
        onlyAuthorizedFactory
    {
        address instrumentAddress = instrumentsByIsinCode[isin];

        require(instrumentAddress != address(0), "Instrument was not listed");

        emit InstrumentUnlisted(isinToName[isin], isin, instrumentAddress);

        delete instrumentsByName[isinToName[isin]];
        delete instrumentsByIsinCode[isin];
        delete isinToName[isin];

        uint256 nbInstrument = instruments.length;
        for (uint256 i = 0; i < nbInstrument; i++) {
            if (instruments[i] == instrumentAddress) {
                instruments[i] = instruments[nbInstrument - 1];
                instruments.pop();
                break;
            }
        }
    }

    function getInstrumentByName(string calldata name)
        external
        view
        override
        returns (address instrument)
    {
        return instrumentsByName[name];
    }

    function getInstrumentByIsinCode(string calldata isinCode)
        external
        view
        override
        returns (address instrument)
    {
        return instrumentsByIsinCode[isinCode];
    }

    function getAllInstruments()
        external
        view
        override
        returns (address[] memory instrument)
    {
        return instruments;
    }

    event InstrumentListed(string name, string isin, address instrumentAddress);
    event InstrumentUnlisted(
        string name,
        string isin,
        address instrumentAddress
    );
}
