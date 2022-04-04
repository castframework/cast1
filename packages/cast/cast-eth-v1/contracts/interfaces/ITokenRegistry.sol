pragma solidity 0.8.0;

interface ITokenRegistry {
    function getTokenByName(string calldata name)
        external
        view
        returns (address tokenContractAddress);

    function getTokenByIsinCode(string calldata isinCode)
        external
        view
        returns (address tokenContractAddress);

    function getAllTokens()
        external
        view
        returns (address[] memory tokenContractAddresses);
}
