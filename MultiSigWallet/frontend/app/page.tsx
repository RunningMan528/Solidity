'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/components/Web3Provider';
import { getContractAddress, getNetworkNameByChainId } from '@/lib/config';
import Header from '@/components/Header';
import WalletConnectPrompt from '@/components/WalletConnectPrompt';
import WalletInput from '@/components/WalletInput';
import WalletDashboard from '@/components/WalletDashboard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { account, isConnecting, chainId } = useWeb3();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // 从环境变量自动加载合约地址
  useEffect(() => {
    if (chainId && !walletAddress) {
      const networkName = getNetworkNameByChainId(chainId);
      if (networkName) {
        const contractAddress = getContractAddress(networkName);
        if (contractAddress) {
          setWalletAddress(contractAddress);
        }
      }
    }
  }, [chainId, walletAddress]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* 专业背景装饰 - 几何图案风格 */}
      <div className="fixed inset-0 -z-10">
        {/* 基础渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        
        {/* 几何网格图案 */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(37, 99, 235, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* 对角线装饰线条 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div 
              className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-300/20 to-transparent dark:via-primary-600/10"
              style={{ transform: 'rotate(-5deg)' }}
            />
            <div 
              className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-300/20 to-transparent dark:via-accent-600/10"
              style={{ transform: 'rotate(3deg)' }}
            />
          </div>
        </div>
        
        {/* 专业光效 - 更subtle */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-400/5 dark:bg-primary-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-400/5 dark:bg-accent-600/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {isConnecting ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : !account ? (
          <WalletConnectPrompt />
        ) : !walletAddress ? (
          <WalletInput 
            onWalletAddressSet={setWalletAddress}
          />
        ) : (
          <WalletDashboard walletAddress={walletAddress} onBack={() => setWalletAddress(null)} />
        )}
      </main>
    </div>
  );
}

