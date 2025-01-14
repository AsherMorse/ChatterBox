-- Add metadata column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING GIN (metadata); 