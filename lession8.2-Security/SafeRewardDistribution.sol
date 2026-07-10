// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
任务：实现安全的奖励分配合约。
要求：
1. 使⽤拉取模式
2. 避免Gas限制问题
3. 添加超时机制
4. ⽀持批量处理
*/
contract SafeRewardDistribution {
    mapping (address => uint) public rewards;
    mapping (address => uint) public claimDeadline;

    uint public constant CLAIM_PREIOD = 30 days;

    function setReward(address user,uint amount) external {
        rewards[user] = amount;
        claimDeadline[user] = block.timestamp + CLAIM_PREIOD;
    }

    function claimReward() external {
        uint amount = rewards[msg.sender];
        require(amount > 0, "No rewards!");
        
        require(claimDeadline[msg.sender] < block.timestamp, "Expired!");

        rewards[msg.sender] = 0;

        (bool success,) = msg.sender.call{value:amount}("");
        require(success, "Transaction failed!");
    }
}