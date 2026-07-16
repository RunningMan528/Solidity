'use client';

import { X, User, Copy, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { useState } from 'react';

interface Contributor {
  address: string;
  amount: bigint;
}

interface ContributorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributors: Contributor[];
  loading?: boolean;
}

export default function ContributorsModal({
  isOpen,
  onClose,
  contributors,
  loading = false,
}: ContributorsModalProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const openInExplorer = (address: string) => {
    const explorerUrl = `https://sepolia.etherscan.io/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* 弹窗内容 */}
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                贡献者列表
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                共 {contributors.length} 位贡献者
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : contributors.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">暂无贡献者</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributors.map((contributor, index) => (
                <div
                  key={contributor.address}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {contributor.address.slice(0, 6)}...{contributor.address.slice(-4)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(contributor.address)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="复制地址"
                        >
                          <Copy className={`w-4 h-4 ${copiedAddress === contributor.address ? 'text-green-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => openInExplorer(contributor.address)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="在区块浏览器中查看"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        完整地址: {contributor.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 text-right">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {ethers.formatEther(contributor.amount)} ETH
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">贡献金额</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

