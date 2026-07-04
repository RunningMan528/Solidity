// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个完整的⽀付合约：
1. ⽀持存款（deposit）
2. ⽀持提款（withdraw）
3. ⽀持紧急停⽌（pause）
4. Owner可以暂停/恢复合约
5. 查询余额
6. 限制最⼩存款⾦额
*/
contract PaymentContract {

    // 暂停/恢复
    bool public paused = false;
    // 最小存款金额
    uint public constant MIN_DEPOSIT  = 0.01 ether;

    // 存储存款数据
    mapping (address => uint) public balances;

    address public owner;

    event UserDeposited(address indexed user,uint amount);
    event UserWithdraw(address indexed user,uint amount);
    event StateChanged(address by,bool paused);

    constructor() {
        owner = msg.sender;
    }

    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call!");
        _;
    }

    modifier whenNotPause() {
        require(!paused, "State is paused!");
        _;
    }

    modifier whenPaused() {
        require(paused, "State is not paused!");
        _;
    }

    modifier minAmount(uint minValue) {
        require(msg.value >= minValue, "Below the minimum amount!");
        _;
    }

    // 存款
    function deposit() public payable  whenNotPause minAmount(MIN_DEPOSIT) {
        balances[msg.sender] += msg.value;
        emit UserDeposited(msg.sender, msg.value);
    }

    // 提款
    function withdraw(uint amount) public whenNotPause {
        require(balances[msg.sender] > amount, "Insufficient Balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit UserWithdraw(msg.sender, amount);
    }

    // 紧急停止
    function emergencyStop() public onlyOwner whenNotPause{
        paused = true;
        emit StateChanged(owner,paused);
    }

    // 恢复
    function rsume() public onlyOwner whenPaused {
        paused = false;
         emit StateChanged(owner,paused);
    }

    // 查询余额
    function getBalance(address user) public view returns (uint) {
        return balances[user];
    }

    // 当前合约的余额
    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    // 发送ETH到合约,合约收到ETH时调用
    receive() external payable { 
        deposit();
    }

    /**
    问题总结:
    modifier中不应该直接访问状态变量,应该通过参数的形式传递
    常量定义命名规范,应该全部是大写
    没有使用payable,来接受ETH
    合约状态变化,执行变化的操作者也应该作为参数返回
    */
}