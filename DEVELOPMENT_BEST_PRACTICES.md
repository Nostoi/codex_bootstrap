# Development Best Practices Guide

This document outlines the coding standards and best practices for the Codex Bootstrap project.

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + DaisyUI
- **Testing**: Vitest + Playwright + Testing Library
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Web Vitals monitoring

### Backend

- **Framework**: NestJS
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest + Supertest
- **Security**: Rate limiting, input validation, audit logging

## 📏 Code Standards

### TypeScript Configuration

- ✅ **Strict mode enabled** for both frontend and backend
- ✅ **No implicit any** - all types must be explicit
- ✅ **Strict null checks** - handle undefined/null safely
- ✅ **Force consistent casing** in file names

### ESLint Rules

- ✅ **@typescript-eslint/recommended** extended
- ✅ **No unused variables** (except prefixed with `_`)
- ✅ **Explicit return types** for public APIs
- ⚠️ **Any types** are warnings, not errors (use sparingly)

### Code Formatting

- ✅ **Prettier** configuration provided
- ✅ **2-space indentation**
- ✅ **Single quotes** for strings
- ✅ **Trailing commas** where valid
- ✅ **100 character line limit**

## 🎯 React Best Practices

### Component Design

```tsx
// ✅ Good: Proper TypeScript interfaces
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  // Component implementation
};
```

### Performance Optimization

```tsx
// ✅ Good: Memoized context values
const contextValue = useMemo(
  () => ({
    data,
    actions: {
      updateData,
      clearData,
    },
  }),
  [data, updateData, clearData]
);

// ✅ Good: Memoized callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Error Handling

```tsx
// ✅ Good: Error boundaries for feature isolation
<FeatureErrorBoundary fallback={<FeatureFallback />}>
  <ExpensiveFeature />
</FeatureErrorBoundary>
```

## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance

- ✅ **Semantic HTML** - use proper elements
- ✅ **ARIA labels** - for complex interactions
- ✅ **Color contrast** - minimum 4.5:1 ratio
- ✅ **Keyboard navigation** - full functionality
- ✅ **Screen reader** - announcements and descriptions

### ADHD-Specific Considerations

- ✅ **Auto-dismiss notifications** after 10 seconds
- ✅ **Performance warnings** for slow interactions
- ✅ **Cognitive load indicators** for complex tasks
- ✅ **Focus management** in modals and overlays

## 🧪 Testing Standards

### Unit Tests

- ✅ **Vitest** for frontend unit tests
- ✅ **Jest** for backend unit tests
- ✅ **Testing Library** for component testing
- ✅ **80%+ coverage** target for critical paths

### Integration Tests

- ✅ **API integration** tests with Supertest
- ✅ **Database integration** with test containers
- ✅ **Service interaction** validation

### E2E Tests

- ✅ **Playwright** for end-to-end testing
- ✅ **Accessibility testing** in all flows
- ✅ **Cross-browser** validation
- ✅ **Performance budget** enforcement

## 🔒 Security Practices

### Input Validation

```typescript
// ✅ Good: Strict validation with class-validator
class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}
```

### Authentication & Authorization

- ✅ **JWT tokens** with refresh rotation
- ✅ **Rate limiting** on API endpoints
- ✅ **Input sanitization** for all user data
- ✅ **Audit logging** for security events

## 📊 Performance Monitoring

### Web Vitals Tracking

- ✅ **LCP** < 2.5s (Largest Contentful Paint)
- ✅ **FID** < 100ms (First Input Delay)
- ✅ **CLS** < 0.1 (Cumulative Layout Shift)

### Bundle Size Limits

- ✅ **Initial bundle** < 500KB
- ✅ **Total bundle** < 2MB
- ✅ **Code splitting** for routes and features

## 🚀 Development Workflow

### Git Practices

```bash
# ✅ Good: Conventional commit messages
git commit -m "feat(auth): add OAuth2 integration"
git commit -m "fix(ui): resolve button focus styles"
git commit -m "docs(api): update authentication endpoints"
```

### Code Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Test coverage for new features
- [ ] Accessibility considerations addressed
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Documentation updated

### Pre-commit Hooks

```bash
# Recommended setup
npm install --save-dev husky lint-staged

# .husky/pre-commit
npx lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,ts,tsx}": ["vitest related --run"]
  }
}
```

## 📱 Responsive Design

### Breakpoints (Tailwind)

```css
/* Mobile first approach */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */
```

### Design Tokens

```typescript
// ✅ Good: Consistent design system
export const designTokens = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
} as const;
```

## 🎨 UI Component Guidelines

### Component Structure

```
components/
├── ui/           # Basic UI components
├── forms/        # Form-specific components
├── layout/       # Layout components
├── features/     # Feature-specific components
└── pages/        # Page-specific components
```

### Storybook Documentation

- ✅ **Stories** for all UI components
- ✅ **Controls** for interactive props
- ✅ **Accessibility** addon enabled
- ✅ **Design tokens** documented

This guide ensures consistent, maintainable, and accessible code across the entire project.
