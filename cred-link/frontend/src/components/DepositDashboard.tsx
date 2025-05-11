import React, { useState, useEffect } from "react";

export default function DepositDashboard({ onConfirm, onAllocationChange, currentAllocations }) {
  const [amount, setAmount] = useState(0);
  const [allocations, setAllocations] = useState(currentAllocations);

  const totalAllocation = allocations.low + allocations.medium + allocations.high;

  useEffect(() => {
    onAllocationChange?.(allocations);
  }, [allocations, onAllocationChange]);

  const handleAllocationChange = (tier, value) => {
    const parsedValue = Number(value);
    if (isNaN(parsedValue)) return;

    const newAllocations = { ...allocations, [tier]: parsedValue };
    const newTotal = newAllocations.low + newAllocations.medium + newAllocations.high;
    if (newTotal <= 100) {
      setAllocations(newAllocations);
    }
  };

  const handleConfirm = () => {
    if (amount > 0 && totalAllocation <= Infinity) {
      onConfirm(amount);
      setAmount(0);
    }
  };

  const totalAPY =
    (allocations.low * 8 + allocations.medium * 12 + allocations.high * 18) / 100;

  const estimatedYield = ((amount * totalAPY) / 100).toFixed(2);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold">Deposit Funds</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
        <input
          type="number"
          className="w-full p-3 border rounded-xl"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <p className="text-xs text-gray-400 mt-1">Available: 12,500 USDC</p>
      </div>

      {/* Allocation sliders */}
      <div className="space-y-4">
        {[
          { label: "Low Risk (8% APY)", tier: "low" },
          { label: "Medium Risk (12% APY)", tier: "medium" },
          { label: "High Risk (18% APY)", tier: "high" },
        ].map(({ label, tier }) => (
          <div key={tier}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="range"
              min={0}
              max={100}
              value={allocations[tier]}
              onChange={(e) => handleAllocationChange(tier, e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500">{allocations[tier]}%</p>
          </div>
        ))}
        {totalAllocation > 100 && (
          <p className="text-sm text-red-500">Total allocation cannot exceed 100%</p>
        )}
      </div>

      <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-700">
        <p>
          <strong>Estimated APY:</strong> {totalAPY.toFixed(1)}%
        </p>
        <p>
          <strong>Projected Yield:</strong> ${estimatedYield}
        </p>
      </div>

      <button
        onClick={handleConfirm}
        disabled={totalAllocation > 100 || amount <= 0}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Deposit
      </button>

      <div className="text-xs text-gray-500 text-center">
        Connected: 0xAb...1234 • Network: Base
      </div>
    </div>
  );
}
