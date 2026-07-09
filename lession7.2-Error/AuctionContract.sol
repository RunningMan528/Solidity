// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 拍卖合约
contract AuctionContract {

    address public owner;
    uint public auctionEnd;
    uint public highestBid;
    address public highestBidder;

    mapping (address => uint) public penddingReturns;
    mapping (address => bool) public hasWithdrawn;

    event NewBid(address indexed bidder,uint amount);
    event AuctionEnded(address winner,uint amount);
    event Withdrawal(address indexed currentBid,uint amount);

    error BidTooLow(uint currentBid,uint amount);
    error AuctionEndedError();
    error AuctionNotEnded();
    error NotHighestBidder();
    error WithdrawalFailed();
    error AlreadyWithdrawn();


    constructor(uint _duration) {
        owner = msg.sender;
        auctionEnd = block.timestamp + _duration * 1 days;
    }

    // 出价
    function bid() public payable {
        // 检查拍卖是否正在进行
        if (block.timestamp > auctionEnd) {
            revert AuctionEndedError();
        }
        // 检查出价是否高于当前最高价
        if (msg.value <= highestBid) {
            revert BidTooLow(highestBid,msg.value);
        }

        // 使用assert 检查时间不变量
        assert(auctionEnd > block.timestamp);

        // 如果有之前的最高出价者，记录待退款
        if (highestBidder != address(0)) {
            penddingReturns[highestBidder] += highestBid;
        }

        // 更新最高出价
        highestBidder = msg.sender;
        highestBid = msg.value;

        emit  NewBid(msg.sender, msg.value);
    }

    /**
    @notice 提取未中标的出价
    */
    function withDraw() public returns (bool) {
        // 检查是否有退款
        uint amount = penddingReturns[msg.sender];
        require(amount > 0, "No returns!");
        // 检查是否已经提取过
        if (hasWithdrawn[msg.sender]) {
            revert AlreadyWithdrawn();
        }

        // 先更新状态，防止重入攻击
        penddingReturns[msg.sender] = 0;
        hasWithdrawn[msg.sender] = true;

        // 使用try-catch处理转账
        (bool success,) = msg.sender.call{value:amount}("");
        if (!success) {
            // 如果转账失败，恢复状态
            penddingReturns[msg.sender] = amount;
            hasWithdrawn[msg.sender] = false;

            revert WithdrawalFailed();
        }
        emit Withdrawal(msg.sender, amount);
        return true;
    }

    // 结束拍卖
    function endAuction() public {
        require(owner == msg.sender, "Only owner can end!");

        if (block.timestamp < auctionEnd) {
            revert AuctionNotEnded();
        }

        emit AuctionEnded(highestBidder, highestBid);

        // 转账给所有者
        (bool success,) = owner.call{value:highestBid}("");
        require(success,"Transaction failed!");
    }
}