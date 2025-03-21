import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Check if user exists
        const { data: existingUsers } = await supabase
            .from('users')
            .select('email, username')
            .or(`email.eq.${email},username.eq.${username}`);

        if (existingUsers && existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            return res.status(400).json({
                message: existingUser.email === email
                    ? 'Email already exists'
                    : 'Username already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash,
                username,
                presence: 'offline'
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Generate JWT
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login route
router.post('/login', (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        console.error('Missing credentials:', { 
            hasEmail: !!req.body.email, 
            hasPassword: !!req.body.password 
        });
        return res.status(400).json({ message: 'Email and password are required' });
    }

    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return res.status(500).json({ message: 'Internal server error during authentication' });
        }
        if (!user) {
            return res.status(401).json({ message: info.message });
        }

        try {
            // Generate JWT
            const token = generateToken(user);

            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                }
            });
        } catch (error) {
            console.error('Token generation error:', error);
            return res.status(500).json({ message: 'Error generating authentication token' });
        }
    })(req, res, next);
});

export default router; 