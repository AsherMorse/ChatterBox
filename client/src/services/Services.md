# ChatterBox Services

A comprehensive guide to the service layer that handles data fetching, real-time communication, and business logic in the ChatterBox application.

## Table of Contents

- [Service Organization](#service-organization)
  - [API Services](#api-services)
  - [Realtime Services](#realtime-services)
- [API Services](#api-services)
  - [Core API](#core-api)
  - [Message Service](#message-service)
  - [File Service](#file-service)
  - [User Status Service](#user-status-service)
  - [Auth Service](#auth-service)
  - [User Service](#user-service)
  - [DM Service](#dm-service)
  - [Channel Service](#channel-service)
- [Realtime Services](#realtime-services)
  - [Realtime Service](#realtime-service)
- [Best Practices](#best-practices)

## Service Organization

ChatterBox's service layer is organized into two main categories:

| Category | Purpose | Location |
|----------|---------|----------|
| API | RESTful API communication and data management | `services/api/` |
| Realtime | Supabase real-time communication | `services/realtime/` |

## API Services

### Core API
`services/api/api.js`

Base API configuration and request handling.

#### Methods
| Method | Description |
|--------|-------------|
| `get(url)` | Perform GET request |
| `post(url, data)` | Perform POST request |
| `put(url, data)` | Perform PUT request |
| `delete(url)` | Perform DELETE request |

#### Usage Example
```javascript
import { api } from '../services/api/api';

const response = await api.get('/users/profile');
```

### Message Service
`services/api/messageService.js`

Handles message-related API operations.

#### Methods
| Method | Description |
|--------|-------------|
| `sendMessage(channelId, content)` | Send a new message |
| `editMessage(messageId, content)` | Edit an existing message |
| `deleteMessage(messageId)` | Delete a message |

#### Usage Example
```javascript
import { messageService } from '../services/api/messageService';

await messageService.sendMessage('123', 'Hello, world!');
```

### File Service
`services/api/fileService.js`

Manages file uploads and attachments.

#### Methods
| Method | Description |
|--------|-------------|
| `uploadFile(file)` | Upload a file |
| `deleteFile(fileId)` | Delete a file |
| `getFileUrl(fileId)` | Get file download URL |

### User Status Service
`services/api/userStatus.js`

Manages user presence and status.

#### Methods
| Method | Description |
|--------|-------------|
| `updateStatus(status)` | Update user status |
| `getStatus(userId)` | Get user's current status |

### Auth Service
`services/api/auth.js`

Handles authentication and authorization.

#### Methods
| Method | Description |
|--------|-------------|
| `login(credentials)` | User login |
| `register(userData)` | User registration |
| `logout()` | User logout |
| `refreshToken()` | Refresh authentication token |

### User Service
`services/api/userService.js`

Manages user data and profiles.

#### Methods
| Method | Description |
|--------|-------------|
| `getProfile()` | Get current user's profile |
| `updateProfile(data)` | Update user profile |

### DM Service
`services/api/dmService.js`

Handles direct messaging functionality.

#### Methods
| Method | Description |
|--------|-------------|
| `createDM(userId)` | Start a new DM conversation |
| `getDMHistory(dmId)` | Get DM conversation history |

### Channel Service
`services/api/channelService.js`

Manages channel operations.

#### Methods
| Method | Description |
|--------|-------------|
| `createChannel(data)` | Create a new channel |
| `joinChannel(channelId)` | Join an existing channel |
| `leaveChannel(channelId)` | Leave a channel |

## Realtime Services

### Realtime Service
`services/realtime/realtimeService.js` - Manages Supabase real-time subscriptions and events.

#### Events
| Event | Description |
|-------|-------------|
| `message.new` | New message received |
| `message.updated` | Message was edited |
| `message.deleted` | Message was deleted |
| `user.status` | User status changed |
| `channel.updated` | Channel was updated |

#### Usage Example
```javascript
import { realtimeService } from '../services/realtime/realtimeService';

realtimeService.on('message.new', (message) => {
  console.log('New message:', message);
});
```

## Best Practices

### Error Handling
- Implement consistent error handling across services
- Use custom error types for different scenarios
- Provide meaningful error messages
- Handle network errors gracefully

### Authentication
- Include authentication headers automatically
- Handle token refresh transparently
- Secure sensitive endpoints
- Validate user permissions

### Performance
- Implement request caching where appropriate
- Use request debouncing for frequent operations
- Handle offline scenarios
- Optimize payload size

### Real-time Communication
- Implement reconnection strategies
- Handle message queuing during disconnections
- Maintain connection health checks
- Implement proper event cleanup 