// components/dashboard/WithdrawalForm.tsx
'use client'; // This directive marks the component as a Client Component.

import { useState, useEffect } from 'react';
// Import createBrowserClient for client-side Supabase interactions.
// This is the correct way to initialize the Supabase client in client components
// for Next.js App Router.
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth is a client-side hook
import RecipientManager from './RecipientManager'; // Import RecipientManager as seen in your error log
import toast from 'react-hot-toast'; // Assuming react-hot-toast is used for notifications

// Define the props for the WithdrawalForm component
interface WithdrawalFormProps {
  onClose: () => void;
}

// Destructure the props directly in the function signature
export default function WithdrawalForm({ onClose }: WithdrawalFormProps) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    accountType: 'checking',
    transferType: 'ach',
    recipientId: '',
    description: ''
  });
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [showRecipientManager, setShowRecipientManager] = useState(false);

  useEffect(() => {
    if (authLoading) {
      // Still loading auth, don't fetch recipients yet
      return;
    }
    
    // Only proceed if we have a valid user ID (not undefined, null, or empty string)
    if (user?.id && typeof user.id === 'string' && user.id !== 'undefined' && user.id !== 'null' && user.id.trim() !== '') {
      loadRecipients();
    } else if (user === null) {
      // User is not authenticated
      setRecipientsLoading(false);
    } else {
      // User is undefined or has invalid ID
      setRecipientsLoading(false);
    }
  }, [user?.id, user, authLoading]);

  // Add a separate effect to retry loading when user ID becomes available
  useEffect(() => {
    if (!authLoading && user?.id && typeof user.id === 'string' && user.id !== 'undefined' && user.id !== 'null' && user.id.trim() !== '' && recipients.length === 0) {
      loadRecipients();
    }
  }, [user?.id, authLoading, recipients.length]);

  const loadRecipients = async () => {
    if (!user?.id) {
      setRecipientsLoading(false);
      return;
    }

    // Additional check to ensure user ID is a valid UUID
    if (typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null' || user.id.trim() === '') {
      setRecipientsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setRecipientsLoading(false);
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

      // Validate recipient selection
      if (!formData.recipientId) {
        toast.error('Please select a recipient to withdraw to');
        return;
      }

      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      const currentBalance = formData.accountType === 'checking' 
        ? profile.checking_balance || 0 
        : profile.savings_balance || 0;

      if (amount > currentBalance) {
        toast.error('Insufficient funds');
        return;
      }

      // Check withdrawal limits
      const withdrawalCount = profile.withdrawal_count || 0;
      let fee = 0;
      
      if (withdrawalCount >= 2) {
        fee = 25; // Administrative fee after second withdrawal
        toast.error('Administrative fee of $25 applied. Please contact support for assistance.');
      }

      const totalAmount = amount + fee;
      if (totalAmount > currentBalance) {
        toast.error('Insufficient funds including fees');
        return;
      }

      // Get recipient details for better transaction description
      const selectedRecipient = recipients.find(r => r.id === formData.recipientId);
      const recipientName = selectedRecipient ? selectedRecipient.nickname : 'Unknown Recipient';

      // Update balance
      const newBalance = currentBalance - totalAmount;
      const updateField = formData.accountType === 'checking' ? 'checking_balance' : 'savings_balance';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          [updateField]: newBalance,
          withdrawal_count: withdrawalCount + 1
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: -amount,
          type: 'withdrawal',
          description: `Withdrawal to ${recipientName} via ${formData.transferType.toUpperCase()} - ${formData.description}`,
          account_type: formData.accountType,
          transfer_type: formData.transferType,
          recipient_id: formData.recipientId,
          fee: fee
        });

      if (transactionError) throw transactionError;

      toast.success(`Withdrawal to ${recipientName} processed successfully`);
      onClose();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Withdraw Funds</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
            From Account
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
            <option value="wire">Wire Transfer</option>
          </select>
        </div>

        {/* Recipient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Recipient *
          </label>
          {recipientsLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Loading recipients...
              </p>
            </div>
          ) : recipients.length > 0 ? (
            <select
              value={formData.recipientId}
              onChange={(e) => setFormData({...formData, recipientId: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a recipient to withdraw to</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.nickname} - {recipient.account_name} ({recipient.bank_name})
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>No recipients found.</strong> You need to add a recipient account before making withdrawals.
              </p>
            </div>
          )}
        </div>

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
            placeholder="Withdrawal description"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || recipientsLoading || recipients.length === 0}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : recipientsLoading ? 'Loading Recipients...' : recipients.length === 0 ? 'Add Recipients First' : 'Withdraw Funds'}
        </button>
      </form>

      {/* Recipient Management Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-bold mb-4">Manage Recipient Accounts (for Transfers)</h3>
        <RecipientManager />
      </div>
    </div>
  );
}
