import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-large',
    maxConcurrency: 5
});

// Create a new message
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { content, channel_id, dm_id } = req.body;
        const sender_id = req.user.id;

        // First get the sender information
        const { data: sender, error: senderError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', sender_id)
            .single();

        if (senderError) {
            console.error('Error fetching sender:', senderError);
            return res.status(500).json({ message: 'Error fetching sender information' });
        }

        // Get channel information if it's a channel message
        let channelName = null;
        if (channel_id) {
            const { data: channel } = await supabase
                .from('channels')
                .select('name')
                .eq('id', channel_id)
                .single();
            channelName = channel?.name;
        }

        // Create the message with sender information
        const messageData = {
            content,
            sender_id,
            channel_id,
            dm_id,
            metadata: req.body.metadata // Include metadata if provided
        };

        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert(messageData)
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .single();

        if (messageError) {
            console.error('Error creating message:', messageError);
            return res.status(500).json({ message: 'Error creating message' });
        }

        // Add message to Pinecone
        try {
            const index = pinecone.index(process.env.PINECONE_INDEX);
            const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
                pineconeIndex: index,
                namespace: 'chat-messages'
            });

            // Create document with metadata
            const document = {
                pageContent: content,
                metadata: {
                    messageId: message.id,
                    senderId: sender_id,
                    senderName: sender.username,
                    channelId: channel_id,
                    channelName: channelName,
                    dmId: dm_id,
                    createdAt: message.created_at
                }
            };

            // Add to Pinecone
            await vectorStore.addDocuments([document]);
        } catch (embedError) {
            console.error('Error embedding message:', embedError);
            // Don't fail the request if embedding fails
        }

        res.json(message);
    } catch (error) {
        console.error('Error in message creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get messages for a channel
router.get('/channel/:channelId', authenticateJWT, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { limit = 50 } = req.query;

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar_url),
                file_attachments(
                    id,
                    message_id,
                    uploader_id,
                    file:files!file_attachments_file_id_fkey (
                        id,
                        name,
                        type,
                        size,
                        url
                    )
                )
            `)
            .eq('channel_id', channelId)
            .eq('is_thread_reply', false)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ message: 'Error fetching messages' });
        }

        // Transform file attachments to match expected client structure
        const transformedMessages = messages.map(message => ({
            ...message,
            file_attachments: message.file_attachments.map(attachment => ({
                id: attachment.id,
                message_id: attachment.message_id,
                uploader_id: attachment.uploader_id,
                file_name: attachment.file.name,
                file_type: attachment.file.type,
                file_size: attachment.file.size,
                file_url: attachment.file.url
            }))
        }));

        res.json(transformedMessages);
    } catch (error) {
        console.error('Error in message retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get messages for a DM conversation
router.get('/dm/:dmId', authenticateJWT, async (req, res) => {
    try {
        const { dmId } = req.params;
        const { limit = 50 } = req.query;

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar_url),
                file_attachments(
                    id,
                    message_id,
                    uploader_id,
                    file:files!file_attachments_file_id_fkey (
                        id,
                        name,
                        type,
                        size,
                        url
                    )
                )
            `)
            .eq('dm_id', dmId)
            .eq('is_thread_reply', false)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching DM messages:', error);
            return res.status(500).json({ message: 'Error fetching DM messages' });
        }

        // Transform file attachments to match expected client structure
        const transformedMessages = messages.map(message => ({
            ...message,
            file_attachments: message.file_attachments.map(attachment => ({
                id: attachment.id,
                message_id: attachment.message_id,
                uploader_id: attachment.uploader_id,
                file_name: attachment.file.name,
                file_type: attachment.file.type,
                file_size: attachment.file.size,
                file_url: attachment.file.url
            }))
        }));

        res.json(transformedMessages);
    } catch (error) {
        console.error('Error in DM message retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add a reaction to a message
router.post('/:messageId/reactions', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        // Check if reaction already exists
        const { data: existingReaction } = await supabase
            .from('message_reactions')
            .select()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji)
            .single();

        if (existingReaction) {
            return res.status(400).json({ message: 'Reaction already exists' });
        }

        // Add the reaction
        const { error: insertError } = await supabase
            .from('message_reactions')
            .insert({
                message_id: messageId,
                user_id: userId,
                emoji
            });

        if (insertError) throw insertError;

        // Get updated reactions with user info
        const { data: reactions, error: selectError } = await supabase
            .from('message_reactions')
            .select(`
                emoji,
                users:user_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('message_id', messageId)
            .eq('emoji', emoji);

        if (selectError) throw selectError;

        // Format the response
        const formattedReaction = {
            emoji,
            count: reactions.length,
            users: reactions.map(r => r.users)
        };

        return res.status(201).json(formattedReaction);
    } catch (error) {
        console.error('Reaction error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Remove a reaction from a message
router.delete('/:messageId/reactions', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const { error: deleteError } = await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .eq('emoji', emoji);

        if (deleteError) throw deleteError;

        // Get updated reactions with user info
        const { data: reactions, error: selectError } = await supabase
            .from('message_reactions')
            .select(`
                emoji,
                users:user_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('message_id', messageId)
            .eq('emoji', emoji);

        if (selectError) throw selectError;

        // Format the response
        const formattedReaction = {
            emoji,
            count: reactions.length,
            users: reactions.map(r => r.users)
        };

        return res.status(200).json(formattedReaction);
    } catch (error) {
        console.error('Error removing reaction:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Get reactions for a message
router.get('/:messageId/reactions', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;

        // Get all reactions for the message with user info
        const { data: reactions, error } = await supabase
            .from('message_reactions')
            .select(`
                emoji,
                users:user_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('message_id', messageId);

        if (error) {
            console.error('Error fetching reactions:', error);
            return res.status(500).json({ message: 'Error fetching reactions' });
        }

        // Group reactions by emoji
        const groupedReactions = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: []
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.users);
            return acc;
        }, {});

        return res.json(Object.values(groupedReactions));
    } catch (error) {
        console.error('Error in reaction retrieval:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Add file attachment to a message
router.post('/attachments', authenticateJWT, async (req, res) => {
    try {
        const { messageId, fileName, fileType, fileSize, fileUrl } = req.body;
        const userId = req.user.id;

        // Verify message exists and user has permission
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .select(`
                id,
                sender_id,
                channel_id,
                dm_id,
                channels (
                    id,
                    members:channel_members(user_id)
                ),
                direct_messages:dm_id (
                    id,
                    user1_id,
                    user2_id
                )
            `)
            .eq('id', messageId)
            .single();

        if (messageError) {
            console.error('Error fetching message:', messageError);
            return res.status(500).json({ message: 'Error fetching message details' });
        }

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Verify user has permission to add attachments
        let hasPermission = false;

        if (message.channel_id) {
            // For channel messages, verify user is a member of the channel
            const channelMembers = message.channels?.members || [];
            hasPermission = channelMembers.some(member => member.user_id === userId);
        } else if (message.dm_id) {
            // For DMs, verify user is part of the conversation
            const dm = message.direct_messages;
            hasPermission = dm && (dm.user1_id === userId || dm.user2_id === userId);
        }

        if (!hasPermission) {
            return res.status(403).json({ message: 'You do not have permission to add attachments to this message' });
        }

        // First create the file record
        const { data: file, error: fileError } = await supabase
            .from('files')
            .insert([
                {
                    name: fileName,
                    type: fileType,
                    size: fileSize,
                    url: fileUrl
                }
            ])
            .select('*')
            .single();

        if (fileError) {
            console.error('Error creating file record:', fileError);
            return res.status(500).json({ message: 'Failed to create file record' });
        }

        // Then create the file attachment
        const { data: attachment, error: attachmentError } = await supabase
            .from('file_attachments')
            .insert([
                {
                    file_id: file.id,
                    message_id: messageId,
                    uploader_id: userId
                }
            ])
            .select(`
                id,
                message_id,
                uploader_id,
                file:files!file_attachments_file_id_fkey (
                    id,
                    name,
                    type,
                    size,
                    url
                )
            `)
            .single();

        if (attachmentError) {
            console.error('Error creating file attachment:', attachmentError);
            // Clean up the file record if attachment creation fails
            await supabase.from('files').delete().eq('id', file.id);
            return res.status(500).json({ message: 'Failed to create file attachment' });
        }

        // Transform the response to match the expected format
        const formattedAttachment = {
            id: attachment.id,
            message_id: attachment.message_id,
            uploader_id: attachment.uploader_id,
            file_name: attachment.file.name,
            file_type: attachment.file.type,
            file_size: attachment.file.size,
            file_url: attachment.file.url
        };

        return res.status(201).json(formattedAttachment);
    } catch (err) {
        console.error('Error in /messages/attachments route:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get thread messages for a parent message
router.get('/:messageId/thread', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;

        // First verify the parent message exists
        const { data: parentMessage, error: parentError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (parentError || !parentMessage) {
            console.error('Error fetching parent message:', parentError);
            return res.status(500).json({ message: 'Error fetching parent message' });
        }

        // Get all thread messages
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar_url),
                file_attachments(
                    id,
                    message_id,
                    uploader_id,
                    file:files!file_attachments_file_id_fkey (
                        id,
                        name,
                        type,
                        size,
                        url
                    )
                )
            `)
            .eq('parent_id', messageId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching thread messages:', error);
            return res.status(500).json({ message: 'Error fetching thread messages' });
        }

        // Transform file attachments to match expected client structure
        const transformedMessages = messages.map(message => ({
            ...message,
            file_attachments: message.file_attachments.map(attachment => ({
                id: attachment.id,
                message_id: attachment.message_id,
                uploader_id: attachment.uploader_id,
                file_name: attachment.file.name,
                file_type: attachment.file.type,
                file_size: attachment.file.size,
                file_url: attachment.file.url
            }))
        }));

        res.json(transformedMessages);
    } catch (error) {
        console.error('Error in thread message retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a thread reply
router.post('/:messageId/thread', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const sender_id = req.user.id;

        // First verify the parent message exists
        const { data: parentMessage, error: parentError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (parentError || !parentMessage) {
            console.error('Error fetching parent message:', parentError);
            return res.status(500).json({ message: 'Error fetching parent message' });
        }

        // Get the sender information
        const { data: sender, error: senderError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', sender_id)
            .single();

        if (senderError) {
            console.error('Error fetching sender:', senderError);
            return res.status(500).json({ message: 'Error fetching sender information' });
        }

        // Create the thread reply
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                content,
                sender_id,
                parent_id: messageId,
                channel_id: parentMessage.channel_id,
                dm_id: parentMessage.dm_id,
                is_thread_reply: true
            })
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .single();

        if (messageError) {
            console.error('Error creating thread reply:', messageError);
            return res.status(500).json({ message: 'Error creating thread reply' });
        }

        // Format the response
        const formattedMessage = {
            ...message,
            sender: sender
        };

        res.status(201).json(formattedMessage);
    } catch (error) {
        console.error('Error in thread reply creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all messages for a specific user
router.get('/user/:userId', authenticateJWT, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 100, exclude_system = true, exclude_bots = true } = req.query;

        // Build the query
        let query = supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .eq('sender_id', userId)
            .order('created_at', { ascending: true })
            .limit(limit);

        // Add optional filters
        if (exclude_system === 'true') {
            query = query.eq('is_system_message', false);
        }
        if (exclude_bots === 'true') {
            query = query.eq('is_bot', false);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Error fetching user messages:', error);
            return res.status(500).json({ message: 'Error fetching messages' });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error in user message retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;