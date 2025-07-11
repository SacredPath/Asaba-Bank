import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface BioProps {
  name: string;
  userId?: string; // Add userId prop for proper querying
}

const Bio: React.FC<BioProps> = ({ name, userId }) => {
  const supabase = useSupabase();
  const [bio, setBio] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBio = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone1, phone2, address')
          .eq('id', userId || '')
          .single();

        if (error) {
          setError(error.message);
        } else if (data) {
          // Since bio field doesn't exist, create a bio from available data
          const bioText = `Name: ${data.full_name || 'N/A'}\nEmail: ${data.email || 'N/A'}\nPhone: ${data.phone1 || 'N/A'}\nAddress: ${data.address || 'N/A'}`;
          setBio(bioText);
        }
      } catch (err) {
        setError('Failed to fetch bio');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBio();
    }
  }, [userId, supabase]);

  if (loading) return <p>Loading bio...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="bio">
      <h2 className="text-xl font-semibold mb-2">{name}'s Bio</h2>
      <p>{bio || 'No bio available.'}</p>
    </div>
  );
};

export default Bio;
