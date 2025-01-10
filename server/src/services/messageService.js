import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

class MessageService {
    constructor() {
        this.setupRealtimeSubscription();
    }

    setupRealtimeSubscription() {
        const channel = supabase
            .channel('messages')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    // Handle message changes through Supabase Realtime
                    console.log('Message change:', payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    async saveMessage(message) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                content: message.content,
                sender_id: message.sender_id,
                channel_id: message.channel_id,
                dm_id: message.dm_id,
                parent_id: message.parent_id
            })
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .single();

        if (error) {
            console.error('Error saving message:', error);
            throw error;
        }

        return data;
    }
}

export default MessageService; 