'use client';

import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

/* ---------- types ---------- */

interface PagePanelProps {
  pages: Array<{
    id: string;
    pageNumber: number;
    paperStyle: string;
    paperColor: string;
  }>;
  activePageId: string;
  onPageSelect: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
}

/* ---------- helpers ---------- */

/** Retorno um iconzinho SVG simples representando o estilo do papel */
function paperStyleIcon(style: string) {
  switch (style) {
    case 'lined':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          {[4, 9, 14, 19].map((y) => (
            <line key={y} x1="3" y1={y} x2="21" y2={y} stroke="currentColor" strokeWidth="0.5" />
          ))}
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          {[4, 9, 14, 19].map((y) => (
            <line key={`h${y}`} x1="3" y1={y} x2="21" y2={y} stroke="currentColor" strokeWidth="0.5" />
          ))}
          {[6, 12, 18].map((x) => (
            <line key={`v${x}`} x1={x} y1="1" x2={x} y2="22" stroke="currentColor" strokeWidth="0.5" />
          ))}
        </svg>
      );
    case 'dotted':
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          {[4, 9, 14, 19].flatMap((y) =>
            [6, 12, 18].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" />
            )),
          )}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <rect x="3" y="1" width="18" height="22" rx="1" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      );
  }
}

/* ---------- componente ---------- */

export default function PagePanel({
  pages,
  activePageId,
  onPageSelect,
  onAddPage,
  onDeletePage,
}: PagePanelProps) {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col rounded-xl border border-black/5 bg-white/80 shadow-lg backdrop-blur-md">
      {/* Cabecalho */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Paginas
        </h3>
        <button
          title="Adicionar pagina"
          onClick={onAddPage}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-white transition-colors hover:bg-amber-600"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Contador */}
      <div className="border-b border-gray-100 px-3 py-1.5">
        <p className="text-[10px] text-gray-400">
          Pagina {pages.findIndex((p) => p.id === activePageId) + 1} de {pages.length}
        </p>
      </div>

      {/* Lista de paginas */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <button
              key={page.id}
              onClick={() => onPageSelect(page.id)}
              className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-amber-50 ring-1 ring-amber-500/30'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Miniatura */}
              <div
                className="relative flex h-16 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-200"
                style={{ backgroundColor: page.paperColor || '#ffffff' }}
              >
                <span className="text-gray-300">{paperStyleIcon(page.paperStyle)}</span>
                <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-gray-400">
                  {page.pageNumber}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-medium text-gray-700">
                  Pagina {page.pageNumber}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">
                  {page.paperStyle === 'blank' ? 'Em branco' :
                   page.paperStyle === 'lined' ? 'Pautado' :
                   page.paperStyle === 'grid' ? 'Quadriculado' :
                   'Pontilhado'}
                </span>
              </div>

              {/* Acoes - aparecem ao hover */}
              {pages.length > 1 && (
                <button
                  title="Excluir pagina"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
