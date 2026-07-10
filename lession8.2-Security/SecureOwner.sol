// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

// Openzipplin的Ownerable使用
contract SecureOwner is Ownable{

    mapping (address => uint) balances;

    constructor(address owner) Ownable(owner) {
        
    }

    function mint(address to,uint amount) external onlyOwner {
        balances[to] += amount;
    }

    function burn(uint amount) external {
        require(balances[msg.sender] > 0, "No balance!");
        balances[msg.sender] -= amount;
    }
}