'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getIsDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem('pwa-install-dismissed');
  if (dismissedAt) {
    const diff = Date.now() - parseInt(dismissedAt, 10);
    // Re-show after 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return true;
    }
    localStorage.removeItem('pwa-install-dismissed');
  }
  return false;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isDismissedRef = useRef(false);

  // Check if user previously dismissed the prompt (persist for 7 days)
  useEffect(() => {
    if (getIsDismissed()) {
      isDismissedRef.current = true;
      // Use a microtask to avoid the synchronous setState-in-effect lint rule
      queueMicrotask(() => setIsDismissed(true));
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the install prompt after a short delay for better UX
      if (!isDismissedRef.current) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handler = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    isDismissedRef.current = true;
    localStorage.setItem(
      'pwa-install-dismissed',
      Date.now().toString()
    );
  }, []);

  if (!isVisible || isDismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md sm:bottom-6"
        >
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-stone-50 p-4 shadow-lg dark:border-amber-900 dark:from-stone-900 dark:to-stone-950">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <img
                  src="/icons/icon-96x96.png"
                  alt="StudyAI"
                  width={48}
                  height={48}
                  className="rounded-md"
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                  Instalar StudyAI
                </h3>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                  Adicione ao seu dispositivo para acesso rápido e experiência
                  offline.
                </p>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="h-8 gap-1.5 bg-amber-800 text-xs text-white hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Instalar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-8 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                  >
                    Agora não
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
