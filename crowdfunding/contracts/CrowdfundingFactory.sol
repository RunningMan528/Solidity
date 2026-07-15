// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import "./CrowdfundingCampaign.sol";

/**
 * @title 众筹工厂合约
 * @dev 用于创建和管理多个众筹活动的工厂合约
 * @notice 使用工厂模式来部署多个众筹活动实例
 */
contract CrowdfundingFactory {
    /// @dev 所有已创建的众筹活动地址数组
    CrowdfundingCampaign[] public campaigns;
    /// @dev 映射:从用户地址到该用户创建的所有活动索引数组
    /// @notice 用于快速查询某个用户创建的所有活动
    mapping(address => uint256[]) public userCampaigns;

    /// @dev 事件定义
    /// @param creator 活动创建者地址
    /// @param campaign 新创建的活动合约地址
    /// @param name 活动名称
    /// @param goal 筹款目标金额
    /// @param deadline 活动截止时间戳
    event CampaignCreated(
        address indexed creator,
        address indexed campaign,
        string name,
        uint256 goal,
        uint256 deadline
    );

    function createCampaigin(
        string memory _name,
        uint256 _goal,
        uint256 _durationInDays
    ) external returns (address) {
        // 部署新的众筹活动合约
        // 将调用者的地址作为活动创建者传入
        CrowdfundingCampaign campaign = new CrowdfundingCampaign(
            msg.sender,
            _name,
            _goal,
            _durationInDays
        );
        // 存储活动地址:将新活动添加到全局活动数组
        campaigns.push(campaign);
        // 记录用户创建的活动:将活动索引添加到用户的活动中
        userCampaigns[msg.sender].push(campaigns.length - 1);

        // 触发活动创建事件
        emit CampaignCreated(
            msg.sender,
            address(campaign),
            _name,
            _goal,
            _durationInDays
        );

        // 返回新创建的活动地址
        return address(campaign);
    }

    /**
     * @dev 获取所有活动地址
     * @return 所有活动地址数组
     * @notice 返回工厂合约创建的所有众筹活动地址
     */
    function getCampaigns() external view returns (address[] memory) {
        // 创建与活动数组长度相同的地址数组
        address[] memory campaignAddresses = new address[](campaigns.length);
        // 遍历所有互动,将地址存入数组
        for (uint256 i = 0; i < campaigns.length; i++) {
            campaignAddresses[i] = address(campaigns[i]);
        }
        // 返回地址数组
        return campaignAddresses;
    }

    /**
     * @dev 获取指定用户创建的所有活动
     * @param user 用户地址
     * @return 该用户创建的所有活动地址数组
     * @notice 根据用户地址查询其创建的所有众筹活动
     */
    function getUserCampaigns(
        address user
    ) external view returns (address[] memory) {
        // 获取该用户创建的所有活动索引
        uint256[] memory indices = userCampaigns[user];
        // 创建与索引数组数量相同的地址数组
        address[] memory campaignAddresses = new address[](indices.length);
        // 遍历索引数组,根据索引获取对应的活动地址
        for (uint256 i = 0; i < indices.length; i++) {
            campaignAddresses[i] = address(campaigns[indices[i]]);
        }
        return campaignAddresses;
    }

    /**
     * @dev 获取活动总数
     * @return 已创建活动总数
     * @notice 返回工厂合约创建的所有活动总数量
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}
