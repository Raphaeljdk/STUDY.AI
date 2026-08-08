'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  Highlighter,
  Eraser,
  Type,
  MousePointer2,
  Pentagon,
  Undo2,
  Redo2,
  ImagePlus,
  Settings,
  X,
  Minus,
  Square,
  Circle,
  Triangle,
} from 'lucide-react';

/* ========================================================================
   Types
   ======================================================================== */

interface FloatingPenToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImageImport: () => void;
  smoothing: string;
  onSmoothingChange: (level: string) => void;
  stabilizer: number;
  onStabilizerChange: (value: number) => void;
  eraserMode?: string;
  onEraserModeChange?: (mode: string) => void;
  eraserSize?: number;
  onEraserSizeChange?: (size: number) => void;
  highlighterColor?: string;
  onHighlighterColorChange?: (color: string) => void;
  highlighterOpacity?: number;
  onHighlighterOpacityChange?: (opacity: number) => void;
}

/* ========================================================================
   Constants
   ======================================================================== */

const PEN_COLORS = [
  '#000000', '#3b82f6', '#ef4444', '#22c55e',
  '#eab308', '#a855f7', '#f97316',
];

const HIGHLIGHTER_COLORS = [
  '#facc15', '#4ade80', '#f472b6', '#60a5fa', '#fb923c',
];

const PEN_THICKNESSES = [1, 2, 4, 6, 8, 12];

