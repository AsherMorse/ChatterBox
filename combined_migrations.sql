-- Drop ALL existing tables and functions first
DROP TABLE IF EXISTS pinned_messages CASCADE;
DROP TABLE IF EXISTS bookmarked_messages CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS direct_message_participants CASCADE;
DROP TABLE IF EXISTS direct_message_members CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_file_attachments_updated_at() CASCADE;
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create extension for UUID support if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channels Table
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- Channel Members Table
CREATE TABLE channel_members (
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- Direct Messages Table
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Message Members Table
CREATE TABLE direct_message_members (
    dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (dm_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (channel_id IS NOT NULL AND dm_id IS NULL) OR
        (channel_id IS NULL AND dm_id IS NOT NULL)
    )
);

-- Message Reactions Table
CREATE TABLE message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

-- Files Table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarked Messages Table
CREATE TABLE bookmarked_messages (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

-- Pinned Messages Table
CREATE TABLE pinned_messages (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (message_id)
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); -- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Enable specific operations for the publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); -- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Enable realtime for messages
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for channels
ALTER TABLE channels REPLICA IDENTITY FULL; TRUNCATE TABLE
    pinned_messages,
    bookmarked_messages,
    channel_members,
    channels,
    users
RESTART IDENTITY CASCADE; -- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime including both messages and message_reactions
CREATE PUBLICATION supabase_realtime 
FOR TABLE messages, message_reactions;

-- Enable realtime for messages (if not already done)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for message_reactions
ALTER TABLE message_reactions REPLICA IDENTITY FULL;

-- Enable specific operations for the publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); -- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime including messages, message_reactions, and direct_messages
CREATE PUBLICATION supabase_realtime 
FOR TABLE messages, message_reactions, direct_messages, direct_message_members;

-- Enable realtime for messages (if not already done)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for message_reactions (if not already done)
ALTER TABLE message_reactions REPLICA IDENTITY FULL;

-- Enable realtime for direct_messages
ALTER TABLE direct_messages REPLICA IDENTITY FULL;

-- Enable realtime for direct_message_members
ALTER TABLE direct_message_members REPLICA IDENTITY FULL;

-- Enable specific operations for the publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); -- Drop existing tables
DROP TABLE IF EXISTS direct_message_members CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;

-- Create direct_messages table with user references
CREATE TABLE direct_messages (
    dm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Create direct_message_participants table
CREATE TABLE direct_message_participants (
    dm_id UUID REFERENCES direct_messages(dm_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (dm_id, user_id)
);

-- Update messages table to reference dm_id correctly
ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_dm_id_fkey,
    ADD CONSTRAINT messages_dm_id_fkey 
    FOREIGN KEY (dm_id) 
    REFERENCES direct_messages(dm_id) 
    ON DELETE CASCADE;

-- Enable realtime for direct_messages and participants
ALTER TABLE direct_messages REPLICA IDENTITY FULL;
ALTER TABLE direct_message_participants REPLICA IDENTITY FULL;

-- Update realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime 
FOR TABLE messages, message_reactions, direct_messages, direct_message_participants; -- Enable UUID extension if not already enabled
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_file_attachments_message_id') THEN
        CREATE INDEX idx_file_attachments_message_id ON file_attachments(message_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_file_attachments_created_at') THEN
        CREATE INDEX idx_file_attachments_created_at ON file_attachments(created_at);
    END IF;
END $$;

-- Enable realtime for file_attachments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'file_attachments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE file_attachments;
    END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_file_attachments_updated_at ON file_attachments;
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at(); -- Create storage bucket for file attachments if it doesn't exist
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