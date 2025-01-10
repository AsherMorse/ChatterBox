# ChatterBox Design System

## Color System

### Core Colors
- Gunmetal `#272D2D`: Primary Color for Text and Key UI Elements
- Rose Quartz `#A39BA8`: Secondary Text and Subtle UI Elements
- Emerald `#23CE6B`: Action Buttons and Interactive Elements

### Background System
- Alice Blue `#EDF5FC`: Light Mode Primary Background
- Surface Alt `#2A2D30`: Dark Mode Surface Variations
- Dark Background Primary `#1A1D1D`: Dark Mode Primary Background
- Dark Background Secondary `#2F3136`: Dark Mode Secondary Background

### Text Colors
- Light Mode:
  - Primary: Gunmetal `#272D2D`
  - Secondary: Rose Quartz `#A39BA8`
  - Interactive: Emerald `#23CE6B`

- Dark Mode:
  - Primary: `#FFFFFF`
  - Secondary: `#A39BA8`
  - Interactive: Emerald `#23CE6B`

### Border Colors
- Light Mode: Powder Blue `#B8C5D6`
- Dark Mode: `#2F3136`

### Interactive States
- Hover Light: Alice Blue `#EDF5FC`
- Hover Dark: Dark Background Primary `#1A1D1D`
- Focus: Emerald `#23CE6B`

## Typography

### Text Styles
- Headers:
  ```css
  text-3xl font-bold text-gunmetal dark:text-dark-text-primary
  ```

- Subheaders:
  ```css
  text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider
  ```

- Body Text:
  ```css
  text-base text-gunmetal dark:text-dark-text-primary
  ```

- Labels:
  ```css
  text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider
  ```

### Font Scale
- XS: 0.75rem
- SM: 0.875rem
- Base: 1rem
- LG: 1.125rem
- XL: 1.25rem
- 2XL: 1.5rem
- 3XL: 1.875rem
- 4XL: 2.25rem

## Component Patterns

### Buttons
```css
/* Primary Button */
px-4 py-3 rounded-xl bg-emerald hover:bg-emerald/90 text-white font-semibold transition-colors duration-200

/* Secondary Button */
px-4 py-3 rounded-xl bg-white dark:bg-dark-bg-secondary hover:bg-alice-blue dark:hover:bg-dark-bg-primary transition-colors duration-200
```

### Input Fields
```css
px-4 py-3 rounded-xl bg-white dark:bg-dark-bg-secondary 
border border-powder-blue dark:border-dark-border 
hover:border-emerald dark:hover:border-emerald 
focus:outline-none focus:border-emerald dark:focus:border-emerald 
text-gunmetal dark:text-dark-text-primary 
placeholder-rose-quartz dark:placeholder-dark-text-secondary 
transition-colors duration-200
```

### Cards
```css
bg-white dark:bg-dark-bg-secondary rounded-xl p-4
border border-powder-blue dark:border-dark-border
```

### Navigation Items
```css
hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl 
text-gunmetal dark:text-dark-text-primary
transition-colors duration-200
```

## Layout & Spacing

### Container Widths
- Form Containers: `max-w-md`
- Content Areas: `max-w-4xl`
- Full Width: `max-w-full`

### Spacing Scale
- XS: 0.25rem (4px)
- SM: 0.5rem (8px)
- Base: 1rem (16px)
- LG: 1.5rem (24px)
- XL: 2rem (32px)
- 2XL: 3rem (48px)

### Border Radius
- Base: `rounded` (4px)
- Medium: `rounded-lg` (8px)
- Large: `rounded-xl` (12px)
- Full: `rounded-full`

## Animations

### Transitions
```css
/* Default Transition */
transition-colors duration-200

/* Scale Transition */
transform transition-all duration-300
```

### Animation Patterns
```css
/* Fade In */
animate-fadeIn

/* Slide Up */
animate-slideUp

/* Scale */
animate-scale
```

## Dark Mode Implementation

### Background Hierarchy
1. Primary: `dark:bg-dark-bg-primary`
2. Secondary: `dark:bg-dark-bg-secondary`
3. Surface: `dark:bg-[#2A2D30]`

### Text Hierarchy
1. Primary: `dark:text-dark-text-primary`
2. Secondary: `dark:text-dark-text-secondary`
3. Interactive: `dark:text-emerald`

### Border Treatment
```css
dark:border-dark-border
dark:hover:border-emerald
dark:focus:border-emerald
```

## Best Practices

### Accessibility
- Maintain Color Contrast Ratios (WCAG 2.1 AA)
- Use Semantic HTML Elements
- Include Proper ARIA Labels
- Support Keyboard Navigation
- Provide Visible Focus States

### Responsive Design
- Mobile-First Approach
- Consistent Spacing Across Breakpoints
- Flexible Layouts Using Flexbox/Grid
- Appropriate Touch Targets (Minimum 44x44px)

### Performance
- Optimize Transitions for 60fps
- Use System Fonts
- Implement Lazy Loading Where Appropriate
- Minimize Layout Shifts

### Component Guidelines
- Consistent Padding and Spacing
- Clear Interactive States
- Predictable Behavior
- Meaningful Animations
- Proper Error Handling 