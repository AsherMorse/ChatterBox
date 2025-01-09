-- Create storage bucket for file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('file_attachments', 'file_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for file_attachments bucket
-- Allow users to upload files
CREATE POLICY "Upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'file_attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read files from channels they are members of
CREATE POLICY "Read files from channels"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'file_attachments'
    AND EXISTS (
        SELECT 1 FROM file_attachments fa
        JOIN messages m ON fa.message_id = m.id
        JOIN channel_members cm ON m.channel_id = cm.channel_id
        WHERE fa.file_url LIKE '%' || name
        AND cm.user_id = auth.uid()
    )
);

-- Allow users to read files from DMs they are part of
CREATE POLICY "Read files from DMs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'file_attachments'
    AND EXISTS (
        SELECT 1 FROM file_attachments fa
        JOIN messages m ON fa.message_id = m.id
        JOIN direct_messages dm ON m.dm_id = dm.dm_id
        WHERE fa.file_url LIKE '%' || name
        AND (dm.user1_id = auth.uid() OR dm.user2_id = auth.uid())
    )
);

-- Allow users to delete their own files
CREATE POLICY "Delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'file_attachments'
    AND EXISTS (
        SELECT 1 FROM file_attachments fa
        JOIN messages m ON fa.message_id = m.id
        WHERE fa.file_url LIKE '%' || name
        AND m.sender_id = auth.uid()
    )
); 