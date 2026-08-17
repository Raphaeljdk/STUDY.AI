'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useCallback } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PWAUpdateBanner } from '@/components/PWAUpdateBanner';

function PWAProvider({ children }: { children: ReactNode }) {
  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorker();
  return (
    <>
      {children}
      <PWAInstallPrompt />
      <PWAUpdateBanner
        updateAvailable={updateAvailable}
        onApply={applyUpdate}
        onDismiss={dismissUpdate}
      />
    </>
  );
}

/**
 * Listens for 'session-expired' events dispatched by apiFetch
 * and triggers the auth modal via the global __studyai_openAuth callback.
 */
function SessionExpiredHandler() {
  const handleExpired = useCallback(() => {
    // The page.tsx exposes __studyai_openAuth on window
    (window as any).__studyai_openAuth?.('login');
  }, []);

  useEffect(() => {
    window.addEventListener('session-expired', handleExpired);
    return () => window.removeEventListener('session-expired', handleExpired);
  }, [handleExpired]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="washi-paper"
        themes={['washi-paper', 'sumi-ink', 'koke-ishi', 'momiji', 'sakura']}
        enableSystem={false}
      >
        <SessionExpiredHandler />
        <PWAProvider>{children}</PWAProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
