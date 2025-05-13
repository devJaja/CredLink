// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import  "./interface/IERC20.sol";

contract Credlink {
    address tokenAddress;

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    struct LiquidityProvider {
        address providerAddress;
        uint256 liquidityAmount;
        uint256 interestGenerated;
        uint256 timeLock;
        uint256 startDate;
        bool isActive;
    }

    struct Borrower {
        address borrowerAddress;
        string name;
        string email;
        string phone_no;
        string companyName;
        bool isVerified;
        string kycDetails;
        uint256 borrowedAmount;
    }

    struct borrowHistory {
        address borrowerAddress;
        uint256 borrowAmount;
        uint256 borrowTime;
        uint256 loanDuration;
        string borrowPurpose;
    }

    mapping(uint256 => address) liquidityPool;
    mapping(address => LiquidityProvider) liquidityProvider;
    mapping (address => Borrower) borrowerDetails;
    mapping(address => borrowHistory[]) borrowerHistory;


    function onboardLender(uint256 _liquidityAmount, uint256 _interestRate, uint256 _timeLockInDays) external {
        require(_interestRate > 0, "interest rate is less than zero");
        require(_interestRate <= 30, "interest rate is greater than 30 %");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _liquidityAmount);


        LiquidityProvider memory provider = LiquidityProvider({
            providerAddress: msg.sender,
            liquidityAmount: _liquidityAmount,
            interestGenerated: 0,
            timeLock: _timeLockInDays,
            startDate: block.timestamp,
            isActive: true
        });

        liquidityProvider[msg.sender] = provider;

    }

    function onboardBorrower(string memory _name, string memory _email, string memory _phone_no, string memory _company_name) external {
        require(msg.sender != address(0), "Invalid address");

        Borrower memory borrower = Borrower({
            borrowerAddress: msg.sender,
            name: _name,
            email: _email,
            phone_no: _phone_no,
            companyName: _company_name,
            isVerified: false,
            kycDetails: "",
            borrowedAmount: 0
        });


        borrowerDetails[msg.sender] = borrower;
    }

    function borrowerKYC(string memory _kycDetail) external {
        Borrower storage borrower = borrowerDetails[msg.sender];
        
        require(borrower.isVerified == false, "cannot verify twice");
        require(bytes(borrower.name).length > 0, "Borrower does not exist");

        require(bytes(_kycDetail).length > 0, "Invalid KYC details");

        borrower.kycDetails = _kycDetail;
        borrower.isVerified = true;

    }

    function borrowFunds(uint256 _amount, uint256 _duration, string memory _purpose) external {
        require(borrowerDetails[msg.sender].isVerified == true, "Unverified users cannot borrow");

        borrowHistory memory history = borrowHistory({
            borrowerAddress: msg.sender,
            borrowAmount: _amount,
            borrowTime: block.timestamp,
            loanDuration: _duration,
            borrowPurpose: _purpose
        });

        borrowerHistory[msg.sender].push(history);


        // Need to add a way of checking borrow history before
        // approving borrow

        IERC20(tokenAddress).transfer(borrowerDetails[msg.sender].borrowerAddress, _amount);


    }

    function lendFunds(uint256 _amount) external {
        require(liquidityProvider[msg.sender].isActive == true, "Not an active lender");

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);

        liquidityProvider[msg.sender].liquidityAmount += _amount;
    }

    // Read functions

    function viewBorrowerHistory() external view returns(borrowHistory[] memory history){
        history = borrowerHistory[msg.sender];
    }





}
