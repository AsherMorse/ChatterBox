# Documentation Style Guide

## 1. File Structure & Organization
- Use descriptive, kebab-case filenames for documentation (e.g., `design-system.md`, `api-reference.md`)
- Place documentation in the appropriate subfolder within `docs/`:
  - `architecture/` - System design and infrastructure
  - `features/` - Feature-specific guides
  - `frontend/` - UI/UX and component docs
  - `backend/` - Server and API docs

## 2. Markdown Formatting
- Use ATX-style headers (`#` for h1, `##` for h2, etc.)
- Maximum header depth of 4 levels
- Use ordered lists (`1.`) for sequential steps
- Use unordered lists (`-`) for non-sequential items
- Wrap inline code with single backticks (`)
- Use triple backticks (```) for code blocks with language specification

## 3. Code Documentation
- Use JSDoc for JavaScript/React components:
```javascript
/**
 * @param {Object} props
 * @param {string} props.message - The message content
 * @param {Date} props.timestamp - Message creation time
 * @returns {JSX.Element}
 */
```
- Include example usage in component documentation
- Document props, return values, and side effects
- Add inline comments for complex logic only

## 4. API Documentation
- Use consistent structure for endpoint documentation:
  - HTTP Method
  - Endpoint path
  - Request parameters
  - Response format
  - Example request/response
  - Error codes

## 5. Language & Tone
- Use present tense ("the function returns" not "the function will return")
- Write in active voice
- Be concise but complete
- Use second person ("you") for guides and tutorials
- Maintain professional but approachable tone

## 6. Visual Elements
- Use the established color system from DesignSystem.md for any visual documentation
- Include code examples in appropriate syntax highlighting
- Use tables for structured data
- Add screenshots for UI-related documentation

## 7. Version Control
- Include version numbers for all API documentation
- Note deprecated features with clear migration paths
- Mark experimental features with appropriate warnings

## 8. File Headers
Every documentation file should start with:
```markdown
# [Component/Feature Name]

Brief description (1-2 sentences)

## Table of Contents
```

## 9. Component Documentation Template
```markdown
# [Component Name]

Brief description

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

## Usage Example

## Notes
``` 