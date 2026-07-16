import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { CrowdfundingCampaignABI } from '@/lib/abis';

interface CampaignData {
  address: string;
  owner: string;
  name: string;
  goal: bigint;
  totalRaised: bigint;
  deadline: bigint;
  state: number;
  contributorCount: number;
  userContribution: bigint;
}

export function useCampaign(address: string) {
  const { provider, account } = useWeb3();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!provider || !address) {
      setLoading(false);
      return;
    }

    try {
      // 如果用户正在交互，不显示 loading 状态，避免页面闪烁
      if (!isUserInteracting) {
        setLoading(true);
      }
      
      const campaignContract = new ethers.Contract(
        address,
        CrowdfundingCampaignABI,
        provider
      );

      const [owner, name, goal, deadline, totalRaised, state, contributorCount, userContribution] = await Promise.all([
        campaignContract.owner(),
        campaignContract.name(),
        campaignContract.goal(),
        campaignContract.deadline(),
        campaignContract.totalRaised(),
        campaignContract.state(),
        campaignContract.getContributorCount(),
        account ? campaignContract.contributions(account).catch(() => 0n) : Promise.resolve(0n),
      ]);

      setCampaign({
        address,
        owner,
        name,
        goal,
        totalRaised,
        deadline,
        state: Number(state),
        contributorCount: Number(contributorCount),
        userContribution,
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [provider, address, account, isUserInteracting]);

  useEffect(() => {
    // 只在初始加载和依赖变化时获取数据，不自动刷新
    fetchCampaign();
  }, [fetchCampaign]);

  // 提供设置用户交互状态的方法
  const setUserInteracting = useCallback((interacting: boolean) => {
    setIsUserInteracting(interacting);
  }, []);

  return { campaign, loading, refresh: fetchCampaign, setUserInteracting };
}

