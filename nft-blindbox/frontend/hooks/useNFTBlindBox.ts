'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/components/Web3Provider';
import { getNFTBlindBoxContract, getSaleManagerContract, Rarity, SalePhase } from '@/lib/contracts';
import { getContractAddress, getNetworkNameByChainId } from '@/lib/config';

export interface SaleInfo {
  active: boolean;
  phase: SalePhase;
  price: bigint;
  maxWallet: bigint;
}

export interface BlindBoxStatus {
  purchased: boolean;
  revealed: boolean;
  rarity: Rarity;
}

export interface NFTInfo {
  tokenId: number;
  owner: string;
  tokenURI: string;
  status: BlindBoxStatus;
}

export function useNFTBlindBox(contractAddress?: string) {
  const { provider, signer, account, chainId } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [saleManager, setSaleManager] = useState<ethers.Contract | null>(null);
  const [saleInfo, setSaleInfo] = useState<SaleInfo | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));
  const [maxSupply, setMaxSupply] = useState<bigint>(BigInt(0));
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取合约地址
  const getAddress = useCallback(() => {
    if (contractAddress) return contractAddress;
    if (!chainId) return null;
    const networkName = getNetworkNameByChainId(chainId);
    if (!networkName) return null;
    return getContractAddress(networkName);
  }, [contractAddress, chainId]);

  // 初始化合约
  useEffect(() => {
    const address = getAddress();
    if (!address || !provider) {
      setContract(null);
      setSaleManager(null);
      return;
    }

    try {
      const nftContract = getNFTBlindBoxContract(address, provider);
      setContract(nftContract);

      // 获取SaleManager地址
      nftContract.saleManager().then((saleManagerAddr: string) => {
        if (saleManagerAddr && provider) {
          const saleManagerContract = getSaleManagerContract(saleManagerAddr, provider);
          setSaleManager(saleManagerContract);
        }
      }).catch((err: any) => {
        console.error('Failed to get SaleManager:', err);
      });
    } catch (err: any) {
      console.error('Failed to initialize contract:', err);
      setError(err.message);
    }
  }, [provider, getAddress]);

  // 加载销售信息
  const loadSaleInfo = useCallback(async () => {
    if (!contract) return;

    try {
      const [active, phase, price, maxWallet] = await contract.getSaleInfo();
      setSaleInfo({
        active,
        phase: Number(phase) as SalePhase,
        price,
        maxWallet,
      });
    } catch (err: any) {
      console.error('Failed to load sale info:', err);
      setError(err.message);
    }
  }, [contract]);

  // 加载供应量信息
  const loadSupplyInfo = useCallback(async () => {
    if (!contract) return;

    try {
      const [total, max] = await Promise.all([
        contract.totalSupply(),
        contract.maxSupply(),
      ]);
      setTotalSupply(total);
      setMaxSupply(max);
    } catch (err: any) {
      console.error('Failed to load supply info:', err);
      setError(err.message);
    }
  }, [contract]);

  // 加载用户余额
  const loadUserBalance = useCallback(async () => {
    if (!contract || !account) {
      setUserBalance(BigInt(0));
      return;
    }

    try {
      const balance = await contract.balanceOf(account);
      setUserBalance(balance);
    } catch (err: any) {
      console.error('Failed to load user balance:', err);
      setError(err.message);
    }
  }, [contract, account]);

  // 加载用户NFT列表
  const loadUserNFTs = useCallback(async () => {
    if (!contract || !account) {
      setUserNFTs([]);
      return;
    }

    try {
      setIsLoading(true);
      const balance = await contract.balanceOf(account);
      const nftCount = Number(balance);
      
      if (nftCount === 0) {
        setUserNFTs([]);
        return;
      }

      // 获取所有tokenId（需要遍历totalSupply）
      const total = await contract.totalSupply();
      const totalNum = Number(total);
      const nfts: NFTInfo[] = [];

      for (let i = 0; i < totalNum; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const [purchased, revealed, rarity] = await contract.getBlindBoxStatus(i);
            const tokenURI = await contract.tokenURI(i);
            
            nfts.push({
              tokenId: i,
              owner,
              tokenURI,
              status: {
                purchased,
                revealed,
                rarity: Number(rarity) as Rarity,
              },
            });
          }
        } catch (err) {
          // Token可能不存在，跳过
          continue;
        }
      }

      setUserNFTs(nfts);
    } catch (err: any) {
      console.error('Failed to load user NFTs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [contract, account]);

  // 购买盲盒
  const purchaseBox = useCallback(async () => {
    if (!contract || !signer || !saleInfo) {
      throw new Error('合约未初始化或未连接钱包');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contractWithSigner = contract.connect(signer) as any;
      const tx = await contractWithSigner.purchaseBox({ value: saleInfo.price });
      
      const receipt = await tx.wait();
      console.log('Purchase transaction confirmed:', receipt.blockNumber);
      
      // 立即刷新一次数据
      await Promise.all([
        loadSaleInfo(),
        loadSupplyInfo(),
        loadUserBalance(),
        loadUserNFTs(),
      ]);
      
      // 等待几个区块确认后再次刷新（确保数据完全同步）
      setTimeout(async () => {
        console.log('Refreshing data after confirmation delay...');
        await Promise.all([
          loadSaleInfo(),
          loadSupplyInfo(),
          loadUserBalance(),
          loadUserNFTs(),
        ]);
      }, 3000);
      
      return tx.hash;
    } catch (err: any) {
      console.error('Purchase error details:', err);
      
      // 尝试解析更详细的错误信息
      let errorMsg = '购买失败';
      
      if (err.reason) {
        errorMsg = err.reason;
      } else if (err.message) {
        errorMsg = err.message;
        // 如果是 gas 估算失败，尝试提供更友好的错误信息
        if (err.message.includes('estimateGas') || err.message.includes('CALL_EXCEPTION')) {
          errorMsg = '交易预估失败，可能的原因：\n' +
            '1. 销售未开启或已售罄\n' +
            '2. VRF Handler 未正确配置\n' +
            '3. 余额不足或价格不匹配\n' +
            '4. 已达到每个钱包最大购买数';
        }
      } else if (err.data) {
        // 尝试解码 revert reason
        try {
          const reason = ethers.toUtf8String('0x' + err.data.slice(138));
          errorMsg = reason || '交易失败';
        } catch {
          errorMsg = '交易失败，请检查合约状态';
        }
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, saleInfo, loadSaleInfo, loadSupplyInfo, loadUserBalance, loadUserNFTs]);

  // 获取盲盒状态
  const getBlindBoxStatus = useCallback(async (tokenId: number): Promise<BlindBoxStatus | null> => {
    if (!contract) return null;

    try {
      const [purchased, revealed, rarity] = await contract.getBlindBoxStatus(tokenId);
      return {
        purchased,
        revealed,
        rarity: Number(rarity) as Rarity,
      };
    } catch (err: any) {
      console.error('Failed to get blind box status:', err);
      return null;
    }
  }, [contract]);

  // 自动加载数据
  useEffect(() => {
    if (contract) {
      loadSaleInfo();
      loadSupplyInfo();
    }
  }, [contract, loadSaleInfo, loadSupplyInfo]);

  useEffect(() => {
    if (contract && account) {
      loadUserBalance();
      loadUserNFTs();
    }
  }, [contract, account, loadUserBalance, loadUserNFTs]);

  return {
    contract,
    saleManager,
    saleInfo,
    totalSupply,
    maxSupply,
    userBalance,
    userNFTs,
    isLoading,
    error,
    purchaseBox,
    getBlindBoxStatus,
    refresh: () => {
      if (contract) {
        loadSaleInfo();
        loadSupplyInfo();
        if (account) {
          loadUserBalance();
          loadUserNFTs();
        }
      }
    },
  };
}

