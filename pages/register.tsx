'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '@/hooks/useSupabase';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function SetUpOnlineAccess() {
  const router = useRouter();
  const supabase = useSupabase();
  const [mode, setMode] = useState<'create' | 'retrieve'>('create');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    referenceNumber: '',
    ssn: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        // Create new account
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              reference_number: formData.referenceNumber,
              ssn: formData.ssn,
              phone: formData.phone
            }
          }
        });

        if (error) throw error;

        // Create profile
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone1: formData.phone,
            reference_number: formData.referenceNumber,
            ssn: formData.ssn
          });
        }

        toast.success('Account created successfully! Please check your email for verification.');
        router.push('/auth/login');
      } else {
        // Retrieve existing account
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('reference_number', formData.referenceNumber)
          .eq('ssn', formData.ssn)
          .single();

        if (error || !profiles) {
          toast.error('No account found with these credentials');
          return;
        }

        toast.success('Account found! Please log in with your email and password.');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(mode === 'create' ? 'Failed to create account' : 'Failed to retrieve account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Online Access</h1>
              <p className="text-gray-600 text-sm">Create or retrieve your Asaba Bank account</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  mode === 'create'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => setMode('retrieve')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  mode === 'retrieve'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Retrieve Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your reference number"
                />
              </div>

              {/* SSN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number
                </label>
                <input
                  type="password"
                  required
                  value={formData.ssn}
                  onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your SSN"
                />
              </div>

              {mode === 'create' && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
          <input
            type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Create a password (min 8 characters)"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
          <input
            type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
          <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50"
          >
                {loading ? 'Processing...' : mode === 'create' ? 'Create Account' : 'Retrieve Account'}
          </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
