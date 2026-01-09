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
    it("Should successfully verify a borrower with valid KYC details", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // First onboard the borrower
      await credlink.connect(borrower).onboardBorrower(
        "John Doe",
        "john@example.com",
        "+1234567890",
        "Tech Corp",
        "USA"
      );
      
      const kycDetail = "KYC verification completed - ID: 12345, Status: Approved";
      
      await expect(
        credlink.connect(borrower).borrowerKYC(kycDetail)
      ).to.not.be.reverted;
    });

    it("Should update borrower verification status after KYC", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "Jane Smith",
        "jane@example.com",
        "+9876543210",
        "Finance Inc",
        "Canada"
      );
      
      const kycDetail = "Verified - Passport: AB123456";
      
      await credlink.connect(borrower).borrowerKYC(kycDetail);
      
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(true);
      expect(borrowerDetails.kycDetails).to.equal(kycDetail);
    });

    it("Should allow different borrowers to complete KYC independently", async function () {
      const { credlink, borrower, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      // Onboard both borrowers
      await credlink.connect(borrower).onboardBorrower(
        "Borrower One",
        "borrower1@example.com",
        "+1111111111",
        "Company One",
        "USA"
      );
      
      await credlink.connect(otherAccount).onboardBorrower(
        "Borrower Two",
        "borrower2@example.com",
        "+2222222222",
        "Company Two",
        "UK"
      );
      
      // Complete KYC for both
      await credlink.connect(borrower).borrowerKYC("KYC Details 1");
      await credlink.connect(otherAccount).borrowerKYC("KYC Details 2");
      
      const borrower1Details = await credlink.getBorrowerDetails(borrower.address);
      const borrower2Details = await credlink.getBorrowerDetails(otherAccount.address);
      
      expect(borrower1Details.isVerified).to.equal(true);
      expect(borrower2Details.isVerified).to.equal(true);
    });

    it("Should revert when trying to verify a non-existent borrower", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Try to verify without onboarding first
      await expect(
        credlink.connect(borrower).borrowerKYC("Some KYC details")
      ).to.be.revertedWith("Borrower does not exist");
    });

    it("Should revert when trying to verify twice", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Onboard and verify once
      await credlink.connect(borrower).onboardBorrower(
        "John Doe",
        "john@example.com",
        "+1234567890",
        "Tech Corp",
        "USA"
      );
      
      await credlink.connect(borrower).borrowerKYC("First KYC verification");
      
      // Try to verify again
      await expect(
        credlink.connect(borrower).borrowerKYC("Second KYC verification")
      ).to.be.revertedWith("cannot verify twice");
    });

    it("Should revert when KYC details are empty", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "John Doe",
        "john@example.com",
        "+1234567890",
        "Tech Corp",
        "USA"
      );
      
      await expect(
        credlink.connect(borrower).borrowerKYC("")
      ).to.be.revertedWith("Invalid KYC details");
    });

    it("Should allow KYC with various detail formats", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "John Doe",
        "john@example.com",
        "+1234567890",
        "Tech Corp",
        "USA"
      );
      
      const kycDetail = "JSON: {\"id\":\"123\",\"status\":\"approved\",\"date\":\"2024-01-01\"}";
      
      await expect(
        credlink.connect(borrower).borrowerKYC(kycDetail)
      ).to.not.be.reverted;
      
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.kycDetails).to.equal(kycDetail);
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full borrower onboarding flow: onboard -> KYC", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Step 1: Onboard borrower
      await credlink.connect(borrower).onboardBorrower(
        "Integration Test User",
        "integration@example.com",
        "+5555555555",
        "Integration Corp",
        "Germany"
      );
      
      let borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(false);
      
      // Step 2: Complete KYC
      await credlink.connect(borrower).borrowerKYC("Integration KYC completed");
      
      borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(true);
      expect(borrowerDetails.name).to.equal("Integration Test User");
    });

    it("Should handle lender and borrower onboarding in parallel", async function () {
      const { credlink, usdt, lender, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Onboard lender
      const liquidityAmount = hre.ethers.parseEther("2000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      await credlink.connect(lender).onboardLender(liquidityAmount, 12, 45);
      
      // Onboard borrower
      await credlink.connect(borrower).onboardBorrower(
        "Parallel Test",
        "parallel@example.com",
        "+6666666666",
        "Parallel Inc",
        "France"
      );
      
      // Verify both were onboarded
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.name).to.equal("Parallel Test");
      
      const contractBalance = await usdt.balanceOf(await credlink.getAddress());
      expect(contractBalance).to.equal(liquidityAmount);
    });

    it("Should maintain state correctly across multiple operations", async function () {
      const { credlink, usdt, lender, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Lender operations
      const amount1 = hre.ethers.parseEther("1000");
      await usdt.approve(await credlink.getAddress(), amount1);
      await credlink.connect(lender).onboardLender(amount1, 10, 30);
      
      // Borrower operations
      await credlink.connect(borrower).onboardBorrower(
        "State Test",
        "state@example.com",
        "+7777777777",
        "State Corp",
        "Japan"
      );
      
      await credlink.connect(borrower).borrowerKYC("State verification");
      
      // Verify final state
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(true);
      
      const contractBalance = await usdt.balanceOf(await credlink.getAddress());
      expect(contractBalance).to.equal(amount1);
    });
  });
});

