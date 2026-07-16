'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, Clock, ArrowRight, Users } from 'lucide-react';
import { ethers } from 'ethers';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  address: string;
  owner: string;
  name: string;
  goal: bigint;
  totalRaised: bigint;
  deadline: bigint;
  state: number;
  contributorCount: number;
}

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = campaign.goal > BigInt(0)
    ? Math.min((Number(campaign.totalRaised) / Number(campaign.goal)) * 100, 100)
    : 0;

  const isExpired = new Date(Number(campaign.deadline) * 1000) < new Date();
  const stateLabels = ['准备中', '进行中', '成功', '失败', '已关闭'];
  const stateLabelsEn = ['Preparing', 'Active', 'Success', 'Failed', 'Closed'];
  const stateColors = {
    0: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    2: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    3: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    4: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const StateIcon = campaign.state === 2 ? CheckCircle : campaign.state === 3 ? XCircle : Clock;

  return (
    <Link href={`/campaign/${campaign.address}`}>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer group border border-gray-200/50 dark:border-slate-700/50 hover:border-primary-300 dark:hover:border-primary-700 relative overflow-hidden transform hover:-translate-y-1">
        {/* 装饰性渐变背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/5 to-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              campaign.state === 2 ? 'bg-green-100 dark:bg-green-900/30' :
              campaign.state === 3 ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <StateIcon className={`w-5 h-5 ${
                campaign.state === 2 ? 'text-green-600 dark:text-green-400' :
                campaign.state === 3 ? 'text-red-600 dark:text-red-400' :
                'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${stateColors[campaign.state as keyof typeof stateColors]} border border-current/20`}>
              {stateLabels[campaign.state]}
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-all group-hover:translate-x-1" />
        </div>

        {/* Campaign Name */}
        <div className="mb-5 relative z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {campaign.name}
          </h3>
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {campaign.address.slice(0, 8)}...{campaign.address.slice(-6)}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-5 relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {ethers.formatEther(campaign.totalRaised)} ETH
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
            目标: {ethers.formatEther(campaign.goal)} ETH
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center pt-5 border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">贡献者</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {campaign.contributorCount}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg inline-block mb-1">
              <span className="text-lg">⏰</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">最后期限</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatDistanceToNow(new Date(Number(campaign.deadline) * 1000), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

