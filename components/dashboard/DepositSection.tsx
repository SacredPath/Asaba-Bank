// components/dashboard/DepositSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface DepositSectionProps {
  accountType: 'Checking' | 'Savings';
  userId: string;
  isAuthenticated: boolean;
}

export default function DepositSection({ accountType, userId, isAuthenticated }: DepositSectionProps) {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'ACH' | 'Wire'>('ACH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('checking_balance, savings_balance')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        } else if (data) {
          const currentBalance = accountType === 'Checking' 
            ? (data.checking_balance || 0) 
            : (data.savings_balance || 0);
          setBalance(currentBalance);
        }
      }
    };

    fetchBalance();
  }, [user, accountType, supabase]);

  const handleDeposit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to make a deposit.');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setIsProcessing(true);
    setShowConfirmation(true);

    try {
      // Simulate 3-second processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get user profile data for account details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_type: accountType.toLowerCase(),
          transaction_type: 'deposit',
          method: method,
          amount: depositAmount,
          status: 'pending',
          account_name: `${accountType} Account`,
          bank_name: 'Asaba Bank',
          routing_number: accountType === 'Checking' ? '123456789' : '987654321',
          description: `${method} deposit to ${accountType} account`
        });

      if (transactionError) {
        throw transactionError;
      }

      // Update balance
      const balanceField = accountType === 'Checking' ? 'checking_balance' : 'savings_balance';
      const newBalance = (balance || 0) + depositAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [balanceField]: newBalance })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setBalance(newBalance);
      setAmount('');
      toast.success(`${method} deposit of $${depositAmount.toFixed(2)} submitted successfully!`);
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(`Deposit failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{accountType} Deposits</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Transfer Method
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="method"
                value="ACH"
                checked={method === 'ACH'}
                onChange={(e) => setMethod(e.target.value as 'ACH' | 'Wire')}
                disabled={isProcessing}
                className="mr-2"
              />
              ACH (1-2 business days)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="method"
                value="Wire"
                checked={method === 'Wire'}
                onChange={(e) => setMethod(e.target.value as 'ACH' | 'Wire')}
                disabled={isProcessing}
                className="mr-2"
              />
              Wire (Same day)
            </label>
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isProcessing ? 'Processing...' : `Submit ${method} Deposit`}
        </button>

        {showConfirmation && isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-800">Processing your {method} deposit...</p>
            </div>
          </div>
        )}

        {balance !== null && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Current {accountType} Balance:</p>
            <p className="text-lg font-semibold">${balance.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
