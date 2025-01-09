import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

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

        // Create the message with sender information
        const messageData = {
            content,
            sender_id,
            channel_id,
            dm_id,
            sender: sender // Include sender info directly
        };

        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                content,
                sender_id,
                channel_id,
                dm_id
            })
            .select(`
                *,
                sender:sender_id(id, username, avatar_url)
            `)
            .single();

        if (messageError) {
            console.error('Error saving message:', messageError);
            return res.status(500).json({ message: 'Error saving message' });
        }

        // Format the response to match the expected structure
        const formattedMessage = {
            ...message,
            sender: sender
        };

        res.status(201).json(formattedMessage);
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

        const { error: insertError } = await supabase
            .from('message_reactions')
            .insert({
                message_id: messageId,
                user_id: userId,
                emoji
            });

        if (insertError) {
            console.error('Error inserting reaction:', insertError);
            return res.status(500).json({ message: 'Error inserting reaction' });
        }

        // Get updated reaction count for this emoji
        const { data: reactions, error: countError } = await supabase
            .from('message_reactions')
            .select('emoji, user_id')
            .eq('message_id', messageId)
            .eq('emoji', emoji);

        if (countError) {
            console.error('Error getting reaction count:', countError);
            return res.status(500).json({ message: 'Error getting reaction count' });
        }

        return res.status(201).json({ 
            message: 'Reaction added successfully',
            count: reactions.length,
            users: reactions.map(r => r.user_id)
        });
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

        if (deleteError) {
            console.error('Error removing reaction:', deleteError);
            return res.status(500).json({ message: 'Error removing reaction' });
        }

        // Get updated reaction count for this emoji
        const { data: reactions, error: countError } = await supabase
            .from('message_reactions')
            .select('emoji, user_id')
            .eq('message_id', messageId)
            .eq('emoji', emoji);

        if (countError) {
            console.error('Error getting reaction count:', countError);
            return res.status(500).json({ message: 'Error getting reaction count' });
        }

        return res.status(200).json({ 
            message: 'Reaction removed successfully',
            count: reactions.length,
            users: reactions.map(r => r.user_id)
        });
    } catch (error) {
        console.error('Reaction removal error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Get reactions for a message
router.get('/:messageId/reactions', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;

        const { data: reactions, error } = await supabase
            .from('message_reactions')
            .select(`
                emoji,
                user_id,
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

        res.json(Object.values(groupedReactions));
    } catch (error) {
        console.error('Error in reactions retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
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

export default router;