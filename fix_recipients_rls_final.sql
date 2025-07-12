-- Fix RLS policies for recipients table - run this in your Supabase SQL Editor

-- First, drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can update their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can delete their own recipients" ON recipients;

-- Enable RLS on recipients table
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recipients TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'recipients';

-- Test the policies by checking if they exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recipients'; 