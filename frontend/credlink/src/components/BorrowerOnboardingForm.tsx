import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { type BaseError, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import CredlinkABI from '../ABI/Credlink.json';

type BorrowerFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  country: string;
};

const BorrowerOnboardingForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<BorrowerFormData>();
  const navigate = useNavigate();
  const [submittedData, setSubmittedData] = useState<BorrowerFormData | null>(null);

  const { data: hash, isPending, error, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const onSubmit = (data: BorrowerFormData) => {
    setSubmittedData(data); 
    writeContract({
      address: process.env.CREDLINK_CONTRACT_ADDRESS as `0x${string}`,
      abi: CredlinkABI,
      functionName: 'onboardBorrower',
      args: [
        data.name,
        data.email,
        data.phoneNumber,
        data.companyName,
        data.country
      ],
    });
    // reset();
  };

  useEffect(() => {
    if (isConfirmed && submittedData) {
      const timeout = setTimeout(() => {
        navigate("/borrower-profile", { state: submittedData });
      }, 1000);
  
      return () => clearTimeout(timeout);
    }
  }, [isConfirmed, navigate, submittedData]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-6 text-[#0A2540]">
        Borrower Onboarding
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            id="name"
            type="text"
            {...register('name', { required: 'Full Name is required' })}
            placeholder="Enter your full name"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/,
                message: 'Invalid email address'
              }
            })}
            placeholder="Enter your email"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            id="phoneNumber"
            type="text"
            {...register('phoneNumber', {
              required: 'Phone is required',
              pattern: { value: /^[0-9]+$/, message: 'Phone must be numeric' }
            })}
            placeholder="Enter your phone number"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            id="companyName"
            type="text"
            {...register('companyName', { required: 'Company Name is required' })}
            placeholder="Enter your company name"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
          <input
            id="country"
            type="text"
            {...register('country', { required: 'Country is required' })}
            placeholder="Enter your country"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
        </div>

        <button
          disabled={isPending}
          type="submit"
          className="bg-[#0A2540] text-white w-full py-3 rounded-full mt-4 hover:bg-[#0a3a60] transition"
        >
          {isPending ? 'Submitting...' : 'Submit Onboarding'}
        </button>

        {/* Status messages */}
        {hash && <div className="mt-2 text-sm">Transaction Hash: {hash}</div>}
        {isConfirming && <div className="mt-2 text-sm text-yellow-600">Waiting for confirmation...</div>}
        {isConfirmed && <div className="mt-2 text-sm text-green-600">Transaction confirmed.</div>}
        {error && (
          <div className="mt-2 text-sm text-red-600">
            Error: {(error as BaseError).shortMessage || error.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default BorrowerOnboardingForm;
