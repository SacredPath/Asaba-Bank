// components/dashboard/RecipientManager.tsx
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
  created_at: string;
}

export default function RecipientManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    account_number: '',
    routing_number: '',
    nickname: '',
    bank_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabase();

  useEffect(() => {
    if (authLoading) {
      // Still loading auth, don't fetch recipients yet
      return;
    }
    
    if (user?.id) {
      fetchRecipients();
    } else if (user === null) {
      // User is not authenticated
      setLoading(false);
    }
    // If user is undefined, still loading
  }, [user?.id, user, authLoading]);

  const fetchRecipients = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping recipient fetch');
      setLoading(false);
      return;
    }

    console.log('Fetching recipients for user:', user.id);

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
      
      console.log('Recipients loaded:', data);
      setRecipients(data || []);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      console.log('No user ID found');
      toast.error('User not authenticated');
      return;
    }

    console.log('Submitting recipient form:', formData);
    console.log('User ID:', user.id);

    // Validate phone number format (10 digits for US)
    const routingRegex = /^\d{9}$/;
    if (!routingRegex.test(formData.routing_number)) {
      toast.error('Routing number must be exactly 9 digits');
      return;
    }

    const accountRegex = /^\d{8,17}$/;
    if (!accountRegex.test(formData.account_number)) {
      toast.error('Account number must be 8-17 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        user_id: user.id,
        account_name: formData.account_name,
        account_number: formData.account_number,
        routing_number: formData.routing_number,
        nickname: formData.nickname,
        bank_name: formData.bank_name
      };

      console.log('Inserting recipient with data:', insertData);

      const { data, error } = await supabase
        .from('recipients')
        .insert(insertData)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Recipient added successfully:', data);
      toast.success('Recipient added successfully!');
      setFormData({
        account_name: '',
        account_number: '',
        routing_number: '',
        nickname: '',
        bank_name: ''
      });
      setShowForm(false);
      fetchRecipients();
    } catch (error: any) {
      console.error('Error adding recipient:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      toast.error(`Failed to add recipient: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recipientId: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) return;

    try {
      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', recipientId);

      if (error) throw error;

      toast.success('Recipient deleted successfully!');
      fetchRecipients();
    } catch (error: any) {
      console.error('Error deleting recipient:', error);
      toast.error('Failed to delete recipient');
    }
  };

  if (authLoading || loading) {
    return <div className="text-center p-6">Loading recipients...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recipients</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Add Recipient'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Account Name *
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nickname *
              </label>
              <input
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="John's Account"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Account Number *
              </label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Routing Number *
              </label>
              <input
                type="text"
                required
                value={formData.routing_number}
                onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="123456789"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Bank of America"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isSubmitting ? 'Adding...' : 'Add Recipient'}
          </button>
        </form>
      )}

      {recipients.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No recipients added yet. Add your first recipient above.</p>
      ) : (
        <div className="space-y-4">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{recipient.nickname}</h3>
                  <p className="text-gray-700">{recipient.account_name}</p>
                  <p className="text-sm text-gray-600">
                    Account: {recipient.account_number} | Routing: {recipient.routing_number}
                  </p>
                  {recipient.bank_name && (
                    <p className="text-sm text-gray-600">Bank: {recipient.bank_name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(recipient.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
