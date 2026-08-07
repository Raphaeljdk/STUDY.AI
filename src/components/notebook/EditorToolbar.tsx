'use client';

import React, { useRef } from 'react';
import {
  MousePointer2,
  Pen,
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Plus,
  ImagePlus,
  StickyNote,
  ChevronDown,
  LayoutGrid,
  AlignLeft,
  Grid2x2,
  File,
} from 'lucide-react';

/* ---------- types ---------- */

interface EditorToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  strokeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onWidthChange: (w: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  paperStyle: string;
  onPaperStyleChange: (s: string) => void;
  paperColor: string;
  onPaperColorChange: (c: string) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onToggleTape: () => void;
  tapeMode: boolean;
}

/* ---------- constants ---------- */

const PRESET_COLORS = [
  '#000000', '#ef4444', '#3b82f6', '#22c55e',
  '#a855f7', '#f97316', '#92400e', '#6b7280',
];

const PAPER_COLORS = [
  { color: '#ffffff', label: 'Branco' },
  { color: '#fef9ef', label: 'Creme' },
  { color: '#fff9c4', label: 'Amarelo' },
  { color: '#e3f2fd', label: 'Azul' },
  { color: '#fce4ec', label: 'Rosa' },
  { color: '#e8f5e9', label: 'Verde' },
];

const PAPER_STYLES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'blank', label: 'Em branco', icon: <File size={14} /> },
  { value: 'lined', label: 'Pautado', icon: <AlignLeft size={14} /> },
  { value: 'grid', label: 'Quadriculado', icon: <LayoutGrid size={14} /> },
  { value: 'dotted', label: 'Pontilhado', icon: <Grid2x2 size={14} /> },
];

const TOOLS = [
  { id: 'select', label: 'Selecionar', icon: <MousePointer2 size={16} /> },
  { id: 'pen', label: 'Caneta', icon: <Pen size={16} /> },
  { id: 'pencil', label: 'Lapis', icon: <Pencil size={16} /> },
  { id: 'highlighter', label: 'Marcador', icon: <Highlighter size={16} /> },
  { id: 'eraser', label: 'Apagador', icon: <Eraser size={16} /> },
  { id: 'text', label: 'Texto', icon: <Type size={16} /> },
  { id: 'rectangle', label: 'Retangulo', icon: <Square size={16} /> },
  { id: 'circle', label: 'Circulo', icon: <Circle size={16} /> },
  { id: 'line', label: 'Linha', icon: <Minus size={16} /> },
];

/* ---------- component ---------- */

export default function EditorToolbar({
  activeTool,
  onToolChange,
  strokeColor,
  onColorChange,
  strokeWidth,
  onWidthChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  paperStyle,
  onPaperStyleChange,
  paperColor,
  onPaperColorChange,
  onAddText,
  onAddImage,
  onToggleTape,
  tapeMode,
}: EditorToolbarProps) {
  const customColorRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-50 flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-black/5 bg-white/80 px-2.5 py-1.5 shadow-lg backdrop-blur-md">
      {/* -------- Ferramentas -------- */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => onToolChange(t.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              activeTool === t.id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Cores -------- */}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onColorChange(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
              strokeColor === c ? 'border-amber-500 scale-110' : 'border-gray-200'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          title="Cor personalizada"
          onClick={() => customColorRef.current?.click()}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400"
        >
          <Plus size={10} />
        </button>
        <input
          ref={customColorRef}
          type="color"
          className="sr-only"
          value={strokeColor}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Espessura -------- */}
      <div className="flex items-center gap-1.5 text-gray-600">
        <span className="text-xs font-medium tabular-nums">{strokeWidth}px</span>
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => onWidthChange(Number(e.target.value))}
          className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-gray-200 accent-amber-500"
        />
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Desfazer / Refazer -------- */}
      <div className="flex items-center gap-0.5">
        <button
          title="Desfazer"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 size={16} />
        </button>
        <button
          title="Refazer"
          disabled={!canRedo}
          onClick={onRedo}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Zoom -------- */}
      <div className="flex items-center gap-0.5">
        <button
          title="Reduzir zoom"
          onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
        >
          <ZoomOut size={16} />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-medium text-gray-600 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          title="Aumentar zoom"
          onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Estilo do papel -------- */}
      <div className="relative">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1">
          {PAPER_STYLES.map((ps) => (
            <button
              key={ps.value}
              title={ps.label}
              onClick={() => onPaperStyleChange(ps.value)}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                paperStyle === ps.value
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              {ps.icon}
            </button>
          ))}
        </div>
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Cor do papel -------- */}
      <div className="flex items-center gap-1">
        {PAPER_COLORS.map((pc) => (
          <button
            key={pc.color}
            title={pc.label}
            onClick={() => onPaperColorChange(pc.color)}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
              paperColor === pc.color ? 'border-amber-500 scale-110' : 'border-gray-200'
            }`}
            style={{ backgroundColor: pc.color }}
          />
        ))}
      </div>

      {/* -------- Separador -------- */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* -------- Acoes extras -------- */}
      <div className="flex items-center gap-0.5">
        <button
          title="Adicionar imagem"
          onClick={onAddImage}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
        >
          <ImagePlus size={16} />
        </button>
        <button
          title="Fita adesiva"
          onClick={onToggleTape}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            tapeMode
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <StickyNote size={16} />
        </button>
      </div>
    </div>
  );
}
