// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "lession8.1-Invocation/IERC20.sol";

contract SwapToken {
    // 声明两个代币接口变量
    IERC20 public tokenA;
    IERC20 public tokenB;

    // 交换事件
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint amountIn,
        uint amountOut);

    error InsufficientBalance(uint avaliable,uint required);
    error TransferFailed(address from,address to,uint amount);


    // 构造函数:初始化代币合约地址
    constructor(address _tokenA,address _tokenB) {
        // 将地址转换为接口类型
        // 这样编译器会检查这些地址对应的合约是否实现了接口中的函数
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
    * @notice 执行代币交换
    * @param amountA 要交换的tokenA数量
    * @dev 用户先要调用tokenA的approve函数授权本合约使用其代币
    */
    function swap(uint amountA) external {
        // 步骤1:检查合约是否有足够的tokenB用于交换
        // 使用接口的view函数查询余额,不消耗gas
        uint contractBalanceB = tokenB.balanceOf(address(this));
        if (contractBalanceB < amountA) {
            revert InsufficientBalance(contractBalanceB,amountA);
        }

        // 步骤2:从用户账户转移tokenA到本合约
        // transferFrom需要用户先调用tokenA.approve授权本合约
        // 如果转账失败,require会回滚整个交易

        try tokenA.transferFrom(msg.sender,address(this),amountA) 
        
        returns (bool success){
            if (!success) revert TransferFailed(msg.sender,address(this),amountA);
        } catch {
            revert TransferFailed(msg.sender,address(this),amountA);
        }

        // 步骤3:从本合约向用户转移tokenB
        // 简化示例:1:1兑换
        uint256 amountB = amountA;
        try tokenB.transfer(msg.sender,amountB)

        returns (bool success) {
            if (!success) revert TransferFailed(address(this),msg.sender,amountB);
        } catch {
            revert TransferFailed(address(this),msg.sender,amountB);
        }

        // 步骤4:触发事件,记录交换信息
        // 前端应用可以监听这个事件来更新UI
        emit Swap(msg.sender, address(tokenA), address(tokenB), amountA, amountB);
    }

    /**
    * @notice 查询合约持有的代币余额
    * @return balanceA 合约持有的tokenA数量
    * @return balanceB 合约持有的tokenB数量
    */
    function getContractBalances() external returns (uint balanceA,uint balanceB) {
        // 使用接口的view函数查询余额
        // view函数不修改状态,外部调用不消耗Gas
        balanceA = tokenA.balanceOf(address(this));
        balanceB = tokenB.balanceOf(address(this));
    }

    /**
    * @notice 查询⽤户持有的代币余额
    * @param user 要查询的⽤户地址
    * @return balanceA ⽤户的tokenA余额
    * @return balanceB ⽤户的tokenB余额
    */
    function getUserBalances(address user) external returns (uint balanceA,uint balanceB) {
        balanceA = tokenA.balanceOf(user);
        balanceB = tokenB.balanceOf(user);
    }

}