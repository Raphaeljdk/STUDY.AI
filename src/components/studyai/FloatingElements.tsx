'use client';

import { motion } from 'framer-motion';
import { BookOpen, Brain, Sparkles, Target, PenTool } from 'lucide-react';

const elements = [
  { Icon: BookOpen, x: -120, y: -80, delay: 0, duration: 5 },
  { Icon: Brain, x: 140, y: -50, delay: 0.6, duration: 5.5 },
  { Icon: Sparkles, x: -100, y: 90, delay: 1.2, duration: 4.5 },
  { Icon: Target, x: 130, y: 80, delay: 1.8, duration: 4.8 },
  { Icon: PenTool, x: -50, y: -120, delay: 0.9, duration: 4.2 },
];

export function FloatingElements() {
  return (
    <>
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block"
          style={{ left: '50%', top: '50%' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: el.x,
            y: el.y,
          }}
          transition={{
            duration: 0.8,
            delay: el.delay + 1.5,
            type: 'spring',
            stiffness: 80,
          }}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ws-glass-border)] bg-[var(--ws-glass)] shadow-[var(--ws-shadow-soft)] backdrop-blur-md"
          >
            <el.Icon
              size={20}
              className="text-[var(--ws-accent)]"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}
