// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "./VRFHandler.sol";

/**
 * @title VRFHandlerV2
 * @dev 修复 tokenId 为 0 时被误判为无效请求的问题。
 * @notice 使用 callback 地址判断请求是否存在，因此兼容 V1 已保存的 pending 请求。
 */
contract VRFHandlerV2 is VRFHandler {
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external override onlyCoordinator {
        uint256 tokenId = requestIdToTokenId[requestId];
        address callbackContract = requestIdToCallback[requestId];

        if (callbackContract == address(0)) {
            revert InvalidRequestId();
        }
        if (randomWords.length == 0) {
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