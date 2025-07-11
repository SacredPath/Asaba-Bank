-- Fix recipients table - run this in your Supabase SQL Editor

-- Drop the table if it exists (to recreate it properly)
DROP TABLE IF EXISTS recipients CASCADE;

-- Create recipients table for withdrawal recipients
CREATE TABLE recipients (
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
CREATE INDEX idx_recipients_user_id ON recipients(user_id);

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

-- Enable RLS (Row Level Security)
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own recipients
CREATE POLICY "Users can insert their own recipients" ON recipients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own recipients
CREATE POLICY "Users can view their own recipients" ON recipients
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to update their own recipients
CREATE POLICY "Users can update their own recipients" ON recipients
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own recipients
CREATE POLICY "Users can delete their own recipients" ON recipients
    FOR DELETE USING (auth.uid() = user_id);

-- Verify the table was created
SELECT * FROM recipients LIMIT 0; 