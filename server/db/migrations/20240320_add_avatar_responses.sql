-- Add avatar_responses table
CREATE TABLE avatar_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_message TEXT NOT NULL,
    generated_response TEXT NOT NULL,
    status TEXT CHECK (status IN ('success', 'error')) NOT NULL,
    processing_time INTEGER NOT NULL, -- in milliseconds
    error_type TEXT,
    error_details JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_avatar_responses_message_id ON avatar_responses(message_id);
CREATE INDEX idx_avatar_responses_target_user_id ON avatar_responses(target_user_id);
CREATE INDEX idx_avatar_responses_created_at ON avatar_responses(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_avatar_responses_updated_at
    BEFORE UPDATE ON avatar_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE avatar_responses;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON avatar_responses TO authenticated; 