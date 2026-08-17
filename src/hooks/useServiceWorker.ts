'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Registers the PWA service worker and notifies when an update is available.
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates every 5 minutes
        const checkInterval = setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version is waiting to activate
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Listen for controller change (new SW took over after refresh)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        console.log('[PWA] Service Worker registered successfully');

        return () => clearInterval(checkInterval);
      } catch (error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