const SMOOTHING_OPTIONS = [
  { value: 'off', label: 'Desativada' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
];

const ERASER_SIZES = [10, 20, 40, 80];

const ERASER_MODES = [
  { value: 'stroke', label: 'Apagar traço' },
  { value: 'area', label: 'Apagar área' },
];

const SHAPE_TOOLS = [
  { id: 'line', label: 'Linha' },
  { id: 'arrow', label: 'Seta' },
  { id: 'rectangle', label: 'Retângulo' },
  { id: 'circle', label: 'Círculo' },
  { id: 'triangle', label: 'Triângulo' },
];

const PRESETS = [
  { id: 'annotation', emoji: '✏️', label: 'Anotação', tool: 'pen', color: '#000000', width: 2, smoothing: 'medium' },
  { id: 'math', emoji: '🧮', label: 'Matemática', tool: 'pen', color: '#3b82f6', width: 1, smoothing: 'high' },
  { id: 'summary', emoji: '📚', label: 'Resumo', tool: 'highlighter', color: '#facc15', width: 8, smoothing: 'off' },
];

type SubPanel = 'pen' | 'highlighter' | 'eraser' | 'text' | 'shapes' | null;

/* ========================================================================
   ShapeIcon helper
   ======================================================================== */

function ShapeIcon({ shape }: { shape: string }) {
  const s = 16;
  switch (shape) {
    case 'line': return <Minus size={s} />;
    case 'arrow': return <Minus size={s} className="rotate-[-45deg]" />;
    case 'rectangle': return <Square size={s} />;
    case 'circle': return <Circle size={s} />;
    case 'triangle': return <Triangle size={s} />;
    default: return null;
  }
}

/* ========================================================================
   Sub-panels
   ======================================================================== */

function PenSubPanel({
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  smoothing,
  onSmoothingChange,
  stabilizer,
  onStabilizerChange,
}: {
  strokeColor: string;
  onStrokeColorChange: (c: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (w: number) => void;
  smoothing: string;
  onSmoothingChange: (l: string) => void;
  stabilizer: number;
  onStabilizerChange: (v: number) => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4 p-3" style={{ minWidth: 180 }}>
      {/* Colors */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Cor
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onStrokeColorChange(c)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: strokeColor === c ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                transform: strokeColor === c ? 'scale(1.15)' : undefined,
              }}
            />
          ))}
          <button
            onClick={() => colorRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed transition-colors"
            style={{ borderColor: 'var(--ws-text-tertiary)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <input
            ref={colorRef}
            type="color"
            className="sr-only"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
          />
        </div>
      </div>

      {/* Thickness */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Espessura
        </p>
        <div className="flex items-center gap-2.5">
          {PEN_THICKNESSES.map((w) => (
            <button
              key={w}
              onClick={() => onStrokeWidthChange(w)}
              className="flex items-center justify-center transition-transform hover:scale-110"
              style={{ width: Math.max(24, w * 2 + 16), height: Math.max(24, w * 2 + 16) }}
              title={`${w}px`}
            >
              <span
                className="rounded-full transition-colors"
                style={{
                  width: Math.max(6, w + 4),
                  height: Math.max(6, w + 4),
                  backgroundColor: strokeWidth === w ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Smoothing */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Suavização
        </p>
        <div className="flex flex-wrap gap-1">
          {SMOOTHING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSmoothingChange(opt.value)}
              className="rounded-ws-button px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: smoothing === opt.value ? 'var(--ws-accent)' : 'transparent',
                color: smoothing === opt.value ? 'var(--ws-text-on-dark)' : 'var(--ws-text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stabilizer */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
            Estabilizador
          </p>
          <span className="text-xs tabular-nums" style={{ color: 'var(--ws-text-secondary)' }}>{stabilizer}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={stabilizer}
          onChange={(e) => onStabilizerChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none rounded-full"
          style={{
            height: 6,
            background: `linear-gradient(to right, var(--ws-accent) ${stabilizer}%, var(--ws-glass-border) ${stabilizer}%)`,
          }}
        />
      </div>
    </div>
  );
}

function HighlighterSubPanel({
  highlighterColor = '#facc15',
  onHighlighterColorChange,
  highlighterOpacity = 40,
  onHighlighterOpacityChange,
}: {
  highlighterColor?: string;
  onHighlighterColorChange?: (c: string) => void;
  highlighterOpacity?: number;
  onHighlighterOpacityChange?: (o: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-3" style={{ minWidth: 180 }}>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Cor
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {HIGHLIGHTER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onHighlighterColorChange?.(c)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: highlighterColor === c ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                transform: highlighterColor === c ? 'scale(1.15)' : undefined,
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
            Opacidade
          </p>
          <span className="text-xs tabular-nums" style={{ color: 'var(--ws-text-secondary)' }}>{highlighterOpacity}%</span>
        </div>
        <input
          type="range"
          min={20}
          max={60}
          value={highlighterOpacity}
          onChange={(e) => onHighlighterOpacityChange?.(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none rounded-full"
          style={{
            height: 6,
            background: `linear-gradient(to right, var(--ws-accent) ${((highlighterOpacity - 20) / 40) * 100}%, var(--ws-glass-border) ${((highlighterOpacity - 20) / 40) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}

function EraserSubPanel({
  eraserMode = 'stroke',
  onEraserModeChange,
  eraserSize = 20,
  onEraserSizeChange,
}: {
  eraserMode?: string;
  onEraserModeChange?: (m: string) => void;
  eraserSize?: number;
  onEraserSizeChange?: (s: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-3" style={{ minWidth: 180 }}>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Modo
        </p>
        <div className="flex gap-1">
          {ERASER_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onEraserModeChange?.(m.value)}
              className="rounded-ws-button px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: eraserMode === m.value ? 'var(--ws-accent)' : 'transparent',
                color: eraserMode === m.value ? 'var(--ws-text-on-dark)' : 'var(--ws-text-secondary)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
          Tamanho
        </p>
        <div className="flex items-center gap-2.5">
          {ERASER_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onEraserSizeChange?.(s)}
              className="flex items-center justify-center transition-transform hover:scale-110"
              title={`${s}px`}
            >
              <span
                className="rounded-full border-2 transition-colors"
                style={{
                  width: Math.max(12, s / 2 + 8),
                  height: Math.max(12, s / 2 + 8),
                  borderColor: eraserSize === s ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
                  backgroundColor: eraserSize === s ? 'rgba(217,56,56,0.15)' : 'transparent',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShapesSubPanel({ activeTool, onToolChange }: { activeTool: string; onToolChange: (t: string) => void }) {
  return (
    <div className="flex flex-col gap-2 p-3" style={{ minWidth: 180 }}>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-tertiary)' }}>
        Forma
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {SHAPE_TOOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => onToolChange(s.id)}
            className="flex items-center gap-2 rounded-ws-button px-2.5 py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTool === s.id ? 'var(--ws-accent)' : 'transparent',
              color: activeTool === s.id ? 'var(--ws-text-on-dark)' : 'var(--ws-text-secondary)',
            }}
          >
            <ShapeIcon shape={s.id} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TextSubPanel() {
  return (
    <div className="flex flex-col gap-2 p-3" style={{ minWidth: 180 }}>
      <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
        Clique no canvas para adicionar texto. Use a barra de formatação para editar.
      </p>
    </div>
  );
}

/* ========================================================================
   Main Component
   ======================================================================== */

export function FloatingPenToolbar({
  activeTool,
  onToolChange,
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onImageImport,
  smoothing,
  onSmoothingChange,
  stabilizer,
  onStabilizerChange,
  eraserMode = 'stroke',
  onEraserModeChange,
  eraserSize = 20,
  onEraserSizeChange,
  highlighterColor = '#facc15',
  onHighlighterColorChange,
  highlighterOpacity = 40,
  onHighlighterOpacityChange,
}: FloatingPenToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Determine which sub-panel to show based on active tool (derived state) */
  const subPanel: SubPanel = useMemo(() => {
    if (!isOpen) return null;
    const shapeTools = ['line', 'arrow', 'rectangle', 'circle', 'triangle'];
    if (shapeTools.includes(activeTool)) return 'shapes';
    if (activeTool === 'pen') return 'pen';
    if (activeTool === 'highlighter') return 'highlighter';
    if (activeTool === 'eraser') return 'eraser';
    if (activeTool === 'text') return 'text';
    return null;
  }, [activeTool, isOpen]);

  /* Keyboard shortcuts */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
 }
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        onToolChange('eraser');
        if (!isOpen) setIsOpen(true);
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onToolChange('text');
        if (!isOpen) setIsOpen(true);
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onToolChange('select');
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [onToolChange, isOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Click outside to close */
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  /* Handle tool click */
  const handleToolClick = useCallback(
    (toolId: string) => {
      onToolChange(toolId);
    },
    [onToolChange],
  );

  /* Handle preset */
  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      onToolChange(preset.tool);
      onStrokeColorChange(preset.color);
      onStrokeWidthChange(preset.width);
      onSmoothingChange(preset.smoothing);
    },
    [onToolChange, onStrokeColorChange, onStrokeWidthChange, onSmoothingChange],
  );

  /* Render sub-panel */
  const renderSubPanel = () => {
    switch (subPanel) {
      case 'pen':
        return (
          <PenSubPanel
            strokeColor={strokeColor}
            onStrokeColorChange={onStrokeColorChange}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={onStrokeWidthChange}
            smoothing={smoothing}
            onSmoothingChange={onSmoothingChange}
            stabilizer={stabilizer}
            onStabilizerChange={onStabilizerChange}
          />
        );
      case 'highlighter':
        return (
          <HighlighterSubPanel
            highlighterColor={highlighterColor}
            onHighlighterColorChange={onHighlighterColorChange}
            highlighterOpacity={highlighterOpacity}
            onHighlighterOpacityChange={onHighlighterOpacityChange}
          />
        );
      case 'eraser':
        return (
          <EraserSubPanel
            eraserMode={eraserMode}
            onEraserModeChange={onEraserModeChange}
            eraserSize={eraserSize}
            onEraserSizeChange={onEraserSizeChange}
          />
        );
      case 'text':
        return <TextSubPanel />;
      case 'shapes':
        return <ShapesSubPanel activeTool={activeTool} onToolChange={onToolChange} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-[100] flex flex-col items-end"
    >
      {/* Expanded toolbar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="glass-enhanced mb-3 flex flex-col overflow-hidden rounded-ws-card"
            style={{
              maxWidth: 260,
              boxShadow: 'var(--ws-shadow-medium)',
            }}
          >
            <div className="flex">
              {/* Tool list column */}
              <div className="flex flex-col gap-0.5 p-1.5">
                {/* Drawing tools */}
                <ToolButton
                  icon={<PenTool size={18} />}
                  label="Caneta"
                  active={activeTool === 'pen'}
                  onClick={() => handleToolClick('pen')}
                />
                <ToolButton
                  icon={<Highlighter size={18} />}
                  label="Marca-texto"
                  active={activeTool === 'highlighter'}
                  onClick={() => handleToolClick('highlighter')}
                />
                <ToolButton
                  icon={<Eraser size={18} />}
                  label="Borracha"
                  active={activeTool === 'eraser'}
                  onClick={() => handleToolClick('eraser')}
                />
                <ToolButton
                  icon={<Type size={18} />}
                  label="Texto"
                  active={activeTool === 'text'}
                  onClick={() => handleToolClick('text')}
                />
                <ToolButton
                  icon={<MousePointer2 size={18} />}
                  label="Selecionar"
                  active={activeTool === 'select'}
                  onClick={() => handleToolClick('select')}
                />
                <ToolButton
                  icon={<Pentagon size={18} />}
                  label="Formas"
                  active={['line', 'arrow', 'rectangle', 'circle', 'triangle'].includes(activeTool)}
                  onClick={() => handleToolClick('rectangle')}
                />

                {/* Separator */}
                <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--ws-glass-border)' }} />

                {/* Actions */}
                <ToolButton
                  icon={<Undo2 size={18} />}
                  label="Desfazer"
                  active={false}
                  onClick={onUndo}
                />
                <ToolButton
                  icon={<Redo2 size={18} />}
                  label="Refazer"
                  active={false}
                  onClick={onRedo}
                />

                <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--ws-glass-border)' }} />

                <ToolButton
                  icon={<ImagePlus size={18} />}
                  label="Imagem"
                  active={false}
                  onClick={onImageImport}
                />

                <div className="my-1 h-px w-full" style={{ backgroundColor: 'var(--ws-glass-border)' }} />

                <ToolButton
                  icon={<Settings size={18} />}
                  label="Config"
                  active={false}
                  onClick={() => {}}
                />
              </div>

              {/* Separator line */}
              <div
                className="w-px self-stretch"
                style={{ backgroundColor: 'var(--ws-glass-border)' }}
              />

              {/* Sub-panel content */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ maxHeight: 420 }}
              >
                {subPanel ? (
                  <motion.div
                    key={subPanel}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderSubPanel()}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center p-4" style={{ minWidth: 180, minHeight: 60 }}>
                    <p className="text-center text-xs" style={{ color: 'var(--ws-text-tertiary)' }}>
                      Selecione uma ferramenta
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 h-px" style={{ backgroundColor: 'var(--ws-glass-border)' }} />

            {/* Presets section */}
            <div className="flex gap-1.5 p-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset)}
                  className="flex flex-1 flex-col items-center gap-1 rounded-ws-button px-2 py-1.5 text-center transition-colors hover:opacity-80"
                  title={preset.label}
                >
                  <span className="text-base leading-none">{preset.emoji}</span>
                  <span className="text-[10px] leading-tight" style={{ color: 'var(--ws-text-secondary)' }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={isOpen
          ? 'glass-enhanced flex h-12 w-12 items-center justify-center rounded-full transition-all'
          : 'glass-enhanced animate-pulse-glow flex h-12 w-12 items-center justify-center rounded-full transition-all'
        }
        style={{
          boxShadow: 'var(--ws-shadow-medium)',
          color: isOpen ? 'var(--ws-accent)' : 'var(--ws-text-primary)',
        }}
        aria-label={isOpen ? 'Fechar barra de ferramentas' : 'Abrir barra de ferramentas'}
        title="Tecla P para alternar"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            {isOpen ? <X size={20} /> : <PenTool size={20} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

/* ========================================================================
   ToolButton - extracted sub-component
   ======================================================================== */

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-ws-button transition-all"
      style={{
        backgroundColor: active ? 'var(--ws-accent)' : 'transparent',
        color: active ? 'var(--ws-text-on-dark)' : 'var(--ws-text-secondary)',
      }}
      title={label}
    >
      {icon}
    </button>
  );
}

export default FloatingPenToolbar;
