// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 逻辑合约V2:升级版本(值翻倍)
contract ImplementationV2 {
    // 注意:存储布局必须与V1和代理合约匹配
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
    * @notice 设置值（新逻辑：值翻倍）
    * @param _value 要设置的值
    */
    function setValue(uint256 _value) external {
        // 新逻辑:值翻倍
        value = _value * 2;
        //owner = msg.sender;
    }

    // 获取值
    function getValue() external view returns (uint256) {
        return value;
    }

    /**
    * @notice 新增功能：重置值
    * @dev V1没有这个函数，升级后可以使⽤
    */
    function reset() external {
        value = 0;
    }
}