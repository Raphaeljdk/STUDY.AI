'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ParticlesEffectProps {
  count?: number;
  className?: string;
}

export function ParticlesEffect({ count = 15, className = '' }: ParticlesEffectProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.sin(i * 2.4) * 45 + 50,
      y: Math.cos(i * 1.7) * 40 + 50,
      size: 2 + (i % 3),
      delay: i * 0.4,
      duration: 8 + (i % 5) * 2,
      driftX: Math.sin(i * 3.1) * 20,
      driftY: -30 - (i % 4) * 15,
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: 'var(--ws-accent)',
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.15, 0.1, 0],
            y: [0, p.driftY],
            x: [0, p.driftX],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
