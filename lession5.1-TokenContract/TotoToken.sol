// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
使⽤OpenZeppelin库重新实现代币合约。
步骤：
1. 在Remix中导⼊OpenZeppelin库
2. 继承ERC20和Ownable合约
3. 实现mint和burn功能
4. 对⽐⼿写实现和库实现的区别
*/

contract TotoToken is ERC20,Ownable,ERC20Burnable {
    constructor(uint256 initialSupply) ERC20("Toto","TT") Ownable(msg.sender) {
        _mint(msg.sender,initialSupply * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}