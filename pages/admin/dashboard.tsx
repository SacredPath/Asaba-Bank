'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { auditLogger } from '@/lib/audit-logger';
import toast from 'react-hot-toast';
import AdminNavbar from '@/components/AdminNavbar';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  full_name?: string;
  phone1?: string;
  checking_balance?: number;
  savings_balance?: number;
  withdrawal_count?: number;
  role?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone1: string;
  phone2?: string;
  address?: string;
  checking_balance: number;
  savings_balance: number;
  withdrawal_count: number;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Recipient {
  id: string;
  user_id: string;
  nickname: string;
  account_number: string;
  routing_number: string;
  bank_name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useSupabase();
  
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Check admin access
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Authentication required');
      router.push('/auth/login');
      return;
    }

    if (user) {
      checkAdminAccess();
    }
  }, [user, loading, router]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error || profile?.role !== 'admin') {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      // Log admin access
      await auditLogger.logAdminAction(user?.id || '', 'admin_dashboard_access');
      
      // Load initial data
      loadUsers();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast.error('Access denied');
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingData(false);
    }
  };

  const loadProfiles = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoadingData(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoadingData(false);
    }
  };

  const loadRecipients = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'profiles') loadProfiles();
    else if (activeTab === 'transactions') loadTransactions();
    else if (activeTab === 'recipients') loadRecipients();
  }, [activeTab]);

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      switch (action) {
        case 'delete':
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) throw deleteError;
          toast.success('User deleted successfully');
          await auditLogger.logAdminAction(user?.id || '', 'delete_user', userId);
          break;
        
        case 'update':
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, data);
          if (updateError) throw updateError;
          toast.success('User updated successfully');
          await auditLogger.logAdminAction(user?.id || '', 'update_user', userId);
          break;
        
        case 'ban':
          const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { banned: true }
          });
          if (banError) throw banError;
          toast.success('User banned successfully');
          await auditLogger.logAdminAction(user?.id || '', 'ban_user', userId);
          break;
        
        case 'unban':
          const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { banned: false }
          });
          if (unbanError) throw unbanError;
          toast.success('User unbanned successfully');
          await auditLogger.logAdminAction(user?.id || '', 'unban_user', userId);
          break;
      }
      
      loadUsers(); // Refresh data
    } catch (error) {
      console.error('User action failed:', error);
      toast.error('Action failed');
    }
  };

  const handleProfileUpdate = async (profileId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileId);
      
      if (error) throw error;
      toast.success('Profile updated successfully');
      await auditLogger.logAdminAction(user?.id || '', 'update_profile', profileId);
      loadProfiles();
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Update failed');
    }
  };

  const handleTransactionAction = async (action: string, transactionId: string) => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId);
        
        if (error) throw error;
        toast.success('Transaction deleted successfully');
        await auditLogger.logAdminAction(user?.id || '', 'delete_transaction', transactionId);
        loadTransactions();
      }
    } catch (error) {
      console.error('Transaction action failed:', error);
      toast.error('Action failed');
    }
  };

  const handleRecipientAction = async (action: string, recipientId: string) => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('recipients')
          .delete()
          .eq('id', recipientId);
        
        if (error) throw error;
        toast.success('Recipient deleted successfully');
        await auditLogger.logAdminAction(user?.id || '', 'delete_recipient', recipientId);
        loadRecipients();
      }
    } catch (error) {
      console.error('Recipient action failed:', error);
      toast.error('Action failed');
    }
  };

  const filteredData = () => {
    const data = activeTab === 'users' ? users : 
                 activeTab === 'profiles' ? profiles :
                 activeTab === 'transactions' ? transactions :
                 recipients;
    
    if (!searchTerm) return data;
    
    return data.filter((item: any) => 
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading || loadingData) {
    return (
      <>
        <AdminNavbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all user data and system operations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by email, name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', label: 'Users', count: users.length },
              { id: 'profiles', label: 'Profiles', count: profiles.length },
              { id: 'transactions', label: 'Transactions', count: transactions.length },
              { id: 'recipients', label: 'Recipients', count: recipients.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Data Tables */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map((user: User) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserAction('ban', user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ban
                          </button>
                          <button
                            onClick={() => handleUserAction('delete', user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map((profile: Profile) => (
                    <tr key={profile.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                        <div className="text-sm text-gray-500">{profile.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{profile.email}</div>
                        <div className="text-sm text-gray-500">{profile.phone1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Checking: ${profile.checking_balance?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Savings: ${profile.savings_balance?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(profile as any);
                            setEditData(profile);
                            setEditMode(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map((transaction: Transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'deposit' ? 'bg-green-100 text-green-800' :
                          transaction.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleTransactionAction('delete', transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'recipients' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map((recipient: Recipient) => (
                    <tr key={recipient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{recipient.nickname}</div>
                        <div className="text-sm text-gray-500">{recipient.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{recipient.bank_name}</div>
                        <div className="text-sm text-gray-500">****{recipient.account_number.slice(-4)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(recipient.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRecipientAction('delete', recipient.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editMode && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleProfileUpdate(selectedUser.id, editData);
                  setEditMode(false);
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={editData.full_name || ''}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={editData.phone1 || ''}
                        onChange={(e) => setEditData({...editData, phone1: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Checking Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.checking_balance || 0}
                        onChange={(e) => setEditData({...editData, checking_balance: parseFloat(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Savings Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.savings_balance || 0}
                        onChange={(e) => setEditData({...editData, savings_balance: parseFloat(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 