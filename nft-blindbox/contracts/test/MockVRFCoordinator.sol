// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IRawVRFConsumer {
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) external;
}

contract MockVRFCoordinator {
    uint256 private nextRequestId = 1;

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata
    ) external returns (uint256 requestId) {
        requestId = nextRequestId++;
    }

    function fulfill(
        address handler,
        uint256 requestId,
        uint256 randomWord
    ) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomWord;
        IRawVRFConsumer(handler).rawFulfillRandomWords(requestId, randomWords);
    }
}