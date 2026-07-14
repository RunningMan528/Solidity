import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

// Fixture
async function deployFixture() {
    const [feeRecipient, seller, buyer, bidder1, bidder2] = await ethers.getSigners();
    const nft = await ethers.deployContract("TotoroNFT") as any;
    const marketplace = await ethers.deployContract("TotoroMarketplace", [feeRecipient.address]) as any;

    // 给 seller 铸造一个NFT (tokenId = 1)
    await nft.connect(seller).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") });
    return { nft, marketplace, feeRecipient, seller, buyer, bidder1, bidder2 };
}

// 上架好的Fixture(复用)
async function listedFixture() {
    const base = await deployFixture();
    const { nft, marketplace, seller } = base;

    await nft.connect(seller).approve(await marketplace.getAddress(), 1n);
    await marketplace.connect(seller).listNFT(
        await nft.getAddress(), 1n, ethers.parseEther("1.0")
    );
    return { ...base, listingId: 1n }
}

// Tests
describe("TotoroMarketplace", function () {

    // 1.部署
    describe("Deployment", function () {
        it("应正确设置 feeRecipient", async function () {
            const { marketplace, feeRecipient } = await networkHelpers.loadFixture(deployFixture);
            expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
        });

        it("platformFee 初始值应为 250", async function () {
            const { marketplace } = await networkHelpers.loadFixture(deployFixture);
            expect(await marketplace.platformFee()).to.equal(250n);
        });

        it("零地址 feeRecipient 应 revert", async function () {
            await expect(
                ethers.deployContract("TotoroMarketplace", [ethers.ZeroAddress])
            ).to.be.revertedWith("Invalid fee recipient!");
        });
    });

    // 2.listNFT
    describe("listNFT", function () {
        it("已授权的 owner 应能上架 NFT", async function () {
            const { nft, marketplace, seller } = await networkHelpers.loadFixture(deployFixture);

            await nft.connect(seller).approve(await marketplace.getAddress(), 1n);
            await expect(
                marketplace.connect(seller).listNFT(
                    await nft.getAddress(), 1n, ethers.parseEther("1.0"))).
                to.emit(marketplace, "NFTListed").withArgs(
                    1n, seller.address,await nft.getAddress(),1n ,await ethers.parseEther("1.0"));
        });

        it("非 NFT owner 上架应 revert", async function () {
            const { nft, marketplace, buyer } = await networkHelpers.loadFixture(deployFixture);
            await expect(
                marketplace.connect(buyer).listNFT(await nft.getAddress(), 1n, ethers.parseEther("1.0"))
            ).to.be.revertedWith("Not the owner");
        });

        it("未授权应 revert", async function () {
            const { nft, marketplace, seller } = await networkHelpers.loadFixture(deployFixture);
            await expect(
                marketplace.connect(seller).listNFT(await nft.getAddress(), 1n, ethers.parseEther("1.0"))
            ).to.be.revertedWith("Marketplace not approved");
        });

        it("价格为 0 应 revert", async function () {
            const { nft, marketplace, seller } = await networkHelpers.loadFixture(deployFixture);
            await nft.connect(seller).approve(await marketplace.getAddress(), 1n);
            await expect(
                marketplace.connect(seller).listNFT(await nft.getAddress(), 1n, 0n)
            ).to.be.revertedWith("Price must be greater than 0");
        });
    });

    // 3. delistNFT
    describe("delistNFT", function () {
        it("卖家应能下架", async function () {
            const { marketplace, seller, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(marketplace.connect(seller).delistNFT(listingId))
                .to.emit(marketplace, "NFTDelisted")
                .withArgs(listingId);
        });

        it("非卖家下架应 revert", async function () {
            const { marketplace, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(marketplace.connect(buyer).delistNFT(listingId))
                .to.be.revertedWith("Not the seller!");
        });

        it("重复下架应 revert", async function () {
            const { marketplace, seller, listingId } = await networkHelpers.loadFixture(listedFixture);
            await marketplace.connect(seller).delistNFT(listingId);
            await expect(marketplace.connect(seller).delistNFT(listingId))
                .to.be.revertedWith("Listing not active!");
        });
    });

    // 4. updatePrice
    describe("updatePrice", function () {
        it("卖家应能更新价格", async function () {
            const { marketplace, seller, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(marketplace.connect(seller).updatePrice(listingId, ethers.parseEther("2.0")))
                .to.emit(marketplace, "PriceUpdated")
                .withArgs(listingId, ethers.parseEther("2.0"));
        });

        it("非卖家更新价格应 revert", async function () {
            const { marketplace, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(marketplace.connect(buyer).updatePrice(listingId, ethers.parseEther("2.0")))
                .to.be.revertedWith("Not the seller");
        });
    });

    // 5. buyNFT
    describe("buyNFT", function () {
        it("正常购买 → NFT 转移给买家", async function () {
            const { nft, marketplace, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            await marketplace.connect(buyer).buyNFT(listingId, { value: ethers.parseEther("1.0") });
            expect(await nft.ownerOf(1n)).to.equal(buyer.address);
        });

        it("正常购买 → 触发 NFTSold 事件", async function () {
            const { nft, marketplace, buyer, seller, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(
                marketplace.connect(buyer).buyNFT(listingId, { value: ethers.parseEther("1.0") })
            ).to.emit(marketplace, "NFTSold");
        });

        it("正常购买 → feeRecipient 收到 2.5% 手续费", async function () {
            const { marketplace, buyer, feeRecipient, listingId } = await networkHelpers.loadFixture(listedFixture);
            const price = ethers.parseEther("1.0");
            const fee = price * 250n / 10000n; // 2.5%
            await expect(
                marketplace.connect(buyer).buyNFT(listingId, { value: price })
            ).to.changeEtherBalance(ethers,feeRecipient, fee);
        });

        it("超额支付应退还差额给买家", async function () {
            const { marketplace, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            const price = ethers.parseEther("1.0");
            const overpay = ethers.parseEther("2.0");
            // 买家净支出 = price（多余的 1 ETH 被退还）
            // 注意：changeEtherBalance 不计 gas，只验证 ETH 变化
            // 这里验证合约余额为 0（全部分配+退款后）
            await marketplace.connect(buyer).buyNFT(listingId, { value: overpay });
            const marketBalance = await ethers.provider.getBalance(await marketplace.getAddress());
            expect(marketBalance).to.equal(0n);
        });

        it("支付不足应 revert", async function () {
            const { marketplace, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(
                marketplace.connect(buyer).buyNFT(listingId, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWith("Insufficient payment");
        });

        it("买家不能是自己 → revert", async function () {
            const { marketplace, seller, listingId } = await networkHelpers.loadFixture(listedFixture);
            await expect(
                marketplace.connect(seller).buyNFT(listingId, { value: ethers.parseEther("1.0") })
            ).to.be.revertedWith("Cannot buy yourself NFT");
        });

        it("已下架的挂单购买应 revert", async function () {
            const { marketplace, seller, buyer, listingId } = await networkHelpers.loadFixture(listedFixture);
            await marketplace.connect(seller).delistNFT(listingId);
            await expect(
                marketplace.connect(buyer).buyNFT(listingId, { value: ethers.parseEther("1.0") })
            ).to.be.revertedWith("Listing not active");
        });
    });

    // 6. 拍卖流程
    describe("Auction", function () {

        async function auctionFixture() {
            const base = await deployFixture();
            const { nft, marketplace, seller } = base;
            await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
            await marketplace.connect(seller).createAuction(
                await nft.getAddress(), 1n,
                ethers.parseEther("0.1"), // 起拍价
                2n // 2 小时
            );
            return { ...base, auctionId: 1n };
        }

        describe("createAuction", function () {
            it("应正确创建拍卖并触发事件", async function () {
                const { nft, marketplace, seller } = await networkHelpers.loadFixture(deployFixture);
                await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
                await expect(
                    marketplace.connect(seller).createAuction(
                        await nft.getAddress(), 1n, ethers.parseEther("0.1"), 2n
                    )
                ).to.emit(marketplace, "AuctionCreated");
            });

            it("时长 <= 1 小时应 revert", async function () {
                const { nft, marketplace, seller } = await networkHelpers.loadFixture(deployFixture);
                await nft.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
                await expect(
                    marketplace.connect(seller).createAuction(
                        await nft.getAddress(), 1n, ethers.parseEther("0.1"), 1n
                    )
                ).to.be.revertedWith("Duration must be grater than 1 hours");
            });
        });

        describe("placeBid", function () {
            it("首次出价 >= 起拍价应成功", async function () {
                const { marketplace, bidder1, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await expect(
                    marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("0.1") })
                ).to.emit(marketplace, "BidPlaced");
            });

            it("出价低于起拍价应 revert", async function () {
                const { marketplace, bidder1, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await expect(
                    marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("0.05") })
                ).to.be.revertedWith("Bid too low");
            });

            it("出价未超过当前最高价 5% 应 revert", async function () {
                const { marketplace, bidder1, bidder2, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("0.1") });
                await expect(
                    marketplace.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("0.104") })
                ).to.be.revertedWith("Bid too low"); // 需 >= 0.105
            });

            it("卖家不能出价", async function () {
                const { marketplace, seller, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await expect(
                    marketplace.connect(seller).placeBid(auctionId, { value: ethers.parseEther("0.1") })
                ).to.be.revertedWith("Seller cannot bid");
            });
        });

        describe("withdrawBid", function () {
            it("被超越的出价者应能取回资金", async function () {
                const { marketplace, bidder1, bidder2, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("0.1") });
                await marketplace.connect(bidder2).placeBid(auctionId, { value: ethers.parseEther("0.11") });

                await expect(marketplace.connect(bidder1).withdrawBid(auctionId))
                    .to.changeEtherBalance(ethers, bidder1, ethers.parseEther("0.1"));
            });

            it("无待退款记录时 withdraw 应 revert", async function () {
                const { marketplace, bidder1, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await expect(marketplace.connect(bidder1).withdrawBid(auctionId))
                    .to.be.revertedWith("No pending return");
            });
        });

        describe("endAuction", function () {
            it("拍卖未结束时调用应 revert", async function () {
                const { marketplace, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await expect(marketplace.endAuction(auctionId))
                    .to.be.revertedWith("Auction not ended");
            });

            it("有出价时结束拍卖 → NFT 转给最高出价者", async function () {
                const { nft, marketplace, bidder1, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await marketplace.connect(bidder1).placeBid(auctionId, { value: ethers.parseEther("0.2") });

                // 快进时间到拍卖结束
                await networkHelpers.time.increase(3 * 60 * 60); // +3 小时

                await marketplace.endAuction(auctionId);
                expect(await nft.ownerOf(1n)).to.equal(bidder1.address);
            });

            it("无出价时结束拍卖 → 流拍事件 winner=address(0)", async function () {
                const { marketplace, auctionId } = await networkHelpers.loadFixture(auctionFixture);
                await networkHelpers.time.increase(3 * 60 * 60);

                await expect(marketplace.endAuction(auctionId))
                    .to.emit(marketplace, "AuctionEnded")
                    .withArgs(auctionId, ethers.ZeroAddress, 0n);
            });
        });
    });

    // 7. 管理功能
    describe("Admin", function () {
        it("feeRecipient 应能修改 platformFee", async function () {
            const { marketplace, feeRecipient } = await networkHelpers.loadFixture(deployFixture);
            await marketplace.connect(feeRecipient).setPlatformFee(100n);
            expect(await marketplace.platformFee()).to.equal(100n);
        });

        it("platformFee > 1000 应 revert", async function () {
            const { marketplace, feeRecipient } = await networkHelpers.loadFixture(deployFixture);
            await expect(marketplace.connect(feeRecipient).setPlatformFee(1001n))
                .to.be.revertedWith("Fee too high");
        });

        it("非 feeRecipient 修改 platformFee 应 revert", async function () {
            const { marketplace, seller } = await networkHelpers.loadFixture(deployFixture);
            await expect(marketplace.connect(seller).setPlatformFee(100n))
                .to.be.revertedWith("Not fee Recipient");
        });

        it("feeRecipient 应能更新地址", async function () {
            const { marketplace, feeRecipient, seller } = await networkHelpers.loadFixture(deployFixture);
            await marketplace.connect(feeRecipient).updateFeeRecipient(seller.address);
            expect(await marketplace.feeRecipient()).to.equal(seller.address);
        });
    });

});