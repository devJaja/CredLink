import React, { useState } from "react";
import { Button } from "@headlessui/react"; // You can use Button from Headless UI or Tailwind
import { Input } from "@tailwindcss/forms"; // Use Tailwind forms for styling
import { Tabs, Tab } from "@headlessui/react"; // Use Headless UI tabs

export default function LiquidityProvider() {
  const [amount, setAmount] = useState("");

  const handleDeposit = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0) {
      alert(`Deposited $${numericAmount} USDC into liquidity pool`);
    } else {
      alert("Please enter a valid amount");
    }
  };

  const handleWithdraw = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount > 0) {
      alert(`Withdrew $${numericAmount} from liquidity pool`);
    } else {
      alert("Please enter a valid amount");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Liquidity Provider Dashboard</h1>

      <Tabs className="w-full">
        <Tab.List className="flex space-x-4">
          <Tab className="px-4 py-2 cursor-pointer">Deposit</Tab>
          <Tab className="px-4 py-2 cursor-pointer">Withdraw</Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="card space-y-4 p-6">
              <label htmlFor="deposit-amount" className="block text-lg font-medium">
                Deposit Amount (USDC)
              </label>
              <Input
                id="deposit-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
              />
              <Button onClick={handleDeposit} className="w-full py-2 bg-blue-500 text-white">
                Confirm Deposit
              </Button>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="card space-y-4 p-6">
              <label htmlFor="withdraw-amount" className="block text-lg font-medium">
                Withdraw Amount (USDC)
              </label>
              <Input
                id="withdraw-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
              />
              <Button onClick={handleWithdraw} className="w-full py-2 bg-red-500 text-white">
                Confirm Withdrawal
              </Button>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tabs>

      <div className="card p-6 space-y-3">
        <h2 className="text-xl font-semibold">📊 Portfolio Overview</h2>
        <p>Total Invested: <strong>$25,000</strong></p>
        <p>Returns to Date: <strong>$1,200</strong></p>
        <p>Active Loans: <strong>8</strong></p>
      </div>
    </div>
  );
}
