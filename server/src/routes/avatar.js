import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { generateAvatarResponse } from '../services/avatarService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// POST /api/avatar/message - Generate an avatar response
router.post('/message', authenticateJWT, async (req, res) => {
    try {
        const { message, targetUserId } = req.body;
        
        if (!message || !targetUserId) {
            return res.status(400).json({ 
                message: 'Message and target user ID are required' 
            });
        }

        // Fetch target user information
        const { data: userInfo, error: userError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', targetUserId)
            .single();

        if (userError || !userInfo) {
            return res.status(404).json({ 
                message: 'Target user not found' 
            });
        }

        // Fetch user's message history
        const { data: messageHistory, error: historyError } = await supabase
            .from('messages')
            .select(`
                content,
                created_at,
                sender:sender_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('sender_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (historyError) {
            console.error('Error fetching message history:', historyError);
            return res.status(500).json({ 
                message: 'Error fetching message history' 
            });
        }

        // Generate AI response
        const response = await generateAvatarResponse(
            message,
            messageHistory || [],
            userInfo
        );

        // Format the response as a message
        const avatarMessage = {
            id: Date.now().toString(),
            content: response,
            created_at: new Date().toISOString(),
            sender: {
                ...userInfo,
                isBot: true,
                username: `${userInfo.username} (Avatar)`
            }
        };

        res.json(avatarMessage);

    } catch (error) {
        console.error('Error in avatar message endpoint:', error);
        res.status(500).json({ 
            message: 'Error processing avatar message',
            error: error.message 
        });
    }
});

export default router; 