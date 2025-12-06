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

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get user ID from command line argument (optional - if not provided, resets all users)
const userId = process.argv[2];

async function resetWithdrawalCount() {
  console.log('🔄 Resetting Withdrawal Count...\n');
  console.log('='.repeat(60));

  try {
    if (userId) {
      // Reset for specific user
      console.log(`Resetting withdrawal count for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ withdrawal_count: 0 })
        .eq('id', userId)
        .select('id, email, withdrawal_count');

      if (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }

      if (data && data.length > 0) {
        console.log('✅ Withdrawal count reset successfully!');
        console.log('\n📋 Updated Profile:');
        console.log(`  - User ID: ${data[0].id}`);
        console.log(`  - Email: ${data[0].email || 'N/A'}`);
        console.log(`  - Withdrawal Count: ${data[0].withdrawal_count}`);
      } else {
        console.log('⚠️  No user found with that ID');
      }
    } else {
      // Reset for all users
      console.log('Resetting withdrawal count for ALL users...');
      
      // First, get count of users
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      console.log(`Found ${count} user(s) in database`);

      // Reset all withdrawal counts - use a WHERE clause that matches all
      // Supabase requires a WHERE clause for security
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id');

      if (!allProfiles || allProfiles.length === 0) {
        console.log('⚠️  No users found in database');
        return;
      }

      // Update each profile individually or use a WHERE clause that matches all
      const { data, error } = await supabase
        .from('profiles')
        .update({ withdrawal_count: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000') // This matches all rows since no ID is this
        .select('id, email, withdrawal_count');

      if (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }

      console.log(`✅ Successfully reset withdrawal count for ${data.length} user(s)!`);
      console.log('\n📋 Updated Profiles:');
      data.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.email || profile.id} - Count: ${profile.withdrawal_count}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Reset complete!');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
resetWithdrawalCount();

