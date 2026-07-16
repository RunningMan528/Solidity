'use client';

import { useState } from 'react';
import { X, Loader2, FileText, Coins, Clock, Sparkles } from 'lucide-react';
import { useWeb3 } from './Web3Provider';
import { useFactory } from '@/hooks/useFactory';
import { useAlert } from './AlertProvider';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCampaignModal({ onClose, onSuccess }: CreateCampaignModalProps) {
  const { signer } = useWeb3();
  const { createCampaign } = useFactory();
  const { showSuccess, showError, showWarning } = useAlert();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('7');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 详细的验证和错误提示
    if (!signer) {
      showWarning('请先连接钱包！', '提示');
      console.error('Signer is null');
      return;
    }
    
    if (!goal || parseFloat(goal) <= 0) {
      showWarning('请输入有效的目标金额（大于 0）', '提示');
      console.error('Invalid goal:', goal);
      return;
    }
    
    if (!name || name.trim().length === 0) {
      showWarning('请输入活动名称', '提示');
      console.error('Invalid name:', name);
      return;
    }
    
    if (!duration || parseInt(duration) < 1 || parseInt(duration) > 90) {
      showWarning('持续时间必须在 1-90 天之间', '提示');
      console.error('Invalid duration:', duration);
      return;
    }

    try {
      console.log('Creating campaign with:', { name, goal, duration: parseInt(duration) });
      setIsCreating(true);
      await createCampaign(name.trim(), goal, parseInt(duration));
      console.log('Campaign created successfully');
      showSuccess('活动创建成功！', '成功');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      const errorMessage = error?.reason || error?.message || '创建活动失败';
      showError(`创建失败: ${errorMessage}`, '错误');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in border border-gray-200/50 dark:border-slate-700/50 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 装饰性背景渐变 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                创建活动
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                在区块链上发起您的众筹项目
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:rotate-90 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  活动名称
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-all shadow-sm hover:shadow-md"
                placeholder="例如：帮助贫困学生完成学业"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                为您的众筹活动起一个吸引人的名称
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  目标金额 (ETH)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-all shadow-sm hover:shadow-md"
                placeholder="10.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                设置您希望筹集的总金额
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  持续时间 (天)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white transition-all shadow-sm hover:shadow-md"
                placeholder="7"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                活动持续时间，范围：1-90 天
              </p>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-medium shadow-sm hover:shadow-md"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isCreating || !name || !goal || !duration || name.trim().length === 0 || parseFloat(goal) <= 0 || parseInt(duration) < 1 || parseInt(duration) > 90}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:hover:scale-100"
                onClick={(e) => {
                  console.log('Create Campaign button clicked', {
                    isCreating,
                    goal,
                    duration,
                    signer: !!signer,
                    disabled: isCreating || !goal || !duration || parseFloat(goal) <= 0 || parseInt(duration) < 1 || parseInt(duration) > 90
                  });
                }}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    创建活动
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

