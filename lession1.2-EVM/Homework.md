### 1、优化合约

给定合约存在存储效率问题，要求优化至少20%的gas

提示：

* 使用calldata替代memory
* 缓存storage读取
* 减少storage写入次数

### 2、思考题

为什么calldata比memory便宜？

memory特点：

* 临时性：仅在函数执行期间存在，函数调用结束后自动清空。
* 可修改性：Memory中的数据可以被修改。

数据传递过程中产生内存复制操作

calldata特点：

* 只读，不可修改

数据传递过程中不存在内存复制操作

什么情况必须用storage？

* 用户余额
* 合约状态
* 所有者地址
* 需要永久保存的数据

如何缓存storage？

可以使用局部变量缓存storage到memory，减少storage的读取次数

如：

```solidity
function calcaulate() public view returns (unit256) {
	uint256 cachedValue = myValue;// 缓存到局部变量
	return cachedValue * 2;
}
```

