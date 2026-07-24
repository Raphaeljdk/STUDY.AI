'use client';

import { useTheme } from 'next-themes';
import { Check } from 'lucide-react';

const themes = [
  { id: 'washi-paper', name: 'Washi', color: '#D93838', bg: '#F8F6F0' },
  { id: 'sumi-ink', name: 'Sumi', color: '#D93838', bg: '#1A1A1A' },
  { id: 'koke-ishi', name: 'Koke', color: '#5B8C5A', bg: '#F2F0EB' },
  { id: 'momiji', name: 'Momiji', color: '#C04020', bg: '#FBF7F0' },
  { id: 'sakura', name: 'Sakura', color: '#D07088', bg: '#FFF5F5' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className="group relative h-7 w-7 rounded-full transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: t.color }}
          title={t.name}
          aria-label={`Tema ${t.name}`}
        >
          {theme === t.id && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={3} />
            </span>
          )}
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: 'var(--ws-text-tertiary)' }}
          >
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
