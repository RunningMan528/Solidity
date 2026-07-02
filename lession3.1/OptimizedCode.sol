// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OptimizedCode {
    uint[] public data;

    function unOptimizedProcess(uint[] memory values) public {
        for(uint i = 0; i < values.length; i++) {
            if(values[i] > 10) {
                data.push(values[i]);
            }
         }
    }

    function optimizedProcess(uint[] calldata values) external {
        uint len = values.length;
        // 使用临时 memory数组变量手机符合条件的值
        uint[] memory temps = new uint[](len);
        uint count = 0;
        for (uint i = 0; i < len; i++) 
        {
            uint val = values[i];
            if (val > 10) {
               temps[count] = val;
               count++;
            }
        }

        // 批量push,连续操作更省gas
        for (uint i = 0; i < temps.length; i++) 
        {
            data.push(temps[i]);
        }
    }

    // 最优解
    function process(uint[] calldata values) external {
        uint len = values.length;
        uint currentLen = data.length;
        uint count = 0;
        // 第一次遍历：计算符合条件的数量
        for (uint i = 0; i < len; i++) 
        {
            if (values[i] > 10) {
                count++;
            }
        }

        // 预先扩展数组,一次性写入长度
        if (count > 0) {
            uint newLen = currentLen + count;
            assembly{
                // 直接扩展数组⻓度，避免多次 push
                sstore(add(data.slot, 0), newLen)
            }
        }

        // 第二次遍历:直接赋值到已经分配的位置
        uint index = currentLen;
        for (uint i = 0; i < len; i++) 
        {
            if (values[i] > 10) {
                // 直接赋值比push更省gas
                data[index] = values[i];
                index++;
            }
        }
    }
}