'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Provider';
import { useAlert } from './AlertProvider';
import { MultiSigWalletABI } from '@/lib/abis';
import { MultiSigWalletData } from '@/hooks/useMultiSigWallet';
import { Users, Plus, Trash2, Shield, Copy, Check, X, TrendingUp, Code } from 'lucide-react';
import { formatAddress } from '@/lib/format';

interface OwnersManagementProps {
  walletAddress: string;
  walletData: MultiSigWalletData;
  onRefresh: () => void;
}

export default function OwnersManagement({
  walletAddress,
  walletData,
  onRefresh,
}: OwnersManagementProps) {
  const { signer, account } = useWeb3();
  const { showSuccess, showError } = useAlert();
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [showChangeThreshold, setShowChangeThreshold] = useState(false);
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [ownerToRemove, setOwnerToRemove] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    showSuccess('地址已复制');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddOwner = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    if (!newOwnerAddress.trim() || !ethers.isAddress(newOwnerAddress.trim())) {
      showError('请输入有效的地址');
      return;
    }

    try {
      setIsProcessing(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.addOwner(ethers.getAddress(newOwnerAddress.trim()));
      showSuccess('添加所有者中...');
      await tx.wait();
      showSuccess('所有者已添加');
      setNewOwnerAddress('');
      setShowAddOwner(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error adding owner:', error);
      showError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveOwner = async (ownerAddress: string) => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    try {
      setIsProcessing(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.removeOwner(ownerAddress);
      showSuccess('删除所有者中...');
      await tx.wait();
      showSuccess('所有者已删除');
      setOwnerToRemove(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error removing owner:', error);
      showError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeThreshold = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    const threshold = parseInt(newThreshold);
    if (isNaN(threshold) || threshold < 1 || threshold > walletData.owners.length) {
      showError(`阈值必须在 1 到 ${walletData.owners.length} 之间`);
      return;
    }

    try {
      setIsProcessing(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.changeThreshold(threshold);
      showSuccess('修改阈值中...');
      await tx.wait();
      showSuccess('阈值已修改');
      setNewThreshold('');
      setShowChangeThreshold(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error changing threshold:', error);
      showError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIncrementVoteCount = async (ownerAddress: string) => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    try {
      setIsProcessing(true);
      const contract = new ethers.Contract(walletAddress, MultiSigWalletABI, signer);
      const tx = await contract.incrementOwnerVoteCount(ownerAddress);
      showSuccess('增加投票计数中...');
      await tx.wait();
      showSuccess('投票计数已增加');
      onRefresh();
    } catch (error: any) {
      console.error('Error incrementing vote count:', error);
      showError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 获取所有者的投票计数
  const getOwnerVoteCount = (ownerAddress: string): bigint => {
    const voteData = walletData.ownerVoteCounts?.find(
      (item) => item.owner.toLowerCase() === ownerAddress.toLowerCase()
    );
    return voteData?.count || BigInt(0);
  };

  return (
    <div className="space-y-6">
      {/* Threshold Section */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认阈值</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                当前: {walletData.threshold.toString()} / {walletData.owners.length}
              </p>
            </div>
          </div>
          {walletData.isOwner && (
            <button
              onClick={() => setShowChangeThreshold(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              修改阈值
            </button>
          )}
        </div>
      </div>

      {/* Owners List */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">所有者列表</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                共 {walletData.owners.length} 个所有者
              </p>
            </div>
          </div>
          {walletData.isOwner && (
            <button
              onClick={() => setShowAddOwner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              添加所有者
            </button>
          )}
        </div>

        <div className="space-y-3">
          {walletData.owners.map((owner, index) => {
            const voteCount = getOwnerVoteCount(owner);
            const isV2 = walletData.version !== null;
            
            return (
              <div
                key={owner}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-900 dark:text-white">
                        {formatAddress(owner)}
                      </code>
                      {owner.toLowerCase() === account?.toLowerCase() && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs font-medium">
                          您
                        </span>
                      )}
                    </div>
                    {/* V2 功能：显示投票计数 */}
                    {isV2 && (
                      <div className="mt-1 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          投票计数: {voteCount.toString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* V2 功能：增加投票计数按钮 */}
                    {isV2 && walletData.isOwner && (
                      <button
                        onClick={() => handleIncrementVoteCount(owner)}
                        disabled={isProcessing}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="增加投票计数 (V2 功能)"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => copyAddress(owner)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-slate-500 rounded transition-colors"
                    >
                      {copied === owner ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {walletData.isOwner &&
                  owner.toLowerCase() !== account?.toLowerCase() &&
                  walletData.owners.length - 1 >= Number(walletData.threshold) && (
                    <button
                      onClick={() => setOwnerToRemove(owner)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="删除所有者"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
              </div>
            );
          })}
        </div>
        
        {/* V2 功能提示 */}
        {walletData.version !== null && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Code className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  V2 升级功能已启用
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <strong>自动投票计数：</strong>确认交易时会自动增加您的投票计数，撤销确认时会自动减少。
                  <br />
                  <strong>手动增加：</strong>您也可以点击所有者旁边的 ↗ 图标手动增加其投票计数。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Owner Modal */}
      {showAddOwner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddOwner(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">添加所有者</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  新所有者地址
                </label>
                <input
                  type="text"
                  value={newOwnerAddress}
                  onChange={(e) => setNewOwnerAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddOwner(false);
                    setNewOwnerAddress('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddOwner}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '处理中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Threshold Modal */}
      {showChangeThreshold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowChangeThreshold(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">修改阈值</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  新阈值 (1 - {walletData.owners.length})
                </label>
                <input
                  type="number"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  min="1"
                  max={walletData.owners.length}
                  placeholder={walletData.threshold.toString()}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeThreshold(false);
                    setNewThreshold('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleChangeThreshold}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '处理中...' : '修改'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Owner Confirmation */}
      {ownerToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOwnerToRemove(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">确认删除</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              确定要删除以下所有者吗？
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg mb-6">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white break-all">
              {ownerToRemove}
            </code>
              <button
                onClick={() => copyAddress(ownerToRemove)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                title="复制地址"
              >
                {copied === ownerToRemove ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setOwnerToRemove(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleRemoveOwner(ownerToRemove)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

