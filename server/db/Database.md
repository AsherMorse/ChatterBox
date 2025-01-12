# ChatterBox Database Schema

A comprehensive guide to the database structure, relationships, and real-time functionality of the ChatterBox application.

## Table of Contents

- [Overview](#overview)
- [Core Tables](#core-tables)
  - [Users](#users)
  - [Channels](#channels)
  - [Channel Members](#channel-members)
- [Messaging](#messaging)
  - [Direct Messages](#direct-messages)
  - [Messages](#messages)
  - [Message Reactions](#message-reactions)
- [File Management](#file-management)
  - [Files](#files)
  - [File Attachments](#file-attachments)
- [User Features](#user-features)
  - [User Settings](#user-settings)
  - [Bookmarks](#bookmarks)
  - [Pinned Messages](#pinned-messages)
- [Real-time Features](#real-time-features)
- [Triggers & Functions](#triggers--functions)

## Overview

The ChatterBox database is built on PostgreSQL with real-time capabilities through Supabase. It includes:

- User authentication and profiles
- Channel-based messaging
- Direct messaging
- File attachments
- Message reactions
- User preferences
- Real-time updates

## Core Tables

### Users
`users` - Core user information and profile data

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | `PRIMARY KEY` |
| email | TEXT | User's email | `UNIQUE`, `NOT NULL` |
| username | TEXT | Display name | `UNIQUE`, `NOT NULL` |
| password_hash | TEXT | Encrypted password | `NOT NULL` |
| first_name | TEXT | First name | Optional |
| last_name | TEXT | Last name | Optional |
| avatar_url | TEXT | Profile picture URL | Optional |
| presence | TEXT | Online status | CHECK ('online', 'offline', 'idle') |
| custom_status_text | TEXT | Custom status message | Optional |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

### Channels
`channels` - Group chat channels

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | `PRIMARY KEY` |
| name | TEXT | Channel name | `UNIQUE`, `NOT NULL` |
| description | TEXT | Channel description | Optional |
| is_private | BOOLEAN | Privacy setting | `DEFAULT false` |
| created_by | UUID | Creator reference | `REFERENCES users(id)` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

### Channel Members
`channel_members` - Channel membership and roles

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| channel_id | UUID | Channel reference | `REFERENCES channels(id)` |
| user_id | UUID | User reference | `REFERENCES users(id)` |
| role | TEXT | Member role | CHECK ('owner', 'admin', 'member') |
| joined_at | TIMESTAMPTZ | Join timestamp | `DEFAULT NOW()` |

## Messaging

### Direct Messages
`direct_messages` - One-on-one conversations

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| dm_id | UUID | Primary key | `PRIMARY KEY` |
| user1_id | UUID | First user | `REFERENCES users(id)` |
| user2_id | UUID | Second user | `REFERENCES users(id)` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |

### Messages
`messages` - All message content

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | `PRIMARY KEY` |
| content | TEXT | Message content | `NOT NULL` |
| sender_id | UUID | Sender reference | `REFERENCES users(id)` |
| channel_id | UUID | Channel reference | `REFERENCES channels(id)` |
| dm_id | UUID | DM reference | `REFERENCES direct_messages(dm_id)` |
| parent_id | UUID | Parent message for threads | `REFERENCES messages(id)` |
| is_edited | BOOLEAN | Edit indicator | `DEFAULT false` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

### Message Reactions
`message_reactions` - Emoji reactions to messages

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| message_id | UUID | Message reference | `REFERENCES messages(id)` |
| user_id | UUID | User reference | `REFERENCES users(id)` |
| emoji | TEXT | Reaction emoji | `NOT NULL` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |

## File Management

### Files
`files` - File metadata

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | `PRIMARY KEY` |
| name | TEXT | File name | `NOT NULL` |
| type | TEXT | MIME type | `NOT NULL` |
| size | INTEGER | File size in bytes | `NOT NULL` |
| url | TEXT | Storage URL | `NOT NULL` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

### File Attachments
`file_attachments` - Links files to messages

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | UUID | Primary key | `PRIMARY KEY` |
| file_id | UUID | File reference | `REFERENCES files(id)` |
| message_id | UUID | Message reference | `REFERENCES messages(id)` |
| uploader_id | UUID | Uploader reference | `REFERENCES users(id)` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

## User Features

### User Settings
`user_settings` - User preferences

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| user_id | UUID | User reference | `REFERENCES users(id)` |
| theme | TEXT | UI theme | `DEFAULT 'light'` |
| notifications_enabled | BOOLEAN | Global notifications | `DEFAULT true` |
| email_notifications | BOOLEAN | Email notifications | `DEFAULT true` |
| desktop_notifications | BOOLEAN | Desktop notifications | `DEFAULT true` |
| sound_enabled | BOOLEAN | Sound effects | `DEFAULT true` |
| updated_at | TIMESTAMPTZ | Last update timestamp | `DEFAULT NOW()` |

### Bookmarks
`bookmarked_messages` - Saved messages

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| user_id | UUID | User reference | `REFERENCES users(id)` |
| message_id | UUID | Message reference | `REFERENCES messages(id)` |
| created_at | TIMESTAMPTZ | Creation timestamp | `DEFAULT NOW()` |

### Pinned Messages
`pinned_messages` - Channel pinned messages

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| message_id | UUID | Message reference | `REFERENCES messages(id)` |
| channel_id | UUID | Channel reference | `REFERENCES channels(id)` |
| pinned_by | UUID | User reference | `REFERENCES users(id)` |
| pinned_at | TIMESTAMPTZ | Pin timestamp | `DEFAULT NOW()` |

## Real-time Features

The database supports real-time updates through Supabase for:

- User presence changes
- New messages
- Message edits and deletions
- Reactions
- Channel updates
- File attachments

## Triggers & Functions

### Timestamp Updates
- `update_updated_at_column()` - Updates timestamps on record changes
- Applies to: users, channels, messages, files, file_attachments

### Message Threading
- `update_message_reply_count()` - Maintains thread reply counts
- Triggers on: INSERT, DELETE on messages

## Best Practices

### Data Integrity
- Use UUIDs for all primary keys
- Implement proper foreign key constraints
- Maintain updated_at timestamps
- Handle cascading deletes appropriately

### Performance
- Index frequently queried columns
- Use appropriate data types
- Implement efficient joins
- Monitor query performance

### Security
- Implement row-level security
- Use proper role-based access
- Encrypt sensitive data
- Validate all inputs 