import { supabase } from '../../config/supabase';
import EventEmitter from '../../utils/EventEmitter';

// Configure EventEmitter for reactions
const reactionEvents = new EventEmitter();

class RealtimeService {
    constructor() {
        this.channels = new Map();
        this.typingChannels = new Map();
        this.channelListChannel = null;
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
                    console.log('New message:', payload);
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
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions'
                },
                (payload) => {
                    console.log('Reaction change:', payload);
                    const messageId = payload.new?.message_id || payload.old?.message_id;
                    onMessage({
                        type: 'reaction_change',
                        messageId,
                        event: payload.eventType
                    });
                    reactionEvents.emit(messageId);
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'file_attachments'
                },
                async (payload) => {
                    console.log('File attachment change:', payload);
                    
                    // Handle deletion
                    if (payload.eventType === 'DELETE') {
                        // Verify this attachment belonged to the current channel
                        const { data: message, error: messageError } = await supabase
                            .from('messages')
                            .select('channel_id, dm_id')
                            .eq('id', payload.old.message_id)
                            .single();

                        if (messageError) {
                            console.error('Error fetching message for deletion:', messageError);
                            return;
                        }

                        if (!message) {
                            console.log('Message not found for file attachment');
                            return;
                        }

                        // For channel messages
                        if (message.channel_id && message.channel_id !== channelId) {
                            console.log('File attachment not for this channel');
                            return;
                        }

                        // For DM messages
                        if (message.dm_id && message.dm_id !== dmId) {
                            console.log('File attachment not for this DM');
                            return;
                        }

                        onMessage({
                            type: 'message_updated',
                            message: {
                                id: payload.old.message_id,
                                file_attachments: []
                            }
                        });
                        return;
                    }

                    // Fetch the complete file attachment data with joins
                    const { data: fileAttachment, error: attachmentError } = await supabase
                        .from('file_attachments')
                        .select(`
                            id,
                            message_id,
                            uploader_id,
                            created_at,
                            files (
                                id,
                                name,
                                type,
                                size,
                                url,
                                created_at,
                                updated_at
                            ),
                            messages (
                                id,
                                channel_id,
                                dm_id
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (attachmentError) {
                        console.error('Error fetching file attachment:', attachmentError);
                        return;
                    }

                    if (!fileAttachment || !fileAttachment.files || !fileAttachment.messages) {
                        console.error('Invalid file attachment data structure');
                        return;
                    }

                    // Get the file and message data directly as objects
                    const file = fileAttachment.files;
                    const message = fileAttachment.messages;

                    // Verify this attachment belongs to the current context (channel or DM)
                    if (channelId && message.channel_id !== channelId) {
                        console.log('File attachment not for this channel');
                        return;
                    }

                    if (dmId && message.dm_id !== dmId) {
                        console.log('File attachment not for this DM');
                        return;
                    }

                    // Transform the file attachment to match the expected structure
                    const transformedAttachment = {
                        id: fileAttachment.id,
                        message_id: fileAttachment.message_id,
                        uploader_id: fileAttachment.uploader_id,
                        created_at: fileAttachment.created_at,
                        file_id: file.id,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        file_url: file.url,
                        file_created_at: file.created_at,
                        file_updated_at: file.updated_at
                    };

                    onMessage({
                        type: 'message_updated',
                        message: {
                            id: fileAttachment.message_id,
                            file_attachments: [transformedAttachment]
                        }
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

    subscribeToDM(dmId, onMessage) {
        console.log('Subscribing to DM:', dmId);
        
        // If already subscribed to this DM, return existing subscription
        if (this.channels.has(`dm:${dmId}`)) {
            console.log('Already subscribed to DM:', dmId);
            return this.channels.get(`dm:${dmId}`);
        }

        // Create a new subscription
        const channel = supabase
            .channel(`dm:${dmId}`)
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `dm_id=eq.${dmId}`
                },
                (payload) => {
                    console.log('New DM message:', payload);
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
                    filter: `dm_id=eq.${dmId}`
                },
                (payload) => {
                    console.log('DM message updated:', payload);
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
                    filter: `dm_id=eq.${dmId}`
                },
                (payload) => {
                    console.log('DM message deleted:', payload);
                    onMessage({
                        type: 'message_deleted',
                        messageId: payload.old.id
                    });
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions'
                },
                (payload) => {
                    console.log('DM reaction change:', payload);
                    const messageId = payload.new?.message_id || payload.old?.message_id;
                    onMessage({
                        type: 'reaction_change',
                        messageId,
                        event: payload.eventType
                    });
                    reactionEvents.emit(messageId);
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'file_attachments'
                },
                async (payload) => {
                    console.log('DM file attachment change:', payload);
                    
                    // Handle deletion
                    if (payload.eventType === 'DELETE') {
                        // Verify this attachment belonged to the current DM
                        const { data: message } = await supabase
                            .from('messages')
                            .select('dm_id')
                            .eq('id', payload.old.message_id)
                            .single();

                        if (!message || message.dm_id !== dmId) {
                            console.log('File attachment not for this DM');
                            return;
                        }

                        onMessage({
                            type: 'message_updated',
                            message: {
                                id: payload.old.message_id,
                                file_attachments: []
                            }
                        });
                        return;
                    }

                    // Fetch the complete file attachment data with joins
                    const { data: fileAttachment, error } = await supabase
                        .from('file_attachments')
                        .select(`
                            id,
                            message_id,
                            uploader_id,
                            created_at,
                            files (
                                id,
                                name,
                                type,
                                size,
                                url,
                                created_at,
                                updated_at
                            ),
                            messages (
                                id,
                                channel_id,
                                dm_id
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (error) {
                        console.error('Error fetching DM file attachment:', error);
                        return;
                    }

                    if (!fileAttachment || !fileAttachment.files || !fileAttachment.messages) {
                        console.error('Invalid file attachment data structure');
                        return;
                    }

                    // Get the file and message data directly as objects
                    const file = fileAttachment.files;
                    const message = fileAttachment.messages;

                    // Verify this attachment belongs to the current DM
                    if (message.dm_id !== dmId) {
                        console.log('File attachment not for this DM');
                        return;
                    }

                    // Transform the file attachment to match the expected structure
                    const transformedAttachment = {
                        id: fileAttachment.id,
                        message_id: fileAttachment.message_id,
                        uploader_id: fileAttachment.uploader_id,
                        created_at: fileAttachment.created_at,
                        file_id: file.id,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        file_url: file.url,
                        file_created_at: file.created_at,
                        file_updated_at: file.updated_at
                    };

                    onMessage({
                        type: 'message_updated',
                        message: {
                            id: fileAttachment.message_id,
                            file_attachments: [transformedAttachment]
                        }
                    });
                }
            );

        // Subscribe and handle status
        channel.subscribe(async (status) => {
            console.log(`Realtime subscription status for DM ${dmId}:`, status);
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to DM:', dmId);
            } else if (status === 'CLOSED') {
                console.log('DM closed:', dmId);
                this.channels.delete(`dm:${dmId}`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error('DM error for:', dmId);
                this.channels.delete(`dm:${dmId}`);
            }
        });

        // Store the subscription
        this.channels.set(`dm:${dmId}`, channel);
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

    unsubscribeFromDM(dmId) {
        console.log('Unsubscribing from DM:', dmId);
        const channel = this.channels.get(`dm:${dmId}`);
        if (channel) {
            channel.unsubscribe();
            supabase.removeChannel(channel);
            this.channels.delete(`dm:${dmId}`);
            console.log('Successfully unsubscribed from DM:', dmId);
        }
    }

    subscribeToTyping(channelId, onTypingUpdate) {
        const channelKey = `typing:${channelId}`;
        console.log('Setting up typing subscription for:', channelKey);
        
        if (this.typingChannels.has(channelKey)) {
            console.log('Already subscribed to typing for:', channelKey);
            return this.typingChannels.get(channelKey);
        }

        const typingUsers = new Set();
        const channel = supabase.channel(channelKey);

        channel.on('presence', { event: 'sync' }, () => {
            console.log('Presence sync for:', channelKey);
            const newState = channel.presenceState();
            typingUsers.clear();
            Object.values(newState).forEach(presences => {
                presences.forEach(presence => {
                    if (presence.isTyping) {
                        typingUsers.add(presence);
                    }
                });
            });
            onTypingUpdate(Array.from(typingUsers));
        });

        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('Presence join:', newPresences);
            newPresences.forEach(presence => {
                if (presence.isTyping) {
                    typingUsers.add(presence);
                }
            });
            onTypingUpdate(Array.from(typingUsers));
        });

        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('Presence leave:', leftPresences);
            leftPresences.forEach(presence => {
                typingUsers.delete(presence);
            });
            onTypingUpdate(Array.from(typingUsers));
        });

        // Subscribe and handle status
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to typing:', channelKey);
                // Track the channel after successful subscription
                this.typingChannels.set(channelKey, channel);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                console.log('Typing channel closed or error:', channelKey);
                this.typingChannels.delete(channelKey);
            }
        });

        return channel;
    }

    startTyping(channel, user) {
        if (!channel) {
            console.error('No channel provided for typing indicator');
            return;
        }
        console.log('Starting typing indicator for user:', user.username);
        channel.track({
            isTyping: true,
            id: user.id,
            username: user.username
        });
    }

    stopTyping(channel) {
        if (!channel) {
            console.error('No channel provided for typing indicator');
            return;
        }
        console.log('Stopping typing indicator');
        channel.untrack();
    }

    subscribeToDMConversations(userId, onUpdate) {
        console.log('Subscribing to DM conversations for user:', userId);
        
        // Create a new subscription
        const channel = supabase
            .channel(`dm-conversations:${userId}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                    or: [
                        `user1_id.eq.${userId}`,
                        `user2_id.eq.${userId}`
                    ]
                },
                (payload) => {
                    console.log('DM conversation change:', payload);
                    onUpdate();
                }
            );

        // Subscribe and handle status
        channel.subscribe(async (status) => {
            console.log(`Realtime subscription status for DM conversations:`, status);
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to DM conversations');
            } else if (status === 'CLOSED') {
                console.log('DM conversations subscription closed');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('DM conversations subscription error');
            }
        });

        return channel;
    }

    unsubscribeFromTyping(channelId) {
        const channelKey = `typing:${channelId}`;
        console.log('Unsubscribing from typing channel:', channelKey);
        const channel = this.typingChannels.get(channelKey);
        if (channel) {
            channel.unsubscribe();
            supabase.removeChannel(channel);
            this.typingChannels.delete(channelKey);
            console.log('Successfully unsubscribed from typing channel:', channelKey);
        }
    }

    subscribeToChannelList(onChannelUpdate) {
        if (this.channelListChannel) {
            return this.channelListChannel;
        }

        this.channelListChannel = supabase
            .channel('channel-list')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'channels'
                },
                (payload) => {
                    console.log('Channel change:', payload);
                    onChannelUpdate(payload);
                }
            )
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'channel_members'
                },
                (payload) => {
                    console.log('Channel member change:', payload);
                    onChannelUpdate(payload);
                }
            )
            .subscribe((status) => {
                console.log('Channel list subscription status:', status);
            });

        return this.channelListChannel;
    }

    unsubscribeFromChannelList() {
        if (this.channelListChannel) {
            this.channelListChannel.unsubscribe();
            supabase.removeChannel(this.channelListChannel);
            this.channelListChannel = null;
        }
    }
}

const realtimeService = new RealtimeService();
export { realtimeService as default, reactionEvents }; 