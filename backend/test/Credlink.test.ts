import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Contract } from "ethers";

describe("Credlink Contract Tests", function () {
  // Fixture to deploy contracts and setup test environment
  async function deployCredlinkFixture() {
    const [owner, lender, borrower, otherAccount] = await hre.ethers.getSigners();

    // Deploy USDT token contract
    const USDT = await hre.ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy();

    // Deploy Credlink contract with USDT address
    const Credlink = await hre.ethers.getContractFactory("Credlink");
    const credlink = await Credlink.deploy(await usdt.getAddress());

    // Mint some USDT tokens to lender for testing
    const mintAmount = hre.ethers.parseEther("10000");
    await usdt.mint(mintAmount / hre.ethers.parseEther("1"));

    return { credlink, usdt, owner, lender, borrower, otherAccount };
  }

  describe("onboardLender", function () {
    it("Should successfully onboard a lender with valid parameters", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      const interestRate = 10; // 10%
      const timeLockInDays = 30;

      // Approve tokens for transfer
      await usdt.approve(await credlink.getAddress(), liquidityAmount);

      // Onboard lender
      await expect(credlink.connect(lender).onboardLender(liquidityAmount, interestRate, timeLockInDays))
        .to.not.be.reverted;

      // Verify lender was onboarded
      // Note: We'll add getter functions or events to verify state
    });

    it("Should transfer tokens from lender to contract", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("500");
      const interestRate = 15;
      const timeLockInDays = 60;

      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      
      const contractAddress = await credlink.getAddress();
      const initialContractBalance = await usdt.balanceOf(contractAddress);
      
      await credlink.connect(lender).onboardLender(liquidityAmount, interestRate, timeLockInDays);
      
      const finalContractBalance = await usdt.balanceOf(contractAddress);
      expect(finalContractBalance).to.equal(initialContractBalance + liquidityAmount);
    });

    it("Should revert when interest rate is zero", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      const interestRate = 0; // Invalid: zero interest rate
      const timeLockInDays = 30;

      await usdt.approve(await credlink.getAddress(), liquidityAmount);

      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, interestRate, timeLockInDays)
      ).to.be.revertedWith("interest rate is less than zero");
    });

    it("Should revert when interest rate exceeds 30%", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      const interestRate = 31; // Invalid: exceeds 30%
      const timeLockInDays = 30;

      await usdt.approve(await credlink.getAddress(), liquidityAmount);

      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, interestRate, timeLockInDays)
      ).to.be.revertedWith("interest rate is greater than 30 %");
    });

    it("Should accept maximum allowed interest rate of 30%", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      const interestRate = 30; // Maximum allowed
      const timeLockInDays = 30;

      await usdt.approve(await credlink.getAddress(), liquidityAmount);

      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, interestRate, timeLockInDays)
      ).to.not.be.reverted;
    });
  });

  describe("onboardBorrower", function () {
    // Test cases will be added in subsequent commits
  });

  describe("borrowerKYC", function () {
    // Test cases will be added in subsequent commits
  });
});

