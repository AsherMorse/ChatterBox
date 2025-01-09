import { supabase } from '../../config/supabase';
import EventEmitter from '../../utils/EventEmitter';
import { getToken } from '../api/auth';
import api from '../api/api';

// Configure EventEmitter for reactions
const reactionEvents = new EventEmitter();

class RealtimeService {
    constructor() {
        this.channels = new Map();
        this.typingChannels = new Map();
        this.channelListChannel = null;
        this.idleTimeout = null;
        this.idleTime = 10000; // 10 seconds
        this.userPresenceChannel = null;
        this.presenceSubscribers = new Map(); // Track presence update subscribers
        this.activityListenersInitialized = false;
        this.isAuthenticated = false;
        this.pendingPresenceUpdate = null;
        this.presenceRetryTimeout = null;
        this.maxRetries = 3;
        this.retryCount = 0;
        this.retryDelay = 1000; // Start with 1 second delay
    }

    setAuthenticated(status) {
        const previousStatus = this.isAuthenticated;
        this.isAuthenticated = status;
        
        if (status) {
            // Clear any existing retry timeout
            if (this.presenceRetryTimeout) {
                clearTimeout(this.presenceRetryTimeout);
                this.presenceRetryTimeout = null;
            }
            
            // Reset retry counters
            this.retryCount = 0;
            this.retryDelay = 1000;

            // Handle pending presence update if exists
            if (this.pendingPresenceUpdate) {
                this.setPresence(this.pendingPresenceUpdate);
                this.pendingPresenceUpdate = null;
            } else if (!previousStatus) {
                // If newly authenticated and no pending update, set as online
                this.setPresence('online');
            }

            // Start presence monitoring
            this.startPresenceMonitoring();
        } else {
            // Clean up when becoming unauthenticated
            this.stopPresenceMonitoring();
            this.pendingPresenceUpdate = null;
            if (this.presenceRetryTimeout) {
                clearTimeout(this.presenceRetryTimeout);
                this.presenceRetryTimeout = null;
            }
        }
    }

    validateToken() {
        const token = getToken();
        return token && typeof token === 'string' && token.trim() !== '';
    }

