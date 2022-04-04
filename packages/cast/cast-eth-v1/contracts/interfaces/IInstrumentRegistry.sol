pragma solidity 0.8.0;

interface IInstrumentRegistry {
    function listInstrument(
        string calldata name,
        string calldata isinCode,
        address instrumentAddress
    ) external;

    function getInstrumentByName(string calldata name)
        external
        view
        returns (address instrument);

    function getInstrumentByIsinCode(string calldata isin)
        external
        view
        returns (address instrument);

    function getAllInstruments()
        external
        view
        returns (address[] memory instrument);

    function unListInstrument(string calldata isin) external;
}
