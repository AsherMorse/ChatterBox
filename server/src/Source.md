# ChatterBox Server Source

A comprehensive guide to the server-side source code organization, architecture, and API endpoints.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Routes](#routes)
- [Services](#services)
- [Middleware](#middleware)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Overview

The ChatterBox server is built with:
- Node.js and Express for the API server
- Passport.js for authentication
- PostgreSQL for data storage
- JWT for session management
- CORS for security

## Directory Structure

```plaintext
src/
├── config/        # Configuration files
├── middleware/    # Express middleware
├── routes/        # API route handlers
│   ├── auth.js           # Authentication routes
│   ├── messages.js       # Message operations
│   ├── channels.js       # Channel management
│   ├── users.js          # User operations
│   ├── userStatus.js     # User presence
│   └── direct-messages.js # DM functionality
├── services/      # Business logic
│   ├── messageService.js # Message handling
│   └── userService.js    # User management
└── index.js       # Application entry point
```

## Core Components

### Application Entry
`index.js` - Server bootstrap and configuration

```javascript
import express from 'express';
import cors from 'cors';
import passport from './config/passport.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://chatter-box-client-five.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(passport.initialize());
```

## Routes

| Route | Purpose | File |
|-------|---------|------|
| `/api/auth` | Authentication endpoints | `routes/auth.js` |
| `/api/messages` | Message operations | `routes/messages.js` |
| `/api/channels` | Channel management | `routes/channels.js` |
| `/api/users` | User operations | `routes/users.js` |
| `/api/user-status` | Presence management | `routes/userStatus.js` |
| `/api/direct-messages` | Direct messaging | `routes/direct-messages.js` |

### Authentication Routes
`routes/auth.js` - User authentication
- Login
- Registration
- Token refresh
- Password reset

### Message Routes
`routes/messages.js` - Message handling
- Send messages
- Edit messages
- Delete messages
- Thread replies
- Reactions

### Channel Routes
`routes/channels.js` - Channel operations
- Create channels
- Join/leave channels
- Channel settings
- Member management

## Services

### Message Service
`services/messageService.js` - Message business logic
- Message validation
- Content processing
- Notification handling
- Thread management

### User Service
`services/userService.js` - User management
- Profile management
- Status updates
- Settings management
- Presence tracking

## Middleware

### Authentication Middleware
`middleware/auth.js` - JWT authentication

```javascript
export const authenticateJWT = (req, res, next) => {
    // JWT validation and user authentication
    next();
};
```

## Configuration

### Environment Variables
Required server configuration:

```plaintext
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

### Passport Configuration
`config/passport.js` - Authentication strategies

## Best Practices

### API Design
- Use RESTful conventions
- Implement proper error handling
- Validate all inputs
- Document all endpoints

### Security
- Implement rate limiting
- Use secure headers
- Validate JWT tokens
- Sanitize user input

### Performance
- Implement caching
- Optimize database queries
- Use connection pooling
- Monitor response times

### Error Handling
- Use consistent error formats
- Implement proper logging
- Handle edge cases
- Provide meaningful messages

### Development Workflow
- Follow API versioning
- Document API changes
- Use proper status codes
- Keep dependencies updated 