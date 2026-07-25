'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Quote,
  Code, Minus, CheckSquare, Undo, Redo, Highlighter, Type
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const highlightColors = [
  { label: 'Amarelo', color: '#fef08a' },
  { label: 'Verde', color: '#bbf7d0' },
  { label: 'Azul', color: '#bfdbfe' },
  { label: 'Rosa', color: '#fecdd3' },
  { label: 'Laranja', color: '#fed7aa' },
  { label: 'Roxo', color: '#e9d5ff' },
];

const textColors = [
  { label: 'Padrao', color: 'var(--ws-text-primary)' },
  { label: 'Vermelho', color: '#dc2626' },
  { label: 'Azul', color: '#2563eb' },
  { label: 'Verde', color: '#16a34a' },
  { label: 'Roxo', color: '#9333ea' },
  { label: 'Laranja', color: '#ea580c' },
];

function ToolbarBtn({ onClick, active, disabled, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-[var(--ws-accent)]/15 text-[var(--ws-accent)]' :
        'text-[var(--ws-text-tertiary)] hover:bg-[color-mix(in_srgb,var(--ws-ink)_6%,transparent)] hover:text-[var(--ws-text-primary)]'
      } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1.5 h-5 w-px bg-[var(--ws-glass-border)]" />;
}

export function RichTextEditor({ content, onChange, placeholder = 'Comece a escrever...', className = '' }: RichTextEditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => { onChange(editor.getHTML()); }, 800);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] leading-relaxed',
      },
    },
  });

  useEffect(() => { return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }; }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) { editor.commands.setContent(content); }
  }, [content, editor]);

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleH1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const toggleH3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
  const toggleBullet = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrder = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const toggleTask = useCallback(() => editor?.chain().focus().toggleTaskList().run(), [editor]);
  const toggleQuote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]);
  const toggleHR = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor]);
  const setAlign = useCallback((a: 'left' | 'center' | 'right') => editor?.chain().focus().setTextAlign(a).run(), [editor]);
  const setHighlight = useCallback((c: string) => { editor?.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }, [editor]);
  const unsetHighlight = useCallback(() => { editor?.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }, [editor]);
  const setColor = useCallback((c: string) => { editor?.chain().focus().setColor(c).run(); setShowColorPicker(false); }, [editor]);
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  if (!editor) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-[var(--ws-glass-border)] bg-[var(--ws-bg)]/95 px-2 py-1.5 backdrop-blur-sm">
        <ToolbarBtn onClick={undo} title="Desfazer"><Undo size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={redo} title="Refazer"><Redo size={15} /></ToolbarBtn>
        <ToolbarDivider />
        <div className="relative">
          <ToolbarBtn onClick={() => setShowColorPicker(!showColorPicker)} title="Cor do texto"><Type size={15} /></ToolbarBtn>
          {showColorPicker && (<>
            <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-2 shadow-lg">
              {textColors.map(c => (<button key={c.label} onClick={() => setColor(c.color)} title={c.label} className="h-6 w-6 rounded-md border border-[var(--ws-glass-border)] transition-transform hover:scale-110" style={{ backgroundColor: c.color }} />))}
            </div>
          </>)}
        </div>
        <ToolbarBtn onClick={toggleBold} active={editor.isActive('bold')} title="Negrito (Ctrl+B)"><Bold size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleItalic} active={editor.isActive('italic')} title="Italico (Ctrl+I)"><Italic size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleUnderline} active={editor.isActive('underline')} title="Sublinhado (Ctrl+U)"><UnderlineIcon size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleStrike} active={editor.isActive('strike')} title="Riscado"><Strikethrough size={15} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={toggleH1} active={editor.isActive('heading', { level: 1 })} title="Titulo 1"><span className="text-xs font-bold">H1</span></ToolbarBtn>
        <ToolbarBtn onClick={toggleH2} active={editor.isActive('heading', { level: 2 })} title="Titulo 2"><span className="text-xs font-bold">H2</span></ToolbarBtn>
        <ToolbarBtn onClick={toggleH3} active={editor.isActive('heading', { level: 3 })} title="Titulo 3"><span className="text-xs font-bold">H3</span></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={toggleBullet} active={editor.isActive('bulletList')} title="Lista com marcadores"><List size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleOrder} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleTask} active={editor.isActive('taskList')} title="Lista de tarefas"><CheckSquare size={15} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => setAlign('left')} active={editor.isActive({ textAlign: 'left' })} title="Alinhar a esquerda"><AlignLeft size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={() => setAlign('center')} active={editor.isActive({ textAlign: 'center' })} title="Centralizar"><AlignCenter size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={() => setAlign('right')} active={editor.isActive({ textAlign: 'right' })} title="Alinhar a direita"><AlignRight size={15} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={toggleQuote} active={editor.isActive('blockquote')} title="Citacao"><Quote size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleCode} active={editor.isActive('codeBlock')} title="Bloco de codigo"><Code size={15} /></ToolbarBtn>
        <ToolbarBtn onClick={toggleHR} title="Linha horizontal"><Minus size={15} /></ToolbarBtn>
        <ToolbarDivider />
        <div className="relative">
          <ToolbarBtn onClick={() => setShowHighlightPicker(!showHighlightPicker)} active={editor.isActive('highlight')} title="Destacar texto"><Highlighter size={15} /></ToolbarBtn>
          {showHighlightPicker && (<>
            <div className="fixed inset-0 z-10" onClick={() => setShowHighlightPicker(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] p-2 shadow-lg">
              <div className="mb-1.5 flex gap-1">
                {highlightColors.map(c => (<button key={c.color} onClick={() => setHighlight(c.color)} title={c.label} className="h-6 w-6 rounded-md border border-[var(--ws-glass-border)] transition-transform hover:scale-110" style={{ backgroundColor: c.color }} />))}
              </div>
              <button onClick={unsetHighlight} className="w-full rounded-md px-2 py-1 text-xs text-[var(--ws-text-tertiary)] hover:bg-[color-mix(in_srgb,var(--ws-ink)_6%,transparent)]">Remover</button>
            </div>
          </>)}
        </div>
      </div>
      <div className="prose-editor"><EditorContent editor={editor} /></div>
    </div>
  );
}
