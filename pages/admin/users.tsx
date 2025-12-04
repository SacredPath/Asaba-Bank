'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
// import { auditLogger } from '@/lib/audit-logger';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

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

export default function AdminUsers() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useSupabase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'user' });
  const [showCreateModal, setShowCreateModal] = useState(false);

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

      // Load users data
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
      // Use profiles table instead of admin API
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map profiles to User type
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
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      // Use admin API for user creation
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: createForm.email,
        password: createForm.password,
        user_metadata: {
          full_name: createForm.full_name,
          role: createForm.role
        }
      });

      if (error) throw error;

      // Create profile record using admin client
      if (data.user) {
        await supabaseAdmin.from('profiles').insert({
          id: data.user.id,
          full_name: createForm.full_name,
          email: createForm.email,
          role: createForm.role
        });
      }

      toast.success('User created successfully');
      // await auditLogger.logAdminAction(user?.id || '', 'create_user', data.user?.id);
      
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', full_name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUserAction = async (action: string, userId: string, data?: any) => {
    try {
      switch (action) {
        case 'delete':
          // Use admin API for user deletion
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (deleteError) throw deleteError;
          toast.success('User deleted successfully');
          // await auditLogger.logAdminAction(user?.id || '', 'delete_user', userId);
          break;
        
        case 'ban':
          const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { banned: true }
          });
          if (banError) throw banError;
          toast.success('User banned successfully');
          // await auditLogger.logAdminAction(user?.id || '', 'ban_user', userId);
          break;
        
        case 'unban':
          const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { banned: false }
          });
          if (unbanError) throw unbanError;
          toast.success('User unbanned successfully');
          // await auditLogger.logAdminAction(user?.id || '', 'unban_user', userId);
          break;
        
        case 'update':
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, data);
          if (updateError) throw updateError;
          toast.success('User updated successfully');
          // await auditLogger.logAdminAction(user?.id || '', 'update_user', userId);
          break;
      }
      
      loadUsers();
    } catch (error) {
      console.error('User action failed:', error);
      toast.error('Action failed');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage all user accounts and permissions</p>
        </div>

        {/* Search and Create */}
        <div className="mb-6 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'banned' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'banned' ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.role === 'banned' ? (
                          <button
                            onClick={() => handleUserAction('unban', user.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction('ban', user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ban
                          </button>
                        )}
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
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
