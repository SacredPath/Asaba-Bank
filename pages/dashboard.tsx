import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';

// Helper function to get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Helper function to get first name from full name
const getFirstName = (fullName: string): string => {
  return fullName ? fullName.split(' ')[0] : '';
};

import AccountSummary from '@/components/dashboard/AccountSummary';
import Support from '@/components/dashboard/Support';
import Tickets from '@/components/dashboard/Tickets';
import DepositSection from '@/components/dashboard/DepositSection';
import WithdrawSection from '@/components/dashboard/WithdrawSection';
import Logo from '@/components/Logo';
import TransactionHistory from '@/components/dashboard/TransactionHistory';
import Bio from '@/components/dashboard/Bio';
import RecipientManager from '@/components/dashboard/RecipientManager';
import LoadingOverlay from '@/components/LoadingOverlay';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Account {
  type: 'Checking' | 'Savings';
  number: string;
  balance: number;
}

interface AccountBalances {
  checking: number;
  savings: number;
}

interface BioData {
  full_name: string;
  email: string;
  phone1: string;
  phone2: string;
  address: string;
}

interface UserData {
  full_name: string;
  email: string;
  phone1: string;
  phone2: string;
  address: string;
  user_id: string;
}

export default function Dashboard() {
  const supabase = useSupabase();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('summary');
  const [bioData, setBioData] = useState<BioData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalances>({
    checking: 0,
    savings: 0,
  });
  const [withdrawalLimit, setWithdrawalLimit] = useState(2);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Simulate 3-second delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (loading || !user) return; // wait for auth and ensure user is not null

    const fetchUserData = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone1, phone2, address')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserData({
          ...data,
          user_id: user.id,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user, loading, supabase]);

  useEffect(() => {
    if (loading || !user) return; // wait for auth and ensure user is not null

    async function loadProfile() {
      if (!user) return;
      setLoadingProfile(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone1, phone2, address')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setBioData(profileData as BioData);
      }

      const { data: balanceData, error: balanceError } = await supabase
        .from('profiles')
        .select('checking_balance, savings_balance, withdrawal_count')
        .eq('id', user.id)
        .maybeSingle();

      if (!balanceError && balanceData) {
        setAccountBalances({
          checking: balanceData.checking_balance || 0,
          savings: balanceData.savings_balance || 0,
        });
        setWithdrawalLimit(2 - (balanceData.withdrawal_count || 0));
      }
      setLoadingProfile(false);
    }

    loadProfile();
  }, [user, loading, supabase, router]);

  if (loading || loadingProfile) {
    return <p className="text-center mt-10">Loading your dashboard...</p>;
  }

  if (!user) {
    router.push('/auth/login');
    return <p className="text-center mt-10">Redirecting to login...</p>;
  }

  const accounts: Account[] = [
    { type: 'Checking', number: '1234-5678-9012', balance: accountBalances.checking },
    { type: 'Savings', number: '9876-5432-1098', balance: accountBalances.savings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <LoadingOverlay isVisible={isLoggingOut} message="Logging Out..." />
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-3 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm md:text-base font-bold truncate">
              {getGreeting()}, {getFirstName(userData?.full_name || '') || user.email} 👋
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Logo />
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1 container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100">
          <nav className="flex flex-wrap gap-1.5 mb-3.5 overflow-x-auto pb-2">
            <button
              onClick={() => setTab('summary')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'summary' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setTab('deposits')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'deposits' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setTab('withdrawals')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'withdrawals' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Withdrawals
            </button>
            <button
              onClick={() => setTab('transactions')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'transactions' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setTab('support')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'support' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Support
            </button>
            <button
              onClick={() => setTab('profile')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setTab('tickets')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'tickets' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Tickets
            </button>
            <button
              onClick={() => setTab('recipients')}
              className={`px-3 py-2 rounded text-sm whitespace-nowrap ${
                tab === 'recipients' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}
            >
              Recipients
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {tab === 'summary' && user && <AccountSummary userId={user.id} />}

          {tab === 'deposits' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Deposits</h2>
              <div className="grid grid-cols-1 gap-4">
                <DepositSection
                  accountType="Checking"
                  userId={userData?.user_id || ''}
                  isAuthenticated={!!user}
                />
                <DepositSection
                  accountType="Savings"
                  userId={userData?.user_id || ''}
                  isAuthenticated={!!user}
                />
              </div>
            </div>
          )}

          {tab === 'withdrawals' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Withdrawals</h2>
              <div className="grid grid-cols-1 gap-4">
                <WithdrawSection
                  accountType="Checking"
                  balance={accountBalances.checking}
                  withdrawalLimit={withdrawalLimit}
                  userId={user ? user.id : ''}
                />
                <WithdrawSection
                  accountType="Savings"
                  balance={accountBalances.savings}
                  withdrawalLimit={withdrawalLimit}
                  userId={user ? user.id : ''}
                />
              </div>
            </div>
          )}

          {tab === 'transactions' && <TransactionHistory />}
          {tab === 'support' && <Support />}
          {tab === 'profile' && bioData && user && (
            <Bio name={bioData.full_name} userId={user.id} />
          )}
          {tab === 'tickets' && <Tickets />}
          {tab === 'recipients' && <RecipientManager />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
