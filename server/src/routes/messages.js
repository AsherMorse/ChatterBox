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
        const { content, channel_id } = req.body;
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
            sender: sender // Include sender info directly
        };

        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                content,
                sender_id,
                channel_id
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
                sender:sender_id(id, username, avatar_url)
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ message: 'Error fetching messages' });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error in message retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;