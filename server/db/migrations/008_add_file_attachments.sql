-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better performance
CREATE INDEX idx_file_attachments_message_id ON file_attachments(message_id);
CREATE INDEX idx_file_attachments_created_at ON file_attachments(created_at);

-- Enable row level security
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for file_attachments
-- Allow users to view files in channels they are members of
CREATE POLICY "View files in channels" ON file_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN channel_members cm ON m.channel_id = cm.channel_id
            WHERE m.id = file_attachments.message_id
            AND cm.user_id = auth.uid()
        )
    );

-- Allow users to view files in DMs they are part of
CREATE POLICY "View files in DMs" ON file_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN direct_messages dm ON m.dm_id = dm.dm_id
            WHERE m.id = file_attachments.message_id
            AND (dm.user1_id = auth.uid() OR dm.user2_id = auth.uid())
        )
    );

-- Allow users to upload files
CREATE POLICY "Upload files" ON file_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
            AND m.sender_id = auth.uid()
        )
    );

-- Allow users to delete their own files
CREATE POLICY "Delete own files" ON file_attachments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
            AND m.sender_id = auth.uid()
        )
    );

-- Enable realtime for file_attachments
ALTER PUBLICATION supabase_realtime ADD TABLE file_attachments;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at(); 