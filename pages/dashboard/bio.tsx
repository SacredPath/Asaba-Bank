import DashboardNavbar from '@/components/dashboard/Navbar';
import Bio from '@/components/dashboard/Bio';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

export default function BioPage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone1, phone2, address')
        .eq('id', user.id)
        .single();
      if (!error && data) setUserData(data);
    };
    fetchUserData();
  }, [user, supabase]);

  if (!userData) return <p>Loading...</p>;

  return (
    <>
      <DashboardNavbar showHome />
      <main className="max-w-4xl mx-auto mt-8 p-6">
        <Bio name={userData.full_name} />
      </main>
    </>
  );
}
