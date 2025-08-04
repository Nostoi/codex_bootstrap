# Helmsman AI-Augmented Task Management - Documentation

Welcome to the comprehensive documentation for Helmsman, an AI-powered task management system designed with ADHD-friendly principles and accessibility-first design.

## 🎯 Project Overview

Helmsman is an advanced prototype transforming task management with AI-powered assistance and ADHD-optimized design:

### ✅ Core Features (Implemented)

- **Energy-Aware Scheduling**: Intelligent task scheduling algorithm with dual calendar integration
- **Enhanced Task Management**: Comprehensive metadata display with ADHD-friendly visual indicators
- **Calendar Integration**: Complete Google Calendar and Microsoft Outlook synchronization
- **AI Backend Services**: OpenAI integration for task extraction and classification
- **Accessibility-First Design**: WCAG 2.2 AA compliant with screen reader support

### 🔄 In Development

- **Frontend-Backend AI Integration**: Connecting UI components to real AI services
- **Real-time Features**: WebSocket integration for live updates
- **User Authentication**: OAuth2 implementation for secure access

### 📋 Current Status

**Development**: 85% - Core functionality implemented  
**Integration**: 60% - Some services connected, others use mock data  
**Production Ready**: 30% - Missing deployment and authentication infrastructure

## 📚 Documentation Structure

### 🧩 [Component Library](./components/README.md)

- Component API documentation with TypeScript interfaces
- Usage examples and code snippets
- Storybook integration and interactive demos
- Best practices for component composition

### ♿ [Accessibility Guidelines](./accessibility/)

- [ADHD-Specific Design Principles](./accessibility/ADHD-guidelines.md)
- [WCAG 2.2 AA Compliance](./accessibility/wcag-compliance.md)
- Keyboard navigation patterns
- Screen reader compatibility
- Testing procedures and checklists

### 🛠️ [Development Guide](./development/)

- [Getting Started](./development/getting-started.md)
- Architecture overview
- API documentation
- Testing strategies
- Deployment procedures

### 🎨 [Design System](./design-system/)

- [Design Tokens](./design-system/tokens.md)
- Color palettes and typography
- Spacing and layout principles
- Component patterns and variants

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd codex_bootstrap
pnpm install

# Start development servers
pnpm dev:backend  # NestJS backend on port 3001
pnpm dev:frontend # Next.js frontend on port 3000

# View Storybook
pnpm storybook    # Component library on port 6006
```

## 🧠 ADHD-Friendly Design Principles

Helmsman is built with neurodiversity in mind, specifically optimizing for ADHD users:

### Core Principles

1. **Minimal Cognitive Load**: Clear visual hierarchy, progressive disclosure
2. **Predictable Interactions**: Consistent patterns across components
3. **Fast Performance**: <2.5s load times to prevent task abandonment
4. **Clear Visual Feedback**: Obvious loading states and interaction results
5. **Reduced Motion Sensitivity**: Respect for `prefers-reduced-motion`

### Visual Design

- **Energy Level Color Coding**: High (green), Medium (amber), Low (indigo)
- **Priority Indicators**: Visual weight and border styling
- **Consistent Spacing**: 8px grid system for predictable layouts
- **High Contrast**: WCAG 2.2 AA compliance with 4.5:1 minimum ratios

## 🔧 Technical Stack

### Backend

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4 with structured outputs
- **Calendar APIs**: Google Calendar and Microsoft Graph
- **Authentication**: OAuth 2.0 for third-party integrations

### Frontend

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Component Library**: Custom components with Storybook
- **State Management**: React Query for server state, Zustand for client state
- **Testing**: Jest, Playwright, and Storybook interaction tests

### Infrastructure

- **Deployment**: Docker containers with Kubernetes
- **Monitoring**: Prometheus metrics with Grafana dashboards
- **Security**: Rate limiting, audit logging, data encryption
- **Performance**: Service workers, code splitting, lazy loading

## 📊 Performance Targets

### Core Web Vitals

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### Bundle Sizes

- **Initial Bundle**: < 500KB
- **Total Application**: < 2MB
- **Critical CSS**: < 50KB

## 🧪 Testing Strategy

### Testing Pyramid

1. **Unit Tests**: Jest with React Testing Library (>80% coverage)
2. **Integration Tests**: API and database integration testing
3. **E2E Tests**: Playwright for critical user journeys
4. **Accessibility Tests**: Automated axe-core testing
5. **Performance Tests**: Lighthouse CI and Web Vitals monitoring

### ADHD-Specific Testing

- Reduced motion preference handling
- High contrast mode compatibility
- Keyboard navigation paths
- Focus management validation
- Cognitive load assessment

## 🌟 Contributing

We welcome contributions that align with our ADHD-friendly design principles:

1. **Follow Accessibility Guidelines**: Ensure WCAG 2.2 AA compliance
2. **Maintain Performance Standards**: Meet Core Web Vitals targets
3. **Respect Cognitive Load**: Keep interfaces simple and predictable
4. **Test Thoroughly**: Include unit, integration, and accessibility tests
5. **Document Changes**: Update relevant documentation

## 📞 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas
- **Documentation**: This site for comprehensive guides
- **Storybook**: Interactive component documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

Built with ❤️ for neurodivergent productivity and inclusive design.
