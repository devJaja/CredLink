import React, { useState, useMemo } from "react";
import DepositDashboard from "../components/DepositDashboard";

export default function LenderDashboard() {
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [allocations, setAllocations] = useState({
    low: 40,
    medium: 30,
    high: 30,
  });

  const handleDeposit = (amount) => {
    setTotalDeposit((prev) => prev + amount);
  };

  const handleAllocationChange = (newAllocations) => {
    setAllocations(newAllocations);
  };

  const estimatedAPY = useMemo(() => {
    const apy =
      (allocations.low * 8 +
        allocations.medium * 12 +
        allocations.high * 18) /
      100;
    return apy.toFixed(1);
  }, [allocations]);

  const interestEarned = useMemo(() => {
    return ((totalDeposit * parseFloat(estimatedAPY)) / 100).toFixed(2);
  }, [totalDeposit, estimatedAPY]);

  const riskTiers = [
    {
      tier: "Low",
      allocation: `$${((totalDeposit * allocations.low) / 100).toLocaleString()}`,
      interest: "8%",
      duration: "180 days",
      status: "Active",
      color: "text-green-600",
    },
    {
      tier: "Medium",
      allocation: `$${((totalDeposit * allocations.medium) / 100).toLocaleString()}`,
      interest: "12%",
      duration: "120 days",
      status: "Active",
      color: "text-yellow-600",
    },
    {
      tier: "High",
      allocation: `$${((totalDeposit * allocations.high) / 100).toLocaleString()}`,
      interest: "18%",
      duration: "90 days",
      status: "Active",
      color: "text-red-600",
    },
  ];

  const deals = [
    {
      id: "#TX45",
      risk: "Medium",
      amount: "$1,500",
      interest: "12%",
      duration: "120 days",
      endDate: "Aug 1, 2025",
    },
    {
      id: "#TX38",
      risk: "High",
      amount: "$1,000",
      interest: "18%",
      duration: "90 days",
      endDate: "July 15, 2025",
    },
  ];

  return (
    <div className="p-6 max-w-6xl text-[#0A2223] bg-gray-100 mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Lender Dashboard</h1>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Total Deposited</p>
          <p className="text-xl font-semibold">${totalDeposit.toLocaleString()}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Estimated APY</p>
          <p className="text-xl font-semibold">{estimatedAPY}%</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Interest Earned</p>
          <p className="text-xl font-semibold">${interestEarned}</p>
        </div>
        <div className="bg-white shadow-md rounded-2xl p-4">
          <p className="text-gray-500 text-sm">Next Payout</p>
          <p className="text-xl font-semibold">June 30, 2025</p>
        </div>
      </div>

      {/* Deposit Panel */}
      <div className="mt-6">
        <DepositDashboard
          onConfirm={handleDeposit}
          onAllocationChange={handleAllocationChange}
          currentAllocations={allocations}
        />
      </div>

      {/* Risk Tier Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Risk Tier Allocation</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Risk Tier</th>
                <th className="px-4 py-2">Allocation</th>
                <th className="px-4 py-2">Interest Rate (APY)</th>
                <th className="px-4 py-2">Avg Duration</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {riskTiers.map((tier, idx) => (
                <tr key={idx} className="border-b text-gray-700">
                  <td className={`px-4 py-2 font-medium ${tier.color}`}>{tier.tier}</td>
                  <td className="px-4 py-2">{tier.allocation}</td>
                  <td className="px-4 py-2">{tier.interest}</td>
                  <td className="px-4 py-2">{tier.duration}</td>
                  <td className="px-4 py-2">{tier.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Deals */}
      <div>
        <h2 className="text-lg font-semibold mb-2">My Active Deals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Deal</th>
                <th className="px-4 py-2">Risk</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Interest</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Ends On</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, idx) => (
                <tr key={idx} className="border-b text-gray-700">
                  <td className="px-4 py-2 font-medium">{deal.id}</td>
                  <td className="px-4 py-2">{deal.risk}</td>
                  <td className="px-4 py-2">{deal.amount}</td>
                  <td className="px-4 py-2">{deal.interest}</td>
                  <td className="px-4 py-2">{deal.duration}</td>
                  <td className="px-4 py-2">{deal.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-2xl shadow hover:bg-blue-700">
          Claim Interest
        </button>
        <button className="bg-gray-300 text-black px-6 py-2 rounded-2xl shadow hover:bg-gray-400">
          Withdraw
        </button>
      </div>
    </div>
  );
}
