/**
 * 网络管理工具
 * 处理网络切换、验证等功能
 */

import { getNetworkConfig, NETWORKS } from './config';

/**
 * 切换到指定网络
 */
export async function switchNetwork(networkName: string): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const config = getNetworkConfig(networkName);
  const chainId = `0x${config.chainId.toString(16)}`;

  try {
    // 尝试切换到网络
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError: any) {
    // 如果网络不存在，添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: config.name,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: config.blockExplorer ? [config.blockExplorer] : [],
            },
          ],
        });
      } catch (addError) {
        console.error('Error adding network:', addError);
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * 获取当前网络配置
 */
export async function getCurrentNetwork(): Promise<{ chainId: number; name: string } | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdNumber = parseInt(chainId as string, 16);

    for (const [name, config] of Object.entries(NETWORKS)) {
      if (config.chainId === chainIdNumber) {
        return { chainId: chainIdNumber, name };
      }
    }

    return { chainId: chainIdNumber, name: 'Unknown' };
  } catch (error) {
    console.error('Error getting current network:', error);
    return null;
  }
}

/**
 * 验证当前网络是否支持
 */
export async function isNetworkSupported(): Promise<boolean> {
  const current = await getCurrentNetwork();
  if (!current) {
    return false;
  }

  return Object.values(NETWORKS).some(
    (config) => config.chainId === current.chainId
  );
}

/**
 * 获取推荐网络列表（排除当前网络）
 */
export async function getRecommendedNetworks(): Promise<Array<{ name: string; chainId: number }>> {
  const current = await getCurrentNetwork();
  const currentChainId = current?.chainId;

  return Object.entries(NETWORKS)
    .filter(([_, config]) => config.chainId !== currentChainId)
    .map(([name, config]) => ({
      name,
      chainId: config.chainId,
    }));
}

