-- Create missing accounts for existing users
-- Run this in your Supabase SQL Editor

-- First, let's see what users don't have accounts
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    COUNT(a.id) as account_count
FROM profiles p
LEFT JOIN accounts a ON p.id = a.user_id
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(a.id) = 0;

-- Create checking accounts for users who don't have any accounts
INSERT INTO accounts (
    user_id, 
    account_type, 
    account_name, 
    account_number, 
    routing_number, 
    balance, 
    status, 
    currency
)
SELECT 
    p.id,
    'checking',
    'Life Green Checking',
    '1234' || SUBSTRING(p.id::text, 1, 4) || '01',
    '123456789',
    100.00,
    'active',
    'USD'
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a.user_id = p.id
);

-- Create savings accounts for users who don't have any accounts
INSERT INTO accounts (
    user_id, 
    account_type, 
    account_name, 
    account_number, 
    routing_number, 
    balance, 
    status, 
    currency
)
SELECT 
    p.id,
    'savings',
    'BigTree Savings',
    '1234' || SUBSTRING(p.id::text, 1, 4) || '02',
    '987654321',
    50.00,
    'active',
    'USD'
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a.user_id = p.id AND a.account_type = 'savings'
);

-- Verify the accounts were created
SELECT 
    p.full_name,
    p.email,
    a.account_type,
    a.account_number,
    a.balance
FROM profiles p
JOIN accounts a ON p.id = a.user_id
ORDER BY p.full_name, a.account_type; 