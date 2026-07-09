// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 定义ERC20接口
interface IERC20 {
    function transfer(address to,uint amount) external returns (bool);
    function transferFrom(address from,address to,uint amount) external returns (bool);
    function balanceOf(address account) external returns (uint);
    function approve(address spender,uint amount) external returns (bool);
}