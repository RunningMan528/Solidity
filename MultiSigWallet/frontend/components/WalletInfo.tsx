'use client';

import { ethers } from 'ethers';
import { Wallet, Users, Shield, Coins, Code } from 'lucide-react';
import { MultiSigWalletData } from '@/hooks/useMultiSigWallet';
import { formatEth } from '@/lib/format';

interface WalletInfoProps {
  walletData: MultiSigWalletData;
}

export default function WalletInfo({ walletData }: WalletInfoProps) {
  const balance = ethers.formatEther(walletData.balance);

  const cards = [
    {
      icon: Coins,
      label: '余额',
      value: `${formatEth(balance)} ETH`,
      color: 'text-success-600 dark:text-success-400',
      bgColor: 'bg-gradient-to-br from-success-500/10 to-success-600/10',
      borderColor: 'border-success-200 dark:border-success-800',
    },
    {
      icon: Users,
      label: '所有者',
      value: `${walletData.owners.length} 个`,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-gradient-to-br from-primary-500/10 to-primary-600/10',
      borderColor: 'border-primary-200 dark:border-primary-800',
    },
    {
      icon: Shield,
      label: '确认阈值',
      value: `${walletData.threshold.toString()} / ${walletData.owners.length}`,
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-gradient-to-br from-accent-500/10 to-accent-600/10',
      borderColor: 'border-accent-200 dark:border-accent-800',
    },
    {
      icon: Wallet,
      label: '交易总数',
      value: walletData.transactionCount.toString(),
      color: 'text-slate-700 dark:text-slate-300',
      bgColor: 'bg-gradient-to-br from-slate-500/10 to-slate-600/10',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
  ];

  // 如果已升级到 V2，添加版本信息卡片
  if (walletData.version !== null) {
    cards.push({
      icon: Code,
      label: '合约版本',
      value: `V${walletData.version.toString()}`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-200 dark:border-purple-800',
    });
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${cards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="card-elevated p-6 group relative overflow-hidden"
          >
            {/* 装饰性渐变背景 */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${card.bgColor}`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

