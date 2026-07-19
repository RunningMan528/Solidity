'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/components/Web3Provider';
import { getContractAddress, getNetworkNameByChainId } from '@/lib/config';
import Header from '@/components/Header';
import WalletConnectPrompt from '@/components/WalletConnectPrompt';
import BlindBoxShowcase from '@/components/BlindBoxShowcase';
import BlindBoxList from '@/components/BlindBoxList';
import MyNFTs from '@/components/MyNFTs';
import { Loader2 } from 'lucide-react';
import { useNFTBlindBox } from '@/hooks/useNFTBlindBox';

export default function Home() {
  const { account, isConnecting, chainId } = useWeb3();
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // 从环境变量自动加载合约地址
  useEffect(() => {
    if (chainId && !contractAddress) {
      const networkName = getNetworkNameByChainId(chainId);
      if (networkName) {
        const address = getContractAddress(networkName);
        if (address) {
          setContractAddress(address);
        }
      }
    }
  }, [chainId, contractAddress]);

  const { refresh } = useNFTBlindBox(contractAddress || undefined);

  // 监听购买成功事件，自动刷新数据
  useEffect(() => {
    const handleNFTPurchased = () => {
      // 延迟刷新，确保链上数据已同步
      setTimeout(() => {
        if (refresh) {
          refresh();
        }
      }, 2000);
    };

    window.addEventListener('nft-purchased', handleNFTPurchased);
    return () => {
      window.removeEventListener('nft-purchased', handleNFTPurchased);
    };
  }, [refresh]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 动态背景装饰 */}
      <div className="fixed inset-0 -z-10">
        {/* 基础渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        
        {/* 网格图案 */}
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* 动态光效 */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-400/20 dark:bg-accent-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* 装饰线条 */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-300/30 to-transparent dark:via-primary-600/20"
            style={{ transform: 'rotate(-2deg)' }}
          />
          <div 
            className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-300/30 to-transparent dark:via-accent-600/20"
            style={{ transform: 'rotate(2deg)' }}
          />
        </div>
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {isConnecting ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : !account ? (
          <WalletConnectPrompt />
        ) : !contractAddress ? (
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                合约未配置
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                请在环境变量中配置合约地址
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                请设置 NEXT_PUBLIC_CONTRACT_ADDRESS_{chainId ? getNetworkNameByChainId(chainId)?.toUpperCase() : 'SEPOLIA'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 可购买的盲盒列表 */}
            <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  可购买的盲盒
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  选择你喜欢的盲盒系列开始收藏
                </p>
              </div>
              <BlindBoxList />
            </section>

            {/* 我的NFT收藏 */}
            {account && (
              <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
                <MyNFTs />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

