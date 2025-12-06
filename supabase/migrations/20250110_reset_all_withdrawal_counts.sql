-- Reset withdrawal counter for ALL users
-- This migration resets the withdrawal_count to 0 for all profiles

UPDATE profiles
SET withdrawal_count = 0;

-- Verify the update
SELECT id, email, withdrawal_count 
FROM profiles 
ORDER BY created_at DESC;

