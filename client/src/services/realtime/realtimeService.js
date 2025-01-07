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

    // Subscribe to typing indicators
    subscribeToTyping(channelId, onTypingUpdate) {
        console.log('Setting up typing subscription for channel:', channelId);
        
        if (this.typingChannels.has(channelId)) {
            return this.typingChannels.get(channelId);
        }

        const channel = supabase
            .channel(`typing:${channelId}`)
            .on('presence', { event: 'sync' }, () => {
                const typingUsers = this.getTypingUsers(channel);
                console.log('Typing sync event:', typingUsers);
                onTypingUpdate(typingUsers);
            })
            .on('presence', { event: 'join' }, () => {
                const typingUsers = this.getTypingUsers(channel);
                console.log('Typing join event:', typingUsers);
                onTypingUpdate(typingUsers);
            })
            .on('presence', { event: 'leave' }, () => {
                const typingUsers = this.getTypingUsers(channel);
                console.log('Typing leave event:', typingUsers);
                onTypingUpdate(typingUsers);
            });

        channel.subscribe(async (status) => {
            console.log(`Typing subscription status for channel ${channelId}:`, status);
        });

        this.typingChannels.set(channelId, channel);
        return channel;
    }

    // Start typing indicator
    async startTyping(channel, user) {
        try {
            await channel.track({
                user_id: user.id,
                username: user.username,
                isTyping: true
            });
            console.log('Started typing indicator for user:', user.username);
        } catch (error) {
            console.error('Error starting typing indicator:', error);
        }
    }

    // Stop typing indicator
    async stopTyping(channel) {
        try {
            await channel.untrack();
            console.log('Stopped typing indicator');
        } catch (error) {
            console.error('Error stopping typing indicator:', error);
        }
    }

    // Get list of users currently typing
    getTypingUsers(channel) {
        const presenceState = channel.presenceState();
        const typingUsers = Object.values(presenceState)
            .flat()
            .filter(user => user.isTyping);
        console.log('Current typing users:', typingUsers);
        return typingUsers;
    }

    // Clean up all subscriptions
    cleanup() {
        console.log('Cleaning up all realtime subscriptions');
        this.channels.forEach((channel, channelId) => {
            this.unsubscribeFromChannel(channelId);
        });
        this.typingChannels.forEach((channel, channelId) => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        });
        this.channels.clear();
        this.typingChannels.clear();
    }
}

const realtimeService = new RealtimeService();
export default realtimeService; 