// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 简单的计数器合约
contract Counter {
    uint public count;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
        count = 0;
    }

    function increment() external {
        require(owner == msg.sender, "Not owner!");
        count++;
    }
}