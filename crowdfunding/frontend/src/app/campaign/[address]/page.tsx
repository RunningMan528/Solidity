'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWeb3 } from '@/hooks/useWeb3';
import { useCampaign } from '@/hooks/useCampaign';
import { useAlert } from '@/components/AlertProvider';
import Header from '@/components/Header';
import ContributorsModal from '@/components/ContributorsModal';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Users, ChevronRight, Rocket, Coins, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ethers } from 'ethers';
import { CrowdfundingCampaignABI } from '@/lib/abis';

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const address = params.address as string;
    const { account, signer, provider } = useWeb3();
    const { campaign, loading, refresh, setUserInteracting } = useCampaign(address);
    const { showSuccess, showError, showWarning, showInfo } = useAlert();
    const [contributeAmount, setContributeAmount] = useState('');
    const [isContributing, setIsContributing] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showContributors, setShowContributors] = useState(false);
    const [contributors, setContributors] = useState<{ address: string; amount: bigint }[]>([]);
    const [loadingContributors, setLoadingContributors] = useState(false);

    const handleContribute = async () => {
        // 检查账户连接
        if (!account) {
            showWarning('请先连接钱包！', '提示');
            return;
        }

        // 检查贡献金额
        if (!contributeAmount) {
            showWarning('请输入贡献金额', '提示');
            return;
        }

        const amount = parseFloat(contributeAmount);
        if (amount <= 0 || isNaN(amount)) {
            showWarning('贡献金额必须大于 0', '提示');
            return;
        }

        // 如果 signer 不存在，尝试重新获取
        let currentSigner = signer;
        if (!currentSigner && account && provider) {
            try {
                currentSigner = await provider.getSigner();
                console.log('✅ Signer retrieved successfully');
            } catch (error) {
                console.error('Failed to get signer:', error);
                showError('无法获取签名器，请重新连接钱包', '错误');
                return;
            }
        }

        if (!currentSigner) {
            showError('无法获取签名器，请重新连接钱包', '错误');
            return;
        }

        try {
            setIsContributing(true);
            setUserInteracting(true); // 开始操作时暂停自动刷新
            console.log('Contributing:', { amount, address });

            const { CrowdfundingCampaignABI } = await import('@/lib/abis');
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                currentSigner
            );

            const value = ethers.parseEther(contributeAmount);
            console.log('Sending transaction with value:', value.toString());

            const tx = await campaignContract.contribute({
                value: value,
            });
            console.log('Transaction sent:', tx.hash);

            console.log('Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            showSuccess(`贡献成功！交易哈希: ${tx.hash}`, '成功', 5000);
            setContributeAmount('');
            // 贡献成功后刷新数据并恢复自动刷新
            await refresh();
            setUserInteracting(false);
        } catch (error: any) {
            console.error('Contribution error:', error);
            let errorMessage = '贡献失败';

            if (error.code === 'ACTION_REJECTED') {
                errorMessage = '用户取消了交易';
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = '余额不足，请确保账户有足够的 ETH';
            } else if (error.reason) {
                errorMessage = error.reason;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showError(errorMessage, '贡献失败');
            // 即使失败也恢复自动刷新
            setUserInteracting(false);
        } finally {
            setIsContributing(false);
        }
    };

    const handleWithdraw = async () => {
        if (!signer) return;

        try {
            setIsWithdrawing(true);
            setUserInteracting(true);
            const { CrowdfundingCampaignABI } = await import('@/lib/abis');
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                signer
            );

            const tx = await campaignContract.withdraw();
            await tx.wait();

            await refresh();
            setUserInteracting(false);
            showSuccess('资金提取成功！', '成功');
        } catch (error: any) {
            showError(error.message || '提取失败', '错误');
            setUserInteracting(false);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleFinalize = async () => {
        if (!signer) return;

        try {
            setIsFinalizing(true);
            setUserInteracting(true);
            const { CrowdfundingCampaignABI } = await import('@/lib/abis');
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                signer
            );

            const tx = await campaignContract.finalize();
            await tx.wait();

            await refresh();
            setUserInteracting(false);
            showSuccess('活动结算成功！', '成功');
        } catch (error: any) {
            showError(error.message || '结算失败', '错误');
            setUserInteracting(false);
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleRefund = async () => {
        if (!signer) return;

        try {
            setIsRefunding(true);
            setUserInteracting(true);
            const { CrowdfundingCampaignABI } = await import('@/lib/abis');
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                signer
            );

            const tx = await campaignContract.refund();
            await tx.wait();

            await refresh();
            setUserInteracting(false);
            showSuccess('退款成功！', '成功');
        } catch (error: any) {
            showError(error.message || '退款失败', '错误');
            setUserInteracting(false);
        } finally {
            setIsRefunding(false);
        }
    };

    const handleStart = async () => {
        if (!signer) return;

        try {
            setIsStarting(true);
            setUserInteracting(true);
            const { CrowdfundingCampaignABI } = await import('@/lib/abis');
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                signer
            );

            const tx = await campaignContract.start();
            await tx.wait();

            await refresh();
            setUserInteracting(false);
            showSuccess('活动启动成功！', '成功');
        } catch (error: any) {
            showError(error.message || '启动失败', '错误');
            setUserInteracting(false);
        } finally {
            setIsStarting(false);
        }
    };

    const fetchContributors = async () => {
        if (!provider || !address) return;

        try {
            setLoadingContributors(true);
            const campaignContract = new ethers.Contract(
                address,
                CrowdfundingCampaignABI,
                provider
            );

            // 获取所有贡献者地址
            const contributorAddresses = await campaignContract.getContributors();

            // 获取每个贡献者的贡献金额
            const contributorPromises = contributorAddresses.map(async (addr: string) => {
                const amount = await campaignContract.contributions(addr);
                return {
                    address: addr,
                    amount: amount,
                };
            });

            const contributorData = await Promise.all(contributorPromises);

            // 按贡献金额降序排序
            contributorData.sort((a, b) => {
                if (a.amount > b.amount) return -1;
                if (a.amount < b.amount) return 1;
                return 0;
            });

            setContributors(contributorData);
        } catch (error) {
            console.error('Error fetching contributors:', error);
            showError('获取贡献者列表失败', '错误');
        } finally {
            setLoadingContributors(false);
        }
    };

    const handleShowContributors = () => {
        setShowContributors(true);
        fetchContributors();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Header />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        Campaign not found
                    </p>
                </div>
            </div>
        );
    }

    const progress = campaign.goal > 0
        ? Math.min((Number(campaign.totalRaised) / Number(campaign.goal)) * 100, 100)
        : 0;

    const isExpired = new Date(Number(campaign.deadline) * 1000) < new Date();
    const isOwner = campaign.owner.toLowerCase() === account?.toLowerCase();
    const canStart = campaign.state === 0 && isOwner; // Preparing 状态且是创建者
    const canContribute = campaign.state === 1 && !isExpired && account; // Active 状态
    const canFinalize = campaign.state === 1 && isExpired && isOwner; // Active 且已过期，创建者可结算
    const canWithdraw = campaign.state === 2 && isOwner; // Success 状态且是创建者
    const canRefund = campaign.state === 3 && account && Number(campaign.userContribution) > 0; // Failed 状态

    const stateLabels = ['准备中', '进行中', '成功', '失败', '已关闭'];
    const stateIcons = [Clock, Clock, CheckCircle, XCircle, CheckCircle];
    const StateIcon = stateIcons[campaign.state] || Clock;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to campaigns
                </button>

                {/* Campaign Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <StateIcon className={`w-6 h-6 ${campaign.state === 2 ? 'text-green-500' :
                                        campaign.state === 3 ? 'text-red-500' :
                                            'text-blue-500'
                                    }`} />
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {stateLabels[campaign.state]}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {campaign.name}
                            </h1>
                            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                {address.slice(0, 8)}...{address.slice(-6)}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Progress
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {progress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Raised</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {ethers.formatEther(campaign.totalRaised)} ETH
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Goal</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {ethers.formatEther(campaign.goal)} ETH
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Contributors</p>
                            <button
                                onClick={handleShowContributors}
                                className="group flex items-center gap-2 text-lg font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all cursor-pointer"
                                title="点击查看贡献者列表"
                            >
                                <Users className="w-5 h-5" />
                                <span className="underline decoration-2 underline-offset-2 group-hover:decoration-primary-400">
                                    {campaign.contributorCount}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Deadline</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatDistanceToNow(new Date(Number(campaign.deadline) * 1000), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {account && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {isOwner ? '创建者操作' : '参与筹款'}
                        </h2>

                        {canStart && (
                            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    活动处于准备中状态，需要先启动活动才能接受筹款
                                </p>
                                <button
                                    onClick={handleStart}
                                    disabled={isStarting}
                                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isStarting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Rocket className="w-5 h-5" />
                                            启动活动
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {canContribute && (
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Coins className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    参与筹款
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    输入您想要贡献的 ETH 金额，支持这个项目！
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={contributeAmount}
                                        onChange={(e) => {
                                            setContributeAmount(e.target.value);
                                            // 用户输入时暂停自动刷新
                                            setUserInteracting(true);
                                        }}
                                        onFocus={() => {
                                            // 输入框获得焦点时暂停自动刷新
                                            setUserInteracting(true);
                                        }}
                                        onBlur={() => {
                                            // 输入框失去焦点后恢复自动刷新
                                            setUserInteracting(false);
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-lg"
                                        placeholder="0.1"
                                    />
                                    <button
                                        onClick={handleContribute}
                                        disabled={!contributeAmount || parseFloat(contributeAmount) <= 0 || isContributing}
                                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isContributing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                处理中...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                确认贡献
                                            </>
                                        )}
                                    </button>
                                </div>
                                {Number(campaign.userContribution) > 0 && (
                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">
                                        您已贡献: {ethers.formatEther(campaign.userContribution)} ETH
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 已截止但尚未结算的提示（非创建者视角） */}
                        {campaign.state === 1 && isExpired && !isOwner && (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    活动已截止，正在等待创建者结算，稍后即可看到最终结果（成功或失败）
                                </p>
                            </div>
                        )}

                        {canFinalize && (
                            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-sm text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    活动已截止，请先结算活动以确定成功或失败状态
                                </p>
                                <button
                                    onClick={handleFinalize}
                                    disabled={isFinalizing}
                                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isFinalizing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            结算活动
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {campaign.state === 0 && !isOwner && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    活动尚未启动，请等待创建者启动活动后才能参与筹款
                                </p>
                            </div>
                        )}

                        {canWithdraw && (
                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    活动已成功达到目标！您可以提取资金了
                                </p>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isWithdrawing}
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isWithdrawing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Coins className="w-5 h-5" />
                                            提取资金
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {canRefund && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                                    <X className="w-4 h-4" />
                                    活动未达到目标，您可以申请退款
                                </p>
                                <button
                                    onClick={handleRefund}
                                    disabled={isRefunding}
                                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isRefunding ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Coins className="w-5 h-5" />
                                            退款 {ethers.formatEther(campaign.userContribution)} ETH
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {Number(campaign.userContribution) > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    您的贡献: <span className="font-semibold">
                                        {ethers.formatEther(campaign.userContribution)} ETH
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Campaign Info */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Campaign Information
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Owner</span>
                            <span className="text-gray-900 dark:text-white font-mono text-sm">
                                {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Campaign Address</span>
                            <span className="text-gray-900 dark:text-white font-mono text-sm">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Created</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDistanceToNow(new Date(Number(campaign.deadline) * 1000 - 7 * 24 * 60 * 60 * 1000), { addSuffix: true })}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Contributors Modal */}
            <ContributorsModal
                isOpen={showContributors}
                onClose={() => setShowContributors(false)}
                contributors={contributors}
                loading={loadingContributors}
            />
        </div>
    );
}

