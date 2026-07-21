import "dotenv/config";
import { network } from "hardhat";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * 读取必填环境变量
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * 读取布尔环境变量，未设置时使用默认值
 */
function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === undefined || value === "") {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${name} must be either true or false`);
}

/**
 * 手动部署 UUPS implementation 和 ERC-1967 proxy。
 */
async function deployUUPSProxy(
  ContractFactory: any,
  initArgs: any[],
  signer: any,
  ethers: any
) {
  // 1. 部署实现合约
  const implementation = await ContractFactory.connect(signer).deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();

  // 2. 获取初始化数据
  const initData = ContractFactory.interface.encodeFunctionData("initialize", initArgs);

  // 3. 从 OpenZeppelin 的 artifact 读取 ERC1967Proxy
  const ERC1967ProxyArtifact = require("@openzeppelin/contracts/build/contracts/ERC1967Proxy.json");
  const ERC1967ProxyFactory = new ethers.ContractFactory(
    ERC1967ProxyArtifact.abi,
    ERC1967ProxyArtifact.bytecode,
    signer
  );
  
  // 4. 部署代理
  const proxy = await ERC1967ProxyFactory.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  // 5. 返回代理合约实例和 implementation 地址
  return {
    proxy: await ethers.getContractAt(ContractFactory.interface, proxyAddress),
    implementationAddress,
  };
}

/**
 * 部署模块合约（SaleManager和VRFHandler）
 * 
 * 使用方法：
 * npx hardhat run scripts/deployModules.ts --network sepolia
 * npx hardhat run scripts/deployModules.ts --network mainnet
 * npx hardhat run scripts/deployModules.ts --network localhost
 */
async function main() {
  const connection = await network.create();
  // @ts-ignore - ethers 属性由 @nomicfoundation/hardhat-ethers 插件添加
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();
  const moduleOwner = process.env.MODULE_OWNER_ADDRESS?.trim() || deployer.address;

  if (!ethers.isAddress(moduleOwner)) {
    throw new Error("MODULE_OWNER_ADDRESS must be a valid address");
  }

  console.log("Deploying UUPS modules...");
  console.log("Deployer:", deployer.address);
  console.log("Module owner:", moduleOwner);
  
  // 获取网络名称（从命令行参数 --network 获取）
  let networkName = "hardhat"; // 默认值
  const networkIndex = process.argv.indexOf("--network");
  if (networkIndex !== -1 && process.argv[networkIndex + 1]) {
    networkName = process.argv[networkIndex + 1];
  } else {
    // 如果命令行参数中没有，尝试根据 chainId 判断
    const networkInfo = await ethers.provider.getNetwork();
    const chainId = Number(networkInfo.chainId);
    if (chainId === 11155111) {
      networkName = "sepolia";
    } else if (chainId === 1) {
      networkName = "mainnet";
    } else if (chainId === 31337) {
      networkName = "hardhat";
    }
  }
  console.log("Network:", networkName);

  const salePrice = requireEnv("SALE_PRICE");
  const maxPerWallet = requireEnv("SALE_MAX_PER_WALLET");

  // 根据网络选择VRF配置（优先环境变量，然后 hardhat 配置）
  let vrfCoordinator: string;
  let keyHash: string;
  let subscriptionId: bigint;
  let callbackGasLimit: number;
  let requestConfirmations: number;
  let nativePayment: boolean;

  if (networkName === "sepolia") {
    vrfCoordinator = requireEnv("SEPOLIA_VRF_COORDINATOR");
    keyHash = requireEnv("SEPOLIA_KEY_HASH");
    const subIdStr = requireEnv("SEPOLIA_SUBSCRIPTION_ID");
    subscriptionId = BigInt(subIdStr);
    callbackGasLimit = Number(requireEnv("SEPOLIA_CALLBACK_GAS_LIMIT"));
    requestConfirmations = Number(requireEnv("SEPOLIA_REQUEST_CONFIRMATIONS"));
    nativePayment = readBooleanEnv("SEPOLIA_VRF_NATIVE_PAYMENT", true);
  } else if (networkName === "mainnet") {
    vrfCoordinator = requireEnv("MAINNET_VRF_COORDINATOR");
    keyHash = requireEnv("MAINNET_KEY_HASH");
    const subIdStr = requireEnv("MAINNET_SUBSCRIPTION_ID");
    subscriptionId = BigInt(subIdStr);
    callbackGasLimit = Number(requireEnv("MAINNET_CALLBACK_GAS_LIMIT"));
    requestConfirmations = Number(requireEnv("MAINNET_REQUEST_CONFIRMATIONS"));
    nativePayment = readBooleanEnv("MAINNET_VRF_NATIVE_PAYMENT", true);
  } else {
    throw new Error(
      `Unsupported network: ${networkName}. Use sepolia or mainnet with a configured Chainlink VRF subscription.`
    );
  }

  // VRF v2.5 使用 uint256 作为 subscriptionId，可以是任意大小的数字
  // 只验证不为 0
  if (subscriptionId === 0n) {
    throw new Error(
      `❌ Invalid subscriptionId: ${subscriptionId}\n` +
      `   Subscription ID cannot be 0\n\n` +
      `📖 How to get your Subscription ID:\n` +
      `   1. Visit https://vrf.chain.link/${networkName === "sepolia" ? "sepolia" : networkName === "mainnet" ? "" : "sepolia"}\n` +
      `   2. Connect your wallet (top right corner)\n` +
      `   3. Click "Create Subscription" to create a new subscription\n` +
      `   4. After creation, find your subscription in "My Subscriptions" list\n` +
      `   5. Click on the Subscription ID to view details\n` +
      `   6. Copy the Subscription ID from the wallet signature message or subscription details\n\n` +
      `💡 Example: Set your subscription ID:\n` +
      `   export SEPOLIA_SUBSCRIPTION_ID=56844506921699579036306656104852111530731083107608357020002801268108910808470`
    );
  }

  if (!Number.isInteger(callbackGasLimit) || callbackGasLimit <= 0) {
    throw new Error("VRF callback gas limit must be a positive integer");
  }
  if (!Number.isInteger(requestConfirmations) || requestConfirmations <= 0) {
    throw new Error("VRF request confirmations must be a positive integer");
  }

  // 部署SaleManager
  console.log("\n=== Deploying SaleManager ===");
  const SaleManager = await ethers.getContractFactory("SaleManager");
  const { proxy: saleManagerProxy, implementationAddress: saleManagerImplementation } = await deployUUPSProxy(
    SaleManager,
    [
      moduleOwner,
      ethers.parseEther(salePrice),
      BigInt(maxPerWallet),
    ],
    deployer,
    ethers
  );
  const saleManagerAddress = await saleManagerProxy.getAddress();
  console.log("SaleManager implementation:", saleManagerImplementation);
  console.log("SaleManager proxy:", saleManagerAddress);
  console.log("SaleManager owner:", await saleManagerProxy.owner());

  // 部署VRFHandler (VRF v2.5)
  console.log("\n=== Deploying VRFHandler (VRF v2.5) ===");
  console.log("VRF Coordinator:", vrfCoordinator);
  console.log("Key Hash:", keyHash);
  console.log("Subscription ID:", subscriptionId.toString());
  console.log("Native Payment:", nativePayment ? "true (使用原生代币)" : "false (使用LINK代币)");
  const VRFHandler = await ethers.getContractFactory("VRFHandler");

  // VRF v2.5 使用 uint256 作为 subscriptionId，直接传递 bigint
  // initialize 参数: (vrfCoordinator, keyHash, subscriptionId, callbackGasLimit, requestConfirmations, nativePayment)
  const { proxy: vrfHandlerProxy, implementationAddress: vrfHandlerImplementation } = await deployUUPSProxy(
    VRFHandler,
    [moduleOwner, vrfCoordinator, keyHash, subscriptionId, callbackGasLimit, requestConfirmations, nativePayment],
    deployer,
    ethers
  );
  const vrfHandlerAddress = await vrfHandlerProxy.getAddress();
  console.log("VRFHandler implementation:", vrfHandlerImplementation);
  console.log("VRFHandler proxy:", vrfHandlerAddress);
  console.log("VRFHandler owner:", await vrfHandlerProxy.owner());

  console.log("\n=== Deployment Summary ===");
  console.log("SaleManager proxy:", saleManagerAddress);
  console.log("VRFHandler proxy:", vrfHandlerAddress);

  console.log("\n💡 Next steps:");
  console.log("1. Set environment variables:");
  console.log(`   export SALE_MANAGER_ADDRESS=${saleManagerAddress} # proxy address`);
  console.log(`   export VRF_HANDLER_ADDRESS=${vrfHandlerAddress} # proxy address`);
  console.log("2. Deploy NFTBlindBoxUpgradeable with these module addresses");
  console.log("3. Add the VRFHandler proxy address to the Chainlink subscription");
  console.log("4. Keep the module owner under multisig control for future upgrades");

  return {
    saleManager: saleManagerAddress,
    vrfHandler: vrfHandlerAddress,
  };
}

main()
  .then((result) => {
    console.log("\nModule deployment successful!");
    console.log("SaleManager proxy:", result.saleManager);
    console.log("VRFHandler proxy:", result.vrfHandler);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n Deployment failed:");
    console.error(error);
    process.exit(1);
  });

