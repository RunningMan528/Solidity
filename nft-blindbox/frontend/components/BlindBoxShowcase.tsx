'use client';

import { useState } from 'react';
import { useNFTBlindBox } from '@/hooks/useNFTBlindBox';
import { useWeb3 } from './Web3Provider';
import PurchaseModal from './PurchaseModal';
import { Gift, Sparkles, TrendingUp, Users } from 'lucide-react';
import { formatEth, formatNumber } from '@/lib/format';
import { motion } from 'framer-motion';

export default function BlindBoxShowcase() {
  const { account } = useWeb3();
  const { saleInfo, totalSupply, maxSupply, isLoading } = useNFTBlindBox();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const remaining = maxSupply - totalSupply;
  const progress = maxSupply > BigInt(0) ? (Number(totalSupply) / Number(maxSupply)) * 100 : 0;
  const soldOut = remaining === BigInt(0);

  return (
    <div className="relative">
      {/* 主展示区 */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* 左侧：盲盒展示 */}
            <div className="text-center md:text-left">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6"
              >
                <div className="w-32 h-32 mx-auto md:mx-0 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl">
                  <Gift className="w-16 h-16 text-white animate-float" />
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                神秘NFT盲盒
              </h1>
              <p className="text-xl text-white/90 mb-6">
                开启你的收藏之旅，发现稀有NFT
              </p>

              {saleInfo && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-lg">
                      价格: <span className="font-bold">{formatEth(saleInfo.price)} ETH</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-lg">
                      已售: <span className="font-bold">{formatNumber(totalSupply)}</span> / {formatNumber(maxSupply)}
                    </span>
                  </div>
                </div>
              )}

              {account && saleInfo?.active && !soldOut && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-8 py-4 rounded-xl bg-white text-primary-600 font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
                >
                  立即购买
                </motion.button>
              )}

              {!account && (
                <p className="text-white/80 text-sm">
                  请先连接钱包
                </p>
              )}

              {soldOut && (
                <div className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-300/50">
                  <p className="font-semibold">已售罄</p>
                </div>
              )}
            </div>

            {/* 右侧：统计信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">{formatNumber(totalSupply)}</div>
                <div className="text-sm text-white/80">已售出</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">{formatNumber(remaining)}</div>
                <div className="text-sm text-white/80">剩余</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/80">销售进度</span>
                  <span className="text-sm font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 购买模态框 */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={(txHash) => {
          console.log('Purchase successful:', txHash);
        }}
      />
    </div>
  );
}

