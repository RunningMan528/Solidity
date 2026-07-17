// MultiSigWallet ABI
export const MultiSigWalletABI = [
  // 状态变量
  'function owners(uint256) view returns (address)',
  'function isOwner(address) view returns (bool)',
  'function numConfirmationsRequired() view returns (uint256)',
  'function transactions(uint256) view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)',
  'function isConfirmed(uint256, address) view returns (bool)',
  
  // 所有者管理
  'function addOwner(address newOwner)',
  'function removeOwner(address owner)',
  'function changeThreshold(uint256 newThreshold)',
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
  'function getOwnerCount() view returns (uint256)',
  
  // 交易管理
  'function submitTransaction(address to, uint256 value, bytes memory data)',
  'function getTransaction(uint256 txIndex) view returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations)',
  'function getTransactionCount() view returns (uint256)',
  
  // 确认机制
  'function confirmTransaction(uint256 txIndex)',
  'function revokeConfirmation(uint256 txIndex)',
  'function isTransactionConfirmed(uint256 txIndex, address owner) view returns (bool)',
  'function getConfirmationCount(uint256 txIndex) view returns (uint256)',
  
  // 执行交易
  'function executeTransaction(uint256 txIndex)',
  'function canExecute(uint256 txIndex) view returns (bool)',
  
  // 余额
  'function getBalance() view returns (uint256)',
  
  // V2 新功能
  'function version() view returns (uint256)',
  'function getOwnerVoteCount(address owner) view returns (uint256)',
  'function incrementOwnerVoteCount(address owner)',
  
  // 接收 ETH
  'receive() external payable',
  'fallback() external payable',
  
  // 事件
  'event Deposit(address indexed sender, uint256 amount)',
  'event SubmitTransaction(uint256 indexed txIndex, address indexed to, uint256 value, bytes data)',
  'event ConfirmTransaction(address indexed owner, uint256 indexed txIndex)',
  'event RevokeConfirmation(address indexed owner, uint256 indexed txIndex)',
  'event ExecuteTransaction(uint256 indexed txIndex)',
  'event OwnerAdded(address indexed owner)',
  'event OwnerRemoved(address indexed owner)',
  'event ThresholdChanged(uint256 indexed newThreshold)',
  'event VersionUpgraded(uint256 indexed oldVersion, uint256 indexed newVersion)',
  'event OwnerVoteCountUpdated(address indexed owner, uint256 indexed newCount)',
] as const;

