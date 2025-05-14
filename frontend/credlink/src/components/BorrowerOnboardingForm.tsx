import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

const BorrowerOnboardingForm = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const navigate = useNavigate();

  const onSubmit = (data: any) => {
    navigate('/borrower-profile', { state: data });
    reset();
  };

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
            {...register('email', { required: 'Email is required' })}
            placeholder="Enter your email"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            id="company"
            type="text"
            {...register('company', { required: 'Company Name is required' })}
            placeholder="Enter your company name"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
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

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            id="phone"
            type="text"
            {...register('phone', { required: 'Phone is required', pattern: /^[0-9]+$/ })}
            placeholder="Enter your phone number"
            className="mt-2 p-3 border rounded-lg w-full"
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <button
          type="submit"
          className="bg-[#0A2540] text-white w-full py-3 rounded-full mt-4 hover:bg-[#0a3a60] transition"
        >
          Submit Onboarding
        </button>
      </form>
    </div>
  );
};

export default BorrowerOnboardingForm;
