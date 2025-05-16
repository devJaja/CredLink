import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type BaseError, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useNavigate } from "react-router-dom"; // Only if using react-router
import CredlinkContract from "../ABI/Credlink.json";

type BorrowerFormData = {
  amount: string;
  duration: string;
  purpose: string;
};

export default function LoanRequestForm({ onSubmit }) {
  const [status, setStatus] = useState("");
  const [submittedData, setSubmittedData] = useState<BorrowerFormData | null>(null);

  const navigate = useNavigate(); 

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BorrowerFormData>({
    defaultValues: {
      amount: "",
      duration: "30",
      purpose: "",
    },
  });

  const {
    data: hash,
    isPending,
    error,
    writeContract
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash,
  });

  const onSubmitForm = async (data: BorrowerFormData) => {
    setStatus("Submitting loan request...");
    setSubmittedData(data); 

    try {
      const amountInWei = BigInt(parseFloat(data.amount) * 10 ** 18);
      const durationInDays = BigInt(parseInt(data.duration));

      writeContract({
        address: process.env.NEXT_PUBLIC_CREDLINK_CONTRACT_ADDRESS as `0x${string}`,
        abi: CredlinkContract,
        functionName: "borrowFunds",
        args: [amountInWei, durationInDays, data.purpose],
      });

      if (onSubmit) {
        await onSubmit(data);
      }
    } catch (err) {
      console.error("Error submitting loan request:", err);
      setStatus("❌ Failed to submit loan request.");
    }
  };

  useEffect(() => {
    if (isConfirming && submittedData) {
      reset();
      setStatus("✅ Loan request confirmed!");
      
      const timeout = setTimeout(() => {
        navigate("/borrower-profile", { state: submittedData });
      }, 5000);
  
      return () => clearTimeout(timeout);
    }
  }, [isConfirming, navigate, submittedData, reset]);
  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="max-w-md mx-auto bg-white p-6 rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-semibold mb-4">Request a Loan</h2>

      <div>
        <label className="block mb-1 font-medium">Loan Amount (in ETH)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full border rounded p-2"
          {...register("amount", {
            required: "Amount is required",
            min: { value: 0.01, message: "Amount must be greater than 0" }
          })}
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block mb-1 font-medium">Duration (days)</label>
        <select
          className="w-full border rounded p-2"
          {...register("duration")}
        >
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Purpose</label>
        <textarea
          rows={3}
          className="w-full border rounded p-2"
          placeholder="e.g. Working capital, invoice financing..."
          {...register("purpose", {
            required: "Purpose is required"
          })}
        />
        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending || isConfirming ? "Submitting..." : "Request Loan"}
      </button>

      {/* Transaction status indicators */}
      <div className="mt-2 space-y-1">
        {hash && (
          <div className="text-sm break-all">
            <span className="font-medium">Transaction Hash:</span> {hash}
          </div>
        )}
        {isConfirming && (
          <div className="text-sm text-yellow-600">
            Waiting for confirmation...
          </div>
        )}
        {isConfirmed && (
          <div className="text-sm text-green-600">
            Transaction confirmed.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">
            Error: {(error as BaseError).shortMessage || error.message}
          </div>
        )}
        {status && <p className="text-sm">{status}</p>}
      </div>
    </form>
  );
}
