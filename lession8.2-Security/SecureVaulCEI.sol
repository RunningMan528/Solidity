// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 使用CEI 修复模式 Checks-Effects-Interactions
contract SecureVaulCEI {
    mapping (address => uint) public balances;

    function deposit() external payable {
        require(msg.value > 0, "Invalid amount!");
        balances[msg.sender] += msg.value;
    }

    function withDraw() external {
        // Checks
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance!");

        // Effects
        balances[msg.sender] -= amount;

        // Interactions
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transaction failed!");
    }
}