// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title IERC2981
 * @dev ERC2981版税标准接口
 */
interface IERC2981 is IERC165 {
    function royaltyInfo(
        uint tokenId,
        uint salePrice
    ) external view returns (address receiver, uint royaltyAmount);
}

/**
 * @title NFTMarketplace
 * @dev 完整的NFT交易市场合约，支持上架、购买、版税和拍卖功能
 * @notice 使用ReentrancyGuard防止重入攻击
 */
contract TotoroMarketplace is ReentrancyGuard {
    /**
     * @dev 挂单结构体
     */
    struct Listing {
        address seller; // 卖家地址
        address nftContract; // NFT合约地址
        uint tokenId; // Token ID
        uint price; // 售价(wei)
        bool active; // 是否激活
    }

    /**
     * @dev 拍卖结构体
     */
    struct Auction {
        address seller; // 卖家地址
        address nftContract; // NFT合约地址
        uint tokenId; // Token ID
        uint startPrice; // 起拍价
        uint highestBid; // 当前最高出价
        address highestBidder; // 当前最高出价者
        uint endTime; // 拍卖结束时间
        bool active; //是否激活
    }

    // 挂单映射
    mapping(uint => Listing) public listings;
    uint public listingCounter;

    // 拍卖映射
    mapping(uint => Auction) public auctions;
    uint public auctionCounter;

    // 待退款映射（用于拍卖）
    mapping(uint => mapping(address => uint)) pendingReturns;

    // 平台手续费（基点：10000 = 100%）
    uint public platformFee = 250; // 2.5%

    // 手续费接收地址
    address public feeRecipient;

    /**
     * @dev NFT上架事件
     */
    event NFTListed(
        uint indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint tokenId,
        uint price
    );

    /**
     * @dev NFT下架事件
     */
    event NFTDelisted(uint indexed listingId);

    /**
     * @dev 价格更新事件
     */
    event PriceUpdated(uint indexed listingId, uint newPrice);

    /**
     * @dev NFT售出事件
     */
    event NFTSold(
        uint indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint price
    );

    /**
     * @dev 拍卖创建事件
     */
    event AuctionCreated(
        uint indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint tokenId,
        uint startPrice,
        uint endTime
    );

    /**
     * @dev 出价事件
     */
    event BidPlaced(uint indexed auctionId, address indexed buyer, uint amount);

    /**
     * @dev 拍卖结束事件
     */
    event AuctionEnded(
        uint indexed auctionId,
        address indexed winner,
        uint finalPrice
    );

    /**
     * @dev 构造函数
     * @param _feeRecipient 手续费接收地址
     */
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient!");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev 上架NFT
     * @param nftContract NFT合约地址
     * @param tokenId Token ID
     * @param price 售价（wei）
     * @return listingId 挂单ID
     */
    function listNFT(
        address nftContract,
        uint tokenId,
        uint price
    ) external returns (uint) {
        require(price > 0, "Price must be greater than 0");
        require(nftContract != address(0), "Invalid NFT contract!");

        IERC721 nft = IERC721(nftContract);

        // 验证所有权
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");

        // 验证授权
        require(
            nft.getApproved(tokenId) == address(this) ||
                nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        // 创建挂单
        listingCounter++;
        listings[listingCounter] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit NFTListed(listingCounter, msg.sender, nftContract, tokenId, price);

        return listingCounter;
    }

    /**
     * @dev 下架NFT
     * @param listingId 挂单ID
     */
    function delistNFT(uint listingId) external {
        Listing storage listing = listings[listingId];

        require(listing.active, "Listing not active!");
        require(listing.seller == msg.sender, "Not the seller!");

        listing.active = false;
        emit NFTDelisted(listingId);
    }

    /**
     * @dev 更新挂单价格
     * @param listingId 挂单ID
     * @param newPrice 新价格（wei）
     */
    function updatePrice(uint listingId, uint newPrice) external {
        require(newPrice > 0, "Price must be greater than 0");

        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.price = newPrice;

        emit PriceUpdated(listingId, newPrice);
    }

    /**
     * @dev 购买NFT
     * @param listingId 挂单ID
     * @notice 需要支付足够的ETH，多余部分会自动退还
     */
    function buyNFT(uint listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        // 检查挂单状态
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy yourself NFT");

        // 先更新状态（CEI原则）
        listing.active = false;

        // 计算手续费
        uint fee = (listing.price * platformFee) / 10000;

        // 获取版税信息
        (address royaltyReceiver, uint royaltyAmount) = _getRoyaltyInfo(
            listing.nftContract,
            listing.tokenId,
            listing.price
        );

        // 计算卖家收益
        uint sellerAmount = listing.price - fee - royaltyAmount;

        // 转移NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // 资金分配：版税 -> 平台手续费 -> 卖家收益
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool successRoyalty, ) = royaltyReceiver.call{
                value: royaltyAmount
            }("");
            require(successRoyalty, "Royalty transfer failed");
        }

        (bool successFee, ) = feeRecipient.call{value: fee}("");
        require(successFee, "Transfer fee failed");

        (bool successSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(successSeller, "Transfer to seller failed!");

        // 退还多余资金
        if (msg.value > listing.price) {
            (bool successRefound, ) = msg.sender.call{
                value: msg.value - listing.price
            }("");
            require(successRefound, "Refound failed");
        }

        emit NFTSold(listingId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @dev 获取版税信息
     * @param nftContract NFT合约地址
     * @param tokenId Token ID
     * @param salePrice 售价
     * @return receiver 版税接收地址
     * @return royaltyAmount 版税金额
     * @notice 内部函数，检查NFT合约是否支持ERC2981标准
     */
    function _getRoyaltyInfo(
        address nftContract,
        uint tokenId,
        uint salePrice
    ) internal view returns (address receiver, uint royaltyAmount) {
        // 检查NFT合约是否支持ERC2981
        if (
            IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)
        ) {
            (receiver, royaltyAmount) = IERC2981(nftContract).royaltyInfo(
                tokenId,
                salePrice
            );
        } else {
            // 不支持版税，返回零地址和零金额
            receiver = address(0);
            royaltyAmount = 0;
        }
    }

    /**
     * @dev 创建拍卖
     * @param nftContract NFT合约地址
     * @param tokenId Token ID
     * @param startPrice 起拍价（wei）
     * @param durationHours 拍卖时长（小时）
     * @return auctionId 拍卖ID
     */
    function createAuction(
        address nftContract,
        uint tokenId,
        uint startPrice,
        uint durationHours
    ) external returns (uint) {
        require(startPrice > 0, "Start price must be greater than 0");
        require(durationHours > 1, "Duration must be grater than 1 hours");
        require(nftContract != address(0), "Invalid NFT contract");

        IERC721 nft = IERC721(nftContract);

        // 验证所有权
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");

        // 验证授权
        require(
            nft.getApproved(tokenId) == address(this) ||
                nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        // 创建拍卖
        auctionCounter++;
        uint endTime = block.timestamp + (durationHours * 1 hours);
        auctions[auctionCounter] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            active: true
        });

        emit AuctionCreated(
            auctionCounter,
            msg.sender,
            nftContract,
            tokenId,
            startPrice,
            endTime
        );

        return auctionCounter;
    }

    /**
     * @dev 出价
     * @param auctionId 拍卖ID
     * @notice 需要支付足够的ETH，出价必须高于当前最高出价的5%
     */
    function placeBid(uint auctionId) external payable {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended!");
        require(msg.sender != auction.seller, "Seller cannot bid");

        // 计算最低出价
        uint minBid;
        if (auction.highestBid == 0) {
            minBid = auction.startPrice;
        } else {
            minBid = auction.highestBid + ((auction.highestBid * 5) / 100); // 5% increment
        }

        require(msg.value >= minBid, "Bid too low");

        // 如果有之前的出价者，记录他们的待退款金额
        if (auction.highestBidder != address(0)) {
            pendingReturns[auctionId][auction.highestBidder] += auction
                .highestBid;
        }

        // 更新最高出价
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    /**
     * @dev 提取出价退款
     * @param auctionId 拍卖ID
     * @notice 被超越的出价者可以提取他们的资金
     */
    function withdrawBid(uint auctionId) external {
        uint amount = pendingReturns[auctionId][msg.sender];
        require(amount > 0, "No pending return");

        pendingReturns[auctionId][msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Bidder withdraw failed");
    }

    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖ID
     * @notice 任何人都可以在拍卖结束后调用此函数进行结算
     */
    function endAuction(uint auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // 有人出价，进行结算
            uint fee = (auction.highestBid * platformFee) / 10000;

            (address royaltyReceiver, uint royaltyAmount) = _getRoyaltyInfo(
                auction.nftContract,
                auction.tokenId,
                auction.highestBid
            );

            uint sellerAmount = auction.highestBid - fee - royaltyAmount;

            // 转移NFT
            IERC721(auction.nftContract).safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            // 资金分配
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                (bool successRoyalty, ) = royaltyReceiver.call{
                    value: royaltyAmount
                }("");
                require(successRoyalty, "Royalty transfer failed");
            }

            (bool successFee, ) = feeRecipient.call{value: fee}("");
            require(successFee, "Fee transfer failed");

            (bool successSeller, ) = auction.seller.call{value: sellerAmount}(
                ""
            );
            require(successSeller, "Seller Transfer failed");

            emit AuctionEnded(
                auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // 没有人出价，拍卖流拍
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    /**
     * @dev 查询挂单信息
     * @param listingId 挂单ID
     * @return seller 卖家地址
     * @return nftContract NFT合约地址
     * @return tokenId Token ID
     * @return price 价格
     * @return active 是否激活
     */
    function getListing(
        uint listingId
    )
        external
        view
        returns (
            address seller,
            address nftContract,
            uint256 tokenId,
            uint256 price,
            bool active
        )
    {
        Listing memory listing = listings[listingId];
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.active
        );
    }

    /**
     * @dev 查询拍卖信息
     * @param auctionId 拍卖ID
     * @return seller 卖家地址
     * @return nftContract NFT合约地址
     * @return tokenId Token ID
     * @return startPrice 起拍价
     * @return highestBid 当前最高出价
     * @return highestBidder 当前最高出价者
     * @return endTime 结束时间
     * @return active 是否激活
     */
    function getAuction(
        uint auctionId
    )
        external
        view
        returns (
            address seller,
            address nftContract,
            uint256 tokenId,
            uint256 startPrice,
            uint256 highestBid,
            address highestBidder,
            uint256 endTime,
            bool active
        )
    {
        Auction memory auction = auctions[auctionId];
        return (
            auction.seller,
            auction.nftContract,
            auction.tokenId,
            auction.startPrice,
            auction.highestBid,
            auction.highestBidder,
            auction.endTime,
            auction.active
        );
    }

    /**
     * @dev 设置平台手续费
     * @param newFee 新的手续费（基点）
     * @notice 只有手续费接收地址可以调用
     */
    function setPlatformFee(uint newFee) external {
        require(msg.sender == feeRecipient, "Not fee Recipient");
        require(newFee <= 1000, "Fee too high");

        platformFee = newFee;
    }

    /**
     * @dev 更新手续费接收地址
     * @param newRecipient 新的接收地址
     * @notice 只有当前手续费接收地址可以调用
     */
    function updateFeeRecipient(address newRecipient) external {
        require(msg.sender == feeRecipient, "Not fee recipient");
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
}
