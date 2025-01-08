import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
);

class RealtimeService {
    constructor() {
        this.channels = new Map();
        this.typingChannels = new Map();
    }

    subscribeToChannel(channelId, onMessage) {
        console.log('Subscribing to channel:', channelId);
        
        // If already subscribed to this channel, return existing subscription
        if (this.channels.has(channelId)) {
            console.log('Already subscribed to channel:', channelId);
            return this.channels.get(channelId);
        }

        // Create a new subscription
        const channel = supabase
            .channel(`messages:${channelId}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    console.log('New message received:', payload);
                    onMessage({
                        type: 'new_message',
                        message: payload.new
                    });
                }
            )
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    console.log('Message updated:', payload);
                    onMessage({
                        type: 'message_updated',
                        message: payload.new
                    });
                }
            )
            .on('postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channelId}`
                },
                (payload) => {
                    console.log('Message deleted:', payload);
                    onMessage({
                        type: 'message_deleted',
                        messageId: payload.old.id
                    });
                }
            );

        // Subscribe and handle status
        channel.subscribe(async (status) => {
            console.log(`Realtime subscription status for channel ${channelId}:`, status);
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to channel:', channelId);
            } else if (status === 'CLOSED') {
                console.log('Channel closed:', channelId);
                this.channels.delete(channelId);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('Channel error for:', channelId);
                this.channels.delete(channelId);
            }
        });

        // Store the subscription
        this.channels.set(channelId, channel);
        return channel;
    }

    unsubscribeFromChannel(channelId) {
        console.log('Unsubscribing from channel:', channelId);
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.unsubscribe();
            supabase.removeChannel(channel);
            this.channels.delete(channelId);
            console.log('Successfully unsubscribed from channel:', channelId);
        }
    }

    // Subscribe to typing indicators using Supabase Presence
    subscribeToTyping(channelId, onTypingUpdate) {
        console.log('Setting up typing subscription for channel:', channelId);
        
        const channelKey = `typing:${channelId}`;
        if (this.typingChannels.has(channelKey)) {
            return this.typingChannels.get(channelKey);
        }

        const channel = supabase
            .channel(channelKey)
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                console.log('Presence state:', state);
                const typingUsers = Object.values(state).flat();
                console.log('Typing users after sync:', typingUsers);
                onTypingUpdate(typingUsers);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Join event:', { key, newPresences });
                onTypingUpdate(newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Leave event:', { key, leftPresences });
                const state = channel.presenceState();
                const typingUsers = Object.values(state).flat();
                console.log('Typing users after leave:', typingUsers);
                onTypingUpdate(typingUsers);
            })
            .subscribe(async (status) => {
                console.log(`Typing channel ${channelKey} status:`, status);
            });

        this.typingChannels.set(channelKey, channel);
        return channel;
    }

    startTyping(channel, user) {
        channel.track({
            id: user.id,
            username: user.username
        });
    }

    stopTyping(channel) {
        channel.untrack();
    }
}

// Create a singleton instance
const realtimeService = new RealtimeService();
export default realtimeService; 