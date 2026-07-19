import "dotenv/config";
import { network } from "hardhat";
const { ethers } = await network.create();

const [deployer] = await ethers.getSigners();

const ownersValue = process.env.MULTISIG_OWNERS;
if (!ownersValue) {
  throw new Error("MULTISIG_OWNERS is required");
}

const owners = ownersValue.split(",").map((address) => address.trim());

if (owners.length === 0 || owners.some((address) => !ethers.isAddress(address))) {
  throw new Error("MULTISIG_OWNERS must be a comma-separated list of valid addresses");
}

const thresholdValue = process.env.MULTISIG_THRESHOLD;
const threshold = BigInt(thresholdValue ?? "2");

if (threshold === 0n || threshold > BigInt(owners.length)) {
  throw new Error("MULTISIG_THRESHOLD must be between 1 and the number of owners");
}

// 1.部署 V1 实现合约
const implementation = await ethers.deployContract("MultiSigWalletUpgradeable");

await implementation.waitForDeployment();

// 2. 编码initialize;该调用会在代理构造期间 delegatecall执行
const initData = implementation.interface.encodeFunctionData("initialize", [owners, threshold]);

// 3.部署透明代理
// 第二个参数是未来管理自动创建的 ProxyAdmin 的 owner.
const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [await implementation.getAddress(), deployer.address, initData]);
await proxy.waitForDeployment();

const proxyAddress = await proxy.getAddress();

// 4.使用V1 ABI 连接代理地址；所有业务读写均通过它进行
const wallet = await ethers.getContractAt("MultiSigWalletUpgradeable", proxyAddress);

// 5.获取ProxyAdmin 合约地址，而不是ProxyAdmin的owner地址
const proxyAdminSlot =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

  const adminStorage = await ethers.provider.getStorage(proxyAddress,proxyAdminSlot);
  const proxyAdminAddress = ethers.getAddress(`0x${adminStorage.slice(-40)}`,);


console.log("Implementation:", await implementation.getAddress());
console.log("Proxy:", proxyAddress);
console.log("ProxyAdmin:", proxyAdminAddress);
console.log("Owners:", await wallet.getOwners());
console.log("Threshold:", await wallet.getThreshold());