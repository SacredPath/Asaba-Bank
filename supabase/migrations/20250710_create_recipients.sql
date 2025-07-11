-- Create recipients table for withdrawal recipients
CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    routing_number TEXT NOT NULL,
    nickname TEXT NOT NULL,
    bank_name TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_nickname UNIQUE (user_id, nickname)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_recipients_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp
CREATE TRIGGER update_recipients_timestamp
    BEFORE UPDATE ON recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_recipients_timestamp(); 