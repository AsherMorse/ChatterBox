-- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime including both messages and message_reactions
CREATE PUBLICATION supabase_realtime 
FOR TABLE messages, message_reactions;

-- Enable realtime for messages (if not already done)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for message_reactions
ALTER TABLE message_reactions REPLICA IDENTITY FULL;

-- Enable specific operations for the publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); 