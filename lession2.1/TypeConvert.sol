// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TypeConvert {

    // 任务一：安全的uint256转uint8
    function safeConvertToUint8(uint256 value) public pure returns (uint8) {
        require(value <= type(uint8).max, "value too large for uint8");
        return uint8(value);
    }

    // 任务二：字符串比较
    function compareStrings(string memory str1,string memory str2) public pure returns (bool) {
        return keccak256(bytes(str1)) == keccak256(bytes(str2));
    }

    // 任务三：零地址检查
    function isZeroAddress(address addr) public pure returns (bool) {
        return addr == address(0);
    }

    // 测试函数
    function testConversion() public pure returns (uint8,uint8) {
        return (
            safeConvertToUint8(255),
            safeConvertToUint8(100)
            //safeConvertToUint8(256) // 溢出被截断
            );
    }

    function testStringComparison() public pure returns (bool,bool) {
        return (
            compareStrings("Totoro", "Uotoro"),
            compareStrings("Totoro", "Totoro")
        );
    }

    function testZeroAddress() public pure returns (bool,bool) {
        return (
            isZeroAddress(address(0)),
            isZeroAddress(0x0000000000000000000000000000000000001234)
        );
    }
}