'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import DepositForm from './DepositForm';
import WithdrawalForm from './WithdrawalForm';

interface AccountSummaryProps {
  profile: any;
  onUpdate: () => void;
}

export default function AccountSummary({ profile, onUpdate }: AccountSummaryProps) {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const handleDepositClose = () => {
    setShowDepositForm(false);
    onUpdate(); // Refresh the data
  };

  const handleWithdrawClose = () => {
    setShowWithdrawForm(false);
    onUpdate(); // Refresh the data
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Account Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Checking Account */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Life Green Checking</h3>
              <p className="text-xs sm:text-sm text-blue-700">Primary Account</p>
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-blue-900">
                ${profile?.checking_balance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-blue-600">Available Balance</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDepositForm(true)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-blue-700 transition text-xs sm:text-sm font-medium"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawForm(true)}
              disabled={profile?.withdrawal_count >= 2}
              className="flex-1 bg-red-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-red-700 transition text-xs sm:text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {profile?.withdrawal_count >= 2 ? 'Limit Reached' : 'Withdraw'}
            </button>
          </div>
          
          {profile?.withdrawal_count >= 2 && (
            <div className="mt-2 p-2 border border-red-200 rounded bg-red-50">
              <p className="text-red-800 text-xs">
                Withdrawal limit reached (2 withdrawals). Contact support for assistance.
              </p>
            </div>
          )}
        </div>

        {/* Savings Account */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-6 border border-green-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-green-900">BigTree Savings</h3>
              <p className="text-xs sm:text-sm text-green-700">High-Yield Savings</p>
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-green-900">
                ${profile?.savings_balance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-green-600">Available Balance</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDepositForm(true)}
              className="flex-1 bg-green-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-green-700 transition text-xs sm:text-sm font-medium"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawForm(true)}
              disabled={profile?.withdrawal_count >= 2}
              className="flex-1 bg-red-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-red-700 transition text-xs sm:text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {profile?.withdrawal_count >= 2 ? 'Limit Reached' : 'Withdraw'}
            </button>
          </div>
          
          {profile?.withdrawal_count >= 2 && (
            <div className="mt-2 p-2 border border-red-200 rounded bg-red-50">
              <p className="text-red-800 text-xs">
                Withdrawal limit reached (2 withdrawals). Contact support for assistance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-3 sm:p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-gray-600">Account Holder:</p>
            <p className="font-medium">{profile?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Account Number:</p>
            <p className="font-medium">****{profile?.id?.slice(-4) || '****'}</p>
          </div>
          <div>
            <p className="text-gray-600">Routing Number:</p>
            <p className="font-medium">123456789</p>
          </div>
          <div>
            <p className="text-gray-600">Member Since:</p>
            <p className="font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4">
            <DepositForm onClose={handleDepositClose} />
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="max-w-md w-full mx-auto my-auto">
            <WithdrawalForm onClose={handleWithdrawClose} />
          </div>
        </div>
      )}
    </div>
  );
}
