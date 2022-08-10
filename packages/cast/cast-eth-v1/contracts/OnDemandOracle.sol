// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AbstractInstrumentFactory.sol";
import "./interfaces/DataProviderOracle.sol";
import "./interfaces/DataProviderOracleConsumer.sol";

// simple store data contract
contract OnDemandOracle is DataProviderOracle, AbstractInstrumentFactory {
    struct OracleResult {
        int192 result; //  -0.218   (6 decimals)
        int8 decimal;
        uint64 timestamp; // timestamp of the collection
        // add figi
        // add timestamp of the data
        // add
    }

    struct OracleRequest {
        address caller;
        // another type of data needed here for the parameter ??
        // add figi
    }

    // outside MDA keeps on monitoring the nextId of the contract
    uint256 public lastID;
    mapping(uint256 => OracleResult) public oracleResults;
    mapping(uint256 => OracleRequest) public oracleRequests;

    // content to think about, there should also be a type of data asked by the caller
    event DataRequest(address caller, uint256 id); // don't know if it is possible

    constructor(address owner) public AbstractInstrumentFactory(owner) {
        lastID = 0;
    }

    function SubmitRequest() external override {
        lastID++;

        // should insert the data in callerMapping
        oracleRequests[lastID] = OracleRequest(msg.sender);

        // this should be picked up by the outside MDA (or it keeps monitoring the value of nextId)
        emit DataRequest(oracleRequests[lastID].caller, lastID);
    }

    // make sure this method is only called by the MDA (owner only) - to be added
    // the caller should implement our solidity interface to be able to process our result
    // only owner or something like this
    function WriteResult(
        uint256 jobId,
        int192 result,
        int8 decimals,
        uint64 timestamp
    ) public onlyOwner {
        // write the result on the blockchain in this contract
        oracleResults[jobId] = OracleResult(result, decimals, timestamp);

        // and write the result in the contract that made the request
        address callerAddress = oracleRequests[jobId].caller;
        DataProviderOracleConsumer(callerAddress).ConsumeData(
            result,
            decimals,
            timestamp
        );

        // Emit an event to be subscribed to by the NestJS Oracle service
    }
}
