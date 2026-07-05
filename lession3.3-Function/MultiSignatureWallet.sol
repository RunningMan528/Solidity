// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
需求：
创建⼀个简单的多签名钱包：
1. 需要多个签名者确认才能执⾏交易
2. 提交交易提案
3. 签名者确认提案
4. 达到阈值后执⾏
提示：
使⽤struct存储提案
使⽤mapping记录确认
使⽤modifier检查权限
*/
contract MultiSignatureWallet {

    // 提案结构体
    struct Transaction {
        // 向谁转账
        address to;
        // 转账金额
        uint value;
        // 调用数据
        bytes data;
        // 是否已经执行
        bool executed;

        //确认数量
        uint confirmCount;
    }

    // 签名者列表,合约部署时指定
    address[] public owners;
    // 指定阈值
    uint public required;

    // 为了快速判断是否是签名者
    mapping (address => bool) isOwner;

    // 提案ID自增
    uint public transactionCount = 0;

    // 提案列表
    mapping (uint => Transaction) public transactions;

    // 记录确认：交易ID:(地址:是否确认)
    mapping (uint => mapping (address => bool)) confirmations;

    // event事件
    event OwnerSubmitTransaction(address indexed owner,uint txId);
    event OwnerConfirmTransaction(address indexed owner,uint txId);
    event OwnerExeucteTransaction(address indexed owner,uint txId,bool success);
    event ReachRequiredCount(uint txId);


    // 通过构造函数，确认签名者和阈值
    constructor(address[] memory users,uint requiredCount) {
        owners = users;
        // 这里注意需要初始化isOwner否则下面的onlyOwner校验出错
        for (uint i = 0; i < users.length; i++) 
        {
            isOwner[users[i]] = true;
        }
        required = requiredCount;
    }

    // modifier
    // 只有签名者可操作
    modifier onlyOwners() {
        require(isOwner[msg.sender], "Only owers can call!");
        _;
    }

    // 检查提案是否存在
    modifier txExists(uint txId) {
        require(txId <= transactionCount, "Transaction not exist!");
        _;
    }

    // 检查是否执行过
    modifier notExecuted(uint txId) {
        require(!transactions[txId].executed, "Transaction executed!");
        _;
    }

    // 防止重复签名(针对签名者)
    modifier notConfirmed(uint txId) {
        require(!confirmations[txId][msg.sender], "Already confirmed!");
        _;
    }

    // 校验转账地址是否合法
    modifier isValidAddress(address user) {
        require(user != address(0), "Invalid address!");
        _;
    }

    // 签名者创建提案
    function submitTransaction(address to ,uint amount,bytes calldata data) public isValidAddress(to) onlyOwners {
        transactionCount++;
        Transaction memory ts = Transaction({
            to: to,
            value : amount,
            executed : false,
            data: data,
            confirmCount: transactionCount
        });

        transactions[transactionCount] = ts;
        // 设置提案确认状态
        for (uint i = 0; i < owners.length; i++) 
        {
            confirmations[transactionCount][owners[i]] = false;
        }

        emit OwnerSubmitTransaction(msg.sender, transactionCount);
    }

    // 确认提案
    function confirmTransaction(uint txId) public txExists(txId) notExecuted(txId) onlyOwners notConfirmed(txId) {
        transactions[txId].confirmCount++;
        confirmations[txId][msg.sender] = true;
        if (transactions[txId].confirmCount >= required) {
            emit ReachRequiredCount(txId);
        }
        emit OwnerConfirmTransaction(msg.sender, txId);
    }

    // 执行提案
    function executeTransaction(uint txId) public txExists(txId) notExecuted(txId) onlyOwners {
        Transaction storage ts = transactions[txId];
        require(ts.confirmCount >= required, "Requires multiple signatures");
        (bool success,) = payable(ts.to).call{value:ts.value}(ts.data);
        ts.executed = true;
        emit OwnerExeucteTransaction(msg.sender, txId, success);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    receive() external payable { }
}