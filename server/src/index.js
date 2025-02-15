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
import askRoutes from './routes/ask.js';
import chatterbotRoutes from './routes/chatterbot.js';
import avatarRoutes from './routes/avatar.js';
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
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'https://chatter-box-client-five.vercel.app',
            'https://chatter-box-client-five.vercel.app/'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        
        return callback(null, origin);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(passport.initialize());

// Add root route handler
app.get('/', (req, res) => {
    res.json({ message: 'ChatterBox API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/user-status', userStatusRouter);
app.use('/api/ask', askRoutes);
app.use('/api/chatterbot', chatterbotRoutes);
app.use('/api/avatar', avatarRoutes);

// Protected route example
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 