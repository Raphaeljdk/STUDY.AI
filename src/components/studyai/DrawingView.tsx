/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pen, Eraser, Trash2, Undo2, Redo2, Download, ZoomIn, ZoomOut,
  Grid3x3, Square, Circle, Minus, ArrowRight, Type, Ruler, DoorOpen,
  Home as HomeIcon, Palette, MinusSquare, Maximize2, type LucideIcon,
} from 'lucide-react';

interface DrawingViewProps { onNavigate?: (tab: string) => void }
type DrawingMode = 'artistic' | 'technical' | 'architecture';
type Tool = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'wall' | 'room' | 'door' | 'window' | 'dimension';
interface Pt { x: number; y: number }

const COLORS = [
  '#1A1A1A', '#D93838', '#264653', '#5B8C5A', '#B8A088', '#C04020',
  '#D07088', '#7A9EAD', '#8B7355', '#6B3A5B', '#4A6741', '#F5F0E8',
];

const MODE_TABS: { id: DrawingMode; label: string; icon: LucideIcon }[] = [
  { id: 'artistic', label: 'Artistico', icon: Pen },
  { id: 'technical', label: 'Tecnico', icon: Ruler },
  { id: 'architecture', label: 'Arquitetura', icon: HomeIcon },
];

const TOOLS: Record<DrawingMode, { id: Tool; icon: LucideIcon; label: string }[]> = {
  artistic: [
    { id: 'brush', icon: Pen, label: 'Pincel' },
    { id: 'eraser', icon: Eraser, label: 'Borracha' },
  ],
  technical: [
    { id: 'line', icon: Minus, label: 'Linha' },
    { id: 'rectangle', icon: Square, label: 'Retangulo' },
    { id: 'circle', icon: Circle, label: 'Circulo' },
    { id: 'arrow', icon: ArrowRight, label: 'Seta' },
    { id: 'text', icon: Type, label: 'Texto' },
  ],
  architecture: [
    { id: 'wall', icon: MinusSquare, label: 'Parede' },
    { id: 'room', icon: Square, label: 'Comodo' },
    { id: 'door', icon: DoorOpen, label: 'Porta' },
    { id: 'window', icon: Maximize2, label: 'Janela' },
    { id: 'dimension', icon: Ruler, label: 'Dimensao' },
  ],
};

const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

// ===== Drawing Primitives =====
function strokeLine(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}

function strokeRect(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
}

function strokeEllipse(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  const rx = Math.max(1, Math.abs(b.x - a.x) / 2), ry = Math.max(1, Math.abs(b.y - a.y) / 2);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
}

function strokeArrow(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const h = Math.max(12, ctx.lineWidth * 3);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  strokeLine(ctx, a, b);
  ctx.beginPath(); ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - h * Math.cos(ang - Math.PI / 6), b.y - h * Math.sin(ang - Math.PI / 6));
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - h * Math.cos(ang + Math.PI / 6), b.y - h * Math.sin(ang + Math.PI / 6));
  ctx.stroke();
}

function strokeDoor(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;
  const ang = Math.atan2(dy, dx);
  strokeLine(ctx, a, b);
  ctx.beginPath();
  ctx.arc(a.x, a.y, len, ang + Math.PI, ang + 1.5 * Math.PI);
  ctx.stroke();
  strokeLine(ctx, a, { x: a.x + len * Math.cos(ang + 1.5 * Math.PI), y: a.y + len * Math.sin(ang + 1.5 * Math.PI) });
}

function strokeWindow(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;
  const ang = Math.atan2(dy, dx);
  const px = -Math.sin(ang) * 4, py = Math.cos(ang) * 4;
  strokeLine(ctx, { x: a.x + px, y: a.y + py }, { x: b.x + px, y: b.y + py });
  strokeLine(ctx, { x: a.x - px, y: a.y - py }, { x: b.x - px, y: b.y - py });
  strokeLine(ctx, { x: a.x + px, y: a.y + py }, { x: a.x - px, y: a.y - py });
  strokeLine(ctx, { x: b.x + px, y: b.y + py }, { x: b.x - px, y: b.y - py });
}

