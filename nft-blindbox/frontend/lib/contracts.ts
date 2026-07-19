/**
 * 合约工具函数
 * 提供合约实例创建、地址验证等功能
 */

import { ethers } from 'ethers';
import { NFTBlindBoxABI, SaleManagerABI } from './abis';
import { getContractAddress, getNetworkConfig, getNetworkNameByChainId } from './config';

/**
 * 创建NFT盲盒合约实例
 */
export function getNFTBlindBoxContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, NFTBlindBoxABI, signerOrProvider);
}

/**
 * 创建SaleManager合约实例
 */
export function getSaleManagerContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, SaleManagerABI, signerOrProvider);
}

/**
 * 验证合约地址是否有效
 */
export function isValidContractAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * 获取合约的区块浏览器链接
 */
export function getContractExplorerUrl(
  address: string,
  chainId?: number
): string | null {
  if (!chainId) {
    return null;
  }

  const networkName = getNetworkNameByChainId(chainId);
  if (!networkName) {
    return null;
  }

  const config = getNetworkConfig(networkName);
  if (!config.blockExplorer) {
    return null;
  }

  return `${config.blockExplorer}/address/${address}`;
}

/**
 * 获取交易的区块浏览器链接
 */
export function getTransactionExplorerUrl(
  txHash: string,
  chainId?: number
): string | null {
  if (!chainId) {
    return null;
  }

  const networkName = getNetworkNameByChainId(chainId);
  if (!networkName) {
    return null;
  }

  const config = getNetworkConfig(networkName);
  if (!config.blockExplorer) {
    return null;
  }

  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * 格式化地址（显示前6位和后4位）
 */
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address || address.length < startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * 格式化ETH金额
 */
export function formatEther(value: bigint | string): string {
  return ethers.formatEther(value);
}

/**
 * 解析ETH金额
 */
export function parseEther(value: string): bigint {
  return ethers.parseEther(value);
}

/**
 * 复制地址到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 稀有度枚举值
 */
export enum Rarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
}

/**
 * 销售阶段枚举值
 */
export enum SalePhase {
  NotStarted = 0,
  Whitelist = 1,
  Public = 2,
}

