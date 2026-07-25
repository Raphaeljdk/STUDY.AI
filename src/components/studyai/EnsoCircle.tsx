'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface EnsoCircleProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  imperfection?: number;
  className?: string;
  animate?: boolean;
}

export function EnsoCircle({
  size = 200,
  strokeWidth = 3,
  color = 'currentColor',
  imperfection = 0.15,
  className = '',
  animate = true,
}: EnsoCircleProps) {
  const path = useMemo(() => {
    const points = 8;
    const radius = size / 2;
    let d = '';

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const seeded = Math.sin(angle * 7.3 + imperfection * 42) * 0.5 + 0.5;
      const imperfectRadius = radius + (seeded - 0.5) * radius * imperfection * 2;
      const x = Math.cos(angle) * imperfectRadius;
      const y = Math.sin(angle) * imperfectRadius;

      if (i === 0) {
        d += `M ${x} ${y} `;
      } else {
        const cpRadius = imperfectRadius * 1.15;
        const cpAngle = angle - Math.PI / points;
        const cpX = Math.cos(cpAngle) * cpRadius;
        const cpY = Math.sin(cpAngle) * cpRadius;
        d += `Q ${cpX} ${cpY} ${x} ${y} `;
      }
    }

    return d;
  }, [size, imperfection]);

  const gradientId = `enso-glow-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      className={className}
      initial={animate ? { opacity: 0 } : undefined}
      animate={animate ? { opacity: 1 } : undefined}
      transition={{ duration: 0.5 }}
    >
      <motion.path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={{ duration: 2, ease: 'easeInOut', delay: 0.3 }}
      />

      <motion.path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth * 0.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.2}
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.6 }}
        transform="translate(1.5, 1.5)"
      />

      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.circle
        cx={0}
        cy={0}
        r={size * 0.48}
        fill={`url(#${gradientId})`}
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ duration: 1.5, delay: 1.5 }}
      />
    </motion.svg>
  );
}
