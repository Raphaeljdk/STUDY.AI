'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Check, X, Loader2, Sparkles, Infinity, MessageCircle, Brain, ShieldCheck } from 'lucide-react';
import { ZenButton } from './ZenButton';
import { apiFetch, ApiError } from '@/lib/api';

interface UsageData {
  plan: string;
  isPremium: boolean;
  limits: { chatMessages: number; flashcards: number };
  usage: { chatMessages: number; flashcards: number };
  remaining: { chatMessages: number; flashcards: number };
}

interface PremiumUpgradeProps {
  isOpen: boolean;
  onClose: () => void;
  triggerType?: 'chat' | 'flashcards' | 'nav';
}

export function PremiumUpgrade({ isOpen, onClose, triggerType }: PremiumUpgradeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/checkout', { method: 'POST' });

      if (data.code === 'STRIPE_NOT_CONFIGURED') {
        setError('Pagamento indisponivel no momento. Tente novamente mais tarde.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Nao foi possivel iniciar o pagamento.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const triggerMessages: Record<string, { title: string; desc: string }> = {
    chat: {
      title: 'Limite de mensagens atingido',
      desc: 'Voce usou todas as suas mensagens do dia. Desbloqueie conversas ilimitadas!',
    },
    flashcards: {
      title: 'Limite de flashcards atingido',
      desc: 'Voce usou todas as geracoes de flashcards do dia. Crie ilimitados!',
    },
    nav: {
      title: 'Desbloqueie o poder total do StudyAI',
      desc: 'Estude sem limites com o plano Premium.',
    },
  };

  const msg = triggerMessages[triggerType || 'nav'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-[var(--ws-ink)] to-amber-950/20 px-8 py-8 text-center">
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ws-bg)] to-transparent opacity-30" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
                  <Crown size={32} className="text-amber-500" />
                </div>
                <h2 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">StudyAI Premium</h2>
                <p className="mt-2 text-sm text-[var(--ws-text-secondary)]">Seu estudo, sem limites</p>
              </div>
            </div>

            <div className="p-8">
              {/* Trigger message */}
              <div className="mb-6 rounded-ws-button border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <p className="text-sm font-medium text-amber-400">{msg.title}</p>
                <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">{msg.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-8 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-serif-jp text-4xl font-bold text-[var(--ws-text-primary)]">R$ 14,90</span>
                  <span className="text-sm text-[var(--ws-text-tertiary)]">/mes</span>
                </div>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--ws-verdigris)]">
                  <Sparkles size={12} />
                  7 dias gratis para testar — cancele quando quiser
                </p>
              </div>

              {/* Features comparison */}
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ws-text-tertiary)]">Gratuito</p>
                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-center gap-2 text-[var(--ws-text-secondary)]">
                      <MessageCircle size={14} className="text-[var(--ws-text-tertiary)]" /> 5 mensagens/dia
                    </li>
                    <li className="flex items-center gap-2 text-[var(--ws-text-secondary)]">
                      <Brain size={14} className="text-[var(--ws-text-tertiary)]" /> 3 flashcards/dia
                    </li>
                    <li className="flex items-center gap-2 text-[var(--ws-text-tertiary)]">
                      <X size={14} /> Cadernos ilimitados
                    </li>
                  </ul>
                </div>
                <div className="rounded-ws-button border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500">
                    <Crown size={12} /> Premium
                  </p>
                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-center gap-2 text-[var(--ws-text-primary)]">
                      <Infinity size={14} className="text-amber-500" /> Mensagens ilimitadas
                    </li>
                    <li className="flex items-center gap-2 text-[var(--ws-text-primary)]">
                      <Infinity size={14} className="text-amber-500" /> Flashcards ilimitados
                    </li>
                    <li className="flex items-center gap-2 text-[var(--ws-text-primary)]">
                      <Check size={14} className="text-amber-500" /> Acesso prioritario
                    </li>
                  </ul>
                </div>
              </div>

              {/* All features list */}
              <div className="mb-8 space-y-2.5">
                {[
                  'Conversas ilimitadas com o Sensei AI',
                  'Geracao ilimitada de flashcards com IA',
                  'Revisao espacada inteligente',
                  'Memoria contextual do Sensei',
                  'Suporte prioritario',
                  'Novos recursos em primeira mao',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <ShieldCheck size={16} className="shrink-0 text-amber-500" />
                    <span className="text-[var(--ws-text-secondary)]">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 text-center text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}

              {/* CTA */}
              <ZenButton
                onClick={handleUpgrade}
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap size={16} />
                    Comecar 7 dias gratis
                  </span>
                )}
              </ZenButton>

              <p className="mt-3 text-center text-[10px] text-[var(--ws-text-tertiary)]">
                Pagamento seguro via Stripe. Cancele a qualquer momento.
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-white/10 hover:text-[var(--ws-text-primary)] disabled:opacity-50"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Usage Bar — mostra quanto ainda falta ── */

export function UsageBar({ type, used, limit }: { type: 'chatMessages' | 'flashcards'; used: number; limit: number }) {
  if (!isFinite(limit)) return null; // premium

  const pct = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= 1;
  const label = type === 'chatMessages' ? 'mensagens' : 'flashcards';
  const Icon = type === 'chatMessages' ? MessageCircle : Brain;

  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className={isLow ? 'text-amber-500' : 'text-[var(--ws-text-tertiary)]'} />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] text-[var(--ws-text-tertiary)]">
            {remaining} {label} restante{remaining !== 1 ? 's' : ''} hoje
          </span>
          <span className="text-[11px] text-[var(--ws-text-tertiary)]">
            {used}/{limit}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ws-glass-border)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-500' : 'bg-[var(--ws-accent)]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
