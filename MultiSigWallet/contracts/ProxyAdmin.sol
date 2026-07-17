// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
// 导入并重新导出 Openzeppelin 的 ProxyAdmin合约
// 这个文件用于让 Hardhat 能够编译和部署ProxyAdmin
import {ProxyAdmin as OpenzeppelinProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyAdmin is OpenzeppelinProxyAdmin {
    constructor(address initialOwner) OpenzeppelinProxyAdmin(initialOwner) {}
}
