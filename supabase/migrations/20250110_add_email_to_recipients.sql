-- Add email field to recipients table for withdrawal notifications
-- This allows sending email notifications to recipients when withdrawals are made

-- Add email column if it doesn't exist
ALTER TABLE recipients 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster email lookups (optional)
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email) WHERE email IS NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN recipients.email IS 'Email address of the recipient for withdrawal notifications';

