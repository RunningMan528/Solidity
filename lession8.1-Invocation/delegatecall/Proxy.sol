// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Proxy {
    // 存储布局必须与逻辑合约完全一致
    address public implementation; // 逻辑合约地址
    uint256 public value; // 与逻辑合约的value对应
    address public owner;// 与逻辑合约的owner对应
    bool private initialized;     // 防止重复初始化

    event Upgraded(address indexed newImplementation);

    // 构造函数
    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    /**
    * @notice 升级函数：更换逻辑合约
    * @param newImplementation 新的逻辑合约地址
    */
    function upgrade(address newImplementation) external {
        require(msg.sender == owner, "Not owner!");
        implementation = newImplementation;
        emit Upgraded(newImplementation);
    }

    /**
    * @notice fallback函数：将所有调⽤转发到逻辑合约
    * @dev 使⽤delegatecall调⽤逻辑合约，逻辑合约的代码在代理合约的上下⽂中执⾏
    */
    fallback() external payable { 
        address impl = implementation;
        require(impl != address(0), "Implementation not set!");

        // 使用delegatecall调用逻辑合约
        // 逻辑合约的代码会在本合约(代理合约)的上下文中执行
        // 这意味着修改的是代理合约的storage,而不是逻辑合约的
        (bool success,bytes memory returnData) = impl.delegatecall(msg.data);
        if (!success) {
            // 如果调用失败,回滚
            assembly {
                returndatacopy(0,0,returndatasize())
                revert(0,returndatasize())
            }
        }

        // 返回数据
        assembly {
            return (add(returnData,0x20),mload(returnData))
        }
    }

    // 接受以太币
    receive() external payable { }
}