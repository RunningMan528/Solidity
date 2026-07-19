'use client';

import { useWeb3 } from './Web3Provider';
import { formatAddress, copyToClipboard } from '@/lib/contracts';
import { APP_CONFIG } from '@/lib/config';
import { Wallet, Copy, Check, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { account, connectWallet, disconnect, chainId } = useWeb3();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (account) {
      const success = await copyToClipboard(account);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <header className="relative z-50 border-b border-primary-200/50 dark:border-primary-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {APP_CONFIG.description}
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {chainId && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Chain ID: {chainId}</span>
              </div>
            )}
            
            {account ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">{formatAddress(account)}</span>
                  <span className="sm:hidden">{formatAddress(account, 4, 4)}</span>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="断开连接"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <Wallet className="w-4 h-4" />
                <span>连接钱包</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

