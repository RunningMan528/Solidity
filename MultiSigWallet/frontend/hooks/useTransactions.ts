'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/components/Web3Provider';
import { MultiSigWalletABI } from '@/lib/abis';
import { Transaction } from './useMultiSigWallet';

export interface TransactionWithIndex extends Transaction {
  index: number;
  isConfirmed: boolean;
  canExecute: boolean;
}

export function useTransactions(walletAddress: string | null) {
  const { provider, signer, account } = useWeb3();
  const [transactions, setTransactions] = useState<TransactionWithIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!walletAddress || !provider) return;

    try {
      setLoading(true);
      setError(null);

      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, provider);
      const transactionCount = await contract.getTransactionCount();
      const count = Number(transactionCount);

      if (count === 0) {
        setTransactions([]);
        return;
      }

      const txPromises = [];
      for (let i = 0; i < count; i++) {
        txPromises.push(
          Promise.all([
            contract.getTransaction(i),
            account ? contract.isTransactionConfirmed(i, account) : false,
            contract.canExecute(i),
          ])
        );
      }

      const results = await Promise.all(txPromises);
      const txs: TransactionWithIndex[] = results.map(([tx, isConfirmed, canExecute], index) => ({
        index,
        to: tx.to,
        value: tx.value,
        data: tx.data,
        executed: tx.executed,
        numConfirmations: Number(tx.numConfirmations),
        isConfirmed: isConfirmed as boolean,
        canExecute: canExecute as boolean,
      }));

      // 按索引倒序排列（最新的在前）
      setTransactions(txs.reverse());
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message || '加载交易失败');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, account]);

  useEffect(() => {
    loadTransactions();
    
    // 监听事件以实时更新
    if (walletAddress && provider) {
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, provider);
      
      const eventHandlers = [
        () => loadTransactions(),
        () => loadTransactions(),
        () => loadTransactions(),
        () => loadTransactions(),
      ];

      // 设置事件监听器
      contract.on('SubmitTransaction', eventHandlers[0]);
      contract.on('ConfirmTransaction', eventHandlers[1]);
      contract.on('RevokeConfirmation', eventHandlers[2]);
      contract.on('ExecuteTransaction', eventHandlers[3]);

      return () => {
        // 清理事件监听器
        contract.off('SubmitTransaction', eventHandlers[0]);
        contract.off('ConfirmTransaction', eventHandlers[1]);
        contract.off('RevokeConfirmation', eventHandlers[2]);
        contract.off('ExecuteTransaction', eventHandlers[3]);
      };
    }
  }, [walletAddress, provider, loadTransactions]);

  return {
    transactions,
    loading,
    error,
    refresh: loadTransactions,
  };
}

