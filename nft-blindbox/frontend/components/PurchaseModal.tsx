'use client';

import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useNFTBlindBox } from '@/hooks/useNFTBlindBox';
import { formatEth } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
  contractAddress?: string; // 可选的合约地址，如果不传则使用默认
}

export default function PurchaseModal({ isOpen, onClose, onSuccess, contractAddress }: PurchaseModalProps) {
  const { purchaseBox, saleInfo, isLoading, error, totalSupply, maxSupply } = useNFTBlindBox(contractAddress);
  const [purchasing, setPurchasing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!saleInfo || !saleInfo.active) {
      alert('销售未开始');
      return;
    }

    try {
      setPurchasing(true);
      const hash = await purchaseBox();
      setTxHash(hash);
      
      // 立即触发成功回调，让外部组件开始刷新
      if (onSuccess) {
        onSuccess(hash);
      }
      
      // 2秒后自动关闭（给用户看到成功提示的时间）
      setTimeout(() => {
        onClose();
        setTxHash(null);
      }, 2000);
    } catch (err: any) {
      console.error('Purchase failed:', err);
      // 错误时不自动关闭，让用户看到错误信息
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const remaining = maxSupply - totalSupply;
  const progress = maxSupply > BigInt(0) ? (Number(totalSupply) / Number(maxSupply)) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 模态框 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              购买盲盒
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              开启你的神秘收藏之旅
            </p>
          </div>

          {/* 销售信息 */}
          {saleInfo && (
            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">价格</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatEth(saleInfo.price)} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">剩余</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {remaining.toString()} / {maxSupply.toString()}
                  </span>
                </div>
              </div>

              {/* 进度条 */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>已售出</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 交易哈希 */}
          {txHash && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                交易已提交！哈希: {txHash.slice(0, 10)}...
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={purchasing || isLoading || !saleInfo?.active || remaining === BigInt(0)}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              {purchasing || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <span>确认购买</span>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

