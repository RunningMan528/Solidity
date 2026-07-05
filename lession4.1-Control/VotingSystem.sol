// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
需求：
创建⼀个完整的投票系统：
1. ⽀持创建多个提案
2. 每个提案有截⽌时间
3. 只有owner可以创建提案
4. 每个地址只能投⼀次票
5. 可以查询投票结果
6. 可以获取获胜提案
*/
contract VotingSystem {

    // 提案结构体
    struct Proposal {
        string description;
        uint deadline;
        bool exisit;
        uint voteCount;
    }

    // 所有者
    address public owner;
    // 记录提案个数
    uint public proposalCount = 0;

    // 提案列表
    mapping (uint => Proposal) public proposals;
    uint[] public pIds;

    // 记录每个提案下用户投票结果
    mapping (uint => mapping (address => bool)) proposalRes;

    // 一次最多创建提案限制
    uint public constant MAX_COUNT = 100;

    event CreateProposal(uint indexed pId);
    event UserVoted(address indexed user,uint pId);

    constructor() {
        owner = msg.sender;
    }

    // modifier

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can create proposal!");
        _;
    }

    modifier isValidRange(uint desLen,uint deadlineLen) {
        require(desLen == deadlineLen, "Descritions and deadlines length not match!");
        _;
    }

    modifier maxLimit(uint len,uint limit) {
        require(len <= limit, "Exceeding the maximum limit!");
        _;
    }

    modifier isExist(uint pId) {
        require(pId <= proposalCount, "Proposal not exist!");
        _;
    }

    // 提案是否过期
    modifier isExpired(uint pId) {
        require(proposals[pId].deadline > block.timestamp, "Proposal is Expired!");
        _;
    }

    // 某个提案是否已经投过票
    modifier isVoted(uint pid) {
        require(!proposalRes[pid][msg.sender], "Already voted!");
        _;
    }

    // 创建提案
    function createProposals(string[] calldata descriptions,uint[] calldata deadlines) external  
    isValidRange(descriptions.length,deadlines.length) 
    maxLimit(descriptions.length,MAX_COUNT) 
    onlyOwner{
        for (uint i = 0; i < descriptions.length; i ++) {
            proposalCount++;
            proposals[proposalCount] = Proposal({
                description: descriptions[i],
                voteCount: 0,
                deadline:  block.timestamp + deadlines[i],
                exisit: true
            });
            pIds.push(proposalCount);
        }
    }

    // 投票
    function vote(uint pId) public isExist(pId) isExpired(pId) isVoted(pId) {
        proposals[pId].voteCount++;
        proposalRes[pId][msg.sender] = true;

        emit UserVoted(msg.sender, pId);
    }

    // 查询投票结果
    function getVoteInformation(uint pId) public isExist(pId) view returns (uint) {
        return proposals[pId].voteCount;
    }

    // 获取获胜状态
    function getWin() public view returns (uint,uint) {
        uint maxCount = 0;
        uint index = 0;
        for (uint i = 1; i < proposalCount; i++) 
        {
            if (maxCount < proposals[i].voteCount) {
                maxCount = proposals[i].voteCount;
                index = i;
            }
        }
        return (index,maxCount);
    }

    // 查询当前提案列表
    function getAll() public view returns (uint[] memory) {
        return pIds;
    }

}