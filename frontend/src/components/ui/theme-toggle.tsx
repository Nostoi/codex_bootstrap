'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Theme Toggle Component
 * 
 * Provides an accessible theme switching interface with:
 * - Light/dark/system theme options
 * - Keyboard navigation support
 * - Screen reader announcements
 * - ADHD-friendly visual feedback
 */
export function ThemeToggle() {
  const { setTheme, theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-24 h-10 bg-background-secondary rounded-md animate-pulse" />
    )
  }

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <div className="flex items-center space-x-1 bg-background-secondary rounded-lg p-1 border border-border-primary">
      <ThemeButton
        theme="light"
        currentTheme={currentTheme}
        onClick={() => setTheme('light')}
        icon="☀️"
        label="Light mode"
      />
      <ThemeButton
        theme="dark"
        currentTheme={currentTheme}
        onClick={() => setTheme('dark')}
        icon="🌙"
        label="Dark mode"
      />
      <ThemeButton
        theme="system"
        currentTheme={theme}
        onClick={() => setTheme('system')}
        icon="💻"
        label="System theme"
      />
    </div>
  )
}

interface ThemeButtonProps {
  theme: string
  currentTheme?: string
  onClick: () => void
  icon: string
  label: string
}

function ThemeButton({ theme, currentTheme, onClick, icon, label }: ThemeButtonProps) {
  const isActive = currentTheme === theme
  
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
        min-w-target min-h-target flex items-center justify-center
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus
        hover:bg-background-muted active:scale-95
        ${isActive 
          ? 'bg-interactive-primary text-text-inverse shadow-sm' 
          : 'text-text-secondary hover:text-text-primary'
        }
      `}
      aria-label={label}
      aria-pressed={isActive}
      type="button"
    >
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      
      {/* Active indicator for better visual feedback */}
      {isActive && (
        <span
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
