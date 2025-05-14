import { useState } from "react";

export default function LoanRequestForm({ onSubmit }) {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("30");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !purpose) {
      return setStatus("❌ Please fill all required fields.");
    }

    setLoading(true);
    setStatus("Submitting loan request...");

    try {
      // Call parent or smart contract function
      await onSubmit({ amount, duration, purpose });

      setStatus("✅ Loan request submitted successfully!");
      setAmount("");
      setPurpose("");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to submit loan request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-semibold mb-4">Request a Loan</h2>

      <div>
        <label className="block mb-1 font-medium">Loan Amount (in ETH)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Duration (days)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">Purpose</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="e.g. Working capital, invoice financing..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Request Loan"}
      </button>

      {status && <p className="text-sm mt-2">{status}</p>}
    </form>
  );
}
