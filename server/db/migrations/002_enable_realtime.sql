-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- Enable specific operations for the publication
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete'); 