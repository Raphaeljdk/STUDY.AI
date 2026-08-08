'use client';

import React from 'react';
import { Rect } from 'fabric';

/* ---------- constantes ---------- */

const TAPE_COLORS = ['#fbbf24', '#f472b6', '#60a5fa', '#4ade80'];

const TAPE_WIDTH = 200;
const TAPE_HEIGHT = 24;
const TAPE_OPACITY = 0.7;

/* ---------- helpers ---------- */

/** Retorna uma rotacao aleatoria entre -3 e 3 graus */
function randomRotation(): number {
  return (Math.random() * 6 - 3) * (Math.PI / 180);
}

/**
 * Adiciona uma fita adesiva ao canvas.
 * Exportado para ser usado pelo CanvasEditor.
 */
export function addTape(
  canvas: any,
  x: number,
  y: number,
  color: string = TAPE_COLORS[0],
) {
  const tape = new Rect({
    left: x - TAPE_WIDTH / 2,
    top: y - TAPE_HEIGHT / 2,
    width: TAPE_WIDTH,
    height: TAPE_HEIGHT,
    fill: color,
    opacity: TAPE_OPACITY,
    angle: randomRotation() * (180 / Math.PI),
    selectable: true,
    evented: true,
    originX: 'center',
    originY: 'center',
  } as any);

  (tape as any).__isTape = true;
  (tape as any).__tapeColor = color;

  canvas.add(tape);
  canvas.setActiveObject(tape);
  canvas.renderAll();
  return tape;
}

/**
 * Retorna as cores disponiveis para fita.
 */
export function getTapeColors(): string[] {
  return [...TAPE_COLORS];
}

/* ---------- componente de UI ---------- */

interface StickyTapePickerProps {
  onColorSelect?: (color: string) => void;
  activeTapeColor?: string;
}

export function StickyTapePicker({ onColorSelect, activeTapeColor }: StickyTapePickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {TAPE_COLORS.map((c) => (
        <button
          key={c}
          title={`Fita ${c}`}
          onClick={() => onColorSelect?.(c)}
          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
            activeTapeColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
