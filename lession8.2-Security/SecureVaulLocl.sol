// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 使用重入锁修复
contract SecureVaulLock {
    mapping (address => uint) public balances;
    bool private locked;

    modifier noReentrant() {
        require(!locked, "No reentrancy!");
        locked = true;
        _;
        locked = false;
    }

    function deposit() external payable  {
        require(msg.value > 0,"No amount!");
        balances[msg.sender] += msg.value;
    }

    function withDraw() external noReentrant {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance!");

        balances[msg.sender] = 0;
        (bool success,) = msg.sender.call{value:amount}("");
        require(success, "Transiaction failed!");
    }
}