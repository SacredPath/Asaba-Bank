// components/dashboard/Tickets.tsx
'use client'; // This directive marks the component as a Client Component.

import { useState, useEffect } from 'react';
// Import createBrowserClient for client-side Supabase interactions.
// This is the correct way to initialize the Supabase client in client components
// for Next.js App Router.
import { useSupabase } from '@/hooks/useSupabase';
import toast from 'react-hot-toast'; // Assuming react-hot-toast is used for notifications

// Define the interface for a Ticket object, matching your Supabase table structure
interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'closed' | 'pending'; // Example statuses
  created_at: string;
  updated_at: string;
}

// Define the props for the Tickets component
interface TicketsProps {
  user: any;
}

export default function Tickets({ user }: TicketsProps) {
  const supabase = useSupabase();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: ''
  });

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user?.id,
          subject: formData.subject,
          description: formData.description,
          status: 'open'
        });

      if (error) throw error;

      toast.success('Ticket created successfully');
      setShowCreateForm(false);
      setFormData({ subject: '', description: '' });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Tickets</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Create Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No tickets found</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                  ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{ticket.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Status: {ticket.status}</span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Support Ticket</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Please provide detailed information about your issue"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
