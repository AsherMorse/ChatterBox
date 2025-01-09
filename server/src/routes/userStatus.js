import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// PATCH /api/user-status/presence
router.patch('/presence', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { presence } = req.body;

    if (!['online', 'offline', 'idle'].includes(presence)) {
      return res.status(400).json({ message: 'Invalid presence value' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ presence })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    console.error('Error updating presence:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/user-status/custom
router.patch('/custom', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { custom_status_text, custom_status_color } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        custom_status_text,
        custom_status_color
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    console.error('Error updating custom status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/user-status/:userId
router.get('/:userId', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, presence, custom_status_text, custom_status_color, username, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching user status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/user-status
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userIds = req.query.userIds?.split(',');

    if (!Array.isArray(userIds) || !userIds.length) {
      return res.status(400).json({ message: 'No userIds provided' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, presence, custom_status_text, custom_status_color, username, avatar_url')
      .in('id', userIds);

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching multiple user statuses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 