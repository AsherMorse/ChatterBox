-- Drop existing tables
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
FOR TABLE messages, message_reactions, direct_messages, direct_message_participants; 