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
  bio?: string;
  date_of_birth?: string;
  ssn?: string;
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

interface Account {
  id: string;
  user_id: string;
  account_type: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  balance: number;
  status: string;
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Immediate redirect for non-admin users
  useEffect(() => {
    if (!loading && !user) {
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
        router.push('/auth/login');
        return;
      }

      // Log admin access
      await auditLogger.logAdminAction(user?.id || '', 'admin_dashboard_access');
      
      // Load initial data
      loadUsers();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast.error('Access denied');
      router.push('/auth/login');
    }
  };

  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedUsers = (data || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        created_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at,
        full_name: profile.full_name || '',
        phone1: profile.phone1 || '',
        checking_balance: profile.checking_balance || 0,
        savings_balance: profile.savings_balance || 0,
        withdrawal_count: profile.withdrawal_count || 0,
        role: profile.role || 'user',
      }));
      setUsers(mappedUsers);
      setProfiles(data || []);
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

  const loadAccounts = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'profiles') loadProfiles();
    else if (activeTab === 'transactions') loadTransactions();
    else if (activeTab === 'recipients') loadRecipients();
    else if (activeTab === 'accounts') loadAccounts();
  }, [activeTab]);

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      let result;
      
      switch (action) {
        case 'delete':
          result = await supabase.auth.admin.deleteUser(userId);
          break;
        case 'update':
          result = await supabase.auth.admin.updateUserById(userId, data);
          break;
        case 'ban':
          result = await supabase.auth.admin.updateUserById(userId, { user_metadata: { banned: true } });
          break;
        case 'unban':
          result = await supabase.auth.admin.updateUserById(userId, { user_metadata: { banned: false } });
          break;
        default:
          throw new Error('Invalid action');
      }

      if (result.error) throw result.error;
      
      await auditLogger.logAdminAction(user?.id || '', action, userId, data);
      toast.success(`User ${action} successful`);
      loadUsers();
    } catch (error) {
      console.error('User action failed:', error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleProfileUpdate = async (profileId: string, data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileId);

      if (error) throw error;

      await auditLogger.logAdminAction(user?.id || '', 'profile_update', profileId, data);
      toast.success('Profile updated successfully');
      loadProfiles();
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
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
      }

      await auditLogger.logAdminAction(user?.id || '', `transaction_${action}`, transactionId);
      toast.success(`Transaction ${action} successful`);
      loadTransactions();
    } catch (error) {
      console.error('Transaction action failed:', error);
      toast.error(`Failed to ${action} transaction`);
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
      }

      await auditLogger.logAdminAction(user?.id || '', `recipient_${action}`, recipientId);
      toast.success(`Recipient ${action} successful`);
      loadRecipients();
    } catch (error) {
      console.error('Recipient action failed:', error);
      toast.error(`Failed to ${action} recipient`);
    }
  };

  const handleAccountAction = async (action: string, accountId: string, data?: any) => {
    try {
      let result;
      
      if (action === 'update') {
        result = await supabase
          .from('accounts')
          .update(data)
          .eq('id', accountId);
      } else if (action === 'delete') {
        result = await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId);
      }

      if (result?.error) throw result.error;

      await auditLogger.logAdminAction(user?.id || '', `account_${action}`, accountId, data);
      toast.success(`Account ${action} successful`);
      loadAccounts();
    } catch (error) {
      console.error('Account action failed:', error);
      toast.error(`Failed to ${action} account`);
    }
  };

  const filteredData = () => {
    const data = {
      users: users,
      profiles: profiles,
      transactions: transactions,
      recipients: recipients,
      accounts: accounts
    }[activeTab] || [];

    if (!searchTerm) return data;

    return data.filter((item: any) => {
      const searchFields = Object.values(item).join(' ').toLowerCase();
      return searchFields.includes(searchTerm.toLowerCase());
    });
  };

  const openEditModal = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingItem) return;

    try {
      switch (editingItem.type) {
        case 'profile':
          await handleProfileUpdate(editingItem.id, editingItem);
          break;
        case 'account':
          await handleAccountAction('update', editingItem.id, editingItem);
          break;
        case 'transaction':
          await handleTransactionAction('update', editingItem.id);
          break;
        case 'recipient':
          await handleRecipientAction('update', editingItem.id);
          break;
      }

      setShowEditModal(false);
      setEditingItem(null);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Edit save failed:', error);
      toast.error('Failed to update item');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage all user data and system operations</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', label: 'Users' },
              { id: 'profiles', label: 'Profiles' },
              { id: 'accounts', label: 'Accounts' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'recipients', label: 'Recipients' }
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
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'users' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  {activeTab === 'profiles' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balances</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  {activeTab === 'accounts' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  {activeTab === 'transactions' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                  {activeTab === 'recipients' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData().map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {activeTab === 'users' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.full_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(item, 'user')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleUserAction('delete', item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'profiles' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.phone1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Checking: ${item.checking_balance?.toFixed(2) || '0.00'}<br/>
                            Savings: ${item.savings_balance?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(item, 'profile')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'accounts' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.account_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">****{item.account_number.slice(-4)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.account_type === 'checking' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.account_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${item.balance?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(item, 'account')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAccountAction('delete', item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'transactions' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.user_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${item.amount?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleTransactionAction('delete', item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                    {activeTab === 'recipients' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.user_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.nickname}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.bank_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">****{item.account_number.slice(-4)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openEditModal(item, 'recipient')}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRecipientAction('delete', item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit {editingItem.type}</h3>
            <div className="space-y-4">
              {editingItem.type === 'profile' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={editingItem.full_name || ''}
                      onChange={(e) => setEditingItem({...editingItem, full_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={editingItem.email || ''}
                      onChange={(e) => setEditingItem({...editingItem, email: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={editingItem.phone1 || ''}
                      onChange={(e) => setEditingItem({...editingItem, phone1: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Checking Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.checking_balance || 0}
                      onChange={(e) => setEditingItem({...editingItem, checking_balance: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Savings Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.savings_balance || 0}
                      onChange={(e) => setEditingItem({...editingItem, savings_balance: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
              {editingItem.type === 'account' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      value={editingItem.account_name || ''}
                      onChange={(e) => setEditingItem({...editingItem, account_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <input
                      type="text"
                      value={editingItem.account_number || ''}
                      onChange={(e) => setEditingItem({...editingItem, account_number: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.balance || 0}
                      onChange={(e) => setEditingItem({...editingItem, balance: parseFloat(e.target.value)})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={editingItem.status || 'active'}
                      onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="frozen">Frozen</option>
                    </select>
                  </div>
                </>
              )}
              {editingItem.type === 'recipient' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nickname</label>
                    <input
                      type="text"
                      value={editingItem.nickname || ''}
                      onChange={(e) => setEditingItem({...editingItem, nickname: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <input
                      type="text"
                      value={editingItem.bank_name || ''}
                      onChange={(e) => setEditingItem({...editingItem, bank_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <input
                      type="text"
                      value={editingItem.account_number || ''}
                      onChange={(e) => setEditingItem({...editingItem, account_number: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                    <input
                      type="text"
                      value={editingItem.routing_number || ''}
                      onChange={(e) => setEditingItem({...editingItem, routing_number: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 