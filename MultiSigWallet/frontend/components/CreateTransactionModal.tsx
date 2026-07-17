'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Provider';
import { useAlert } from './AlertProvider';
import { MultiSigWalletABI } from '@/lib/abis';
import { X, Send } from 'lucide-react';

interface CreateTransactionModalProps {
  walletAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTransactionModal({
  walletAddress,
  onClose,
  onSuccess,
}: CreateTransactionModalProps) {
  const { signer } = useWeb3();
  const { showSuccess, showError } = useAlert();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [data, setData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    if (!to.trim() || !ethers.isAddress(to.trim())) {
      showError('请输入有效的接收地址');
      return;
    }

    if (!value || parseFloat(value) < 0) {
      showError('请输入有效的金额');
      return;
    }

    try {
      setIsSubmitting(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      
      const valueWei = ethers.parseEther(value);
      const dataBytes = data.trim() === '' ? '0x' : data.trim();
      
      // 验证 data 格式
      if (dataBytes !== '0x' && !dataBytes.startsWith('0x')) {
        showError('调用数据必须以 0x 开头');
        return;
      }

      const tx = await contract.submitTransaction(
        ethers.getAddress(to.trim()),
        valueWei,
        dataBytes
      );
      
      showSuccess('交易提案创建中...');
      await tx.wait();
      showSuccess('交易提案已创建');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card-glass max-w-lg w-full p-8 animate-scale-in border-2 border-primary-200/50 dark:border-primary-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient mb-1">创建交易提案</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">提交新的多签交易请求</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              接收地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              金额 (ETH) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.0"
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              调用数据 (可选)
            </label>
            <textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="0x..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              留空表示普通转账，或输入十六进制调用数据
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                '提交中...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  创建提案
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

