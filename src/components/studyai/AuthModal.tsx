'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { X, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle, Swords, GraduationCap, Crown } from 'lucide-react';
import { ZenButton } from './ZenButton';
import { apiFetch } from '@/lib/api';

/* ── Plan config for the modal ── */
const MODAL_PLANS = {
  SAMURAI: {
    name: 'Samurai',
    jp: '侍',
    icon: Swords,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    monthly: 'R$ 19,90/mês',
    annual: 'R$ 199,00/ano',
  },
  SENSEI: {
    name: 'Sensei',
    jp: '先生',
    icon: GraduationCap,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    monthly: 'R$ 34,90/mês',
    annual: 'R$ 349,00/ano',
  },
} as const;

type SelectedPlan = 'SAMURAI' | 'SENSEI';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// Global pending plan (set by pricing CTAs before opening modal)
declare global {
  interface Window {
    __studyai_pendingPlan?: SelectedPlan;
    __studyai_pendingBilling?: 'monthly' | 'annual';
  }
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  // Read pending plan from global (set by pricing CTAs)
  const pendingPlan = typeof window !== 'undefined' ? window.__studyai_pendingPlan : undefined;
  const pendingBilling = typeof window !== 'undefined' ? window.__studyai_pendingBilling || 'monthly' : 'monthly';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Plan state for registration with plan
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | undefined>(pendingPlan);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>(pendingBilling);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setStatus('idle');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    window.__studyai_pendingPlan = undefined;
    window.__studyai_pendingBilling = undefined;
    onClose();
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setStatus('error');
        setErrorMsg('Email ou senha incorretos');
      } else if (res?.ok) {
        setStatus('success');
        setSuccessMsg('Login realizado com sucesso!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 600);
      } else {
        setStatus('error');
        setErrorMsg('Nao foi possivel fazer login. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erro de conexao. Verifique sua internet e tente novamente.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Step 1: Create account
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let res: Response;
      try {
        res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ ...form, plan: 'FREE' }),
          signal: controller.signal,
          raw: true,
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setStatus('error');
          setErrorMsg('Servidor demorou demais. Tente novamente.');
        } else {
          setStatus('error');
          setErrorMsg('Erro de conexao. Verifique sua internet e tente novamente.');
        }
        return;
      }
      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await res.json();
      } catch {
        setStatus('error');
        setErrorMsg('Erro ao processar resposta do servidor.');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        const msg = data.error || 'Erro ao criar conta';
        if (res.status === 409) {
          setErrorMsg('Este email ja esta cadastrado. Tente fazer login.');
        } else if (res.status === 400) {
          setErrorMsg(msg);
        } else {
          const details = data.details || '';
          console.error('[Register Error]', res.status, data);
          setErrorMsg(details ? `${msg} (${details})` : msg);
        }
        return;
      }

      // Step 2: Auto-login
      setSuccessMsg('Conta criada! Fazendo login...');
      try {
        const loginRes = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (loginRes?.ok) {
          // Step 3: If plan selected, redirect to checkout
          if (selectedPlan) {
            setSuccessMsg('Redirecionando para o pagamento...');
            try {
              const checkoutRes = await apiFetch('/api/checkout', {
                method: 'POST',
                body: JSON.stringify({
                  plan: selectedPlan,
                  billing: selectedBilling,
                }),
                raw: true,
              });
              const checkoutData = await checkoutRes.json();

              if (checkoutRes.ok && checkoutData.url) {
                // Redirect to Stripe
                window.location.href = checkoutData.url;
                return;
              } else {
                // Checkout failed but account created — go to dashboard
                console.error('[Checkout after register]', checkoutData);
                setSuccessMsg('Conta criada! Redirecionando...');
                setTimeout(() => {
                  onClose();
                  window.location.reload();
                }, 800);
              }
            } catch {
              // Checkout failed but account created
              setSuccessMsg('Conta criada! Redirecionando...');
              setTimeout(() => {
                onClose();
                window.location.reload();
              }, 800);
            }
          } else {
            // No plan selected — go to dashboard
            setSuccessMsg('Bem-vindo(a)! Entrando...');
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 600);
          }
        } else {
          setSuccessMsg('Conta criada! Clique em Entrar para acessar.');
          setTimeout(() => switchMode('login'), 2000);
        }
      } catch {
        setSuccessMsg('Conta criada! Clique em Entrar para acessar.');
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erro de conexao. Verifique sua internet e tente novamente.');
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const planInfo = selectedPlan ? MODAL_PLANS[selectedPlan] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-y-auto sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? handleClose : undefined} />

          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)] max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_8%,transparent)] hover:text-[var(--ws-text-primary)] disabled:opacity-50"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="p-5 sm:p-8">
              {/* Free badge (only when no plan selected) */}
              {!planInfo && (
                <div className="mb-6 flex items-center justify-center gap-2 rounded-ws-button px-3 py-1.5 mx-auto w-fit" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)' }}>
                  <Sparkles size={14} className="text-[var(--ws-verdigris)]" />
                  <span className="text-xs font-medium text-[var(--ws-verdigris)]">100% Gratuito e Ilimitado</span>
                </div>
              )}

              {/* Success State */}
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ws-verdigris)]/15">
                    <CheckCircle2 size={32} className="text-[var(--ws-verdigris)]" />
                  </div>
                  <p className="text-center text-sm font-medium text-[var(--ws-verdigris)]">
                    {successMsg}
                  </p>
                  {isLoading && <Loader2 size={20} className="animate-spin text-[var(--ws-text-tertiary)]" />}
                </motion.div>
              )}

              {/* LOGIN */}
              {mode === 'login' && !isSuccess && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="mb-1 text-center font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">Entrar</h2>
                  <p className="mb-6 text-center text-sm text-[var(--ws-text-tertiary)]">Acesse sua jornada de aprendizado</p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Email</label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Senha</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 pr-11 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                          placeholder="Sua senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 rounded-ws-button bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                      >
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}

                    <ZenButton type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                    </ZenButton>
                  </form>

                  <p className="mt-6 text-center text-sm text-[var(--ws-text-tertiary)]">
                    Nao tem conta?{' '}
                    <button
                      onClick={() => switchMode('register')}
                      disabled={isLoading}
                      className="font-medium text-[var(--ws-accent)] hover:underline disabled:opacity-50"
                    >
                      Cadastre-se gratis
                    </button>
                  </p>
                </motion.div>
              )}

              {/* REGISTER */}
              {mode === 'register' && !isSuccess && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="mb-1 text-center font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">Criar Conta</h2>
                  <p className="mb-6 text-center text-sm text-[var(--ws-text-tertiary)]">
                    {planInfo ? 'Escolha seu plano e comece sua jornada' : 'Comece sua jornada de aprendizado'}
                  </p>

                  {/* Selected plan banner */}
                  <AnimatePresence>
                    {planInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`relative rounded-ws-button border ${planInfo.border} ${planInfo.bg} p-3.5`}>
                          <button
                            type="button"
                            onClick={() => setSelectedPlan(undefined)}
                            className="absolute right-2 top-2 rounded-full p-1 text-[var(--ws-text-tertiary)] transition-colors hover:bg-black/10 hover:text-[var(--ws-text-primary)]"
                            aria-label="Remover plano"
                          >
                            <X size={14} />
                          </button>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10`}>
                              <planInfo.icon size={18} className={planInfo.color} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-serif-jp text-sm font-bold text-[var(--ws-text-primary)]">Plano {planInfo.name}</span>
                                <span className="font-serif-jp text-[10px] text-[var(--ws-text-tertiary)]">{planInfo.jp}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className={`text-xs font-medium ${planInfo.color}`}>
                                  {selectedBilling === 'monthly' ? planInfo.monthly : planInfo.annual}
                                </span>
                                <span className="text-[10px] text-[var(--ws-text-tertiary)]">
                                  7 dias grátis
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Billing toggle inside the plan banner */}
                          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                            <span className={`text-[11px] font-medium transition-colors ${selectedBilling === 'monthly' ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-tertiary)]'}`}>
                              Mensal
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                              className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${selectedBilling === 'annual' ? 'bg-[var(--ws-verdigris)]' : 'bg-[var(--ws-glass-border)]'}`}
                            >
                              <motion.div
                                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                                animate={{ left: selectedBilling === 'annual' ? '18px' : '2px' }}
                                transition={{ duration: 0.15 }}
                              />
                            </button>
                            <span className={`text-[11px] font-medium transition-colors ${selectedBilling === 'annual' ? 'text-[var(--ws-text-primary)]' : 'text-[var(--ws-text-tertiary)]'}`}>
                              Anual
                            </span>
                            {selectedBilling === 'annual' && (
                              <span className="text-[10px] font-medium text-green-500">
                                -2 meses grátis
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Plan selector (when no plan pre-selected, show quick pick) */}
                  {!planInfo && (
                    <div className="mb-5">
                      <p className="mb-2.5 text-center text-xs text-[var(--ws-text-tertiary)]">
                        Quer começar com um plano premium?
                      </p>
                      <div className="flex gap-2">
                        {(['SAMURAI', 'SENSEI'] as const).map((p) => {
                          const pi = MODAL_PLANS[p];
                          const PIcon = pi.icon;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSelectedPlan(p)}
                              className={`flex flex-1 items-center gap-2 rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-3 py-2.5 text-left transition-all hover:border-[var(--ws-accent)]/30 hover:bg-[var(--ws-accent)]/5`}
                            >
                              <PIcon size={16} className={pi.color} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--ws-text-primary)]">{pi.name}</p>
                                <p className="text-[10px] text-[var(--ws-text-tertiary)]">{pi.monthly}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Nome</label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Email</label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Senha</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 pr-11 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                          placeholder="Minimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 rounded-ws-button bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                      >
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <ZenButton
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={() => switchMode('login')}
                        disabled={isLoading}
                      >
                        Voltar
                      </ZenButton>
                      <ZenButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : planInfo ? (
                          <span className="flex items-center justify-center gap-2">
                            <Crown size={14} />
                            Criar e Assinar {planInfo.name}
                          </span>
                        ) : (
                          'Criar Conta Gratis'
                        )}
                      </ZenButton>
                    </div>

                    {planInfo && (
                      <p className="text-center text-[10px] text-[var(--ws-text-tertiary)]">
                        7 dias grátis · Cancele quando quiser · Pagamento seguro via Stripe
                      </p>
                    )}
                  </form>

                  <p className="mt-6 text-center text-sm text-[var(--ws-text-tertiary)]">
                    Ja tem conta?{' '}
                    <button
                      onClick={() => switchMode('login')}
                      disabled={isLoading}
                      className="font-medium text-[var(--ws-accent)] hover:underline disabled:opacity-50"
                    >
                      Entrar
                    </button>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
