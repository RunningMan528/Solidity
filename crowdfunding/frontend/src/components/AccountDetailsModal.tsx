'use client';

import { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Wallet, Loader2, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { chainConfig } from "@/lib/chain-config";

interface AccountDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
    provider: ethers.BrowserProvider | null;
}

export default function AccountDetailsModal({
    isOpen,
    onClose,
    address,
    provider,
}: AccountDetailsModalProps) {
    const [balance, setBalance] = useState<string>('0');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    useEffect(() => {
        if (isOpen && provider && address) {
            fetchAccountDetails();
            // 如果配置了 API URL，自动加载交易历史
            const apiUrl = process.env.NEXT_PUBLIC_ETHERSCAN_API_URL;
            if (apiUrl) {
                console.log('✅ Etherscan API URL configured:', apiUrl.replace(/apikey=[^&]*/, 'apikey=***'));
                fetchTransactions();
            } else {
                console.warn('⚠️ NEXT_PUBLIC_ETHERSCAN_API_URL not configured');
            }
        }
    }, [isOpen, provider, address]);

    const fetchAccountDetails = async () => {
        if (!provider || !address) return;

        try {
            setLoading(true);
            // 获取账户余额
            const balanceWei = await provider.getBalance(address);
            setBalance(ethers.formatEther(balanceWei));
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        if (!provider || !address) return;

        try {
            setLoadingTransactions(true);
            // 使用完整的 Etherscan API URL
            const apiUrl = process.env.NEXT_PUBLIC_ETHERSCAN_API_URL || '';

            if (!apiUrl) {
                console.warn('Etherscan API URL not configured');
                setTransactions([]);
                return;
            }

            // 构建完整的 API 请求 URL
            // 检查是否是 V2 API（包含 /v2/）
            const isV2Api = apiUrl.includes('/v2/');

            let fullApiUrl: string;
            if (isV2Api) {
                // V2 API 格式：使用不同的端点结构
                // V2 API 可能需要不同的参数格式，先尝试兼容 V1 格式
                const separator = apiUrl.includes('?') ? '&' : '?';
                fullApiUrl = `${apiUrl}${separator}module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
            } else {
                // V1 API 格式
                const separator = apiUrl.includes('?') ? '&' : '?';
                fullApiUrl = `${apiUrl}${separator}module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
            }

            console.log('Fetching transactions from Etherscan...');
            console.log('API Version:', isV2Api ? 'V2' : 'V1');
            console.log('API URL:', fullApiUrl.replace(/apikey=[^&]*/, 'apikey=***')); // 隐藏 API Key

            const response = await fetch(fullApiUrl);
            const data = await response.json();

            console.log('Etherscan API response:', data);

            // 检查 API 错误响应
            if (data.status === '0' && data.message === 'NOTOK' && data.result && typeof data.result === 'string') {
                if (data.result.includes('deprecated') || data.result.includes('V1 endpoint')) {
                    console.error('Etherscan V1 API is deprecated. Error:', data.result);
                    setTransactions([]);
                    return;
                } else if (data.result.includes('Invalid API Key') || data.result.includes('API Key')) {
                    console.error('Invalid API Key or API Key error:', data.result);
                    setTransactions([]);
                    return;
                } else if (data.result.includes('rate limit') || data.result.includes('Rate limit')) {
                    console.error('API rate limit exceeded:', data.result);
                    setTransactions([]);
                    return;
                } else {
                    // 其他错误
                    console.error('Etherscan API error:', data.result);
                    setTransactions([]);
                    return;
                }
            }

            // V2 API 可能返回不同的格式，检查是否有 data 字段
            if (data.data && Array.isArray(data.data)) {
                const validTransactions = data.data
                    .filter((tx: any) => tx.hash && tx.hash !== '0x')
                    .slice(0, 10);
                setTransactions(validTransactions);
                console.log(`✅ Loaded ${validTransactions.length} transactions (V2 format)`);
                setLoadingTransactions(false);
                return;
            }

            // 检查返回状态和数据
            if (data.status === '1' && data.result) {
                if (Array.isArray(data.result)) {
                    // 过滤掉无效的交易
                    const validTransactions = data.result
                        .filter((tx: any) => tx.hash && tx.hash !== '0x')
                        .slice(0, 10);
                    setTransactions(validTransactions);
                    console.log(`✅ Loaded ${validTransactions.length} transactions`);
                } else if (typeof data.result === 'string') {
                    // 如果 result 是字符串，可能是错误信息
                    console.warn('Etherscan API returned string result:', data.result);
                    setTransactions([]);
                } else {
                    setTransactions([]);
                }
            } else {
                // 未知状态或错误
                console.warn('Unexpected API response:', data);
                setTransactions([]);
            }
        } catch (error: any) {
            console.error('Error fetching transactions:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });

            // 如果是 404 错误，提示用户 V2 API 可能不可用
            if (error.message && error.message.includes('404')) {
                console.warn('⚠️ API endpoint returned 404. V2 API may not be available for Sepolia. Try using V1 API format.');
            }

            setTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInExplorer = (txHash?: string) => {
        const path = txHash ? `/tx/${txHash}` : `/address/${address}`;
        window.open(`${chainConfig.blockExplorerUrl}${path}`, "_blank");
    };

    const formatDate = (timestamp: string) => {
        return new Date(Number(timestamp) * 1000).toLocaleString('zh-CN');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            {/* 弹窗内容 */}
            <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                账户详情
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {chainConfig.chainName} 测试网络
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 地址信息 */}
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                钱包地址
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToClipboard(address)}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                    title="复制地址"
                                >
                                    <Copy className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                                </button>
                                <button
                                    onClick={() => openInExplorer()}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                    title="在区块浏览器中查看"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="font-mono text-base font-semibold text-gray-900 dark:text-white">
                                {address.slice(0, 4)}...{address.slice(-4)}
                            </p>
                            <details className="group">
                                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                    显示完整地址
                                </summary>
                                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                    {address}
                                </p>
                            </details>
                        </div>
                    </div>

                    {/* 余额信息 */}
                    <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                账户余额
                            </p>
                            <button
                                onClick={fetchAccountDetails}
                                className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-slate-700"
                                title="刷新余额"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                                <span className="text-gray-500 dark:text-gray-400">加载中...</span>
                            </div>
                        ) : (
                            <div>
                                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                    {parseFloat(balance).toFixed(4)} ETH
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    约 ${(parseFloat(balance) * 2000).toFixed(2)} USD (估算)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 交易历史 */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                最近交易
                            </h3>
                            {process.env.NEXT_PUBLIC_ETHERSCAN_API_URL && (
                                <button
                                    onClick={fetchTransactions}
                                    disabled={loadingTransactions}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loadingTransactions ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    刷新
                                </button>
                            )}
                        </div>

                        {loadingTransactions ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">
                                    {process.env.NEXT_PUBLIC_ETHERSCAN_API_URL
                                        ? '暂无交易记录或 API 暂时不可用'
                                        : '需要配置 NEXT_PUBLIC_ETHERSCAN_API_URL 才能查看交易历史'}
                                </p>
                                {process.env.NEXT_PUBLIC_ETHERSCAN_API_URL && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
                                        ⚠️ Etherscan V1 API 已弃用，可能无法正常加载交易
                                    </p>
                                )}
                                {process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={fetchTransactions}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            点击重新加载交易历史
                                        </button>
                                        <div className="pt-2">
                                            <button
                                                onClick={() => openInExplorer()}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                在 Etherscan 中查看交易
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => openInExplorer()}
                                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        在 Etherscan 中查看交易
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {transactions.map((tx: any) => (
                                    <div
                                        key={tx.hash}
                                        className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tx.from.toLowerCase() === address.toLowerCase()
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        }`}>
                                                        {tx.from.toLowerCase() === address.toLowerCase() ? '发送' : '接收'}
                                                    </span>
                                                    <button
                                                        onClick={() => openInExplorer(tx.hash)}
                                                        className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                        title="查看交易详情"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate mb-1">
                                                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(tx.timeStamp)}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className={`text-sm font-semibold ${tx.from.toLowerCase() === address.toLowerCase()
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {tx.from.toLowerCase() === address.toLowerCase() ? '-' : '+'}
                                                    {ethers.formatEther(tx.value || '0')} ETH
                                                </p>
                                                {tx.gasUsed && tx.gasPrice && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Gas: {ethers.formatUnits(BigInt(tx.gasUsed) * BigInt(tx.gasPrice), 'ether').slice(0, 8)} ETH
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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

