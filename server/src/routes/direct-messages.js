import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get all DM conversations for the current user
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all DM conversations where the current user is a participant
        const { data: conversations, error } = await supabase
            .from('direct_messages')
            .select(`
                dm_id,
                user1:user1_id(
                    id,
                    username,
                    avatar_url,
                    presence
                ),
                user2:user2_id(
                    id,
                    username,
                    avatar_url,
                    presence
                )
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching DM conversations:', error);
            return res.status(500).json({ message: 'Error fetching conversations' });
        }

        // Transform the data to match the expected format
        const transformedConversations = conversations.map(conv => ({
            dm_id: conv.dm_id,
            users: [conv.user1, conv.user2]
        }));

        res.json(transformedConversations);
    } catch (error) {
        console.error('Error in DM conversations retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new DM conversation
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { userId: otherUserId } = req.body;
        const currentUserId = req.user.id;

        // Check if a DM already exists between these users
        const { data: existingDM, error: checkError } = await supabase
            .from('direct_messages')
            .select('dm_id')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
            console.error('Error checking existing DM:', checkError);
            return res.status(500).json({ message: 'Error checking existing conversation' });
        }

        if (existingDM) {
            return res.json({ dm_id: existingDM.dm_id });
        }

        // Create new DM conversation
        const { data: newDM, error: createError } = await supabase
            .from('direct_messages')
            .insert({
                user1_id: currentUserId,
                user2_id: otherUserId
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating DM:', createError);
            return res.status(500).json({ message: 'Error creating conversation' });
        }

        // Add both users as participants
        const { error: participantsError } = await supabase
            .from('direct_message_participants')
            .insert([
                { dm_id: newDM.dm_id, user_id: currentUserId },
                { dm_id: newDM.dm_id, user_id: otherUserId }
            ]);

        if (participantsError) {
            console.error('Error adding DM participants:', participantsError);
            return res.status(500).json({ message: 'Error adding participants' });
        }

        res.status(201).json({ dm_id: newDM.dm_id });
    } catch (error) {
        console.error('Error in DM creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get messages for a specific DM conversation
router.get('/:dmId/messages', authenticateJWT, async (req, res) => {
    try {
        const { dmId } = req.params;
        const userId = req.user.id;
        const { limit = 50 } = req.query;

        // First verify the user is a participant in this DM
        const { data: participant, error: participantError } = await supabase
            .from('direct_message_participants')
            .select('dm_id')
            .eq('dm_id', dmId)
            .eq('user_id', userId)
            .single();

        if (participantError || !participant) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        // Get messages with sender information
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('dm_id', dmId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (messagesError) {
            console.error('Error fetching DM messages:', messagesError);
            return res.status(500).json({ message: 'Error fetching messages' });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error in DM messages retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get a single DM conversation by ID
router.get('/:dmId', authenticateJWT, async (req, res) => {
    try {
        const { dmId } = req.params;
        const userId = req.user.id;

        // Get the DM conversation with user details
        const { data: conversation, error } = await supabase
            .from('direct_messages')
            .select(`
                dm_id,
                user1:user1_id(
                    id,
                    username,
                    avatar_url,
                    presence
                ),
                user2:user2_id(
                    id,
                    username,
                    avatar_url,
                    presence
                )
            `)
            .eq('dm_id', dmId)
            .single();

        if (error) {
            console.error('Error fetching DM conversation:', error);
            return res.status(500).json({ message: 'Error fetching conversation' });
        }

        // Verify the user is a participant
        if (conversation.user1.id !== userId && conversation.user2.id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        // Transform the data to match the expected format
        const transformedConversation = {
            dm_id: conversation.dm_id,
            users: [conversation.user1, conversation.user2]
        };

        res.json(transformedConversation);
    } catch (error) {
        console.error('Error in DM conversation retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router; 