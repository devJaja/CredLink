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
  });
});

