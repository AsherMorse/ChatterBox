# ChatterBox Components

A comprehensive guide to the component architecture and reusable UI elements used throughout the ChatterBox application.

## Table of Contents

- [Component Organization](#component-organization)
  - [Common Components](#common-components)
  - [Chat Components](#chat-components)
  - [Sidebar Components](#sidebar-components)
  - [Auth Components](#auth-components)
- [Common Components](#common-components)
  - [Header](#header)
- [Chat Components](#chat-components)
  - [Core](#chat-core)
  - [Messages](#chat-messages)
  - [Features](#chat-features)
  - [Files](#chat-files)
  - [Channels](#chat-channels)
- [Sidebar Components](#sidebar-components)
  - [UserStatusEditor](#user-status-editor)
- [Auth Components](#auth-components)

## Component Organization

ChatterBox's component architecture is organized into four main categories:

| Category | Purpose | Location |
|----------|---------|----------|
| Common | Shared UI elements used across the application | `components/common/` |
| Chat | Chat-specific components for messaging and channels | `components/chat/` |
| Sidebar | Navigation and user profile components | `components/sidebar/` |
| Auth | Authentication and authorization components | `components/auth/` |

## Common Components

### Header
`components/common/Header.jsx`

The main navigation header component used across the application.

#### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | string | ✓ | - | The title to display in the header |
| onMenuClick | function | - | - | Callback when menu button is clicked |

#### Usage Example
```jsx
<Header 
  title="ChatterBox"
  onMenuClick={() => setMenuOpen(true)}
/>
```

## Chat Components

The chat module is organized into several subdirectories:

### Core
`components/chat/core/`

Core chat functionality components including the main chat container and message handlers.

### Messages
`components/chat/messages/`

Message-specific components for rendering and managing chat messages.

### Features
`components/chat/features/`

Additional chat features like reactions, emoji picker, and message formatting.

### Files
`components/chat/files/`

Components for handling file uploads and attachments in chat.

### Channels
`components/chat/channels/`

Channel management components including creation, joining, and settings.

## Sidebar Components

### UserStatusEditor
`components/sidebar/UserStatusEditor.jsx`

Component for editing user status and presence information.

#### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| currentStatus | string | ✓ | - | User's current status |
| onStatusChange | function | ✓ | - | Callback when status is changed |

#### Usage Example
```jsx
<UserStatusEditor
  currentStatus="online"
  onStatusChange={(status) => updateUserStatus(status)}
/>
```

## Auth Components

Authentication components for user login, registration, and account management.

## Best Practices

### Component Structure
- Keep components focused and single-responsibility
- Use TypeScript for prop type definitions
- Implement error boundaries for component error handling
- Follow the container/presenter pattern for complex components

### State Management
- Use React hooks for local state
- Implement context for shared state when needed
- Keep state as close to where it's used as possible

### Performance
- Implement React.memo for expensive renders
- Use proper key props in lists
- Lazy load components when appropriate
- Implement virtualization for long lists

### Accessibility
- Include proper ARIA labels
- Ensure keyboard navigation
- Maintain proper heading hierarchy
- Test with screen readers 