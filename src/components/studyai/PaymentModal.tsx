'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

type PlanTier = 'SAMURAI' | 'SENSEI';
type BillingCycle = 'monthly' | 'annual';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanTier;
  billing: BillingCycle;
  onPaymentSuccess?: () => void;
}

const planNames: Record<PlanTier, string> = {
  SAMURAI: 'Samurai',
  SENSEI: 'Sensei',
};

/**
 * Do not request card or PIX details until a trusted, server-verified
 * checkout is connected. The legacy confirmation endpoint is disabled.
 */
export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="presentation"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-unavailable-title"
            className="relative z-10 w-full max-w-md rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-7 shadow-[var(--ws-shadow-medium)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-[var(--ws-text-secondary)] hover:bg-[var(--ws-glass)]"
            >
              <X size={20} />
            </button>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <h2 id="payment-unavailable-title" className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
              Assinaturas em preparação
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ws-text-secondary)]">
              O plano {planNames[plan]} ainda não está disponível para contratação.
              Estamos preparando um checkout seguro com confirmação real de pagamento.
              Nenhum pagamento foi solicitado ou realizado.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-ws-button bg-[var(--ws-glass)] p-3 text-xs text-[var(--ws-text-secondary)]">
              <ShieldCheck size={17} className="shrink-0 text-[var(--ws-verdigris)]" />
              Você pode continuar usando o plano gratuito enquanto o pagamento seguro é configurado.
            </div>
            <button
              type="button"
              onClick={() => { onClose(); window.location.reload(); }}
              className="mt-6 w-full rounded-ws-button bg-[var(--ws-accent)] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Continuar no plano gratuito
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
