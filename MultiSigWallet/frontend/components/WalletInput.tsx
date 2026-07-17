'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAlert } from './AlertProvider';
import { ArrowRight, Wallet } from 'lucide-react';

interface WalletInputProps {
  onWalletAddressSet: (address: string) => void;
  defaultAddress?: string | null;
}

export default function WalletInput({ onWalletAddressSet, defaultAddress }: WalletInputProps) {
  const [address, setAddress] = useState(defaultAddress || '');
  const [isValidating, setIsValidating] = useState(false);
  const { showError, showSuccess } = useAlert();

  // 如果有默认地址（从环境变量），自动验证并连接
  useEffect(() => {
    if (defaultAddress && !address) {
      setAddress(defaultAddress);
      // 自动验证并连接
      const validateAndConnect = async () => {
        if (!ethers.isAddress(defaultAddress)) {
          return;
        }
        try {
          const checksumAddress = ethers.getAddress(defaultAddress);
          onWalletAddressSet(checksumAddress);
        } catch (error) {
          // 忽略错误，让用户手动输入
        }
      };
      validateAndConnect();
    }
  }, [defaultAddress, address, onWalletAddressSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      showError('请输入钱包地址');
      return;
    }

    setIsValidating(true);
    try {
      // 验证地址格式
      if (!ethers.isAddress(address.trim())) {
        showError('无效的以太坊地址');
        return;
      }

      const checksumAddress = ethers.getAddress(address.trim());
      showSuccess('地址验证成功');
      onWalletAddressSet(checksumAddress);
    } catch (error: any) {
      showError(error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-xl mb-6">
          <Wallet className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gradient">
          多签钱包管理
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          安全、专业的多签钱包管理平台
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          输入已部署的多签钱包代理地址（Proxy Address）以开始管理
        </p>
      </div>

      <div className="card-glass p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              钱包地址
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
              />
              <button
                type="submit"
                disabled={isValidating}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  '验证中...'
                ) : (
                  <>
                    <span>连接</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              输入代理地址（Proxy Address），这是部署时返回的代理合约地址
            </p>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Wallet className="w-5 h-5 text-primary-600" />
            <span>提示：确保您已连接到正确的网络（Sepolia测试网）</span>
          </div>
        </div>
      </div>
    </div>
  );
}

