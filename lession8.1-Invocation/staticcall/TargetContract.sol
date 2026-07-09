// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 目标合约
contract TargetContract {
    uint public value = 100;

    function getValue() external view returns (uint) {
        return value;
    }    

    function setValue(uint _value) external {
        value = _value;
    }
}