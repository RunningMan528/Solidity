// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
任务要求：
创建⼀个完整的数组管理合约，实现以下功能：
1. 限制最⼤⻓度为100
2. 实现安全的添加功能（safePush）
3. 实现两种删除⽅法（保序和快速）
4. 实现分批求和功能（sumRange）
5. 实现查找功能（返回元素索引）
6. 实现获取所有元素功能
*/
contract SafeArrayManager {
    uint[] public data;
    uint public constant MAX_SIZE = 100;

    event ElementAdded(uint value,uint index);
    event ElementRemoved(uint index,uint value);

    // 安全添加
    function safePush(uint value) public {
        // 检查大小限制
        require(data.length < MAX_SIZE, "Data is full!");
        // 添加元素
        data.push(value);
        emit ElementAdded(value, data.length - 1);
    }

    // 保序删除
    function removeOrdered(uint index) public {
        // 检查索引
        require(index < data.length,"Index out of bouds!");
        uint removeValue = data[index];
        // 移动元素
        for (uint i = index; i < data.length - 1; i++) 
        {
            data[i] = data[i + 1];
        }
        // pop最后元素
        data.pop();
        emit ElementRemoved(index, removeValue);
    }

    // 快速删除
    function removeUnordered(uint index) public {
        // 检查索引
        require(index < data.length, "Index out of bounds!");
        uint removeValue = data[index];
        // 替换为最后元素
        data[index] = data[data.length - 1];
        // pop
        data.pop();
        emit ElementRemoved(index, removeValue);
    }

    // 分批求和
    function sumRange(uint start,uint end) public view returns (uint) {
        // 检查范围
        require(start < end,"Start < end !");
        require(end <= data.length, "Index out of bounds!");
        // 计算总和
        uint total = 0;
        for (uint i = start; i < end; i++) 
        {
            total += data[i];
        }
        return total;
    }

    // 查找元素
    function findElement(uint value) public view returns (bool,uint) {
        // 遍历查找
        uint len = data.length;
        for (uint i = 0; i < len; i++) 
        {
            if (data[i] == value) {
                return (true,i);
            }
        }
        // 返回是否找到和索引
        return (false,0); 
    }

    // 获取所有元素
    function getAll() public view returns (uint[] memory) {
        // 返回整个数组
        return data;
    }
}