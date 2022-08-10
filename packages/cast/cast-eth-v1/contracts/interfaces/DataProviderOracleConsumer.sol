// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface DataProviderOracleConsumer {
    function ConsumeData(
        int192 result,
        int8 decimal,
        uint64 timestamp
    ) external;
}
