# ChatterBox

A modern real-time chat application built with a microservices-based architecture, event-driven communication, and secure authentication. This README provides a consolidated overview of the codebase, setup instructions, and best practices. For deeper dives into specific topics, refer to the documentation files located in the "docs/" directory.

## Table of Contents
1. [Overview](#overview)  
2. [Architecture](#architecture)  
3. [Features](#features)  
4. [Directory Structure](#directory-structure)  
5. [Setup & Configuration](#setup--configuration)  
6. [Development](#development)  
7. [Styling & Theming](#styling--theming)  
8. [API Documentation](#api-documentation)  
9. [Best Practices](#best-practices)  
10. [Contributing](#contributing)  
11. [License](#license)

---

## Overview
ChatterBox is engineered to facilitate real-time messaging, channel-based discussion, and direct messaging. It leverages:
- React 18 and Vite on the client side
- Node.js, Express, and Supabase on the server side
- TailwindCSS for theming and styling
- Passport.js & JWT for authentication
- WebSocket/Supabase real-time features for live updates

Its modular architecture and clear separation of concerns make it highly maintainable and scalable.

---

## Architecture
ChatterBox follows a microservices-inspired architecture with distinct layers for:
- Frontend (React 18 + Vite)
- Backend (Node.js + Express)
- Real-time Services (Supabase real-time)
- Database (PostgreSQL via Supabase)

Key points:
- The frontend uses React Router for navigation and React Context/Hook-based state management.  
- The backend exposes a RESTful API and includes WebSocket-based real-time features from Supabase.  
- Each layer is independently configurable, allowing for easy updates and deployment.

For a full structural overview, see the “docs/Architecture.md” file.  

### Core Components
- Client (in “client/”): Manages UI, usage flows, and data fetching.  
- Server (in “server/”): Handles API routes, authentication, and database interactions.  

---

## Features
1. Real-time Messaging: Instant updates across channels and direct messages.  
2. Channel Management: Create, join, and manage chat groups.  
3. Direct Messaging: Private one-on-one conversations.  
4. User Presence & Status: Track who is online, away, or offline.  
5. File Sharing: Attach and manage files in chat.  
6. Theming: Light and dark modes with a configurable theme system.  

Please review “docs/Features.md” for a complete rundown of integrated features and usage details.

---

## Directory Structure

Below are the high-level directories. See the more detailed structures inside the “client/” and “server/” folders and in the “docs/” folder for full breakdowns.

```plaintext
ChatterBox/
├── client/
│   ├── src/
│   │   ├── components/       # UI and feature components
│   │   ├── pages/            # Page-level routes
│   │   ├── services/         # API and real-time service layers
│   │   ├── styles/           # Tailwind and custom CSS
│   │   ├── utils/            # Utility functions
│   │   └── App.jsx           # Root component
│   ├── public/               # Static assets
│   └── index.html            # Entry HTML
│
├── server/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware (auth, validation)
│   │   └── index.js          # Entry point
│   ├── db/                   # Database scripts
│   └── vercel.json           # Deployment config (if using Vercel)
│
└── docs/
    ├── Architecture.md       # High-level system design
    ├── Backend.md           # Server and API docs
    ├── DesignSystem.md      # Design system documentation
    ├── Features.md          # Feature-specific guides
    ├── Frontend.md          # UI/UX and component docs
    └── StyleGuide.md        # Documentation style guide
```

---

## Setup & Configuration
Follow these steps to get started locally:

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/your_org/chatterbox.git
   cd chatterbox
   ```

2. **Install Dependencies**  
   - For the client:
     ```bash
     cd client
     npm install
     ```
   - For the server:
     ```bash
     cd server
     npm install
     ```

3. **Environment Variables**  
   - Create a `.env` file in both “client/” and “server/” based on `.env.example` or `.env.production`:
     ```bash
     cp .env.example .env
     ```
   - Set your Supabase credentials, JWT secrets, and other required variables as outlined in:
     - “docs/Client.md” for client variables  
     - “docs/Server.md” for server variables  

4. **Build Tools**  
   - Client uses Vite (configured in `vite.config.js`).  
   - Server uses Node.js and can be deployed on Vercel (optional).

For detailed instructions, see:
- “docs/Client.md” or “client/Client.md” (client setup)  
- “docs/Server.md” or “server/Server.md” (server setup)

---

## Development

1. **Running the Client**  
   From the “client/” folder:
   ```bash
   npm run dev | cat
   ```
   This starts a local dev server (default at localhost:5173).  

2. **Running the Server**  
   From the “server/” folder:
   ```bash
   npm run dev | cat
   ```
   The server typically starts on port 3000.  

3. **Linting & Formatting**  
   ```bash
   npm run lint | cat
   ```
   ESLint is configured to enforce React best practices, modern JS usage, and consistent formatting.  

4. **Code Style**  
   - Follows guidelines in “docs/StyleGuide.md.”  
   - Use JSDoc-style comments for React components.  
   - Keep commits concise (review with `git status`, then `git add .`, then `git commit -m "Your message"`).

---

## Styling & Theming
The project uses TailwindCSS with a custom theme:
- Light and dark modes, toggled by adding the `dark` class to the HTML element.  
- Custom color tokens defined in “docs/DesignSystem.md.”  
- Example usage:

```jsx
<button className="
  px-4 py-2
  bg-emerald text-white
  dark:bg-dark-bg-primary
  rounded-md
  transition
">
  Click Me
</button>
```

For more details:
- “docs/DesignSystem.md”  
- “docs/Frontend.md” (Styling section)  

---

## API Documentation
ChatterBox’s server follows RESTful conventions. Endpoints include:
- `/api/auth` for registration, login, and token management
- `/api/messages` for message creation, reading, and deletion
- `/api/channels` for channel CRUD operations
- `/api/users` for user profiles and status
- `/api/direct-messages` for private chats

All API documentation follows the structure in “docs/StyleGuide.md,” including:
1. HTTP Method  
2. Endpoint Path  
3. Request Parameters  
4. Response Format  
5. Example Request/Response  
6. Error Codes  
7. Version Numbers (where applicable)  

See “docs/Routes.md” and the “backend/” or “server/” subfolders within “docs/” for endpoint-specific guides.

---

## Best Practices
Adhering to the guidelines in “docs/StyleGuide.md,” the following principles shape ChatterBox’s codebase:

1. **Language & Tone**  
   - Use the present tense and active voice.  
   - Be concise yet thorough.  

2. **State Management**  
   - Prefer local state in components for UI concerns.  
   - Use React Context sparingly for global data.  
   - Integrate React hooks for data fetching, side effects, and real-time events.

3. **Performance**  
   - Code splitting (lazy-loaded components).  
   - React.memo and useMemo for expensive renders.  
   - Virtualized lists for large datasets.  
   - Debounce/throttle frequent operations (e.g., searches).

4. **Security**  
   - Store and manage secrets in environment variables.  
   - Validate all inputs on the server.  
   - Hash passwords (bcrypt) and handle JWT securely.  
   - Apply CORS policies with care.

5. **Error Handling**  
   - Use consistent error structures.  
   - Provide meaningful messages for troubleshooting.  
   - Include global error handlers on both client and server.

6. **Logging & Monitoring**  
   - Log important operations and errors with timestamps.  
   - Handle logging in production vs. development.  

7. **Version Control**  
   - Use concise, meaningful commit messages.  
   - Run tests and linters before committing.  
   - Keep a clear branch strategy (feature branches, main, etc.).  

---

## Contributing
Contributions are welcome. Please:
1. Fork the repository and create a feature branch.  
2. Make sure to run linting and tests before committing.  
3. Open a pull request with a descriptive title and summary of changes.

Review the “docs/StyleGuide.md” for consistent code documentation and the project’s coding standards.

---

## License
This project is licensed under the MIT License. See the “LICENSE” file for details.
