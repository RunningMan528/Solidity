// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ERC20代币
contract TokenContract {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint public totalSupply;

    mapping (address => uint) public balanceOf;
    mapping (address => mapping (address => uint)) public allowance;

    address public owner;

    uint public constant MAX_COUNT = 50;

    bool paused = false;

    // Event
    event Transfer(address indexed from,address indexed to, uint amount);
    event Approval(address indexed owner,address indexed spender,uint amount);

    // Custom Error
    error InsufficientBalance(address account,uint available,uint required);
    error InsufficientAllowance(address owner,address spender,uint available,uint required);
    error InvalidRecipient(address recipient);
    error InvalidAmount(uint amount);

    modifier onlyOwner() {
        require(owner == msg.sender,"Not Onwer!");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Current is paused!");
        _;
    }

    modifier whenPaused() {
        require(paused, "Current is not paused!");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _totalSupply) {
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10**_decimals;

        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to,uint amount) public whenNotPaused returns (bool) {
        if (to == address(0)) revert InvalidRecipient(to);
        if (amount == 0) revert InvalidAmount(amount);
        address account = msg.sender;
        if (balanceOf[account] < amount) revert InsufficientBalance(account,balanceOf[account],amount);

        balanceOf[account] -= amount;
        balanceOf[to] += amount;

        emit Transfer(account, to, amount);

        return true;
    }

    function approve(address spender,uint amount) public whenNotPaused returns (bool) {
        if (spender == address(0)) revert InvalidRecipient(spender);
        if (amount == 0) revert InvalidAmount(amount);

        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);

        return true;
    }

    function transferFrom(address from,address to,uint amount) public whenNotPaused returns (bool) {
        if (from == address(0)) revert InvalidRecipient(from);
        if (to == address(0)) revert InvalidRecipient(to);
        if (amount == 0) revert InvalidAmount(amount);
        if (balanceOf[from] < amount) revert InsufficientBalance(from,balanceOf[from],amount);

        if (allowance[from][msg.sender] < amount) {
            revert InsufficientAllowance(from,to,allowance[from][msg.sender],amount);
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        allowance[from][msg.sender] -= amount;

        emit  Transfer(from, to, amount);

        return true;
    }

    function mint(address to,uint amount) public onlyOwner whenNotPaused {
        if (to == address(0)) revert InvalidRecipient(to);
        if (amount == 0) revert InvalidAmount(amount);

        totalSupply += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }

    function burn(uint amount) public whenNotPaused {
        if (amount == 0) revert InvalidAmount(amount);

        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;

        emit Transfer(msg.sender, msg.sender, amount);
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