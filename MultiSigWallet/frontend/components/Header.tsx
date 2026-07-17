'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { Wallet, LogOut } from 'lucide-react';
import AccountDetailsModal from './AccountDetailsModal';

export default function Header() {
  const { account, provider, connectWallet, disconnect, isConnecting } = useWeb3();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // 从 localStorage 读取当前的多签钱包地址
  useEffect(() => {
    const storedAddress = localStorage.getItem('current_wallet_address');
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }

    // 监听 storage 事件，以便在其他标签页或组件更新时同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_wallet_address') {
        setWalletAddress(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gradient">
                多签钱包
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Multi-Signature Wallet
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {account ? (
              <>
                <button
                  onClick={() => setShowAccountDetails(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer group shadow-sm"
                  title="点击查看账户详情"
                >
                  <Wallet className="w-4 h-4 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 font-mono">
                    {account.slice(0, 4)}...{account.slice(-4)}
                  </span>
                </button>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">断开</span>
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>

      {account && (
        <AccountDetailsModal
          isOpen={showAccountDetails}
          onClose={() => setShowAccountDetails(false)}
          address={account}
          provider={provider}
          walletAddress={walletAddress || undefined}
        />
      )}
    </header>
  );
}

