'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  ChevronDown,
  Strikethrough,
} from 'lucide-react';

/* ---------- types ---------- */

export interface TextFormat {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  linethrough: boolean;
  textAlign: string;
  fill: string;
  lineHeight: number;
  charSpacing: number;
}

interface TextFormattingBarProps {
  format: TextFormat;
  onFormatChange: (patch: Partial<TextFormat>) => void;
  visible: boolean;
  position?: { top: number; left: number };
}

/* ---------- constants ---------- */

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Cursive', value: 'cursive' },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96];

/* ---------- ToggleBtn (declared outside render) ---------- */

function ToggleBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- component ---------- */

export default function TextFormattingBar({
  format,
  onFormatChange,
  visible,
  position,
}: TextFormattingBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [showFonts, setShowFonts] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showFonts && !showSizes) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setShowFonts(false);
        setShowSizes(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFonts, showSizes]);

  if (!visible) return null;

  const style: React.CSSProperties = position
    ? { position: 'absolute', top: position.top, left: position.left, zIndex: 100 }
    : {};

  return (
    <div
      ref={barRef}
      style={style}
      className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-xl"
    >
      {/* Font family */}
      <div className="relative">
        <button
          onClick={() => {
            setShowFonts(!showFonts);
            setShowSizes(false);
          }}
          className="flex h-7 max-w-[120px] items-center gap-1 truncate rounded-md border border-gray-200 px-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Type size={12} className="shrink-0" />
          <span className="truncate">
            {FONT_FAMILIES.find((f) => f.value === format.fontFamily)?.label || 'Inter'}
          </span>
          <ChevronDown size={10} className="shrink-0 text-gray-400" />
        </button>
        {showFonts && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  onFormatChange({ fontFamily: f.value });
                  setShowFonts(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 ${
                  format.fontFamily === f.value
                    ? 'bg-amber-50 font-semibold text-amber-700'
                    : 'text-gray-700'
                }`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font size */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSizes(!showSizes);
            setShowFonts(false);
          }}
          className="flex h-7 w-14 items-center justify-center gap-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {format.fontSize}
          <ChevronDown size={10} className="text-gray-400" />
        </button>
        {showSizes && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-16 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onFormatChange({ fontSize: s });
                  setShowSizes(false);
                }}
                className={`w-full px-3 py-1 text-center text-sm hover:bg-gray-100 ${
                  format.fontSize === s
                    ? 'bg-amber-50 font-bold text-amber-700'
                    : 'text-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="mx-0.5 h-5 w-px bg-gray-200" />

      {/* Bold */}
      <ToggleBtn
        title="Negrito (Ctrl+B)"
        active={format.fontWeight === 'bold'}
        onClick={() =>
          onFormatChange({
            fontWeight: format.fontWeight === 'bold' ? 'normal' : 'bold',
          })
        }
      >
        <Bold size={14} />
      </ToggleBtn>

      {/* Italic */}
      <ToggleBtn
        title="Itálico (Ctrl+I)"
        active={format.fontStyle === 'italic'}
        onClick={() =>
          onFormatChange({
            fontStyle: format.fontStyle === 'italic' ? 'normal' : 'italic',
          })
        }
      >
        <Italic size={14} />
      </ToggleBtn>

      {/* Underline */}
      <ToggleBtn
        title="Sublinhado (Ctrl+U)"
        active={format.underline}
        onClick={() => onFormatChange({ underline: !format.underline })}
      >
        <Underline size={14} />
      </ToggleBtn>

      {/* Strikethrough */}
      <ToggleBtn
        title="Tachado"
        active={format.linethrough}
        onClick={() => onFormatChange({ linethrough: !format.linethrough })}
      >
        <Strikethrough size={14} />
      </ToggleBtn>

      {/* Separator */}
      <div className="mx-0.5 h-5 w-px bg-gray-200" />

      {/* Alignment */}
      <ToggleBtn
        title="Alinhar à esquerda"
        active={format.textAlign === 'left'}
        onClick={() => onFormatChange({ textAlign: 'left' })}
      >
        <AlignLeft size={14} />
      </ToggleBtn>
      <ToggleBtn
        title="Centralizar"
        active={format.textAlign === 'center'}
        onClick={() => onFormatChange({ textAlign: 'center' })}
      >
        <AlignCenter size={14} />
      </ToggleBtn>
      <ToggleBtn
        title="Alinhar à direita"
        active={format.textAlign === 'right'}
        onClick={() => onFormatChange({ textAlign: 'right' })}
      >
        <AlignRight size={14} />
      </ToggleBtn>

      {/* Separator */}
      <div className="mx-0.5 h-5 w-px bg-gray-200" />

      {/* Line height */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-gray-400">LH</span>
        <input
          type="range"
          min={0.8}
          max={3}
          step={0.1}
          value={format.lineHeight}
          onChange={(e) => onFormatChange({ lineHeight: Number(e.target.value) })}
          className="h-1 w-12 cursor-pointer appearance-none rounded-full bg-gray-200 accent-amber-500"
          title="Espaçamento entre linhas"
        />
      </div>

      {/* Separator */}
      <div className="mx-0.5 h-5 w-px bg-gray-200" />

      {/* Text color */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-gray-400">Cor</span>
        <input
          type="color"
          value={format.fill}
          onChange={(e) => onFormatChange({ fill: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded border border-gray-200"
          title="Cor do texto"
        />
      </div>
    </div>
  );
}
