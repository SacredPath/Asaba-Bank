-- Test script to verify accounts table and data
-- Run this in your Supabase SQL Editor

-- Check if accounts table exists and has the right structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Check how many accounts exist
SELECT COUNT(*) as total_accounts FROM accounts;

-- Check accounts by type
SELECT 
    account_type,
    COUNT(*) as count
FROM accounts 
GROUP BY account_type;

-- Check if any users have accounts
SELECT 
    p.full_name,
    p.email,
    COUNT(a.id) as account_count
FROM profiles p
LEFT JOIN accounts a ON p.id = a.user_id
GROUP BY p.id, p.full_name, p.email
ORDER BY account_count DESC;

-- Show sample account data
SELECT 
    a.id,
    a.user_id,
    a.account_type,
    a.account_name,
    a.account_number,
    a.balance,
    a.status,
    p.full_name
FROM accounts a
LEFT JOIN profiles p ON a.user_id = p.id
LIMIT 10; 