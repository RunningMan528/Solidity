'use client';

import { ethers } from 'ethers';
import { TransactionWithIndex } from '@/hooks/useTransactions';
import { MultiSigWalletData } from '@/hooks/useMultiSigWallet';
import TransactionCard from './TransactionCard';
import { Loader2 } from 'lucide-react';

interface TransactionListProps {
  transactions: TransactionWithIndex[];
  walletAddress: string;
  walletData: MultiSigWalletData;
  onRefresh: () => void;
}

export default function TransactionList({
  transactions,
  walletAddress,
  walletData,
  onRefresh,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-200/50 dark:border-slate-700/50 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          暂无交易记录
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionCard
          key={tx.index}
          transaction={tx}
          walletAddress={walletAddress}
          walletData={walletData}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

