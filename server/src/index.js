import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import channelRoutes from './routes/channels.js';
import userRoutes from './routes/users.js';
import directMessageRoutes from './routes/direct-messages.js';
import { authenticateJWT } from './middleware/auth.js';
import userStatusRouter from './routes/userStatus.js';

// Load environment variables from the root server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/user-status', userStatusRouter);

// Protected route example
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 