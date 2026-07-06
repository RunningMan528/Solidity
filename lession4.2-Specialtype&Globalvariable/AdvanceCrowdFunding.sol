// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
综合运⽤枚举、时间戳、msg.value等所有知识点。
*/
contract AdvancedCrowdFunding {
    // 状态机相关枚举
    enum State { Fundraising, Successful, Failed, PaidOut }

    // 定义当前状态 currentState
    State public currentState = State.Fundraising;

    // 众筹合约的创建者 immutable CREATOR
    address public immutable CREATOR;

    // 众筹目标金额 immutable GOAL
    uint public immutable GOAL;

    // 众筹截止日期 immutiable DEADLINE
    uint public immutable DEADLINE; 

    // 最小贡献金额 constant MINMUM_CONTRIBUTION  0.1 ether
    uint public constant MINMUM_CONTRIBUTION = 0.1 ether;

    // 总资助资金 totalFunded
    uint public totalFunded;

    // 贡献者数量 contributorCount
    uint public  contributorCount;

    // 贡献记录  address => uint  contributions
    mapping (address => uint) contributions;

    // 贡献者地址列表  contributors
    address[] contributors;

    // 事件
    // 状态改变 StateChanged (旧状态/新状态/时间戳)
    event StateChanged(State oldState,State newState,uint timestamp);
    // 用户贡献金额 Contribution (贡献者地址,贡献数量,当前总数量)
    event Contribution(address indexed contributor,uint amount,uint totalFunded);
    // 众筹者体现 FundsWithdrawn(体现者地址,体现数量)
    event FundsWithdrwan(address indexed creator,uint amount);
    // 众筹失败退款 Refunded(退款者地址,退款数量)
    event Refunded(address indexed contributor,uint amount);


    // modifier

    modifier onlyCreator() {
        require(msg.sender == CREATOR, "Not creator!");
        _;
    }

    // 是否处于某种状态
    modifier inState(State expected) {
        require(currentState == expected, "Invalid State!");
        _;
    }

    // 构造函数 参数需要众筹数量,过期时间 days
    constructor(uint _GOAL,uint durationDays) {
        CREATOR = msg.sender;
        GOAL = _GOAL;
        require(durationDays >= 1 && durationDays <= 90, "Invalid days!");
        DEADLINE = block.timestamp + durationDays * 1 days;
    }

    // 贡献资金 contribute
    function contribute() public payable inState(State.Fundraising) {
        require(block.timestamp <= DEADLINE, "Fundraising ended!");
        uint amount = msg.value;
        require(amount > MINMUM_CONTRIBUTION, "Invalid amount!");
        // 新贡献者
        address contributor = msg.sender;
        if (contributions[contributor] == 0) {
            contributors.push(contributor);
            contributorCount++;
        }

        contributions[contributor] += amount;
        totalFunded += amount;

        // 是否达到众筹目标
        if (totalFunded >= GOAL) {
            State oldState = currentState;
            currentState = State.Successful;
            emit StateChanged(oldState, State.Successful, block.timestamp);
        }

        emit Contribution(contributor, amount, totalFunded);
    }

    // 检查并更新状态 checkGoalReached 检查当前筹集的总金额是否达到目标金额,并更新状态
    function checkGoalReached() public inState(State.Fundraising) {
        require(block.timestamp > DEADLINE, "Fundraising still active!");
        State oldState = currentState;
        State newState;
        if (totalFunded >= GOAL) {
            newState = State.Successful;
        } else {
            newState = State.Failed;
        }
        currentState = newState;
        emit StateChanged(oldState, newState, block.timestamp);
    }

    // 创建者提取资金 withDrawFunds
    function withDrawFunds() public onlyCreator inState(State.Successful){
        uint balance = address(this).balance;
        require(balance > 0,"No balance to withdraw!");

        State oldState = currentState;
        currentState = State.PaidOut; 
        emit StateChanged(oldState, State.PaidOut, block.timestamp);

        (bool send,) = CREATOR.call{value:balance}("");
        require(send, "Transfer failed!");

        emit FundsWithdrwan(CREATOR, balance);
    }

    // 退款 refund,需要检查贡献者是否贡献了金额
    function refund() public inState(State.Failed) {
        address contributor = msg.sender;
        uint amount = contributions[contributor];
        require(amount > 0, "No contribute amount!");

        contributions[contributor] = 0;
        (bool send,) = contributor.call{value:amount}("");
        require(send, "Transaction failed!");
        
        emit Refunded(contributor, amount);
    }

    // 查询函数 getInfo (当前状态/目标金额/目前筹集的金额/截止时间/剩余时间/贡献者数量)
    function getInfo() public view returns (State,uint,uint,uint,uint,uint) {
        return (currentState,GOAL,totalFunded,DEADLINE,DEADLINE - block.timestamp,contributorCount);
    }

    // 当前众筹进度 getProgress
    function getProgress() public view returns (uint) {
        return totalFunded * 100 / GOAL;
    }

    // 众筹是否过期 isActive  状态&是否过期
    function isActive() public view returns(bool) {
        return currentState == State.Fundraising && block.timestamp <= DEADLINE;
    }

}