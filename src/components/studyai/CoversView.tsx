'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Download, Type, Search, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ============================================================
   SEEDED RANDOM — deterministic pseudo-random from seed
   ============================================================ */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function seededRandom2(seed: number) {
  const x = Math.sin(seed * 269.5 + 183.3) * 28461.7231;
  return x - Math.floor(x);
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h % 360}, ${s}%, ${l}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;
}

/* ============================================================
   COLOR PALETTE GENERATION
   ============================================================ */
function generatePalette(seed: number, style: 'warm' | 'cool' | 'earth' | 'neon' | 'pastel' | 'dark' | 'mono' | 'japan') {
  const r1 = seededRandom(seed);
  const r2 = seededRandom(seed + 1);
  const r3 = seededRandom(seed + 2);

  let bgH1: number, bgH2: number, bgH3: number;
  let bgS1: number, bgS2: number, bgS3: number;
  let bgL1: number, bgL2: number, bgL3: number;
  let txtH: number, txtS: number, txtL: number;
  let accH: number, accS: number, accL: number;

  switch (style) {
    case 'warm':
      bgH1 = r1 * 60; bgH2 = bgH1 + 15 + r2 * 20; bgH3 = bgH2 + 10 + r3 * 15;
      bgS1 = 50 + r2 * 30; bgS2 = 55 + r3 * 25; bgS3 = 45 + r1 * 30;
      bgL1 = 25 + r3 * 30; bgL2 = 35 + r1 * 25; bgL3 = 45 + r2 * 20;
      txtL = 85 + r1 * 15; txtS = 10;
      txtH = bgH1 + 180;
      accH = bgH1 + 30; accS = 60 + r2 * 30; accL = 65 + r3 * 20;
      break;
    case 'cool':
      bgH1 = 180 + r1 * 80; bgH2 = bgH1 + 15 + r2 * 20; bgH3 = bgH2 + 10 + r3 * 15;
      bgS1 = 40 + r2 * 35; bgS2 = 45 + r3 * 30; bgS3 = 35 + r1 * 35;
      bgL1 = 20 + r3 * 30; bgL2 = 30 + r1 * 25; bgL3 = 40 + r2 * 20;
      txtL = 80 + r1 * 20; txtS = 15;
      txtH = bgH1 + 180;
      accH = bgH1 + 25; accS = 50 + r2 * 30; accL = 60 + r3 * 25;
      break;
    case 'earth':
      bgH1 = 15 + r1 * 35; bgH2 = bgH1 + 8 + r2 * 15; bgH3 = bgH2 + 5 + r3 * 12;
      bgS1 = 25 + r2 * 35; bgS2 = 20 + r3 * 30; bgS3 = 30 + r1 * 30;
      bgL1 = 15 + r3 * 35; bgL2 = 25 + r1 * 30; bgL3 = 35 + r2 * 25;
      txtL = 75 + r1 * 20; txtS = 15;
      txtH = bgH1;
      accH = bgH1 + 20; accS = 40 + r2 * 30; accL = 55 + r3 * 25;
      break;
    case 'neon':
      bgH1 = r1 * 360; bgH2 = (bgH1 + 120 + r2 * 60) % 360; bgH3 = (bgH2 + 120 + r3 * 60) % 360;
      bgS1 = bgS2 = bgS3 = 80 + r2 * 20;
      bgL1 = 8 + r3 * 7; bgL2 = 12 + r1 * 8; bgL3 = 15 + r2 * 8;
      txtL = 85 + r1 * 15; txtS = 5;
      txtH = bgH1;
      accH = bgH2; accS = 90; accL = 65 + r3 * 15;
      break;
    case 'pastel':
      bgH1 = r1 * 360; bgH2 = bgH1 + 20 + r2 * 30; bgH3 = bgH2 + 15 + r3 * 25;
      bgS1 = 40 + r2 * 25; bgS2 = 45 + r3 * 20; bgS3 = 35 + r1 * 25;
      bgL1 = 80 + r3 * 12; bgL2 = 75 + r1 * 12; bgL3 = 70 + r2 * 12;
      txtL = 20 + r1 * 15; txtS = 20;
      txtH = bgH1 + 180;
      accH = bgH1 + 30; accS = 50 + r2 * 25; accL = 40 + r3 * 15;
      break;
    case 'dark':
      bgH1 = r1 * 360; bgH2 = bgH1 + 10 + r2 * 20; bgH3 = bgH2 + 8 + r3 * 15;
      bgS1 = 15 + r2 * 20; bgS2 = 20 + r3 * 15; bgS3 = 10 + r1 * 20;
      bgL1 = 8 + r3 * 7; bgL2 = 12 + r1 * 8; bgL3 = 16 + r2 * 8;
      txtL = 75 + r1 * 20; txtS = 10;
      txtH = bgH1;
      accH = bgH1 + 20; accS = 40 + r2 * 30; accL = 60 + r3 * 20;
      break;
    case 'mono':
      bgH1 = 0; bgH2 = 0; bgH3 = 0;
      bgS1 = 0; bgS2 = 0; bgS3 = 0;
      bgL1 = 90 + r3 * 8; bgL2 = 75 + r1 * 10; bgL3 = 60 + r2 * 12;
      txtL = 15 + r1 * 15; txtS = 5;
      txtH = 0;
      accH = 0; accS = 0; accL = 50 + r3 * 20;
      break;
    case 'japan': {
      const japanHues = [0, 120, 200, 340, 35, 280, 50, 160];
      bgH1 = japanHues[Math.floor(r1 * japanHues.length)] + (r2 - 0.5) * 20;
      bgH2 = bgH1 + 15 + r3 * 20;
      bgH3 = bgH1 + 5 + r2 * 15;
      bgS1 = 35 + r2 * 35; bgS2 = 30 + r3 * 30; bgS3 = 40 + r1 * 30;
      bgL1 = 20 + r3 * 25; bgL2 = 30 + r1 * 20; bgL3 = 35 + r2 * 20;
      txtL = 80 + r1 * 18; txtS = 12;
      txtH = bgH1 + 180;
      accH = bgH1 + 25; accS = 45 + r2 * 30; accL = 60 + r3 * 20;
      break;
    }
    default:
      bgH1 = r1 * 360; bgH2 = bgH1 + 30; bgH3 = bgH1 + 60;
      bgS1 = 50; bgS2 = 50; bgS3 = 50;
      bgL1 = 30; bgL2 = 40; bgL3 = 50;
      txtL = 80; txtS = 10; txtH = 0;
      accH = bgH1; accS = 60; accL = 60;
  }

  return {
    bg1: hsl(bgH1, bgS1, bgL1),
    bg2: hsl(bgH2, bgS2, bgL2),
    bg3: hsl(bgH3, bgS3, bgL3),
    textColor: hsl(txtH, txtS, txtL),
    accentColor: hsl(accH, accS, accL),
    accentH: accH,
    accentS: accS,
    accentL: accL,
  };
}

