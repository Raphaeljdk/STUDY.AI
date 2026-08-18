// @ts-nocheck
'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Canvas,
  PencilBrush,
  Textbox,
  Rect,
  Circle,
  Line,
  Image as FabricImage,
  Group,
} from 'fabric';

import EditorToolbar from './EditorToolbar';
import TextFormattingBar, { type TextFormat } from './TextFormattingBar';
import { FloatingPenToolbar } from './FloatingPenToolbar';
import { addTape, getTapeColors, StickyTapePicker } from './StickyTape';
import PagePanel from './PagePanel';

/* ========================================================================
   SmoothBrush - Caneta estabilizada para letra bonita
   ======================================================================== */

class SmoothBrush extends PencilBrush {
  private buffer: Array<{ x: number; y: number }> = [];
  private bufferSize = 4;

  override onPointerDown(pointer: any) {
    this.buffer = [];
    super.onPointerDown(pointer);
  }

  override onPointerMove(pointer: any) {
    this.buffer.push({ x: pointer.x, y: pointer.y });
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
    if (this.buffer.length > 1) {
      const avg = this.buffer.reduce(
        (acc, p) => ({ x: acc.x + p.x / this.buffer.length, y: acc.y + p.y / this.buffer.length }),
        { x: 0, y: 0 },
      );
      super.onPointerMove(avg);
    } else {
      super.onPointerMove(pointer);
    }
  }
}

/* ========================================================================
   Tipos
   ======================================================================== */

interface CanvasEditorProps {
  initialData?: string | null;
  paperStyle?: 'blank' | 'lined' | 'grid' | 'dotted';
  paperColor?: string;
  lineColor?: string;
  onChange?: (json: string) => void;
}

interface PageData {
  id: string;
  pageNumber: number;
  paperStyle: string;
  paperColor: string;
  canvasJSON?: string;
}

/* ========================================================================
   Constantes
   ======================================================================== */

const CANVAS_W = 1200;
const CANVAS_H = 1600;
const LINE_SPACING = 32;
const MAX_UNDO = 50;
const SAVE_DEBOUNCE_MS = 800;

const DEFAULT_TEXT_FORMAT: TextFormat = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
  underline: false,
  linethrough: false,
  textAlign: 'left',
  fill: '#000000',
  lineHeight: 1.3,
  charSpacing: 0,
};

/* ========================================================================
   Componente principal
   ======================================================================== */

