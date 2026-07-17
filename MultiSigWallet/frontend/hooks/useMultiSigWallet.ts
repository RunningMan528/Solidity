'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/components/Web3Provider';
import { MultiSigWalletABI } from '@/lib/abis';

export interface Transaction {
  to: string;
  value: bigint;
  data: string;
  executed: boolean;
  numConfirmations: number;
}

export interface OwnerVoteCount {
  owner: string;
  count: bigint;
}

export interface MultiSigWalletData {
  address: string;
  owners: string[];
  threshold: bigint;
  balance: bigint;
  transactionCount: bigint;
  isOwner: boolean;
  // V2 新功能
  version: bigint | null;
  ownerVoteCounts: OwnerVoteCount[];
}

export function useMultiSigWallet(walletAddress: string | null) {
  const { provider, signer, account } = useWeb3();
  const [walletData, setWalletData] = useState<MultiSigWalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    if (!walletAddress || !provider) return;

    try {
      setLoading(true);
      setError(null);

      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, provider);
      
      // 获取基础数据
      const [owners, threshold, balance, transactionCount, isOwner] = await Promise.all([
        contract.getOwners(),
        contract.getThreshold(),
        contract.getBalance(),
        contract.getTransactionCount(),
        account ? contract.isOwner(account) : false,
      ]);

      // 尝试获取 V2 版本信息（如果合约已升级）
      let version: bigint | null = null;
      let ownerVoteCounts: OwnerVoteCount[] = [];
      
      try {
        // 尝试获取版本号
        version = await contract.version() as bigint;
        
        // 如果版本存在，获取所有所有者的投票计数
        const voteCountPromises = (owners as string[]).map(async (owner: string) => {
          try {
            const count = await contract.getOwnerVoteCount(owner) as bigint;
            return { owner, count };
          } catch {
            return { owner, count: BigInt(0) };
          }
        });
        ownerVoteCounts = await Promise.all(voteCountPromises);
      } catch (error) {
        // 如果 version() 调用失败，说明合约还是 V1 版本
        console.log('Contract is V1, V2 features not available');
        version = null;
        ownerVoteCounts = (owners as string[]).map(owner => ({ owner, count: BigInt(0) }));
      }

      setWalletData({
        address: walletAddress,
        owners: owners as string[],
        threshold: threshold as bigint,
        balance: balance as bigint,
        transactionCount: transactionCount as bigint,
        isOwner: isOwner as boolean,
        version,
        ownerVoteCounts,
      });
    } catch (err: any) {
      console.error('Error loading wallet data:', err);
      setError(err.message || '加载钱包数据失败');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, provider, account]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  return {
    walletData,
    loading,
    error,
    refresh: loadWalletData,
  };
}

