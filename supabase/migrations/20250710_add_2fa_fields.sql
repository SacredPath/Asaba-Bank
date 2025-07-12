-- Add 2FA fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_setup_date TIMESTAMP WITH TIME ZONE;

-- Create index for 2FA queries
CREATE INDEX IF NOT EXISTS idx_profiles_2fa_enabled ON profiles(two_factor_enabled);

-- Add RLS policy for 2FA fields
CREATE POLICY "users_can_update_own_2fa" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add audit logging for 2FA events
INSERT INTO audit_logs (event_type, details, severity) VALUES 
('2fa_enabled', '{"message": "2FA fields added to profiles table"}', 'low'),
('2fa_setup', '{"message": "2FA setup components created"}', 'low'); 