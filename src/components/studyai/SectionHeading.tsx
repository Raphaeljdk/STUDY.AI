'use client';

import { motion } from 'framer-motion';

interface SectionHeadingProps {
  japaneseSubtitle?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  japaneseSubtitle,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <motion.div
      className={`max-w-2xl ${alignment} ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8 }}
    >
      {japaneseSubtitle && (
        <span className="mb-4 inline-block font-serif-jp text-sm tracking-[0.3em] text-[var(--ws-accent)]">
          {japaneseSubtitle}
        </span>
      )}
      <h2
        className={`font-serif-jp leading-tight text-[var(--ws-text-primary)] ${
          align === 'center' ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-3xl md:text-4xl lg:text-5xl'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-6 text-base leading-relaxed text-[var(--ws-text-secondary)] lg:text-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
}
