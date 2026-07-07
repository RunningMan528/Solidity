// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
创建⼀个模块化的权限管理系统：
1. Ownable合约：单⼀所有者管理
2. Pausable合约：暂停功能
3. MyContract：组合两个功能
*/

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner,address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner!");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address!");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract Pausable {
    bool public paused;
    event Paused(address account);
    event UnPaused(address account);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused!");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused!");
        _;
    }

    function _pause() internal whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function _unPaused() internal whenPaused {
        paused = false;
        emit Paused(msg.sender);
    }
}

contract MyContract is Ownable, Pausable{
    uint public value;

    function setValue(uint _value) public onlyOwner whenNotPaused {
        value = _value;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unPause() public onlyOwner {
        _unPaused();
    }
}