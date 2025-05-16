import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useEffect, useMemo, useState } from 'react';
import abi from '../ABI/Credlink.json';


type LoanRecord = {
  borrowAmount: bigint;
  borrowTime: bigint;
  loanDuration: bigint;
  borrowPurpose: string;
};

export default function LoanHistory() {
  const { address, isConnected } = useAccount();
  const [loanHistory, setLoanHistory] = useState<LoanRecord[]>([]);

  const {
    data,
    isLoading,
    isSuccess,
    error,
  } = useReadContract({
    address: process.env.NEXT_PUBLIC_CREDLINK_CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: 'borrowerHistory',
    args: [address],
  });

  useEffect(() => {
    if (isSuccess && Array.isArray(data)) {
      setLoanHistory(data as LoanRecord[]);
    }
  }, [data, isSuccess]);

  const formattedHistory = useMemo(() => {
    return loanHistory.map((loan) => ({
      amount: formatEther(loan.borrowAmount),
      date: new Date(Number(loan.borrowTime) * 1000).toLocaleString(),
      durationDays: Number(loan.loanDuration) / (60 * 60 * 24),
      purpose: loan.borrowPurpose,
    }));
  }, [loanHistory]);

  if (!isConnected) {
    return <p className="p-4 text-center">Connect your wallet to view loan history.</p>;
  }

  if (isLoading) {
    return <p className="p-4 text-center">Loading loan history...</p>;
  }

  if (error) {
    return <p className="p-4 text-center text-red-500">Error fetching loan history.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Loan History</h1>

      {formattedHistory.length === 0 ? (
        <p>No loan records found.</p>
      ) : (
        <div className="space-y-4">
          {formattedHistory.map((loan, idx) => (
            <div key={idx} className="p-4 border rounded shadow-sm bg-white">
              <p><strong>Amount:</strong> {loan.amount} ETH</p>
              <p><strong>Borrowed On:</strong> {loan.date}</p>
              <p><strong>Duration:</strong> {loan.durationDays} days</p>
              <p><strong>Purpose:</strong> {loan.purpose}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
