// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "lession6.2-Library/AdvancedMath.sol";

contract Counter {

    using AdvancedMath for uint256;

    function increment(uint256 value) public pure returns (uint256) {
        return value.increment();
    }

    function decrement(uint256 value) public pure returns(uint256) {
        return value.decrement();
    }

}