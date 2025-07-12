'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Layout from '@/components/Layout';
import Greeting from '@/components/dashboard/Greeting';
import AccountSummary from '@/components/dashboard/AccountSummary';
import TransactionHistory from '@/components/dashboard/TransactionHistory';
import RecipientManager from '@/components/dashboard/RecipientManager';
import Bio from '@/components/dashboard/Bio';
import Support from '@/components/dashboard/Support';
import Tickets from '@/components/dashboard/Tickets';
import TwoFactorManagement from '@/components/dashboard/TwoFactorManagement';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = useSupabase();
  const [activeTab, setActiveTab] = useState('summary');
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  const loadProfile = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping profile load');
      setLoadingProfile(false);
      return;
    }

    // Additional check to ensure user ID is a valid UUID
    if (typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null' || user.id.trim() === '') {
      console.log('Invalid user ID:', user.id);
      setLoadingProfile(false);
      return;
    }

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
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileUpdate = () => {
    loadProfile(); // Refresh profile data
  };

  if (loading || loadingProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  console.log('[Dashboard] Current activeTab:', activeTab);
  console.log('[Dashboard] TwoFactorManagement import:', typeof TwoFactorManagement);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Greeting name={profile?.full_name || user?.email?.split('@')[0] || 'User'} />
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8 pb-2">
            {[
              { id: 'summary', label: 'Account Summary' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'recipients', label: 'Recipients' },
              { id: 'bio', label: 'Profile' },
              { id: '2fa', label: 'Security' },
              { id: 'support', label: 'Support' },
              { id: 'tickets', label: 'Tickets' }
            ].map((tab) => {
              console.log(`[Dashboard] Rendering tab: ${tab.id} - ${tab.label}`);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log(`[Dashboard] Clicking tab: ${tab.id}`);
                    setActiveTab(tab.id);
                  }}
                  className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'summary' && (
            <AccountSummary profile={profile} onUpdate={handleProfileUpdate} />
          )}
          
          {activeTab === 'transactions' && (
            <TransactionHistory userId={user.id} />
          )}
          
          {activeTab === 'recipients' && user && (
            <RecipientManager />
          )}
          
          {activeTab === 'bio' && (
            <Bio user={user} />
          )}
          
          {activeTab === '2fa' && (
            <div>
              <TwoFactorManagement />
            </div>
          )}
          
          {activeTab === 'support' && (
            <Support />
          )}
          
          {activeTab === 'tickets' && (
            <Tickets user={user} />
          )}
        </div>
      </div>
    </Layout>
  );
}
