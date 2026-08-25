'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, QrCode, Copy, Check, Loader2,
  Shield, Lock, ChevronLeft, CheckCircle2, Sparkles, Clock,
} from 'lucide-react';
import { generatePixQrCode, generatePixPayload, getPixKey } from '@/lib/pix';
import { apiFetch, ApiError } from '@/lib/api';

/* ── Types ── */
type PlanTier = 'SAMURAI' | 'SENSEI';
type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'pix' | 'card';
type PaymentStatus = 'form' | 'processing' | 'success' | 'error';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanTier;
  billing: BillingCycle;
  onPaymentSuccess?: () => void;
}

/* ── Plan Config ── */
const PLANS = {
  SAMURAI: {
    name: 'Samurai Pro',
    icon: '🥋',
    monthly: 19.90,
    annual: 199.00,
    color: 'amber',
    btnGradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
  },
  SENSEI: {
    name: 'Sensei Premium',
    icon: '🧠',
    monthly: 34.90,
    annual: 349.00,
    color: 'violet',
    btnGradient: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
  },
} as const;

/* ── Component ── */
export function PaymentModal({
  isOpen,
  onClose,
  plan,
  billing,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<PaymentStatus>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const planConfig = PLANS[plan];
  const amount = billing === 'monthly' ? planConfig.monthly : planConfig.annual;
  const periodLabel = billing === 'monthly' ? '/mês' : '/ano';
  const pixKey = getPixKey();

  // Pre-compute PIX payload (synchronous, no effect needed)
  const pixPayloadStr = useMemo(() => generatePixPayload({
    pixKey,
    merchantName: 'STUDY AI',
    merchantCity: 'SAO PAULO',
    amount,
    description: `Plano ${planConfig.name} ${billing === 'monthly' ? 'Mensal' : 'Anual'}`,
  }), [pixKey, amount, planConfig.name, billing]);

  // Generate PIX QR code asynchronously
  useEffect(() => {
    if (isOpen && method === 'pix') {
      let cancelled = false;
      generatePixQrCode({
        pixKey,
        merchantName: 'STUDY AI',
        merchantCity: 'SAO PAULO',
        amount,
        description: `Plano ${planConfig.name} ${billing === 'monthly' ? 'Mensal' : 'Anual'}`,
      }).then((url) => {
        if (!cancelled) setQrCodeUrl(url);
      }).catch(console.error);
      return () => { cancelled = true; };
    }
  }, [isOpen, method, amount, plan, billing, pixKey, planConfig.name]);

  // (Form resets are handled by parent re-mounting via key)

  const copyPixPayload = useCallback(async () => {
    if (!pixPayloadStr) return;
    try {
      await navigator.clipboard.writeText(pixPayloadStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = pixPayloadStr;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [pixPayloadStr]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isCardValid = useMemo(() => {
    const num = cardNumber.replace(/\D/g, '');
    const exp = cardExpiry.replace(/\D/g, '');
    return (
      cardName.trim().length >= 3 &&
      num.length === 16 &&
      exp.length === 4 &&
      cardCvv.replace(/\D/g, '').length >= 3
    );
  }, [cardName, cardNumber, cardExpiry, cardCvv]);

  const handleCardSubmit = async () => {
    if (!isCardValid) return;
    setStatus('processing');
    setErrorMsg('');

    try {
      const data = await apiFetch('/api/payment/confirm', {
        method: 'POST',
        body: JSON.stringify({
          plan,
          billing,
          method: 'card',
          lastFour: cardNumber.replace(/\D/g, '').slice(-4),
        }),
      });

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Erro ao processar pagamento');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setStatus('error');
      setErrorMsg('Erro de conexão. Tente novamente.');
    }
  };

  const handlePixConfirm = async () => {
    setStatus('processing');
    setErrorMsg('');

    try {
      const data = await apiFetch('/api/payment/confirm', {
        method: 'POST',
        body: JSON.stringify({ plan, billing, method: 'pix' }),
      });

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Erro ao processar pagamento');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.isSessionExpired) return;
      setStatus('error');
      setErrorMsg('Erro de conexão. Tente novamente.');
    }
  };

  const handleSuccess = () => {
    onPaymentSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center overflow-y-auto sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={status === 'form' ? onClose : undefined} />

          <motion.div
            className="relative z-10 w-full max-w-md max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto mb-0 sm:mb-8 rounded-t-2xl sm:rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)]"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── SUCCESS STATE ── */}
            {status === 'success' ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15"
                >
                  <CheckCircle2 size={40} className="text-green-500" />
                </motion.div>
                <h2 className="font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                  Pagamento confirmado!
                </h2>
                <p className="mt-2 text-sm text-[var(--ws-text-secondary)]">
                  Seu plano {planConfig.name} está ativo. Aproveite!
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500">
                  <Sparkles size={14} />
                  7 dias grátis para testar
                </div>
                <button
                  onClick={handleSuccess}
                  className={`mt-8 w-full rounded-ws-button px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r ${planConfig.btnGradient} transition-all duration-200`}
                >
                  Começar agora
                </button>
              </div>
            ) : (
              <>
                {/* Close button */}
                <button
                  onClick={onClose}
                  disabled={status !== 'form'}
                  className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ws-glass)] p-2 text-[var(--ws-text-tertiary)] shadow-lg transition-colors hover:text-[var(--ws-text-primary)] disabled:opacity-50 min-h-[44px] min-w-[44px]"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>

                <div className="p-5 sm:p-8">
                  {/* Header with plan info */}
                  <div className="mb-6">
                    <button
                      onClick={onClose}
                      className="mb-3 flex items-center gap-1 text-xs text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-text-secondary)]"
                    >
                      <ChevronLeft size={14} />
                      Voltar
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{planConfig.icon}</span>
                      <div>
                        <h2 className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">
                          Finalizar pagamento
                        </h2>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`font-serif-jp text-2xl font-bold ${
                            plan === 'SENSEI' ? 'text-violet-500' : 'text-amber-500'
                          }`}>
                            R$ {amount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-sm text-[var(--ws-text-tertiary)]">{periodLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trial badge */}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500">
                      <Clock size={12} />
                      7 dias grátis para testar
                    </div>
                  </div>

                  {/* ── PROCESSING STATE ── */}
                  {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-4 py-10">
                      <Loader2 size={40} className="animate-spin text-[var(--ws-accent)]" />
                      <div className="text-center">
                        <p className="font-medium text-[var(--ws-text-primary)]">
                          {method === 'pix' ? 'Confirmando pagamento PIX...' : 'Processando cartão...'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ws-text-tertiary)]">
                          Aguarde um momento
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── Payment Method Tabs ── */}
                      <div className="mb-6 flex rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-1">
                        <button
                          onClick={() => setMethod('pix')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-ws-button px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                            method === 'pix'
                              ? 'bg-[var(--ws-bg)] text-[var(--ws-text-primary)] shadow-sm'
                              : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
                          }`}
                        >
                          <QrCode size={16} />
                          PIX
                        </button>
                        <button
                          onClick={() => setMethod('card')}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-ws-button px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                            method === 'card'
                              ? 'bg-[var(--ws-bg)] text-[var(--ws-text-primary)] shadow-sm'
                              : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]'
                          }`}
                        >
                          <CreditCard size={16} />
                          Cartão
                        </button>
                      </div>

                      {/* ── PIX Payment ── */}
                      <AnimatePresence mode="wait">
                        {method === 'pix' && (
                          <motion.div
                            key="pix"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-5">
                              {/* QR Code */}
                              <div className="flex justify-center">
                                <div className="rounded-xl border-2 border-[var(--ws-glass-border)] bg-white p-3">
                                  {qrCodeUrl ? (
                                    <img
                                      src={qrCodeUrl}
                                      alt="QR Code PIX"
                                      className="h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]"
                                    />
                                  ) : (
                                    <div className="flex h-[200px] w-[200px] items-center justify-center">
                                      <Loader2 size={24} className="animate-spin text-[var(--ws-text-tertiary)]" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* PIX Key display */}
                              <div className="mt-4 rounded-ws-button bg-[var(--ws-bg)] p-3">
                                <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--ws-text-tertiary)]">
                                  Chave PIX
                                </p>
                                <p className="text-center text-sm font-mono text-[var(--ws-text-primary)]">
                                  {pixKey}
                                </p>
                              </div>

                              {/* Copy & Pay buttons */}
                              <div className="mt-4 space-y-3">
                                <button
                                  onClick={copyPixPayload}
                                  className="flex w-full items-center justify-center gap-2 rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm font-medium text-[var(--ws-text-primary)] transition-all hover:bg-[var(--ws-glass)]/80 min-h-[44px]"
                                >
                                  {copied ? (
                                    <>
                                      <Check size={16} className="text-green-500" />
                                      <span className="text-green-500">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={16} />
                                      Copiar código PIX
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={handlePixConfirm}
                                  className={`w-full rounded-ws-button px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r ${planConfig.btnGradient} transition-all duration-200 min-h-[44px]`}
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Já realizei o pagamento PIX
                                  </span>
                                </button>
                              </div>

                              <p className="mt-3 text-center text-[10px] text-[var(--ws-text-tertiary)]">
                                Após pagar, clique no botão acima para ativar seu plano
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* ── Card Payment ── */}
                        {method === 'card' && (
                          <motion.div
                            key="card"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-5">
                              {/* Card visual */}
                              <div className={`mb-5 rounded-xl bg-gradient-to-br ${
                                plan === 'SENSEI'
                                  ? 'from-violet-600 to-purple-800'
                                  : 'from-amber-600 to-orange-800'
                              } p-5 text-white shadow-lg`}
                              >
                                <div className="mb-8 flex items-center justify-between">
                                  <div className="h-8 w-10 rounded bg-yellow-400/20" />
                                  <span className="text-xs font-medium opacity-80">CREDIT</span>
                                </div>
                                <p className={`font-mono text-lg tracking-wider ${
                                  cardNumber ? 'opacity-100' : 'opacity-50'
                                }`}>
                                  {cardNumber || '•••• •••• •••• ••••'}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-[9px] uppercase opacity-60">Titular</p>
                                    <p className={`text-xs font-medium ${cardName ? 'opacity-100' : 'opacity-40'}`}>
                                      {cardName || 'NOME NO CARTÃO'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase opacity-60">Validade</p>
                                    <p className={`text-xs font-medium ${cardExpiry ? 'opacity-100' : 'opacity-40'}`}>
                                      {cardExpiry || 'MM/AA'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Card form */}
                              <div className="space-y-4">
                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-[var(--ws-text-secondary)]">
                                    Número do cartão
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm font-mono text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-[var(--ws-text-secondary)]">
                                    Nome no cartão
                                  </label>
                                  <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                    placeholder="NOME COMPLETO"
                                    className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--ws-text-secondary)]">
                                      Validade
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={cardExpiry}
                                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                      placeholder="MM/AA"
                                      className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm font-mono text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--ws-text-secondary)]">
                                      CVV
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={cardCvv}
                                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      placeholder="•••"
                                      className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-4 py-3 text-sm font-mono text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={handleCardSubmit}
                                  disabled={!isCardValid}
                                  className={`w-full rounded-ws-button px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r ${planConfig.btnGradient} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    <Lock size={14} />
                                    Pagar R$ {amount.toFixed(2).replace('.', ',')}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Error */}
                      {status === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 flex items-center gap-2 rounded-ws-button bg-red-500/10 px-4 py-3 text-sm text-red-400"
                        >
                          {errorMsg}
                        </motion.div>
                      )}

                      {/* Security footer */}
                      <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[var(--ws-text-tertiary)]">
                          <Shield size={12} />
                          <Lock size={12} />
                          <span className="text-[10px]">Pagamento 100% seguro</span>
                        </div>
                        <p className="text-center text-[10px] text-[var(--ws-text-tertiary)]">
                          Seus dados são protegidos com criptografia de ponta a ponta
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
