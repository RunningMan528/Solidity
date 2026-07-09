// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "lession8.1-Invocation/factorynew/Counter.sol";

// 工厂合约:使用new创建新合约
contract CounterFactory {
    // 记录所有创建的计数器地址
    address[] public counters;

    event CounterCreated(address indexed counterAddress,address owner);

    /**
    * @notice 使⽤new创建新的计数器合约
    * @return 新创建的计数器合约地址 (地址不可预测)
    */
    function createCounter() external returns (address) {
        
        // 使用new关键字创建新合约
        // 构造函数参数是msg.sender(调用者地址)
        Counter newCounter = new Counter(msg.sender);
        // 获取新合约地址
        address counterAddress = address(newCounter);

        // 记录新合约地址
        counters.push(counterAddress);

        // 触发事件
        emit CounterCreated(counterAddress, msg.sender);

        return counterAddress;
    }

    /**
    * @notice 使⽤create2创建（地址可预测）
    * @param salt ⽤于计算地址的盐值
    * @return 新创建的计数器合约地址
    */
    function createCounterByCreate2(bytes32 salt) external returns (address) {
        // 使用create2创建,指定salt值
        Counter newCounter = new Counter{salt:salt}(msg.sender);
        address counterAddress = address(newCounter);
        emit CounterCreated(counterAddress, msg.sender);

        return counterAddress;
    }

    /**
    * @notice 预计算create2地址
    * @param salt 盐值
    * @param deployer 部署者地址（通常是本合约地址）
    * @return 预计算的合约地址
    */
    function computeAddress(bytes32 salt,address deployer) external view returns (address) {
        // 获取合约的创建字节码
        // type(Counter).creationCode 获取Counter合约的字节码
        // abi.encode(msg.sender) 编码构造函数参数
        bytes memory bytecode = abi.encodePacked(type(Counter).creationCode,abi.encode(msg.sender));

        // 计算create2地址
        // 公式:keccak256(0xff + deployer + salt + keccak256(bytecode))
        bytes32 hash = keccak256(
            abi.encodePacked(
           bytes1(0xff),
           deployer, // 工厂合约地址
           salt, // 盐值 
           keccak256(bytecode) // 字节码的哈希
        ));

        // 将哈希转换为地址(取后20字节)
        return address(uint160(uint256(hash)));
    }

    /**
    * @notice 查询所有创建的计数器数量
    */
    function getCounterCount() external view returns (uint256) {
        return counters.length;
    }

    /**
    * @notice 查询指定索引的计数器地址
    */
    function getCounter(uint index) external view returns (address) {
        require(index < counters.length, "Index out of bounds!");
        return counters[index];
    }
}