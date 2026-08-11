'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Users } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { ZenButton } from './ZenButton';

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
        <a href="#" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <img
            src="/logo.svg"
            alt="StudyAI Logo"
            width={36}
            height={36}
            className="rounded-full"
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
              className="relative text-sm font-medium text-[var(--ws-text-secondary)] transition-colors duration-300 hover:text-[var(--ws-accent)] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--ws-accent)] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-3 lg:flex">
          <div className="mr-2 flex items-center gap-2 text-xs text-[var(--ws-text-tertiary)]">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--ws-verdigris)]" />
            <Users size={12} />
            <span className="tabular-nums" id="header-active-users">--</span> online
          </div>
          <ThemeSelector />
          <ZenButton variant="ghost" size="sm" onClick={() => openAuth('login')}>
            <LogIn size={15} /> Entrar
          </ZenButton>
          <ZenButton variant="primary" size="sm" gradient onClick={() => openAuth('register')}>
            <UserPlus size={15} /> Cadastrar
          </ZenButton>
        </div>

        {/* Mobile Menu Toggle - Animated Hamburger */}
        <button
          className={`relative flex h-8 w-8 flex-col items-center justify-center gap-[5px] lg:hidden ${mobileOpen ? 'hamburger-active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
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
                <ZenButton variant="primary" size="md" gradient className="flex-1" onClick={() => { openAuth('register'); setMobileOpen(false); }}>
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
