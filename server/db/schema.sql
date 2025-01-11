-- Complete ChatterBox Database Schema with Realtime Support
-- This file contains the complete database schema and realtime configuration

-- Initial setup block for extensions and schemas
DO $$ 
DECLARE
    schema_name text;
BEGIN
    -- Create extensions if they don't exist
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Create schemas if they don't exist
    FOR schema_name IN SELECT unnest(ARRAY['public', 'storage', 'graphql', 'realtime'])
    LOOP
        BEGIN
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
            RAISE NOTICE 'Created or verified schema: %', schema_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error creating schema %: %', schema_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Role and permission setup
DO $$ 
DECLARE
    role_password text := 'mysecretpassword';  -- Change this in production
BEGIN
    -- Create authenticator role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        EXECUTE format('CREATE ROLE authenticator WITH NOINHERIT LOGIN PASSWORD %L', role_password);
        RAISE NOTICE 'Created authenticator role';
    END IF;

    -- Create anon role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
        RAISE NOTICE 'Created anon role';
    END IF;

    -- Create authenticated role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
        RAISE NOTICE 'Created authenticated role';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in role creation: %', SQLERRM;
END $$;

-- Drop existing tables to ensure clean slate
DROP TABLE IF EXISTS pinned_messages CASCADE;
DROP TABLE IF EXISTS bookmarked_messages CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS direct_message_participants CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_file_attachments_updated_at() CASCADE;
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    presence TEXT CHECK (presence IN ('online', 'offline', 'idle')) DEFAULT 'offline',
    custom_status_text TEXT,
    custom_status_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name)
);

CREATE TABLE channel_members (
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- Direct Messaging Tables
CREATE TABLE direct_messages (
    dm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE direct_message_participants (
    dm_id UUID REFERENCES direct_messages(dm_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (dm_id, user_id)
);

-- Messaging Tables
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    dm_id UUID REFERENCES direct_messages(dm_id) ON DELETE CASCADE,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT false,
    is_thread_reply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (channel_id IS NOT NULL AND dm_id IS NULL) OR
        (channel_id IS NULL AND dm_id IS NOT NULL)
    )
);

CREATE TABLE message_reactions (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, emoji)
);

-- File Management Tables
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences and Features
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookmarked_messages (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

CREATE TABLE pinned_messages (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id)
);

-- Triggers for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_file_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers
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
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_file_attachments_updated_at();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add reply count function and trigger
CREATE OR REPLACE FUNCTION update_message_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a thread reply being added
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        -- Update the parent message's reply count
        UPDATE messages 
        SET reply_count = (
            SELECT COUNT(*) 
            FROM messages 
            WHERE parent_id = NEW.parent_id
        )
        WHERE id = NEW.parent_id;
    -- If this is a thread reply being deleted
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        -- Update the parent message's reply count
        UPDATE messages 
        SET reply_count = (
            SELECT COUNT(*) 
            FROM messages 
            WHERE parent_id = OLD.parent_id
        )
        WHERE id = OLD.parent_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add reply_count column to messages
ALTER TABLE messages ADD COLUMN reply_count INTEGER DEFAULT 0;

-- Create trigger for reply count updates
CREATE TRIGGER update_message_reply_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_reply_count();

-- Initialize reply counts for existing messages
UPDATE messages m
SET reply_count = (
    SELECT COUNT(*)
    FROM messages
    WHERE parent_id = m.id
)
WHERE id IN (
    SELECT DISTINCT parent_id
    FROM messages
    WHERE parent_id IS NOT NULL
);

-- Setup realtime configuration
DO $$
DECLARE
    table_name text;
BEGIN
    -- Enable replica identity for realtime tables
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'messages', 'message_reactions', 
            'direct_messages', 'direct_message_participants',
            'channels', 'channel_members', 'file_attachments'
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
            RAISE NOTICE 'Enabled REPLICA IDENTITY FULL for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error setting REPLICA IDENTITY for %: %', table_name, SQLERRM;
        END;
    END LOOP;

    -- Create realtime publication
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime FOR TABLE 
        users,
        messages, 
        message_reactions, 
        direct_messages, 
        direct_message_participants,
        channels,
        channel_members,
        file_attachments;

    ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete');
    RAISE NOTICE 'Realtime publication configured';

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in realtime setup: %', SQLERRM;
END $$;

-- Grant permissions block
DO $$ 
DECLARE
    schema_name text;
    table_name text;
BEGIN
    -- Grant schema usage
    FOR schema_name IN SELECT unnest(ARRAY['public', 'storage', 'graphql', 'realtime'])
    LOOP
        BEGIN
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticator', schema_name);
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon', schema_name);
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
            RAISE NOTICE 'Granted schema permissions for %', schema_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error granting schema permissions for %: %', schema_name, SQLERRM;
        END;
    END LOOP;

    -- Grant table permissions
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('GRANT ALL ON TABLE %I TO authenticator', table_name);
            EXECUTE format('GRANT SELECT ON TABLE %I TO anon', table_name);
            EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', table_name);
            RAISE NOTICE 'Granted table permissions for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error granting table permissions for %: %', table_name, SQLERRM;
        END;
    END LOOP;

    -- Grant sequence permissions
    FOR table_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO authenticator', table_name);
            EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO authenticated', table_name);
            RAISE NOTICE 'Granted sequence permissions for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error granting sequence permissions for %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Final configuration
DO $$
DECLARE
    table_name text;
BEGIN
    -- Set schema access for roles
    ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, storage, graphql, realtime';
    ALTER ROLE anon SET pgrst.db_schemas TO 'public, storage, graphql, realtime';
    ALTER ROLE authenticated SET pgrst.db_schemas TO 'public, storage, graphql, realtime';
    
    -- Grant role memberships
    GRANT anon TO authenticator;
    GRANT authenticated TO authenticator;
    
    -- Disable RLS for all tables
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
    END LOOP;

    -- Enable REPLICA IDENTITY FULL for realtime tables
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 'messages', 'message_reactions', 
            'direct_messages', 'direct_message_participants',
            'channels', 'channel_members', 'file_attachments'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
        RAISE NOTICE 'Enabled REPLICA IDENTITY FULL for %', table_name;
    END LOOP;

    -- Final verification
    IF EXISTS (
        SELECT 1 
        FROM pg_roles 
        WHERE rolname = 'authenticator'
        AND rolcanlogin
    ) THEN
        RAISE NOTICE 'Setup completed successfully';
    ELSE
        RAISE WARNING 'Setup may not be complete - check role configuration';
    END IF;

    -- Notify PostgREST
    NOTIFY pgrst;
    RAISE NOTICE 'PostgREST notified of changes';

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in final configuration: %', SQLERRM;
END $$; 