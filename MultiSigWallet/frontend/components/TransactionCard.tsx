'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { TransactionWithIndex } from '@/hooks/useTransactions';
import { MultiSigWalletData } from '@/hooks/useMultiSigWallet';
import { useWeb3 } from './Web3Provider';
import { useAlert } from './AlertProvider';
import { MultiSigWalletABI } from '@/lib/abis';
import { CheckCircle, XCircle, Play, Clock, Copy, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatEth, formatAddress } from '@/lib/format';

interface TransactionCardProps {
  transaction: TransactionWithIndex;
  walletAddress: string;
  walletData: MultiSigWalletData;
  onRefresh: () => void;
}

export default function TransactionCard({
  transaction,
  walletAddress,
  walletData,
  onRefresh,
}: TransactionCardProps) {
  const { signer, account } = useWeb3();
  const { showSuccess, showError } = useAlert();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const value = ethers.formatEther(transaction.value);
  const progress = walletData.threshold > BigInt(0)
    ? (transaction.numConfirmations / Number(walletData.threshold)) * 100
    : 0;

  const handleConfirm = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    try {
      setIsConfirming(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.confirmTransaction(transaction.index);
      showSuccess('交易确认中...');
      await tx.wait();
      showSuccess('交易已确认');
      onRefresh();
    } catch (error: any) {
      console.error('Error confirming transaction:', error);
      showError(error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRevoke = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    try {
      setIsRevoking(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.revokeConfirmation(transaction.index);
      showSuccess('撤销确认中...');
      await tx.wait();
      showSuccess('已撤销确认');
      onRefresh();
    } catch (error: any) {
      console.error('Error revoking confirmation:', error);
      showError(error);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleExecute = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    try {
      setIsExecuting(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.executeTransaction(transaction.index);
      showSuccess('执行交易中...');
      await tx.wait();
      showSuccess('交易已执行');
      onRefresh();
    } catch (error: any) {
      console.error('Error executing transaction:', error);
      showError(error);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    showSuccess('地址已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (transaction.executed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs font-semibold border border-green-200 dark:border-green-800/50">
          <CheckCircle className="w-3 h-3" />
          已执行
        </span>
      );
    }
    if (transaction.canExecute) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-xs font-semibold border border-blue-200 dark:border-blue-800/50 animate-pulse">
          <Play className="w-3 h-3" />
          可执行
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-md text-xs font-semibold border border-amber-200 dark:border-amber-800/50">
        <Clock className="w-3 h-3" />
        等待确认
      </span>
    );
  };

  return (
    <div className="group relative">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* 左侧状态指示条 */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          transaction.executed 
            ? 'bg-gradient-to-b from-green-500 to-green-600' 
            : transaction.canExecute 
            ? 'bg-gradient-to-b from-blue-500 to-blue-600' 
            : 'bg-gradient-to-b from-amber-500 to-amber-600'
        }`} />
        
        <div className="pl-5 pr-4 py-4">
          {/* 顶部：交易编号和状态 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                #{transaction.index}
            </span>
            {getStatusBadge()}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        </div>

          {/* 主要内容区域 */}
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* 左侧：地址和金额 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">接收地址</span>
              <button
                onClick={() => copyAddress(transaction.to)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded transition-colors"
                  title="复制地址"
              >
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                )}
              </button>
            </div>
              <code className="text-sm font-mono text-slate-900 dark:text-slate-100 font-semibold">
                {formatAddress(transaction.to, 8, 6)}
              </code>
          </div>

            {/* 右侧：金额 */}
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">金额</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatEth(value)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ETH</span>
            </p>
          </div>
        </div>

          {/* 确认进度条 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">确认进度</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {transaction.numConfirmations}<span className="text-slate-400 dark:text-slate-500">/{walletData.threshold.toString()}</span>
            </span>
          </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <div
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  transaction.executed
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : transaction.canExecute
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                } shadow-sm`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

          {/* 操作按钮区域 */}
        {walletData.isOwner && !transaction.executed && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            {!transaction.isConfirmed ? (
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>确认中</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>确认</span>
                    </>
                  )}
              </button>
            ) : (
              <button
                onClick={handleRevoke}
                disabled={isRevoking}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                  {isRevoking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>撤销中</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>撤销</span>
                    </>
                  )}
              </button>
            )}
            {transaction.canExecute && (
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>执行中</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>执行</span>
                    </>
                  )}
              </button>
            )}
          </div>
        )}
        </div>

        {/* 展开详情 */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700/50 mt-3 space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">完整地址</p>
              <code className="block text-xs font-mono text-slate-700 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {transaction.to}
              </code>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">调用数据</p>
              <code className="block text-xs font-mono text-slate-700 dark:text-slate-300 break-all bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {transaction.data === '0x' ? '无数据' : transaction.data}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

