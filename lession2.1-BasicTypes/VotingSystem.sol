// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个简单的投票合约，使⽤枚举定义投票选项。
任务要求：
1. 使⽤enum定义投票选项：Yes, No, Abstain
2. 使⽤mapping记录每个地址的投票
3. 使⽤uint统计每个选项的票数
4. 实现投票和查询功能
*/

contract VotingSystem {
    enum VoteOption {
        YES,
        NO,
        Abstain
    }

    // 状态变量
    mapping (address => VoteOption) public votes;
    mapping (address => bool) public hasVoted;
    uint public yesCount;
    uint public noCount;
    uint public abstainCount;

    event Voted(address indexed ovter,VoteOption vote);

    // 投票
    function vote(VoteOption _vote) public  {
        // 检查是否已投票
        require(!hasVoted[msg.sender],"You already voted!");
        // 记录投票
        votes[msg.sender] = _vote;
        hasVoted[msg.sender] = true;
        // 更新计数
        if (_vote == VoteOption.YES) {
            yesCount++;
        } else if (_vote == VoteOption.NO) {
            noCount++;
        } else {
            abstainCount++;
        }
        emit Voted(msg.sender, _vote);
    }

    // 查询
    function getResults() public view returns (uint,uint,uint) {
        return (yesCount,noCount,abstainCount);
    }

    // 当前调用者的投票结果
    function getMyVote() public view returns (VoteOption) {
        require(hasVoted[msg.sender],"You need vote first!");
        return votes[msg.sender];
    }

    // 总的投票数
    function getTotalVotes() public view returns (uint) {
        return yesCount + noCount + abstainCount;
    }

}