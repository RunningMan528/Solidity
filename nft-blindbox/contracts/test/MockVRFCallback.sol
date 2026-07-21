// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "../interfaces/IVRFHandler.sol";

contract MockVRFCallback is IVRFCallback {
    uint256 public lastRequestId;
    uint256 public lastTokenId;
    uint256 public lastRandomness;

    function handleVRFCallback(
        uint256 requestId,
        uint256 tokenId,
        uint256 randomness
    ) external override {
        lastRequestId = requestId;
        lastTokenId = tokenId;
        lastRandomness = randomness;
    }
}