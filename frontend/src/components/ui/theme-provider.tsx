'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

/**
 * Theme Provider Component
 * 
 * Provides theme context for ADHD-friendly design system with support for:
 * - Light/dark mode switching
 * - System preference detection
 * - Persistent theme selection
 * - Accessibility-first design
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * Theme Provider configuration options:
 * 
 * - attribute="class": Uses class-based theme switching (adds .dark class)
 * - defaultTheme="system": Respects user's OS preference by default
 * - enableSystem: Allows automatic system theme detection
 * - disableTransitionOnChange: Prevents flash of unstyled content during theme switch
 * - themes: Explicitly define available themes for type safety
 */
