// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

// 导入并重新导出 OpenZeppelin 的 TransparentUpgradeableProxy 合约
// 这个文件用于让 Hardhat 能够编译和部署 TransparentUpgradeableProxy
import {TransparentUpgradeableProxy as OpenZeppelinTransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract TransparentUpgradeableProxy is
    OpenZeppelinTransparentUpgradeableProxy
{
    constructor(
        address _logic,
        address initialOwner,
        bytes memory _data
    ) OpenZeppelinTransparentUpgradeableProxy(_logic, initialOwner, _data) {}
}
