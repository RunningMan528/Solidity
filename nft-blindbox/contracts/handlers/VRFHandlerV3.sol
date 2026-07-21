// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./VRFHandlerV2.sol";

/**
 * @title VRFHandlerV3
 * @dev 实现 Chainlink VRF v2.5 coordinator 调用的标准回调入口。
 * @notice 兼容 V1/V2 中已保存的 pending 请求。
 */
contract VRFHandlerV3 is VRFHandlerV2 {
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) external onlyCoordinator {
        uint256 tokenId = requestIdToTokenId[requestId];
        address callbackContract = requestIdToCallback[requestId];

        if (callbackContract == address(0) || randomWords.length == 0) {
            revert InvalidRequestId();
        }

        emit RandomnessFulfilled(requestId, tokenId);
        IVRFCallback(callbackContract).handleVRFCallback(
            requestId,
            tokenId,
            randomWords[0]
        );

        delete requestIdToTokenId[requestId];
        delete requestIdToCallback[requestId];
    }
}