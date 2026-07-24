'use client';

import { motion } from 'framer-motion';
import { EnsoCircle } from './EnsoCircle';

const footerLinks = {
  Produto: ['Recursos', 'Preços', 'Roadmap', 'Integrações'],
  Empresa: ['Sobre', 'Blog', 'Carreiras', 'Contato'],
  Recursos: ['Documentação', 'Comunidade', 'Tutoriais', 'FAQ'],
  Legal: ['Privacidade', 'Termos', 'Cookies'],
};

export function FooterZen() {
  return (
    <footer className="border-t border-[var(--ws-glass-border)] bg-[var(--ws-bg-dark)]">
      <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <EnsoCircle size={32} strokeWidth={2} color="var(--ws-accent)" imperfection={0.1} animate={false} />
              <span className="font-serif-jp text-xl font-bold text-[var(--ws-text-primary)]">
                StudyAI
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[var(--ws-text-tertiary)]">
              A beleza do aprendizado na imperfeição. Uma plataforma que respeita seu ritmo natural de conhecimento.
            </p>
            <div className="font-serif-jp text-2xl text-[var(--ws-text-tertiary)] opacity-30">
              侘寂
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-[var(--ws-text-primary)]">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[var(--ws-text-tertiary)] transition-colors hover:text-[var(--ws-accent)]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--ws-glass-border)] pt-8 md:flex-row">
          <p className="text-xs text-[var(--ws-text-tertiary)]">
            &copy; {new Date().getFullYear()} StudyAI. Todos os direitos reservados.
          </p>
          <p className="font-serif-jp text-xs text-[var(--ws-text-tertiary)] opacity-40">
            一期一会 — Cada encontro é único
          </p>
        </div>
      </div>
    </footer>
  );
}
