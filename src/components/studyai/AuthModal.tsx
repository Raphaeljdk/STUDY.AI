'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { X, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ZenButton } from './ZenButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '' });

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
      // Step 1: Create account (with timeout to avoid hanging)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let res: Response;
      try {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, plan: 'SENSEI' }),
          signal: controller.signal,
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          setStatus('error');
          setErrorMsg('Servidor demorou demais. O banco de dados pode nao estar configurado. Tente novamente.');
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
        // Map common error messages to friendlier ones
        const msg = data.error || 'Erro ao criar conta';
        if (res.status === 409) {
          setErrorMsg('Este email ja esta cadastrado. Tente fazer login.');
        } else if (res.status === 400) {
          setErrorMsg(msg);
        } else {
          setErrorMsg('Nao foi possivel criar a conta. Tente novamente.');
        }
        return;
      }

      // Step 2: Auto-login after successful registration (with timeout)
      try {
        const loginController = new AbortController();
        const loginTimeout = setTimeout(() => loginController.abort(), 10000);
        const loginRes = await Promise.race([
          signIn('credentials', {
            email: form.email,
            password: form.password,
            redirect: false,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        clearTimeout(loginTimeout);

        if (loginRes?.ok) {
          setStatus('success');
          setSuccessMsg('Conta criada com sucesso! Bem-vindo(a)!');
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 800);
        } else {
          // Account created but auto-login failed
          setStatus('success');
          setSuccessMsg('Conta criada! Agora faca login para entrar.');
          setTimeout(() => switchMode('login'), 1500);
        }
      } catch {
        // Account created but auto-login failed due to network error
        setStatus('success');
        setSuccessMsg('Conta criada! Agora faca login para entrar.');
        setTimeout(() => switchMode('login'), 1500);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erro de conexao. Verifique sua internet e tente novamente.');
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-ws-organic border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] shadow-[var(--ws-shadow-medium)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_8%,transparent)] hover:text-[var(--ws-text-primary)] disabled:opacity-50"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              {/* Free badge */}
              <div className="mb-6 flex items-center justify-center gap-2 rounded-ws-button px-3 py-1.5 mx-auto w-fit" style={{ backgroundColor: 'color-mix(in srgb, var(--ws-verdigris) 12%, transparent)' }}>
                <Sparkles size={14} className="text-[var(--ws-verdigris)]" />
                <span className="text-xs font-medium text-[var(--ws-verdigris)]">100% Gratuito e Ilimitado</span>
              </div>

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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <p className="mb-6 text-center text-sm text-[var(--ws-text-tertiary)]">Comece sua jornada de aprendizado</p>

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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-secondary)]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Criar Conta Gratis'}
                      </ZenButton>
                    </div>
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
