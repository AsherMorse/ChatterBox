# ChatterBox Client

A comprehensive guide to the client-side application configuration, setup, and development workflow.

## Table of Contents

- [Setup & Configuration](#setup--configuration)
  - [Dependencies](#dependencies)
  - [Environment Variables](#environment-variables)
  - [Build Tools](#build-tools)
- [Development](#development)
  - [Scripts](#scripts)
  - [Code Style](#code-style)
- [Styling](#styling)
  - [Tailwind Configuration](#tailwind-configuration)
  - [Theme System](#theme-system)
  - [Animations](#animations)

## Setup & Configuration

### Dependencies

#### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM bindings |
| `react-router-dom` | ^7.1.1 | Routing |
| `@supabase/supabase-js` | ^2.47.10 | Backend integration |
| `axios` | ^1.7.9 | HTTP client |

#### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^6.0.5 | Build tool |
| `@vitejs/plugin-react` | ^4.3.4 | React plugin for Vite |
| `tailwindcss` | ^3.4.17 | CSS framework |
| `eslint` | ^9.17.0 | Code linting |
| `postcss` | ^8.4.49 | CSS processing |

### Environment Variables

Required environment variables for the application:

```plaintext
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Environment files:
- `.env` - Local development
- `.env.production` - Production settings
- `.env.example` - Template for required variables

### Build Tools

#### Vite Configuration
`vite.config.js`

```javascript
export default {
  plugins: [react()],
  server: {
    port: 3000
  }
}
```

#### PostCSS Configuration
`postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

## Development

### Scripts

Available npm scripts:

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start development server |
| `build` | `vite build` | Build for production |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Run linter |

### Code Style

ESLint configuration enforces:
- React best practices
- Hook rules
- Modern JavaScript features
- Consistent formatting

## Styling

### Tailwind Configuration

#### Colors
| Name | Value | Usage |
|------|--------|--------|
| `gunmetal` | `#272D2D` | Primary text |
| `rose-quartz` | `#A39BA8` | Secondary text |
| `powder-blue` | `#B8C5D6` | Borders |
| `alice-blue` | `#EDF5FC` | Backgrounds |
| `emerald` | `#23CE6B` | Accents |

#### Dark Mode Colors
| Name | Value | Usage |
|------|--------|--------|
| `dark-bg-primary` | `#1A1D1D` | Primary background |
| `dark-bg-secondary` | `#222626` | Secondary background |
| `dark-text-primary` | `#EDF5FC` | Primary text |
| `dark-text-secondary` | `#B8C5D6` | Secondary text |
| `dark-border` | `#374151` | Borders |

### Theme System

Dark mode implementation:
- Uses Tailwind's `darkMode: 'class'`
- Toggles `dark` class on `documentElement`
- Persists preference in localStorage

### Animations

Custom animations defined in Tailwind config:

| Name | Purpose | Duration |
|------|---------|----------|
| `fadeIn` | Fade in elements | 0.5s |
| `fadeOut` | Fade out elements | 0.3s |
| `slideUp` | Slide up entrance | 0.15s |
| `scale` | Scale entrance | 0.3s |
| `typingIndicator` | Typing animation | 0.3s |

#### Usage Example
```jsx
<div className="animate-fadeIn">
  Fading content
</div>
```

## Best Practices

### Performance
- Use production builds for deployment
- Enable code splitting
- Implement lazy loading
- Optimize asset sizes

### Security
- Never commit environment files
- Use environment variables for sensitive data
- Implement proper CORS settings
- Validate all user inputs

### Development Workflow
- Follow Git branching strategy
- Run linter before commits
- Test in both light and dark themes
- Keep dependencies updated 