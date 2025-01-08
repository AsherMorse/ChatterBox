# ChatterBox

A full-stack real-time chat application built with React (client) and Node.js/Express (server), using Supabase as the backend database and realtime engine.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup Environment Variables](#setup-environment-variables)
  - [Install Dependencies](#install-dependencies)
  - [Database Migrations](#database-migrations)
- [Development](#development)
  - [Running the Client](#running-the-client)
  - [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
  - [Client](#client)
  - [Server](#server)
  - [Database](#database)
  - [Docs](#docs)
- [Design System](#design-system)
- [APIs](#apis)
  - [Authentication](#authentication)
  - [Channels](#channels)
  - [Messages](#messages)
- [Realtime Features](#realtime-features)
- [Best Practices & Guidelines](#best-practices--guidelines)
- [License](#license)

---

## Overview

ChatterBox is a chat and collaboration platform. It allows users to:
- Sign up and sign in (local authentication with JWT).
- Create public or private channels.
- Send direct messages or channel messages, complete with real-time updates.
- Set presence/online status, including typing indicators.
- Manage user settings (notifications, theme, etc.).

The project leverages:
- [React](https://reactjs.org/) with [Vite](https://vitejs.dev/) (client-side).
- [Express.js](https://expressjs.com/) and [Supabase](https://supabase.com/) (server-side).
- [Tailwind CSS](https://tailwindcss.com/) for styling.
- [Passport.js](http://www.passportjs.org/) for authentication strategies.

---

## Architecture

1. **Client**: A React app with Vite as the build tool. It communicates with the server’s REST endpoints for CRUD operations and Supabase Realtime for live data.
2. **Server**: An Express application that serves API endpoints, handles authentication, and interacts with Supabase for data storage (PostgreSQL). It also manages authorization via JWT.
3. **Supabase**: Database (PostgreSQL) + Realtime subscription. The “channels” and “messages” tables can broadcast changes in real time to connected clients.

---

## Features

- Responsive design with a custom [Design System](#design-system).
- Real-time chat with presence and typing indicators.
- JWT-based authentication and role-based channel ownership (owners can modify channels).
- Supabase triggers maintain updated timestamps for specific tables.
- User-friendly modals and forms for creating channels and sending messages.

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- PostgreSQL (if you are running your own instance outside of Supabase)  
  OR  
  A Supabase project with the necessary environment variables.

### Setup Environment Variables

In both the `client` and `server` sides, create and configure your `.env` files:

1. **Server**: In `server/.env`, you need:
   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_KEY=<your-supabase-service-key>
   JWT_SECRET=<your-jwt-secret>
   CLIENT_URL=http://localhost:5173    <-- or replace with your client URL
   PORT=3000
   ```
2. **Client**: In `client/.env` (or `client/.env.local`), you can define:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

Note that in the provided `.gitignore` files, environment files (`.env`) are ignored to avoid committing sensitive information.

### Install Dependencies

From the root directory, install dependencies for both client and server:

```bash
cd client
npm install
# or yarn

cd ../server
npm install
# or yarn
```

### Database Migrations

If you’re using your own Postgres database, you will need to run the SQL migrations located in the `server/db/migrations` folder. If you are using Supabase, you can run these migrations via the Supabase SQL editor or your preferred method.

For example, you could copy the contents of:
```sql:server/db/migrations/001_initial_schema.sql
-- SQL for initial schema
```
into the Supabase SQL editor, followed by:
```sql:server/db/migrations/002_enable_realtime.sql
-- SQL for enabling realtime
```
and so on. Make sure to run them in numerical order.

---

## Development

### Running the Client

1. Go to the `client/` directory.  
2. Run:
   ```bash
   npm run dev
   ```
   By default, this starts the client on [http://localhost:5173](http://localhost:5173).

### Running the Server

1. Go to the `server/` directory.  
2. Run:
   ```bash
   npm run dev
   ```
   This starts the server on the port specified in `server/.env` (default is `3000`).  

Ensure that your `CLIENT_URL` in the server `.env` matches the actual client origin to allow cross-origin requests (CORS).

---

## Project Structure

Below is a high-level overview of important directories and files:

```
ChatterBox/
├─ client/
│  ├─ public/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ services/
│  │  └─ styles/
│  ├─ .gitignore
│  ├─ index.html
│  ├─ package.json
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  └─ vite.config.js
├─ server/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  └─ services/
│  ├─ db/
│  │  ├─ migrations/
│  │  ├─ fix_realtime.sql
│  ├─ .gitignore
│  ├─ package.json
│  └─ .env (ignored)
├─ docs/
│  └─ design-system.md
└─ README.md (this file)
```

### Client

- Main entry point:  
  ```javascript:client/src/main.jsx
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App'
  import './styles/index.css'
  ...
  ```
- Uses React Router for routing (see `client/src/App.jsx`).
- Components and pages in `client/src/components` and `client/src/pages`.
- API calls abstracted in `client/src/services/api/api.js`.

### Server

- Main entry point:  
  ```javascript:server/src/index.js
  import express from 'express'
  import cors from 'cors'
  ...
  ```
- Routes in `server/src/routes`. Notable routes include:
  - `auth.js` for user registration/login.
  - `channels.js` for channel CRUD.
  - `messages.js` for message posting.
- Supabase client configured in `server/src/config/supabase.js`.
- Passport strategies (local + JWT) in `server/src/config/passport.js`.

### Database

- SQL migrations in `server/db/migrations/`.  
- Contains schema definitions (`001_initial_schema.sql`), enabling realtime functionality (`002_enable_realtime.sql`, `003_fix_realtime.sql`), and any other changes.

### Docs

- `docs/design-system.md` describes the color palette, typography, spacing, shadows, border radius, and more. This is a reference for consistent styling across the app.

---

## Design System

The full design system is documented in:
```markdown:docs/design-system.md
# ChatterBox Design System

## 1. Colors
...
```
It outlines:
- **Color Palette** (Primary, Secondary, Neutral, etc.)
- **Typography** (Fonts & font sizes)
- **Spacing & Sizing**
- **Shadows & Border Radii**
- **Animations** (keyframes, durations)
- **Responsive Breakpoints**

The client implements many of these design tokens in files like:
```css:client/src/styles/theme.css
:root {
  --primary-50: #f0f9ff;
  ...
}
```
and through the Tailwind configuration in:
```javascript:client/tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'gunmetal': '#272D2D',
        'rose-quartz': '#A39BA8',
        'powder-blue': '#B8C5D6',
        ...
      },
      ...
    }
  }
}
```

---

## APIs

### Authentication

Implemented in:
```javascript:server/src/routes/auth.js
// Register and login routes
```
- `/api/auth/register`  
- `/api/auth/login`  

Generates a JWT token upon successful login or registration. The client stores this token in `localStorage` to include with each subsequent API request (`Authorization: Bearer ...`).

### Channels

```javascript:server/src/routes/channels.js
// Create, list, update, and more
```
- `POST /api/channels/` to create a channel.
- `PUT /api/channels/:channelId` to update an existing channel (must be owner).

### Messages

```javascript:server/src/routes/messages.js
// Create and fetch messages
```
- `POST /api/messages/` to send a message.

---

## Realtime Features

ChatterBox leverages Supabase Realtime for:
- Listening to `messages` table changes (inserts, updates, deletes).
- Emitting presence-based events for typing indicators.
- React’s client receives updates through the `realtimeService` described in:
  ```javascript:client/src/services/realtime/realtimeService.js
  ```
This allows the UI to update instantly whenever a new message arrives or a user starts typing.

---

## Best Practices & Guidelines

A summary of best practices can be found in `docs/design-system.md` under “Best Practices,” including:
- WCAG 2.1 AA compliance
- Proper color contrast
- Reduced motion preferences for animations
- Responsive design breakpoints
- Performance: lazy loading, caching

---

## License

No explicit license is provided in the repository. Please consider contacting the repository owner or maintainers regarding licensing or reuse of this code.

---

**Happy Coding!**  
If you encounter any issues, feel free to open an issue or discuss with the team. ChatterBox is always open for improvements and feature requests.
