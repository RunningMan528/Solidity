/**
 * 合约工具函数
 * 提供合约实例创建、地址验证等功能
 */

import { ethers } from 'ethers';
import { MultiSigWalletABI } from './abis';
import { getContractAddress, getNetworkConfig, getNetworkNameByChainId } from './config';

/**
 * 创建多签钱包合约实例
 */
export function getMultiSigWalletContract(
  address: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(address, MultiSigWalletABI, signerOrProvider);
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

