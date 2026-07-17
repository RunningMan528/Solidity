'use client';

import { useWeb3 } from './Web3Provider';
import { Wallet } from 'lucide-react';

export default function WalletConnectPrompt() {
  const { connectWallet, isConnecting } = useWeb3();

  return (
    <div className="text-center py-24 animate-fade-in">
      <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-2xl mb-8 relative">
        <Wallet className="w-16 h-16 text-white z-10" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-xl" />
      </div>
      <h1 className="text-5xl font-bold text-gradient mb-4">
        欢迎使用多签钱包
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 mb-2 max-w-2xl mx-auto">
        安全、专业的多签钱包管理平台
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
        连接您的钱包以开始管理多签钱包
      </p>
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? '连接中...' : '连接钱包'}
      </button>
    </div>
  );
}

