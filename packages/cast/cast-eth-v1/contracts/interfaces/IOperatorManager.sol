pragma solidity 0.8.0;

interface IOperatorManager {
    function authorizeOperator(uint256 _roleName, address _operatorAddress)
        external;

    function isOperatorWithRoleAuthorized(
        address _operatorAddress,
        uint256 _roleName
    ) external view returns (bool);

    function revokeOperatorAuthorization(
        address _operatorAddress,
        uint256 _roleName
    ) external;

    event NewOperator(address indexed _by, address indexed _operator);
}
