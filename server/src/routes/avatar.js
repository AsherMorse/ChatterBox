import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { generateAvatarResponse, getResponseStats, AvatarServiceError, ErrorTypes } from '../services/avatarService.js';
import { storeAvatarResponse, storeAvatarError, getAvatarHistory, getAvatarStats } from '../services/avatarStorageService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// GET /api/avatar/stats - Get avatar service statistics
router.get('/stats', authenticateJWT, async (req, res) => {
    try {
        const runtimeStats = getResponseStats();
        const userId = req.query.userId;
        
        if (userId) {
            // Get persistent stats for specific user
            const persistentStats = await getAvatarStats(userId);
            res.json({
                runtime: runtimeStats,
                persistent: persistentStats
            });
        } else {
            // Return only runtime stats if no user specified
            res.json({ runtime: runtimeStats });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching avatar stats',
            error: error.message
        });
    }
});

// GET /api/avatar/history - Get avatar response history
router.get('/history', authenticateJWT, async (req, res) => {
    try {
        const { userId, limit, offset } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const history = await getAvatarHistory(userId, {
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching avatar history',
            error: error.message
        });
    }
});

// POST /api/avatar/message - Generate an avatar response
router.post('/message', authenticateJWT, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, targetUserId } = req.body;
        
        if (!message || !targetUserId) {
            return res.status(400).json({ 
                status: 'error',
                type: ErrorTypes.VALIDATION_ERROR,
                message: 'Message and target user ID are required',
                timestamp: new Date().toISOString()
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
                status: 'error',
                type: ErrorTypes.VALIDATION_ERROR,
                message: 'Target user not found',
                timestamp: new Date().toISOString()
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
                status: 'error',
                type: ErrorTypes.AI_ERROR,
                message: 'Error fetching message history',
                timestamp: new Date().toISOString()
            });
        }

        // Generate AI response
        const response = await generateAvatarResponse(
            message,
            messageHistory || [],
            userInfo
        );

        // Create a new message for the response
        const { data: newMessage, error: messageError } = await supabase
            .from('messages')
            .insert({
                content: response.content,
                sender_id: targetUserId,
                dm_id: req.body.dmId,
                channel_id: req.body.channelId
            })
            .select()
            .single();

        if (messageError) {
            throw new Error('Failed to create message record');
        }

        // Store the avatar response
        await storeAvatarResponse({
            messageId: newMessage.id,
            targetUserId: targetUserId,
            originalMessage: message,
            generatedResponse: response.content,
            metadata: {
                ...response.metadata,
                routeProcessingTime: Date.now() - startTime
            }
        });

        // Format the response as a message
        const avatarMessage = {
            ...newMessage,
            sender: {
                ...userInfo,
                isBot: true,
                username: `${userInfo.username} (Avatar)`
            },
            metadata: {
                ...response.metadata,
                routeProcessingTime: Date.now() - startTime
            }
        };

        res.json(avatarMessage);

    } catch (error) {
        console.error('Error in avatar message endpoint:', error);
        
        // Store the error
        if (req.body.targetUserId) {
            await storeAvatarError({
                messageId: null,
                targetUserId: req.body.targetUserId,
                originalMessage: req.body.message || '',
                errorType: error instanceof AvatarServiceError ? error.type : ErrorTypes.AI_ERROR,
                errorDetails: error instanceof AvatarServiceError ? error.details : { message: error.message },
                processingTime: Date.now() - startTime
            }).catch(console.error); // Don't let error storage failure affect response
        }
        
        // Handle different error types
        if (error instanceof AvatarServiceError) {
            const statusCode = error.type === ErrorTypes.VALIDATION_ERROR ? 400 : 500;
            return res.status(statusCode).json({
                status: 'error',
                type: error.type,
                message: error.message,
                details: error.details,
                timestamp: error.timestamp
            });
        }

        // Handle unexpected errors
        res.status(500).json({ 
            status: 'error',
            type: ErrorTypes.AI_ERROR,
            message: 'Error processing avatar message',
            timestamp: new Date().toISOString(),
            details: {
                error: error.message,
                processingTime: Date.now() - startTime
            }
        });
    }
});

export default router; 