export default function CanvasEditor({
  initialData,
  paperStyle: initPaperStyle = 'blank',
  paperColor: initPaperColor = '#ffffff',
  lineColor: initLineColor = '#e0e0e0',
  onChange,
}: CanvasEditorProps) {
  /* ----- refs ----- */
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeToolRef = useRef('select');

  /* ----- estado da ferramenta ----- */
  const [activeTool, setActiveTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [paperStyle, setPaperStyle] = useState(initPaperStyle);
  const [paperColor, setPaperColor] = useState(initPaperColor);
  const [lineColor] = useState(initLineColor);
  const [tapeMode, setTapeMode] = useState(false);
  const [tapeColor, setTapeColor] = useState(getTapeColors()[0]);

  /* ----- texto format (Canva-like) ----- */
  const [textFormat, setTextFormat] = useState<TextFormat>({ ...DEFAULT_TEXT_FORMAT, fill: strokeColor });
  const [showTextBar, setShowTextBar] = useState(false);
  const [textBarPos, setTextBarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  /* ----- undo/redo ----- */
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const skipUndoRef = useRef(false);

  /* ----- paginas ----- */
  const [pages, setPages] = useState<PageData[]>([
    { id: 'page-1', pageNumber: 1, paperStyle: initPaperStyle, paperColor: initPaperColor },
  ]);
  const [activePageId, setActivePageId] = useState('page-1');

  /* ----- desenho de formas (temporarios) ----- */
  const isDrawingShape = useRef(false);
  const shapeOriginRef = useRef({ x: 0, y: 0 });
  const tempShapeRef = useRef<Rect | Circle | Line | null>(null);

  /* ----- auto-save debounced ----- */
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJSON = useRef<string>('');

  /* ----- space pan ----- */
  const spaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const viewportOffset = useRef({ left: 0, top: 0 });

  /* ===== propriedades especiais para serializacao ===== */
  const SERIALIZE_PROPS = ['__isPaperBg', '__isTape', '__tapeColor'];

  /* ========================================================================
     Gerador de fundo de papel
   ======================================================================== */

  const buildPaperBackground = useCallback(
    (fc: Canvas): void => {
      const existing = fc.getObjects().find((o) => (o as any).__isPaperBg);
      if (existing) fc.remove(existing);

      if (paperStyle === 'blank') return;

      const objs: any[] = [];

      if (paperStyle === 'lined') {
        for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
          objs.push(
            new Line([0, y, CANVAS_W, y], {
              stroke: lineColor,
              strokeWidth: 1,
              selectable: false,
              evented: false,
            } as any),
          );
        }
      } else if (paperStyle === 'grid') {
        for (let x = LINE_SPACING; x < CANVAS_W; x += LINE_SPACING) {
          objs.push(
            new Line([x, 0, x, CANVAS_H], {
              stroke: lineColor,
              strokeWidth: 0.5,
              selectable: false,
              evented: false,
            } as any),
          );
        }
        for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
          objs.push(
            new Line([0, y, CANVAS_W, y], {
              stroke: lineColor,
              strokeWidth: 0.5,
              selectable: false,
              evented: false,
            } as any),
          );
        }
      } else if (paperStyle === 'dotted') {
        for (let x = LINE_SPACING; x < CANVAS_W; x += LINE_SPACING) {
          for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
            objs.push(
              new Circle(
                { left: x, top: y, radius: 1.2, fill: lineColor, originX: 'center', originY: 'center' } as any,
              ),
            );
          }
        }
      }

      if (objs.length === 0) return;

      const group = new Group(objs, {
        selectable: false,
        evented: false,
      } as any);
      (group as any).__isPaperBg = true;

      fc.add(group);
      fc.sendObjectToBack(group);
    },
    [paperStyle, lineColor],
  );

  /* ========================================================================
     Undo / Redo
   ======================================================================== */

  const saveUndoState = useCallback((fc: Canvas) => {
    if (skipUndoRef.current) {
      skipUndoRef.current = false;
      return;
    }
    const json = JSON.stringify(fc.toJSON(SERIALIZE_PROPS));
    undoStackRef.current.push(json);
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    redoStackRef.current = [];
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || undoStackRef.current.length === 0) return;
    const currentJSON = JSON.stringify(fc.toJSON(SERIALIZE_PROPS));
    redoStackRef.current.push(currentJSON);
    const prevJSON = undoStackRef.current.pop()!;
    skipUndoRef.current = true;
    fc.loadFromJSON(prevJSON).then(() => {
      fc.renderAll();
      setCanUndo(undoStackRef.current.length > 0);
      setCanRedo(true);
    });
  }, []);

  const handleRedo = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || redoStackRef.current.length === 0) return;
    const currentJSON = JSON.stringify(fc.toJSON(SERIALIZE_PROPS));
    undoStackRef.current.push(currentJSON);
    const nextJSON = redoStackRef.current.pop()!;
    skipUndoRef.current = true;
    fc.loadFromJSON(nextJSON).then(() => {
      fc.renderAll();
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
    });
  }, []);

  /* ========================================================================
     Auto-save debounced
   ======================================================================== */

  const scheduleAutoSave = useCallback((fc: Canvas) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const json = JSON.stringify(fc.toJSON(SERIALIZE_PROPS));
      if (json !== lastSavedJSON.current) {
        lastSavedJSON.current = json;
        onChange?.(json);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [onChange]);

  /* ========================================================================
     Atualizar brush/ferramenta
   ======================================================================== */

  const applyTool = useCallback(
    (fc: Canvas, tool: string) => {
      fc.isDrawingMode = false;
      fc.selection = tool === 'select';
      activeToolRef.current = tool;

      switch (tool) {
        case 'pen': {
          fc.isDrawingMode = true;
          const brush = new SmoothBrush(fc);
          brush.color = strokeColor;
          brush.width = 1.5;
          fc.freeDrawingBrush = brush;
          break;
        }
        case 'pencil': {
          fc.isDrawingMode = true;
          const brush = new SmoothBrush(fc);
          brush.color = strokeColor;
          brush.width = 3;
          fc.freeDrawingBrush = brush;
          break;
        }
        case 'highlighter': {
          fc.isDrawingMode = true;
          const brush = new PencilBrush(fc);
          brush.color = strokeColor;
          brush.width = 20;
          (brush as any).globalCompositeOperation = 'multiply';
          fc.freeDrawingBrush = brush;
          break;
        }
        case 'eraser': {
          fc.isDrawingMode = true;
          const brush = new PencilBrush(fc);
          brush.color = paperColor;
          brush.width = 20;
          fc.freeDrawingBrush = brush;
          break;
        }
        case 'text':
        case 'rectangle':
        case 'circle':
        case 'line':
        case 'select':
          break;
      }

      // Cursor
      if (tool === 'text') {
        fc.defaultCursor = 'text';
        fc.hoverCursor = 'text';
      } else if (tool === 'select') {
        fc.defaultCursor = 'default';
        fc.hoverCursor = 'move';
      } else {
        fc.defaultCursor = 'crosshair';
        fc.hoverCursor = 'crosshair';
      }
    },
    [strokeColor, paperColor],
  );

  /* ========================================================================
     Text helpers
   ======================================================================== */

  const syncFormatFromText = useCallback((obj: any) => {
    if (!obj || obj.type !== 'textbox') return;
    setTextFormat({
      fontFamily: obj.fontFamily || DEFAULT_TEXT_FORMAT.fontFamily,
      fontSize: obj.fontSize || DEFAULT_TEXT_FORMAT.fontSize,
      fontWeight: obj.fontWeight || 'normal',
      fontStyle: obj.fontStyle || 'normal',
      underline: !!obj.underline,
      linethrough: !!obj.linethrough,
      textAlign: obj.textAlign || 'left',
      fill: obj.fill || '#000000',
      lineHeight: obj.lineHeight || 1.3,
      charSpacing: obj.charSpacing || 0,
    });
  }, []);

  const applyFormatToActiveText = useCallback(
    (patch: Partial<TextFormat>) => {
      const fc = fcRef.current;
      if (!fc) return;
      const obj = fc.getActiveObject() as any;
      if (!obj || obj.type !== 'textbox') return;

      setTextFormat((prev) => {
        const next = { ...prev, ...patch };
        obj.set({
          fontFamily: next.fontFamily,
          fontSize: next.fontSize,
          fontWeight: next.fontWeight,
          fontStyle: next.fontStyle,
          underline: next.underline,
          linethrough: next.linethrough,
          textAlign: next.textAlign,
          fill: next.fill,
          lineHeight: next.lineHeight,
          charSpacing: next.charSpacing,
        });
        fc.renderAll();
        scheduleAutoSave(fc);
        return next;
      });
    },
    [scheduleAutoSave],
  );

  const updateTextBarPosition = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject() as any;
    if (!obj || obj.type !== 'textbox') {
      setShowTextBar(false);
      return;
    }

    const canvasRect = containerRef.current?.querySelector('canvas')?.getBoundingClientRect();
    if (!canvasRect) return;

    // Get the bounding rect of the text object in viewport coordinates
    const objBound = obj.getBoundingRect(true, true);
    const vpt = fc.viewportTransform!;
    const scaleX = vpt[0];
    const scaleY = vpt[3];

    const barLeft = canvasRect.left + objBound.left * scaleX;
    const barTop = canvasRect.top + objBound.top * scaleY - 44;

    setTextBarPos({ top: Math.max(4, barTop), left: barLeft });
    setShowTextBar(true);
  }, []);

  /* ========================================================================
     Inicializacao do canvas
   ======================================================================== */

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const fc = new Canvas(el, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: paperColor,
      selection: true,
      preserveObjectStacking: true,
    });
    fcRef.current = fc;

    // Fundo do papel
    buildPaperBackground(fc);
    fc.renderAll();

    // Carregar estado inicial se existir
    if (initialData) {
      try {
        fc.loadFromJSON(initialData).then(() => {
          fc.renderAll();
          saveUndoState(fc);
        });
      } catch {
        saveUndoState(fc);
      }
    } else {
      saveUndoState(fc);
    }

    /* ---------- eventos de ferramenta ---------- */

    fc.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      const pointer = fc.getScenePoint(e);
      const currentTool = activeToolRef.current;

      // Fita adesiva
      if (tapeMode) {
        addTape(fc, pointer.x, pointer.y, tapeColor);
        saveUndoState(fc);
        scheduleAutoSave(fc);
        return;
      }

      // Ferramenta de texto - criar Textbox Canva-style
      if (currentTool === 'text') {
        // If clicking on existing text, let fabric handle it (double-click to edit)
        const target = opt.target as any;
        if (target && target.type === 'textbox') {
          return; // Let fabric handle selection/editing of existing text
        }

        const textbox = new Textbox('', {
          left: pointer.x,
          top: pointer.y,
          width: 300,
          fontSize: textFormat.fontSize,
          fill: strokeColor,
          fontFamily: textFormat.fontFamily,
          fontWeight: textFormat.fontWeight,
          fontStyle: textFormat.fontStyle,
          underline: textFormat.underline,
          linethrough: textFormat.linethrough,
          textAlign: textFormat.textAlign,
          lineHeight: textFormat.lineHeight,
          charSpacing: textFormat.charSpacing,
          editable: true,
          cursorColor: '#000000',
          cursorWidth: 2,
          editingBorderColor: '#f59e0b',
          padding: 8,
        } as any);

        fc.add(textbox);
        fc.setActiveObject(textbox);
        fc.renderAll();

        // Enter editing mode with a small delay for reliable focus
        setTimeout(() => {
          (textbox as any).enterEditing();
          (textbox as any).selectAll();
          // Focus the hidden textarea that fabric creates
          const hiddenTextarea = el.parentElement?.querySelector('textarea.fabric-textbox') as HTMLTextAreaElement;
          if (hiddenTextarea) {
            hiddenTextarea.focus();
          }
        }, 50);

        // Switch back to select after creating text (Canva behavior)
        setActiveTool('select');
        activeToolRef.current = 'select';
        applyTool(fc, 'select');

        saveUndoState(fc);
        scheduleAutoSave(fc);
        return;
      }

      // Pan com space ou botao do meio
      if (spaceHeld.current || e.button === 1) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        viewportOffset.current = { left: fc.viewportLeft, top: fc.viewportTop };
        fc.selection = false;
        return;
      }

      // Formas (retangulo, circulo, linha)
      if (['rectangle', 'circle', 'line'].includes(currentTool)) {
        isDrawingShape.current = true;
        shapeOriginRef.current = { x: pointer.x, y: pointer.y };

        if (currentTool === 'rectangle') {
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth,
          } as any);
          fc.add(rect);
          fc.setActiveObject(rect);
          tempShapeRef.current = rect;
        } else if (currentTool === 'circle') {
          const circ = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 1,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth,
            originX: 'center',
            originY: 'center',
          } as any);
          fc.add(circ);
          fc.setActiveObject(circ);
          tempShapeRef.current = circ;
        } else if (currentTool === 'line') {
          const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: strokeColor,
            strokeWidth,
          } as any);
          fc.add(line);
          fc.setActiveObject(line);
          tempShapeRef.current = line;
        }
      }
    });

    fc.on('mouse:move', (opt) => {
      const e = opt.e as MouseEvent;

      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        fc.setViewportTransform([
          zoom, 0, 0, zoom,
          viewportOffset.current.left + dx,
          viewportOffset.current.top + dy,
        ]);
        return;
      }

      if (isDrawingShape.current && tempShapeRef.current) {
        const pointer = fc.getScenePoint(e);
        const origin = shapeOriginRef.current;
        const shape = tempShapeRef.current;

        if (activeTool === 'rectangle') {
          const left = Math.min(origin.x, pointer.x);
          const top = Math.min(origin.y, pointer.y);
          const w = Math.abs(pointer.x - origin.x);
          const h = Math.abs(pointer.y - origin.y);
          shape.set({ left, top, width: w, height: h });
        } else if (activeTool === 'circle') {
          const dx = pointer.x - origin.x;
          const dy = pointer.y - origin.y;
          const r = Math.sqrt(dx * dx + dy * dy) / 2;
          const cx = (origin.x + pointer.x) / 2;
          const cy = (origin.y + pointer.y) / 2;
          shape.set({ left: cx, top: cy, radius: Math.max(1, r) } as any);
        } else if (activeTool === 'line') {
          (shape as any).set({ x2: pointer.x, y2: pointer.y });
        }
        fc.renderAll();
      }
    });

    fc.on('mouse:up', () => {
      if (isPanning.current) {
        isPanning.current = false;
        fc.selection = activeToolRef.current === 'select';
        return;
      }

      if (isDrawingShape.current) {
        isDrawingShape.current = false;
        tempShapeRef.current = null;
        saveUndoState(fc);
        scheduleAutoSave(fc);
      }
    });

    fc.on('path:created', () => {
      saveUndoState(fc);
      scheduleAutoSave(fc);
    });

    fc.on('object:modified', () => {
      saveUndoState(fc);
      scheduleAutoSave(fc);
    });

    /* ---------- Text object events ---------- */

    // When text starts/ends editing, update the toolbar
    fc.on('text:editing:entered', () => {
      const obj = fc.getActiveObject() as any;
      if (obj) syncFormatFromText(obj);
      updateTextBarPosition();
    });

    fc.on('text:editing:exited', () => {
 const obj = fc.getActiveObject() as any;
      if (obj && obj.type === 'textbox') {
        // If text is empty after editing, remove it
        if (!obj.text || obj.text.trim() === '') {
          fc.remove(obj);
          fc.renderAll();
          setShowTextBar(false);
          saveUndoState(fc);
          scheduleAutoSave(fc);
          return;
        }
        saveUndoState(fc);
        scheduleAutoSave(fc);
      }
    });

    // When selection changes, show/hide text bar
    fc.on('selection:created', (opt) => {
      const obj = opt.selected?.[0] as any;
      if (obj && obj.type === 'textbox') {
        syncFormatFromText(obj);
        setTimeout(updateTextBarPosition, 10);
      } else {
        setShowTextBar(false);
      }
    });

    fc.on('selection:updated', (opt) => {
      const obj = opt.selected?.[0] as any;
      if (obj && obj.type === 'textbox') {
        syncFormatFromText(obj);
        setTimeout(updateTextBarPosition, 10);
      } else {
        setShowTextBar(false);
      }
    });

    fc.on('selection:cleared', () => {
      setShowTextBar(false);
    });

    /* ---------- zoom com rolagem ---------- */

    fc.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      let newZoom = zoom + (delta > 0 ? -0.05 : 0.05);
      newZoom = Math.min(5, Math.max(0.1, newZoom));

      const vpt = fc.viewportTransform;
      const newVpt = [...vpt];
      newVpt[0] = newZoom;
      newVpt[3] = newZoom;
      newVpt[4] = vpt[4] + (vpt[0] - newZoom) * (CANVAS_W / 2);
      newVpt[5] = vpt[5] + (vpt[3] - newZoom) * (CANVAS_H / 2);

      fc.setViewportTransform(newVpt as [number, number, number, number, number, number]);
      setZoom(newZoom);
    });

    // Ferramenta inicial
    applyTool(fc, activeTool);

    return () => {
      fc.dispose();
      fcRef.current = null;
    };
    }, []);

  /* ========================================================================
     Sincronizar estado de ferramenta com canvas
   ======================================================================== */

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    applyTool(fc, activeTool);
  }, [activeTool, strokeColor, strokeWidth, paperColor, applyTool]);

  /* ========================================================================
     Mudanca de cor de papel / estilo - reconstruir fundo
   ======================================================================== */

  useEffect(() => {
    const fc = fcRef.current;
    if (!fc) return;
    fc.backgroundColor = paperColor;
    buildPaperBackground(fc);
    fc.renderAll();
    scheduleAutoSave(fc);
  }, [paperColor, paperStyle, buildPaperBackground, scheduleAutoSave]);

  /* ========================================================================
     Atalhos de teclado
   ======================================================================== */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fc = fcRef.current;
      const activeObj = fc?.getActiveObject() as any;

      // Don't intercept if editing text
      if (activeObj && activeObj.isEditing) {
        // But handle formatting shortcuts inside text
        if ((e.ctrlKey || e.metaKey)) {
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            const newWeight = activeObj.fontWeight === 'bold' ? 'normal' : 'bold';
            activeObj.set('fontWeight', newWeight);
            fc?.renderAll();
            syncFormatFromText(activeObj);
          } else if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            const newStyle = activeObj.fontStyle === 'italic' ? 'normal' : 'italic';
            activeObj.set('fontStyle', newStyle);
            fc?.renderAll();
            syncFormatFromText(activeObj);
          } else if (e.key === 'u' || e.key === 'U') {
            e.preventDefault();
            activeObj.set('underline', !activeObj.underline);
            fc?.renderAll();
            syncFormatFromText(activeObj);
          }
        }
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeld.current = true;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      // Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObj && !activeObj.isEditing) {
        fc?.remove(activeObj);
        fc?.renderAll();
        saveUndoState(fc);
        scheduleAutoSave(fc);
      }

      // Double-tap T shortcut for text
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setActiveTool('text');
        }
      }

      // Escape to deselect / exit text mode
      if (e.key === 'Escape') {
        if (activeObj && activeObj.isEditing) {
          (activeObj as any).exitEditing();
        } else {
          fc?.discardActiveObject();
          fc?.renderAll();
          setShowTextBar(false);
        }
      }

      // Enter on selected text to start editing
      if (e.key === 'Enter' && activeObj && activeObj.type === 'textbox' && !activeObj.isEditing) {
        e.preventDefault();
        (activeObj as any).enterEditing();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, saveUndoState, scheduleAutoSave, syncFormatFromText]);

  /* ========================================================================
     Paginas
   ======================================================================== */

  const handlePageSelect = useCallback(
    (id: string) => {
      const fc = fcRef.current;
      if (!fc) return;

      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId
            ? { ...p, canvasJSON: JSON.stringify(fc.toJSON(SERIALIZE_PROPS)) }
            : p,
        ),
      );

      const page = pages.find((p) => p.id === id);
      if (!page) return;

      setActivePageId(id);
      setPaperStyle(page.paperStyle);
      setPaperColor(page.paperColor);
      setShowTextBar(false);

      const objects = fc.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        fc.remove(objects[i]);
      }

      if (page.canvasJSON) {
        try {
          fc.loadFromJSON(page.canvasJSON).then(() => {
            fc.renderAll();
            saveUndoState(fc);
          });
        } catch {
          buildPaperBackground(fc);
          fc.renderAll();
          saveUndoState(fc);
        }
      } else {
        buildPaperBackground(fc);
        fc.renderAll();
        saveUndoState(fc);
      }
    },
    [activePageId, pages, buildPaperBackground, saveUndoState],
  );

  const handleAddPage = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;

    setPages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? { ...p, canvasJSON: JSON.stringify(fc.toJSON(SERIALIZE_PROPS)) }
          : p,
      ),
    );

    const newId = `page-${Date.now()}`;
    const newPage: PageData = {
      id: newId,
      pageNumber: pages.length + 1,
      paperStyle,
      paperColor,
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setShowTextBar(false);

    const objects = fc.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      fc.remove(objects[i]);
    }
    buildPaperBackground(fc);
    fc.renderAll();
    saveUndoState(fc);
  }, [activePageId, pages.length, paperStyle, paperColor, buildPaperBackground, saveUndoState]);

  const handleDeletePage = useCallback(
    (id: string) => {
      if (pages.length <= 1) return;

      setPages((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      });

      if (id === activePageId) {
        const remaining = pages.filter((p) => p.id !== id);
        if (remaining.length > 0) {
          handlePageSelect(remaining[0].id);
        }
      }
    },
    [pages, activePageId, handlePageSelect],
  );

  /* ========================================================================
     Adicionar texto / imagem
   ======================================================================== */

  const handleAddText = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    setActiveTool('text');
    applyTool(fc, 'text');
  }, [applyTool]);

  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fc = fcRef.current;
      if (!fc) return;
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        FabricImage.fromURL(dataUrl).then((img) => {
          const scale = Math.min(
            (CANVAS_W * 0.6) / (img.width || 1),
            (CANVAS_H * 0.6) / (img.height || 1),
            1,
          );
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: CANVAS_W / 2 - ((img.width || 0) * scale) / 2,
            top: CANVAS_H / 2 - ((img.height || 0) * scale) / 2,
          } as any);
          fc.add(img);
          fc.setActiveObject(img);
          fc.renderAll();
          saveUndoState(fc);
          scheduleAutoSave(fc);
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [saveUndoState, scheduleAutoSave],
  );

  /* ========================================================================
     Render
   ======================================================================== */

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col bg-gray-100"
      style={{ cursor: activeTool === 'select' ? 'default' : activeTool === 'text' ? 'text' : 'crosshair' }}
    >
      {/* Toolbar fixa no topo */}
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        strokeColor={strokeColor}
        onColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        paperStyle={paperStyle}
        onPaperStyleChange={setPaperStyle}
        paperColor={paperColor}
        onPaperColorChange={setPaperColor}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onToggleTape={() => setTapeMode((prev) => !prev)}
        tapeMode={tapeMode}
      />

      {/* Floating text formatting bar (Canva-style) */}
      <TextFormattingBar
        format={textFormat}
        onFormatChange={applyFormatToActiveText}
        visible={showTextBar}
        position={textBarPos}
      />

      {/* Fita color picker (aparece quando tapeMode ativo) */}
      {tapeMode && (
        <div className="flex items-center gap-3 rounded-b-xl border border-t-0 border-black/5 bg-white/80 px-3 py-2 backdrop-blur-md">
          <span className="text-xs font-medium text-gray-500">Cor da fita:</span>
          <StickyTapePicker activeTapeColor={tapeColor} onColorSelect={setTapeColor} />
          <span className="ml-auto text-xs text-gray-400">Clique no canvas para adicionar fita</span>
        </div>
      )}

      {/* Area principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel de paginas (desktop) */}
        <div className="hidden md:block">
          <PagePanel
            pages={pages}
            activePageId={activePageId}
            onPageSelect={handlePageSelect}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
          />
        </div>

        {/* Canvas wrapper */}
        <div className="relative flex-1 overflow-auto flex items-start justify-center p-4">
          <div
            className="shadow-xl"
            style={{
              width: CANVAS_W * zoom,
              height: CANVAS_H * zoom,
              overflow: 'hidden',
              borderRadius: '4px',
            }}
          >
            <canvas ref={canvasElRef} />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Floating pen toolbar */}
          <FloatingPenToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            strokeColor={strokeColor}
            onStrokeColorChange={setStrokeColor}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onImageImport={handleAddImage}
            smoothing="media"
            onSmoothingChange={() => {}}
            stabilizer={50}
            onStabilizerChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
