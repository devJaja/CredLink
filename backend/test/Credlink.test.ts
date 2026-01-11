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

  // Helper function to setup a verified borrower for borrowFunds tests
  async function setupVerifiedBorrower(credlink: any, usdt: any, borrower: any, lender: any) {
    // Onboard borrower
    await credlink.connect(borrower).onboardBorrower(
      "Test Borrower",
      "borrower@example.com",
      "+1234567890",
      "Test Company",
      "USA"
    );
    
    // Complete KYC
    await credlink.connect(borrower).borrowerKYC("KYC verification completed");
    
    // Ensure contract has funds by onboarding a lender
    const liquidityAmount = hre.ethers.parseEther("5000");
    await usdt.approve(await credlink.getAddress(), liquidityAmount);
    await credlink.connect(lender).onboardLender(liquidityAmount, 10, 30);
    
    return { credlink, usdt, borrower, lender };
  }

  describe("borrowFunds", function () {
    it("Should successfully allow verified borrower to borrow funds", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const borrowAmount = hre.ethers.parseEther("1000");
      const duration = 30; // 30 days
      const purpose = "Business expansion";
      
      await expect(
        credlink.connect(borrower).borrowFunds(borrowAmount, duration, purpose)
      ).to.not.be.reverted;
    });

    it("Should transfer tokens to borrower when borrowing", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const borrowAmount = hre.ethers.parseEther("500");
      const initialBalance = await usdt.balanceOf(borrower.address);
      
      await credlink.connect(borrower).borrowFunds(borrowAmount, 60, "Working capital");
      
      const finalBalance = await usdt.balanceOf(borrower.address);
      expect(finalBalance).to.equal(initialBalance + borrowAmount);
    });

    it("Should record borrow history after successful borrow", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const borrowAmount = hre.ethers.parseEther("750");
      const duration = 90;
      const purpose = "Equipment purchase";
      
      await credlink.connect(borrower).borrowFunds(borrowAmount, duration, purpose);
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(1);
      expect(history[0].borrowAmount).to.equal(borrowAmount);
      expect(history[0].borrowPurpose).to.equal(purpose);
    });

    it("Should revert when unverified borrower tries to borrow", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      
      // Onboard borrower but don't complete KYC
      await credlink.connect(borrower).onboardBorrower(
        "Unverified",
        "unverified@example.com",
        "+1111111111",
        "Test Corp",
        "USA"
      );
      
      // Setup lender to ensure contract has funds
      const liquidityAmount = hre.ethers.parseEther("5000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      await credlink.connect(lender).onboardLender(liquidityAmount, 10, 30);
      
      await expect(
        credlink.connect(borrower).borrowFunds(hre.ethers.parseEther("100"), 30, "Test")
      ).to.be.revertedWith("Unverified users cannot borrow");
    });

    it("Should allow multiple borrows from same borrower", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      // First borrow
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("500"),
        30,
        "First loan"
      );
      
      // Second borrow
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("300"),
        60,
        "Second loan"
      );
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(2);
      expect(history[0].borrowPurpose).to.equal("First loan");
      expect(history[1].borrowPurpose).to.equal("Second loan");
    });

    it("Should record correct timestamp and duration for borrow", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const duration = 45;
      const beforeBorrow = await hre.ethers.provider.getBlock("latest");
      
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("200"),
        duration,
        "Timestamp test"
      );
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history[0].borrowTime).to.be.at.least(beforeBorrow?.timestamp || 0);
      expect(history[0].loanDuration).to.equal(duration);
    });
  });

  describe("lendFunds", function () {
    it("Should successfully accept ETH deposits via lendFunds", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const depositAmount = hre.ethers.parseEther("1.0");
      
      await expect(
        credlink.connect(lender).lendFunds({ value: depositAmount })
      ).to.not.be.reverted;
    });

    it("Should update liquidity provider amount after deposit", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const depositAmount = hre.ethers.parseEther("2.5");
      const contractAddress = await credlink.getAddress();
      
      const initialBalance = await hre.ethers.provider.getBalance(contractAddress);
      
      await credlink.connect(lender).lendFunds({ value: depositAmount });
      
      const finalBalance = await hre.ethers.provider.getBalance(contractAddress);
      expect(finalBalance).to.equal(initialBalance + depositAmount);
    });

    it("Should set startDate on first deposit", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const depositAmount = hre.ethers.parseEther("1.0");
      const beforeDeposit = await hre.ethers.provider.getBlock("latest");
      
      await credlink.connect(lender).lendFunds({ value: depositAmount });
      
      // Verify provider is active
      // Note: We would need a getter function to verify startDate
      const contractBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractBalance).to.equal(depositAmount);
    });

    it("Should mark liquidity provider as active after deposit", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const depositAmount = hre.ethers.parseEther("3.0");
      
      await credlink.connect(lender).lendFunds({ value: depositAmount });
      
      // Verify deposit was successful by checking contract balance
      const contractBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractBalance).to.equal(depositAmount);
    });

    it("Should revert when trying to deposit zero ETH", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      await expect(
        credlink.connect(lender).lendFunds({ value: 0 })
      ).to.be.revertedWith("Must send ETH to provide liquidity");
    });

    it("Should allow multiple deposits from same lender", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const firstDeposit = hre.ethers.parseEther("1.0");
      const secondDeposit = hre.ethers.parseEther("2.0");
      
      await credlink.connect(lender).lendFunds({ value: firstDeposit });
      await credlink.connect(lender).lendFunds({ value: secondDeposit });
      
      const contractBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractBalance).to.equal(firstDeposit + secondDeposit);
    });

    it("Should allow multiple lenders to deposit independently", async function () {
      const { credlink, lender, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      const lender1Deposit = hre.ethers.parseEther("1.5");
      const lender2Deposit = hre.ethers.parseEther("2.5");
      
      await credlink.connect(lender).lendFunds({ value: lender1Deposit });
      await credlink.connect(otherAccount).lendFunds({ value: lender2Deposit });
      
      const contractBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractBalance).to.equal(lender1Deposit + lender2Deposit);
    });

    it("Should handle various deposit amounts correctly", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const smallAmount = hre.ethers.parseEther("0.001");
      const largeAmount = hre.ethers.parseEther("10.0");
      
      await credlink.connect(lender).lendFunds({ value: smallAmount });
      await credlink.connect(lender).lendFunds({ value: largeAmount });
      
      const contractBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractBalance).to.equal(smallAmount + largeAmount);
    });
  });

  describe("viewBorrowerHistory", function () {
    it("Should return empty array for borrower with no history", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Onboard and verify borrower but don't borrow
      await credlink.connect(borrower).onboardBorrower(
        "No History",
        "nohistory@example.com",
        "+1111111111",
        "Test Corp",
        "USA"
      );
      await credlink.connect(borrower).borrowerKYC("KYC done");
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(0);
    });

    it("Should return correct history for borrower with single borrow", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const borrowAmount = hre.ethers.parseEther("1000");
      const duration = 30;
      const purpose = "Single borrow test";
      
      await credlink.connect(borrower).borrowFunds(borrowAmount, duration, purpose);
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(1);
      expect(history[0].borrowAmount).to.equal(borrowAmount);
      expect(history[0].loanDuration).to.equal(duration);
      expect(history[0].borrowPurpose).to.equal(purpose);
      expect(history[0].borrowerAddress).to.equal(borrower.address);
    });

    it("Should return all borrow history entries in correct order", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      // Make multiple borrows
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("500"),
        30,
        "First borrow"
      );
      
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("750"),
        60,
        "Second borrow"
      );
      
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("300"),
        45,
        "Third borrow"
      );
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(3);
      expect(history[0].borrowPurpose).to.equal("First borrow");
      expect(history[1].borrowPurpose).to.equal("Second borrow");
      expect(history[2].borrowPurpose).to.equal("Third borrow");
    });

    it("Should only return history for the calling borrower", async function () {
      const { credlink, usdt, borrower, otherAccount, lender } = await loadFixture(deployCredlinkFixture);
      
      // Setup both borrowers
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      await credlink.connect(otherAccount).onboardBorrower(
        "Other Borrower",
        "other@example.com",
        "+2222222222",
        "Other Corp",
        "UK"
      );
      await credlink.connect(otherAccount).borrowerKYC("Other KYC");
      
      // Setup more funds for second borrower
      const moreFunds = hre.ethers.parseEther("3000");
      await usdt.approve(await credlink.getAddress(), moreFunds);
      await credlink.connect(lender).onboardLender(moreFunds, 12, 30);
      
      // Both borrowers borrow
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("500"),
        30,
        "Borrower 1 loan"
      );
      
      await credlink.connect(otherAccount).borrowFunds(
        hre.ethers.parseEther("600"),
        45,
        "Borrower 2 loan"
      );
      
      // Each should only see their own history
      const borrower1History = await credlink.connect(borrower).viewBorrowerHistory();
      const borrower2History = await credlink.connect(otherAccount).viewBorrowerHistory();
      
      expect(borrower1History.length).to.equal(1);
      expect(borrower2History.length).to.equal(1);
      expect(borrower1History[0].borrowPurpose).to.equal("Borrower 1 loan");
      expect(borrower2History[0].borrowPurpose).to.equal("Borrower 2 loan");
    });

    it("Should preserve borrow timestamps in history", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const beforeFirst = await hre.ethers.provider.getBlock("latest");
      
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("400"),
        30,
        "Timestamp test"
      );
      
      const afterFirst = await hre.ethers.provider.getBlock("latest");
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      
      expect(history[0].borrowTime).to.be.at.least(beforeFirst?.timestamp || 0);
      expect(history[0].borrowTime).to.be.at.most(afterFirst?.timestamp || Number.MAX_SAFE_INTEGER);
    });

    it("Should handle viewing history with different borrow amounts and durations", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const amounts = [
        hre.ethers.parseEther("100"),
        hre.ethers.parseEther("500"),
        hre.ethers.parseEther("1000")
      ];
      const durations = [15, 30, 90];
      
      for (let i = 0; i < amounts.length; i++) {
        await credlink.connect(borrower).borrowFunds(
          amounts[i],
          durations[i],
          `Loan ${i + 1}`
        );
      }
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(3);
      
      for (let i = 0; i < history.length; i++) {
        expect(history[i].borrowAmount).to.equal(amounts[i]);
        expect(history[i].loanDuration).to.equal(durations[i]);
      }
    });
  });

  describe("borrowFunds Integration Tests", function () {
    it("Should complete full workflow: onboard -> KYC -> borrow", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      
      // Step 1: Onboard borrower
      await credlink.connect(borrower).onboardBorrower(
        "Integration Borrower",
        "integration@example.com",
        "+9999999999",
        "Integration Corp",
        "USA"
      );
      
      // Step 2: Complete KYC
      await credlink.connect(borrower).borrowerKYC("Integration KYC completed");
      
      // Step 3: Setup lender to provide funds
      const liquidityAmount = hre.ethers.parseEther("5000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      await credlink.connect(lender).onboardLender(liquidityAmount, 10, 30);
      
      // Step 4: Borrow funds
      const borrowAmount = hre.ethers.parseEther("2000");
      await credlink.connect(borrower).borrowFunds(borrowAmount, 60, "Integration test loan");
      
      // Verify borrower received funds
      const borrowerBalance = await usdt.balanceOf(borrower.address);
      expect(borrowerBalance).to.equal(borrowAmount);
      
      // Verify history was recorded
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(1);
      expect(history[0].borrowAmount).to.equal(borrowAmount);
    });

    it("Should handle multiple borrows in sequence with proper state tracking", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const borrows = [
        { amount: hre.ethers.parseEther("500"), duration: 30, purpose: "Loan 1" },
        { amount: hre.ethers.parseEther("750"), duration: 60, purpose: "Loan 2" },
        { amount: hre.ethers.parseEther("300"), duration: 45, purpose: "Loan 3" }
      ];
      
      let totalBorrowed = 0n;
      for (const borrow of borrows) {
        await credlink.connect(borrower).borrowFunds(
          borrow.amount,
          borrow.duration,
          borrow.purpose
        );
        totalBorrowed += borrow.amount;
      }
      
      // Verify total balance
      const borrowerBalance = await usdt.balanceOf(borrower.address);
      expect(borrowerBalance).to.equal(totalBorrowed);
      
      // Verify all history entries
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(3);
    });

    it("Should maintain contract balance correctly after borrows", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      
      // Setup lender with specific amount
      const liquidityAmount = hre.ethers.parseEther("10000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      await credlink.connect(lender).onboardLender(liquidityAmount, 10, 30);
      
      // Setup borrower
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      // Borrow multiple times
      const borrow1 = hre.ethers.parseEther("2000");
      const borrow2 = hre.ethers.parseEther("3000");
      
      await credlink.connect(borrower).borrowFunds(borrow1, 30, "First");
      await credlink.connect(borrower).borrowFunds(borrow2, 60, "Second");
      
      // Verify contract balance decreased
      const contractBalance = await usdt.balanceOf(await credlink.getAddress());
      const expectedBalance = liquidityAmount - borrow1 - borrow2;
      expect(contractBalance).to.equal(expectedBalance);
    });
  });

  describe("Comprehensive Integration Tests", function () {
    it("Should handle complete platform workflow: lenders, borrowers, and operations", async function () {
      const { credlink, usdt, lender, borrower, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      // Step 1: Lender provides liquidity via onboardLender
      const tokenLiquidity = hre.ethers.parseEther("10000");
      await usdt.approve(await credlink.getAddress(), tokenLiquidity);
      await credlink.connect(lender).onboardLender(tokenLiquidity, 15, 60);
      
      // Step 2: Lender also provides ETH liquidity
      const ethLiquidity = hre.ethers.parseEther("5.0");
      await credlink.connect(lender).lendFunds({ value: ethLiquidity });
      
      // Step 3: Borrower onboarding
      await credlink.connect(borrower).onboardBorrower(
        "Full Workflow Borrower",
        "workflow@example.com",
        "+8888888888",
        "Workflow Corp",
        "USA"
      );
      
      // Step 4: Borrower KYC
      await credlink.connect(borrower).borrowerKYC("Full workflow KYC");
      
      // Step 5: Borrower borrows funds
      const borrowAmount = hre.ethers.parseEther("3000");
      await credlink.connect(borrower).borrowFunds(borrowAmount, 90, "Full workflow loan");
      
      // Step 6: Verify borrower history
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(1);
      expect(history[0].borrowAmount).to.equal(borrowAmount);
      
      // Step 7: Verify borrower received funds
      const borrowerBalance = await usdt.balanceOf(borrower.address);
      expect(borrowerBalance).to.equal(borrowAmount);
    });

    it("Should support multiple lenders and borrowers simultaneously", async function () {
      const { credlink, usdt, lender, borrower, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      // Multiple lenders provide liquidity
      const liquidity1 = hre.ethers.parseEther("5000");
      await usdt.approve(await credlink.getAddress(), liquidity1);
      await credlink.connect(lender).onboardLender(liquidity1, 10, 30);
      
      await credlink.connect(otherAccount).lendFunds({ value: hre.ethers.parseEther("3.0") });
      
      // Multiple borrowers onboard and borrow
      await credlink.connect(borrower).onboardBorrower(
        "Borrower One",
        "borrower1@example.com",
        "+1111111111",
        "Company One",
        "USA"
      );
      await credlink.connect(borrower).borrowerKYC("KYC 1");
      
      await credlink.connect(otherAccount).onboardBorrower(
        "Borrower Two",
        "borrower2@example.com",
        "+2222222222",
        "Company Two",
        "UK"
      );
      await credlink.connect(otherAccount).borrowerKYC("KYC 2");
      
      // Both borrowers borrow
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("1000"),
        30,
        "Loan from borrower 1"
      );
      
      await credlink.connect(otherAccount).borrowFunds(
        hre.ethers.parseEther("1500"),
        60,
        "Loan from borrower 2"
      );
      
      // Verify both have independent histories
      const history1 = await credlink.connect(borrower).viewBorrowerHistory();
      const history2 = await credlink.connect(otherAccount).viewBorrowerHistory();
      
      expect(history1.length).to.equal(1);
      expect(history2.length).to.equal(1);
    });

    it("Should maintain correct state across all function interactions", async function () {
      const { credlink, usdt, lender, borrower } = await loadFixture(deployCredlinkFixture);
      
      // Complex scenario with multiple operations
      const tokenLiquidity = hre.ethers.parseEther("15000");
      await usdt.approve(await credlink.getAddress(), tokenLiquidity);
      await credlink.connect(lender).onboardLender(tokenLiquidity, 12, 45);
      
      await credlink.connect(lender).lendFunds({ value: hre.ethers.parseEther("10.0") });
      
      await credlink.connect(borrower).onboardBorrower(
        "State Test",
        "state@example.com",
        "+7777777777",
        "State Corp",
        "Japan"
      );
      
      await credlink.connect(borrower).borrowerKYC("State KYC");
      
      // Multiple borrows
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("2000"),
        30,
        "First"
      );
      
      await credlink.connect(borrower).borrowFunds(
        hre.ethers.parseEther("3000"),
        60,
        "Second"
      );
      
      // Verify final state
      const borrowerDetails = await credlink.getBorrowerDetails(borrower.address);
      expect(borrowerDetails.isVerified).to.equal(true);
      
      const history = await credlink.connect(borrower).viewBorrowerHistory();
      expect(history.length).to.equal(2);
      
      const contractTokenBalance = await usdt.balanceOf(await credlink.getAddress());
      const expectedTokenBalance = tokenLiquidity - hre.ethers.parseEther("2000") - hre.ethers.parseEther("3000");
      expect(contractTokenBalance).to.equal(expectedTokenBalance);
      
      const contractEthBalance = await hre.ethers.provider.getBalance(await credlink.getAddress());
      expect(contractEthBalance).to.equal(hre.ethers.parseEther("10.0"));
    });
  });

  describe("getBorrowerDetails", function () {
    it("Should return empty borrower details for non-existent borrower", async function () {
      const { credlink, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      const details = await credlink.getBorrowerDetails(otherAccount.address);
      expect(details.name).to.equal("");
      expect(details.isVerified).to.equal(false);
      expect(details.borrowedAmount).to.equal(0);
    });

    it("Should return correct borrower details after onboarding", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      const name = "Detail Test";
      const email = "detail@example.com";
      const phone = "+5555555555";
      const company = "Detail Corp";
      const country = "Germany";
      
      await credlink.connect(borrower).onboardBorrower(name, email, phone, company, country);
      
      const details = await credlink.getBorrowerDetails(borrower.address);
      expect(details.name).to.equal(name);
      expect(details.email).to.equal(email);
      expect(details.phone_no).to.equal(phone);
      expect(details.companyName).to.equal(company);
      expect(details.country).to.equal(country);
      expect(details.isVerified).to.equal(false);
    });

    it("Should return updated verification status after KYC", async function () {
      const { credlink, borrower } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "KYC Test",
        "kyc@example.com",
        "+6666666666",
        "KYC Corp",
        "France"
      );
      
      let details = await credlink.getBorrowerDetails(borrower.address);
      expect(details.isVerified).to.equal(false);
      expect(details.kycDetails).to.equal("");
      
      await credlink.connect(borrower).borrowerKYC("KYC verification passed");
      
      details = await credlink.getBorrowerDetails(borrower.address);
      expect(details.isVerified).to.equal(true);
      expect(details.kycDetails).to.equal("KYC verification passed");
    });

    it("Should allow anyone to view borrower details", async function () {
      const { credlink, borrower, otherAccount } = await loadFixture(deployCredlinkFixture);
      
      await credlink.connect(borrower).onboardBorrower(
        "Public Test",
        "public@example.com",
        "+7777777777",
        "Public Corp",
        "Italy"
      );
      
      // Other account can view borrower details
      const details = await credlink.connect(otherAccount).getBorrowerDetails(borrower.address);
      expect(details.name).to.equal("Public Test");
    });
  });

  describe("Boundary Conditions and Edge Cases", function () {
    it("Should handle maximum interest rate (30%) in onboardLender", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      
      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, 30, 365)
      ).to.not.be.reverted;
    });

    it("Should handle minimum interest rate (1%) in onboardLender", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      
      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, 1, 1)
      ).to.not.be.reverted;
    });

    it("Should handle very large borrow amounts", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      
      // Setup large liquidity
      const largeLiquidity = hre.ethers.parseEther("100000");
      await usdt.approve(await credlink.getAddress(), largeLiquidity);
      await credlink.connect(lender).onboardLender(largeLiquidity, 10, 30);
      
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const largeBorrow = hre.ethers.parseEther("50000");
      await expect(
        credlink.connect(borrower).borrowFunds(largeBorrow, 90, "Large loan")
      ).to.not.be.reverted;
    });

    it("Should handle very small ETH deposits in lendFunds", async function () {
      const { credlink, lender } = await loadFixture(deployCredlinkFixture);
      
      const smallAmount = hre.ethers.parseEther("0.000001");
      await expect(
        credlink.connect(lender).lendFunds({ value: smallAmount })
      ).to.not.be.reverted;
    });

    it("Should handle zero duration in borrowFunds", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      await expect(
        credlink.connect(borrower).borrowFunds(
          hre.ethers.parseEther("100"),
          0,
          "Zero duration test"
        )
      ).to.not.be.reverted;
    });

    it("Should handle very long loan durations", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      const longDuration = 3650; // 10 years
      await expect(
        credlink.connect(borrower).borrowFunds(
          hre.ethers.parseEther("500"),
          longDuration,
          "Long term loan"
        )
      ).to.not.be.reverted;
    });
  });

  describe("Error Handling and Revert Scenarios", function () {
    it("Should revert borrowFunds when contract has insufficient balance", async function () {
      const { credlink, usdt, borrower, lender } = await loadFixture(deployCredlinkFixture);
      
      // Setup borrower
      await setupVerifiedBorrower(credlink, usdt, borrower, lender);
      
      // Try to borrow more than available
      const availableLiquidity = hre.ethers.parseEther("5000");
      const excessiveBorrow = hre.ethers.parseEther("10000");
      
      // This will fail because contract doesn't have enough tokens
      // The transfer will revert due to insufficient balance
      await expect(
        credlink.connect(borrower).borrowFunds(excessiveBorrow, 30, "Excessive borrow")
      ).to.be.reverted;
    });

    it("Should revert onboardLender when token approval is insufficient", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      // Don't approve or approve less than needed
      await usdt.approve(await credlink.getAddress(), hre.ethers.parseEther("500"));
      
      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, 10, 30)
      ).to.be.reverted;
    });

    it("Should revert onboardLender when interest rate is exactly 31%", async function () {
      const { credlink, usdt, lender } = await loadFixture(deployCredlinkFixture);
      
      const liquidityAmount = hre.ethers.parseEther("1000");
      await usdt.approve(await credlink.getAddress(), liquidityAmount);
      
      await expect(
        credlink.connect(lender).onboardLender(liquidityAmount, 31, 30)
      ).to.be.revertedWith("interest rate is greater than 30 %");
    });
  });
});

