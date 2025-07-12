-- Fix RLS policies for tickets table - run this in your Supabase SQL Editor

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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;
GRANT USAGE ON SEQUENCE tickets_id_seq TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tickets'; 