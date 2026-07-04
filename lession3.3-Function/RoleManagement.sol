// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个完整的权限管理系统：
1. 定义三种⻆⾊：Owner、Admin、User
2. 实现⻆⾊分配和检查
3. 不同⻆⾊有不同权限
4. Owner可以添加Admin
5. Admin可以添加User
6. 所有⼈可以查询⻆⾊

考察modifier的使用
*/
contract RoleManagement {
    // 定义角色枚举
    enum Role { None, User, Admin, Owner }

    // 存储用户角色
    mapping (address => Role) public roles;

    address public owner;

    event RoleAssigned(address indexed user,Role role);
    event RoleRevoked(address indexed  user);

    constructor() {
        owner = msg.sender;
        roles[owner] = Role.Owner;
    }

    // 定义modifier
    // 检查是否是Owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner can call!");
        _;
    }

    // 检查是否是Admin
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin || roles[msg.sender] == Role.Owner, "Only Admin or Owner can call!");
        _;
    }

    // 用户地址是否正常
    modifier isValidAddress() {
        require(msg.sender != address(0), "Invalid address!");
        _;
    }

    // 添加Admin
    function addAdmin(address user) public onlyOwner isValidAddress {
        roles[user] = Role.Admin;
        emit RoleAssigned(user, Role.Admin);
    }

    // 添加User
    function addUser(address user) public onlyAdmin isValidAddress {
        roles[user] = Role.User;
        emit RoleAssigned(user, Role.User);
    }

    // 查询角色
    function getRole(address user) public view returns (Role) {
        return roles[user];
    }

    // 撤销角色
    function revokeRole(address user) public onlyOwner {
        delete roles[user];
        emit RoleRevoked(user);
    }

    // 查询是否是某个角色
    function hasRole(address user,Role role) public view returns (bool) {
        return roles[user] == role;
    }

}