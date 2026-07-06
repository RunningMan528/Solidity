// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
任务：
使⽤今天学到的知识，创建⼀个ERC20代币。
要求：
1. 设置⾃⼰的名称和符号
2. 实现所有核⼼功能（transfer、approve、transferFrom）
3. 添加mint和burn功能
4. 部署到Remix并测试
5. 测试所有功能和错误场景
*/
contract TotoroToken {
    //代币基本信息
    string public name;
    string public symbol;
    uint8 public decimals;
    uint public totalSupply;

    // 状态变量
    // 用于记录账户余额
    mapping (address => uint) public balanceOf;
    // 用于记录授权额度
    mapping (address => mapping (address => uint)) public allowance;

    // 所有者
    address public owner;

    // 批量转账 最大限制
    uint public constant MAX_COUNT = 50;

    // 为合约添加暂停功能
    bool public paused = false;

    // 事件
    event Transfer(address indexed from,address indexed to,uint value);
    event Approval(address indexed owner,address indexed spender,uint value);

    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call!");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is not paused!");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is paused!");
        _;
    }

    // 构造函数
    constructor(string memory _name,string memory _symbol,uint8 _decimals,uint _initSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _initSupply * 10**_decimals;
        owner = msg.sender;
        balanceOf[msg.sender] = totalSupply;
        
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // 转账函数:从调⽤者账户转移代币到指定地址
    function transfer(address to, uint amount) public whenNotPaused returns (bool) {
        require(to != address(0), "Cannot transfer to zero address!");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance!");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // 授权函数:授权指定地址使⽤调⽤者的代币
    function approve(address spender,uint amount) public returns (bool) {
        require(spender != address(0), "Cannot approve zero address!");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // 转账函数:使⽤授权额度，从授权⼈账户转移代币到指定地址
    function transferFrom(address from,address to,uint amount) public returns (bool) {
        require(from != address(0),"From zero!");
        require(to != address(0),"To zero!");
        require(balanceOf[from] >= amount, "Insufficient balance!");
        require(allowance[from][msg.sender] >= amount, "Insufficient balance2!");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        
        return true;
    }

    // 铸造函数(可选,需要owner权限):⽤于增加代币供应量，创造新的代币
    function mint(address to, uint amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address!");

        totalSupply += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    // 销毁函数(可选):⽤于减少代币供应量，永久销毁代币
    function burn(uint amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance!");

        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;

        emit Transfer(msg.sender, address(0), amount);
    }

    // 批量转账功能
    function batchTransfer(address[] memory recipients,uint[] memory amounts) external {
        // 检查数组长度
        require(recipients.length > 0 && recipients.length == amounts.length, "Length mismatch!");
        // 限制批量大小
        require(recipients.length <= MAX_COUNT,"Too many recipients!");
        // 计算总金额
        uint sum = 0;
        for (uint i = 0; i < amounts.length; i++) 
        {
            sum += amounts[i];
        }
        // 检查余额
        require(totalSupply >= sum, "Insufficient balance!");
        // 执行转账
        for (uint i = 0; i < recipients.length; i++) 
        {
            // 直接调用transfer方法也可以,但是为了节省Gas费 直接写比较好,因为transfer方法中还有余额判断
            //transfer(recipients[i], amounts[i]);
            require(recipients[i] != address(0), "Cannot transfer to zero address!");
            balanceOf[msg.sender] -= amounts[i];
            balanceOf[recipients[i]] += amounts[i];

            emit Transfer(msg.sender, recipients[i], amounts[i]);
        }
    }

    // 暂停
    function pause() public  onlyOwner whenNotPaused{
        paused = true;
    }

    // 恢复
    function resume() public onlyOwner whenPaused {
        paused = false;
    }

}