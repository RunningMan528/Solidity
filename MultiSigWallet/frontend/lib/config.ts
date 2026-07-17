/**
 * 多签钱包前端配置文件
 * 
 * 使用说明：
 * 1. 部署合约后，将合约地址填入对应网络的 CONTRACT_ADDRESS
 * 2. 如需使用自定义 RPC，修改 RPC_URL
 * 3. 生产环境建议使用环境变量覆盖配置
 */

// 网络配置
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// 支持的网络配置
export const NETWORKS: Record<string, NetworkConfig> = {
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// 合约地址配置（按网络）
// 部署合约后，将地址填入对应网络
export const CONTRACT_ADDRESSES: Record<string, string | null> = {
  localhost: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LOCALHOST || null,
  sepolia: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SEPOLIA || null,
  mainnet: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || null,
};

// 默认网络
export const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'sepolia';

// 获取当前网络的配置
export function getNetworkConfig(networkName: string = DEFAULT_NETWORK): NetworkConfig {
  const config = NETWORKS[networkName];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}`);
  }
  return config;
}

// 获取当前网络的合约地址
export function getContractAddress(networkName: string = DEFAULT_NETWORK): string | null {
  return CONTRACT_ADDRESSES[networkName] || null;
}

// 根据链ID获取网络名称
export function getNetworkNameByChainId(chainId: number): string | null {
  for (const [name, config] of Object.entries(NETWORKS)) {
    if (config.chainId === chainId) {
      return name;
    }
  }
  return null;
}

// 应用配置
export const APP_CONFIG = {
  name: '多签钱包',
  description: '安全、去中心化的多签钱包管理平台',
  version: '1.0.0',
  defaultNetwork: DEFAULT_NETWORK,
  supportedNetworks: Object.keys(NETWORKS),
} as const;

