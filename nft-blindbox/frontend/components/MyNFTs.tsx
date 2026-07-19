'use client';

import { useEffect } from 'react';
import { useNFTBlindBox } from '@/hooks/useNFTBlindBox';
import BlindBoxCard from './BlindBoxCard';
import { Loader2, Package } from 'lucide-react';
import { Rarity } from '@/lib/contracts';

export default function MyNFTs() {
  const { userNFTs, isLoading, refresh } = useNFTBlindBox();

  // 监听购买成功事件，自动刷新 NFT 列表
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const handleNFTPurchased = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('MyNFTs: NFT purchased event received', customEvent.detail);
      
      // 清除之前的定时器
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // 延迟刷新，确保链上数据已同步（等待交易确认）
      refreshTimeout = setTimeout(() => {
        if (refresh) {
          console.log('MyNFTs: Refreshing NFT list...');
          refresh();
        }
      }, 3000); // 3秒后刷新，确保链上数据已同步
    };

    window.addEventListener('nft-purchased', handleNFTPurchased);
    return () => {
      window.removeEventListener('nft-purchased', handleNFTPurchased);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refresh]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (userNFTs.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          还没有NFT
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          购买你的第一个盲盒开始收藏之旅
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          我的收藏
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          共 {userNFTs.length} 个NFT
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {userNFTs.map((nft) => (
          <BlindBoxCard
            key={nft.tokenId}
            tokenId={nft.tokenId}
            revealed={nft.status.revealed}
            rarity={nft.status.rarity}
            tokenURI={nft.tokenURI}
          />
        ))}
      </div>
    </div>
  );
}

