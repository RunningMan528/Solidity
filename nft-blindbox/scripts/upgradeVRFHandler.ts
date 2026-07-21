import "dotenv/config";
import { network } from "hardhat";

const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const connection = await network.create();
  // @ts-ignore - ethers 属性由 @nomicfoundation/hardhat-ethers 插件添加
  const { ethers } = connection;
  const [upgrader] = await ethers.getSigners();
  const proxyAddress = requireEnv("VRF_HANDLER_ADDRESS");

  if (!ethers.isAddress(proxyAddress)) {
    throw new Error("VRF_HANDLER_ADDRESS must be a valid proxy address");
  }

  const vrfHandler = await ethers.getContractAt("VRFHandler", proxyAddress);
  const owner = await vrfHandler.owner();
  if (owner.toLowerCase() !== upgrader.address.toLowerCase()) {
    throw new Error(
      `Only the VRFHandler owner can upgrade this proxy.\nOwner: ${owner}\nSigner: ${upgrader.address}`
    );
  }

  console.log("Upgrading VRFHandler proxy to V3...");
  console.log("Proxy address:", proxyAddress);
  console.log("Upgrader:", upgrader.address);
  console.log("Current owner:", owner);
  console.log("Current coordinator:", await vrfHandler.getVRFCoodinator());
  console.log("Subscription ID:", (await vrfHandler.getSubscriptionId()).toString());

  const currentStorage = await ethers.provider.getStorage(
    proxyAddress,
    IMPLEMENTATION_SLOT
  );
  console.log(
    "Current implementation:",
    ethers.getAddress("0x" + currentStorage.slice(-40))
  );

  const VRFHandlerV3 = await ethers.getContractFactory("VRFHandlerV3");
  const implementation = await VRFHandlerV3.connect(upgrader).deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  console.log("New V3 implementation:", implementationAddress);

  const proxyAsV3 = await ethers.getContractAt("VRFHandlerV3", proxyAddress);
  const upgradeTx = await proxyAsV3
    .connect(upgrader)
    .upgradeToAndCall(implementationAddress, "0x");
  console.log("Upgrade transaction:", upgradeTx.hash);
  await upgradeTx.wait();

  const upgradedStorage = await ethers.provider.getStorage(
    proxyAddress,
    IMPLEMENTATION_SLOT
  );
  const upgradedImplementation = ethers.getAddress(
    "0x" + upgradedStorage.slice(-40)
  );
  if (upgradedImplementation !== implementationAddress) {
    throw new Error("Implementation slot verification failed");
  }

  console.log("\nVRFHandler upgrade successful.");
  console.log("Proxy address unchanged:", proxyAddress);
  console.log("Active V3 implementation:", upgradedImplementation);
  console.log("Existing pending requests remain stored in this proxy.");
  console.log("Retry failed callbacks from the Chainlink VRF dashboard after confirmation.");
}

main().catch((error) => {
  console.error("\nVRFHandler upgrade failed:");
  console.error(error);
  process.exitCode = 1;
});