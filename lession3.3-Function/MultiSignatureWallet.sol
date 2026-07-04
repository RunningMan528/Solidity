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
        uint confirmations;
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
    Transaction[] public transactions;

}