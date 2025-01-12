# ChatterBox Routes

A comprehensive guide to the server-side API routes and endpoints that handle client requests.

## Table of Contents

- [Overview](#overview)
- [Authentication Routes](#authentication-routes)
- [Message Routes](#message-routes)
- [Channel Routes](#channel-routes)
- [User Routes](#user-routes)
- [Direct Message Routes](#direct-message-routes)
- [User Status Routes](#user-status-routes)
- [Best Practices](#best-practices)

## Overview

The ChatterBox API provides RESTful endpoints for:
- User authentication and registration
- Message handling
- Channel management
- User status updates
- Direct messaging
- File operations

## Authentication Routes
`routes/auth.js` - User authentication and registration

### Endpoints

#### Register User
```http
POST /api/auth/register
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ✓ | User's email |
| password | string | ✓ | User's password |
| username | string | ✓ | Desired username |

Response:
```json
{
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username"
    }
}
```

#### Login
```http
POST /api/auth/login
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ✓ | User's email |
| password | string | ✓ | User's password |

Response:
```json
{
    "token": "jwt_token",
    "user": {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username"
    }
}
```

## Message Routes
`routes/messages.js` - Message operations

### Endpoints

#### Send Message
```http
POST /api/messages
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | ✓ | Message content |
| channel_id | string | * | Target channel |
| dm_id | string | * | Direct message ID |

*One of channel_id or dm_id is required

#### Get Channel Messages
```http
GET /api/messages/channel/:channelId
```

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| channelId | string | path | Channel ID |
| limit | number | query | Results limit |
| before | string | query | Cursor for pagination |

## Channel Routes
`routes/channels.js` - Channel management

### Endpoints

#### Create Channel
```http
POST /api/channels
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | ✓ | Channel name |
| description | string | - | Channel description |
| is_private | boolean | - | Privacy setting |

#### Join Channel
```http
POST /api/channels/:channelId/join
```

#### Leave Channel
```http
POST /api/channels/:channelId/leave
```

## User Routes
`routes/users.js` - User management

### Endpoints

#### Get User Profile
```http
GET /api/users/:userId
```

#### Update Profile
```http
PUT /api/users/profile
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | - | New username |
| avatar_url | string | - | Profile picture URL |
| status | string | - | User status |

## Direct Message Routes
`routes/direct-messages.js` - Direct messaging

### Endpoints

#### Create DM
```http
POST /api/direct-messages
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | ✓ | Target user ID |

#### Get DM History
```http
GET /api/direct-messages/:dmId
```

## User Status Routes
`routes/userStatus.js` - Presence management

### Endpoints

#### Update Status
```http
PUT /api/user-status
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | ✓ | New status |
| custom_status | string | - | Custom status message |

## Best Practices

### Request Validation
```javascript
// Validate request body
const validateMessage = (req, res, next) => {
    const { content, channel_id, dm_id } = req.body;
    if (!content) {
        return res.status(400).json({
            error: 'Message content is required'
        });
    }
    if (!channel_id && !dm_id) {
        return res.status(400).json({
            error: 'Either channel_id or dm_id is required'
        });
    }
    next();
};
```

### Error Responses
- Use appropriate HTTP status codes
- Provide clear error messages
- Include error details when safe
- Handle all error cases

```javascript
// Error response example
{
    "error": "Invalid request",
    "message": "Channel name is required",
    "code": "INVALID_CHANNEL_NAME"
}
```

### Authentication
- Protect sensitive routes
- Validate tokens
- Check permissions
- Handle expired tokens

### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const messageLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/messages', messageLimit, ...);
```

### Response Format
- Use consistent response structure
- Include pagination metadata
- Provide resource URLs
- Use proper content types

```javascript
// Success response example
{
    "data": [...],
    "pagination": {
        "next": "cursor",
        "hasMore": true
    },
    "meta": {
        "total": 100,
        "page": 1
    }
}
``` 