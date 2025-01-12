# ChatterBox Utilities

A comprehensive guide to utility functions and helper classes used throughout the ChatterBox application.

## Table of Contents

- [Utility Organization](#utility-organization)
- [Event Management](#event-management)
  - [EventEmitter](#eventemitter)
- [Theme Management](#theme-management)
  - [Theme Utilities](#theme-utilities)
- [Performance](#performance)
  - [Debounce](#debounce)

## Utility Organization

ChatterBox's utility functions are organized in the `utils/` directory and provide common functionality used across the application:

| File | Purpose | Location |
|------|---------|----------|
| `EventEmitter.js` | Event handling and pub/sub functionality | `utils/EventEmitter.js` |
| `theme.js` | Dark/light theme management | `utils/theme.js` |
| `debounce.js` | Performance optimization utilities | `utils/debounce.js` |

## Event Management

### EventEmitter
`utils/EventEmitter.js`

A lightweight event emitter implementation for handling custom events and implementing the publish/subscribe pattern.

#### Methods
| Method | Description | Parameters |
|--------|-------------|------------|
| `on(event, callback)` | Subscribe to an event | `event`: string, `callback`: function |
| `off(event, callback)` | Unsubscribe from an event | `event`: string, `callback`: function |
| `emit(event, ...args)` | Emit an event with optional arguments | `event`: string, `args`: any[] |

#### Usage Example
```javascript
import EventEmitter from '../utils/EventEmitter';

const emitter = new EventEmitter();

// Subscribe to an event
const handleMessage = (message) => {
  console.log('Message received:', message);
};
emitter.on('message', handleMessage);

// Emit an event
emitter.emit('message', 'Hello, world!');

// Unsubscribe from an event
emitter.off('message', handleMessage);
```

## Theme Management

### Theme Utilities
`utils/theme.js`

Utilities for managing the application's dark/light theme preferences.

#### Functions
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `initializeTheme()` | Initialize theme based on saved preference | None | void |
| `toggleTheme(isDark, setIsDark)` | Toggle between dark and light themes | `isDark`: boolean, `setIsDark`: function | void |

#### Usage Example
```javascript
import { initializeTheme, toggleTheme } from '../utils/theme';
import { useState } from 'react';

// Initialize theme on app start
initializeTheme();

// In a component
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  return (
    <button onClick={() => toggleTheme(isDark, setIsDark)}>
      Toggle Theme
    </button>
  );
};
```

#### Theme Storage
- Theme preference is stored in `localStorage` under the key `'theme'`
- Default theme is dark mode
- Theme changes persist across page reloads

## Performance

### Debounce
`utils/debounce.js`

Utility for limiting the rate at which a function can fire.

#### Usage Example
```javascript
import { debounce } from '../utils/debounce';

// Create a debounced function that waits 300ms
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);

// Use in event handler
<input onChange={(e) => debouncedSearch(e.target.value)} />
```

## Best Practices

### Event Handling
- Always clean up event listeners when components unmount
- Use typed events for better maintainability
- Keep event names consistent across the application
- Document event payloads

### Theme Management
- Use CSS variables for theme-dependent values
- Test both light and dark themes
- Ensure sufficient contrast in both themes
- Use semantic color names in code

### Performance Optimization
- Use debounce for frequent events (scroll, resize, input)
- Clean up debounced functions when components unmount
- Consider using throttle for continuous events
- Profile performance impact of utility functions 