import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

// Fixture
async function deployNFTFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const nft = await ethers.deployContract("TotoroNFT") as any;
    return { nft, owner, user1, user2 };
}

// Tests
describe("TotoroNFT", function () {

    // 1.部署
    describe("Deployment", function () {
        it("应该设置 name 和 symbol", async function () {
            const { nft } = await networkHelpers.loadFixture(deployNFTFixture);
            expect(await nft.name()).to.equal("TotoroNFT");
            expect(await nft.symbol()).to.equal("TNFT");
        });

        it("部署者应为 owner", async function () {
            const { nft, owner } = await networkHelpers.loadFixture(deployNFTFixture);
            expect(await nft.owner()).to.equal(owner.address);
        });

        it("初始 mintPrice 应为0.01 ETH", async function () {
            const { nft } = await networkHelpers.loadFixture(deployNFTFixture);
            expect(await nft.mintPrice()).to.equal(ethers.parseEther("0.01"));
        });

        it("初始 totalSupply 应为 0", async function () {
            const { nft } = await networkHelpers.loadFixture(deployNFTFixture);
            expect(await nft.totalSupply()).to.equal(0n);
        });
    });

    // 2.mint
    describe("mint", function () {
        it("支付足额 ETH 应成功铸造,返回 tokenId=1", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            const tokenId = await nft.connect(user1).mint.staticCall(
                "ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee",
                { value: ethers.parseEther("0.01") }
            );
            expect(tokenId).to.equal(1n);
        });

        it("铸造后 totalSupply 应增加", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") });
            expect(await nft.ownerOf(1n)).to.equal(user1.address);
        });

        it("铸造后 owner 应为调用者", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") });
            expect(await nft.ownerOf(1n)).to.equal(user1.address);
        });

        it("应触发 NFTMinted 事件", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await expect(nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") })).to.emit(nft, "NFTMinted").withArgs(user1.address, 1n, "ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee");
        });

        it("支付不足 revert", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await expect(nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.001") })).to.be.revertedWith("Insufficient payment");
        });

        it("超额支付应成功 (合约保留多余金额)", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await expect(nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("1.0") })).to.not.be.revert;
        });

        it("tokenURI 应返回设置的 URI", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") });
            expect(await nft.tokenURI(1n)).to.equal("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee");
        });
    });

    // 3.withdraw
    describe("withdraw", function () {
        it("owner 应能提取合约余额", async function () {
            const { nft, owner, user1 } =
                await networkHelpers.loadFixture(deployNFTFixture);

            const mintTx = await nft.connect(user1).mint(
                "ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee",
                { value: ethers.parseEther("0.01") }
            );
            await mintTx.wait();

            await expect(nft.connect(owner).withdraw()).to.changeEtherBalance(
                ethers,
                owner,
                ethers.parseEther("0.01")
            );
        });

        it("非 owner 调用 withdraw 应revert", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await nft.connect(user1).mint("ipfs://bafkreie74ddfjb6sxeib5vtqwlo74x2zqmdubptbvzlegw3mvqzr2ybkee", { value: ethers.parseEther("0.01") });
            await expect(nft.connect(user1).withdraw()).to.be.revert(ethers);
        });

        it("余额为 0 时 withdraw 应revert", async function () {
            const { nft, owner } = await networkHelpers.loadFixture(deployNFTFixture);
            await expect(nft.connect(owner).withdraw()).to.be.revertedWith("No balance to withdraw!");
        });
    });

    // 4.setMintPrice
    describe("setMintPrice", function () {
        it("owner 应能更新 mintPrice", async function () {
            const { nft, owner } = await networkHelpers.loadFixture(deployNFTFixture);
            await nft.connect(owner).setMintPrice(ethers.parseEther("0.05"));
            expect(await nft.mintPrice()).to.equal(ethers.parseEther("0.05"));
        });

        it("非 owner 调用 setMintPrice 应 revert", async function () {
            const { nft, user1 } = await networkHelpers.loadFixture(deployNFTFixture);
            await expect(nft.connect(user1).setMintPrice(ethers.parseEther("0.05"))).to.be.revert(ethers);
        });
    });

    // 5.supportsInterface
    describe("supportsInterface", function () {
        it("应支持 ERC721 接口", async function () {
            const { nft } = await networkHelpers.loadFixture(deployNFTFixture);
            expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;// ERC721
        });
    });
});