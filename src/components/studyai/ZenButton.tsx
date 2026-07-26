'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ZenButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

const variantStyles = {
  primary: 'bg-[var(--ws-accent)] text-[var(--ws-text-on-dark)] hover:bg-[var(--ws-accent-hover)]',
  secondary: 'border border-[var(--ws-glass-border)] text-[var(--ws-text-primary)] hover:border-[color-mix(in_srgb,var(--ws-accent)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--ws-accent)_5%,transparent)]',
  ghost: 'text-[var(--ws-text-primary)] hover:bg-[color-mix(in_srgb,var(--ws-ink)_5%,transparent)]',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export function ZenButton({
  children,
  variant = 'primary',
  size = 'md',
  gradient = false,
  className,
  disabled,
  type,
  onClick,
  ...props
}: ZenButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden font-medium tracking-wide transition-ws',
        sizeStyles[size],
        variantStyles[variant],
        isPrimary && gradient && 'btn-gradient-animate',
        className,
      )}
      style={{ borderRadius: 'var(--ws-radius-button)' }}
      whileHover={{ 
        scale: 1.03, 
        y: -1,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      type={type}
      onClick={onClick}
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
