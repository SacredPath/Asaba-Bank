import { useState } from 'react';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import { useSupabase } from '@/hooks/useSupabase';
import Link from 'next/link';

// Password strength validation
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  return { isValid: true, message: 'Password is strong' };
};

// Input sanitization
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export default function SetUpOnlineAccess() {
  const supabase = useSupabase();
  const [mode, setMode] = useState<'create' | 'retrieve'>('create');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const checkGeo = async () => {
    try {
      const res = await fetch('https://jykafoyljnhhemisxwse.functions.supabase.co/check-country');
      const data = await res.json();
      if (!data.allowed) {
        toast.error('Blocked: Only users in the United States may register.');
        return false;
      }
      return true;
    } catch {
      toast.error('Location check failed.');
      return false;
    }
  };

  const handleCreateAccess = async () => {
    if (!referenceNumber || !ssn || !email || !password) {
      setError('All fields are required.');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate SSN format (basic)
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    if (!ssnRegex.test(ssn.replace(/\D/g, ''))) {
      setError('Please enter a valid SSN in format XXX-XX-XXXX.');
      return;
    }

    const geoOk = await checkGeo();
    if (!geoOk) return;

    try {
      // Create user account - DO NOT store SSN in user metadata
      const { data, error } = await supabase.auth.signUp({ 
        email: sanitizeInput(email), 
        password,
        options: {
          data: {
            reference_number: sanitizeInput(referenceNumber),
            // SSN should be stored securely in a separate encrypted table, not in user metadata
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMsg('Online access created successfully! Check your email for verification.');
      setError('');
    } catch (err) {
      setError('Failed to create online access. Please try again.');
    }
  };

  const handleRetrieveAccess = async () => {
    if (!referenceNumber || !ssn || !dob) {
      setError('All fields are required for account retrieval.');
      return;
    }

    const geoOk = await checkGeo();
    if (!geoOk) return;

    try {
      // In a real implementation, you would verify the credentials
      // and then allow the user to reset their password
      setMsg('Account found! Please check your email for password reset instructions.');
      setError('');
    } catch (err) {
      setError('Account not found or invalid credentials.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordStrength(validation.message);
    } else {
      setPasswordStrength('');
    }
  };

  return (
    <Layout title="Set Up Online Access">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-soft-lg ring-1 ring-indigo-200">
          <h2 className="mb-6 text-3xl font-extrabold text-center text-primary">Set Up Online Access</h2>
          
          {/* Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-md transition ${
                mode === 'create' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Create Access
            </button>
            <button
              onClick={() => setMode('retrieve')}
              className={`flex-1 py-2 px-4 rounded-md transition ${
                mode === 'retrieve' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Retrieve Access
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {msg && <p className="mb-3 text-sm text-green-600">{msg}</p>}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Reference Number"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setReferenceNumber(sanitizeInput(e.target.value))}
              maxLength={50}
            />
            <input
              type="text"
              placeholder="Social Security Number (SSN)"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setSsn(e.target.value)}
              maxLength={11}
            />
            
            {mode === 'create' && (
              <>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  maxLength={100}
                />
                <div>
                  <input
                    type="password"
                    placeholder="Create Password"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={handlePasswordChange}
                    minLength={8}
                  />
                  {passwordStrength && (
                    <p className={`text-sm mt-1 ${
                      passwordStrength.includes('strong') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passwordStrength}
                    </p>
                  )}
                </div>
              </>
            )}

            {mode === 'retrieve' && (
              <input
                type="date"
                placeholder="Date of Birth"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setDob(e.target.value)}
              />
            )}

            <button
              onClick={mode === 'create' ? handleCreateAccess : handleRetrieveAccess}
              className="w-full py-3 font-semibold text-white rounded-lg bg-primary hover:bg-primary-dark transition"
            >
              {mode === 'create' ? 'Create Online Access' : 'Retrieve Access'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-primary hover:underline">
              Already have online access? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
