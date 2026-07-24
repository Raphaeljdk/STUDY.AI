'use client';

interface SeigaihaPatternProps {
  className?: string;
  scale?: number;
  color?: string;
}

export function SeigaihaPattern({
  className = '',
  scale = 1,
  color = 'var(--ws-ink)',
}: SeigaihaPatternProps) {
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="seigaiha-pattern"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {[1, 0.75, 0.5, 0.25].map((s, i) => (
              <path
                key={i}
                d={`M 30 ${30 - 25 * s} A ${25 * s} ${25 * s} 0 0 1 30 ${30 + 25 * s}`}
                stroke={color}
                strokeWidth="0.5"
                fill="none"
                opacity={String(0.3 - i * 0.07)}
              />
            ))}
            <path
              d="M 0 30 A 25 25 0 0 1 0 -20"
              stroke={color}
              strokeWidth="0.3"
              fill="none"
              opacity="0.15"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#seigaiha-pattern)" />
      </svg>
    </div>
  );
}
