# ChatterBox Server Services

A comprehensive guide to the client-side service layer that handles data fetching, real-time communication, and business logic.

## Table of Contents

- [Overview](#overview)
- [API Services](#api-services)
  - [Core API](#core-api)
  - [Message Service](#message-service)
  - [File Service](#file-service)
  - [User Service](#user-service)
  - [Channel Service](#channel-service)
  - [Direct Message Service](#direct-message-service)
- [Real-time Services](#real-time-services)
  - [Real-time Service](#real-time-service)
  - [Presence System](#presence-system)
- [Best Practices](#best-practices)

## Overview

The ChatterBox server services provide:
- Message handling and real-time updates
- User management and authentication
- Integration with Supabase
- Data validation and processing

## API Services

### Core API
`services/api/api.js` - Base API configuration and request handling

#### Configuration
```javascript
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});
```

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `get(url)` | `url: string` | `Promise<any>` | Perform GET request |
| `post(url, data)` | `url: string, data: object` | `Promise<any>` | Perform POST request |
| `put(url, data)` | `url: string, data: object` | `Promise<any>` | Perform PUT request |
| `delete(url)` | `url: string` | `Promise<any>` | Perform DELETE request |

### Message Service
`services/api/messageService.js` - Message operations

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendMessage(channelId, content)` | `channelId: string, content: string` | `Promise<Message>` | Send new message |
| `editMessage(messageId, content)` | `messageId: string, content: string` | `Promise<Message>` | Edit message |
| `deleteMessage(messageId)` | `messageId: string` | `Promise<void>` | Delete message |
| `getThreadReplies(messageId)` | `messageId: string` | `Promise<Message[]>` | Get thread replies |

#### Usage Example
```javascript
import { messageService } from '@/services/api/messageService';

// Send a message
const message = await messageService.sendMessage(channelId, {
    content: 'Hello world',
    attachments: [],
    mentions: []
});

// Edit a message
await messageService.editMessage(messageId, {
    content: 'Updated content'
});
```

### File Service
`services/api/fileService.js` - File management

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `uploadFile(file)` | `file: File` | `Promise<FileInfo>` | Upload file |
| `deleteFile(fileId)` | `fileId: string` | `Promise<void>` | Delete file |
| `getFileUrl(fileId)` | `fileId: string` | `Promise<string>` | Get download URL |
| `getFileMetadata(fileId)` | `fileId: string` | `Promise<FileMetadata>` | Get file info |

#### Upload Example
```javascript
import { fileService } from '@/services/api/fileService';

const handleUpload = async (file) => {
    const fileInfo = await fileService.uploadFile(file);
    return fileInfo.url;
};
```

### User Service
`services/api/userService.js` - User management

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getProfile()` | - | `Promise<User>` | Get current user |
| `updateProfile(data)` | `data: UserUpdate` | `Promise<User>` | Update profile |
| `updateStatus(status)` | `status: string` | `Promise<void>` | Update status |
| `searchUsers(query)` | `query: string` | `Promise<User[]>` | Search users |

### Channel Service
`services/api/channelService.js` - Channel operations

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createChannel(data)` | `data: ChannelCreate` | `Promise<Channel>` | Create channel |
| `joinChannel(channelId)` | `channelId: string` | `Promise<void>` | Join channel |
| `leaveChannel(channelId)` | `channelId: string` | `Promise<void>` | Leave channel |
| `getMembers(channelId)` | `channelId: string` | `Promise<User[]>` | Get members |

## Real-time Services

### Real-time Service
`services/realtime/realtimeService.js` - WebSocket communication

#### Events
| Event | Payload | Description |
|-------|---------|-------------|
| `message.new` | `Message` | New message received |
| `message.updated` | `Message` | Message was edited |
| `message.deleted` | `MessageId` | Message was deleted |
| `user.status` | `UserStatus` | User status changed |
| `typing.start` | `TypingInfo` | User started typing |
| `typing.stop` | `TypingInfo` | User stopped typing |

#### Event Handling Example
```javascript
import { realtimeService } from '@/services/realtime/realtimeService';

// Subscribe to events
realtimeService.on('message.new', (message) => {
    console.log('New message:', message);
});

// Emit events
realtimeService.emit('typing.start', {
    channelId,
    userId
});
```

### Presence System
`services/realtime/presenceService.js` - User presence tracking

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `updatePresence(status)` | `status: string` | `Promise<void>` | Update presence |
| `trackUser(userId)` | `userId: string` | `Promise<void>` | Track user presence |
| `getOnlineUsers()` | - | `Promise<User[]>` | Get online users |

## Best Practices

### Error Handling
```javascript
try {
    const response = await api.post('/endpoint', data);
    return response.data;
} catch (error) {
    if (error.response) {
        // Handle specific HTTP errors
        throw new ApiError(error.response.data.message);
    }
    // Handle network errors
    throw new NetworkError('Network request failed');
}
```

### Authentication
- Automatically include auth tokens
- Handle token expiration
- Refresh tokens when needed
- Secure sensitive requests

### Performance
- Implement request caching
- Use debouncing for frequent operations
- Optimize payload sizes
- Handle offline scenarios

### Real-time Communication
- Implement reconnection logic
- Queue messages during disconnection
- Handle connection state changes
- Clean up subscriptions

### Type Safety
```typescript
interface Message {
    id: string;
    content: string;
    sender: User;
    timestamp: Date;
    attachments?: FileInfo[];
}

interface User {
    id: string;
    username: string;
    status: 'online' | 'offline' | 'away';
}
```

### Real-time Management
- Handle Supabase subscriptions
- Monitor connection status
- Implement reconnection logic
- Cache real-time data
 