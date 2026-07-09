// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// DeFi协议需要处理复杂的⾦融逻辑和多个外部合约调⽤。

interface IERC20 {
    function transfer(address to, uint amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint);
}

interface IPriceOracle {
    function getPrice(address token) external view returns (uint);
}

contract LendingProtocol {
    // 自定义错误
    error InsufficientCollateral(uint provided, uint required);
    error LoanNotFound(uint loanId);
    error Unauthorized();
    error TokenTransferFailed();
    error PriceOracleFailed();
    error CollateralRatioTooLow();
    error InvalidAddress();
    error InvalidAmount();

    struct Loan {
        address borrower;
        address collateralToken;
        address borrowToken;
        uint collateralAmount;
        uint borrowAmount;
        bool active;
    }

    mapping(uint => Loan) public loans;
    uint public loanCount;

    IPriceOracle public priceOracle;
    uint public constant COLLATERAL_RATIO = 150; // 150%

    event LoanCreated(uint indexed loanId, address indexed borrower);
    event LoanRepaid(uint indexed loanId);
    event CollateralLiquidated(uint indexed loanId);

    constructor(address _priceOracle) {
        if (_priceOracle == address(0)) revert InvalidAddress();
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @notice 创建贷款
     */
    function createLoan(
        address collateralToken,
        address borrowToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) public returns (uint256) {
        // 获取价格（使⽤try-catch处理预⾔机调⽤）
        uint256 collateralPrice;
        uint256 borrowPrice;
        try priceOracle.getPrice(collateralToken) returns (uint256 price) {
            collateralPrice = price;
        } catch {
            revert PriceOracleFailed();
        }
        try priceOracle.getPrice(borrowToken) returns (uint256 price) {
            borrowPrice = price;
        } catch {
            revert PriceOracleFailed();
        }
        // 计算抵押价值
        uint256 collateralValue = collateralAmount * collateralPrice;
        uint256 borrowValue = borrowAmount * borrowPrice;
        uint256 requiredCollateral = (borrowValue * COLLATERAL_RATIO) / 100;
        // 检查抵押率
        if (collateralValue < requiredCollateral) {
            revert InsufficientCollateral(collateralValue, requiredCollateral);
        }
        // 转移抵押物（使⽤try-catch）
        try
            IERC20(collateralToken).transferFrom(
                msg.sender,
                address(this),
                collateralAmount
            )
        returns (bool success) {
            if (!success) revert TokenTransferFailed();
        } catch {
            revert TokenTransferFailed();
        }
        // 创建贷款
        uint256 loanId = loanCount++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            collateralToken: collateralToken,
            borrowToken: borrowToken,
            collateralAmount: collateralAmount,
            borrowAmount: borrowAmount,
            active: true
        });
        // 发放借款
        try IERC20(borrowToken).transfer(msg.sender, borrowAmount) returns (
            bool success
        ) {
            if (!success) {
                // 如果借款发放失败,退还抵押物
                IERC20(collateralToken).transfer(msg.sender, collateralAmount);
                revert TokenTransferFailed();
            }
        } catch {
            // 如果借款发放失败,退还抵押物
            IERC20(collateralToken).transfer(msg.sender, collateralAmount);
            revert TokenTransferFailed();
        }
        emit LoanCreated(loanId, msg.sender);
        return loanId;
    }

    /**
     * @notice 偿还贷款
     */
    function repayLoan(uint256 loanId) public {
        Loan storage loan = loans[loanId];
        // 检查贷款是否存在且活跃
        if (!loan.active) revert LoanNotFound(loanId);
        if (loan.borrower != msg.sender) revert Unauthorized();
        // 收回借款
        try
            IERC20(loan.borrowToken).transferFrom(
                msg.sender,
                address(this),
                loan.borrowAmount
            )
        returns (bool success) {
            if (!success) revert TokenTransferFailed();
        } catch {
            revert TokenTransferFailed();
        }
        // 返还抵押物
        try
            IERC20(loan.collateralToken).transfer(
                loan.borrower,
                loan.collateralAmount
            )
        returns (bool success) {
            if (!success) {
                // 如果返还失败,退回借款
                IERC20(loan.borrowToken).transfer(
                    msg.sender,
                    loan.borrowAmount
                );
                revert TokenTransferFailed();
            }
        } catch {
            // 如果返还失败,退回借款
            IERC20(loan.borrowToken).transfer(msg.sender, loan.borrowAmount);
            revert TokenTransferFailed();
        }
        loan.active = false;
        emit LoanRepaid(loanId);
    }
}
