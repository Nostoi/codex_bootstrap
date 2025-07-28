import React from "react";
import "../styles/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral font-sans text-dark min-h-screen">
        {/* TODO: Add <Sidebar /> and <Topbar /> components */}
        <main className="mx-auto max-w-screen-xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
