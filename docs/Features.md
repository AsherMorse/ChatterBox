# ChatterBox Features

A comprehensive guide to the chat features and interactive components in the ChatterBox application.

## Table of Contents

- [Overview](#overview)
- [Message Reactions](#message-reactions)
- [Emoji Picker](#emoji-picker)
- [Thread Sidebar](#thread-sidebar)
- [Search Bar](#search-bar)
- [Best Practices](#best-practices)

## Overview

The ChatterBox features provide:
- Message reaction system
- Emoji selection interface
- Thread-based discussions
- Message search functionality
- Real-time updates

## Message Reactions
`components/chat/features/MessageReactions.jsx` - Message reaction system

### Component Structure
```jsx
<MessageReactions
    messageId="message-123"
    currentUserId="user-456"
/>
```

### Features
- Add/remove reactions
- Real-time updates
- Animated transitions
- User reaction tracking
- Reaction counts

### Implementation
```javascript
function MessageReactions({ messageId, currentUserId }) {
    const [reactions, setReactions] = useState([]);
    
    const handleReactionClick = async (emoji, hasReacted) => {
        try {
            if (hasReacted) {
                await removeReaction(messageId, emoji);
            } else {
                await addReaction(messageId, emoji);
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    };
    
    // ... rest of implementation
}
```

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| messageId | string | ✓ | Message identifier |
| currentUserId | string | ✓ | Current user's ID |

## Emoji Picker
`components/chat/features/EmojiPicker.jsx` - Emoji selection interface

### Component Structure
```jsx
<EmojiPicker
    onSelect={(emoji) => handleEmojiSelect(emoji)}
    onClose={() => setShowPicker(false)}
/>
```

### Features
- Common emoji shortcuts
- Position auto-adjustment
- Click-outside handling
- Dark mode support
- Smooth animations

### Implementation
```javascript
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function EmojiPicker({ onSelect, onClose }) {
    const [position, setPosition] = useState({ top: true, right: true });
    
    useEffect(() => {
        function updatePosition() {
            // Adjust picker position based on viewport
            const rect = pickerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom <= window.innerHeight,
                right: rect.right <= window.innerWidth
            });
        }
        // ... position update logic
    }, []);
    
    // ... rest of implementation
}
```

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onSelect | function | ✓ | Emoji selection handler |
| onClose | function | ✓ | Close picker handler |

## Thread Sidebar
`components/chat/features/ThreadSidebar.jsx` - Thread discussion interface

### Features
- Thread message display
- Real-time updates
- Reply composition
- Thread navigation
- Message context

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| parentMessage | object | ✓ | Original message |
| onClose | function | ✓ | Close thread handler |

## Search Bar
`components/chat/features/SearchBar.jsx` - Message search functionality

### Features
- Real-time search
- Result highlighting
- Search history
- Filter options
- Keyboard navigation

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onSearch | function | ✓ | Search handler |
| placeholder | string | - | Input placeholder |

## Best Practices

### State Management
```javascript
// Use local state for UI interactions
const [showPicker, setShowPicker] = useState(false);

// Use refs for DOM interactions
const containerRef = useRef(null);

// Use callbacks for event handlers
const handleReactionClick = useCallback(async (emoji) => {
    // ... handler implementation
}, [dependencies]);
```

### Animation
```css
/* Smooth transitions */
.animate-fade-in {
    animation: fadeIn 200ms ease-in-out;
}

.animate-slide-in {
    animation: slideIn 200ms ease-in-out;
}
```

### Event Handling
```javascript
// Clean up event listeners
useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);
```

### Performance
- Use proper cleanup in useEffect
- Implement debouncing for search
- Optimize re-renders
- Use proper memoization
- Handle component unmounting

### Accessibility
- Use semantic HTML
- Implement ARIA labels
- Support keyboard navigation
- Provide proper focus management
- Handle screen readers

### Real-time Updates
```javascript
// Subscribe to real-time events
useEffect(() => {
    const handleUpdate = (data) => {
        // Update local state
    };
    
    realtimeService.on('event', handleUpdate);
    return () => realtimeService.off('event', handleUpdate);
}, []);
``` 