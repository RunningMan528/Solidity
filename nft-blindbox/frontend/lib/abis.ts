// NFTBlindBoxUpgradeable ABI
export const NFTBlindBoxABI = [
  // ERC721 标准函数
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  
  // 盲盒功能
  'function purchaseBox() payable',
  'function getBlindBoxStatus(uint256 tokenId) view returns (bool purchased, bool revealed, uint8 rarity)',
  'function tokenRarity(uint256 tokenId) view returns (uint8)',
  
  // 销售信息
  'function getSaleInfo() view returns (bool active, uint8 phase, uint256 currentPrice, uint256 maxWallet)',
  'function saleManager() view returns (address)',
  'function vrfHandler() view returns (address)',
  
  // Owner 功能
  'function owner() view returns (address)',
  'function setPrice(uint256 _price)',
  'function setSaleActive(bool _active)',
  'function setSalePhase(uint8 _phase)',
  'function setMaxPerWallet(uint256 _max)',
  'function addToWhitelist(address[] memory addresses)',
  'function removeFromWhitelist(address[] memory addresses)',
  'function setBaseURI(string memory baseURI)',
  'function withdraw()',
  
  // 事件
  'event BoxPurchased(address indexed buyer, uint256 indexed tokenId)',
  'event BoxRevealed(uint256 indexed tokenId, uint8 rarity)',
  'event RarityAssigned(uint256 indexed tokenId, uint8 rarity)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
] as const;

// SaleManager ABI (用于查询销售信息)
export const SaleManagerABI = [
  'function price() view returns (uint256)',
  'function saleActive() view returns (bool)',
  'function currentPhase() view returns (uint8)',
  'function maxPerWallet() view returns (uint256)',
  'function whitelist(address) view returns (bool)',
  'function canPurchase(address user, uint256 userBalance, uint256 value) view returns (bool canBuy, string memory reason)',
] as const;

