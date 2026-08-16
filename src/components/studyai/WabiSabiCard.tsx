'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface WabiSabiCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function WabiSabiCard({ children, className = '', hover = true, glass = false }: WabiSabiCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden p-6 ${
        glass
          ? 'glass-enhanced'
          : 'border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] backdrop-blur-xl'
      } ${className}`}
      style={{ borderRadius: 'var(--ws-radius-card)' }}
      whileHover={
        hover
          ? {
              y: -3,
              boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
              transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            }
          : undefined
      }
      whileTap={
        hover
          ? { scale: 0.985 }
          : undefined
      }
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rotate-45 opacity-50"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--ws-accent) 8%, transparent) 0%, transparent 100%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
