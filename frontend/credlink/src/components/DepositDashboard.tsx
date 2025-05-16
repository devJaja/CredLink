import React, { useState, useEffect } from "react";
import { parseEther, formatEther } from "viem";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
  useSimulateContract
} from "wagmi";
import CredlinkABI from "../ABI/Credlink.json";

// Ensure addresses are properly sanitized
const CREDLINK_ADDRESS = import.meta.env.VITE_CREDLINK_CONTRACT_ADDRESS?.replace(/[;,\s]/g, '');

export default function DepositDashboard({
  onConfirm,
  onAllocationChange,
  currentAllocations = { low: 40, medium: 40, high: 20 }, // Default allocations
}) {
  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState({ ...currentAllocations });
  const [txHash, setTxHash] = useState(null);
  const [step, setStep] = useState("idle");
  const [gasLimit, setGasLimit] = useState("300000");
  const [txDetails, setTxDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { address, isConnected } = useAccount();

  // Calculate total allocation for validation
  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  // Read contract data
  const { data: lenderData, isLoading: isLenderDataLoading } = useReadContract({
    address: CREDLINK_ADDRESS,
    abi: CredlinkABI,
    functionName: "liquidityProvider",
    args: [address],
    watch: true,
    enabled: !!address,
  });

  // Check user's ETH balance
  const { data: ethBalance } = useReadContract({
    address: null, // No address needed for ETH balance
    abi: [],
    functionName: "getBalance",
    args: [address],
    watch: true,
    enabled: !!address,
  });

  // Get current liquidity amount
  const currentLiquidity = lenderData?.liquidityAmount 
    ? Number(formatEther(lenderData.liquidityAmount.toString()))
    : 0;

  // Format balance
  const formattedBalance = ethBalance ? Number(formatEther(ethBalance)).toFixed(4) : "0.0000";

  // Simulate deposit transaction
  const { data: simulateDeposit, error: simulateDepositError } = useSimulateContract({
    address: CREDLINK_ADDRESS,
    abi: CredlinkABI,
    functionName: "lendFunds",
    args: [],
    account: address,
    value: amount ? parseEther(amount.toString()) : undefined,
    query: {
      enabled: !!amount && parseFloat(amount) > 0 && !!address,
      retry: false,
    },
  });

  // Contract write for deposit
  const {
    data: depositHash,
    writeContract: depositFunds,
    isPending: isDepositing,
    error: depositError,
  } = useWriteContract();

  // Transaction receipt
  const { isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  useEffect(() => {
    // Monitor transaction errors
    if (depositError) {
      console.warn("Deposit transaction error:", depositError);
    }
  }, [depositError]);
  
  // Update parent component about allocation changes
  useEffect(() => {
    onAllocationChange?.(allocations);
  }, [allocations, onAllocationChange]);

  // Handle successful deposit
  useEffect(() => {
    if (depositSuccess) {
      setStep("done");
      setTxHash(depositHash);
      onConfirm?.(parseFloat(amount || "0"));
      
      setTxDetails({
        hash: depositHash,
        amount: parseFloat(amount || "0").toFixed(4),
        timestamp: new Date().toLocaleString(),
      });
      
      setAmount("");
      setIsLoading(false);
    }
  }, [depositSuccess, depositHash, onConfirm, amount]);

  // Update loading state
  useEffect(() => {
    setIsLoading(isDepositing);
  }, [isDepositing]);

  const handleAllocationChange = (tier, value) => {
    const parsedValue = Number(value);
    if (isNaN(parsedValue)) return;

    const newAllocations = { ...allocations, [tier]: parsedValue };
    const newTotal = Object.values(newAllocations).reduce((sum, val) => sum + val, 0);

    if (newTotal <= 100) {
      setAllocations(newAllocations);
    }
  };

  const handleMaxAmount = () => {
    if (ethBalance) {
      // Leave some ETH for gas
      const maxAmount = Number(formatEther(ethBalance)) - 0.01;
      if (maxAmount > 0) {
        setAmount(maxAmount.toString());
      }
    }
  };

  const handleConfirm = async () => {
    if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      return;
    }

    try {
      setStep("deposit");
      setIsLoading(true);
      
      const parsedAmount = parseEther(amount.toString());
      
      console.log("Depositing ETH:", {
        amount: parsedAmount.toString(),
        formattedAmount: amount,
        contract: CREDLINK_ADDRESS
      });

      // Directly call lendFunds with ETH value
      depositFunds({
        abi: CredlinkABI,
        address: CREDLINK_ADDRESS,
        functionName: "lendFunds",
        args: [],
        gas: gasLimit ? BigInt(gasLimit) : undefined,
        value: parsedAmount, // Send ETH with the transaction
      });
    } catch (error) {
      console.error("Error in deposit:", error);
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return error;
    }
    
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes("insufficient funds")) {
      return "Insufficient ETH balance to pay for transaction and deposit amount.";
    }
    
    if (errorMsg.includes("reverted")) {
      return "Transaction reverted by the contract. This might be due to a configuration issue.";
    }
    
    return errorMsg;
  };

  // Calculate APY and yield estimates
  const totalAPY =
    (allocations.low * 8 + allocations.medium * 12 + allocations.high * 18) /
    100;
  const estimatedYield = (
    ((parseFloat(amount || 0) * totalAPY) / 100) || 0
  ).toFixed(4);

  // Risk breakdown for information display
  const riskBreakdown = [
    { tier: "low", label: "Low Risk (8% APY)", color: "bg-green-200" },
    { tier: "medium", label: "Medium Risk (12% APY)", color: "bg-yellow-200" },
    { tier: "high", label: "High Risk (18% APY)", color: "bg-red-200" }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold">Deposit ETH</h2>
      
      {isLenderDataLoading ? (
        <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm">
          Loading account data...
        </div>
      ) : null}

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Amount (ETH)</label>
          <span className="text-xs text-gray-500">Balance: {formattedBalance} ETH</span>
        </div>
        <div className="relative">
          <input
            type="number"
            className="w-full p-3 border rounded-xl"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.001"
            disabled={isLoading}
          />
          <button 
            onClick={handleMaxAmount}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-semibold"
            disabled={isLoading || !ethBalance}
          >
            MAX
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Risk Allocation</h3>
        <div className="h-8 flex rounded-lg overflow-hidden">
          {riskBreakdown.map(({ tier, color }) => (
            allocations[tier] > 0 && (
              <div 
                key={tier}
                className={`${color} h-full`}
                style={{ width: `${allocations[tier]}%` }}
              />
            )
          ))}
        </div>
        
        {riskBreakdown.map(({ label, tier }) => (
          <div key={tier}>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <span className="text-sm text-gray-700">{allocations[tier]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={allocations[tier]}
              onChange={(e) => handleAllocationChange(tier, e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        ))}
        
        {totalAllocation !== 100 && (
          <p className={`text-sm ${totalAllocation > 100 ? 'text-red-500' : 'text-yellow-500'}`}>
            {totalAllocation > 100 
              ? "Total allocation exceeds 100%"
              : totalAllocation < 100 
                ? `Total allocation: ${totalAllocation}% (should be 100%)`
                : ""}
          </p>
        )}
      </div>

      <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <p><strong>Current Deposit:</strong></p>
          <p className="text-right">{currentLiquidity.toFixed(4)} ETH</p>
          
          <p><strong>New Deposit:</strong></p>
          <p className="text-right">{parseFloat(amount || 0).toFixed(4)} ETH</p>
          
          <p><strong>ETH Balance:</strong></p>
          <p className="text-right">{formattedBalance} ETH</p>
          
          <p><strong>Estimated APY:</strong></p>
          <p className="text-right">{totalAPY.toFixed(1)}%</p>
          
          <p><strong>Projected Annual Yield:</strong></p>
          <p className="text-right">{estimatedYield} ETH</p>
        </div>
      </div>

      {simulateDepositError && (
        <div className="mt-2 text-red-500 text-sm p-2 bg-red-50 rounded-lg">
          <p><strong>Transaction would fail:</strong></p>
          <p>{getErrorMessage(simulateDepositError)}</p>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={
          !isConnected ||
          totalAllocation !== 100 ||
          !amount ||
          parseFloat(amount) <= 0 ||
          isLoading
        }
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected 
          ? "Connect Wallet"
          : isDepositing
            ? "Depositing ETH..."
            : "Confirm Deposit"}
      </button>

      {depositError && (
        <p className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-lg">
          {getErrorMessage(depositError)}
        </p>
      )}

      {depositSuccess && txDetails && (
        <div className="bg-green-50 p-4 rounded-xl mt-4">
          <p className="text-green-600 font-semibold">Deposit Successful!</p>
          <div className="text-sm mt-2 space-y-1">
            <p><strong>Amount:</strong> {txDetails.amount} ETH</p>
            <p><strong>Date:</strong> {txDetails.timestamp}</p>
            <p><strong>Transaction:</strong>{" "}
              <a
                href={`https://sepolia.basescan.org/tx/${txDetails.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View on Base Sepolia Explorer
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="mt-2">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500">Advanced Settings</summary>
          <div className="mt-2 p-2 border rounded">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gas Limit</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg text-sm"
              placeholder="300000"
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </details>
      </div>

      <div className="text-xs text-gray-500 text-center">
        {isConnected 
          ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)} • Network: Base Sepolia`
          : "Not connected • Network: Base Sepolia"
        }
      </div>
    </div>
  );
}