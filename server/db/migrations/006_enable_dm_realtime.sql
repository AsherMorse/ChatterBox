-- Drop existing publication
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
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); 