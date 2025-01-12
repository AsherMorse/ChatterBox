# ChatterBox Design System

A comprehensive guide to our design language, component patterns, and visual standards.

## Table of Contents

- [Colors](#colors)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Animations](#animations)
- [Dark Mode](#dark-mode)
- [Icons](#icons)
- [Best Practices](#best-practices)

## Colors

### Primary Colors
| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|--------|
| Primary | `#23CE6B` (emerald) | `#23CE6B` | Primary actions, highlights |
| Secondary | `#A39BA8` (rose-quartz) | `#A39BA8` | Secondary text, icons |
| Text | `#272D2D` (gunmetal) | `#FFFFFF` | Primary text |

### Background Colors
| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|--------|
| Background | `#FFFFFF` | `#1A1D1D` | Main background |
| Surface | `#EDF5FC` (alice-blue) | `#2A2D30` | Cards, elevated surfaces |
| Hover | `#F5F9FC` | `#2F3136` | Hover states |

### Semantic Colors
| Name | Color | Usage |
|------|-------|--------|
| Success | `#23CE6B` | Success states |
| Error | `#FF4D4D` | Error states |
| Warning | `#FFB84D` | Warning states |
| Info | `#4D9EFF` | Information states |

## Typography

### Font Family
```css
--font-primary: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Font Sizes
| Name | Size | Line Height | Usage |
|------|------|-------------|--------|
| xs | 0.75rem | 1rem | Small labels |
| sm | 0.875rem | 1.25rem | Secondary text |
| base | 1rem | 1.5rem | Body text |
| lg | 1.125rem | 1.75rem | Subtitles |
| xl | 1.25rem | 1.75rem | Titles |
| 2xl | 1.5rem | 2rem | Section headers |
| 3xl | 1.875rem | 2.25rem | Main headers |

### Font Weights
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing

### Scale
| Name | Size | Usage |
|------|------|--------|
| xs | 0.25rem (4px) | Minimal spacing |
| sm | 0.5rem (8px) | Tight spacing |
| base | 1rem (16px) | Default spacing |
| lg | 1.5rem (24px) | Component spacing |
| xl | 2rem (32px) | Section spacing |
| 2xl | 3rem (48px) | Large gaps |

### Layout
```css
--container-width: 1280px;
--sidebar-width: 280px;
--header-height: 64px;
```

## Components

### Buttons

#### Primary Button
```jsx
<button className="
    px-4 py-2 rounded-xl
    bg-emerald hover:bg-emerald/90
    text-white font-semibold
    transition-colors duration-200
">
    Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="
    px-4 py-2 rounded-xl
    bg-alice-blue hover:bg-powder-blue
    dark:bg-dark-bg-secondary dark:hover:bg-dark-bg-primary
    text-gunmetal dark:text-white
    transition-colors duration-200
">
    Secondary Action
</button>
```

### Input Fields
```jsx
<input className="
    w-full px-4 py-2 rounded-xl
    bg-white dark:bg-dark-bg-secondary
    border border-powder-blue dark:border-dark-border
    focus:border-emerald dark:focus:border-emerald
    outline-none
    transition-colors duration-200
"/>
```

### Cards
```jsx
<div className="
    bg-white dark:bg-dark-bg-secondary
    rounded-xl p-4
    border border-powder-blue dark:border-dark-border
    shadow-sm
">
    Card Content
</div>
```

## Animations

### Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### Animation Classes
```css
.animate-fade-in {
    animation: fadeIn var(--transition-base);
}

.animate-slide-in {
    animation: slideIn var(--transition-base);
}

.animate-scale {
    animation: scale var(--transition-fast);
}
```

### Keyframes
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@keyframes scale {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
}
```

## Dark Mode

### Implementation
```javascript
// tailwind.config.js
module.exports = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'dark-bg-primary': '#1A1D1D',
                'dark-bg-secondary': '#2A2D30',
                'dark-text-primary': '#FFFFFF',
                'dark-text-secondary': '#A39BA8',
                'dark-border': '#2F3136'
            }
        }
    }
};
```

### Usage
```jsx
<div className="
    bg-white dark:bg-dark-bg-primary
    text-gunmetal dark:text-dark-text-primary
    border-powder-blue dark:border-dark-border
">
    Content
</div>
```

## Icons

### Usage
```jsx
<svg 
    className="w-5 h-5 text-current"
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
>
    {/* Icon paths */}
</svg>
```

### Common Icons
- Navigation icons
- Action icons
- Status icons
- Social icons

## Best Practices

### Consistency
- Use design tokens consistently
- Follow spacing scale
- Maintain color hierarchy
- Use standard animations

### Accessibility
- Maintain color contrast (WCAG 2.1)
- Use semantic HTML
- Support keyboard navigation
- Provide proper focus states

### Responsive Design
- Mobile-first approach
- Consistent spacing across breakpoints
- Flexible layouts
- Touch-friendly targets

### Performance
- Optimize animations
- Use system fonts
- Minimize layout shifts
- Implement proper loading states 