'use client';

import { useState } from 'react';
import { useWeb3 } from './Web3Provider';
import { Wallet, LogOut } from 'lucide-react';
import Link from 'next/link';
import AccountDetailsModal from './AccountDetailsModal';

export default function Header() {
  const { account, provider, connectWallet, disconnect, isConnecting } = useWeb3();
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            CrowdFund
          </Link>

          <div className="flex items-center gap-4">
            {account ? (
              <>
                <button
                  onClick={() => setShowAccountDetails(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer group"
                  title="点击查看账户详情"
                >
                  <Wallet className="w-4 h-4 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300 group-hover:text-primary-800 dark:group-hover:text-primary-200 font-mono">
                    {account.slice(0, 4)}...{account.slice(-4)}
                  </span>
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
                  演示提示：在 MetaMask 中切换账户可模拟其他用户
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">断开连接</span>
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Details Modal */}
      {account && (
        <AccountDetailsModal
          isOpen={showAccountDetails}
          onClose={() => setShowAccountDetails(false)}
          address={account}
          provider={provider}
        />
      )}
    </header>
  );
}

