// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
/**
创建⼀个去中⼼化的待办事项管理合约：
每个⽤户有⾃⼰的待办列表
可以添加、完成、删除待办
可以查看所有待办和已完成的待办
限制每个⽤户最多100个待办事项
*/
contract TodoList {
    struct Todo {
        string task;
        bool completed;
        uint timestamp;
    }

    // 每个用户的待办列表
    mapping (address => Todo[]) private userTodos;
    uint public constant MAX_TODOLIST = 100;

    event TodoAdded(address indexed user,uint index,string task);
    event TodoCompleted(address indexed user,uint index);
    event TodoDeleted(address indexed user,uint index);

    // 添加待办
    function addTodo(string memory task) public {
        // 校验任务长度
        require(bytes(task).length > 0, "Task cannot be empty!");
        require(bytes(task).length <= 200, "Task too long");
        address user = msg.sender;
        require(userTodos[user].length <= MAX_TODOLIST, "To do list is full!");

        // 添加任务
        userTodos[user].push(Todo({
            task: task,
            completed: false,
            timestamp: block.timestamp
        }));

        emit TodoAdded(user, userTodos[user].length - 1, task);
    }

    // 标记为完成
    function completeTodo(uint index) public  {
         
    }

    // 删除待办,快速删除不保序
    function deleteTodo(uint index) public  {
        
    }

    // 获取所有待办
    function getAllTodos() public {
        
    }

    // 获取待办数量
    function getTodoCount() public {
        
    }

    // 获取未完成的待办
    function getPendingTodos() public view returns(Todo[] memory) {
        
    }

    // 获取已完成的待办
    function getCompletedTodos() public view returns (Todo[] memory) {
        
    }
}