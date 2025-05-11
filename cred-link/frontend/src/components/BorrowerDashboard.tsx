import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BorrowerDashboard = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg text-gray-600">No profile data found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-[#0A2223] text-white rounded-full"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { name, email, company, country, phone } = state;

  const borrower = {
    outstandingLoan: '$500,000',
    loanStatus: 'Active',
    interestRate: '12% p.a.',
    dueDate: '2025-07-15',
    repaymentSchedule: 'Monthly',
    loanType: 'Secured - Long Term',
    nextPayment: {
      amount: '$15,000',
      dueDate: '2025-06-15'
    },
    paymentHistory: [
      { id: 1, date: '2025-04-15', amount: '$15,000', status: 'Paid' },
      { id: 2, date: '2025-03-15', amount: '$15,000', status: 'Paid' },
      { id: 3, date: '2025-02-15', amount: '$15,000', status: 'Paid' }
    ],
    repaymentOption: 'Automatic',
    earlyRepayment: {
      benefit: '5% discount on interest',
      penalty: '2% of outstanding principal'
    },
    applicationHistory: [
      { date: '2025-01-01', amount: '$300,000', status: 'Rejected', reason: 'Low credit score' },
      { date: '2024-06-01', amount: '$250,000', status: 'Approved' }
    ],
    notifications: [
      'Upcoming payment due on 2025-06-15',
      'Missed payment reminder: 2025-05-15',
      'Repayment of $15,000 received on 2025-04-15'
    ],
    creditScore: 680,
    creditLimit: '$750,000',
    supportContact: 'support@loanplatform.com',
    financialTips: [
      'Pay your loans on time to maintain a good credit score.',
      'Avoid applying for multiple loans simultaneously.',
      'Increase your income sources to improve borrowing capacity.'
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
  <div className="max-w-6xl mx-auto p-6">
  <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-[#0A2223] mb-8 tracking-tight">{name} 's Dashboard</h1>

      {/* Profile & Loan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow">
          <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Profile Information</h2>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Full Name:</strong> {name}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Company:</strong> {company}</li>
            <li><strong>Country:</strong> {country}</li>
            <li><strong>Phone:</strong> {phone}</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow">
          <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Loan Overview</h2>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Status:</strong> {borrower.loanStatus}</li>
            <li><strong>Outstanding:</strong> {borrower.outstandingLoan}</li>
            <li><strong>Interest Rate:</strong> {borrower.interestRate}</li>
            <li><strong>Due Date:</strong> {borrower.dueDate}</li>
            <li><strong>Repayment Schedule:</strong> {borrower.repaymentSchedule}</li>
            <li><strong>Loan Type:</strong> {borrower.loanType}</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Notifications</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          {borrower.notifications.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>

      {/* Repayment Info */}
      <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transitionshadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Repayment Information</h2>

        <div className="grid md:grid-cols-2 gap-6 text-gray-700">
          <div>
            <p><strong>Next Payment:</strong> {borrower.nextPayment.amount} due on {borrower.nextPayment.dueDate}</p>
            <p className="mt-2"><strong>Repayment Option:</strong> {borrower.repaymentOption}</p>
          </div>

          <div>
            <p><strong>Early Repayment:</strong></p>
            <ul className="list-disc ml-6 mt-1">
              <li><strong>Benefit:</strong> {borrower.earlyRepayment.benefit}</li>
              <li><strong>Penalty:</strong> {borrower.earlyRepayment.penalty}</li>
            </ul>
            <button
              className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              onClick={() => alert('Trigger Early Repayment Flow')}
            >
              ⚡ Early Repay
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-[#0A2223] mb-2">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 border">
              <thead className="bg-gray-100 text-[#0A2223]">
                <tr>
                  <th className="py-2 px-3 border">Date</th>
                  <th className="py-2 px-3 border">Amount</th>
                  <th className="py-2 px-3 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {borrower.paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 border">{payment.date}</td>
                    <td className="py-2 px-3 border">{payment.amount}</td>
                    <td className="py-2 px-3 border">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application History */}
      <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Loan Applications</h2>
        <ul className="text-gray-700 space-y-2">
          {borrower.applicationHistory.map((app, index) => (
            <li key={index}>
              <strong>Date:</strong> {app.date} | <strong>Amount:</strong> {app.amount} | <strong>Status:</strong> {app.status} {app.reason && (<span>| <strong>Reason:</strong> {app.reason}</span>)}
            </li>
          ))}
        </ul>
      </div>
      

      {/* Credit Info */}
      <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Credit Score & Borrowing Limit</h2>
        <p className="text-gray-700 mb-2"><strong>Credit Score:</strong> {borrower.creditScore}</p>
        <p className="text-gray-700 mb-2"><strong>Borrowing Limit:</strong> {borrower.creditLimit}</p>
        <p className="text-gray-700 mb-1"><strong>Tips to Increase Limit:</strong></p>
        <ul className="list-disc ml-6 text-gray-700">
          {borrower.financialTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Support Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#0A2223] border-b pb-2">Support & Dispute Resolution</h2>
        <p className="text-gray-700 mb-3">Need help? Contact our support team at <a href="mailto:{borrower.supportContact}" className="text-blue-600 underline">{borrower.supportContact}</a></p>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => alert('Open Dispute Form')}
        >
          🚨 Raise a Dispute / Ticket
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <button
          className="w-full py-4 px-6 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
          onClick={() => alert('Trigger Get Loan Flow')}
        >
          🏦 Get a Loan
        </button>

        <button
          className="w-full py-4 px-6 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
          onClick={() => alert('Trigger Repay Loan Flow')}
        >
          💸 Repay Loan
        </button>
      </div>
    </div>
  </div>
</div>

   
  );
};

export default BorrowerDashboard;
