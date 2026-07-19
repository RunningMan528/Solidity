import { expect } from "chai";
import { network } from "hardhat";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const { ethers, networkHelpers } = await network.create();

describe("MultiSigWalletUpgradeable", function () {
  async function deployWallet(
    owners: string[],
    numConfirmationsRequired: bigint,
    proxyAdminOwner: string,
  ) {
    const implementation = await ethers.deployContract("MultiSigWalletUpgradeable");
    const initData = implementation.interface.encodeFunctionData("initialize", [
      owners,
      numConfirmationsRequired,
    ]);
    const proxy = await ethers.deployContract("TransparentUpgradeableProxy", [
      await implementation.getAddress(),
      proxyAdminOwner,
      initData,
    ]);

    return ethers.getContractAt(
      "MultiSigWalletUpgradeable",
      await proxy.getAddress(),
    );
  }

  async function deployMultiSigFixture() {
    const [owner1, owner2, owner3, nonOwner, recipient] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const numConfirmationsRequired = 2n;
    const wallet = await deployWallet(
      owners,
      numConfirmationsRequired,
      owner1.address,
    );

    return {
      wallet,
      owner1,
      owner2,
      owner3,
      nonOwner,
      recipient,
      owners,
      numConfirmationsRequired,
    };
  }

  describe("Deployment", function () {
    it("Should deploy and initialize the proxy with correct owners and threshold", async function () {
      const { wallet, owners, numConfirmationsRequired } =
        await networkHelpers.loadFixture(deployMultiSigFixture);

      expect(await wallet.getOwners()).to.deep.equal(owners);
      expect(await wallet.getThreshold()).to.equal(numConfirmationsRequired);
    });

    it("Should revert when initialized with a zero address", async function () {
      const [owner] = await ethers.getSigners();

      await expect(
        deployWallet([ethers.ZeroAddress, owner.address], 1n, owner.address),
      ).to.be.revertedWith("Invalid owner");
    });

    it("Should revert when initialized with an invalid threshold", async function () {
      const [owner1, owner2] = await ethers.getSigners();
      const owners = [owner1.address, owner2.address];

      await expect(deployWallet(owners, 0n, owner1.address)).to.be.revertedWith(
        "Invalid number of required confirmations",
      );
      await expect(deployWallet(owners, 3n, owner1.address)).to.be.revertedWith(
        "Invalid number of required confirmations",
      );
    });

    it("Should not allow the proxy to be initialized twice", async function () {
      const { wallet, owners, numConfirmationsRequired } =
        await networkHelpers.loadFixture(deployMultiSigFixture);

      await expect(
        wallet.initialize(owners, numConfirmationsRequired),
      ).to.be.revertedWithCustomError(wallet, "InvalidInitialization");
    });
  });

  describe("Owner Management", function () {
    it("Should add new owner", async function () {
      const { wallet, nonOwner } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (await wallet.addOwner(nonOwner.address)).wait();

      expect(await wallet.isOwner(nonOwner.address)).to.be.true;
      expect(await wallet.getOwnerCount()).to.equal(4n);
    });

    it("Should remove owner", async function () {
      const { wallet, owner3 } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (await wallet.removeOwner(owner3.address)).wait();

      expect(await wallet.isOwner(owner3.address)).to.be.false;
      expect(await wallet.getOwnerCount()).to.equal(2n);
    });

    it("Should change threshold", async function () {
      const { wallet } = await networkHelpers.loadFixture(deployMultiSigFixture);

      await (await wallet.changeThreshold(3n)).wait();

      expect(await wallet.getThreshold()).to.equal(3n);
    });

    it("Should revert when a non-owner tries to add an owner", async function () {
      const { wallet, nonOwner, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await expect(
        wallet.connect(nonOwner).addOwner(recipient.address),
      ).to.be.revertedWith("Not an owner");
    });
  });

  describe("Transaction Proposal", function () {
    it("Should submit transaction", async function () {
      const { wallet, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );
      const value = ethers.parseEther("1");

      await (await wallet.submitTransaction(recipient.address, value, "0x")).wait();

      const transaction = await wallet.getTransaction(0);
      expect(transaction.to).to.equal(recipient.address);
      expect(transaction.value).to.equal(value);
      expect(transaction.executed).to.be.false;
      expect(transaction.numConfirmations).to.equal(0n);
    });

    it("Should get transaction count", async function () {
      const { wallet, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("1"), "0x")
      ).wait();
      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("2"), "0x")
      ).wait();

      expect(await wallet.getTransactionCount()).to.equal(2n);
    });
  });

  describe("Confirmation Mechanism", function () {
    it("Should confirm transaction", async function () {
      const { wallet, owner1, owner2, recipient } =
        await networkHelpers.loadFixture(deployMultiSigFixture);

      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("1"), "0x")
      ).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();
      await (await wallet.connect(owner2).confirmTransaction(0)).wait();

      expect(await wallet.getConfirmationCount(0)).to.equal(2n);
      expect(await wallet.isTransactionConfirmed(0, owner1.address)).to.be.true;
      expect(await wallet.isTransactionConfirmed(0, owner2.address)).to.be.true;
    });

    it("Should revoke confirmation", async function () {
      const { wallet, owner1, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("1"), "0x")
      ).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();
      await (await wallet.connect(owner1).revokeConfirmation(0)).wait();

      expect(await wallet.getConfirmationCount(0)).to.equal(0n);
      expect(await wallet.isTransactionConfirmed(0, owner1.address)).to.be.false;
    });

    it("Should revert when confirming twice", async function () {
      const { wallet, owner1, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("1"), "0x")
      ).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();

      await expect(wallet.connect(owner1).confirmTransaction(0)).to.be.revertedWith(
        "Transaction already confirmed",
      );
    });
  });

  describe("Execute Transaction", function () {
    it("Should execute ETH transfer", async function () {
      const { wallet, owner1, owner2, recipient } =
        await networkHelpers.loadFixture(deployMultiSigFixture);
      const value = ethers.parseEther("1");

      await (
        await owner1.sendTransaction({
          to: await wallet.getAddress(),
          value: ethers.parseEther("2"),
        })
      ).wait();
      await (await wallet.submitTransaction(recipient.address, value, "0x")).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();
      await (await wallet.connect(owner2).confirmTransaction(0)).wait();

      await expect(wallet.connect(owner1).executeTransaction(0)).to.changeEtherBalances(
        ethers,
        [wallet, recipient],
        [-value, value],
      );

      expect((await wallet.getTransaction(0)).executed).to.be.true;
      expect(await wallet.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("Should revert when executing twice", async function () {
      const { wallet, owner1, owner2, recipient } =
        await networkHelpers.loadFixture(deployMultiSigFixture);
      const value = ethers.parseEther("1");

      await (
        await owner1.sendTransaction({
          to: await wallet.getAddress(),
          value: ethers.parseEther("2"),
        })
      ).wait();
      await (await wallet.submitTransaction(recipient.address, value, "0x")).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();
      await (await wallet.connect(owner2).confirmTransaction(0)).wait();
      await (await wallet.connect(owner1).executeTransaction(0)).wait();

      await expect(wallet.connect(owner1).executeTransaction(0)).to.be.revertedWith(
        "Transaction already executed",
      );
    });

    it("Should revert when not enough confirmations", async function () {
      const { wallet, owner1, recipient } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );

      await (
        await wallet.submitTransaction(recipient.address, ethers.parseEther("1"), "0x")
      ).wait();
      await (await wallet.connect(owner1).confirmTransaction(0)).wait();

      await expect(wallet.connect(owner1).executeTransaction(0)).to.be.revertedWith(
        "Cannot execute: not enough confirmations",
      );
    });
  });

  describe("Receive ETH", function () {
    it("Should receive ETH and emit event", async function () {
      const { wallet, owner1 } = await networkHelpers.loadFixture(
        deployMultiSigFixture,
      );
      const value = ethers.parseEther("1");

      await expect(
        owner1.sendTransaction({ to: await wallet.getAddress(), value }),
      )
        .to.emit(wallet, "Deposit")
        .withArgs(owner1.address, value);

      expect(await wallet.getBalance()).to.equal(value);
    });
  });
});
