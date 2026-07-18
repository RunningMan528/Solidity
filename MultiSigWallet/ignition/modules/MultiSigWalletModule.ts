import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * 多签钱包部署模块(仅部署实现合约)
 * 注意:由于 Ignition 和 Openzeppelin Upgrades插件的集成限制.
 * 推荐使用 scripts/deployWithProxy.ts进行完整部署.
 * 
 * 这个模块仅用于部署实现合约,代理部署请使用 Openzeppelin Upgrades 插件
 * 
 * 可升级合约没有构造函数,所以可以直接部署即可.
 */
const MultiSigWalletModule = buildModule("MultiSigWalletModule", (m) => {
    const implementation = m.contract("MultiSigWalletUpgradeable", [], {
        id: "MultiSigWalletImplementation",
    });
    return { implementation };
});

export default MultiSigWalletModule;