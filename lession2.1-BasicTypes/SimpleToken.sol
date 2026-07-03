// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个简单的代币合约，综合运⽤所学的数据类型。
*/
contract SimpleToken {
    // 状态变量
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;

    mapping (address => uint256) public balanceOf;

    // 事件
    event Transfer(address indexed from,address indexed to,uint256 value);

    // 构造函数
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    // 转账函数
    function transfer(address _to,uint256 _value) public returns (bool) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender,_to, _value);
        return true;
    }

    // 查询余额
    function getBalance(address _owner) public view returns (uint256) {
        return balanceOf[_owner];
    }

    // 铸造代币
    function mint(address _to, uint256 _amount) public {
        require(msg.sender == owner, "Only owner can mint");
        require(_to != address(0), "Cannot mint to zero address");

        totalSupply += _amount;
        balanceOf[_to] = _amount;

        emit Transfer(address(0), _to, _amount);
    }
}