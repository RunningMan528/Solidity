/**
 * 错误处理工具函数
 * 将技术性错误消息转换为用户友好的中文提示
 */

export function parseError(error: any): { title: string; message: string } {
  const errorString = error?.message || error?.toString() || '未知错误';
  const errorCode = error?.code;
  const errorReason = error?.reason;

  // 处理 ethers.js 的 CALL_EXCEPTION 错误
  if (errorCode === 'CALL_EXCEPTION' || errorString.includes('CALL_EXCEPTION')) {
    const action = error?.action || '';
    
    // estimateGas 错误
    if (action === 'estimateGas' || errorString.includes('estimateGas')) {
      if (errorString.includes('missing revert data') || errorString.includes('revert=null')) {
        return {
          title: '交易预估失败',
          message: '无法预估交易所需的 Gas。可能的原因：\n\n' +
                   '• 交易可能会失败（如余额不足、权限不足等）\n' +
                   '• 合约状态不满足执行条件\n' +
                   '• 网络连接问题\n\n' +
                   '请检查交易参数和钱包状态后重试。'
        };
      }
      
      if (errorString.includes('execution reverted')) {
        const revertReason = errorReason || extractRevertReason(errorString);
        return {
          title: '交易执行将失败',
          message: `交易预估时发现执行将被回滚。\n\n原因：${revertReason || '未知原因'}\n\n请检查交易参数后重试。`
        };
      }
      
      return {
        title: 'Gas 预估失败',
        message: '无法预估交易所需的 Gas 费用。请检查交易参数和网络连接后重试。'
      };
    }
    
    // 普通调用错误
    if (action === 'call') {
      return {
        title: '合约调用失败',
        message: '无法调用合约方法。请检查合约地址和方法参数是否正确。'
      };
    }
    
    // 发送交易错误
    if (action === 'sendTransaction') {
      return {
        title: '交易发送失败',
        message: '无法发送交易。请检查网络连接和钱包余额后重试。'
      };
    }
    
    // 通用的 CALL_EXCEPTION
    if (errorReason) {
      return {
        title: '合约执行失败',
        message: `执行失败：${errorReason}\n\n请检查交易参数和合约状态。`
      };
    }
    
    return {
      title: '合约调用异常',
      message: '合约调用时发生错误。请检查交易参数和网络状态。'
    };
  }
  
  // 处理用户拒绝错误
  if (errorCode === 'ACTION_REJECTED' || 
      errorString.includes('user rejected') || 
      errorString.includes('User rejected') ||
      errorString.includes('用户拒绝')) {
    return {
      title: '操作已取消',
      message: '您已取消该操作。'
    };
  }
  
  // 处理网络错误
  if (errorCode === 'NETWORK_ERROR' || 
      errorString.includes('network') || 
      errorString.includes('Network')) {
    return {
      title: '网络连接错误',
      message: '无法连接到区块链网络。请检查网络连接后重试。'
    };
  }
  
  // 处理余额不足
  if (errorCode === 'INSUFFICIENT_FUNDS' || 
      errorString.includes('insufficient funds') ||
      errorString.includes('余额不足')) {
    return {
      title: '余额不足',
      message: '钱包余额不足以支付交易费用。请确保账户有足够的 ETH。'
    };
  }
  
  // 处理非ce过期
  if (errorCode === 'NONCE_EXPIRED' || errorString.includes('nonce')) {
    return {
      title: '交易序号错误',
      message: '交易序号已过期。请刷新页面后重试。'
    };
  }
  
  // 处理执行回滚
  if (errorString.includes('execution reverted') || errorString.includes('revert')) {
    const revertReason = errorReason || extractRevertReason(errorString);
    return {
      title: '交易执行失败',
      message: `交易执行被回滚。\n\n原因：${revertReason || '未知原因'}\n\n请检查交易参数后重试。`
    };
  }
  
  // 处理地址格式错误
  if (errorString.includes('invalid address') || errorString.includes('invalid Address')) {
    return {
      title: '地址格式错误',
      message: '提供的地址格式不正确。请检查地址是否为有效的以太坊地址。'
    };
  }
  
  // 处理金额格式错误
  if (errorString.includes('invalid value') || errorString.includes('underflow') || errorString.includes('overflow')) {
    return {
      title: '金额格式错误',
      message: '提供的金额格式不正确。请检查金额是否为有效的数字。'
    };
  }
  
  // 默认错误处理
  // 尝试提取有用的错误信息
  let userMessage = errorString;
  
  // 移除技术性前缀
  userMessage = userMessage.replace(/^Error:\s*/i, '');
  userMessage = userMessage.replace(/^\(.*?\)\s*/, '');
  
  // 如果错误消息太长，截断它
  if (userMessage.length > 200) {
    userMessage = userMessage.substring(0, 200) + '...';
  }
  
  return {
    title: '操作失败',
    message: userMessage || '发生未知错误，请稍后重试。'
  };
}

/**
 * 从错误字符串中提取 revert 原因
 */
function extractRevertReason(errorString: string): string {
  // 尝试匹配常见的 revert 原因格式
  const patterns = [
    /revert\s+(.+?)(?:\s|$)/i,
    /reason:\s*(.+?)(?:\s|$)/i,
    /"([^"]+)"/,
    /'([^']+)'/,
  ];
  
  for (const pattern of patterns) {
    const match = errorString.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

