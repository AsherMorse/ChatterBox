-- Create storage bucket for file attachments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM storage.buckets
        WHERE id = 'file_attachments'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('file_attachments', 'file_attachments', true);
    END IF;
END $$;

-- Configure storage bucket policies
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
CREATE POLICY "Give users access to own folder" ON storage.objects
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'file_attachments') THEN
        ALTER TABLE file_attachments DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_file_attachments ON file_attachments';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages') THEN
        ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_messages ON messages';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'message_reactions') THEN
        ALTER TABLE message_reactions DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_message_reactions ON message_reactions';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channel_members') THEN
        ALTER TABLE channel_members DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_channel_members ON channel_members';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channels') THEN
        ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_channels ON channels';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'direct_messages') THEN
        ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;
        EXECUTE 'DROP POLICY IF EXISTS on_direct_messages ON direct_messages';
    END IF;
END $$; 