    async setPresence(presence) {
        // Validate presence value
        const validPresenceStates = ['online', 'idle', 'offline'];
        if (!validPresenceStates.includes(presence)) {
            console.error(`Invalid presence state: ${presence}. Must be one of: ${validPresenceStates.join(', ')}`);
            return;
        }

        // If not authenticated, queue the presence update
        if (!this.isAuthenticated) {
            console.log('Queueing presence update for after authentication:', presence);
            this.pendingPresenceUpdate = presence;
            return;
        }

        // Validate token
        if (!this.validateToken()) {
            console.warn('Cannot update presence: Invalid or missing authentication token');
            this.pendingPresenceUpdate = presence;
            return;
        }

        try {
            const response = await api.patch('/user-status/presence', { presence });
            
            // Reset retry counters on success
            this.retryCount = 0;
            this.retryDelay = 1000;
            this.pendingPresenceUpdate = null;

            return true;
        } catch (error) {
            console.error('Error updating presence:', {
                message: error.message,
                presence,
                timestamp: new Date().toISOString()
            });

            // Implement exponential backoff retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                this.retryDelay *= 2; // Exponential backoff
                
                console.log(`Retrying presence update in ${this.retryDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
                
                // Clear any existing retry timeout
                if (this.presenceRetryTimeout) {
                    clearTimeout(this.presenceRetryTimeout);
                }
                
                // Set up retry
                this.pendingPresenceUpdate = presence;
                this.presenceRetryTimeout = setTimeout(() => {
                    if (this.isAuthenticated && this.pendingPresenceUpdate) {
                        this.setPresence(this.pendingPresenceUpdate);
                    }
                }, this.retryDelay);
            } else {
                console.error('Max retry attempts reached for presence update');
                this.pendingPresenceUpdate = presence; // Keep the last attempted presence state
            }

            throw error;
        }
    }

    startPresenceMonitoring() {
        // Only start if authenticated and has valid token
        if (!this.isAuthenticated || !this.validateToken()) {
            console.warn('Deferring presence monitoring until authentication is complete');
            this.pendingPresenceUpdate = 'online';
            return;
        }

        this.initActivityListeners();
        this.setPresence('online').catch(error => {
            console.error('Failed to set initial presence:', error);
        });
    }

    initActivityListeners() {
        if (this.activityListenersInitialized) {
            return;
        }

        const resetIdleTimer = () => {
            clearTimeout(this.idleTimeout);
            // Only update presence if authenticated
            if (this.isAuthenticated) {
                this.setPresence('online');
                this.idleTimeout = setTimeout(() => this.setPresence('idle'), this.idleTime);
            } else {
                // Queue the presence update for after authentication
                this.pendingPresenceUpdate = 'online';
                this.idleTimeout = setTimeout(() => {
                    this.pendingPresenceUpdate = 'idle';
                }, this.idleTime);
            }
        };

        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('click', resetIdleTimer);
        window.addEventListener('keypress', resetIdleTimer);

        this.activityListenersInitialized = true;
        resetIdleTimer(); // Initialize the timer
    }

    stopPresenceMonitoring() {
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }

        // Only attempt to set offline if authenticated
        if (this.isAuthenticated) {
            this.setPresence('offline');
        }
        
        this.pendingPresenceUpdate = null;
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
                                dm_id,
                                sender_id,
                                sender:users!messages_sender_id_fkey (
                                    id,
                                    username,
                                    avatar_url
                                )
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
                            sender_id: message.sender_id,
                            sender: message.sender,
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
                                dm_id,
                                sender_id,
                                sender:users!messages_sender_id_fkey (
                                    id,
                                    username,
                                    avatar_url
                                )
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
                            sender_id: message.sender_id,
                            sender: message.sender,
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
                    console.log('DM conversation change detected:', payload);
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

    subscribeToUserPresence(onPresenceUpdate) {
        // Generate a unique subscriber ID
        const subscriberId = Math.random().toString(36).substring(2);
        
        // Store the callback with its ID
        this.presenceSubscribers.set(subscriberId, onPresenceUpdate);

        // Create the channel if it doesn't exist
        if (!this.userPresenceChannel) {
            this.userPresenceChannel = supabase
                .channel('users-presence')
                .on('postgres_changes', {
                    event: '*', // Listen for all events
                    schema: 'public',
                    table: 'users'
                }, async (payload) => {
                    // For DELETE events, mark user as offline
                    if (payload.eventType === 'DELETE') {
                        const userData = { 
                            ...payload.old, 
                            presence: 'offline',
                            custom_status_text: null,
                            custom_status_color: null
                        };
                        this.presenceSubscribers.forEach(callback => {
                            callback(userData);
                        });
                        return;
                    }

                    // For INSERT events, fetch the complete user data
                    if (payload.eventType === 'INSERT') {
                        const { data: user, error } = await supabase
                            .from('users')
                            .select('id, username, avatar_url, presence, last_seen, custom_status_text, custom_status_color')
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && user) {
                            this.presenceSubscribers.forEach(callback => {
                                callback(user);
                            });
                        }
                        return;
                    }

                    // For UPDATE events, handle presence changes carefully
                    if (payload.eventType === 'UPDATE') {
                        // If presence or status was explicitly changed in this update
                        if (payload.new.presence !== payload.old.presence ||
                            payload.new.custom_status_text !== payload.old.custom_status_text ||
                            payload.new.custom_status_color !== payload.old.custom_status_color) {
                            const updatedUser = {
                                ...payload.new,
                                presence: payload.new.presence || payload.old.presence,
                                custom_status_text: payload.new.custom_status_text,
                                custom_status_color: payload.new.custom_status_color
                            };
                            this.presenceSubscribers.forEach(callback => {
                                callback(updatedUser);
                            });
                            return;
                        }

                        // If other fields were updated, fetch complete user data
                        const { data: user, error } = await supabase
                            .from('users')
                            .select('id, username, avatar_url, presence, last_seen, custom_status_text, custom_status_color')
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && user) {
                            this.presenceSubscribers.forEach(callback => {
                                callback(user);
                            });
                        }
                    }
                })
                .subscribe((status) => {
                    console.log('Presence subscription status:', status);
                    
                    // If subscription is successful, fetch current presence status for all users
                    if (status === 'SUBSCRIBED') {
                        this.fetchInitialPresenceStatus();
                    }
                });
        } else {
            // If channel exists, immediately fetch current status for the new subscriber
            this.fetchInitialPresenceStatus();
        }

        // Return an unsubscribe function
        return {
            unsubscribe: () => {
                // Remove this subscriber's callback
                this.presenceSubscribers.delete(subscriberId);

                // If no more subscribers, clean up the channel
                if (this.presenceSubscribers.size === 0 && this.userPresenceChannel) {
                    this.userPresenceChannel.unsubscribe();
                    supabase.removeChannel(this.userPresenceChannel);
                    this.userPresenceChannel = null;
                }
            }
        };
    }

    async fetchInitialPresenceStatus() {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, username, avatar_url, presence, last_seen, custom_status_text, custom_status_color')
                .not('presence', 'eq', null);

            if (error) {
                console.error('Error fetching initial presence status:', error);
                return;
            }

            // Notify subscribers about each user's current presence
            users.forEach(user => {
                this.presenceSubscribers.forEach(callback => {
                    callback(user);
                });
            });
        } catch (error) {
            console.error('Error in fetchInitialPresenceStatus:', error);
        }
    }
}

const realtimeService = new RealtimeService();
export { realtimeService as default, reactionEvents }; 