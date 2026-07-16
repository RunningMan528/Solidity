// CrowdfundingCampaign ABI
export const CrowdfundingCampaignABI = [
  'function owner() view returns (address)',
  'function name() view returns (string)',
  'function goal() view returns (uint256)',
  'function deadline() view returns (uint256)',
  'function totalRaised() view returns (uint256)',
  'function state() view returns (uint8)',
  'function contributions(address) view returns (uint256)',
  'function getContributorCount() view returns (uint256)',
  'function getContributors() view returns (address[])',
  'function contribute() payable',
  'function start()',
  'function finalize()',
  'function withdraw()',
  'function refund()',
  'function getProgress() view returns (uint256)',
  'function isActive() view returns (bool)',
  'event Contribution(address indexed contributor, uint256 amount)',
  'event StateChanged(uint8 oldState, uint8 newState)',
  'event Withdrawal(address indexed owner, uint256 amount)',
  'event Refund(address indexed contributor, uint256 amount)',
] as const;

// CrowdfundingFactory ABI
export const CrowdfundingFactoryABI = [
  'function createCampaign(string memory _name, uint256 _goal, uint256 _durationInDays) returns (address)',
  'function getCampaigns() view returns (address[])',
  'function getUserCampaigns(address user) view returns (address[])',
  'function getCampaignCount() view returns (uint256)',
  'function campaigns(uint256) view returns (address)',
  'event CampaignCreated(address indexed creator, address indexed campaign, string name, uint256 goal, uint256 deadline)',
] as const;

