// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
1. 实现平⽅根函数（使⽤Newton-Raphson⽅法）
2. 实现最⼤公约数（GCD）
3. 实现幂运算
4. 所有函数都是pure函数
*/

library AdvancedMath {
    // 平方根
    function sqrt(uint256 x) internal pure returns (uint256) {
       if(x == 0) return 0;
       uint256 z = (x + 1) / 2;
       uint256 y = x;

       while (z < y) {
            y = z;
            z = (x / z + z) / 2;
       } 
       return y;
    }

    // 最大公约数
    function gcd(uint256 a,uint256 b) internal pure returns (uint256) {
        while (b != 0){
            uint256 temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    // 幂运算
    function power(uint256 base,uint256 expont) internal pure returns(uint256) {
        if (expont == 0) return 1;

        uint256 result = 1;
        uint256 currentBase = base;
        while (expont > 0) 
        {
            if (expont % 2 == 1) {
                result *= currentBase;
            }
            currentBase *= currentBase;
            expont /= 2;
        }
        return result;
    }
    
    function increment(uint256 value) internal pure returns (uint256) {
        return value + 1;
    }

    function decrement(uint256 value) internal pure returns (uint256) {
        require(value > 0, "Cannot decrement zero");
        return value - 1;
    }
}