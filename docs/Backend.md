# ChatterBox Backend

A comprehensive guide to the backend architecture, API design, and server implementation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Design](#api-design)
- [Database](#database)
- [Authentication](#authentication)
- [Real-time Features](#real-time-features)
- [Deployment](#deployment)
- [Best Practices](#best-practices)

## Overview

The ChatterBox backend is built with:
- Node.js and Express for the API server
- Supabase for database and authentication
- RESTful API design principles
- Real-time data synchronization
- Secure authentication flow

## Architecture

### Directory Structure
```plaintext
server/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── index.js        # Entry point
├── db/                 # Database migrations
├── .env               # Environment variables
├── package.json       # Dependencies
└── vercel.json        # Deployment config
```

### Core Components

#### Entry Point
`src/index.js` - Server initialization and middleware setup

```javascript
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import routes from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);
```

#### Middleware Pipeline
```javascript
app.use(cors())
   .use(express.json())
   .use(requestLogger)
   .use('/api', routes)
   .use(errorHandler);
```

## API Design

### RESTful Endpoints

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
```

#### Messages
```http
GET    /api/messages/channel/:channelId
POST   /api/messages
PUT    /api/messages/:messageId
DELETE /api/messages/:messageId
```

#### Channels
```http
GET    /api/channels
POST   /api/channels
PUT    /api/channels/:channelId
DELETE /api/channels/:channelId
```

### Request/Response Format

#### Success Response
```json
{
    "data": {
        "id": "123",
        "content": "Message content"
    },
    "meta": {
        "timestamp": "2024-01-12T04:19:00Z"
    }
}
```

#### Error Response
```json
{
    "error": {
        "code": "INVALID_REQUEST",
        "message": "Invalid message format"
    }
}
```

## Database

### Supabase Integration

#### Configuration
```javascript
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
```

### Schema Design

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    status TEXT,
    last_seen TIMESTAMP
);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    content TEXT,
    sender_id UUID REFERENCES users(id),
    channel_id UUID REFERENCES channels(id),
    parent_id UUID REFERENCES messages(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Authentication

### Flow
1. User registration/login
2. Supabase authentication
3. JWT token generation
4. Token validation
5. Protected route access

### Implementation
```javascript
// Protect routes with authentication
const authenticateUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }
    // Validate with Supabase
    next();
};
```

## Real-time Features

### Supabase Real-time

#### Channel Subscription
```javascript
const channel = supabase
    .channel('messages')
    .on('postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'messages'
        },
        (payload) => {
            // Handle real-time updates
        }
    )
    .subscribe();
```

#### Event Types
| Event | Description |
|-------|-------------|
| INSERT | New record created |
| UPDATE | Record updated |
| DELETE | Record deleted |

## Deployment

### Vercel Configuration
`vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### Environment Variables
Required environment variables:
```plaintext
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
PORT=3000
NODE_ENV=production
```

## Best Practices

### Security
- Use environment variables for secrets
- Implement rate limiting
- Validate all inputs
- Use proper CORS settings
- Implement request sanitization

### Error Handling
```javascript
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : err.message
        }
    });
});
```

### Performance
- Use connection pooling
- Implement caching
- Optimize database queries
- Use proper indexes
- Monitor performance metrics

### Code Organization
- Follow single responsibility principle
- Use service layer for business logic
- Implement proper error handling
- Document API endpoints
- Use TypeScript for type safety

### Logging
```javascript
// Request logger middleware
const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
};
```

### Testing
- Write unit tests for services
- Test API endpoints
- Implement integration tests
- Use proper test environment
- Mock external services 