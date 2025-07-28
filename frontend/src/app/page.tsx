import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-background-secondary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold text-text-primary hover:text-interactive-primary transition-colors"
              >
                Codex Bootstrap
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-1">
                <Link 
                  href="/dashboard" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/projects" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
                >
                  Projects
                </Link>
                <Link 
                  href="/reflection" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
                >
                  Reflection
                </Link>
                <Link 
                  href="/settings" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-muted transition-colors"
                >
                  Settings
                </Link>
              </nav>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-comfortable">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary">
            Welcome to Codex Bootstrap
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            An ADHD-friendly project management system built with accessibility-first design, 
            cognitive load reduction, and energy-aware task organization.
          </p>
          
          {/* Energy Level Demonstration */}
          <div className="flex justify-center items-center space-x-6 py-8">
            <div className="flex items-center space-x-2">
              <span className="energy-high text-lg">●</span>
              <span className="text-sm text-text-muted">High Energy</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="energy-medium text-lg">●</span>
              <span className="text-sm text-text-muted">Medium Energy</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="energy-low text-lg">●</span>
              <span className="text-sm text-text-muted">Low Energy</span>
            </div>
          </div>
          
          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <Link 
              href="/dashboard" 
              className="group bg-background-secondary border border-border-primary rounded-lg p-6 hover:border-interactive-primary hover:shadow-md transition-all duration-200 focus-ring"
            >
              <div className="text-center space-comfortable">
                <div className="text-3xl mb-3" aria-hidden="true">📊</div>
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-interactive-primary">
                  Dashboard
                </h2>
                <p className="text-sm text-text-secondary">
                  View your tasks and daily energy planning
                </p>
              </div>
            </Link>

            <Link 
              href="/projects" 
              className="group bg-background-secondary border border-border-primary rounded-lg p-6 hover:border-interactive-primary hover:shadow-md transition-all duration-200 focus-ring"
            >
              <div className="text-center space-comfortable">
                <div className="text-3xl mb-3" aria-hidden="true">🚀</div>
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-interactive-primary">
                  Projects
                </h2>
                <p className="text-sm text-text-secondary">
                  Manage projects with energy-aware organization
                </p>
              </div>
            </Link>

            <Link 
              href="/reflection" 
              className="group bg-background-secondary border border-border-primary rounded-lg p-6 hover:border-interactive-primary hover:shadow-md transition-all duration-200 focus-ring"
            >
              <div className="text-center space-comfortable">
                <div className="text-3xl mb-3" aria-hidden="true">📝</div>
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-interactive-primary">
                  Reflection
                </h2>
                <p className="text-sm text-text-secondary">
                  Journal thoughts with cognitive load reduction
                </p>
              </div>
            </Link>

            <Link 
              href="/settings" 
              className="group bg-background-secondary border border-border-primary rounded-lg p-6 hover:border-interactive-primary hover:shadow-md transition-all duration-200 focus-ring"
            >
              <div className="text-center space-comfortable">
                <div className="text-3xl mb-3" aria-hidden="true">⚙️</div>
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-interactive-primary">
                  Settings
                </h2>
                <p className="text-sm text-text-secondary">
                  Customize accessibility and preferences
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-12">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-6 py-3 bg-interactive-primary hover:bg-interactive-primary-hover text-text-inverse font-medium rounded-lg transition-colors duration-200 focus-ring min-w-target min-h-target"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Design System Demo Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-secondary">
        <div className="max-w-4xl mx-auto text-center space-comfortable">
          <h2 className="text-3xl font-bold text-text-primary">
            ADHD-Friendly Design System
          </h2>
          <p className="text-text-secondary">
            Built with accessibility, cognitive load reduction, and energy management in mind.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="space-comfortable">
              <h3 className="text-lg font-semibold text-text-primary">🧠 Cognitive Load Reduction</h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>• Clear visual hierarchy</li>
                <li>• Generous spacing (1.5x line height)</li>
                <li>• Minimal distractions</li>
                <li>• Predictable navigation</li>
              </ul>
            </div>
            
            <div className="space-comfortable">
              <h3 className="text-lg font-semibold text-text-primary">⚡ Energy Management</h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>• <span className="energy-high">High energy</span> tasks</li>
                <li>• <span className="energy-medium">Medium energy</span> tasks</li>
                <li>• <span className="energy-low">Low energy</span> tasks</li>
                <li>• Smart task scheduling</li>
              </ul>
            </div>
            
            <div className="space-comfortable">
              <h3 className="text-lg font-semibold text-text-primary">♿ Accessibility First</h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li>• WCAG 2.2 AA compliant</li>
                <li>• Motion preference support</li>
                <li>• Keyboard navigation</li>
                <li>• Screen reader friendly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
