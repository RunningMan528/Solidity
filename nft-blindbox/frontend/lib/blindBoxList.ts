/**
 * 可购买的盲盒列表配置
 * 
 * 使用说明：
 * 1. 如果有多个盲盒系列，在这里定义每个盲盒的配置
 * 2. 每个盲盒需要对应的合约地址
 * 3. 在 BlindBoxList 组件中使用这些配置
 */

import { getContractAddress } from './config';

export interface BlindBoxItem {
  id: string; // 唯一标识
  name: string; // 盲盒名称
  nameZh: string; // 中文名称
  description: string; // 描述
  contractAddress: string; // 合约地址
  image?: string; // 封面图片URL
  price?: bigint; // 价格（从合约读取）
  totalSupply?: bigint; // 总供应量（从合约读取）
  maxSupply?: bigint; // 最大供应量（从合约读取）
  saleActive?: boolean; // 是否在售（从合约读取）
  network: string; // 所属网络
  featured?: boolean; // 是否推荐
}

// 盲盒列表配置
// 如果有多个盲盒系列，在这里添加
export const BLIND_BOX_LIST: BlindBoxItem[] = [
  {
    id: 'mystery-nft-v1',
    name: 'Mystery NFT',
    nameZh: '神秘NFT盲盒',
    description: '开启你的收藏之旅，发现稀有NFT',
    contractAddress: '', // 从环境变量或配置中读取
    network: 'sepolia', // 或 'mainnet', 'localhost'
    featured: true, // 推荐展示
  },
  // 可以添加更多盲盒系列
  // {
  //   id: 'mystery-nft-v2',
  //   name: 'Mystery NFT V2',
  //   nameZh: '神秘NFT盲盒 V2',
  //   description: '第二代盲盒系列',
  //   contractAddress: '',
  //   network: 'sepolia',
  //   featured: false,
  // },
];

/**
 * 从环境变量或配置中获取盲盒列表
 * 支持按网络过滤
 */
export function getBlindBoxList(network?: string): BlindBoxItem[] {
  let list = [...BLIND_BOX_LIST];

  // 从配置中读取合约地址（如果配置了）
  list = list.map((item) => {
    // 如果已经有合约地址，直接返回
    if (item.contractAddress) {
      return item;
    }
    
    // 从 config.ts 中获取对应网络的合约地址
    const contractAddress = getContractAddress(item.network);
    
    if (contractAddress) {
      return {
        ...item,
        contractAddress,
      };
    }
    return item;
  });

  // 过滤掉没有合约地址的项
  list = list.filter((item) => item.contractAddress && item.contractAddress.length > 0);

  // 如果指定了网络，进行过滤
  if (network) {
    list = list.filter((item) => item.network === network);
  }

  // 调试日志（仅在浏览器环境）
  if (typeof window !== 'undefined') {
    console.log('[BlindBoxList] Network:', network, 'Found items:', list.length, list);
  }

  return list;
}

/**
 * 根据ID获取盲盒配置
 */
export function getBlindBoxById(id: string): BlindBoxItem | undefined {
  return BLIND_BOX_LIST.find((item) => item.id === id);
}

/**
 * 获取推荐的盲盒列表
 */
export function getFeaturedBlindBoxes(network?: string): BlindBoxItem[] {
  return getBlindBoxList(network).filter((item) => item.featured);
}

