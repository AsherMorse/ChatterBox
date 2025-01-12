# ChatterBox Client Source

A comprehensive guide to the client-side source code organization, architecture, and development patterns.

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Pages](#pages)
- [Services](#services)
- [Utils](#utils)
- [Styles](#styles)
- [Configuration](#configuration)
- [Assets](#assets)

## Overview

The ChatterBox client is built with:
- React 18 for UI components
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Supabase for backend integration

## Directory Structure

```plaintext
src/
├── assets/        # Static assets and images
├── components/    # Reusable UI components
│   ├── auth/      # Authentication components
│   ├── chat/      # Chat-related components
│   ├── common/    # Shared components
│   └── sidebar/   # Sidebar components
├── config/        # Configuration files
├── pages/         # Page components
├── services/      # API and service layer
│   ├── api/       # REST API services
│   └── realtime/  # Real-time services
├── styles/        # Global styles and themes
├── utils/         # Utility functions
├── App.jsx        # Root component
└── main.jsx      # Application entry point
```

## Core Components

### Application Entry
`main.jsx` - Application bootstrap

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

## Pages

| Page | Purpose | Path |
|------|---------|------|
| `Auth.jsx` | Authentication and registration | `/auth` |
| `BrowseChannels.jsx` | Channel discovery and joining | `/browse` |

## Services

Services are organized into two main categories:

### API Services
`services/api/` - REST API communication
- Message operations
- User management
- Channel operations
- File handling

### Realtime Services
`services/realtime/` - Supabase real-time features
- Live messaging
- Presence updates
- Typing indicators
- Status changes

## Utils

Utility functions and helpers:
- Event handling
- Theme management
- Performance optimization
- Common helpers

## Styles

### Global Styles
`styles/index.css` - Global styles and Tailwind imports

### Theme System
`styles/theme.css` - Theme variables and dark mode support

### Component Styles
Component-specific styles using Tailwind classes

## Configuration

### Supabase Configuration
`config/supabase.js` - Backend connection setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## Assets

Static assets and resources:
- Images
- Icons
- Fonts
- Other media files

## Best Practices

### Component Structure
- Use functional components
- Implement proper prop types
- Follow single responsibility principle
- Keep components focused and reusable

### State Management
- Use React hooks effectively
- Implement proper context boundaries
- Keep state close to where it's used
- Use proper state initialization

### Performance
- Implement code splitting
- Use lazy loading for routes
- Optimize re-renders
- Cache API responses

### Code Organization
- Follow consistent naming conventions
- Group related functionality
- Use proper file organization
- Maintain clear dependencies

### Development Workflow
- Use consistent code formatting
- Write meaningful comments
- Follow Git commit conventions
- Keep dependencies updated 