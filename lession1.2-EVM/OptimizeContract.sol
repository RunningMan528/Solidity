// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OptimizeContract {
    uint256[] public numbers;
    address public immutable ADMIN;
    uint256 public constant MULTIPLIER = 2;

    constructor() {
        ADMIN = msg.sender;
    }

    function batchProcess(uint256[] calldata inputs) external {
        require(msg.sender == ADMIN);
        uint256 length = inputs.length;
        // 先计算不写入，storage存储比memory消耗大
        for (uint i = 0; i < length; i ++) {
            uint256 result = inputs[i] * MULTIPLIER;
            numbers[i] = result;
        }
    }

    function getSum() external view returns (uint256) {
        require(msg.sender == ADMIN);
        uint256 sum = 0;
        uint256 len = numbers.length;
        for (uint i = 0; i < len; i++) {
            sum += numbers[i];
        }
        return sum;
    }
}