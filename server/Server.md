# ChatterBox Server

A comprehensive guide to the server-side configuration, setup, and deployment of the ChatterBox application.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
  - [Dependencies](#dependencies)
  - [Environment Variables](#environment-variables)
  - [Scripts](#scripts)
- [Configuration](#configuration)
  - [Vercel](#vercel)
  - [CORS](#cors)
  - [Database](#database)
- [Development](#development)
- [Deployment](#deployment)
- [Best Practices](#best-practices)

## Overview

The ChatterBox server is built with:
- Node.js and Express for the API
- Supabase for database and real-time features
- Passport.js for authentication
- JWT for session management
- Vercel for deployment

## Setup

### Dependencies

#### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| @supabase/supabase-js | ^2.47.10 | Database client |
| passport | ^0.7.0 | Authentication |
| jsonwebtoken | ^9.0.2 | JWT handling |
| bcryptjs | ^2.4.3 | Password hashing |
| cors | ^2.8.5 | CORS support |

#### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.0.1 | Development server |

### Environment Variables

Required environment configuration:

```plaintext
# Server Configuration
PORT=3000
CLIENT_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
```

### Scripts

Available npm scripts:

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `node src/index.js` | Start production server |
| `dev` | `nodemon src/index.js` | Start development server |
| `test` | `echo \"Error: no test specified\" && exit 1` | Run tests |

## Configuration

### Vercel
`vercel.json` - Deployment configuration

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
      "dest": "src/index.js",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      "headers": {
        "Access-Control-Allow-Origin": "https://chatter-box-client-five.vercel.app",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    }
  ]
}
```

### CORS

CORS configuration for different environments:

```javascript
const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
```

### Database

Supabase configuration:

```javascript
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
```

## Development

### Local Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update environment variables
5. Start development server:
   ```bash
   npm run dev
   ```

### Directory Structure
```plaintext
server/
├── src/
│   ├── config/      # Configuration files
│   ├── middleware/  # Express middleware
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── index.js     # Entry point
├── db/              # Database scripts
├── .env             # Environment variables
├── package.json     # Dependencies
└── vercel.json      # Deployment config
```

## Deployment

### Vercel Deployment
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```

### Environment Setup
1. Configure production environment variables in Vercel dashboard
2. Set up proper CORS origins
3. Configure database access
4. Set up proper JWT secrets

## Best Practices

### Security
- Use environment variables for secrets
- Implement proper CORS policies
- Use secure headers
- Validate all inputs
- Hash sensitive data

### Performance
- Use connection pooling
- Implement caching
- Optimize database queries
- Monitor server health

### Error Handling
```javascript
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' 
            ? err.message 
            : 'Something went wrong'
    });
});
```

### Logging
- Use proper logging levels
- Include request IDs
- Log important operations
- Monitor errors

### Development Workflow
- Follow Git branching strategy
- Use proper versioning
- Document API changes
- Keep dependencies updated 