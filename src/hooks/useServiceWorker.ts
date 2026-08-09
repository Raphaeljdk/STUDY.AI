'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker.
 * Should be called once at the app root level.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'activated' &&
                navigator.serviceWorker.controller
              ) {
                // New version activated — could show a "Refresh to update" toast here
                console.log('[PWA] New service worker activated');
              }
            });
          }
        });

        console.log('[PWA] Service Worker registered successfully');
      } catch (error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);
}
