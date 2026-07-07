// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract OpenzepplinDemo {

    using Strings for uint256;
    using Address for address;
    using Strings for  string;

    // 使用Strings库
    function numberToString(uint256 num) public pure returns (string memory) {
        return num.toString();
    }

    function compreTwoString(string memory str1,string memory str2) public pure returns (bool) {
        return str1.equal(str2);
    }

}