'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ZenButton } from './ZenButton';

const planOptions = [
  { id: 'FREE' as const, name: 'Shojin', price: 'Grátis', desc: '3 cadernos, 20 msgs/dia', features: ['3 cadernos', 'Chat 20 msgs/dia', 'Flashcards básicos', 'Pomodoro'] },
  { id: 'SAMURAI' as const, name: 'Samurai', price: 'R$ 29/mês', desc: 'Tudo ilimitado + IA', features: ['Cadernos ilimitados', 'Chat ilimitado', 'Flashcards IA', 'Resumos automáticos', 'Quiz com IA', 'Exportar notas'] },
  { id: 'SENSEI' as const, name: 'Sensei', price: 'R$ 59/mês', desc: 'Mestre do conhecimento', features: ['Tudo do Samurai', 'Tutoria IA personalizada', 'Análise de padrões', 'Comunidade exclusiva', 'Planos personalizados', 'Suporte prioritário'] },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'plan'>('login' === initialMode ? 'login' : 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'SAMURAI' | 'SENSEI'>('FREE');

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Email ou senha incorretos');
    } else if (res?.ok) {
      onClose();
      window.location.reload();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plan: selectedPlan }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao criar conta');
      return;
    }

    // Auto-login após registro
    const loginRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (loginRes?.ok) {
      onClose();
      window.location.reload();
    }
  };

  const goToRegister = () => { setMode('register'); setError(''); };
  const goToLogin = () => { setMode('login'); setError(''); };
  const goToPlans = () => { setMode('plan'); setError(''); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_8%,transparent)] hover:text-[var(--ws-text-primary)]"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="max-h-[85vh] overflow-y-auto p-8">
              {/* LOGIN */}
              {mode === 'login' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="mb-1 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                    Entrar
                  </h2>
                  <p className="mb-6 text-sm text-[var(--ws-text-tertiary)]">
                    Acesse sua jornada de aprendizado
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Email</label>
                      <input
                        type="email"
                        required
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
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 pr-11 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                          placeholder="Sua senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-ws-button bg-[var(--ws-accent)]/10 px-4 py-2 text-sm text-[var(--ws-accent)]">{error}</p>
                    )}

                    <ZenButton type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                    </ZenButton>
                  </form>

                  <p className="mt-6 text-center text-sm text-[var(--ws-text-tertiary)]">
                    Não tem conta?{' '}
                    <button onClick={goToRegister} className="font-medium text-[var(--ws-accent)] hover:underline">
                      Cadastre-se
                    </button>
                  </p>
                </motion.div>
              )}

              {/* REGISTER - Step 1: Info */}
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="mb-1 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                    Criar Conta
                  </h2>
                  <p className="mb-6 text-sm text-[var(--ws-text-tertiary)]">
                    Comece sua jornada de aprendizado
                  </p>

                  <form onSubmit={goToPlans} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[var(--ws-text-secondary)]">Nome</label>
                      <input
                        type="text"
                        required
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
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] px-4 py-3 pr-11 text-sm text-[var(--ws-text-primary)] placeholder-[var(--ws-text-tertiary)] outline-none transition-colors focus:border-[var(--ws-accent)]/30"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-ws-button bg-[var(--ws-accent)]/10 px-4 py-2 text-sm text-[var(--ws-accent)]">{error}</p>
                    )}

                    <div className="flex gap-3">
                      <ZenButton type="button" variant="secondary" size="lg" onClick={goToLogin}>
                        Voltar
                      </ZenButton>
                      <ZenButton type="submit" variant="primary" size="lg" className="flex-1">
                        Escolher Plano
                      </ZenButton>
                    </div>
                  </form>

                  <p className="mt-6 text-center text-sm text-[var(--ws-text-tertiary)]">
                    Já tem conta?{' '}
                    <button onClick={goToLogin} className="font-medium text-[var(--ws-accent)] hover:underline">
                      Entrar
                    </button>
                  </p>
                </motion.div>
              )}

              {/* REGISTER - Step 2: Plan Selection */}
              {mode === 'plan' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="mb-1 font-serif-jp text-2xl font-bold text-[var(--ws-text-primary)]">
                    Escolha seu Plano
                  </h2>
                  <p className="mb-6 text-sm text-[var(--ws-text-tertiary)]">
                    Selecione o caminho que faz sentido para você
                  </p>

                  <form onSubmit={handleRegister} className="space-y-3">
                    {planOptions.map((p) => (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start gap-4 rounded-ws-card border p-4 transition-all ${
                          selectedPlan === p.id
                            ? 'border-[var(--ws-accent)]/40 bg-[color-mix(in_srgb,var(--ws-accent)_5%,transparent)]'
                            : 'border-[var(--ws-glass-border)] hover:border-[var(--ws-glass-border)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          value={p.id}
                          checked={selectedPlan === p.id}
                          onChange={() => setSelectedPlan(p.id)}
                          className="mt-1 accent-[var(--ws-accent)]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif-jp font-bold text-[var(--ws-text-primary)]">{p.name}</span>
                            <span className="text-sm font-medium text-[var(--ws-accent)]">{p.price}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--ws-text-tertiary)]">{p.desc}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {p.features.map((f) => (
                              <span key={f} className="rounded-full bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] px-2.5 py-0.5 text-[11px] text-[var(--ws-text-secondary)]">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}

                    {error && (
                      <p className="rounded-ws-button bg-[var(--ws-accent)]/10 px-4 py-2 text-sm text-[var(--ws-accent)]">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <ZenButton type="button" variant="secondary" size="lg" onClick={() => setMode('register')}>
                        Voltar
                      </ZenButton>
                      <ZenButton type="submit" variant="primary" size="lg" className="flex-1" disabled={loading}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : `Criar Conta (${planOptions.find(p => p.id === selectedPlan)?.name})`}
                      </ZenButton>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
