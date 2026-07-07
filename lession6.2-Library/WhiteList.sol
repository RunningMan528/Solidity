// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
使用OpenZepplin标准库实现如下功能:
1. 使⽤EnumerableSet数据结构
2. 实现添加、移除、检查功能
3. ⽀持遍历所有地址
*/
contract WhiteList {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private users;

    function addUser(address user) public {
        require(!users.contains(user), "Already exist!");
        users.add(user);
    }

    function removeUser(address user) public  {
        require(users.contains(user), "User not exist!");
        users.remove(user);
    }

    function checkUser(uint index) public view returns (address) {
        require(index < users.length(), "Index out of bounds!");
        return users.at(index);
    }

    function getAll() public view returns (address[] memory) {
        return users.values();
    }
}