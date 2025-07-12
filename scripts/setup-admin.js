require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  try {
    console.log('Setting up admin account...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Create admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@asabacorp.com',
      password: 'Max@123.net',
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (userError) {
      console.error('Error creating admin user:', userError);
      return;
    }

    console.log('Admin user created successfully:', userData.user.id);

    // Create profile for admin user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Admin User',
        email: 'admin@asabacorp.com',
        role: 'admin',
        checking_balance: 10000.00,
        savings_balance: 50000.00,
        withdrawal_count: 0
      });

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      return;
    }

    console.log('Admin profile created successfully');
    console.log('\n✅ Admin account setup complete!');
    console.log('Email: admin@asabacorp.com');
    console.log('Password: Max@123.net');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
setupAdmin(); 