/**
 * 格式化工具函数
 */

import { formatEther, Rarity } from './contracts';
import { RARITY_CONFIG } from './config';

/**
 * 格式化ETH金额，保留指定小数位
 */
export function formatEth(value: bigint | string, decimals: number = 4): string {
  const eth = formatEther(value);
  const num = parseFloat(eth);
  return num.toFixed(decimals);
}

/**
 * 格式化大数字（添加千位分隔符）
 */
export function formatNumber(value: number | bigint | string): string {
  const num = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('zh-CN').format(num);
}

/**
 * 获取稀有度名称
 */
export function getRarityName(rarity: number | Rarity): string {
  const rarityNum = typeof rarity === 'number' ? rarity : Number(rarity);
  switch (rarityNum) {
    case 0:
      return RARITY_CONFIG.common.nameZh;
    case 1:
      return RARITY_CONFIG.rare.nameZh;
    case 2:
      return RARITY_CONFIG.epic.nameZh;
    case 3:
      return RARITY_CONFIG.legendary.nameZh;
    default:
      return '未知';
  }
}

/**
 * 获取稀有度颜色
 */
export function getRarityColor(rarity: number | Rarity): string {
  const rarityNum = typeof rarity === 'number' ? rarity : Number(rarity);
  switch (rarityNum) {
    case 0:
      return RARITY_CONFIG.common.color;
    case 1:
      return RARITY_CONFIG.rare.color;
    case 2:
      return RARITY_CONFIG.epic.color;
    case 3:
      return RARITY_CONFIG.legendary.color;
    default:
      return '#9ca3af';
  }
}

/**
 * 获取稀有度渐变类
 */
export function getRarityGradient(rarity: number | Rarity): string {
  const rarityNum = typeof rarity === 'number' ? rarity : Number(rarity);
  switch (rarityNum) {
    case 0:
      return RARITY_CONFIG.common.gradient;
    case 1:
      return RARITY_CONFIG.rare.gradient;
    case 2:
      return RARITY_CONFIG.epic.gradient;
    case 3:
      return RARITY_CONFIG.legendary.gradient;
    default:
      return 'from-gray-400 to-gray-600';
  }
}

/**
 * 获取销售阶段名称
 */
export function getSalePhaseName(phase: number): string {
  switch (phase) {
    case 0:
      return '未开始';
    case 1:
      return '白名单';
    case 2:
      return '公售';
    default:
      return '未知';
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('zh-CN');
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: bigint | number): string {
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
}

