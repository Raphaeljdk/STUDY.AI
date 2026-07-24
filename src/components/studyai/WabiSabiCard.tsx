'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface WabiSabiCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function WabiSabiCard({ children, className = '', hover = true }: WabiSabiCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] p-6 backdrop-blur-xl ${className}`}
      style={{ borderRadius: 'var(--ws-radius-card)' }}
      whileHover={
        hover
          ? {
              y: -2,
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
            }
          : undefined
      }
    >
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rotate-45 opacity-50"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--ws-accent) 8%, transparent) 0%, transparent 100%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
