'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { useNFTBlindBox } from '@/hooks/useNFTBlindBox';
import { getBlindBoxList, BlindBoxItem } from '@/lib/blindBoxList';
import BlindBoxCard from './BlindBoxCard';
import PurchaseModal from './PurchaseModal';
import { Loader2, Gift } from 'lucide-react';
import { formatEth, formatNumber } from '@/lib/format';
import { getNetworkNameByChainId } from '@/lib/config';

/**
 * 带自动刷新功能的购买模态框组件
 */
function PurchaseModalWithRefresh({ 
  isOpen, 
  onClose, 
  contractAddress 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  contractAddress: string;
}) {
  const { refresh } = useNFTBlindBox(contractAddress);

  const handleSuccess = async (txHash: string) => {
    console.log('Purchase successful:', txHash);
    
    // 立即触发事件，通知其他组件开始刷新
    window.dispatchEvent(new CustomEvent('nft-purchased', { 
      detail: { txHash, contractAddress } 
    }));
    
    // 等待交易确认和链上数据同步（约2-3秒）
    setTimeout(async () => {
      // 刷新当前合约的数据（包括销售信息和供应量）
      if (refresh) {
        refresh();
      }
      
      // 再次触发事件，确保所有组件都刷新了
      window.dispatchEvent(new CustomEvent('nft-purchased', { 
        detail: { txHash, contractAddress } 
      }));
    }, 2500);
  };

  return (
    <PurchaseModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={handleSuccess}
      contractAddress={contractAddress}
    />
  );
}

/**
 * 可购买的盲盒列表组件
 * 
 * 功能：
 * 1. 展示所有可购买的盲盒系列
 * 2. 显示每个盲盒的价格、供应量等信息
 * 3. 支持点击购买
 */
export default function BlindBoxList() {
  const { account, chainId } = useWeb3();
  const [blindBoxes, setBlindBoxes] = useState<BlindBoxItem[]>([]);
  const [selectedBlindBox, setSelectedBlindBox] = useState<BlindBoxItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // 获取当前网络名称
  const networkName = chainId ? getNetworkNameByChainId(chainId) : null;

  // 初始化盲盒列表
  useEffect(() => {
    if (networkName) {
      const list = getBlindBoxList(networkName);
      console.log('BlindBoxList - Network:', networkName, 'List:', list);
      setBlindBoxes(list);
    } else {
      console.log('BlindBoxList - No network name, chainId:', chainId);
    }
  }, [networkName, chainId]);

  // 为每个盲盒加载实时数据
  const BlindBoxItem = ({ item }: { item: BlindBoxItem }) => {
    const { saleInfo, totalSupply, maxSupply, isLoading, refresh } = useNFTBlindBox(item.contractAddress);
    const [isItemLoading, setIsItemLoading] = useState(true);

    useEffect(() => {
      if (saleInfo && totalSupply !== undefined && maxSupply !== undefined) {
        setIsItemLoading(false);
      }
    }, [saleInfo, totalSupply, maxSupply]);

    // 监听购买成功事件，刷新当前盲盒的数据
    useEffect(() => {
      let refreshTimeouts: NodeJS.Timeout[] = [];
      
      const handleNFTPurchased = (event: Event) => {
        const customEvent = event as CustomEvent;
        // 只刷新匹配的合约地址
        if (customEvent.detail?.contractAddress === item.contractAddress) {
          console.log('BlindBoxItem: Refreshing data for', item.contractAddress);
          
          // 清除之前的定时器
          refreshTimeouts.forEach(clearTimeout);
          refreshTimeouts = [];
          
          // 多次刷新，确保数据同步（链上数据可能需要时间同步）
          const refreshTimes = [2000, 4000, 6000]; // 2秒、4秒、6秒后各刷新一次
          refreshTimes.forEach((delay) => {
            const timeout = setTimeout(() => {
              if (refresh) {
                console.log(`BlindBoxItem: Refreshing at ${delay}ms`);
                refresh();
              }
            }, delay);
            refreshTimeouts.push(timeout);
          });
        }
      };

      window.addEventListener('nft-purchased', handleNFTPurchased);
      return () => {
        window.removeEventListener('nft-purchased', handleNFTPurchased);
        refreshTimeouts.forEach(clearTimeout);
      };
    }, [refresh, item.contractAddress]);

    const remaining = maxSupply && totalSupply !== undefined ? maxSupply - (totalSupply || BigInt(0)) : BigInt(0);
    const progress = maxSupply && maxSupply > BigInt(0) ? (Number(totalSupply || BigInt(0)) / Number(maxSupply)) * 100 : 0;
    // 只有当已售数量等于最大供应量且最大供应量大于0时，才显示已售罄
    const soldOut = maxSupply > BigInt(0) && totalSupply !== undefined && totalSupply >= maxSupply;

    const handlePurchase = () => {
      setSelectedBlindBox(item);
      setShowPurchaseModal(true);
    };

    if (isItemLoading || isLoading) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左侧：盲盒图标和信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{item.nameZh}</h3>
                <p className="text-white/80 text-sm">{item.description}</p>
              </div>
            </div>

            {saleInfo && (
              <div className="space-y-2 mb-4">
                <div className="text-lg">
                  价格: <span className="font-bold">{formatEth(saleInfo.price)} ETH</span>
                </div>
                <div className="text-lg">
                  已售: <span className="font-bold">{formatNumber(totalSupply || BigInt(0))}</span> / {formatNumber(maxSupply || BigInt(0))}
                </div>
              </div>
            )}

            {account && saleInfo?.active && !soldOut && (
              <button
                onClick={handlePurchase}
                className="px-6 py-3 rounded-xl bg-white text-primary-600 font-bold shadow-lg hover:shadow-xl transition-all"
              >
                立即购买
              </button>
            )}

            {!account && saleInfo && (
              <p className="text-white/80 text-sm">
                请先连接钱包
              </p>
            )}

            {account && saleInfo && !saleInfo.active && (
              <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-300/50">
                <p className="font-semibold">未开售</p>
              </div>
            )}

            {soldOut && (
              <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-300/50">
                <p className="font-semibold">已售罄</p>
              </div>
            )}
          </div>

          {/* 右侧：统计信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{formatNumber(totalSupply || BigInt(0))}</div>
              <div className="text-xs text-white/80">已售出</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{formatNumber(remaining)}</div>
              <div className="text-xs text-white/80">剩余</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/80">销售进度</span>
                <span className="text-xs font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (blindBoxes.length === 0) {
    return (
      <div className="text-center py-20">
        <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          暂无可购买的盲盒
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          请检查合约地址配置
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {blindBoxes.map((item) => (
          <BlindBoxItem key={item.id} item={item} />
        ))}
      </div>

      {/* 购买模态框 */}
      {selectedBlindBox && (
        <PurchaseModalWithRefresh
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedBlindBox(null);
          }}
          contractAddress={selectedBlindBox.contractAddress}
        />
      )}
    </>
  );
}

