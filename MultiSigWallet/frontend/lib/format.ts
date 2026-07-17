/**
 * 格式化 ETH 金额，去掉末尾的 0
 * @param value ETH 金额（字符串或数字）
 * @param decimals 小数位数（默认4位）
 * @returns 格式化后的字符串，例如 "0.03" 而不是 "0.0300"
 */
export function formatEth(value: string | number, decimals: number = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }
  
  // 先格式化为指定小数位数
  const formatted = num.toFixed(decimals);
  
  // 去掉末尾的 0 和小数点（如果所有小数都是0）
  return parseFloat(formatted).toString();
}

/**
 * 格式化地址（脱敏显示）
 * @param address 地址字符串
 * @param startLength 开头显示的长度（默认6）
 * @param endLength 结尾显示的长度（默认4）
 * @returns 格式化后的地址，例如 "0xAb27...E63"
 */
export function formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address || address.length < startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

