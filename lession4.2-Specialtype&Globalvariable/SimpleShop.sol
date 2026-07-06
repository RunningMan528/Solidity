// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
综合运⽤msg.sender、msg.value、address payable。
*/
contract SimpleShop {
    // 合约拥有者
    address public immutable OWNER;

    // 每个商品单价
    uint public constant ITEM_PRICE = 0.1 ether;

    // 购买记录: 购买者:数量
    mapping (address => uint) public purchases;

    // event
    event ItemPurchased(address indexed buyer,uint quantity,uint totalPaid);
    event OwnerWithDraw(address indexed user,uint amount);

    constructor() {
        OWNER = msg.sender;
    }

    // modifier
    modifier onlyOwner() {
        require(msg.sender == OWNER, "Only owner can call !");
        _;
    }

    // 购买商品
    function buyItem(uint quantity) public payable  {
        require(quantity > 0, "Incorrect quantity!");
        // 校验用户输入的金额是否达到商品总金额
        uint totoal = ITEM_PRICE * quantity;
        require(msg.value == totoal, "Invalid money !");
        purchases[msg.sender] += quantity;

        emit ItemPurchased(msg.sender, quantity, totoal);
    }

    // 查询购买数量
    function getPurchases(address buyer) public view returns (uint) {
        return purchases[buyer];
    }

    // 体现(仅owner)
    function withDraw() public onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No balance to withdraw!");
        (bool success,) = OWNER.call{value:balance}("");

        require(success, "Transaction failed !");

        emit OwnerWithDraw(OWNER, balance);
    }

    // 查询合约余额
    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }
}