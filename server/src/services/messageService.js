import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

class MessageService {
    constructor(io) {
        this.io = io;
        this.setupSocketHandlers = this.setupSocketHandlers.bind(this);
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
                    // Handle message changes
                    if (payload.eventType === 'INSERT') {
                        const message = payload.new;
                        // Broadcast to appropriate channel
                        if (message.channel_id) {
                            this.io.to(`channel:${message.channel_id}`).emit('new_message', message);
                        } else if (message.dm_id) {
                            this.io.to(`dm:${message.dm_id}`).emit('new_message', message);
                        }
                    }
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

    async getChannelMessages(channelId, limit = 50) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }

        return data.reverse();
    }

    setupSocketHandlers(socket) {
        // Join a channel
        socket.on('join_channel', (channelId) => {
            socket.join(`channel:${channelId}`);
            console.log(`${socket.user.username} joined channel ${channelId}`);
        });

        // Leave a channel
        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel:${channelId}`);
            console.log(`${socket.user.username} left channel ${channelId}`);
        });

        // Send a message
        socket.on('send_message', async (message) => {
            try {
                const savedMessage = await this.saveMessage({
                    ...message,
                    sender_id: socket.user.id
                });

                // The message will be broadcasted through Supabase Realtime
                socket.emit('message_sent', savedMessage);
            } catch (error) {
                socket.emit('message_error', {
                    message: 'Error sending message',
                    error: error.message
                });
            }
        });

        // Start typing
        socket.on('typing_start', (channelId) => {
            socket.to(`channel:${channelId}`).emit('user_typing', {
                user: socket.user.username,
                channelId
            });
        });

        // Stop typing
        socket.on('typing_stop', (channelId) => {
            socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
                user: socket.user.username,
                channelId
            });
        });
    }
}

export default MessageService; 