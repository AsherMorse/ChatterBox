# ChatterBox Middleware

A comprehensive guide to the server-side middleware components that handle authentication, request processing, and security.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
  - [JWT Authentication](#jwt-authentication)
  - [Token Generation](#token-generation)
- [Usage](#usage)
- [Best Practices](#best-practices)

## Overview

The ChatterBox middleware provides:
- JWT-based authentication
- Request validation
- Security measures
- Error handling

## Authentication

### JWT Authentication
`middleware/auth.js` - Authentication middleware using Passport.js and JWT

#### Configuration
```javascript
import passport from 'passport';
import jwt from 'jsonwebtoken';

export const authenticateJWT = passport.authenticate('jwt', { session: false });
```

#### Usage
```javascript
import { authenticateJWT } from '../middleware/auth';

// Protect a route with JWT authentication
router.get('/protected', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
});
```

### Token Generation
`middleware/auth.js` - JWT token generation utilities

#### Methods
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `generateToken(user)` | `user: User` | `string` | Generate JWT token |

#### Implementation
```javascript
export const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
    );
};
```

#### Token Payload
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `email` | string | User email |
| `exp` | number | Expiration timestamp |

## Usage

### Protecting Routes
```javascript
// Protected route example
router.post('/messages', authenticateJWT, async (req, res) => {
    // Only authenticated users can access this route
    const { user } = req;
    // ... handle request
});
```

### Error Handling
```javascript
// Error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
    next(err);
});
```

### Token Verification
```javascript
// Verify token in requests
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};
```

## Best Practices

### Security
- Use environment variables for secrets
- Implement token expiration
- Validate token signatures
- Use secure headers

```javascript
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
```

### Token Management
- Implement token refresh mechanism
- Handle token revocation
- Use appropriate token expiration
- Secure token storage

### Error Handling
- Provide clear error messages
- Handle different error types
- Log security events
- Implement rate limiting

### Request Validation
- Validate request parameters
- Sanitize user input
- Check content types
- Verify request origins

### Performance
- Use efficient token algorithms
- Implement caching where appropriate
- Monitor middleware performance
- Handle concurrent requests

### Type Definitions
```typescript
interface User {
    id: string;
    email: string;
    roles?: string[];
}

interface TokenPayload {
    id: string;
    email: string;
    exp: number;
}

interface AuthenticatedRequest extends Request {
    user: User;
}
``` 