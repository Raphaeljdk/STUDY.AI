'use client';

import { useState, useRef, useCallback } from 'react';
import CanvasEditor from './CanvasEditor';
import DocumentEditor from './DocumentEditor';
import PagePanel from './PagePanel';
import PDFImporter from './PDFImporter';
import AudioRecorder from './AudioRecorder';
import {
  ArrowLeft, BookOpen, MessageCircle, FileText,
  Columns2, Rows2, CalendarDays, PenLine, FileEdit, Columns3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotebookPageData {
  id: string;
  pageNumber: number;
  canvasData: string | null;
  textContent: string;
  paperStyle: string;
  paperColor: string;
  lineColor: string;
  width: number;
  height: number;
}

interface CanvasNotebookViewProps {
  notebookId: string;
  onBack: () => void;
}

type SplitMode = 'none' | 'vertical' | 'horizontal';
type EditorMode = 'canvas' | 'document';

export function CanvasNotebookView({ notebookId, onBack }: CanvasNotebookViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState<NotebookPageData[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('none');
  const [showPlanner, setShowPlanner] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('document');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef<boolean | null>(null);

  const activePage = pages[activePageIdx] || null;

  // --- Load pages ---
  const loadPages = useCallback(async () => {
    try {
      const [nbRes, pgRes] = await Promise.all([
        fetch(`/api/notebooks/${notebookId}`),
        fetch(`/api/notebooks/${notebookId}/pages`),
      ]);
      const nbData = await nbRes.json();
      const pgData = await pgRes.json();

      if (nbData.notebook) setTitle(nbData.notebook.title);

      if (pgData.pages && pgData.pages.length > 0) {
        setPages(pgData.pages);
      } else {
        const createRes = await fetch(`/api/notebooks/${notebookId}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperStyle: 'grid', paperColor: '#ffffff' }),
        });
        const createData = await createRes.json();
        if (createData.page) setPages([createData.page]);
      }
    } catch (err) {
      console.error('[CanvasNotebookView] load error:', err);
      toast({ title: 'Erro ao carregar', description: 'Nao foi possivel carregar o caderno.', variant: 'destructive' });
    }
    setLoading(false);
  }, [notebookId]);

  if (fetchedRef.current == null) {
    fetchedRef.current = true;
    loadPages();
  }

  // --- Save canvas page ---
  const saveCanvasPage = useCallback(async (canvasJson: string) => {
    if (!activePage) return;
    setSaving(true);
    try {
      await fetch(`/api/notebooks/pages/${activePage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData: canvasJson }),
      });
    } catch (err) {
      console.error('[CanvasNotebookView] save error:', err);
    }
    setSaving(false);
  }, [activePage]);

  // --- Save document page ---
  const saveDocumentPage = useCallback(async (html: string) => {
    if (!activePage) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/notebooks/pages/${activePage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textContent: html }),
        });
      } catch (err) {
        console.error('[CanvasNotebookView] save doc error:', err);
      }
      setSaving(false);
    }, 1000);
  }, [activePage]);

  // --- Handle canvas change (auto-save) ---
  const handleCanvasChange = useCallback((json: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveCanvasPage(json), 1500);
  }, [saveCanvasPage]);

  // --- Page management ---
  const handleAddPage = async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperStyle: 'grid', paperColor: '#ffffff' }),
      });
      const data = await res.json();
      if (data.page) {
        setPages(prev => [...prev, data.page]);
        setActivePageIdx(pages.length);
      }
    } catch (err) {
      console.error('[CanvasNotebookView] add page error:', err);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      toast({ title: 'Nao pode excluir', description: 'O caderno precisa ter pelo menos 1 pagina.' });
      return;
    }
    try {
      await fetch(`/api/notebooks/pages/${pageId}`, { method: 'DELETE' });
      const newPages = pages.filter(p => p.id !== pageId);
      setPages(newPages);
      if (activePageIdx >= newPages.length) setActivePageIdx(newPages.length - 1);
    } catch (err) {
      console.error('[CanvasNotebookView] delete page error:', err);
    }
  };

  // --- PDF import ---
  const handlePDFImported = useCallback(async (imageUrl: string) => {
    const event = new CustomEvent('pdf-imported', { detail: { imageUrl } });
    window.dispatchEvent(event);
    toast({ title: 'PDF importado', description: 'A primeira pagina do PDF foi adicionada ao canvas.' });
  }, []);

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--ws-glass-border)] border-t-[var(--ws-accent)]" />
          <p className="text-sm text-[var(--ws-text-tertiary)]">Carregando caderno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ====== Top Bar ====== */}
      <div className="flex items-center gap-2 border-b border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/80 px-3 py-2 backdrop-blur-sm">
        <button onClick={onBack} className="rounded-ws-button p-2 text-[var(--ws-text-tertiary)] transition-colors hover:bg-[var(--ws-ink)]/5 hover:text-[var(--ws-text-primary)]" aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <BookOpen size={16} className="text-[var(--ws-accent)]" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ws-text-primary)]">{title}</h2>

        {saving && <span className="text-[10px] text-[var(--ws-text-tertiary)]">Salvando...</span>}

        {/* ====== EDITOR MODE TOGGLE ====== */}
        <div className="flex items-center rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/60 p-0.5">
          <button
            onClick={() => setEditorMode('document')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              editorMode === 'document'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]'
            }`}
            title="Modo Documento (digitacao como Word)"
          >
            <FileEdit size={14} />
            <span className="hidden sm:inline">Documento</span>
          </button>
          <button
            onClick={() => setEditorMode('canvas')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              editorMode === 'canvas'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]'
            }`}
            title="Modo Canvas (desenho e formas)"
          >
            <PenLine size={14} />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        </div>

        <div className="mx-1 h-5 w-px bg-[var(--ws-glass-border)]" />

        <button
          onClick={() => setSplitMode(m => m === 'vertical' ? 'none' : 'vertical')}
          className={`rounded-ws-button p-2 transition-colors ${splitMode === 'vertical' ? 'bg-[var(--ws-accent)]/15 text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]'}`}
          title="Divisao vertical"
        >
          <Columns2 size={16} />
        </button>
        <button
          onClick={() => setShowPagePanel(p => !p)}
          className={`rounded-ws-button p-2 transition-colors ${showPagePanel ? 'bg-[var(--ws-accent)]/15 text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]'}`}
          title="Paginas"
        >
          <FileText size={16} />
        </button>

        <button
          onClick={() => setShowPlanner(p => !p)}
          className={`rounded-ws-button p-2 transition-colors ${showPlanner ? 'bg-[var(--ws-accent)]/15 text-[var(--ws-accent)]' : 'text-[var(--ws-text-tertiary)] hover:text-[var(--ws-text-primary)]'}`}
          title="Planejador"
        >
          <CalendarDays size={16} />
        </button>
      </div>

      {/* ====== Main content ====== */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Page Panel (left sidebar) */}
        {showPagePanel && (
          <div className="w-48 shrink-0 border-r border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/50 overflow-y-auto p-2">
            <PagePanel
              pages={pages.map(p => ({ id: p.id, pageNumber: p.pageNumber, paperStyle: p.paperStyle, paperColor: p.paperColor }))}
              activePageId={activePage?.id || ''}
              onPageSelect={(id) => {
                const idx = pages.findIndex(p => p.id === id);
                if (idx >= 0) setActivePageIdx(idx);
              }}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
            />
          </div>
        )}

        {/* ====== Editor Area ====== */}
        <div className="relative flex-1 overflow-hidden">
          {activePage && editorMode === 'document' && (
            <DocumentEditor
              key={`doc-${activePage.id}`}
              content={activePage.textContent || ''}
              paperStyle={(activePage.paperStyle as any) || 'grid'}
              paperColor={activePage.paperColor || '#ffffff'}
              onChange={saveDocumentPage}
            />
          )}
          {activePage && editorMode === 'canvas' && (
            <CanvasEditor
              key={`canvas-${activePage.id}`}
              initialData={activePage.canvasData}
              paperStyle={(activePage.paperStyle as any) || 'grid'}
              paperColor={activePage.paperColor || '#ffffff'}
              lineColor={activePage.lineColor || '#d1d5db'}
              onChange={handleCanvasChange}
            />
          )}
        </div>

        {/* Right panel for split view or planner */}
        {splitMode !== 'none' && (
          <div className={`w-80 shrink-0 border-l border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/50 p-3 overflow-y-auto ${splitMode === 'horizontal' ? 'h-80 border-l-0 border-t w-full' : ''}`}>
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle size={14} className="text-[var(--ws-accent)]" />
              <span className="text-xs font-medium text-[var(--ws-text-secondary)]">Sensei IA</span>
            </div>
            <p className="text-xs text-[var(--ws-text-tertiary)]">Converse com o Sensei enquanto estuda. Em breve: chat integrado na tela dividida.</p>
          </div>
        )}

        {showPlanner && !splitMode && (
          <div className="w-80 shrink-0 border-l border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/50 overflow-y-auto">
            <div className="p-3">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={14} className="text-[var(--ws-accent)]" />
                <span className="text-xs font-medium text-[var(--ws-text-secondary)]">Planejador de Estudos</span>
              </div>
              <p className="text-xs text-[var(--ws-text-tertiary)]">Organize seus horarios de estudo, aulas e tarefas.</p>
            </div>
          </div>
        )}
      </div>

      {/* ====== Bottom Bar ====== */}
      <div className="flex items-center gap-2 border-t border-[var(--ws-glass-border)] bg-[var(--ws-glass)]/80 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[10px] text-[var(--ws-text-tertiary)]">
          Pagina {activePageIdx + 1} de {pages.length}
        </span>
        <div className="mx-2 h-3 w-px bg-[var(--ws-glass-border)]" />
        <span className={`text-[10px] font-medium ${editorMode === 'document' ? 'text-amber-600' : 'text-[var(--ws-text-tertiary)]'}`}>
          {editorMode === 'document' ? 'Modo Documento' : 'Modo Canvas'}
        </span>
        <div className="mx-2 h-3 w-px bg-[var(--ws-glass-border)]" />
        <PDFImporter onPDFImported={handlePDFImported} />
        <div className="mx-2 h-3 w-px bg-[var(--ws-glass-border)]" />
        <AudioRecorder />
      </div>
    </div>
  );
}

export default CanvasNotebookView;
