// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
任务：创建⼀个订单系统，使⽤多个事件追踪订单的完整⽣命周期。
要求：
1. 定义OrderCreated、OrderPaid、OrderShipped、OrderCompleted、OrderCancelled事件
2. 实现相应的状态转换函数
3. 使⽤合适的indexed参数
4. 确保事件在正确的时机触发
*/
contract OrderSystem {

    enum OrderStatus { Created, Paid, Shipped, Completed, Cancelled }

    struct Order {
        address buyer;
        uint amount;
        OrderStatus status;
        uint createdAt;
    }

    mapping (uint => Order) public orders;
    uint public orderCount = 0;

    // 订单创建事件
    event OrderCreated(uint indexed orderId,address indexed buyer,uint amount,uint timestamp);

    // 订单支付事件
    event OrderPaid(uint indexed orderId,address indexed buyer,uint amount,uint timestamp);

    // 订单发货事件
    event OrderShipped(uint indexed orderId,uint timestamp);

    // 订单取消事件
    event OrderCanncelled(uint indexed orderId,address indexed canceller,string reason,uint timestamp);

    // 订单完成事件
    event OrderCompleted(uint indexed orderId,address indexed buyer,uint timestamp);

    modifier isExist(uint id) {
        require(id <= orderCount, "Order not exist!");
        _;
    }

    // 创建订单
    function createOrder() public payable returns (uint) {
        require(msg.value > 0, "Amount must be greater than zero!");

        uint orderId = orderCount++;

        orders[orderId] = Order({
            buyer: msg.sender,
            amount: msg.value,
            status: OrderStatus.Created,
            createdAt: block.timestamp
        });

        // 触发订单事件
        emit OrderCreated(orderId, msg.sender, msg.value, block.timestamp);
        return orderId;
    }

    // 支付订单
    function pay(uint orderId) public isExist(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "Order status error!");
        
        order.status = OrderStatus.Paid;

        emit OrderPaid(orderId, msg.sender,order.amount , block.timestamp);
    }

    // 发货
    function shipOrder(uint orderId) public isExist(orderId) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Paid, "Order status is not paid!");

        order.status = OrderStatus.Shipped;

        emit OrderShipped(orderId, block.timestamp);
    }

    // 确认收货
    function completeOrder(uint orderId) public isExist(orderId) {
        Order storage order = orders[orderId];

        require(order.status == OrderStatus.Shipped, "Order status is not shipped!");

        order.status = OrderStatus.Completed;

        emit OrderCompleted(orderId, order.buyer, block.timestamp);
    }

    // 取消订单
    function canncelOrder(uint orderId) public isExist(orderId) {
        Order storage order = orders[orderId];

        require(order.status == OrderStatus.Created || order.status == OrderStatus.Paid, "Order status Error!");
        require(order.buyer == msg.sender, "Cannot cancel others order!");
       
        if (order.status == OrderStatus.Paid) {
          (bool success,) = payable(order.buyer).call{value:order.amount}("");
          require(success, "Transaction failed!");
        }
        
        order.status = OrderStatus.Cancelled;
        emit OrderCanncelled(orderId, msg.sender, "Don't want to buy anymore!", block.timestamp);
    }

}