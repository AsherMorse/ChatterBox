-- Drop existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Enable realtime for messages
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for channels
ALTER TABLE channels REPLICA IDENTITY FULL; 