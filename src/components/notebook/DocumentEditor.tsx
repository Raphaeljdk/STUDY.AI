'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Type,
  ChevronDown, Undo2, Redo2, Heading1, Heading2, Heading3, Pilcrow,
  Palette, Highlighter, Code, Minus, Quote, RemoveFormatting,
  FileText, Printer, Save,
} from 'lucide-react';

/* ========================================================================
   Types
   ======================================================================== */

interface DocumentEditorProps {
  content?: string;
  paperStyle?: 'blank' | 'lined' | 'grid' | 'dotted';
  paperColor?: string;
  onChange?: (html: string) => void;
}

/* ========================================================================
   Constants
   ======================================================================== */

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
];

const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96];

const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
];

const HIGHLIGHT_COLORS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff',
  '#fecaca', '#fed7aa', '#fbcfe8', '#a5f3fc', '#d9f99d',
];

const LINE_HEIGHTS = [1.0, 1.15, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0];

/* ========================================================================
   Toolbar Button Component (outside render to avoid re-creation)
   ======================================================================== */

function TBtn({
  title, active, onClick, disabled, children, className = '',
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-amber-500 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

/* ========================================================================
   Main DocumentEditor Component
   ======================================================================== */

export default function DocumentEditor({
  content = '',
  paperStyle = 'blank',
  paperColor = '#ffffff',
  onChange,
}: DocumentEditorProps) {
  const editorRef = useRef<any>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  /* ---- Word/char count ---- */
  const updateCounts = useCallback((ed: any) => {
    const text = ed?.getText() || '';
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Comece a digitar seu texto aqui...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Color,
      TextStyle,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'document-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      updateCounts(editor);
    },
    immediatelyRender: false,
  });

  /* ---- Sync ref ---- */
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  /* ---- Sync content when page switches ---- */
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (!editor) return;
    // Only update if the content prop actually changed (different page selected)
    if (content !== prevContentRef.current) {
      prevContentRef.current = content;
      const currentHTML = editor.getHTML();
      // Normalize both for comparison (empty string vs <p></p>)
      const normalizedCurrent = currentHTML.replace(/<p><\/p>/g, '').trim();
      const normalizedNew = (content || '').replace(/<p><\/p>/g, '').trim();
      if (normalizedCurrent !== normalizedNew) {
        editor.commands.setContent(content || '', true);
      }
    }
  }, [content, editor]);

  /* ---- Initial word/char count ---- */
  useEffect(() => {
    if (editor) {
      const text = editor.getText() || '';
      requestAnimationFrame(() => {
        setCharCount(text.length);
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      });
    }
  }, [editor]);

  /* ---- Close dropdowns on outside click ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setShowFontPicker(false);
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) setShowSizePicker(false);
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) setShowHighlightPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---- Font family ---- */
  const applyFontFamily = useCallback((font: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontFamily: font }).run();
    setShowFontPicker(false);
  }, [editor]);

  /* ---- Font size via style attribute ---- */
  const applyFontSize = useCallback((size: number) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
    setShowSizePicker(false);
  }, [editor]);

  /* ---- Heading ---- */
  const applyHeading = useCallback((level: number | null) => {
    if (!editor) return;
    if (level) {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  }, [editor]);

  /* ---- Line height ---- */
  const applyLineHeight = useCallback((lh: number) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { lineHeight: lh }).run();
  }, [editor]);

  /* ---- Print ---- */
  const handlePrint = useCallback(() => {
    if (!editor) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Documento</title>
      <style>body{font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:auto;line-height:1.6;color:#111}
      h1{font-size:28px;font-weight:700;margin:20px 0 10px}h2{font-size:22px;font-weight:600;margin:18px 0 8px}h3{font-size:18px;font-weight:600;margin:16px 0 6px}
      p{margin:8px 0}ul,ol{padding-left:24px;margin:8px 0}li{margin:4px 0}blockquote{border-left:3px solid #ddd;padding-left:16px;color:#555;margin:12px 0}
      code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:14px}pre{background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;overflow-x:auto}
      mark{background:#fef08a;padding:1px 3px;border-radius:2px}.task-list{list-style:none;padding:0}.task-list li{display:flex;align-items:center;gap:8px}
      hr{border:none;border-top:1px solid #e5e7eb;margin:16px 0}</style></head>
      <body>${editor.getHTML()}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [editor]);

  /* ---- Keyboard shortcuts: Ctrl+S save, Ctrl+Shift+S print ---- */
  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrint();
        } else {
          onChange?.(editor.getHTML());
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, onChange, handlePrint]);

  /* ---- Indent/Outdent ---- */
  const handleIndent = useCallback(() => {
    if (!editor) return;
    // For list items, sink them
    if (editor.isActive('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run();
    }
  }, [editor]);

  const handleOutdent = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('listItem')) {
      editor.chain().focus().liftListItem('listItem').run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
          <p className="text-sm text-gray-400">Carregando editor...</p>
        </div>
      </div>
    );
  }

  const currentFont = 'Inter';
  const currentSize = 16;

  /* ---- Paper styles ---- */
  const paperBg = paperColor || '#ffffff';
  let contentClass = 'prose prose-sm sm:prose-base max-w-none';
  if (paperStyle === 'lined') {
    contentClass += ' lined-paper';
  } else if (paperStyle === 'grid') {
    contentClass += ' grid-paper';
  } else if (paperStyle === 'dotted') {
    contentClass += ' dotted-paper';
  }

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: '#f3f4f6' }}>
      {/* ====== WORD-LIKE RIBBON TOOLBAR ====== */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        {/* Row 1: Main formatting */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          {/* Undo/Redo */}
          <TBtn title="Desfazer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 size={15} />
          </TBtn>
          <TBtn title="Refazer (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 size={15} />
          </TBtn>

          <Divider />

          {/* Font Family */}
          <div ref={fontRef} className="relative">
            <button
              onClick={() => { setShowFontPicker(!showFontPicker); setShowSizePicker(false); }}
              className="flex h-8 max-w-[130px] items-center gap-1 truncate rounded-lg border border-gray-200 px-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Fonte"
            >
              <Type size={12} className="shrink-0" />
              <span className="truncate">{currentFont}</span>
              <ChevronDown size={10} className="shrink-0 text-gray-400" />
            </button>
            {showFontPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => applyFontFamily(f.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${currentFont === f.label ? 'bg-amber-50 font-semibold text-amber-700' : 'text-gray-700'}`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div ref={sizeRef} className="relative">
            <button
              onClick={() => { setShowSizePicker(!showSizePicker); setShowFontPicker(false); }}
              className="flex h-8 w-14 items-center justify-center gap-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Tamanho da fonte"
            >
              {currentSize}
              <ChevronDown size={10} className="text-gray-400" />
            </button>
            {showSizePicker && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-16 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => applyFontSize(s)}
                    className={`w-full px-2 py-1 text-center text-sm hover:bg-gray-100 transition-colors ${currentSize === s ? 'bg-amber-50 font-bold text-amber-700' : 'text-gray-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Heading Styles */}
          <TBtn title="Titulo 1" active={editor.isActive('heading', { level: 1 })} onClick={() => applyHeading(1)}>
            <Heading1 size={15} />
          </TBtn>
          <TBtn title="Titulo 2" active={editor.isActive('heading', { level: 2 })} onClick={() => applyHeading(2)}>
            <Heading2 size={15} />
          </TBtn>
          <TBtn title="Titulo 3" active={editor.isActive('heading', { level: 3 })} onClick={() => applyHeading(3)}>
            <Heading3 size={15} />
          </TBtn>
          <TBtn title="Corpo de texto" active={!editor.isActive('heading')} onClick={() => applyHeading(null)}>
            <Pilcrow size={15} />
          </TBtn>

          <Divider />

          {/* Text Formatting */}
          <TBtn title="Negrito (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={15} />
          </TBtn>
          <TBtn title="Italico (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={15} />
          </TBtn>
          <TBtn title="Sublinhado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={15} />
          </TBtn>
          <TBtn title="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={15} />
          </TBtn>
          <TBtn title="Codigo" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={15} />
          </TBtn>

          <Divider />

          {/* Text Color */}
          <div ref={colorRef} className="relative">
            <TBtn title="Cor do texto" onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}>
              <div className="relative">
                <Palette size={15} />
                <div className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full bg-black" />
              </div>
            </TBtn>
            {showColorPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                <p className="mb-1.5 text-[10px] font-medium text-gray-400 uppercase">Cor do texto</p>
                <div className="grid grid-cols-6 gap-1">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                      className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${c === '#ffffff' ? 'border-gray-300' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color */}
          <div ref={highlightRef} className="relative">
            <TBtn title="Realce" onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}>
              <Highlighter size={15} />
            </TBtn>
            {showHighlightPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                <p className="mb-1.5 text-[10px] font-medium text-gray-400 uppercase">Cor de realce</p>
                <div className="grid grid-cols-5 gap-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { 
                        if (c === 'transparent') {
                          editor.chain().focus().unsetHighlight().run();
                        } else {
                          editor.chain().focus().toggleHighlight({ color: c }).run();
                        }
                        setShowHighlightPicker(false);
                      }}
                      className={`h-6 w-6 rounded-md border border-gray-200 transition-transform hover:scale-110 ${c === 'transparent' ? 'bg-white' : ''}`}
                      style={c !== 'transparent' ? { backgroundColor: c } : {}}
                      title={c === 'transparent' ? 'Sem realce' : c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Alignment */}
          <TBtn title="Alinhar a esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft size={15} />
          </TBtn>
          <TBtn title="Centralizar" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter size={15} />
          </TBtn>
          <TBtn title="Alinhar a direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight size={15} />
          </TBtn>
          <TBtn title="Justificar" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify size={15} />
          </TBtn>

          <Divider />

          {/* Lists */}
          <TBtn title="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={15} />
          </TBtn>
          <TBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={15} />
          </TBtn>
          <TBtn title="Lista de tarefas" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare size={15} />
          </TBtn>

          <Divider />

          {/* Block elements */}
          <TBtn title="Citacao" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={15} />
          </TBtn>
          <TBtn title="Linha horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={15} />
          </TBtn>

          <Divider />

          {/* Clear formatting */}
          <TBtn title="Limpar formatacao" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <RemoveFormatting size={15} />
          </TBtn>

          {/* Save */}
          <TBtn title="Salvar (Ctrl+S)" onClick={() => onChange?.(editor.getHTML())} className="ml-auto">
            <Save size={15} />
          </TBtn>

          {/* Print */}
          <TBtn title="Imprimir (Ctrl+Shift+S)" onClick={handlePrint}>
            <Printer size={15} />
          </TBtn>
        </div>

        {/* Row 2: Paragraph & spacing controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3 py-1">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Paragrafo</span>
          
          {/* Line height */}
          <select
            onChange={(e) => applyLineHeight(Number(e.target.value))}
            className="h-7 rounded-md border border-gray-200 px-1.5 text-xs text-gray-600 hover:bg-gray-50"
            title="Espacamento entre linhas"
          >
            {LINE_HEIGHTS.map((lh) => (
              <option key={lh} value={lh}>{lh.toFixed(1)}</option>
            ))}
          </select>

          <div className="mx-1 h-4 w-px bg-gray-200" />

          {/* Indent / Outdent */}
          <TBtn title="Aumentar recuo" onClick={handleIndent}>
            <div className="flex flex-col items-center leading-none">
              <div className="border-l-2 border-t-2 border-gray-600 h-2 w-2" />
            </div>
          </TBtn>
          <TBtn title="Diminuir recuo" onClick={handleOutdent}>
            <div className="flex flex-col items-center leading-none">
              <div className="border-l-2 border-b-2 border-gray-600 h-2 w-2" />
            </div>
          </TBtn>

          <div className="mx-1 h-4 w-px bg-gray-200" />

          {/* Word & char count */}
          <span className="text-[11px] text-gray-400">
            {wordCount} palavras · {charCount} caracteres
          </span>
        </div>
      </div>

      {/* ====== DOCUMENT CONTENT AREA ====== */}
      <div className="flex-1 overflow-auto flex justify-center p-4 sm:p-6 bg-[#e8e8e8]">
        <div
          className="w-full max-w-[210mm] min-h-[297mm] rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] bg-white border border-gray-200/60"
          style={{
            backgroundColor: paperBg,
            backgroundImage: paperStyle === 'lined'
              ? 'repeating-linear-gradient(transparent, transparent 31px, #d1d5db 31px, #d1d5db 32px)'
              : paperStyle === 'grid'
                ? 'repeating-linear-gradient(0deg, transparent, transparent 31px, #d1d5db 31px, #d1d5db 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, #d1d5db 31px, #d1d5db 32px)'
                : paperStyle === 'dotted'
                  ? 'radial-gradient(circle, #c4c4c4 0.8px, transparent 0.8px)'
                  : 'none',
            backgroundSize: paperStyle === 'dotted' ? '24px 24px' : 'auto',
            backgroundPosition: paperStyle !== 'blank' ? '0 0' : undefined,
          }}
        >
          <div
            className={`${contentClass} px-16 py-14 document-editor-content`}
            style={{
              minHeight: '297mm',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#111827',
              outline: 'none',
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* ====== STATUS BAR (like Word) ====== */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-white/95 px-4 py-1.5 backdrop-blur-md text-[11px] text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText size={12} />
            Documento
          </span>
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Portugues (Brasil)</span>
          <span>100%</span>
        </div>
      </div>

      {/* ====== GLOBAL STYLES FOR TIPTAP ====== */}
      <style jsx global>{`
        /* Base editor styles - Word-like */
        .document-editor-content {
          outline: none;
          caret-color: #000;
        }
        .document-editor-content:focus {
          outline: none;
        }
        .document-editor-content .tiptap {
          outline: none;
          min-height: 900px;
        }
        .document-editor-content .tiptap:focus {
          outline: none;
        }
        /* Headings */
        .document-editor-content h1 {
          font-size: 2em;
          font-weight: 700;
          margin: 0.8em 0 0.4em;
          line-height: 1.2;
          color: #111;
        }
        .document-editor-content h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.7em 0 0.3em;
          line-height: 1.25;
          color: #1f2937;
        }
        .document-editor-content h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.6em 0 0.3em;
          line-height: 1.3;
          color: #374151;
        }
        .document-editor-content h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.5em 0 0.25em;
          color: #4b5563;
        }
        /* Paragraphs */
        .document-editor-content p {
          margin: 0.4em 0;
          line-height: 1.6;
        }
        /* Lists */
        .document-editor-content ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .document-editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .document-editor-content li {
          margin: 0.2em 0;
        }
        .document-editor-content li p {
          margin: 0;
        }
        /* Task list */
        .document-editor-content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .document-editor-content ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
          margin: 0.3em 0;
        }
        .document-editor-content ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.15em;
        }
        .document-editor-content ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #f59e0b;
        }
        .document-editor-content ul[data-type="taskList"] li > div {
          flex: 1;
        }
        /* Blockquote */
        .document-editor-content blockquote {
          border-left: 4px solid #f59e0b;
          padding-left: 1em;
          margin: 0.8em 0;
          color: #6b7280;
          font-style: italic;
        }
        /* Code */
        .document-editor-content code {
          background: #f3f4f6;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'Courier New', monospace;
          color: #dc2626;
        }
        .document-editor-content pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.8em 0;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
          line-height: 1.5;
        }
        .document-editor-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }
        /* Horizontal rule */
        .document-editor-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5em 0;
        }
        /* Mark/Highlight */
        .document-editor-content mark {
          background: #fef08a;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }
        /* Placeholder */
        .document-editor-content .tiptap.is-editor-empty > p:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        /* Selection */
        .document-editor-content ::selection {
          background: #bfdbfe;
        }
      `}</style>
    </div>
  );
}
