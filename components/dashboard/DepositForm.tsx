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
    swiftCode: ''
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountNumberLoading, setAccountNumberLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log('DepositForm useEffect - user:', user);
    if (user?.id && typeof user.id === 'string' && user.id !== 'undefined' && user.id !== 'null' && user.id.trim() !== '') {
      console.log('User authenticated, loading profile and account number');
      loadUserProfile();
      fetchAccountNumber(formData.accountType);
    } else {
      console.log('User not authenticated or invalid user ID:', user?.id);
      setAccountNumberLoading(false);
      setAccountNumber('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && formData.accountType && !accountNumberLoading) {
      console.log('Account type changed, fetching new account number');
      fetchAccountNumber(formData.accountType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountType]);

  const loadUserProfile = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping profile load');
      return;
    }

    // Additional check to ensure user ID is a valid UUID
    if (typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null' || user.id.trim() === '') {
      console.log('Invalid user ID:', user.id);
      return;
    }

    try {
      console.log('Loading user profile for user ID:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        // Set a fallback profile with user email
        setUserProfile({
          id: user.id,
          full_name: user.email || 'Account Holder',
          email: user.email
        });
      } else {
        console.log('User profile loaded successfully:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a fallback profile with user email
      setUserProfile({
        id: user.id,
        full_name: user.email || 'Account Holder',
        email: user.email
      });
    }
  };

  const fetchAccountNumber = async (accountType: string) => {
    if (!user?.id) {
      console.log('No user ID available for fetching account number');
      setAccountNumberLoading(false);
      return;
    }
    
    // Only allow 'checking' or 'savings' as valid account types
    const validAccountTypes = ['checking', 'savings'];
    const safeAccountType = validAccountTypes.includes(accountType) ? accountType : 'checking';
    
    if (!validAccountTypes.includes(accountType)) {
      console.warn(`[DepositForm] Invalid accountType: ${accountType}, defaulting to 'checking'`);
    }
    
    console.log(`[DepositForm] Fetching account number for user ${user.id} and type ${safeAccountType}`);
    setAccountNumberLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Account number fetch timed out, using fallback');
      const fallbackAccountNumber = `1234${user.id.slice(0, 4)}${safeAccountType === 'checking' ? '01' : '02'}`;
      setAccountNumber(fallbackAccountNumber);
      setAccountNumberLoading(false);
    }, 5000); // 5 second timeout
    
    try {
      // First, let's check if the accounts table exists and has data
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
      
      console.log(`[DepositForm] Found ${accountsData?.length || 0} accounts for user ${user.id}:`, accountsData);
      
      if (accountsError) {
        console.error('Error checking accounts table:', accountsError);
      }
      
      // Now try to get the specific account number
      const { data, error } = await supabase
        .from('accounts')
        .select('account_number')
        .eq('user_id', user.id)
        .eq('account_type', safeAccountType)
        .single();
      
      console.log(`[DepositForm] Account query result:`, { data, error });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (error) {
        // If no account found, create a default account number based on user ID and account type
        if (error.code === 'PGRST116') { // No rows found
          console.log(`No account found for user ${user.id} and type ${safeAccountType}, using default`);
          // Generate a more realistic account number
          const defaultAccountNumber = `1234${user.id.slice(0, 4)}${safeAccountType === 'checking' ? '01' : '02'}`;
          setAccountNumber(defaultAccountNumber);
        } else {
          console.error('Error fetching account number:', error);
          // Fallback to a default account number
          const fallbackAccountNumber = `1234${user.id.slice(0, 4)}${safeAccountType === 'checking' ? '01' : '02'}`;
          setAccountNumber(fallbackAccountNumber);
        }
      } else {
        console.log(`[DepositForm] Successfully fetched account number: ${data?.account_number}`);
        setAccountNumber(data?.account_number || '');
      }
    } catch (error) {
      console.error('Error fetching account number:', error);
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      // Fallback to a default account number
      const fallbackAccountNumber = `1234${user.id.slice(0, 4)}${safeAccountType === 'checking' ? '01' : '02'}`;
      setAccountNumber(fallbackAccountNumber);
    } finally {
      setAccountNumberLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        setLoading(false);
        return;
      }

      // Don't create any transactions - deposits are handled by admin only
      // Just show success message with instructions
      toast.success('Please use the bank details above to transfer money from your external bank account. Your deposit will be confirmed by our team once funds are received.');
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
        <h2 className="text-2xl font-bold text-gray-900">Get Deposit Details</h2>
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
          Your deposit will be confirmed by our team once funds are received.
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
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Transfer Money TO Our Bank Account</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-blue-700">Account Name:</span> {userProfile?.full_name || 'Loading...'}
            </div>
            <div>
              <span className="font-medium text-blue-700">Account Number:</span> {accountNumberLoading ? (accountNumber || 'Loading...') : (accountNumber || 'N/A')}
            </div>
            <div>
              <span className="font-medium text-blue-700">Routing Number:</span> 091000022
            </div>
            {formData.transferType === 'wire' && (
              <div>
                <span className="font-medium text-blue-700">SWIFT Code:</span> BN56969
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Use these details to transfer money from your external bank account to us.
          </p>
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
          {loading ? 'Processing...' : 'Get Bank Details'}
        </button>
      </form>
    </div>
  );
}
