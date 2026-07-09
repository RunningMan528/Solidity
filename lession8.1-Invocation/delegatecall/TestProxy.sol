// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestProxy {

    function testDelegateCall(address proxy) external {
        // 调用目标合约的setValue函数
        (bool success,) = proxy.call(abi.encodeWithSignature("setValue(uint256)", 888));
        require(success, "delegatecall failed!");
    }
}