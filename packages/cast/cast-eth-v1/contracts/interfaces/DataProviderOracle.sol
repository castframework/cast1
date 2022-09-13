// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface DataProviderOracle {
    function SubmitRequest() external;
    event DataRequest(address caller, uint256 id);
}
