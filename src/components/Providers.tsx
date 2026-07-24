'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="washi-paper"
        themes={['washi-paper', 'sumi-ink', 'koke-ishi', 'momiji', 'sakura']}
        enableSystem={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
