// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
1. 创建Animal抽象合约，定义makeSound抽象函数
2. 创建Dog和Cat⼦合约实现makeSound
3. 添加共同的eat函数
*/

abstract contract Animal {
    string public species;

    constructor(string memory _species) {
        species = _species;
    }

    // 抽象函数:子合约必须实现
    function makeSound() public virtual returns (string memory);

    // 普通函数:所有动物共有
    function eat() public pure returns (string memory) {
        return "Eating......";
    }

    function sleep() public pure returns (string memory) {
        return "Sleeping......";
    }
}

contract Dog is Animal {
    
    constructor() Animal("dog") {}

    function makeSound() public pure override returns (string memory) {
        return "Woof! woof!";
    }
}

contract Cat is Animal {
    constructor() Animal("cat") {}
    
    function makeSound() public pure override returns (string memory) {
        return "Meow! Meow!";
    }
}