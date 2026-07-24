'use client';

import { motion } from 'framer-motion';

interface EnsoDividerProps {
  className?: string;
}

export function EnsoDivider({ className = '' }: EnsoDividerProps) {
  return (
    <div className={`flex items-center gap-4 py-12 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--ws-glass-border)] to-transparent" />
      <motion.svg
        width="24"
        height="24"
        viewBox="-12 -12 24 24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <motion.circle
          cx="0"
          cy="0"
          r="8"
          stroke="var(--ws-accent)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="opacity-50"
        />
      </motion.svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--ws-glass-border)] to-transparent" />
    </div>
  );
}
