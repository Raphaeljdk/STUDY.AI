'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop' | 'other';

function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function getIsDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem('pwa-install-dismissed');
  if (dismissedAt) {
    const diff = Date.now() - parseInt(dismissedAt, 10);
    if (diff < 7 * 24 * 60 * 60 * 1000) return true;
    localStorage.removeItem('pwa-install-dismissed');
  }
  return false;
}

function getIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).navigator?.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const isDismissedRef = useRef(false);

  const platform = useMemo(() => getPlatform(), []);
  const isInstalled = useMemo(() => getIsInstalled(), []);
  const isDismissed = useMemo(() => getIsDismissed(), []);

  // Initialize dismissed ref
  useEffect(() => {
    isDismissedRef.current = isDismissed;
  }, [isDismissed]);

  // Don't show if already installed or dismissed
  const isVisible = useMemo(() => {
    return !isInstalled && !isDismissed && showPrompt;
  }, [isInstalled, isDismissed, showPrompt]);

  // Listen for beforeinstallprompt (Chrome/Edge/Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissedRef.current && !getIsInstalled()) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // For iOS: show prompt after a delay
  useEffect(() => {
    if (platform !== 'ios' || isDismissedRef.current || getIsInstalled()) return;
    const timer = setTimeout(() => setShowPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, [platform]);

  // Listen for app installed
  useEffect(() => {
    const handler = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowPrompt(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    isDismissedRef.current = true;
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  if (!isVisible) return null;

  const isIOS = platform === 'ios';

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
          <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-stone-50 shadow-lg dark:border-amber-900 dark:from-stone-900 dark:to-stone-950">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <img
                  src="/icons/icon-96x96.png"
                  alt="StudyAI"
                  width={48}
                  height={48}
                  className="rounded-md"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                  Instalar StudyAI
                </h3>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                  Acesse rápido direto da tela inicial do seu dispositivo.
                </p>
                {!showIOSInstructions && (
                  <div className="mt-3 flex gap-2">
                    {deferredPrompt ? (
                      <Button
                        size="sm"
                        onClick={handleInstall}
                        className="h-8 gap-1.5 bg-amber-800 text-xs text-white hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Instalar
                      </Button>
                    ) : isIOS ? (
                      <Button
                        size="sm"
                        onClick={() => setShowIOSInstructions(true)}
                        className="h-8 gap-1.5 bg-amber-800 text-xs text-white hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
                      >
                        <Apple className="h-3.5 w-3.5" />
                        Como instalar
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="h-8 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                    >
                      Agora não
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-700 dark:hover:text-stone-300"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* iOS install instructions */}
            <AnimatePresence>
              {showIOSInstructions && isIOS && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-amber-200 dark:border-amber-900"
                >
                  <div className="space-y-3 bg-amber-100/50 px-4 py-3 dark:bg-amber-900/20">
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Siga os passos:
                    </p>
                    <ol className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          1
                        </span>
                        <span>Toque no ícone de <strong>compartilhar</strong> <Smartphone className="inline h-3 w-3" /> na barra inferior do Safari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          2
                        </span>
                        <span>Deslize para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          3
                        </span>
                        <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                      </li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/*
 * A compact "Baixar App" button for the sidebar/footer.
 * Only shown when the app is NOT already installed as a PWA.
 */
export function PWAInstallButton({ collapsed = false }: { collapsed?: boolean }) {
  const [hasPrompt, setHasPrompt] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  const isIOS = useMemo(() => getPlatform() === 'ios', []);
  const installed = useMemo(() => getIsInstalled(), []);

  // iOS: always show if not installed; others: wait for beforeinstallprompt
  const canInstall = useMemo(() => {
    if (installed) return false;
    if (isIOS) return true;
    return hasPrompt;
  }, [installed, isIOS, hasPrompt]);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaDeferredPrompt = e;
      setHasPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for appinstalled
  useEffect(() => {
    const handler = () => setHasPrompt(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).__pwaDeferredPrompt as BeforeInstallPromptEvent | undefined;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setCanInstall(false);
      delete (window as any).__pwaDeferredPrompt;
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  };

  if (!canInstall) return null;

  if (showIOSHint) {
    return (
      <div className="space-y-2">
        <p className="px-2 text-center text-[10px] text-[var(--ws-text-tertiary)]">
          Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
        </p>
        <button
          onClick={() => setShowIOSHint(false)}
          className="h-7 w-full text-[10px] text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-text-secondary)]"
        >
          Fechar
        </button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <button
        onClick={handleInstall}
        data-ws-tooltip="Baixar App"
        className="flex w-full items-center justify-center rounded-ws-button px-2 py-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"
        aria-label="Baixar aplicativo"
      >
        <Download size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className="flex w-full items-center gap-2 rounded-ws-button px-3 py-2 text-xs text-[var(--ws-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]"
    >
      <Download size={14} />
      <span>Baixar App</span>
    </button>
  );
}
