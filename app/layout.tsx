import React from "react";
import "../styles/globals.css";
import "../frontend/src/styles/accessibility.css";
import { AuthProvider } from "../frontend/src/contexts/AuthContext";
import { WebSocketProvider } from "../frontend/src/contexts/WebSocketContext";
import { TokenRefreshProvider } from "../frontend/src/components/auth/TokenRefreshProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="bg-neutral font-sans text-dark min-h-screen">
        {/* Skip to main content link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <AuthProvider>
          <WebSocketProvider>
            <TokenRefreshProvider>
              {/* Navigation landmark - TODO: Add <Sidebar /> and <Topbar /> components */}
              <nav role="navigation" aria-label="Main navigation">
                {/* Placeholder for navigation - will be added later */}
              </nav>
              
              {/* Main content landmark */}
              <main 
                id="main-content" 
                role="main" 
                className="mx-auto max-w-screen-xl px-4 py-6"
                aria-label="Main content"
              >
                {children}
              </main>
              
              {/* Footer landmark */}
              <footer role="contentinfo" aria-label="Site footer">
                <div className="mx-auto max-w-screen-xl px-4 py-4 text-center text-sm text-gray-600">
                  <p>&copy; 2024 Codex Bootstrap. All rights reserved.</p>
                </div>
              </footer>
            </TokenRefreshProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
