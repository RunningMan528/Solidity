// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 逻辑合约V1:初始版本
contract ImplementationV1 {
    // 注意:存储布局必须与代理合约匹配
    address public implementation; // slot 0 — 与 Proxy 对齐
    uint256 public value;             // slot 1 — 与 Proxy 对齐
    address public owner;          // slot 2 — 与 Proxy 对齐
    bool private initialized;     // 防止重复初始化

    // 手动调用一次，替代 constructor
    function initialize(address _owner) external {
        require(!initialized, "Already initialized");
        owner = _owner;
        initialized = true;
    }

    /**
    * @notice 设置值
    * @param _value 要设置的值
    */
    function setValue(uint256 _value) external {
        // 这个函数会修改调用者合约(代理合约)的storage
        value = _value;
        // msg.sender是原始调用者,不是代理合约
        // owner = msg.sender;
        // 这里不再修改owner否则外部调用代理合约的时候会被置为调用合约的地址
    }

    // 获取值
    function getValue() external view returns (uint256) {
        return value;
    }
}