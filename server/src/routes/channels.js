import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Get all public channels
router.get('/public', authenticateJWT, async (req, res) => {
    try {
        const { data: channels, error } = await supabase
            .from('channels')
            .select(`
                *,
                creator:created_by(id, username),
                members_count:channel_members(count)
            `)
            .eq('is_private', false)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching public channels:', error);
            return res.status(500).json({ message: 'Error fetching channels' });
        }

        // Format the response to include the count
        const formattedChannels = channels.map(channel => ({
            ...channel,
            members_count: channel.members_count[0].count
        }));

        res.json(formattedChannels);
    } catch (error) {
        console.error('Error in public channel retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new channel
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { name, description, is_private = false } = req.body;
        const created_by = req.user.id;

        // First create the channel
        const { data: channel, error: channelError } = await supabase
            .from('channels')
            .insert({
                name,
                description,
                is_private,
                created_by
            })
            .select()
            .single();

        if (channelError) {
            console.error('Error creating channel:', channelError);
            return res.status(500).json({ message: 'Error creating channel' });
        }

        // Add the creator as a member with 'owner' role
        const { error: memberError } = await supabase
            .from('channel_members')
            .insert({
                channel_id: channel.id,
                user_id: created_by,
                role: 'owner'
            });

        if (memberError) {
            console.error('Error adding channel member:', memberError);
            return res.status(500).json({ message: 'Error adding channel member' });
        }

        res.status(201).json(channel);
    } catch (error) {
        console.error('Error in channel creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all channels for the current user
router.get('/', authenticateJWT, async (req, res) => {
    try {
        // Get channels where user is a member
        const { data: channels, error } = await supabase
            .from('channels')
            .select(`
                *,
                channel_members!inner(user_id),
                creator:created_by(id, username)
            `)
            .eq('channel_members.user_id', req.user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching channels:', error);
            return res.status(500).json({ message: 'Error fetching channels' });
        }

        res.json(channels);
    } catch (error) {
        console.error('Error in channel retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Join a channel
router.post('/:channelId/join', authenticateJWT, async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.user.id;

        // Check if channel exists and is public
        const { data: channel, error: channelError } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .single();

        if (channelError || !channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        if (channel.is_private) {
            return res.status(403).json({ message: 'Cannot join private channel' });
        }

        // Check if already a member
        const { data: existingMember, error: memberError } = await supabase
            .from('channel_members')
            .select('*')
            .eq('channel_id', channelId)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.status(400).json({ message: 'Already a member of this channel' });
        }

        // Add user as member
        const { error: joinError } = await supabase
            .from('channel_members')
            .insert({
                channel_id: channelId,
                user_id: userId,
                role: 'member'
            });

        if (joinError) {
            console.error('Error joining channel:', joinError);
            return res.status(500).json({ message: 'Error joining channel' });
        }

        res.status(200).json({ message: 'Successfully joined channel' });
    } catch (error) {
        console.error('Error in channel join:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get a specific channel
router.get('/:channelId', authenticateJWT, async (req, res) => {
    try {
        const { channelId } = req.params;

        // Get channel details with members
        const { data: channel, error } = await supabase
            .from('channels')
            .select(`
                *,
                members:channel_members(
                    user:user_id(id, username, avatar_url),
                    role
                ),
                creator:created_by(id, username)
            `)
            .eq('id', channelId)
            .single();

        if (error) {
            console.error('Error fetching channel:', error);
            return res.status(500).json({ message: 'Error fetching channel' });
        }

        // Check if user is a member
        const isMember = channel.members.some(member => member.user.id === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this channel' });
        }

        res.json(channel);
    } catch (error) {
        console.error('Error in channel retrieval:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update a channel
router.put('/:channelId', authenticateJWT, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { name, description, is_private } = req.body;

        // Check if user is channel owner
        const { data: membership, error: membershipError } = await supabase
            .from('channel_members')
            .select('role')
            .eq('channel_id', channelId)
            .eq('user_id', req.user.id)
            .single();

        if (membershipError || membership.role !== 'owner') {
            return res.status(403).json({ message: 'Only channel owner can update channel' });
        }

        // Update channel
        const { data: channel, error } = await supabase
            .from('channels')
            .update({ name, description, is_private })
            .eq('id', channelId)
            .select()
            .single();

        if (error) {
            console.error('Error updating channel:', error);
            return res.status(500).json({ message: 'Error updating channel' });
        }

        res.json(channel);
    } catch (error) {
        console.error('Error in channel update:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete a channel
router.delete('/:channelId', authenticateJWT, async (req, res) => {
    try {
        const { channelId } = req.params;

        // Check if user is channel owner
        const { data: membership, error: membershipError } = await supabase
            .from('channel_members')
            .select('role')
            .eq('channel_id', channelId)
            .eq('user_id', req.user.id)
            .single();

        if (membershipError || membership.role !== 'owner') {
            return res.status(403).json({ message: 'Only channel owner can delete channel' });
        }

        // Delete channel (this will cascade to channel_members and messages)
        const { error } = await supabase
            .from('channels')
            .delete()
            .eq('id', channelId);

        if (error) {
            console.error('Error deleting channel:', error);
            return res.status(500).json({ message: 'Error deleting channel' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error in channel deletion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
