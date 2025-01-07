# ChatterBox Design System

## 1. Colors

### Primary Colors
- Primary: `#272D2D` (Gunmetal)
- Primary Light: `#A39BA8` (Rose Quartz)
- Primary Lighter: `#B8C5D6` (Powder Blue)

### Secondary Colors
- Secondary: `#23CE6B` (Emerald)
- Secondary Light: `#4DD88C`
- Secondary Dark: `#1BA557`

### Background Colors
- Background: `#EDF5FC` (Alice Blue)
- Surface: `#FFFFFF`
- Surface Alt: `#F8FAFD`

### Neutral Colors
- Border: `#B8C5D6`
- Text Primary: `#272D2D`
- Text Secondary: `#A39BA8`
- Text Disabled: `#D1D5DB`

### Semantic Colors
- Success: `#23CE6B`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#B8C5D6`

### Gradients
```css
/* Main Gradient */
--gradient-primary: linear-gradient(135deg, #272D2D, #A39BA8);
--gradient-accent: linear-gradient(45deg, #23CE6B, #4DD88C);
--gradient-background: linear-gradient(180deg, #EDF5FC, #FFFFFF);
```

## 2. Typography

### Font Families
- Primary: 'Inter', sans-serif
- Secondary: 'Poppins', sans-serif
- Monospace: 'Fira Code', monospace

### Font Sizes
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## 3. Spacing

### Base Unit: 4px
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)

## 4. Shadows
- sm: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- base: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- md: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- lg: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- xl: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

## 5. Border Radius
- none: 0px
- sm: 0.125rem (2px)
- base: 0.25rem (4px)
- md: 0.375rem (6px)
- lg: 0.5rem (8px)
- xl: 0.75rem (12px)
- 2xl: 1rem (16px)
- full: 9999px

## 6. Animations

### Timing Functions
- Default: cubic-bezier(0.4, 0, 0.2, 1)
- Linear: linear
- In: cubic-bezier(0.4, 0, 1, 1)
- Out: cubic-bezier(0, 0, 0.2, 1)
- In-Out: cubic-bezier(0.4, 0, 0.2, 1)

### Duration
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms
- Slower: 500ms

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale */
@keyframes scale {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## 7. Components

### Buttons
- Height: 2.5rem (40px)
- Padding: 0.75rem 1.5rem
- Border Radius: base (4px)
- Transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)

#### Variants
- Primary
- Secondary
- Outline
- Ghost
- Danger

### Input Fields
- Height: 2.5rem (40px)
- Padding: 0.5rem 0.75rem
- Border: 1px solid border-color
- Border Radius: base (4px)
- Focus Ring: 2px Primary color

### Cards
- Padding: 1.5rem
- Border Radius: lg (8px)
- Background: Surface color
- Shadow: base

### Modal
- Border Radius: lg (8px)
- Background: Surface color
- Shadow: xl
- Max Width: 28rem (448px)

## 8. Layout

### Container
- Max Width: 1280px
- Padding: 1rem
- Margin: auto

### Grid
- Gap: 1rem
- Columns: 12
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### Z-Index Scale
- Base: 0
- Dropdown: 1000
- Sticky: 1100
- Modal Backdrop: 1200
- Modal: 1300
- Popover: 1400
- Tooltip: 1500

## 9. Responsive Design

### Breakpoints
```css
/* Small (sm) */
@media (min-width: 640px) { /* ... */ }

/* Medium (md) */
@media (min-width: 768px) { /* ... */ }

/* Large (lg) */
@media (min-width: 1024px) { /* ... */ }

/* Extra Large (xl) */
@media (min-width: 1280px) { /* ... */ }

/* 2xl */
@media (min-width: 1536px) { /* ... */ }
```

## 10. Best Practices

### Accessibility
- Use semantic HTML elements
- Maintain WCAG 2.1 AA compliance
- Ensure proper color contrast (minimum 4.5:1 for normal text)
- Provide focus indicators
- Support keyboard navigation
- Include ARIA labels where necessary

### Animation Guidelines
- Respect user's reduced motion preferences
- Keep animations under 400ms
- Use appropriate easing functions
- Avoid flashy or distracting animations
- Ensure animations serve a purpose

### Performance
- Optimize images and assets
- Minimize layout shifts
- Use system fonts when possible
- Implement lazy loading
- Cache appropriate resources 