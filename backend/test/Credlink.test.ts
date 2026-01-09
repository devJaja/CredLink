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
    it("Should successfully onboard a borrower with valid details", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      const name = "John Doe";
      const email = "john.doe@example.com";
      const phone_no = "+1234567890";
      const company_name = "Tech Corp";
      const country = "USA";

      await expect(
        credlink.connect(borrower).onboardBorrower(name, email, phone_no, company_name, country)
      ).to.not.be.reverted;
    });

    it("Should store borrower details correctly", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      const name = "Jane Smith";
      const email = "jane.smith@example.com";
      const phone_no = "+9876543210";
      const company_name = "Finance Inc";
      const country = "Canada";

      await credlink.connect(borrower).onboardBorrower(name, email, phone_no, company_name, country);
      
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.name).to.equal(name);
      expect(borrowerDetails.email).to.equal(email);
      expect(borrowerDetails.phone_no).to.equal(phone_no);
      expect(borrowerDetails.companyName).to.equal(company_name);
      expect(borrowerDetails.country).to.equal(country);
    });

    it("Should initialize borrower with unverified status", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "Test User",
        "test@example.com",
        "+1111111111",
        "Test Company",
        "UK"
      );
      
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(false);
      expect(borrowerDetails.borrowedAmount).to.equal(0);
      expect(borrowerDetails.kycDetails).to.equal("");
    });

    it("Should allow multiple borrowers to be onboarded", async function () {
      const { credlink, borrower, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      // Onboard first borrower
      await credlink.connect(borrower).onboardBorrower(
        "Borrower One",
        "borrower1@example.com",
        "+1111111111",
        "Company One",
        "USA"
      );
      
      // Onboard second borrower
      await credlink.connect(otherAccount).onboardBorrower(
        "Borrower Two",
        "borrower2@example.com",
        "+2222222222",
        "Company Two",
        "UK"
      );
      
      const borrower1Details = await credlink.getBorrowerDetails(borrower.address);
      const borrower2Details = await credlink.getBorrowerDetails(otherAccount.address);
      
      expect(borrower1Details.name).to.equal("Borrower One");
      expect(borrower2Details.name).to.equal("Borrower Two");
    });

    it("Should allow borrower to update their details by re-onboarding", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Initial onboarding
      await credlink.connect(borrower).onboardBorrower(
        "Original Name",
        "original@example.com",
        "+1111111111",
        "Original Company",
        "USA"
      );
      
      // Re-onboard with new details
      await credlink.connect(borrower).onboardBorrower(
        "Updated Name",
        "updated@example.com",
        "+9999999999",
        "Updated Company",
        "Canada"
      );
      
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.name).to.equal("Updated Name");
      expect(borrowerDetails.email).to.equal("updated@example.com");
    });
  });

  describe("borrowerKYC", function () {
    // Test cases will be added in subsequent commits
  });
});

