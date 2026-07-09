// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "lession8.1-Invocation/factorynew/CounterFactory.sol";

contract TestFactory {

    function testCreate2() external returns (address) {
        // 部署工厂合约
        CounterFactory factory = new CounterFactory();
        // 步骤1:选择一个salt值
        bytes32 salt = 0x0000000000000000000000000000000000000000000000000000000000000001;

        // 步骤2:预计算地址(在部署前就能知道地址)
        address predictedAddress = factory.computeAddress(salt,address(factory));

        // 步骤3:使用create2创建合约
        address actualAddress = factory.createCounterByCreate2(salt);

        // 步骤4:验证地址是否匹配
        require(predictedAddress == actualAddress,"Address mismatch!");

        return actualAddress;

    }

}