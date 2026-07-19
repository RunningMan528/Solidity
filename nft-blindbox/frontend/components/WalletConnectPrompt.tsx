'use client';

import { useWeb3 } from './Web3Provider';
import { Wallet } from 'lucide-react';

export default function WalletConnectPrompt() {
  const { connectWallet } = useWeb3();

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <Wallet className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          连接钱包
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          请先连接您的钱包以开始购买NFT盲盒
        </p>
        
        <button
          onClick={connectWallet}
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
        >
          连接 MetaMask
        </button>
        
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          如果您还没有安装 MetaMask，请先{' '}
          <a
            href="https://metamask.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            下载安装
          </a>
        </p>
      </div>
    </div>
  );
}

