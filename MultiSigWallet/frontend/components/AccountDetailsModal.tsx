'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { X, Copy, Check, Wallet, ExternalLink, Edit2, Save, Send, Loader2 } from 'lucide-react';
import { useAlert } from './AlertProvider';
import { useWeb3 } from './Web3Provider';
import { formatEth, formatAddress } from '@/lib/format';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  provider: ethers.BrowserProvider | null;
  walletAddress?: string; // 可选的多签钱包地址
}

export default function AccountDetailsModal({
  isOpen,
  onClose,
  address,
  provider,
  walletAddress,
}: AccountDetailsModalProps) {
  const [balance, setBalance] = useState<string>('0');
  const [accountName, setAccountName] = useState<string>('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>(walletAddress || '');
  const [isTransferring, setIsTransferring] = useState(false);
  const { showSuccess, showError } = useAlert();
  const { chainId, signer } = useWeb3();

  useEffect(() => {
    if (isOpen && provider && address) {
      setLoading(true);
      setAccountName(''); // 重置账户名称
      
      // 获取余额
      provider.getBalance(address).then((bal) => {
        setBalance(ethers.formatEther(bal));
      }).catch((error) => {
        console.error('Error fetching balance:', error);
        setBalance('0');
      });

      // 尝试获取账户名称（ENS或MetaMask账户名称）
      const fetchAccountName = async () => {
        try {
          let name = '';
          
          // 首先检查localStorage中是否有保存的名称
          const savedName = localStorage.getItem(`account_name_${address.toLowerCase()}`);
          if (savedName) {
            name = savedName;
            setAccountName(name);
            setLoading(false);
            return;
          }
          
          // 尝试获取ENS名称
          try {
            const ensName = await provider.lookupAddress(address);
            if (ensName) {
              name = ensName;
              setAccountName(name);
              setLoading(false);
              return;
            }
          } catch (ensError) {
            // ENS查询失败，继续尝试其他方法
            console.log('ENS lookup failed:', ensError);
          }

          // 如果没有ENS名称，尝试从MetaMask获取账户信息
          if (window.ethereum && window.ethereum.isMetaMask) {
            try {
              // 尝试使用 MetaMask 的内部 API 获取账户名称
              // 注意：这需要 MetaMask 的特定权限
              try {
                // 尝试获取账户列表和索引
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                const accountIndex = accounts.findIndex(
                  (acc: string) => acc.toLowerCase() === address.toLowerCase()
                );
                
                if (accountIndex >= 0) {
                  // 尝试使用 wallet_requestPermissions 获取更多信息
                  // 但通常账户名称无法直接获取，所以使用索引
                  // MetaMask 的账户名称通常是 "Account 1", "Account 2" 等
                  // 我们可以尝试推断，但最准确的方式是让用户自己设置
                  name = `账户 ${accountIndex + 1}`;
                }
              } catch (error) {
                console.error('Error fetching account info from MetaMask:', error);
              }
            } catch (error) {
              console.error('Error fetching account name from MetaMask:', error);
            }
          }

          // 如果都没有，使用地址的简短形式作为名称
          if (!name) {
            name = `账户 ${address.slice(0, 6)}...${address.slice(-4)}`;
          }
          
          setAccountName(name);
        } catch (error) {
          console.error('Error fetching account name:', error);
          setAccountName(`账户 ${address.slice(0, 6)}...${address.slice(-4)}`);
        } finally {
          setLoading(false);
        }
      };

      fetchAccountName();
    } else if (!isOpen) {
      // 关闭时重置状态
      setAccountName('');
      setBalance('0');
      setLoading(true);
      setShowTransfer(false);
      setTransferAmount('');
    }
  }, [isOpen, address, provider]);

  // 当 walletAddress 改变时，更新转账地址
  useEffect(() => {
    if (walletAddress) {
      setTransferTo(walletAddress);
    }
  }, [walletAddress]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    showSuccess('地址已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const openInExplorer = () => {
    const explorerUrl = chainId === 11155111 
      ? `https://sepolia.etherscan.io/address/${address}`
      : `https://etherscan.io/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  const handleEditName = () => {
    setTempName(accountName);
    setEditingName(true);
  };

  const handleSaveName = () => {
    const trimmedName = tempName.trim();
    if (trimmedName) {
      setAccountName(trimmedName);
      localStorage.setItem(`account_name_${address.toLowerCase()}`, trimmedName);
      showSuccess('账户名称已保存');
    } else {
      showError('账户名称不能为空');
      return;
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setTempName('');
  };

  const handleTransfer = async () => {
    if (!signer) {
      showError('请先连接钱包');
      return;
    }

    if (!transferTo || !ethers.isAddress(transferTo)) {
      showError('请输入有效的接收地址');
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showError('请输入有效的转账金额');
      return;
    }

    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(transferAmount);

    if (amountNum > balanceNum) {
      showError('余额不足');
      return;
    }

    try {
      setIsTransferring(true);
      const amountWei = ethers.parseEther(transferAmount);
      
      // 发送 ETH 交易
      const tx = await signer.sendTransaction({
        to: transferTo,
        value: amountWei,
      });

      showSuccess('交易已提交，等待确认...');
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      showSuccess(`转账成功！交易哈希: ${receipt?.hash.slice(0, 10)}...`);
      
      // 重置表单
      setTransferAmount('');
      setShowTransfer(false);
      
      // 刷新余额
      if (provider) {
        const newBalance = await provider.getBalance(address);
        setBalance(ethers.formatEther(newBalance));
      }

      // 如果转账到多签钱包，触发刷新事件
      if (walletAddress && transferTo.toLowerCase() === walletAddress.toLowerCase()) {
        // 触发自定义事件，通知 WalletDashboard 刷新
        window.dispatchEvent(new CustomEvent('walletBalanceUpdated', {
          detail: { walletAddress }
        }));
      }
    } catch (error: any) {
      console.error('Error transferring:', error);
      if (error.code === 'ACTION_REJECTED') {
        showError('用户取消了交易');
      } else {
        showError(error.message || '转账失败');
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const handleMaxAmount = () => {
    // 保留一些 ETH 作为 gas 费（大约 0.001 ETH）
    const maxAmount = Math.max(0, parseFloat(balance) - 0.001);
    if (maxAmount > 0) {
      setTransferAmount(maxAmount.toFixed(4));
    } else {
      setTransferAmount('0');
    }
  };

  if (!isOpen) return null;

  const isSepolia = chainId === 11155111;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in" 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 border-2 border-primary-200/50 dark:border-primary-700/50 max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          zIndex: 10000,
          margin: 'auto'
        }}
      >
        {/* 关闭按钮 - 放在最外层 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-white/80 dark:bg-slate-800/80 shadow-sm"
          aria-label="关闭"
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem',
            zIndex: 10001
          }}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pr-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gradient">账户详情</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Account Details</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 账户名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              账户名称
            </label>
            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">加载中...</span>
                </div>
              ) : editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-primary-300 dark:border-primary-600 rounded-lg text-lg font-semibold text-primary-700 dark:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    placeholder="输入账户名称"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    title="保存"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 rounded-lg transition-colors"
                    title="取消"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold text-primary-700 dark:text-primary-300 flex-1">
                    {accountName || `账户 ${address.slice(0, 6)}...${address.slice(-4)}`}
                  </span>
                  <button
                    onClick={handleEditName}
                    className="p-2 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-lg transition-colors text-primary-600 dark:text-primary-400"
                    title="编辑账户名称"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {editingName ? '按 Enter 保存，Esc 取消' : '点击编辑图标可自定义账户名称'}
            </p>
          </div>

          {/* Sepolia余额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center gap-2">
                余额
                {isSepolia && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                    Sepolia
                  </span>
                )}
              </span>
            </label>
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : formatEth(balance)}
                </span>
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">ETH</span>
              </div>
              {!loading && parseFloat(balance) === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ 余额为 0，请确保账户有足够的 ETH 用于交易
                </p>
              )}
            </div>
          </div>

          {/* 账户地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              账户地址
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white truncate min-w-0">
                {formatAddress(address)}
              </code>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                  title="复制完整地址"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <button
                  onClick={openInExplorer}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                  title="在区块浏览器中查看"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* 转账功能 */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            {!showTransfer ? (
              <button
                onClick={() => setShowTransfer(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Send className="w-4 h-4" />
                向多签钱包转账
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">转账到多签钱包</h3>
                  <button
                    onClick={() => {
                      setShowTransfer(false);
                      setTransferAmount('');
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* 接收地址 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    接收地址（多签钱包）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {walletAddress && transferTo.toLowerCase() === walletAddress.toLowerCase() && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                        已验证
                      </span>
                    )}
                  </div>
                </div>

                {/* 转账金额 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    转账金额 (ETH)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max={balance}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.0000"
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleMaxAmount}
                      className="px-3 py-2.5 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      最大
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      可用余额: {formatEth(balance)} ETH
                    </span>
                    {transferAmount && parseFloat(transferAmount) > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        转账后余额: {formatEth(parseFloat(balance) - parseFloat(transferAmount))} ETH
                      </span>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !transferAmount || !transferTo || parseFloat(transferAmount) <= 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>转账中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>确认转账</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowTransfer(false);
                      setTransferAmount('');
                    }}
                    disabled={isTransferring}
                    className="px-4 py-3 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 网络信息 */}
          {chainId && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">网络</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {isSepolia ? 'Sepolia Testnet' : `Chain ID: ${chainId}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

