/**
 * NFT盲盒前端配置文件
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
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Mystery NFT',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '神秘NFT盲盒，开启你的收藏之旅',
  version: '1.0.0',
  defaultNetwork: DEFAULT_NETWORK,
  supportedNetworks: Object.keys(NETWORKS),
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || 'a855f7',
} as const;

// 稀有度配置
export const RARITY_CONFIG = {
  common: {
    name: 'Common',
    nameZh: '普通',
    color: '#9ca3af',
    probability: 60,
    gradient: 'from-gray-400 to-gray-600',
  },
  rare: {
    name: 'Rare',
    nameZh: '稀有',
    color: '#3b82f6',
    probability: 25,
    gradient: 'from-blue-400 to-blue-600',
  },
  epic: {
    name: 'Epic',
    nameZh: '史诗',
    color: '#8b5cf6',
    probability: 12,
    gradient: 'from-purple-400 to-purple-600',
  },
  legendary: {
    name: 'Legendary',
    nameZh: '传说',
    color: '#f59e0b',
    probability: 3,
    gradient: 'from-yellow-400 via-orange-500 to-yellow-600',
  },
} as const;

