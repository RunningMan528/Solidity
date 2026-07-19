import "dotenv/config";
import { network } from "hardhat";
import { config } from "process";
const { ethers } = await network.create();

const proxyAddress = process.env.PROXY_ADDRESS;
const proxyAdminAddress = process.env.PROXY_ADMIN_ADDRESS;

if (!proxyAddress || !proxyAdminAddress) {
  throw new Error("Set PROXY_ADDRESS and PROXY_ADMIN_ADDRESS before running this script.");
}

const version = 2n;

// 1.部署V2实现合约
const implementationV2 = await ethers.deployContract("MultiSigWalletV2");
await implementationV2.waitForDeployment();

// 2.编码 V2 的一次性初始化调用
const initData = implementationV2.interface.encodeFunctionData("initializeV2", [version]);

// 3.由 ProxyAdmin 的 owner 调用升级入口
const proxyAdmin = await ethers.getContractAt("ProxyAdmin", proxyAdminAddress);

const proxy = await ethers.getContractAt("TransparentUpgradeableProxy", proxyAddress);

const transaction = await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), initData);
await transaction.wait();

// 4.使用V2 ABI 验证升级既有状态
const walletV2 = await ethers.getContractAt("MultiSigWalletV2", proxyAddress);

console.log("New implementation:", await implementationV2.getAddress());
console.log("Proxy:", proxyAddress);
console.log("Version:", await walletV2.version());
console.log("Owners preserved:", await walletV2.getOwners());
