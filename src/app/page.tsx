'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

/* CanvasEditor carregado sem SSR pois usa fabric.js (canvas) */
const CanvasEditor = dynamic(
  () => import('@/components/notebook/CanvasEditor'),
  { ssr: false },
);

export default function Home() {
  const [canvasJSON, setCanvasJSON] = useState<string | null>(null);

  const handleChange = useCallback((json: string) => {
    setCanvasJSON(json);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
      {/* Cabecalho simples */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📓</span>
          <h1 className="text-sm font-bold text-gray-800">StudyAI — Caderno</h1>
        </div>
        <span className="text-xs text-gray-400">Auto-salvo {canvasJSON ? '✓' : '...'}</span>
      </header>

      {/* Editor preenche o restante da tela */}
      <main className="flex flex-1 overflow-hidden">
        <CanvasEditor
          paperStyle="grid"
          paperColor="#ffffff"
          lineColor="#e0e0e0"
          onChange={handleChange}
        />
      </main>
    </div>
  );
}
