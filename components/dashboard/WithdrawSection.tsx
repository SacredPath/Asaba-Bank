// components/dashboard/WithdrawSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface Recipient {
  id: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  nickname: string;
  bank_name: string;
}

interface WithdrawSectionProps {
  accountType: 'Checking' | 'Savings';
  balance: number;
  withdrawalLimit: number;
  userId: string;
}

export default function WithdrawSection({ accountType, balance: initialBalance, withdrawalLimit, userId }: WithdrawSectionProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalCount, setWithdrawalCount] = useState(0);
  const [showRecipientForm, setShowRecipientForm] = useState(false);
  const { user } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    if (user?.id && typeof user.id === 'string' && user.id !== 'undefined' && user.id !== 'null' && user.id.trim() !== '') {
      fetchBalance();
      fetchRecipients();
      fetchWithdrawalCount();
    }
  }, [user?.id]);

  const fetchBalance = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('checking_balance, savings_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const currentBalance = accountType === 'Checking' 
        ? (data.checking_balance || 0) 
        : (data.savings_balance || 0);
      setBalance(currentBalance);
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to load balance');
    }
  };

  const fetchRecipients = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping recipient fetch');
      return;
    }

    // Additional check to ensure user ID is a valid UUID
    if (typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null' || user.id.trim() === '') {
      console.log('Invalid user ID:', user.id);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    }
  };

  const fetchWithdrawalCount = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('withdrawal_count')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setWithdrawalCount(data.withdrawal_count || 0);
    } catch (error: any) {
      console.error('Error fetching withdrawal count:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to make a withdrawal.');
      return;
    }

    if (!selectedRecipient) {
      toast.error('Please select a recipient.');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (withdrawalAmount > (balance || 0)) {
      toast.error('Insufficient funds for this withdrawal.');
      return;
    }

    // Block withdrawals after third withdrawal
    if (withdrawalCount >= 3) {
      toast.error('You have reached your withdrawal limit. You cannot make any more withdrawals. Please contact support for assistance.', {
        duration: 8000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Get recipient details
      const recipient = recipients.find(r => r.id === selectedRecipient);
      if (!recipient) {
        throw new Error('Selected recipient not found');
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_type: accountType.toLowerCase(),
          transaction_type: 'withdrawal',
          method: 'Transfer',
          amount: withdrawalAmount,
          status: 'pending',
          account_name: `${accountType} Account`,
          bank_name: recipient.bank_name,
          routing_number: recipient.routing_number,
          recipient_id: selectedRecipient,
          description: `Withdrawal to ${recipient.nickname}`
        });

      if (transactionError) throw transactionError;

      // Update balance
      const balanceField = accountType === 'Checking' ? 'checking_balance' : 'savings_balance';
      const newBalance = (balance || 0) - withdrawalAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          [balanceField]: newBalance,
          withdrawal_count: withdrawalCount + 1
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setBalance(newBalance);
      setWithdrawalCount(withdrawalCount + 1);
      setAmount('');
      setSelectedRecipient('');
      
      toast.success(`Withdrawal of $${withdrawalAmount.toFixed(2)} submitted successfully!`);
      
      // Show support contact message after second withdrawal
      if (withdrawalCount + 1 >= 2) {
        toast.error('For additional withdrawals, please contact our support team at support@asababank.com or call 1-800-ASABA-BANK.', {
          duration: 8000,
        });
      }
      
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user?.id) {
    return <div className="text-center p-6 text-gray-600">Please log in to manage withdrawals.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{accountType} Withdrawals</h2>

      {/* Balance Display */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
        <p className="text-lg font-semibold text-blue-800">Current Balance:</p>
        <p className="text-3xl font-bold text-blue-900">
          ${balance !== null ? balance.toFixed(2) : 'N/A'}
        </p>
      </div>

      {/* Withdrawal Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Recipient *
          </label>
          {recipients.length === 0 ? (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="text-yellow-800 text-sm">
                No recipients found. You must add a recipient before making withdrawals.
              </p>
              <button
                onClick={() => setShowRecipientForm(true)}
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
              >
                Add Recipient
              </button>
            </div>
          ) : (
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              disabled={isProcessing}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a recipient...</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.nickname} - {recipient.account_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Amount ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            disabled={isProcessing}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <button
          onClick={handleWithdrawal}
          disabled={isProcessing || !selectedRecipient || !amount || parseFloat(amount) <= 0 || withdrawalCount >= 3}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isProcessing ? 'Processing...' : 'Submit Withdrawal'}
        </button>

        {withdrawalCount >= 3 && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-800 text-sm">
              <strong>Withdrawal Limit Reached:</strong> You have reached your withdrawal limit and cannot make any more withdrawals. Please contact support for assistance.
            </p>
          </div>
        )}

      </div>

      {/* Recipient Management */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Manage Recipients</h3>
          <button
            onClick={() => setShowRecipientForm(!showRecipientForm)}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            {showRecipientForm ? 'Cancel' : 'Add Recipient'}
          </button>
        </div>

        {showRecipientForm && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600 mb-4">
              Add a recipient to your list to enable withdrawals. You can only withdraw to pre-approved recipients.
            </p>
            {/* Recipient form would go here - you can import RecipientManager or create inline form */}
            <p className="text-sm text-gray-500">
              Recipient management is available in the main dashboard under the "Recipients" tab.
            </p>
          </div>
        )}

        {recipients.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Your Recipients:</p>
            {recipients.map((recipient) => (
              <div key={recipient.id} className="p-3 border rounded bg-gray-50">
                <p className="font-medium">{recipient.nickname}</p>
                <p className="text-sm text-gray-600">{recipient.account_name}</p>
                <p className="text-xs text-gray-500">
                  {recipient.bank_name} • {recipient.account_number}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
