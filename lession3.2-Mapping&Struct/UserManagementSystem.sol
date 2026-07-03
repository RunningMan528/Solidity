// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个完整的⽤户管理系统，实现以下功能：
1. ⽤户注册（包含name、email）
2. 更新个⼈资料
3. 存款功能（payable）
4. 查询⽤户信息
5. 获取所有⽤户列表
6. 分批查询⽤户
7. 限制最多1000个⽤户
*/
contract UserManagementSystem {

    // 定义用户信息结构体
    struct User {
        string name;
        string email;
        uint balance;
        uint registeredAt;
        bool exists;
    }

    // 定义数据存储
    // 用户列表：地址：用户
    mapping (address => User) public users;
    // 用户地址列表，用于遍历
    address[] public userAddresses;
    // 用户计数器
    uint public userCount;
    // 最大用户限制
    uint public constant MAX_USERS = 1000;

    // 事件
    event UserRegistered(address indexed user,string name);
    event UserUpdated(address indexed user,string name);
    event Deposit(address indexed user,uint amount);

    // 注册功能
    function register(string memory name,string memory email) public {
        address user = msg.sender;
        // 检查是否已经注册
        require(!users[user].exists, "User already registered!");
        // 检查是否达到上限
        require(userCount < MAX_USERS, "Max Users reached!");
        require(bytes(name).length > 0, "Name required!");
        require(bytes(email).length > 0, "Email required!");
        // 创建用户
        User memory newUser = User({
            name: name,
            email: email,
            balance: 0,
            exists: true,
            registeredAt:block.timestamp
        });
        // 添加列表
        users[user] = newUser;
        userAddresses.push(user);
        // 更新计数
        userCount++;
        emit UserRegistered(user, name);

    }

    // 更新个人资料
    function updateProfile(string memory name,string memory email) public {
        // 检查用户是否存在
        address user = msg.sender;
        require(users[user].exists, "User not exists!");
        
        users[user].name = name;
        users[user].email = email;

        emit UserUpdated(user, name);

    }

    // 存款
    function despot() public payable {
        require(users[msg.sender].exists,"User not exists!");
        require(msg.value > 0, "Must send ETH!");
        users[msg.sender].balance += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }

    // 查询用户信息
    function getUserInfo(address user) public view returns(User memory) {
        // 检查用户是否存在
        require(users[user].exists, "User not exists!");
        return users[user];
    }

    // 检查用户是否注册
    function isRegistered(address user) public view returns(bool) {
        // 检查用户是否存在
        require(users[user].exists, "User not exists!");
        return users[user].exists;
    }

    // 获取所有用户地址
    function getAllUsers() public view returns(address[] memory) {
        return userAddresses;
    }

    // 分批查询用户
    function getUsersByRange(uint start,uint end) public view returns(address[] memory) {
        require(start <= end, "Invalid range!");
        require(end <= userCount, "Index out of bounds!");

        address[] memory userList = new address[](end - start);
        uint index = 0;
        for (uint i = start; i < end; i++) 
        {
            userList[index] = userAddresses[i];
            index++;   
        }
        
        return userList;
    }

    // 批量查询用户信息
    function getUserInfoBatch(address[] memory addresses) public view returns(User[] memory) {
        uint len = addresses.length;
        User[] memory userList = new User[](len);
        uint index = 0;
        for(uint i = 0; i < len; i++) {
            userList[index] = users[addresses[i]];
            index++;
        }
        return userList;
    }
}