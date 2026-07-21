'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Lock } from 'lucide-react';
import { APP_CONFIG, RARITY_CONFIG } from '@/lib/config';
import { getRarityName, getRarityGradient } from '@/lib/format';
import { Rarity } from '@/lib/contracts';

interface BlindBoxCardProps {
  tokenId: number;
  revealed: boolean;
  rarity?: Rarity;
  tokenURI?: string;
  onClick?: () => void;
  className?: string;
}

interface NFTMetadata {
  image?: string;
}

function resolveIpfsUri(uri: string): string {
  if (!uri.startsWith('ipfs://')) {
    return uri;
  }

  return `${APP_CONFIG.ipfsGateway.replace(/\/$/, '')}/${uri.slice('ipfs://'.length)}`;
}

function resolveMetadataUri(uri: string): string {
  if (!uri.startsWith('ipfs://')) {
    return uri;
  }

  return `/api/ipfs?path=${encodeURIComponent(uri.slice('ipfs://'.length))}`;
}

export default function BlindBoxCard({
  tokenId,
  revealed,
  rarity = Rarity.Common,
  tokenURI,
  onClick,
  className = '',
}: BlindBoxCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const rarityName = getRarityName(rarity);
  const rarityGradient = getRarityGradient(rarity);
  const rarityConfig = rarity === Rarity.Common ? RARITY_CONFIG.common :
                       rarity === Rarity.Rare ? RARITY_CONFIG.rare :
                       rarity === Rarity.Epic ? RARITY_CONFIG.epic :
                       RARITY_CONFIG.legendary;

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      if (!revealed || !tokenURI) {
        setImageUrl(null);
        return;
      }

      try {
        const response = await fetch(resolveMetadataUri(tokenURI));
        if (!response.ok) {
          throw new Error(`Metadata request failed with ${response.status}`);
        }

        const metadata = (await response.json()) as NFTMetadata;
        if (!metadata.image) {
          throw new Error('Metadata does not contain an image URI');
        }

        if (!cancelled) {
          setImageUrl(resolveIpfsUri(metadata.image));
        }
      } catch (error) {
        console.error(`Failed to load metadata for NFT #${tokenId}:`, error);
        if (!cancelled) {
          setImageUrl(null);
        }
      }
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [tokenId, tokenURI, revealed]);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className={`
        relative overflow-hidden rounded-2xl border-2 transition-all
        ${revealed 
          ? `bg-gradient-to-br ${rarityGradient} shadow-2xl ${rarity === Rarity.Common ? 'border-gray-500' : rarity === Rarity.Rare ? 'border-blue-500' : rarity === Rarity.Epic ? 'border-purple-500' : 'border-yellow-500'}` 
          : 'border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 shadow-lg'
        }
      `}>
        {/* 光效动画 */}
        {revealed && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
        
        {/* 内容 */}
        <div className="relative p-6">
          {revealed ? (
            <>
              {/* 已揭示 - 显示NFT图片和稀有度 */}
              <div className="aspect-square rounded-xl bg-white/10 backdrop-blur-sm mb-4 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={`NFT #${tokenId}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Sparkles className="w-16 h-16 text-white/50" />
                )}
              </div>
              
              {/* 稀有度标签 */}
              <div className={`
                absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold
                bg-white/20 backdrop-blur-sm text-white border border-white/30
              `}>
                {rarityName}
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1">
                  #{tokenId}
                </h3>
                <p className="text-sm text-white/80">
                  {rarityConfig.name}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* 未揭示 - 显示动态盲盒样式 */}
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 backdrop-blur-sm mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.4),transparent_70%)] animate-pulse" />
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(168,85,247,0.1),rgba(139,92,246,0.1),rgba(168,85,247,0.1))] animate-spin-slow" />
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10"
                >
                  <Gift className="w-24 h-24 text-primary-600 dark:text-primary-400 drop-shadow-2xl" />
                </motion.div>

                {/* 锁图标 */}
                <motion.div
                  className="absolute bottom-3 right-3"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Lock className="w-6 h-6 text-primary-500/70" />
                </motion.div>

                {/* 闪烁边框 */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-primary-400/50"
                  animate={{
                    borderColor: [
                      'rgba(168, 85, 247, 0.3)',
                      'rgba(168, 85, 247, 0.8)',
                      'rgba(168, 85, 247, 0.3)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              
              <div className="text-center">
                <motion.h3
                  className="text-lg font-bold text-primary-700 dark:text-primary-300 mb-1"
                  animate={{
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  盲盒 #{tokenId}
                </motion.h3>
                <motion.p
                  className="text-sm text-primary-600 dark:text-primary-400"
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  等待揭示...
                </motion.p>
              </div>
            </>
          )}
        </div>
        
        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </motion.div>
  );
}

