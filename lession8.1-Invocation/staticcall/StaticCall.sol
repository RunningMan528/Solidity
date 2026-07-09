// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StaticCall {
    // 使用staticcall调用view函数(安全)
    function safeGetValue(address target) external view returns (uint) {
        (bool success,bytes memory returnData) = target.staticcall(abi.encodeWithSignature("getValue()"));
        require(success, "Static call failed!");

        // 解码返回值
        uint value = abi.decode(returnData,(uint));
        return value;
    }

    // 尝试使用staticcall调用修改状态函数(会失败)
    function unsafeSetValue(address target,uint newValue) external {
        // 这个调用会失败,因为setValue会修改状态
        (bool success,) = target.staticcall(abi.encodeWithSignature("setValue(uint)", newValue));
        // success 会是false,因为staticcall不允许修改状态
        require(success, "Staticcall failed: cannot modify state!");
    }
}