require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/send-otp-email.js <email>');
  process.exit(1);
}

async function sendOTP() {
  console.log('📧 Sending OTP email...\n');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  console.log('='.repeat(60));

  try {
    // Send OTP email using Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (error) {
      console.error('\n❌ Error sending OTP:', error.message);
      console.error('Code:', error.status || 'N/A');
      process.exit(1);
    }

    console.log('\n✅ OTP email sent successfully!');
    console.log('📧 Check the inbox for:', email);
    console.log('\n💡 The user will receive a magic link to sign in.');
    
    if (data) {
      console.log('\n📋 Link details:');
      console.log('  - Action Link:', data.properties?.action_link || 'N/A');
      console.log('  - Email OTP:', data.properties?.email_otp || 'N/A');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Use the OTP endpoint directly via fetch
async function sendOTPDirect() {
  console.log('\n📧 Sending OTP via Supabase Auth API...\n');
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.message || data.error_description || 'Unknown error');
      console.error('Status:', response.status);
      if (data.error) {
        console.error('Error details:', data.error);
      }
      process.exit(1);
    }

    console.log('✅ OTP sent successfully!');
    console.log('📧 Check the inbox for:', email);
    console.log('\n💡 The user will receive a magic link/OTP code to sign in.');
    
    if (data) {
      console.log('\n📋 Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Check Node.js version and use appropriate method
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

if (majorVersion >= 18) {
  // Node.js 18+ has native fetch
  sendOTPDirect();
} else {
  // Node.js < 18, use Supabase client method
  sendOTP();
}

