# ChatterBox Architecture

A comprehensive guide to the system architecture, design patterns, and technical decisions in ChatterBox.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
  - [Client Architecture](#client-architecture)
  - [Server Architecture](#server-architecture)
  - [Database Architecture](#database-architecture)
- [Technical Stack](#technical-stack)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability](#scalability)

## Overview

ChatterBox is built as a modern real-time chat application with:
- Microservices-based architecture
- Event-driven communication
- Real-time data synchronization
- Scalable database design
- Secure authentication system

## System Architecture

```plaintext
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Client   │◄────►    Node.js     │◄────►    Supabase    │
│     (Vite)     │     │    Express      │     │   (Postgres)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                              ▲
        │                                              │
        │                  Real-time                   │
        └──────────────────Events────────────────────►─┘
```

### Client Architecture

#### Component Structure
```plaintext
src/
├── components/
│   ├── chat/
│   │   ├── core/       # Core chat components
│   │   ├── features/   # Feature-specific components
│   │   └── ui/         # Reusable UI components
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── services/
│   ├── api/           # API service modules
│   └── realtime/      # Real-time service modules
└── store/            # State management
```

#### State Management
- React Context for global state
- Local component state for UI
- Real-time state sync with Supabase

### Server Architecture

#### Service Layer
```plaintext
src/
├── services/
│   ├── messageService.js   # Message handling
│   ├── userService.js      # User management
│   └── channelService.js   # Channel operations
├── middleware/
│   ├── auth.js            # Authentication
│   └── validation.js      # Request validation
└── routes/
    ├── messages.js        # Message endpoints
    └── channels.js        # Channel endpoints
```

#### Middleware Pipeline
```javascript
app.use(cors())
   .use(express.json())
   .use(passport.initialize())
   .use(requestLogger)
   .use('/api', routes)
   .use(errorHandler);
```

### Database Architecture

#### Schema Design
```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    status TEXT,
    last_seen TIMESTAMP
);

-- Channels Table
CREATE TABLE channels (
    id UUID PRIMARY KEY,
    name TEXT,
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_private BOOLEAN
);

-- Messages Table
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

#### Indexes
```sql
-- Message lookup optimization
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_parent ON messages(parent_id);

-- User lookup optimization
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

## Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| @supabase/supabase-js | Database & Real-time |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| Passport | Authentication |
| Supabase | Database |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Hosting |
| Supabase | Database, Real-time & Authentication |

## Data Flow

### Message Flow
```plaintext
Client Request
     ↓
API Gateway
     ↓
Authentication
     ↓
Request Validation
     ↓
Message Service
     ↓
Database Write
     ↓
Supabase Event
     ↓
Real-time Updates
```

### Real-time Updates
```javascript
// Client subscription
const channel = supabase
    .channel('messages')
    .on('postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'messages'
        },
        (payload) => {
            updateChat(payload.new);
        }
    )
    .subscribe();

// Server broadcast (handled automatically by Supabase)
await supabase
    .from('messages')
    .insert({
        content: message.content,
        channel_id: message.channel_id,
        sender_id: message.sender_id
    });
```

## Security Architecture

### Authentication Flow
```plaintext
1. User Login
2. Credentials Validation
3. JWT Generation
4. Token Storage
5. Request Authorization
```

### Security Measures
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- XSS prevention
- CSRF protection

### API Security
```javascript
// JWT Verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new UnauthorizedError();
    }
};

// Request Authentication
app.use('/api/*', authenticateJWT);
```

## Scalability

### Horizontal Scaling
- Stateless server design
- Load balancer ready
- Database connection pooling
- Caching strategy

### Performance Optimization
- Message pagination
- Lazy loading
- Image optimization
- Cache management
- Query optimization

### Monitoring
- Server metrics
- Error tracking
- Performance monitoring
- User analytics

### Caching Strategy
```javascript
// Cache configuration
const cache = {
    type: 'redis',
    ttl: 3600,
    invalidation: {
        strategy: 'write-through',
        patterns: ['message:*', 'user:*']
    }
};

// Cache implementation
const getCachedMessages = async (channelId) => {
    const cacheKey = `messages:${channelId}`;
    let messages = await cache.get(cacheKey);
    
    if (!messages) {
        messages = await db.getMessages(channelId);
        await cache.set(cacheKey, messages);
    }
    
    return messages;
};
``` 