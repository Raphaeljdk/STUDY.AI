'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { ZenButton } from './ZenButton';
import { EnsoCircle } from './EnsoCircle';

const navLinks = [
  { label: 'Recursos', href: '#features' },
  { label: 'Como Funciona', href: '#how-it-works' },
  { label: 'Sensei IA', href: '#ai-chat' },
];

export function HeaderZen() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openAuth = (mode: 'login' | 'register') => {
    (window as any).__studyai_openAuth?.(mode);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)] shadow-[var(--ws-shadow-soft)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-24">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <EnsoCircle
            size={36}
            strokeWidth={2}
            color="var(--ws-accent)"
            imperfection={0.1}
            animate={false}
          />
          <span className="font-serif-jp text-xl font-bold tracking-tight text-[var(--ws-text-primary)]">
            StudyAI
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--ws-text-secondary)] transition-colors duration-300 hover:text-[var(--ws-accent)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSelector />
          <ZenButton variant="ghost" size="sm" onClick={() => openAuth('login')}>
            <LogIn size={15} /> Entrar
          </ZenButton>
          <ZenButton variant="primary" size="sm" onClick={() => openAuth('register')}>
            <UserPlus size={15} /> Cadastrar
          </ZenButton>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <X size={24} className="text-[var(--ws-text-primary)]" />
          ) : (
            <Menu size={24} className="text-[var(--ws-text-primary)]" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-[var(--ws-glass-border)] bg-[var(--ws-bg)] lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-ws-button px-4 py-3 text-sm font-medium text-[var(--ws-text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)] hover:text-[var(--ws-accent)]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex items-center gap-4">
                <ThemeSelector />
              </div>
              <div className="mt-4 flex gap-3">
                <ZenButton variant="secondary" size="md" className="flex-1" onClick={() => { openAuth('login'); setMobileOpen(false); }}>
                  <LogIn size={15} /> Entrar
                </ZenButton>
                <ZenButton variant="primary" size="md" className="flex-1" onClick={() => { openAuth('register'); setMobileOpen(false); }}>
                  <UserPlus size={15} /> Cadastrar
                </ZenButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
