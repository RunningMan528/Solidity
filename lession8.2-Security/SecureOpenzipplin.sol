// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// 使用Openzipplin重入锁实现
contract SecureOpenzipplin is ReentrancyGuard{
    mapping (address => uint) public balances;

    event Deposit(address indexed user,uint amount);
    event WithDraw(address indexed user,uint amount);

    // 存款函数
    function deposit() external payable {
        require(msg.value > 0, "No amount!");
        balances[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    // 取款函数
    function withDraw() external nonReentrant{
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance!");
        balances[msg.sender] = 0;

        (bool success,) = msg.sender.call{value:amount}("");
        require(success, "Transaction failed!");

        emit WithDraw(msg.sender, amount);
    }
}