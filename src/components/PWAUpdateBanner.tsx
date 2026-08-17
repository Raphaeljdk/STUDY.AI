'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

interface PWAUpdateBannerProps {
  updateAvailable: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

export function PWAUpdateBanner({ updateAvailable, onApply, onDismiss }: PWAUpdateBannerProps) {
  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl border border-[var(--ws-glass-border)] bg-[var(--ws-bg)]/95 p-4 shadow-lg backdrop-blur-xl lg:bottom-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ws-accent)]/10">
              <RefreshCw className="h-5 w-5 text-[var(--ws-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ws-text-primary)]">Nova versão disponível!</p>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Toque para atualizar o aplicativo</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onApply}
                className="rounded-lg bg-[var(--ws-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 active:scale-95"
              >
                Atualizar
              </button>
              <button
                onClick={onDismiss}
                className="rounded-lg p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-text-primary)]"
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