/* ============================================================
   PATTERN DRAWING FUNCTIONS (Canvas)
   Each takes ctx, w, h, seed — all deterministic
   ============================================================ */

function drawJapanesePattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const variant = Math.floor(r(seed) * 4);
  const accentH = (r(seed + 100) * 360) | 0;
  const accentS = 40 + (r(seed + 101) * 30) | 0;
  const accentL = 55 + (r(seed + 102) * 20) | 0;
  const color = hsl(accentH, accentS, accentL);
  ctx.globalAlpha = 0.18;

  if (variant === 0) {
    // Cherry blossoms
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i++) {
      const cx = r(seed + i * 3) * w;
      const cy = r(seed + i * 3 + 1) * h;
      const size = 8 + r(seed + i * 3 + 2) * 18;
      const petals = 5;
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2 + r(seed + i) * 0.5;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(angle) * size * 0.6, cy + Math.sin(angle) * size * 0.6, size * 0.5, size * 0.25, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (variant === 1) {
    // Seigaiha (wave circles)
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const rowH = 50 + r(seed + 10) * 30;
    const radius = rowH * 0.45;
    for (let y = -radius; y < h + radius; y += rowH) {
      const offset = (Math.floor(y / rowH) % 2) * radius;
      for (let x = -radius + offset; x < w + radius; x += radius * 2) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI, false);
        ctx.stroke();
      }
    }
  } else if (variant === 2) {
    // Bamboo
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const x = r(seed + i * 2) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      // Nodes
      const nodeCount = 4 + (r(seed + i * 2 + 1) * 5) | 0;
      ctx.lineWidth = 1.5;
      for (let n = 0; n < nodeCount; n++) {
        const ny = (n + 0.5) * (h / nodeCount);
        ctx.beginPath();
        ctx.moveTo(x - 8, ny);
        ctx.quadraticCurveTo(x, ny + 4, x + 8, ny);
        ctx.stroke();
      }
      ctx.lineWidth = 2.5;
    }
  } else {
    // Torii gate silhouettes
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      const gx = r(seed + i * 3) * w * 0.8 + w * 0.1;
      const gy = r(seed + i * 3 + 1) * h * 0.4 + h * 0.2;
      const scale = 0.5 + r(seed + i * 3 + 2) * 0.8;
      // Pillars
      ctx.fillRect(gx - 30 * scale, gy, 6 * scale, 80 * scale);
      ctx.fillRect(gx + 24 * scale, gy, 6 * scale, 80 * scale);
      // Top beam
      ctx.fillRect(gx - 40 * scale, gy - 4 * scale, 80 * scale, 8 * scale);
      // Curved top
      ctx.beginPath();
      ctx.moveTo(gx - 48 * scale, gy - 12 * scale);
      ctx.quadraticCurveTo(gx, gy - 20 * scale, gx + 48 * scale, gy - 12 * scale);
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawGeometricPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 50, 60);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const variant = (r(seed) * 3) | 0;

  if (variant === 0) {
    // Triangles grid
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const size = 40 + (r(seed + 1) * 30) | 0;
    for (let y = 0; y < h + size; y += size) {
      for (let x = 0; x < w + size; x += size) {
        const filled = r(seed + x * 7 + y * 13) > 0.65;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size / 2, y - size * 0.866);
        ctx.closePath();
        if (filled) { ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 0.15; }
        ctx.stroke();
      }
    }
  } else if (variant === 1) {
    // Hexagons
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const size = 30 + (r(seed + 2) * 25) | 0;
    const hexH = size * 1.732;
    for (let row = 0; row < h / hexH + 1; row++) {
      for (let col = 0; col < w / (size * 3) + 1; col++) {
        const cx = col * size * 3 + (row % 2) * size * 1.5;
        const cy = row * hexH * 0.5;
        const filled = r(seed + row * 17 + col * 31) > 0.7;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i - Math.PI / 6;
          const px = cx + Math.cos(a) * size;
          const py = cy + Math.sin(a) * size;
          if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
        }
        ctx.closePath();
        if (filled) { ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 0.15; }
        ctx.stroke();
      }
    }
  } else {
    // Diamond grid
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    const size = 35 + (r(seed + 3) * 25) | 0;
    for (let y = 0; y < h + size * 2; y += size * 2) {
      for (let x = 0; x < w + size * 2; x += size * 2) {
        const filled = r(seed + x * 11 + y * 7) > 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        if (filled) { ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 0.15; }
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawWavePattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 45, 60);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.18;
  const waveCount = 6 + (r(seed + 1) * 8) | 0;
  const freq = 0.005 + r(seed + 2) * 0.015;
  const amp = 10 + r(seed + 3) * 25;

  for (let i = 0; i < waveCount; i++) {
    const yBase = (i + 1) * (h / (waveCount + 1));
    const phase = r(seed + i * 5) * Math.PI * 2;
    const lineFreq = freq + r(seed + i * 5 + 1) * 0.005;
    const lineAmp = amp + r(seed + i * 5 + 2) * 10;
    ctx.lineWidth = 1 + r(seed + i * 5 + 3) * 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = yBase + Math.sin(x * lineFreq + phase) * lineAmp;
      if (x === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDotPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 45, 60);
  ctx.fillStyle = color;

  const variant = (r(seed) * 3) | 0;
  const spacing = 15 + (r(seed + 1) * 20) | 0;

  if (variant === 0) {
    // Uniform dots
    ctx.globalAlpha = 0.2;
    const dotR = 1.5 + r(seed + 2) * 2;
    for (let y = spacing; y < h; y += spacing) {
      for (let x = spacing; x < w; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (variant === 1) {
    // Varying size dots
    for (let y = spacing; y < h; y += spacing) {
      for (let x = spacing; x < w; x += spacing) {
        const size = 1 + r(seed + x * 3 + y * 7) * 4;
        ctx.globalAlpha = 0.1 + r(seed + x * 5 + y * 11) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Polka dots (large + small)
    const bigSpace = spacing * 3;
    ctx.globalAlpha = 0.15;
    for (let y = bigSpace; y < h; y += bigSpace) {
      for (let x = bigSpace; x < w; x += bigSpace) {
        ctx.beginPath();
        ctx.arc(x, y, 6 + r(seed + x + y) * 4, 0, Math.PI * 2);
        ctx.fill();
        // Small surrounding dots
        ctx.globalAlpha = 0.08;
        for (let a = 0; a < 4; a++) {
          const angle = a * Math.PI / 2 + 0.4;
          ctx.beginPath();
          ctx.arc(x + Math.cos(angle) * spacing, y + Math.sin(angle) * spacing, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 0.15;
      }
    }
  }
  ctx.restore();
}

function drawGradientPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const variant = (r(seed) * 3) | 0;

  if (variant === 0) {
    // Radial circles
    const cx = r(seed + 1) * w;
    const cy = r(seed + 2) * h;
    for (let i = 8; i > 0; i--) {
      const radius = (i / 8) * Math.max(w, h);
      const hue = (r(seed + i) * 360) | 0;
      ctx.fillStyle = hsla(hue, 40, 50, 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (variant === 1) {
    // Diagonal stripes
    ctx.globalAlpha = 0.08;
    const stripeW = 20 + (r(seed + 1) * 30) | 0;
    const angle = r(seed + 2) * Math.PI;
    const hue = (r(seed + 3) * 360) | 0;
    ctx.fillStyle = hsl(hue, 40, 60);
    for (let i = -h; i < w + h; i += stripeW * 2) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);
      ctx.fillRect(i - w, -h, stripeW, h * 3);
      ctx.restore();
    }
  } else {
    // Concentric rectangles
    ctx.globalAlpha = 0.06;
    for (let i = 10; i > 0; i--) {
      const hue = (r(seed + i) * 360) | 0;
      ctx.fillStyle = hsl(hue, 35, 50);
      const margin = i * Math.min(w, h) * 0.05;
      const rotation = r(seed + i + 50) * 0.1;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rotation);
      ctx.fillRect(-w / 2 + margin, -h / 2 + margin, w - margin * 2, h - margin * 2);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawKanjiPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 40, 55);
  const kanji = '学問道心夢花風月水火山木天人美力理知愛光音';

  const count = 4 + (r(seed + 1) * 6) | 0;
  for (let i = 0; i < count; i++) {
    const char = kanji[(r(seed + i * 3) * kanji.length) | 0];
    const x = r(seed + i * 3 + 1) * w * 0.8 + w * 0.1;
    const y = r(seed + i * 3 + 2) * h * 0.8 + h * 0.1;
    const size = 40 + r(seed + i * 5) * 80;
    const rotation = (r(seed + i * 5 + 1) - 0.5) * 0.5;
    ctx.globalAlpha = 0.06 + r(seed + i * 5 + 2) * 0.1;
    ctx.fillStyle = color;
    ctx.font = `${size}px serif`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawNaturePattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 40, 55);
  const variant = (r(seed) * 4) | 0;

  if (variant === 0) {
    // Mountains
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12;
    for (let layer = 0; layer < 4; layer++) {
      ctx.globalAlpha = 0.06 + layer * 0.03;
      const baseY = h * 0.4 + layer * h * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 3) {
        const peak = Math.sin(x * 0.008 + r(seed + layer) * 10) * h * 0.15
          + Math.sin(x * 0.015 + r(seed + layer + 10) * 5) * h * 0.08
          + Math.sin(x * 0.003 + r(seed + layer + 20) * 3) * h * 0.12;
        ctx.lineTo(x, baseY - peak);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
  } else if (variant === 1) {
    // Leaves
    ctx.fillStyle = color;
    for (let i = 0; i < 15; i++) {
      const lx = r(seed + i * 3) * w;
      const ly = r(seed + i * 3 + 1) * h;
      const size = 10 + r(seed + i * 3 + 2) * 25;
      const rot = r(seed + i * 4) * Math.PI * 2;
      ctx.globalAlpha = 0.08 + r(seed + i * 5) * 0.1;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.5, -size * 0.3, 0, size);
      ctx.quadraticCurveTo(-size * 0.5, -size * 0.3, 0, -size);
      ctx.fill();
      // Stem
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size * 0.5);
      ctx.stroke();
      ctx.restore();
    }
  } else if (variant === 2) {
    // Flowers
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      const fx = r(seed + i * 3) * w;
      const fy = r(seed + i * 3 + 1) * h;
      const size = 12 + r(seed + i * 3 + 2) * 20;
      const petals = 5 + (r(seed + i * 4) * 4) | 0;
      ctx.globalAlpha = 0.1 + r(seed + i * 5) * 0.1;
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(fx + Math.cos(angle) * size * 0.5, fy + Math.sin(angle) * size * 0.5, size * 0.4, size * 0.2, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(fx, fy, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Stars / sparkles
    ctx.fillStyle = color;
    for (let i = 0; i < 25; i++) {
      const sx = r(seed + i * 2) * w;
      const sy = r(seed + i * 2 + 1) * h;
      const size = 2 + r(seed + i * 3) * 5;
      ctx.globalAlpha = 0.1 + r(seed + i * 4) * 0.15;
      ctx.beginPath();
      for (let p = 0; p < 4; p++) {
        const angle = (p / 4) * Math.PI * 2;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * size, sy + Math.sin(angle) * size);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawAbstractPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const variant = (r(seed) * 3) | 0;

  if (variant === 0) {
    // Bokeh circles
    for (let i = 0; i < 20; i++) {
      const cx = r(seed + i * 3) * w;
      const cy = r(seed + i * 3 + 1) * h;
      const radius = 20 + r(seed + i * 3 + 2) * 60;
      const hue = (r(seed + i * 4) * 360) | 0;
      ctx.globalAlpha = 0.04 + r(seed + i * 5) * 0.06;
      ctx.fillStyle = hsl(hue, 50, 60);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hsl(hue, 50, 70);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.08;
      ctx.stroke();
    }
  } else if (variant === 1) {
    // Curves
    const hue = (r(seed + 100) * 360) | 0;
    ctx.strokeStyle = hsl(hue, 45, 60);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 15; i++) {
      ctx.globalAlpha = 0.08 + r(seed + i) * 0.1;
      ctx.beginPath();
      const startY = r(seed + i * 3) * h;
      ctx.moveTo(0, startY);
      const cp1x = w * 0.25;
      const cp1y = r(seed + i * 3 + 1) * h;
      const cp2x = w * 0.75;
      const cp2y = r(seed + i * 3 + 2) * h;
      const endY = r(seed + i * 4) * h;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, w, endY);
      ctx.stroke();
    }
  } else {
    // Splatter
    const hue = (r(seed + 100) * 360) | 0;
    ctx.fillStyle = hsl(hue, 50, 60);
    for (let i = 0; i < 40; i++) {
      const sx = r(seed + i * 2) * w;
      const sy = r(seed + i * 2 + 1) * h;
      const size = 2 + r(seed + i * 3) * 15;
      ctx.globalAlpha = 0.05 + r(seed + i * 4) * 0.1;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few bigger ones
    for (let i = 0; i < 5; i++) {
      const sx = r(seed + 200 + i * 2) * w;
      const sy = r(seed + 200 + i * 2 + 1) * h;
      const size = 25 + r(seed + 200 + i * 3) * 40;
      ctx.globalAlpha = 0.03 + r(seed + 200 + i * 4) * 0.04;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMinimalPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 30, 50);
  const variant = (r(seed) * 3) | 0;

  if (variant === 0) {
    // Single horizontal line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    const y = h * 0.3 + r(seed + 1) * h * 0.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, y);
    ctx.lineTo(w * 0.9, y);
    ctx.stroke();
  } else if (variant === 1) {
    // Corner accent
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.2;
    const len = 40 + r(seed + 1) * 60;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(w * 0.05, w * 0.05 + len);
    ctx.lineTo(w * 0.05, w * 0.05);
    ctx.lineTo(w * 0.05 + len, w * 0.05);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w * 0.95 - len, h * 0.95);
    ctx.lineTo(w * 0.95, h * 0.95);
    ctx.lineTo(w * 0.95, h * 0.95 - len);
    ctx.stroke();
  } else {
    // Thin ruled lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;
    const spacing = 25 + (r(seed + 1) * 15) | 0;
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(w * 0.08, y);
      ctx.lineTo(w * 0.92, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAcademicPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 30, 55);
  const variant = (r(seed) * 3) | 0;

  if (variant === 0) {
    // Ruled notebook lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.15;
    const spacing = 28;
    const margin = w * 0.12;
    for (let y = h * 0.15; y < h * 0.85; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }
    // Red margin line
    ctx.strokeStyle = hsl(0, 50, 50);
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(margin + 30, h * 0.15);
    ctx.lineTo(margin + 30, h * 0.85);
    ctx.stroke();
  } else if (variant === 1) {
    // Book spine pattern
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.15;
    // Spine on left
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, 0, w * 0.06, h);
    // Lines on right
    ctx.globalAlpha = 0.12;
    for (let y = h * 0.1; y < h * 0.9; y += 30) {
      ctx.beginPath();
      ctx.moveTo(w * 0.15, y);
      ctx.lineTo(w * 0.85, y);
      ctx.stroke();
    }
  } else {
    // Grid + margin
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.1;
    const gridSize = 25;
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = gridSize; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Heavier lines every 5
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.12;
    for (let x = gridSize * 5; x < w; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = gridSize * 5; y < h; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMandalaPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 40, 55);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const cx = w / 2 + (r(seed + 1) - 0.5) * w * 0.2;
  const cy = h / 2 + (r(seed + 2) - 0.5) * h * 0.2;
  const maxR = Math.min(w, h) * 0.42;
  const layers = 3 + (r(seed + 3) * 3) | 0;
  const petalsBase = 6 + (r(seed + 4) * 6) | 0;

  ctx.globalAlpha = 0.15;
  for (let layer = 1; layer <= layers; layer++) {
    const layerR = (layer / layers) * maxR;
    const petals = petalsBase + layer;
    ctx.globalAlpha = 0.06 + (layer / layers) * 0.1;
    // Draw petal ring
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2 + layer * 0.15;
      const petalLen = layerR * 0.4;
      const petalW = layerR * 0.18;
      const px = cx + Math.cos(angle) * layerR * 0.55;
      const py = cy + Math.sin(angle) * layerR * 0.55;
      ctx.beginPath();
      ctx.ellipse(px, py, petalLen, petalW, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ring circle
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, layerR * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Center circle
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawConstellationPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 45, 65);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const starCount = 15 + (r(seed + 1) * 20) | 0;
  const stars: { x: number; y: number }[] = [];

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: r(seed + i * 2 + 10) * w,
      y: r(seed + i * 2 + 11) * h,
    });
  }
  // Connect nearby stars with lines
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 0.7;
  for (let i = 0; i < stars.length; i++) {
    const connections = 1 + (r(seed + i + 100) * 3) | 0;
    const sorted = stars
      .map((s, idx) => ({ ...s, idx, dist: Math.hypot(s.x - stars[i].x, s.y - stars[i].y) }))
      .filter(s => s.idx !== i)
      .sort((a, b) => a.dist - b.dist);
    for (let c = 0; c < Math.min(connections, sorted.length); c++) {
      const maxDist = Math.min(w, h) * 0.4;
      if (sorted[c].dist < maxDist) {
        ctx.globalAlpha = 0.05 + (1 - sorted[c].dist / maxDist) * 0.1;
        ctx.beginPath();
        ctx.moveTo(stars[i].x, stars[i].y);
        ctx.lineTo(sorted[c].x, sorted[c].y);
        ctx.stroke();
      }
    }
  }
  // Draw star dots
  for (let i = 0; i < stars.length; i++) {
    const size = 1.5 + r(seed + i + 200) * 3;
    ctx.globalAlpha = 0.2 + r(seed + i + 300) * 0.2;
    ctx.beginPath();
    ctx.arc(stars[i].x, stars[i].y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBotanicalPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 40, 50);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const branchCount = 3 + (r(seed + 1) * 4) | 0;

  for (let b = 0; b < branchCount; b++) {
    const startX = r(seed + b * 5) * w;
    const startY = h + 10;
    const endX = startX + (r(seed + b * 5 + 1) - 0.5) * w * 0.4;
    const endY = r(seed + b * 5 + 2) * h * 0.5;
    const cpX = (startX + endX) / 2 + (r(seed + b * 5 + 3) - 0.5) * w * 0.3;
    const cpY = (startY + endY) / 2;

    // Main stem
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();

    // Leaves along the stem
    const leafCount = 4 + (r(seed + b * 5 + 4) * 6) | 0;
    for (let l = 0; l < leafCount; l++) {
      const t = (l + 1) / (leafCount + 1);
      const lx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * endX;
      const ly = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * endY;
      const side = l % 2 === 0 ? 1 : -1;
      const leafLen = 8 + r(seed + b * 20 + l * 3) * 18;
      const leafAngle = Math.atan2(endY - startY, endX - startX) + side * (0.4 + r(seed + b * 20 + l * 3 + 1) * 0.6);

      ctx.globalAlpha = 0.08 + r(seed + b * 20 + l * 3 + 2) * 0.08;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(leafAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(leafLen * 0.5, -leafLen * 0.25, leafLen, 0);
      ctx.quadraticCurveTo(leafLen * 0.5, leafLen * 0.25, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawOrigamiPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 35, 55);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const triCount = 12 + (r(seed + 1) * 16) | 0;

  for (let i = 0; i < triCount; i++) {
    const cx = r(seed + i * 4 + 10) * w;
    const cy = r(seed + i * 4 + 11) * h;
    const size = 15 + r(seed + i * 4 + 12) * 45;
    const rotation = r(seed + i * 4 + 13) * Math.PI * 2;
    ctx.globalAlpha = 0.06 + r(seed + i * 4 + 14) * 0.1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Draw a triangle
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(-size * 0.5, size * 0.4);
    ctx.lineTo(size * 0.5, size * 0.4);
    ctx.closePath();

    if (r(seed + i * 4 + 15) > 0.6) {
      ctx.fill();
    }
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fold line inside
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(0, size * 0.4);
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();
}

function drawWatercolorPattern(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = seededRandom;
  ctx.save();
  const accentH = (r(seed + 100) * 360) | 0;
  const color = hsl(accentH, 45, 60);
  ctx.fillStyle = color;
  const blobCount = 10 + (r(seed + 1) * 12) | 0;

  for (let i = 0; i < blobCount; i++) {
    const cx = r(seed + i * 3 + 10) * w;
    const cy = r(seed + i * 3 + 11) * h;
    const radius = 25 + r(seed + i * 3 + 12) * 60;
    ctx.globalAlpha = 0.03 + r(seed + i * 3 + 13) * 0.06;

    // Soft blob using multiple overlapping circles
    const subCircles = 5 + (r(seed + i * 3 + 14) * 4) | 0;
    for (let s = 0; s < subCircles; s++) {
      const ox = (r(seed + i * 10 + s * 2 + 50) - 0.5) * radius * 0.8;
      const oy = (r(seed + i * 10 + s * 2 + 51) - 0.5) * radius * 0.8;
      const subR = radius * (0.4 + r(seed + i * 10 + s * 2 + 52) * 0.6);
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, subR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* ============================================================
   COLLECTION DEFINITIONS
   ============================================================ */

interface CoverCollection {
  name: string;
  colorStyle: 'warm' | 'cool' | 'earth' | 'neon' | 'pastel' | 'dark' | 'mono' | 'japan';
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) => void;
}

const COLLECTIONS: CoverCollection[] = [
  { name: 'Japonês', colorStyle: 'japan', draw: drawJapanesePattern },
  { name: 'Geométrico', colorStyle: 'cool', draw: drawGeometricPattern },
  { name: 'Ondas', colorStyle: 'cool', draw: drawWavePattern },
  { name: 'Pontilhismo', colorStyle: 'pastel', draw: drawDotPattern },
  { name: 'Gradiente', colorStyle: 'warm', draw: drawGradientPattern },
  { name: 'Kanji', colorStyle: 'dark', draw: drawKanjiPattern },
  { name: 'Natureza', colorStyle: 'earth', draw: drawNaturePattern },
  { name: 'Abstrato', colorStyle: 'neon', draw: drawAbstractPattern },
  { name: 'Minimalista', colorStyle: 'mono', draw: drawMinimalPattern },
  { name: 'Acadêmico', colorStyle: 'dark', draw: drawAcademicPattern },
  { name: 'Mandala', colorStyle: 'pastel', draw: drawMandalaPattern },
  { name: 'Constelação', colorStyle: 'dark', draw: drawConstellationPattern },
  { name: 'Botânico', colorStyle: 'earth', draw: drawBotanicalPattern },
  { name: 'Origami', colorStyle: 'cool', draw: drawOrigamiPattern },
  { name: 'Aquarela', colorStyle: 'pastel', draw: drawWatercolorPattern },
];

const COVERS_PER_COLLECTION = 130;
const TOTAL_COVERS = COLLECTIONS.length * COVERS_PER_COLLECTION;

/* ============================================================
   COVER OBJECT INTERFACE
   ============================================================ */

interface CoverPreset {
  id: string;
  name: string;
  category: string;
  bg1: string;
  bg2: string;
  bg3: string;
  textColor: string;
  accentColor: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/* Generate covers lazily — build full list only when category/search filters it */
let _allCovers: CoverPreset[] | null = null;

function getAllCovers(): CoverPreset[] {
  if (_allCovers) return _allCovers;
  const covers: CoverPreset[] = [];
  COLLECTIONS.forEach((col, colIdx) => {
    for (let i = 0; i < COVERS_PER_COLLECTION; i++) {
      const seed = colIdx * 10000 + i;
      const palette = generatePalette(seed, col.colorStyle);
      covers.push({
        id: `cover-${seed}`,
        name: `${col.name} #${i + 1}`,
        category: col.name,
        bg1: palette.bg1,
        bg2: palette.bg2,
        bg3: palette.bg3,
        textColor: palette.textColor,
        accentColor: palette.accentColor,
        draw: (ctx, w, h) => col.draw(ctx, w, h, seed),
      });
    }
  });
  _allCovers = covers;
  return covers;
}

function getCoversByCategory(category: string): CoverPreset[] {
  const all = getAllCovers();
  if (category === 'Todos') return all;
  return all.filter(c => c.category === category);
}

const CATEGORIES = ['Todos', ...COLLECTIONS.map(c => c.name)];

const PAGE_SIZE = 48;

/* ============================================================
   COVER PREVIEW (small canvas, renders on mount)
   ============================================================ */

function CoverPreview({ cover, isSelected, onClick }: { cover: CoverPreset; isSelected: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Background gradient
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, cover.bg1);
    grd.addColorStop(0.5, cover.bg2);
    grd.addColorStop(1, cover.bg3);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Pattern
    cover.draw(ctx, w, h);
  }, [cover]);

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all active:scale-95 ${
        isSelected
          ? 'border-[var(--ws-accent)] shadow-md'
          : 'border-transparent hover:border-[var(--ws-glass-border)]'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={120}
        height={160}
        className="h-full w-full"
        style={{ imageRendering: 'auto' }}
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
        <p className="text-[9px] font-medium text-white truncate">{cover.name}</p>
      </div>
    </button>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export function CoversView() {
  const [selectedCover, setSelectedCover] = useState<CoverPreset | null>(() => getAllCovers()[0]);
  const [title, setTitle] = useState('Meu Caderno');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredCovers = useMemo(() => {
    const covers = getCoversByCategory(category);
    if (!search) return covers;
    const q = search.toLowerCase();
    return covers.filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [category, search]);

  const visibleCovers = useMemo(() => {
    return filteredCovers.slice(0, page * PAGE_SIZE);
  }, [filteredCovers, page]);

  const hasMore = page * PAGE_SIZE < filteredCovers.length;

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const downloadCover = () => {
    if (!selectedCover) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1200;
    canvas.height = 1600;

    // Background gradient
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grd.addColorStop(0, selectedCover.bg1);
    grd.addColorStop(0.5, selectedCover.bg2);
    grd.addColorStop(1, selectedCover.bg3);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1200, 1600);

    // Pattern
    selectedCover.draw(ctx, 1200, 1600);

    // Border
    ctx.strokeStyle = selectedCover.accentColor + '80';
    ctx.lineWidth = 3;
    ctx.strokeRect(35, 35, 1130, 1530);

    // Title
    ctx.fillStyle = selectedCover.textColor;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 600, 780);

    // Subtitle
    if (subtitle) {
      ctx.font = '32px sans-serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText(subtitle, 600, 830);
      ctx.globalAlpha = 1;
    }

    // Download
    const link = document.createElement('a');
    link.download = `capa-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast({ title: 'Capa baixada!', description: 'Sua capa de caderno foi salva.' });
  };

  // Preview canvas for the selected cover
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !selectedCover) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, selectedCover.bg1);
    grd.addColorStop(0.5, selectedCover.bg2);
    grd.addColorStop(1, selectedCover.bg3);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    selectedCover.draw(ctx, w, h);

    // Border
    ctx.strokeStyle = selectedCover.accentColor + '60';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // Title
    ctx.fillStyle = selectedCover.textColor;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Título do Caderno', w / 2, h * 0.48);

    if (subtitle) {
      ctx.font = '12px sans-serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText(subtitle, w / 2, h * 0.52);
      ctx.globalAlpha = 1;
    }
  }, [selectedCover, title, subtitle]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Todos': TOTAL_COVERS };
    COLLECTIONS.forEach(col => {
      counts[col.name] = COVERS_PER_COLLECTION;
    });
    return counts;
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ws-text-primary)]" style={{ fontFamily: 'var(--font-serif-jp), serif' }}>
          Capas de Caderno
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
          {TOTAL_COVERS} designs disponíveis — Crie capas personalizadas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div
            className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg shadow-xl"
            style={{ aspectRatio: '3/4' }}
          >
            <canvas
              ref={previewCanvasRef}
              width={300}
              height={400}
              className="h-full w-full"
            />
          </div>
          <button
            onClick={downloadCover}
            className="flex items-center justify-center gap-2 rounded-ws-button bg-[var(--ws-accent)] px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Download size={16} /> Baixar Capa PNG
          </button>
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-surface)] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ws-text-primary)]">
              <Type size={14} /> Personalizar
            </h3>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título do caderno"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Subtítulo (opcional)"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Buscar capa..."
                className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] py-2 pl-9 pr-3 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-[var(--ws-accent)] text-white'
                    : 'bg-[var(--ws-surface)] text-[var(--ws-text-secondary)] hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]'
                }`}
              >
                {cat} ({categoryCounts[cat]})
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {visibleCovers.map(cover => (
              <CoverPreview
                key={cover.id}
                cover={cover}
                isSelected={selectedCover?.id === cover.id}
                onClick={() => setSelectedCover(cover)}
              />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="mx-auto flex items-center gap-2 rounded-ws-button border border-[var(--ws-glass-border)] bg-[var(--ws-surface)] px-6 py-2.5 text-sm font-medium text-[var(--ws-text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)] hover:text-[var(--ws-accent)]"
            >
              <ChevronDown size={16} />
              Carregar mais ({filteredCovers.length - page * PAGE_SIZE} restantes)
            </button>
          )}
          {filteredCovers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--ws-text-tertiary)]">
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Nenhuma capa encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