function strokeDimension(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return;
  const ang = Math.atan2(dy, dx);
  const px = -Math.sin(ang) * 8, py = Math.cos(ang) * 8;
  const ox = px * 0.6, oy = py * 0.6;
  strokeLine(ctx, a, { x: a.x + px, y: a.y + py });
  strokeLine(ctx, b, { x: b.x + px, y: b.y + py });
  strokeLine(ctx, { x: a.x + ox, y: a.y + oy }, { x: b.x + ox, y: b.y + oy });
  const hl = 6;
  const mkArr = (p: Pt, dir: number) => {
    strokeLine(ctx, p, { x: p.x + dir * hl * Math.cos(ang - Math.PI / 6), y: p.y + dir * hl * Math.sin(ang - Math.PI / 6) });
    strokeLine(ctx, p, { x: p.x + dir * hl * Math.cos(ang + Math.PI / 6), y: p.y + dir * hl * Math.sin(ang + Math.PI / 6) });
  };
  mkArr({ x: a.x + ox, y: a.y + oy }, 1);
  mkArr({ x: b.x + ox, y: b.y + oy }, -1);
  const mx = (a.x + b.x) / 2 + ox, my = (a.y + b.y) / 2 + oy;
  const fs = Math.max(10, Math.min(14, len / 8));
  const txt = `${Math.round(len)}px`;
  ctx.save();
  ctx.font = `${fs}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  const tw = ctx.measureText(txt).width + 6, th = fs + 2;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx - tw / 2, my - th, tw, th);
  ctx.fillStyle = ctx.strokeStyle || '#1A1A1A'; ctx.fillText(txt, mx, my - 2);
  ctx.restore();
}

type DrawFn = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt) => void;
const SHAPE_FNS: Record<string, DrawFn> = {
  line: strokeLine, rectangle: strokeRect, circle: strokeEllipse, arrow: strokeArrow,
  door: strokeDoor, window: strokeWindow, dimension: strokeDimension, room: strokeRect,
};

export default function DrawingView({ onNavigate }: DrawingViewProps) {
  const [mode, setMode] = useState<DrawingMode>('artistic');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#1A1A1A');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showPalette, setShowPalette] = useState(false);
  const [textInput, setTextInput] = useState<Pt | null>(null);
  const [textVal, setTextVal] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const startRef = useRef<Pt>({ x: 0, y: 0 });
  const lastRef = useRef<Pt>({ x: 0, y: 0 });
  const histRef = useRef<ImageData[]>([]);
  const histIdx = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ===== Canvas Init =====
  const initCanvas = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.floor(r.width), h = Math.floor(r.height);
    const m = mainRef.current, o = overlayRef.current;
    if (m) { m.width = w; m.height = h; const c = m.getContext('2d', { willReadFrequently: true }); if (c) { c.fillStyle = '#FFF'; c.fillRect(0, 0, w, h); } }
    if (o) { o.width = w; o.height = h; }
    histRef.current = []; histIdx.current = -1; saveSnap();
  }, []);

  useEffect(() => { initCanvas(); window.addEventListener('resize', initCanvas); return () => window.removeEventListener('resize', initCanvas); }, [initCanvas]);

  // ===== History =====
  const saveSnap = useCallback(() => {
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const arr = histRef.current.slice(0, histIdx.current + 1);
    arr.push(d);
    if (arr.length > 30) arr.shift(); else histIdx.current++;
    histRef.current = arr;
    setCanUndo(histIdx.current > 0); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (histIdx.current <= 0) return; histIdx.current--;
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.putImageData(histRef.current[histIdx.current], 0, 0);
    setCanUndo(histIdx.current > 0); setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current >= histRef.current.length - 1) return; histIdx.current++;
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.putImageData(histRef.current[histIdx.current], 0, 0);
    setCanUndo(true); setCanRedo(histIdx.current < histRef.current.length - 1);
  }, []);

  // ===== Coords =====
  const getPt = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Pt => {
    const cv = mainRef.current; if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    let cx: number, cy: number;
    if ('touches' in e) { const t = e.touches[0] || e.changedTouches[0]; cx = t.clientX; cy = t.clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    return { x: (cx - r.left) / zoom, y: (cy - r.top) / zoom };
  }, [zoom]);

  // ===== Setup Context =====
  const setupCtx = useCallback((ctx: CanvasRenderingContext2D) => {
    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF'; ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 1; ctx.lineWidth = brushSize * 2;
    } else {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = opacity;
      ctx.lineWidth = tool === 'wall' ? 12 : brushSize;
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, [tool, color, brushSize, opacity]);

  // ===== Grid =====
  const drawGrid = useCallback(() => {
    const c = overlayRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const gs = 20 * zoom;
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < c.width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke(); }
    for (let y = 0; y < c.height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke(); }
  }, [zoom]);

  useEffect(() => {
    if (showGrid) drawGrid();
    else { const c = overlayRef.current; if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); } }
  }, [showGrid, drawGrid]);

  // ===== Draw shape on given context =====
  const drawShapeOn = useCallback((ctx: CanvasRenderingContext2D, a: Pt, b: Pt) => {
    const fn = SHAPE_FNS[tool];
    if (fn) fn(ctx, a, b);
    if (tool === 'room') {
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const rw = Math.abs(b.x - a.x), rh = Math.abs(b.y - a.y);
      const fs = Math.max(10, Math.min(16, rw / 6, rh / 4));
      ctx.save(); ctx.font = `${fs}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.6; ctx.fillText('Comodo', cx, cy); ctx.restore();
    }
  }, [tool]);

  // ===== Pointer Handlers =====
  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (textInput) return;
    const pt = getPt(e);
    if (tool === 'text') { setTextInput(pt); setTextVal(''); return; }
    drawingRef.current = true;
    startRef.current = pt; lastRef.current = pt;
    if (tool === 'brush' || tool === 'eraser' || tool === 'wall') {
      const c = mainRef.current; if (!c) return;
      const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
      setupCtx(ctx); ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x + 0.1, pt.y + 0.1); ctx.stroke();
    }
  }, [tool, textInput, getPt, setupCtx]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const pt = getPt(e);
    if (tool === 'brush' || tool === 'eraser' || tool === 'wall') {
      const c = mainRef.current; if (!c) return;
      const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
      setupCtx(ctx); ctx.beginPath(); ctx.moveTo(lastRef.current.x, lastRef.current.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      lastRef.current = pt; return;
    }
    const oc = overlayRef.current; if (!oc) return;
    const octx = oc.getContext('2d'); if (!octx) return;
    octx.clearRect(0, 0, oc.width, oc.height);
    if (showGrid) drawGrid();
    octx.save(); octx.scale(zoom, zoom); setupCtx(octx);
    drawShapeOn(octx, startRef.current, pt);
    octx.restore();
  }, [tool, getPt, zoom, setupCtx, showGrid, drawGrid, drawShapeOn]);

  const handleEnd = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    if (tool === 'brush' || tool === 'eraser' || tool === 'wall') { saveSnap(); return; }
    ctx.save(); setupCtx(ctx);
    drawShapeOn(ctx, startRef.current, lastRef.current);
    ctx.restore();
    const oc = overlayRef.current;
    if (oc) { const octx = oc.getContext('2d'); if (octx) octx.clearRect(0, 0, oc.width, oc.height); if (showGrid) drawGrid(); }
    saveSnap();
  }, [tool, setupCtx, saveSnap, showGrid, drawGrid, drawShapeOn]);

  // ===== Text Commit =====
  const commitText = useCallback(() => {
    if (!textInput || !textVal.trim()) { setTextInput(null); setTextVal(''); return; }
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.save(); ctx.font = `${Math.max(14, brushSize * 3)}px sans-serif`;
    ctx.fillStyle = color; ctx.globalAlpha = opacity; ctx.textBaseline = 'top';
    ctx.fillText(textVal, textInput.x, textInput.y); ctx.restore();
    setTextInput(null); setTextVal(''); saveSnap();
  }, [textInput, textVal, color, opacity, brushSize, saveSnap]);

  // ===== Actions =====
  const clearCanvas = useCallback(() => {
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); saveSnap();
  }, [saveSnap]);

  const savePng = useCallback(() => {
    const c = mainRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = 'desenho.png'; a.href = c.toDataURL('image/png'); a.click();
  }, []);

  const zi = ZOOMS.indexOf(zoom);
  const zoomIn = useCallback(() => { const i = ZOOMS.indexOf(zoom); if (i < ZOOMS.length - 1) setZoom(ZOOMS[i + 1]); }, [zoom]);
  const zoomOut = useCallback(() => { const i = ZOOMS.indexOf(zoom); if (i > 0) setZoom(ZOOMS[i - 1]); }, [zoom]);
  const switchMode = useCallback((m: DrawingMode) => { setMode(m); setTool(TOOLS[m][0].id); }, []);

  const tools = TOOLS[mode];
  const btnCls = (t: string) => `flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer ${tool === t ? 'text-white' : 'hover:opacity-80'}`;
  const accent = 'var(--ws-accent)';
  const border = 'var(--ws-glass-border)';
  const glass = 'var(--ws-glass)';
  const txtSec = 'var(--ws-text-secondary)';
  const txtTer = 'var(--ws-text-tertiary)';

  const renderToolBtns = () => tools.map((t) => {
    const Ic = t.icon;
    return (
      <button key={t.id} onClick={() => setTool(t.id)} className={btnCls(t.id)}
        style={{ background: tool === t.id ? accent : 'transparent', color: tool === t.id ? '#FFF' : txtSec }} title={t.label}>
        <Ic size={16} />
      </button>
    );
  });

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--ws-bg)' }}>
      {/* TOP BAR */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b" style={{ borderColor: border, background: glass, color: 'var(--ws-text-primary)' }}>
        {MODE_TABS.map((tab) => {
          const Ic = tab.icon; const act = mode === tab.id;
          return (
            <button key={tab.id} onClick={() => switchMode(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: act ? accent : 'transparent', color: act ? '#FFF' : txtSec }} title={tab.label}>
              <Ic size={15} /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
        <div className="w-px h-6 mx-1" style={{ background: border }} />

        {/* Color */}
        <div className="relative">
          <button onClick={() => setShowPalette(v => !v)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: txtSec }} title="Paleta de cores">
            <Palette size={15} />
            <span className="w-4 h-4 rounded-full border" style={{ background: color, borderColor: border }} />
          </button>
          <AnimatePresence>
            {showPalette && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 p-2 rounded-xl shadow-lg z-50"
                style={{ background: glass, border: `1px solid ${border}` }}>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => { setColor(c); setShowPalette(false); }}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: color === c ? accent : border }} />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-6 rounded cursor-pointer" />
                  <span className="text-xs" style={{ color: txtTer }}>Cor personalizada</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: txtTer }}>Tamanho</span>
          <input type="range" min={2} max={30} value={brushSize} onChange={(e) => setBrushSize(+e.target.value)}
            className="w-16 sm:w-20 accent-current" style={{ color: accent }} />
          <span className="text-xs w-5 text-center" style={{ color: txtSec }}>{brushSize}</span>
        </div>

        {/* Opacity - artistic only */}
        {mode === 'artistic' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: txtTer }}>Opacidade</span>
            <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(+e.target.value)}
              className="w-14 sm:w-16 accent-current" style={{ color: accent }} />
            <span className="text-xs w-7 text-center" style={{ color: txtSec }}>{Math.round(opacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col items-center gap-1.5 p-2 border-r" style={{ borderColor: border, background: glass }}>
          {renderToolBtns()}
        </div>

        {/* Canvas Container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair" style={{ background: '#FFFFFF' }}
          onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
          onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
          <canvas ref={mainRef} className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
          <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
          {textInput && (
            <div className="absolute" style={{ left: textInput.x * zoom, top: textInput.y * zoom, zIndex: 10 }}>
              <input autoFocus type="text" value={textVal} onChange={(e) => setTextVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextInput(null); setTextVal(''); } }}
                onBlur={commitText} className="px-1 py-0.5 text-sm border rounded outline-none"
                style={{ borderColor: accent, color: 'var(--ws-text-primary)', minWidth: '120px' }} placeholder="Digite aqui..." />
            </div>
          )}
          {/* Mobile Toolbar */}
          <div className="md:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg"
            style={{ background: glass, border: `1px solid ${border}` }}>
            {renderToolBtns()}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: border, background: glass, color: txtSec }}>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ color: txtSec }} title="Desfazer"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ color: txtSec }} title="Refazer"><Redo2 size={16} /></button>
          <button onClick={clearCanvas} className="p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ color: accent }} title="Limpar"><Trash2 size={16} /></button>
        </div>
        <button onClick={() => setShowGrid(v => !v)} className="p-1.5 rounded-lg transition-colors"
          style={{ color: showGrid ? accent : txtTer }} title="Grade"><Grid3x3 size={16} /></button>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} disabled={zi <= 0} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ color: txtSec }} title="Afastar"><ZoomOut size={16} /></button>
          <span className="text-xs w-10 text-center" style={{ color: txtTer }}>{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zi >= ZOOMS.length - 1} className="p-1.5 rounded-lg transition-colors disabled:opacity-30" style={{ color: txtSec }} title="Aproximar"><ZoomIn size={16} /></button>
          <div className="w-px h-5 mx-1" style={{ background: border }} />
          <button onClick={savePng} className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors" style={{ color: txtSec }} title="Salvar PNG">
            <Download size={14} /><span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
