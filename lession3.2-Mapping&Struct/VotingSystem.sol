// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个提案投票系统：
1. 定义Proposal结构体（包含voters的mapping）
2. ⽀持创建提案
3. ⽀持投票（每⼈只能投⼀次）
4. 查询提案信息
5. 获取获胜提案

主要考察：
ID自增系统使用
结构体包含mapping,不能在memory或calldata,只能用storage
*/
contract VotingSystem {

    // 定义Proposal结构体
    struct Proposal {
        string description;
        uint voteCount;
        uint deadline;
        bool executed;
        mapping (address => bool) voters;
    }

    // 存储提案
    mapping (uint => Proposal) public proposals;
    // 定义提案数量用来做ID自增
    uint public proposalCount;

    event ProposalCreated(uint indexed proposalId,string description);
    event Voted(uint indexed proposalId,address indexed voter);

    // 创建提案
    function createProposal(string memory description,uint duration) public returns (uint) {
        require(bytes(description).length > 0,"Description required!");
        require(duration > 0,"Duration > 0!");

        uint proposalId = proposalCount++;
        Proposal storage p = proposals[proposalId];
        p.description = description;
        p.voteCount = 0;
        p.deadline = block.timestamp + duration;
        p.executed = false;
        proposalCount++;

        emit ProposalCreated(proposalId, description);
        return proposalId;
    }

    // 投票
    function vote(uint proposalId) public {
        require(proposalId < proposalCount,"Proposal not exist!");
        Proposal storage p = proposals[proposalId];

        require(block.timestamp < p.deadline, "Voting has ended!");
        require(!p.voters[msg.sender], "Already voted!");
        p.voteCount++;
        p.voters[msg.sender] = true;

        emit Voted(proposalId, msg.sender);
    }

    // 检查是否已经投票
    function hasVoted(uint proposalId,address voter) public view returns(bool) {
        require(proposalId < proposalCount, "Proposal not exist!");
        return proposals[proposalId].voters[voter];
    }

    // 获取提案信息
    function getProposalInfo(uint proposalId) public view returns(string memory) {
        require(proposalId < proposalCount, "Proposal not exist!");
        Proposal storage p = proposals[proposalId];
        return p.description;
    }

    // 获取获胜提案
    function getWinProposal() public view returns(uint,string memory) {
        uint maxVoteCount = 0;
        uint proposalId = 0;
        for (uint i = 0; i < proposalCount; i++) 
        {
            if (proposals[i+1].voteCount > maxVoteCount) {
                maxVoteCount = proposals[i+1].voteCount;
                proposalId = i+1;
            }   
        }
        Proposal storage p = proposals[proposalId];
        return (proposalId,p.description);
    }
}