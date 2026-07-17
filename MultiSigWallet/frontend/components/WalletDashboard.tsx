'use client';

import { useState, useEffect } from 'react';
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet';
import { useTransactions } from '@/hooks/useTransactions';
import { useWeb3 } from './Web3Provider';
import { useAlert } from './AlertProvider';
import { ArrowLeft, Loader2, Wallet, Users, Shield, Coins, FileText, Settings, Plus, Copy, Check } from 'lucide-react';
import TransactionList from './TransactionList';
import CreateTransactionModal from './CreateTransactionModal';
import OwnersManagement from './OwnersManagement';
import WalletInfo from './WalletInfo';
import { formatAddress } from '@/lib/format';

interface WalletDashboardProps {
  walletAddress: string;
  onBack: () => void;
}

export default function WalletDashboard({ walletAddress, onBack }: WalletDashboardProps) {
  const { walletData, loading, refresh } = useMultiSigWallet(walletAddress);
  const { transactions, refresh: refreshTransactions } = useTransactions(walletAddress);
  const { account } = useWeb3();
  const { showSuccess } = useAlert();
  const [activeTab, setActiveTab] = useState<'transactions' | 'owners' | 'settings'>('transactions');
  const [showCreateTx, setShowCreateTx] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    showSuccess('地址已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  // 将当前钱包地址保存到 localStorage，以便 Header 组件可以访问
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('current_wallet_address', walletAddress);
    }
    return () => {
      // 组件卸载时不清除，因为用户可能只是切换了标签
    };
  }, [walletAddress]);

  // 监听钱包余额更新事件
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail.walletAddress === walletAddress) {
        // 刷新钱包数据
        refresh();
      }
    };

    window.addEventListener('walletBalanceUpdated', handleBalanceUpdate as EventListener);
    return () => {
      window.removeEventListener('walletBalanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [walletAddress, refresh]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="text-center py-24">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          无法加载钱包数据，请检查地址是否正确
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              多签钱包
            </h1>
            <div className="flex items-center gap-2">
              <code className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                {formatAddress(walletAddress)}
              </code>
              <button
                onClick={copyWalletAddress}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="复制完整地址"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>
            </div>
          </div>
          {walletData.isOwner && (
            <button
              onClick={() => setShowCreateTx(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              创建交易
            </button>
          )}
        </div>
      </div>

      {/* Wallet Info Cards */}
      <WalletInfo walletData={walletData} />

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-t-xl">
          <nav className="flex gap-2 p-2">
            {[
              { id: 'transactions', label: '交易', icon: FileText },
              { id: 'owners', label: '所有者', icon: Users },
              { id: 'settings', label: '设置', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'transactions' && (
            <TransactionList
              transactions={transactions}
              walletAddress={walletAddress}
              walletData={walletData}
              onRefresh={() => {
                refreshTransactions();
                refresh(); // 同时刷新钱包数据（包括投票计数）
              }}
            />
          )}
          {activeTab === 'owners' && (
            <OwnersManagement
              walletAddress={walletAddress}
              walletData={walletData}
              onRefresh={refresh}
            />
          )}
          {activeTab === 'settings' && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200/50 dark:border-slate-700/50">
              <p className="text-gray-600 dark:text-gray-400">
                设置功能开发中...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showCreateTx && (
        <CreateTransactionModal
          walletAddress={walletAddress}
          onClose={() => setShowCreateTx(false)}
          onSuccess={() => {
            setShowCreateTx(false);
            refreshTransactions();
          }}
        />
      )}
    </div>
  );
}

