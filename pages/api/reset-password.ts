import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get the origin from request headers or environment
    // Priority: origin header > referer > env variable > localhost
    let origin = req.headers.origin;
    
    if (!origin && req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        origin = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        // Invalid referer, use fallback
      }
    }
    
    if (!origin) {
      if (process.env.VERCEL_URL) {
        origin = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        origin = 'http://localhost:3000';
      }
    }
    
    // Ensure we don't use localhost in production
    if (process.env.NODE_ENV === 'production' && origin.includes('localhost')) {
      if (process.env.VERCEL_URL) {
        origin = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        origin = 'https://asaba-bank.vercel.app';
      }
    }
    
    const redirectTo = `${origin}/auth/reset-password`;
    console.log('Password reset - Origin:', origin);
    console.log('Password reset - Redirect URL:', redirectTo);

    // Method 1: Use direct OTP endpoint (sends email directly)
    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', redirectTo);
    
    const otpResponse = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        redirect_to: redirectTo,
      }),
    });

    const otpData = await otpResponse.json();

    if (!otpResponse.ok) {
      console.error('OTP Error:', otpData);
      
      // Fallback: Try admin.generateLink method
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) {
        console.error('GenerateLink Error:', error);
        return res.status(400).json({
          error: error.message || 'Failed to send password reset email',
          details: error,
        });
      }

      if (data) {
        return res.status(200).json({
          success: true,
          message: 'Password reset email sent successfully',
          email: email,
          method: 'generateLink',
        });
      }
      
      return res.status(otpResponse.status).json({
        error: otpData.message || otpData.error_description || 'Failed to send reset email',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
      email: email,
      method: 'recover',
    });
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    return res.status(500).json({
      error: 'Failed to send password reset email',
      message: error.message,
    });
  }
}

