# ChatterBox Frontend

A comprehensive guide to the frontend architecture, component design, and implementation details.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [State Management](#state-management)
- [Styling](#styling)
- [Performance](#performance)
- [Best Practices](#best-practices)

## Overview

The ChatterBox frontend is built with:
- React 18 for UI components
- Vite for build tooling
- TailwindCSS for styling
- Supabase for real-time features
- React Router for navigation

## Architecture

### Directory Structure
```plaintext
client/
├── src/
│   ├── components/     # React components
│   │   ├── chat/      # Chat-related components
│   │   │   ├── core/  # Core chat components
│   │   │   ├── features/ # Feature components
│   │   │   └── ui/    # Reusable UI components
│   │   ├── common/    # Shared components
│   │   └── layout/    # Layout components
│   ├── services/      # API and service layer
│   │   ├── api/       # API services
│   │   └── realtime/  # Real-time services
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── styles/        # Global styles
│   ├── assets/        # Static assets
│   └── App.jsx        # Root component
├── public/            # Static files
└── index.html         # Entry point
```

### Core Components

#### App Entry
`src/App.jsx` - Application root component
```jsx
function App() {
    return (
        <SupabaseProvider>
            <ThemeProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/channels" element={<Channels />} />
                        </Routes>
                    </Layout>
                </Router>
            </ThemeProvider>
        </SupabaseProvider>
    );
}
```

## Components

### Component Organization

#### Core Components
- Message handling
- Channel management
- User interactions
- Navigation elements

#### Feature Components
- Message reactions
- Emoji picker
- Thread discussions
- Search functionality

#### UI Components
- Buttons
- Inputs
- Cards
- Modals

### Component Example
```jsx
function ChatMessage({ message, onReaction }) {
    return (
        <div className="flex gap-3 p-4 hover:bg-alice-blue dark:hover:bg-dark-bg-secondary">
            <Avatar src={message.user.avatar_url} />
            <div className="flex-1">
                <MessageHeader user={message.user} timestamp={message.created_at} />
                <MessageContent content={message.content} />
                <MessageReactions messageId={message.id} reactions={message.reactions} />
            </div>
        </div>
    );
}
```

## State Management

### Local State
```javascript
// Component state
const [messages, setMessages] = useState([]);
const [isLoading, setIsLoading] = useState(false);

// Refs for DOM interactions
const scrollRef = useRef(null);
```

### Context
```javascript
// Theme context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
```

### Custom Hooks
```javascript
// Message loading hook
function useMessages(channelId) {
    const [messages, setMessages] = useState([]);
    
    useEffect(() => {
        const loadMessages = async () => {
            const data = await messageService.getMessages(channelId);
            setMessages(data);
        };
        
        loadMessages();
    }, [channelId]);
    
    return messages;
}
```

## Styling

### TailwindCSS Configuration
`tailwind.config.js`:
```javascript
module.exports = {
    theme: {
        extend: {
            colors: {
                'gunmetal': '#272D2D',
                'rose-quartz': '#A39BA8',
                'emerald': '#23CE6B',
                'alice-blue': '#EDF5FC'
            }
        }
    }
};
```

### Dark Mode Support
```jsx
<div className={`
    bg-white dark:bg-dark-bg-primary
    text-gunmetal dark:text-dark-text-primary
    border-powder-blue dark:border-dark-border
`}>
    {/* Component content */}
</div>
```

### Animation Classes
```css
@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

.animate-slide-in {
    animation: slideIn 200ms ease-out;
}
```

## Performance

### Code Splitting
```javascript
// Lazy load components
const Chat = lazy(() => import('./components/chat/Chat'));
const Settings = lazy(() => import('./components/settings/Settings'));
```

### Memoization
```javascript
// Memoize expensive computations
const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
}, [messages]);

// Memoize components
const MemoizedMessage = memo(ChatMessage);
```

### Virtual Scrolling
```jsx
<VirtualList
    data={messages}
    height={600}
    itemHeight={80}
    renderItem={({ item }) => (
        <ChatMessage message={item} />
    )}
/>
```

## Best Practices

### Component Design
- Keep components focused
- Use proper prop types
- Implement error boundaries
- Handle loading states
- Follow composition pattern

### Performance
```javascript
// Use proper dependencies in hooks
useEffect(() => {
    // Effect logic
}, [dependency1, dependency2]);

// Implement proper cleanup
useEffect(() => {
    const subscription = subscribe();
    return () => subscription.unsubscribe();
}, []);
```

### Accessibility
```jsx
// Use semantic HTML
<button
    aria-label="Send message"
    role="button"
    onClick={handleSend}
>
    Send
</button>

// Handle keyboard navigation
<div onKeyDown={handleKeyDown} tabIndex={0}>
    {/* Interactive content */}
</div>
```

### Error Handling
```jsx
class ErrorBoundary extends React.Component {
    state = { hasError: false };
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}
```

### Testing
```javascript
// Component test example
describe('ChatMessage', () => {
    it('renders message content', () => {
        render(<ChatMessage message={mockMessage} />);
        expect(screen.getByText(mockMessage.content)).toBeInTheDocument();
    });
});
``` 