'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import toast from 'react-hot-toast';

interface DepositFormProps {
  onClose: () => void;
}

export default function DepositForm({ onClose }: DepositFormProps) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    accountType: 'checking',
    transferType: 'ach',
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '091000022', // Our Minnesota routing number
    swiftCode: '',
    description: ''
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      // Calculate fee for wire transfers
      let fee = 0;
      if (formData.transferType === 'wire') {
        fee = 25; // Wire transfer fee
      }

      // Log transaction as pending (don't update balance yet)
      const transactionData = {
        user_id: user?.id,
        amount: amount,
        type: 'deposit',
        description: `Deposit via ${formData.transferType.toUpperCase()} - ${formData.description || 'No description'}`,
        account_type: formData.accountType,
        transfer_type: formData.transferType,
        account_holder_name: formData.accountHolderName,
        account_number: formData.accountNumber,
        routing_number: formData.routingNumber,
        swift_code: formData.swiftCode,
        fee: fee,
        status: 'pending' // Mark as pending until manually confirmed
      };

      console.log('Creating pending deposit transaction:', transactionData);

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('Transaction insert error:', transactionError);
        throw transactionError;
      }

      console.log('Pending deposit transaction created successfully');

      toast.success('Deposit request submitted. We will confirm when funds are received.');
      onClose();
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request Deposit</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Use the bank details below to transfer money from your external bank account to us. 
          Your deposit will be confirmed once we receive the funds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter amount"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Account
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => setFormData({...formData, accountType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="checking">Life Green Checking</option>
            <option value="savings">BigTree Savings</option>
          </select>
        </div>

        {/* Transfer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transfer Method
          </label>
          <select
            value={formData.transferType}
            onChange={(e) => setFormData({...formData, transferType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ach">ACH Transfer</option>
            <option value="wire">Wire Transfer (+$25 fee)</option>
          </select>
        </div>

        {/* Our Bank Account Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Transfer Money TO Our Bank Account</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-blue-700">Account Name:</span> Asaba National Bank
            </div>
            <div>
              <span className="font-medium text-blue-700">Account Number:</span> 601756752
            </div>
            <div>
              <span className="font-medium text-blue-700">Routing Number:</span> 091000022
            </div>
            {formData.transferType === 'wire' && (
              <div>
                <span className="font-medium text-blue-700">SWIFT Code:</span> ASABUS33
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Use these details to transfer money from your external bank account to us.
          </p>
        </div>

        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Account Holder Name
          </label>
          <input
            type="text"
            required
            value={formData.accountHolderName}
            onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your account holder name"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Account Number
          </label>
          <input
            type="text"
            required
            value={formData.accountNumber}
            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your account number"
          />
        </div>

        {/* Routing Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Routing Number
          </label>
          <input
            type="text"
            required
            value={formData.routingNumber}
            onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your routing number"
          />
        </div>

        {/* SWIFT Code (for wire transfers) */}
        {formData.transferType === 'wire' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your SWIFT Code
            </label>
            <input
              type="text"
              required
              value={formData.swiftCode}
              onChange={(e) => setFormData({...formData, swiftCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your SWIFT code"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Deposit description"
          />
        </div>

        {/* Fee Notice */}
        {formData.transferType === 'wire' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Wire transfers incur a $25 fee
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Deposit Request'}
        </button>
      </form>
    </div>
  );
}
