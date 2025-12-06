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
  const [verifying, setVerifying] = useState(false);
  const [profile, setProfile] = useState<any>(null);
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
      loadProfile();
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

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

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
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    setVerifying(false);

    try {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (!formData.amount || formData.amount.trim() === '') {
        toast.error('Please enter an amount');
        setLoading(false);
        return;
      }
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount greater than 0');
        setLoading(false);
        return;
      }

      // Validate recipient
      if (!formData.recipientId || formData.recipientId.trim() === '') {
        toast.error('Please select a recipient');
        setLoading(false);
        return;
      }

      // Validate user
      if (!user?.id) {
        toast.error('You must be logged in to make a withdrawal');
        setLoading(false);
        return;
      }

      // Get user profile for balance check
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[WithdrawalForm] Profile fetch error:', profileError);
        throw new Error(`Failed to load account: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      const currentBalance = formData.accountType === 'checking' 
        ? (profile.checking_balance || 0)
        : (profile.savings_balance || 0);

      console.log('[WithdrawalForm] Current balance:', currentBalance, 'Amount:', amount);

      if (amount > currentBalance) {
        toast.error(`Insufficient funds. Available: $${currentBalance.toFixed(2)}`);
        setLoading(false);
        return;
      }

      // Check withdrawal count for support contact requirement
      const withdrawalCount = profile.withdrawal_count || 0;
      
      // Block withdrawals after second withdrawal (limit is 2)
      if (withdrawalCount >= 2) {
        toast.error('You have reached your withdrawal limit. You cannot make any more withdrawals. Please contact support for assistance.', {
          duration: 8000,
        });
        setLoading(false);
        return;
      }
      
      // Get recipient details for better transaction description
      const selectedRecipient = recipients.find(r => r.id === formData.recipientId);
      console.log('[WithdrawalForm] formData.recipientId:', formData.recipientId);
      console.log('[WithdrawalForm] recipients:', recipients);
      console.log('[WithdrawalForm] selectedRecipient:', selectedRecipient);
      const recipientName = selectedRecipient ? (selectedRecipient.nickname || selectedRecipient.account_name || 'Unknown Recipient') : 'Unknown Recipient';
      console.log('[WithdrawalForm] recipientName:', recipientName);

      // Start verification process
      setVerifying(true);
      setLoading(false);

      // Simulate 2-second verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update balance
      const newBalance = currentBalance - amount;
      const updateField = formData.accountType === 'checking' ? 'checking_balance' : 'savings_balance';
      
      console.log('[WithdrawalForm] Updating balance:', {
        updateField,
        currentBalance,
        amount,
        newBalance,
        withdrawalCount: withdrawalCount + 1
      });

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          [updateField]: newBalance,
          withdrawal_count: withdrawalCount + 1
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[WithdrawalForm] Balance update error:', updateError);
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }

      if (!updatedProfile) {
        throw new Error('Balance update failed - no data returned');
      }

      console.log('[WithdrawalForm] Balance updated successfully:', updatedProfile);
      
      // Update local profile state
      setProfile(updatedProfile);

      // Log transaction - match the actual database schema
      const transactionData = {
        user_id: user?.id,
        type: 'withdrawal',
        amount: amount, // Store positive amount, handle negative display in UI
        note: `Withdrawal to ${recipientName} via ${formData.transferType.toUpperCase()} from ${formData.accountType === 'checking' ? 'Life Green Checking' : 'BigTree Savings'} - ${formData.description}`
      };

      console.log('[WithdrawalForm] Creating transaction:', transactionData);

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('[WithdrawalForm] Transaction insert error:', transactionError);
        throw transactionError;
      }

      console.log('[WithdrawalForm] Transaction created successfully');

      // Send withdrawal notification emails
      try {
        const accountOwnerEmail = user?.email || profile?.email;
        const recipientEmail = selectedRecipient?.email; // If recipients table has email field
        
        if (accountOwnerEmail) {
          const emailResponse = await fetch('/api/send-withdrawal-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountOwnerEmail: accountOwnerEmail,
              recipientEmail: recipientEmail || null,
              amount: amount,
              accountType: formData.accountType,
              transferType: formData.transferType,
              recipientName: recipientName,
              accountOwnerName: profile?.full_name || accountOwnerEmail,
              description: formData.description || ''
            }),
          });

          if (emailResponse.ok) {
            console.log('[WithdrawalForm] Withdrawal emails sent successfully');
          } else {
            console.error('[WithdrawalForm] Failed to send withdrawal emails');
            // Don't throw error - withdrawal was successful, email is just a notification
          }
        }
      } catch (emailError) {
        console.error('[WithdrawalForm] Error sending withdrawal emails:', emailError);
        // Don't throw error - withdrawal was successful, email is just a notification
      }

      setVerifying(false);
      setLoading(false);
      
      // Reset form
      setFormData({
        amount: '',
        accountType: 'checking',
        transferType: 'ach',
        recipientId: '',
        description: ''
      });
      
      // Reload profile to get updated balance
      await loadProfile();
      
      toast.success(`Withdrawal of $${amount.toFixed(2)} to ${recipientName} processed successfully`);
      
      // Show support contact message after second withdrawal (when count becomes 2)
      if (withdrawalCount + 1 === 2) {
        setTimeout(() => {
          toast.error('For additional withdrawals, please contact our support team at support@asababank.com or call 1-800-ASABA-BANK.', {
            duration: 8000,
          });
        }, 1000);
      }
      
      // Close form after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('[WithdrawalForm] Error:', error);
      setVerifying(false);
      setLoading(false);
      const errorMessage = error.message || 'An unexpected error occurred';
      setErrorMsg(errorMessage);
      toast.error(`Withdrawal failed: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-md mx-auto max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Withdraw Funds</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
        {/* Amount */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter amount"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
            From Account
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => setFormData({...formData, accountType: e.target.value})}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="checking">Life Green Checking</option>
            <option value="savings">BigTree Savings</option>
          </select>
        </div>

        {/* Transfer Type */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
            Transfer Method
          </label>
          <select
            value={formData.transferType}
            onChange={(e) => setFormData({...formData, transferType: e.target.value})}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ach">ACH Transfer</option>
            <option value="wire">Wire Transfer</option>
          </select>
        </div>

        {/* Recipient Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
            Select Recipient *
          </label>
          {recipientsLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <p className="text-xs text-blue-800">
                Loading recipients...
              </p>
            </div>
          ) : recipients.length > 0 ? (
            <select
              value={formData.recipientId}
              onChange={(e) => setFormData({...formData, recipientId: e.target.value})}
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Choose a recipient</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.nickname} - {recipient.account_name} ({recipient.bank_name})
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-xs text-yellow-800">
                <strong>No recipients found.</strong> Add a recipient account first.
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-0.5">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Withdrawal description"
          />
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="p-2 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-800 text-xs">{errorMsg}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || verifying || recipientsLoading || recipients.length === 0 || !formData.amount || !formData.recipientId}
          className="w-full bg-red-600 text-white py-1.5 px-3 text-sm font-medium rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {verifying ? 'Verifying...' : loading ? 'Processing...' : recipientsLoading ? 'Loading Recipients...' : recipients.length === 0 ? 'Add Recipients First' : !formData.amount ? 'Enter Amount' : !formData.recipientId ? 'Select Recipient' : 'Withdraw Funds'}
        </button>

        {/* Withdrawal Limit Warning */}
        {profile?.withdrawal_count >= 2 && (
          <div className="p-2 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-800 text-xs">
              <strong>Withdrawal Limit Reached:</strong> You have reached your withdrawal limit (2 withdrawals). Please contact support for assistance.
            </p>
          </div>
        )}
      </form>

      {/* Recipient Management Section - Collapsible */}
      <details className="mt-4 pt-3 border-t border-gray-200">
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
          Manage Recipient Accounts
        </summary>
        <div className="mt-2">
          <RecipientManager />
        </div>
      </details>
    </div>
  );
}
