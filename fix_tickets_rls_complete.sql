-- Complete fix for tickets RLS policies - run this in your Supabase SQL Editor

-- First, drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON tickets;

-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own tickets
CREATE POLICY "Users can insert their own tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own tickets
CREATE POLICY "Users can view their own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to update their own tickets
CREATE POLICY "Users can update their own tickets" ON tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own tickets
CREATE POLICY "Users can delete their own tickets" ON tickets
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions (no sequence needed for UUID primary keys)
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tickets';

-- Test the policies by checking if they exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tickets'; 