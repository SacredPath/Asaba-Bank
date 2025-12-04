import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useSupabase } from '@/hooks/useSupabase';
import LoadingOverlay from '@/components/LoadingOverlay';
import Link from 'next/link';

export default function ResetPassword() {
  const supabase = useSupabase();
  const router = useRouter();
  
  // State declarations
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isResetFlow, setIsResetFlow] = useState(false);
  
  useEffect(() => {
    // Check URL for reset token (Supabase sends it as hash fragment)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const query = router.query;
      
      // Check for Supabase recovery token in hash or query params
      const hasRecoveryToken = hash.includes('access_token') || 
                               hash.includes('type=recovery') ||
                               query.type === 'recovery';
      
      if (hasRecoveryToken) {
        // Supabase will automatically process the token with detectSessionInUrl: true
        // Wait a moment for the session to be established, then check
        const checkSession = async () => {
          // Give Supabase time to process the token
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            setErrorMsg('Invalid or expired reset link. Please request a new one.');
            setIsResetFlow(false);
          } else {
            setIsResetFlow(true);
          }
        };
        
        checkSession();
      }
    }
    
    // Also listen for auth state changes (Supabase processes tokens automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        // Check if this is a recovery session
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          setIsResetFlow(true);
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router.query]);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setEmailSent(true);
      setSuccessMsg('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validate passwords
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setErrorMsg('Password must contain uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccessMsg('Password reset successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      padding: '1rem'
    }}>
      {loading && <LoadingOverlay isVisible={loading} message={isResetFlow ? "Resetting Password..." : "Sending Email..."} />}
      
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Image
            src="/logo.png"
            alt="Asaba Bank Logo"
            width={120}
            height={40}
            style={{ margin: '0 auto 1rem' }}
          />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0',
            textAlign: 'center'
          }}>
            {isResetFlow ? 'Reset Your Password' : 'Forgot Password?'}
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            {isResetFlow 
              ? 'Enter your new password below' 
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#dc2626',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '0.375rem',
            color: '#16a34a',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {successMsg}
          </div>
        )}

        {!isResetFlow ? (
          // Request reset email form
          <form onSubmit={handleRequestReset}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }} htmlFor="email">
                Email address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter your email"
                  disabled={loading || emailSent}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading || emailSent}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: loading || emailSent ? '#9ca3af' : '#3b82f6',
                  cursor: loading || emailSent ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {emailSent ? 'Email Sent!' : 'Send Reset Link'}
              </button>
            </div>

            <div style={{
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              <Link href="/auth/login" style={{
                color: '#3b82f6',
                textDecoration: 'none'
              }}>
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          // Reset password form
          <form onSubmit={handleResetPassword}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }} htmlFor="password">
                New Password
              </label>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter new password"
                  disabled={loading}
                />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }} htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Reset Password
              </button>
            </div>

            <div style={{
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              <Link href="/auth/login" style={{
                color: '#3b82f6',
                textDecoration: 'none'
              }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        width: '100%',
        maxWidth: 400,
        background: '#f9fafb',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: '1.5rem 1rem',
        fontSize: '0.95rem',
        color: '#374151',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
          NMLS number: 403503<br/>
          Routing number: 091000022
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          123 Main Street<br/>
          Minneapolis, MN 55401<br/>
          1-800-908-6600
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" aria-label="Google Play Store">
            <img src="/google-play.svg" alt="Google Play Store" style={{ height: 36 }} />
          </a>
          <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" aria-label="Apple App Store">
            <img src="/apple-store.svg" alt="Apple App Store" style={{ height: 36 }} />
          </a>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '0.93rem' }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</a>
          <a href="/mobile" style={{ color: '#2563eb', textDecoration: 'none' }}>Mobile</a>
          <a href="/browser-support" style={{ color: '#2563eb', textDecoration: 'none' }}>Browser Support</a>
          <a href="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact Us</a>
          <a href="/privacy" style={{ color: '#2563eb', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/dashboard/support" style={{ color: '#2563eb', textDecoration: 'none' }}>Get CoBrowsing Code</a>
        </nav>
        <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#059669' }}>
          FDIC-Insured - Backed by the full faith and credit of the U.S. Government
        </div>
        <div style={{ fontSize: '0.92rem', color: '#6b7280' }}>
          &copy; 2025 All rights reserved.
        </div>
      </footer>
    </div>
  );
}

