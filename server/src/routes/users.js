import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Search users
router.get('/search', authenticateJWT, async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user.id;

        if (!query) {
            return res.json([]);
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .or(`username.ilike.%${query}%`)
            .neq('id', currentUserId)
            .limit(10);

        if (error) {
            console.error('Error searching users:', error);
            return res.status(500).json({ message: 'Error searching users' });
        }

        res.json(users);
    } catch (error) {
        console.error('Error in user search:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user by ID
router.get('/:userId', authenticateJWT, async (req, res) => {
    try {
        const { userId } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ message: 'Error fetching user' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error in user retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user by username
router.get('/by-username/:username', authenticateJWT, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Case-insensitive username lookup
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .ilike('username', username)
            .limit(1);

        if (error || !users || users.length === 0) {
            console.error('Error fetching user:', error);
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error in user lookup:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;