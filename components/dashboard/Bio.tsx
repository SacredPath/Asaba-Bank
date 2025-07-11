import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface BioProps {
  name: string;
  userId?: string;
}

interface BioData {
  full_name: string;
  email: string;
  phone1: string;
  phone2: string;
  address: string;
  bio?: string;
}

const Bio: React.FC<BioProps> = ({ name, userId }) => {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [bioData, setBioData] = useState<BioData>({
    full_name: '',
    email: '',
    phone1: '',
    phone2: '',
    address: '',
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBio = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone1, phone2, address, bio')
          .eq('id', userId)
          .single();

        if (error) {
          setError(error.message);
        } else if (data) {
          setBioData({
            full_name: data.full_name || '',
            email: data.email || '',
            phone1: data.phone1 || '',
            phone2: data.phone2 || '',
            address: data.address || '',
            bio: data.bio || ''
          });
        }
      } catch (err) {
        setError('Failed to fetch bio');
      } finally {
        setLoading(false);
      }
    };

    fetchBio();
  }, [userId, supabase]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    // US phone numbers should be exactly 10 digits
    return digitsOnly.length === 10;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
    return phone;
  };

  const handleSave = async () => {
    if (!userId) return;

    // Validate phone numbers
    if (bioData.phone1 && !validatePhoneNumber(bioData.phone1)) {
      toast.error('Primary phone number must be exactly 10 digits');
      return;
    }

    if (bioData.phone2 && !validatePhoneNumber(bioData.phone2)) {
      toast.error('Secondary phone number must be exactly 10 digits');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone1: bioData.phone1 ? formatPhoneNumber(bioData.phone1) : '',
          phone2: bioData.phone2 ? formatPhoneNumber(bioData.phone2) : '',
          address: bioData.address,
          bio: bioData.bio
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating bio:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data by refetching
    const refetchBio = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone1, phone2, address, bio')
          .eq('id', userId)
          .single();

        if (error) {
          setError(error.message);
        } else if (data) {
          setBioData({
            full_name: data.full_name || '',
            email: data.email || '',
            phone1: data.phone1 || '',
            phone2: data.phone2 || '',
            address: data.address || '',
            bio: data.bio || ''
          });
        }
      } catch (err) {
        setError('Failed to fetch bio');
      } finally {
        setLoading(false);
      }
    };

    refetchBio();
    setIsEditing(false);
  };

  if (loading) return <p className="text-center p-6">Loading profile...</p>;
  if (error) return <p className="text-center p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Profile Information</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Name - Read Only */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={bioData.full_name}
            disabled
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
          />
          <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
        </div>

        {/* Email - Read Only */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={bioData.email}
            disabled
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* Primary Phone */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Primary Phone Number
          </label>
          <input
            type="tel"
            value={bioData.phone1}
            onChange={(e) => setBioData({...bioData, phone1: e.target.value})}
            disabled={!isEditing}
            placeholder="(555) 123-4567"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
          />
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">Enter 10-digit US phone number</p>
          )}
        </div>

        {/* Secondary Phone */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Secondary Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={bioData.phone2}
            onChange={(e) => setBioData({...bioData, phone2: e.target.value})}
            disabled={!isEditing}
            placeholder="(555) 987-6543"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
          />
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">Enter 10-digit US phone number</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Address
          </label>
          <textarea
            value={bioData.address}
            onChange={(e) => setBioData({...bioData, address: e.target.value})}
            disabled={!isEditing}
            rows={3}
            placeholder="Enter your full address"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Bio (Optional)
          </label>
          <textarea
            value={bioData.bio}
            onChange={(e) => setBioData({...bioData, bio: e.target.value})}
            disabled={!isEditing}
            rows={4}
            placeholder="Tell us about yourself..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
          />
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bio;
