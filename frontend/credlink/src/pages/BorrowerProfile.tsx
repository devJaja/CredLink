import { useLocation, useNavigate } from 'react-router-dom';

const BorrowerProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="text-center mt-20">
        <p className="text-lg text-gray-600">No profile data found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#0A2540] text-white rounded-full hover:bg-[#123A63] transition"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const { name, email, companyName, country, phoneNumber } = state;

  const borrower = {
    loanStatus: 'Active',
    outstandingLoan: '$0.00',
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 bg-white shadow-xl rounded-2xl">
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
          alt="Profile Avatar"
          className="w-20 h-20 rounded-full border-4 border-[#0A2540] shadow-md"
        />
      </div>

      <h2 className="text-2xl font-bold text-[#0A2540] text-center mb-5">{name}'s Profile</h2>

      {/* Info */}
      <div className="space-y-4 text-gray-700 text-sm sm:text-base">
        <ul className="space-y-1.5">
          <li><span className="font-medium text-[#0A2540]">Full Name:</span> {name}</li>
          <li><span className="font-medium text-[#0A2540]">Email Address:</span> {email}</li>
          <li><span className="font-medium text-[#0A2540]">Company Name:</span> {companyName}</li>
          <li><span className="font-medium text-[#0A2540]">Country:</span> {country}</li>
          <li><span className="font-medium text-[#0A2540]">Phone Number:</span> {phoneNumber}</li>
        </ul>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-[#0A2540] mb-2">Loan Details</h3>
          <p><span className="font-medium">Status:</span> {borrower.loanStatus}</p>
          <p><span className="font-medium">Outstanding Loan:</span> {borrower.outstandingLoan}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        <button
          onClick={() => navigate('/kyc')}
          className="bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition font-medium shadow-sm"
        >
          🏦 Get Loan
        </button>

        <button
          onClick={() => alert('Trigger Repay Loan Flow')}
          className="bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-medium shadow-sm"
        >
          💸 Repay Loan
        </button>
      </div>

      <button
        onClick={() => navigate('/borrower-dashboard', { state })}
        className="mt-5 w-full bg-gradient-to-r from-[#0A2540] to-[#123A63] text-white py-2.5 rounded-xl hover:opacity-90 transition font-semibold shadow-md"
      >
        📊 Go to Dashboard
      </button>
    </div>
  );
};

export default BorrowerProfile;
