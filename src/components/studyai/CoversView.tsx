'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Download, BookOpen, Sparkles, ChevronRight, Palette,
  Type, Image as ImageIcon, Layers, RotateCcw, Search,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CoverPreset {
  id: string;
  name: string;
  category: string;
  gradient: string;
  pattern: 'none' | 'grid' | 'dots' | 'lines' | 'waves' | 'circles' | 'zen' | 'sakura' | 'bamboo';
  textColor: string;
  accentColor: string;
}

const COVER_PRESETS: CoverPreset[] = [
  // Japanese-themed
  { id: 'washi', name: 'Washi Paper', category: 'Japonês', gradient: 'linear-gradient(135deg, #f5f0e8 0%, #e8dfd0 100%)', pattern: 'zen', textColor: '#2c1810', accentColor: '#8B4513' },
  { id: 'sumi', name: 'Sumi Ink', category: 'Japonês', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', pattern: 'waves', textColor: '#e0d5c1', accentColor: '#c9b896' },
  { id: 'sakura', name: 'Sakura', category: 'Japonês', gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)', pattern: 'sakura', textColor: '#880e4f', accentColor: '#e91e63' },
  { id: 'bamboo', name: 'Bamboo', category: 'Japonês', gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #4caf50 100%)', pattern: 'bamboo', textColor: '#e8f5e9', accentColor: '#a5d6a7' },
  { id: 'kintsugi', name: 'Kintsugi', category: 'Japonês', gradient: 'linear-gradient(135deg, #2c1810 0%, #3e2723 100%)', pattern: 'lines', textColor: '#ffd54f', accentColor: '#ffb300' },
  { id: 'ryoanji', name: 'Ryoanji', category: 'Japonês', gradient: 'linear-gradient(135deg, #d7ccc8 0%, #bcaaa4 100%)', pattern: 'zen', textColor: '#424242', accentColor: '#757575' },
  // Minimalist
  { id: 'clean', name: 'Clean White', category: 'Minimalista', gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)', pattern: 'dots', textColor: '#212121', accentColor: '#9e9e9e' },
  { id: 'noir', name: 'Noir', category: 'Minimalista', gradient: 'linear-gradient(135deg, #212121 0%, #424242 100%)', pattern: 'grid', textColor: '#fafafa', accentColor: '#e0e0e0' },
  { id: 'cream', name: 'Cream', category: 'Minimalista', gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)', pattern: 'none', textColor: '#5d4037', accentColor: '#a1887f' },
  // Colors
  { id: 'ocean', name: 'Ocean', category: 'Cores', gradient: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)', pattern: 'waves', textColor: '#e3f2fd', accentColor: '#90caf9' },
  { id: 'sunset', name: 'Sunset', category: 'Cores', gradient: 'linear-gradient(135deg, #bf360c 0%, #e65100 50%, #ff9800 100%)', pattern: 'circles', textColor: '#fff3e0', accentColor: '#ffb74d' },
  { id: 'lavender', name: 'Lavanda', category: 'Cores', gradient: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 50%, #ab47bc 100%)', pattern: 'circles', textColor: '#f3e5f5', accentColor: '#ce93d8' },
  { id: 'forest', name: 'Floresta', category: 'Cores', gradient: 'linear-gradient(135deg, #1b5e20 0%, #33691e 50%, #689f38 100%)', pattern: 'bamboo', textColor: '#f1f8e9', accentColor: '#aed581' },
  { id: 'midnight', name: 'Midnight', category: 'Cores', gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2d4059 100%)', pattern: 'dots', textColor: '#e0e1dd', accentColor: '#778da9' },
  // Academic
  { id: 'classic', name: 'Classico', category: 'Acadêmico', gradient: 'linear-gradient(135deg, #3e2723 0%, #5d4037 100%)', pattern: 'lines', textColor: '#efebe9', accentColor: '#bcaaa4' },
  { id: 'college', name: 'College', category: 'Acadêmico', gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)', pattern: 'grid', textColor: '#ffffff', accentColor: '#ef9a9a' },
  { id: 'slate', name: 'Ardosia', category: 'Acadêmico', gradient: 'linear-gradient(135deg, #37474f 0%, #546e7a 100%)', pattern: 'lines', textColor: '#cfd8dc', accentColor: '#90a4ae' },
];

const CATEGORIES = ['Todos', 'Japonês', 'Minimalista', 'Cores', 'Acadêmico'];

export function CoversView() {
  const [selectedCover, setSelectedCover] = useState<CoverPreset>(COVER_PRESETS[0]);
  const [title, setTitle] = useState('Meu Caderno');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const filteredCovers = useMemo(() => {
    return COVER_PRESETS.filter(c => {
      const matchCategory = category === 'Todos' || c.category === category;
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [category, search]);

  const downloadCover = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1200;
    canvas.height = 1600;

    // Background gradient
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = extractGradientColors(selectedCover.gradient);
    grd.addColorStop(0, colors[0]);
    grd.addColorStop(1, colors[1]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pattern
    drawPattern(ctx, selectedCover.pattern, selectedCover.accentColor, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = selectedCover.textColor;
    ctx.font = 'bold 72px serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

    // Subtitle
    if (subtitle) {
      ctx.font = '36px sans-serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 40);
      ctx.globalAlpha = 1;
    }

    // Border
    ctx.strokeStyle = selectedCover.accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Download
    const link = document.createElement('a');
    link.download = `capa-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast({ title: 'Capa baixada!', description: 'Sua capa de caderno foi salva.' });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--ws-text-primary)]" style={{ fontFamily: 'var(--font-serif-jp), serif' }}>
          Capas de Caderno
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
          Crie capas personalizadas para seus cadernos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cover Preview */}
        <div className="flex flex-col gap-4">
          <div
            className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg shadow-xl"
            style={{ aspectRatio: '3/4' }}
          >
            <div
              className="absolute inset-0"
              style={{ background: selectedCover.gradient }}
            />\n            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <PatternSVG pattern={selectedCover.pattern} color={selectedCover.accentColor} />
            </div>

            {/* Border */}
            <div
              className="absolute inset-3 rounded-sm border-2"
              style={{ borderColor: selectedCover.accentColor + '60' }}
            />\n            {/* Title */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <h2
                className="text-center text-2xl font-bold leading-tight"
                style={{ color: selectedCover.textColor, fontFamily: 'var(--font-serif-jp), serif' }}
              >
                {title || 'Título do Caderno'}
              </h2>
              {subtitle && (
                <p
                  className="mt-2 text-center text-sm opacity-70"
                  style={{ color: selectedCover.textColor }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={downloadCover}
            className="flex items-center justify-center gap-2 rounded-ws-button bg-[var(--ws-accent)] px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Download size={16} />
            Baixar Capa (PNG)
          </button>

          {/* Customization */}
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-surface)] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ws-text-primary)]">
              <Type size={14} /> Personalizar
            </h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do caderno"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtítulo (opcional)"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
          </div>
        </div>

        {/* Cover Selection */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar capa..."
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] py-2 pl-9 pr-3 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-[var(--ws-accent)] text-white'
                    : 'bg-[var(--ws-surface)] text-[var(--ws-text-secondary)] hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cover Grid */}
          <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCovers.map((cover) => (
              <motion.button
                key={cover.id}
                onClick={() => setSelectedCover(cover)}
                whileTap={{ scale: 0.95 }}
                className={`group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${
                  selectedCover.id === cover.id
                    ? 'border-[var(--ws-accent)] shadow-md'
                    : 'border-transparent hover:border-[var(--ws-glass-border)]'
                }`}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: cover.gradient }}
                />
                <div className="absolute inset-0 opacity-15">
                  <PatternSVG pattern={cover.pattern} color={cover.accentColor} />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                  <p className="text-[10px] font-medium text-white truncate">{cover.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pattern SVG Component ---------- */
function PatternSVG({ pattern, color }: { pattern: string; color: string }) {
  const patterns: Record<string, React.ReactNode> = {
    none: null,
    grid: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-grid)" />
      </svg>
    ),
    dots: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-dots)" />
      </svg>
    ),
    lines: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-lines" width="100%" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="10" x2="100%" y2="10" stroke={color} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-lines)" />
      </svg>
    ),
    waves: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-waves" width="100" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q25 10, 50 20 T100 20" fill="none" stroke={color} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-waves)" />
      </svg>
    ),
    circles: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-circles" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-circles)" />
      </svg>
    ),
    zen: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="50%" r="30%" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
        <circle cx="50%" cy="50%" r="15%" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={color} strokeWidth="0.5" opacity="0.2" />
      </svg>
    ),
    sakura: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-sakura" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M40 10 Q45 25, 40 35 Q35 25, 40 10Z" fill={color} opacity="0.6" />
            <path d="M20 50 Q30 45, 35 50 Q30 55, 20 50Z" fill={color} opacity="0.4" />
            <path d="M55 60 Q65 55, 70 60 Q65 65, 55 60Z" fill={color} opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-sakura)" />
      </svg>
    ),
    bamboo: (
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p-bamboo" width="60" height="100" patternUnits="userSpaceOnUse">
            <line x1="20" y1="0" x2="20" y2="100" stroke={color} strokeWidth="3" />
            <line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="2" opacity="0.5" />
            <line x1="20" y1="30" x2="35" y2="25" stroke={color} strokeWidth="1.5" />
            <line x1="20" y1="70" x2="32" y2="65" stroke={color} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p-bamboo)" />
      </svg>
    ),
  };

  return <>{patterns[pattern] || null}</>;
}

/* ---------- Canvas helpers ---------- */
function extractGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  if (matches && matches.length === 1) return [matches[0], matches[0]];
  return ['#333333', '#666666'];
}

function drawPattern(ctx: CanvasRenderingContext2D, pattern: string, color: string, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.15;

  switch (pattern) {
    case 'grid':
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      break;
    case 'dots':
      for (let x = 20; x <= w; x += 20)
        for (let y = 20; y <= h; y += 20) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'lines':
      ctx.lineWidth = 1;
      for (let y = 20; y <= h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      break;
    case 'waves':
      ctx.lineWidth = 1.5;
      for (let y = 20; y <= h; y += 40) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) ctx.lineTo(x, y + Math.sin(x * 0.05) * 10);
        ctx.stroke();
      }
      break;
    case 'zen':
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.15, 0, Math.PI * 2); ctx.stroke();
      break;
  case 'sakura':
      ctx.globalAlpha = 0.2;
      const positions = [[w*0.3, h*0.2], [w*0.7, h*0.15], [w*0.15, h*0.5], [w*0.8, h*0.45], [w*0.5, h*0.7], [w*0.2, h*0.8], [w*0.75, h*0.8]];
      positions.forEach(([x, y]) => {
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 12, 6, angle, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      break;
    default:
      break;
  }
  ctx.restore();
}
