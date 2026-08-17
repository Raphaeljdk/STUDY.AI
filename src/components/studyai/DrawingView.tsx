'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pen, Eraser, Trash2, Undo2, Redo2, Download, ZoomIn, ZoomOut,
  Grid3x3, Square, Circle, Minus, ArrowRight, Ruler, DoorOpen,
  Home as HomeIcon, Layers, Plus, Eye, EyeOff, ChevronDown, ChevronUp,
  MousePointer, Type, Palette, MinusSquare, Maximize2, Hand,
} from 'lucide-react';

// ===== TYPES =====
interface DrawingViewProps {
  onNavigate?: (tab: string) => void;
}

type DrawingMode = 'artistic' | 'technical' | 'architecture';

type ArtisticTool = 'brush' | 'eraser' | 'pan' | 'color-picker';
type TechnicalTool = 'line' | 'rectangle' | 'circle' | 'arrow' | 'pan' | 'text' | 'dimension';
type ArchitectureTool = 'wall' | 'room' | 'door' | 'window-arch' | 'pan' | 'dimension-arch' | 'ruler';

type Tool = ArtisticTool | TechnicalTool | ArchitectureTool;

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement | null;
}

interface Point {
  x: number;
  y: number;
}

// ===== JAPANESE-INSPIRED COLOR PALETTE =====
const JAPANESE_COLORS = [
  { name: 'Sumi Ink', color: '#1A1A1A' },
  { name: 'Vermillion', color: '#D93838' },
  { name: 'Indigo', color: '#264653' },
  { name: 'Sage Green', color: '#5B8C5A' },
  { name: 'Gold', color: '#B8A088' },
  { name: 'Burnt Ochre', color: '#C04020' },
  { name: 'Sakura', color: '#D07088' },
  { name: 'Pale Blue', color: '#7A9EAD' },
  { name: 'Bamboo', color: '#8B7355' },
  { name: 'Plum', color: '#6B3A5B' },
  { name: 'Moss', color: '#4A6741' },
  { name: 'Cream', color: '#F5F0E8' },
];

// ===== MODE CONFIG =====
const MODE_TABS: { id: DrawingMode; label: string; icon: typeof Pen }[] = [
  { id: 'artistic', label: 'Artistico', icon: Pen },
  { id: 'technical', label: 'Tecnico', icon: Ruler },
  { id: 'architecture', label: 'Arquitetura', icon: HomeIcon },
];

// ===== DEFAULT LAYER NAMES =====
const DEFAULT_LAYERS = ['Fundo', 'Desenho', 'Anotacoes'];

// ===== TOOL DEFINITIONS =====
const ARTISTIC_TOOLS: { id: ArtisticTool; icon: typeof Pen; label: string }[] = [
  { id: 'brush', icon: Pen, label: 'Pincel' },
  { id: 'eraser', icon: Eraser, label: 'Borracha' },
  { id: 'color-picker', icon: Palette, label: 'Cor' },
  { id: 'pan', icon: Hand, label: 'Mover' },
];

const TECHNICAL_TOOLS: { id: TechnicalTool; icon: typeof Pen; label: string }[] = [
  { id: 'line', icon: Minus, label: 'Linha' },
  { id: 'rectangle', icon: Square, label: 'Retangulo' },
  { id: 'circle', icon: Circle, label: 'Circulo' },
  { id: 'arrow', icon: ArrowRight, label: 'Seta' },
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'dimension', icon: Ruler, label: 'Dimensao' },
  { id: 'pan', icon: Hand, label: 'Mover' },
];

const ARCHITECTURE_TOOLS: { id: ArchitectureTool; icon: typeof Pen; label: string }[] = [
  { id: 'wall', icon: MinusSquare, label: 'Parede' },
  { id: 'room', icon: Square, label: 'Comodo' },
  { id: 'door', icon: DoorOpen, label: 'Porta' },
  { id: 'window-arch', icon: Maximize2, label: 'Janela' },
  { id: 'dimension-arch', icon: Ruler, label: 'Dimensao' },
  { id: 'ruler', icon: Ruler, label: 'Escala' },
  { id: 'pan', icon: Hand, label: 'Mover' },
];

// ===== HELPER: generate id =====
let idCounter = 0;
function uid() {
  return `layer-${++idCounter}-${Date.now()}`;
}

// ===== MAIN COMPONENT =====
export default function DrawingView({ onNavigate }: DrawingViewProps) {
  // --- Mode & Tool ---
  const [mode, setMode] = useState<DrawingMode>('artistic');
  const [tool, setTool] = useState<Tool>('brush');

  // --- Canvas state ---
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // --- Drawing state ---
  const [color, setColor] = useState('#1A1A1A');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });

  // --- Layers ---
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState('');
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);

  // --- History ---
  // Store snapshots of all layer canvases for undo/redo
  const historyRef = useRef<Map<string, ImageData>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // --- Drawing internals ---
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const panStartRef = useRef<Point | null>(null);
  const panOffsetStartRef = useRef<Point | null>(null);
  const activeLayerRef = useRef<Layer | null>(null);

  // --- Room label input ---
  const [roomLabelInput, setRoomLabelInput] = useState<{ show: boolean; x: number; y: number; w: number; h: number } | null>(null);
  const [roomLabel, setRoomLabel] = useState('');

  // --- Text input ---
  const [textInput, setTextInput] = useState<{ show: boolean; x: number; y: number } | null>(null);
  const [textContent, setTextContent] = useState('');

  // ===== INITIALIZE LAYERS =====
  const initLayers = useCallback(() => {
    const newLayers: Layer[] = DEFAULT_LAYERS.map((name, i) => ({
      id: uid(),
      name,
      visible: true,
      opacity: i === 0 ? 1 : 1,
      canvas: null,
    }));
    setLayers(newLayers);
    setActiveLayerId(newLayers[1].id); // 'Desenho' is active by default
  }, []);

  useEffect(() => {
    initLayers();
  }, [initLayers]);

  // ===== CANVAS SIZING =====
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      setCanvasSize({ w: rect.width, h: rect.height });

      const dc = displayCanvasRef.current;
      const tc = tempCanvasRef.current;
      if (dc) {
        dc.width = rect.width * dpr;
        dc.height = rect.height * dpr;
        dc.style.width = `${rect.width}px`;
        dc.style.height = `${rect.height}px`;
      }
      if (tc) {
        tc.width = rect.width * dpr;
        tc.height = rect.height * dpr;
        tc.style.width = `${rect.width}px`;
        tc.style.height = `${rect.height}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== SYNC LAYER CANVASES =====
  useEffect(() => {
    setLayers((prev) =>
      prev.map((l) => {
        if (!l.canvas) {
          const c = document.createElement('canvas');
          c.width = canvasSize.w * (window.devicePixelRatio || 1);
          c.height = canvasSize.h * (window.devicePixelRatio || 1);
          return { ...l, canvas: c };
        }
        // Resize if needed
        const dpr = window.devicePixelRatio || 1;
        if (l.canvas.width !== canvasSize.w * dpr || l.canvas.height !== canvasSize.h * dpr) {
          const oldData = l.canvas.getContext('2d')?.getImageData(0, 0, l.canvas.width, l.canvas.height);
          l.canvas.width = canvasSize.w * dpr;
          l.canvas.height = canvasSize.h * dpr;
          if (oldData) {
            l.canvas.getContext('2d')?.putImageData(oldData, 0, 0);
          }
        }
        return l;
      })
    );
  }, [canvasSize]);

  // ===== ACTIVE LAYER REF =====
  useEffect(() => {
    activeLayerRef.current = layers.find((l) => l.id === activeLayerId) || null;
  }, [layers, activeLayerId]);

  // ===== COMPOSITE RENDERING =====
  const compositeRender = useCallback(() => {
    const dc = displayCanvasRef.current;
    if (!dc) return;
    const ctx = dc.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

    // Paper texture background
    drawPaperTexture(ctx, canvasSize.w, canvasSize.h);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvasSize.w, canvasSize.h, gridSize, zoom, panOffset, mode);
    }

    // Apply zoom and pan
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Composite all visible layers
    for (const layer of layers) {
      if (!layer.visible || !layer.canvas) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, canvasSize.w, canvasSize.h);
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // Draw temp canvas (shape preview)
    const tc = tempCanvasRef.current;
    if (tc) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tc, 0, 0);
    }
  }, [layers, showGrid, gridSize, zoom, panOffset, canvasSize, mode]);

  // Re-render on state changes
  useEffect(() => {
    compositeRender();
  }, [compositeRender]);

  // ===== PAPER TEXTURE =====
  function drawPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'sumi-ink';
    if (isDark) {
      ctx.fillStyle = '#1A1A1A';
    } else {
      // Warm paper gradient
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, '#FAF8F2');
      grad.addColorStop(0.6, '#F5F0E8');
      grad.addColorStop(1, '#EDE8DC');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, w, h);

    // Subtle noise dots
    if (!isDark) {
      ctx.fillStyle = 'rgba(180, 170, 155, 0.04)';
      for (let i = 0; i < 200; i++) {
        const x = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w;
        const y = (Math.sin(i * 269.5 + 183.3) * 0.5 + 0.5) * h;
        const r = 0.5 + (i % 3) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ===== GRID =====
  function drawGrid(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    size: number,
    z: number,
    offset: Point,
    m: DrawingMode
  ) {
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(z, z);
    ctx.strokeStyle = m === 'architecture' ? 'rgba(100, 100, 100, 0.2)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 0.5 / z;

    const scaledSize = size;
    const startX = -offset.x / z;
    const startY = -offset.y / z;
    const endX = startX + w / z;
    const endY = startY + h / z;

    ctx.beginPath();
    for (let x = Math.floor(startX / scaledSize) * scaledSize; x <= endX; x += scaledSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = Math.floor(startY / scaledSize) * scaledSize; y <= endY; y += scaledSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Metric labels for architecture
    if (m === 'architecture') {
      ctx.scale(1 / z, 1 / z);
      ctx.font = `${10}px sans-serif`;
      ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      for (let x = Math.floor(startX / (scaledSize * 5)) * (scaledSize * 5); x <= endX; x += scaledSize * 5) {
        const meter = Math.round(x / (scaledSize * 5));
        ctx.fillText(`${meter}m`, x * z, (startY - 4) * z);
      }
      for (let y = Math.floor(startY / (scaledSize * 5)) * (scaledSize * 5); y <= endY; y += scaledSize * 5) {
        const meter = Math.round(y / (scaledSize * 5));
        ctx.save();
        ctx.translate((startX - 4) * z, y * z);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${meter}m`, 0, 0);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ===== HISTORY =====
  // We snapshot all layer canvas ImageData so undo/redo restores the source of truth
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const saveToHistory = useCallback(() => {
    const snapshot = new Map<string, ImageData>();
    for (const layer of layersRef.current) {
      if (layer.canvas) {
        const ctx = layer.canvas.getContext('2d');
        if (ctx) {
          snapshot.set(layer.id, ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height));
        }
      }
    }
    const newHistory = historyRef.current.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 50) newHistory.shift();
    historyRef.current = newHistory;
    const newIdx = newHistory.length - 1;
    setHistoryIndex(newIdx);
    setCanUndo(newIdx > 0);
    setCanRedo(false);
  }, [historyIndex]);

  const restoreFromHistory = useCallback((snapshot: Map<string, ImageData>) => {
    setLayers((prev) =>
      prev.map((l) => {
        const data = snapshot.get(l.id);
        if (data && l.canvas) {
          if (l.canvas.width === data.width && l.canvas.height === data.height) {
            const ctx = l.canvas.getContext('2d');
            if (ctx) ctx.putImageData(data, 0, 0);
          } else {
            l.canvas.width = data.width;
            l.canvas.height = data.height;
            const ctx = l.canvas.getContext('2d');
            if (ctx) ctx.putImageData(data, 0, 0);
          }
        }
        // Return a new object ref so React re-renders
        return { ...l };
      })
    );
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const snapshot = historyRef.current[prevIdx];
    if (snapshot) {
      restoreFromHistory(snapshot);
    }
    setHistoryIndex(prevIdx);
    setCanUndo(prevIdx > 0);
    setCanRedo(true);
  }, [historyIndex, restoreFromHistory]);

  const redo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snapshot = historyRef.current[nextIdx];
    if (snapshot) {
      restoreFromHistory(snapshot);
    }
    setHistoryIndex(nextIdx);
    setCanUndo(true);
    setCanRedo(nextIdx < historyRef.current.length - 1);
  }, [historyIndex, restoreFromHistory]);

  // Initial history save (after layers are created with canvases)
  useEffect(() => {
    const timer = setTimeout(() => saveToHistory(), 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // ===== COORDINATE HELPERS =====
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
      const dc = displayCanvasRef.current;
      if (!dc) return { x: 0, y: 0 };
      const rect = dc.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ('touches' in e) {
        const touch = e.touches[0] || (e as TouchEvent).changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      let x = (clientX - rect.left - panOffset.x) / zoom;
      let y = (clientY - rect.top - panOffset.y) / zoom;
      if (snapToGrid && showGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      return { x, y };
    },
    [zoom, panOffset, snapToGrid, showGrid, gridSize]
  );

  // ===== GET LAYER CTX =====
  const getLayerCtx = useCallback((): CanvasRenderingContext2D | null => {
    const layer = layers.find((l) => l.id === activeLayerId);
    if (!layer?.canvas) return null;
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }, [layers, activeLayerId]);

  // ===== DRAWING HANDLERS =====
  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getCanvasPoint(e);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      startPointRef.current = point;

      if (tool === 'pan') {
        panStartRef.current = { x: 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX, y: 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY };
        panOffsetStartRef.current = { ...panOffset };
        return;
      }

      if (tool === 'text') {
        setTextInput({ show: true, x: point.x, y: point.y });
        setTextContent('');
        isDrawingRef.current = false;
        return;
      }

      if (tool === 'color-picker') {
        isDrawingRef.current = false;
        // Pick color from display canvas
        const dc = displayCanvasRef.current;
        if (dc) {
          const rect = dc.getBoundingClientRect();
          let cx: number, cy: number;
          if ('touches' in e) {
            cx = e.touches[0]?.clientX ?? 0;
            cy = e.touches[0]?.clientY ?? 0;
          } else {
            cx = e.clientX;
            cy = e.clientY;
          }
          const dpr = window.devicePixelRatio || 1;
          const px = (cx - rect.left) * dpr;
          const py = (cy - rect.top) * dpr;
          const ctx = dc.getContext('2d');
          if (ctx) {
            const pixel = ctx.getImageData(px, py, 1, 1).data;
            const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
            setColor(hex);
          }
        }
        return;
      }

      // For freehand drawing (brush/eraser), start path on the layer
      if (tool === 'brush' || tool === 'eraser') {
        const ctx = getLayerCtx();
        if (ctx) {
          ctx.save();
          if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
          }
          ctx.globalAlpha = tool === 'eraser' ? 1 : opacity;
          ctx.lineWidth = brushSize / zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          // Draw a dot for single click
          ctx.lineTo(point.x + 0.1, point.y + 0.1);
          ctx.stroke();
          ctx.restore();
          compositeRender();
        }
      }
    },
    [tool, getCanvasPoint, panOffset, getLayerCtx, color, opacity, brushSize, zoom, compositeRender]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      if (tool === 'pan' && panStartRef.current && panOffsetStartRef.current) {
        const cx = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
        const cy = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
        const dx = cx - panStartRef.current.x;
        const dy = cy - panStartRef.current.y;
        setPanOffset({ x: panOffsetStartRef.current.x + dx, y: panOffsetStartRef.current.y + dy });
        return;
      }

      const point = getCanvasPoint(e);

      // Freehand brush/eraser
      if (tool === 'brush' || tool === 'eraser') {
        const ctx = getLayerCtx();
        if (ctx && lastPointRef.current) {
          ctx.save();
          if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
          }
          ctx.globalAlpha = tool === 'eraser' ? 1 : opacity;
          ctx.lineWidth = brushSize / zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.restore();
          compositeRender();
        }
        lastPointRef.current = point;
        return;
      }

      // Shape preview on temp canvas
      if (startPointRef.current) {
        const tc = tempCanvasRef.current;
        if (!tc) return;
        const tctx = tc.getContext('2d');
        if (!tctx) return;
        const dpr = window.devicePixelRatio || 1;
        tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        tctx.clearRect(0, 0, canvasSize.w, canvasSize.h);

        tctx.save();
        tctx.translate(panOffset.x, panOffset.y);
        tctx.scale(zoom, zoom);
        tctx.strokeStyle = color;
        tctx.fillStyle = 'transparent';
        tctx.lineWidth = brushSize / zoom;
        tctx.lineCap = 'round';
        tctx.globalAlpha = opacity;

        const sp = startPointRef.current;

        if (tool === 'line' || tool === 'wall') {
          tctx.lineWidth = tool === 'wall' ? 12 / zoom : brushSize / zoom;
          tctx.beginPath();
          tctx.moveTo(sp.x, sp.y);
          tctx.lineTo(point.x, point.y);
          tctx.stroke();
        } else if (tool === 'rectangle' || tool === 'room') {
          const w = point.x - sp.x;
          const h = point.y - sp.y;
          tctx.lineWidth = tool === 'room' ? 8 / zoom : brushSize / zoom;
          tctx.strokeRect(sp.x, sp.y, w, h);
          if (tool === 'room') {
            tctx.fillStyle = 'rgba(0,0,0,0.03)';
            tctx.fillRect(sp.x, sp.y, w, h);
          }
        } else if (tool === 'circle') {
          const rx = Math.abs(point.x - sp.x) / 2;
          const ry = Math.abs(point.y - sp.y) / 2;
          const cx = sp.x + (point.x - sp.x) / 2;
          const cy = sp.y + (point.y - sp.y) / 2;
          tctx.beginPath();
          tctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          tctx.stroke();
        } else if (tool === 'arrow') {
          drawArrow(tctx, sp, point, brushSize / zoom);
        } else if (tool === 'door') {
          drawDoor(tctx, sp, point);
        } else if (tool === 'window-arch') {
          drawWindow(tctx, sp, point);
        } else if (tool === 'dimension' || tool === 'dimension-arch') {
          drawDimensionLine(tctx, sp, point);
        } else if (tool === 'ruler') {
          drawRuler(tctx, sp, point);
        }

        tctx.restore();
        compositeRender();
      }
    },
    [tool, getCanvasPoint, getLayerCtx, color, opacity, brushSize, zoom, panOffset, canvasSize, compositeRender]
  );

  const handlePointerUp = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      if (tool === 'pan') {
        panStartRef.current = null;
        panOffsetStartRef.current = null;
        return;
      }

      const point = getCanvasPoint(e);

      // Commit shape to layer
      if (startPointRef.current && tool !== 'brush' && tool !== 'eraser') {
        const ctx = getLayerCtx();
        if (ctx) {
          ctx.save();
          ctx.translate(0, 0);
          ctx.strokeStyle = color;
          ctx.lineWidth = brushSize / zoom;
          ctx.lineCap = 'round';
          ctx.globalAlpha = opacity;

          const sp = startPointRef.current;

          if (tool === 'line' || tool === 'wall') {
            ctx.lineWidth = tool === 'wall' ? 12 / zoom : brushSize / zoom;
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
          } else if (tool === 'rectangle') {
            ctx.strokeRect(sp.x, sp.y, point.x - sp.x, point.y - sp.y);
          } else if (tool === 'room') {
            const w = point.x - sp.x;
            const h = point.y - sp.y;
            ctx.lineWidth = 8 / zoom;
            ctx.strokeRect(sp.x, sp.y, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.03)';
            ctx.fillRect(sp.x, sp.y, w, h);
            // Show room label input
            setRoomLabelInput({ show: true, x: sp.x + w / 2, y: sp.y + h / 2, w, h });
            setRoomLabel('');
          } else if (tool === 'circle') {
            const rx = Math.abs(point.x - sp.x) / 2;
            const ry = Math.abs(point.y - sp.y) / 2;
            const cx = sp.x + (point.x - sp.x) / 2;
            const cy = sp.y + (point.y - sp.y) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else if (tool === 'arrow') {
            drawArrow(ctx, sp, point, brushSize / zoom);
          } else if (tool === 'door') {
            drawDoor(ctx, sp, point);
          } else if (tool === 'window-arch') {
            drawWindow(ctx, sp, point);
          } else if (tool === 'dimension' || tool === 'dimension-arch') {
            drawDimensionLine(ctx, sp, point);
          } else if (tool === 'ruler') {
            drawRuler(ctx, sp, point);
          }

          ctx.restore();
        }

        // Clear temp canvas
        const tc = tempCanvasRef.current;
        if (tc) {
          const tctx = tc.getContext('2d');
          if (tctx) tctx.clearRect(0, 0, tc.width, tc.height);
        }

        compositeRender();
      }

      lastPointRef.current = null;
      startPointRef.current = null;
      saveToHistory();
    },
    [tool, getCanvasPoint, getLayerCtx, color, opacity, brushSize, zoom, compositeRender, saveToHistory]
  );

  // ===== SHAPE DRAWING HELPERS =====
  function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, lineW: number) {
    const headLen = Math.max(lineW * 4, 12);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  function drawDoor(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    // Door: a line + an arc indicating swing direction
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    // Arc
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.arc(from.x, from.y, len, angle, angle + Math.PI / 2);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawWindow(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const angle = Math.atan2(dy, dx);
    const perpX = -Math.sin(angle) * 6;
    const perpY = Math.cos(angle) * 6;
    // Draw double line (window symbol)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from.x + perpX, from.y + perpY);
    ctx.lineTo(to.x + perpX, to.y + perpY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(from.x - perpX, from.y - perpY);
    ctx.lineTo(to.x - perpX, to.y - perpY);
    ctx.stroke();
    // Cross marks
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    ctx.beginPath();
    ctx.moveTo(midX + perpX, midY + perpY);
    ctx.lineTo(midX - perpX, midY - perpY);
    ctx.stroke();
  }

  function drawDimensionLine(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    const offset = 20;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const angle = Math.atan2(dy, dx);
    const perpX = -Math.sin(angle) * offset;
    const perpY = Math.cos(angle) * offset;
    // Extension lines
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(from.x + perpX, from.y + perpY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x + perpX, to.y + perpY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Dimension line
    const f2 = { x: from.x + perpX, y: from.y + perpY };
    const t2 = { x: to.x + perpX, y: to.y + perpY };
    ctx.beginPath();
    ctx.moveTo(f2.x, f2.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.stroke();
    // End ticks
    const tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(f2.x - tickLen * Math.cos(angle - Math.PI / 4), f2.y - tickLen * Math.sin(angle - Math.PI / 4));
    ctx.lineTo(f2.x + tickLen * Math.cos(angle - Math.PI / 4), f2.y + tickLen * Math.sin(angle - Math.PI / 4));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t2.x - tickLen * Math.cos(angle - Math.PI / 4), t2.y - tickLen * Math.sin(angle - Math.PI / 4));
    ctx.lineTo(t2.x + tickLen * Math.cos(angle - Math.PI / 4), t2.y + tickLen * Math.sin(angle - Math.PI / 4));
    ctx.stroke();
    // Text
    const mid = { x: (f2.x + t2.x) / 2, y: (f2.y + t2.y) / 2 };
    const dist = Math.round(len);
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.translate(mid.x, mid.y - 4);
    ctx.rotate(angle);
    ctx.fillText(`${dist}px`, 0, 0);
    ctx.restore();
    ctx.strokeStyle = color;
  }

  function drawRuler(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const angle = Math.atan2(dy, dx);
    const tickSpacing = 20;
    const numTicks = Math.floor(len / tickSpacing);

    ctx.save();
    ctx.translate(from.x, from.y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    for (let i = 0; i <= numTicks; i++) {
      const x = i * tickSpacing;
      const isMajor = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, isMajor ? -10 : -5);
      ctx.stroke();
      if (isMajor) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${i}`, x, -12);
      }
    }
    ctx.restore();
  }

  // ===== TEXT INPUT SUBMIT =====
  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textContent.trim()) {
      setTextInput(null);
      return;
    }
    const ctx = getLayerCtx();
    if (ctx) {
      ctx.save();
      ctx.font = `${brushSize * 4}px sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.textBaseline = 'top';
      ctx.fillText(textContent, textInput.x, textInput.y);
      ctx.restore();
      compositeRender();
      saveToHistory();
    }
    setTextInput(null);
    setTextContent('');
  }, [textInput, textContent, getLayerCtx, color, opacity, brushSize, compositeRender, saveToHistory]);

  // ===== ROOM LABEL SUBMIT =====
  const handleRoomLabelSubmit = useCallback(() => {
    if (roomLabelInput && roomLabel.trim()) {
      const ctx = getLayerCtx();
      if (ctx) {
        ctx.save();
        ctx.font = '14px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(roomLabel, roomLabelInput.x, roomLabelInput.y);
        ctx.restore();
        compositeRender();
      }
    }
    setRoomLabelInput(null);
    setRoomLabel('');
  }, [roomLabelInput, roomLabel, getLayerCtx, color, compositeRender]);

  // ===== CLEAR CANVAS =====
  const clearCanvas = useCallback(() => {
    const ctx = getLayerCtx();
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvasSize.w * dpr, canvasSize.h * dpr);
      compositeRender();
      saveToHistory();
    }
  }, [getLayerCtx, canvasSize, compositeRender, saveToHistory]);

  // ===== SAVE AS PNG =====
  const saveAsPng = useCallback(() => {
    const dc = displayCanvasRef.current;
    if (!dc) return;
    const link = document.createElement('a');
    link.download = `desenho-${Date.now()}.png`;
    link.href = dc.toDataURL('image/png');
    link.click();
  }, []);

  // ===== ZOOM CONTROLS =====
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 5));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.25));
  }, []);
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // ===== MODE CHANGE =====
  const handleModeChange = useCallback((m: DrawingMode) => {
    setMode(m);
    // Set default tool for mode
    if (m === 'artistic') setTool('brush');
    else if (m === 'technical') setTool('line');
    else setTool('wall');
  }, []);

  // ===== ADD LAYER =====
  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: uid(),
      name: `Camada ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      canvas: null,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  }, [layers.length]);

  // ===== DELETE LAYER =====
  const deleteLayer = useCallback(
    (id: string) => {
      if (layers.length <= 1) return;
      setLayers((prev) => prev.filter((l) => l.id !== id));
      if (activeLayerId === id) {
        setActiveLayerId(layers.find((l) => l.id !== id)?.id || '');
      }
    },
    [layers, activeLayerId]
  );

  // ===== TOGGLE LAYER VISIBILITY =====
  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }, []);

  // ===== CURSOR STYLE =====
  const getCursor = useCallback(() => {
    switch (tool) {
      case 'pan': return 'grab';
      case 'eraser': return 'crosshair';
      case 'color-picker': return 'crosshair';
      default: return 'crosshair';
    }
  }, [tool]);

  // ===== CURRENT TOOLS LIST =====
  const currentTools = mode === 'artistic' ? ARTISTIC_TOOLS : mode === 'technical' ? TECHNICAL_TOOLS : ARCHITECTURE_TOOLS;

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden" style={{ background: 'var(--ws-bg)' }}>
      {/* ===== TOP TOOLBAR ===== */}
      <header
        className="flex items-center gap-2 px-3 py-2 border-b no-select shrink-0"
        style={{
          background: 'var(--ws-glass)',
          borderColor: 'var(--ws-glass-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Mode Tabs */}
        <div className="flex items-center gap-1 mr-2">
          {MODE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
                style={{
                  background: isActive ? 'var(--ws-accent)' : 'transparent',
                  color: isActive ? 'var(--ws-text-on-dark)' : 'var(--ws-text-secondary)',
                  boxShadow: isActive ? 'var(--ws-shadow-soft)' : 'none',
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--ws-glass-border)' }} />

        {/* Color Picker / Display */}
        <div className="relative">
          <button
            onClick={() => setColorPaletteOpen(!colorPaletteOpen)}
            className="w-7 h-7 rounded-lg border-2 transition-all duration-200"
            style={{
              background: color,
              borderColor: 'var(--ws-glass-border)',
            }}
            aria-label="Cor atual"
          />
          <AnimatePresence>
            {colorPaletteOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-2 p-3 rounded-xl border z-50"
                style={{
                  background: 'var(--ws-glass)',
                  borderColor: 'var(--ws-glass-border)',
                  boxShadow: 'var(--ws-shadow-medium)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="grid grid-cols-6 gap-1.5">
                  {JAPANESE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setColor(c.color);
                        setColorPaletteOpen(false);
                      }}
                      className="w-7 h-7 rounded-lg border transition-transform duration-150 hover:scale-110"
                      style={{
                        background: c.color,
                        borderColor: color === c.color ? 'var(--ws-accent)' : 'var(--ws-glass-border)',
                        boxShadow: color === c.color ? '0 0 0 2px var(--ws-accent)' : 'none',
                      }}
                      title={c.name}
                      aria-label={c.name}
                    />
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--ws-glass-border)' }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-7 rounded cursor-pointer"
                    aria-label="Cor personalizada"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brush Size */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
            Tamanho
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 h-1 accent-current"
            style={{ accentColor: 'var(--ws-accent)' }}
            aria-label="Tamanho do pincel"
          />
          <span className="text-[10px] w-5 text-center" style={{ color: 'var(--ws-text-tertiary)' }}>
            {brushSize}
          </span>
        </div>

        {/* Opacity (Artistic only) */}
        {mode === 'artistic' && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ color: 'var(--ws-text-tertiary)' }}>
              Opacidade
            </span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-14 h-1"
              style={{ accentColor: 'var(--ws-accent)' }}
              aria-label="Opacidade"
            />
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--ws-glass-border)' }} />

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="p-1.5 rounded-lg transition-colors duration-200"
          style={{
            background: showGrid ? 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' : 'transparent',
            color: showGrid ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
          }}
          data-ws-tooltip="Grade"
          aria-label="Alternar grade"
        >
          <Grid3x3 size={16} />
        </button>

        {/* Snap to Grid (when grid is visible) */}
        {showGrid && (
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className="p-1.5 rounded-lg transition-colors duration-200"
            style={{
              background: snapToGrid ? 'color-mix(in srgb, var(--ws-accent) 15%, transparent)' : 'transparent',
              color: snapToGrid ? 'var(--ws-accent)' : 'var(--ws-text-tertiary)',
            }}
            data-ws-tooltip="Snap to Grid"
            aria-label="Aderir a grade"
          >
            <MousePointer size={14} />
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--ws-text-tertiary)' }}
            data-ws-tooltip="Diminuir zoom"
            aria-label="Diminuir zoom"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 rounded-lg text-[10px] font-medium transition-colors duration-200"
            style={{ color: 'var(--ws-text-secondary)' }}
            aria-label="Resetar zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg transition-colors duration-200"
            style={{ color: 'var(--ws-text-tertiary)' }}
            data-ws-tooltip="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'var(--ws-glass-border)' }} />

        {/* Save PNG */}
        <button
          onClick={saveAsPng}
          className="p-1.5 rounded-lg transition-colors duration-200"
          style={{ color: 'var(--ws-text-tertiary)' }}
          data-ws-tooltip="Salvar PNG"
          aria-label="Salvar como PNG"
        >
          <Download size={16} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className="shrink-0 flex flex-col md:flex-col items-center gap-1 p-1.5 border-r overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden"
          style={{
            background: 'var(--ws-glass)',
            borderColor: 'var(--ws-glass-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Tools for current mode */}
          {currentTools.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className="flex items-center gap-2 px-2.5 py-2 md:flex-col md:gap-1 md:px-1.5 md:py-2 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive ? "color-mix(in srgb, var(--ws-accent) 15%, transparent)" : "transparent",
                  color: isActive ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
                }}
                data-ws-tooltip={t.label}
                aria-label={t.label}
              >
                <Icon size={16} />
                <span className="md:hidden">{t.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="hidden md:block w-8 h-px my-1" style={{ background: 'var(--ws-glass-border)' }} />
          <div className="md:hidden w-px h-6 mx-1" style={{ background: 'var(--ws-glass-border)' }} />

          {/* Undo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center gap-2 px-2.5 py-2 md:flex-col md:gap-1 md:px-1.5 md:py-2 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-30"
            style={{ color: 'var(--ws-text-secondary)' }}
            data-ws-tooltip="Desfazer"
            aria-label="Desfazer"
          >
            <Undo2 size={16} />
            <span className="md:hidden">Desfazer</span>
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center gap-2 px-2.5 py-2 md:flex-col md:gap-1 md:px-1.5 md:py-2 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-30"
            style={{ color: 'var(--ws-text-secondary)' }}
            data-ws-tooltip="Refazer"
            aria-label="Refazer"
          >
            <Redo2 size={16} />
            <span className="md:hidden">Refazer</span>
          </button>

          {/* Divider */}
          <div className="hidden md:block w-8 h-px my-1" style={{ background: 'var(--ws-glass-border)' }} />
          <div className="md:hidden w-px h-6 mx-1" style={{ background: 'var(--ws-glass-border)' }} />

          {/* Clear */}
          <button
            onClick={clearCanvas}
            className="flex items-center gap-2 px-2.5 py-2 md:flex-col md:gap-1 md:px-1.5 md:py-2 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all duration-200"
            style={{ color: 'var(--ws-text-secondary)' }}
            data-ws-tooltip="Limpar camada"
            aria-label="Limpar camada atual"
          >
            <Trash2 size={16} />
            <span className="md:hidden">Limpar</span>
          </button>
        </aside>
        <main
          ref={containerRef}
          className="relative flex-1 overflow-hidden"
          style={{ cursor: getCursor() }}
        >
          <canvas
            ref={displayCanvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="absolute inset-0 w-full h-full touch-none"
            aria-label="Area de desenho"
          />
          <canvas
            ref={tempCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Text Input Overlay */}
          <AnimatePresence>
            {textInput?.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-20"
                style={{
                  left: textInput.x * zoom + panOffset.x,
                  top: textInput.y * zoom + panOffset.y,
                }}
              >
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit();
                    if (e.key === 'Escape') setTextInput(null);
                  }}
                  onBlur={handleTextSubmit}
                  autoFocus
                  className="px-2 py-1 text-sm border rounded-lg outline-none"
                  style={{
                    background: 'var(--ws-glass)',
                    borderColor: 'var(--ws-accent)',
                    color: 'var(--ws-text-primary)',
                    minWidth: '120px',
                  }}
                  placeholder="Digite o texto..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Room Label Input Overlay */}
          <AnimatePresence>
            {roomLabelInput?.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-20 flex items-center justify-center"
                style={{
                  left: roomLabelInput.x * zoom + panOffset.x - 50,
                  top: roomLabelInput.y * zoom + panOffset.y - 14,
                }}
              >
                <input
                  type="text"
                  value={roomLabel}
                  onChange={(e) => setRoomLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRoomLabelSubmit();
                    if (e.key === 'Escape') {
                      setRoomLabelInput(null);
                      setRoomLabel('');
                    }
                  }}
                  onBlur={handleRoomLabelSubmit}
                  autoFocus
                  className="px-2 py-1 text-xs text-center border rounded-lg outline-none"
                  style={{
                    background: 'var(--ws-glass)',
                    borderColor: 'var(--ws-accent)',
                    color: 'var(--ws-text-primary)',
                    width: '100px',
                  }}
                  placeholder="Nome do comodo"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Brush Size Control */}
          <div className="sm:hidden absolute bottom-16 left-2 right-2 flex items-center gap-2 p-2 rounded-xl z-10" style={{ background: 'var(--ws-glass)', borderColor: 'var(--ws-glass-border)', border: '1px solid', backdropFilter: 'blur(20px)' }}>
            <Palette size={14} style={{ color: 'var(--ws-text-tertiary)' }} />
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 h-1"
              style={{ accentColor: 'var(--ws-accent)' }}
              aria-label="Tamanho do pincel"
            />
            <span className="text-[10px] w-5" style={{ color: 'var(--ws-text-tertiary)' }}>{brushSize}</span>
            {mode === 'artistic' && (
              <>
                <div className="w-px h-4" style={{ background: 'var(--ws-glass-border)' }} />
                <span className="text-[10px]" style={{ color: 'var(--ws-text-tertiary)' }}>O:</span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="flex-1 h-1"
                  style={{ accentColor: 'var(--ws-accent)' }}
                  aria-label="Opacidade"
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <footer
        className="flex items-center gap-2 px-3 py-1.5 border-t no-select shrink-0"
        style={{
          background: 'var(--ws-glass)',
          borderColor: 'var(--ws-glass-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Layers Toggle */}
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors duration-200"
          style={{ color: 'var(--ws-text-secondary)' }}
          aria-label="Painel de camadas"
        >
          <Layers size={14} />
          <span className="hidden sm:inline">Camadas</span>
          {layerPanelOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>

        {/* Active Layer Indicator */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: 'color-mix(in srgb, var(--ws-accent) 10%, transparent)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--ws-accent)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--ws-accent)' }}>
            {layers.find((l) => l.id === activeLayerId)?.name || '—'}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Coords */}
        <span className="text-[10px] font-mono hidden sm:inline" style={{ color: 'var(--ws-text-tertiary)' }}>
          {Math.round(panOffset.x)}, {Math.round(panOffset.y)} · {Math.round(zoom * 100)}%
        </span>
      </footer>

      {/* ===== LAYERS PANEL (Floating) ===== */}
      <AnimatePresence>
        {layerPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-10 left-3 right-3 sm:left-auto sm:right-3 sm:w-64 rounded-xl border z-30"
            style={{
              background: 'var(--ws-glass)',
              borderColor: 'var(--ws-glass-border)',
              boxShadow: 'var(--ws-shadow-medium)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold" style={{ color: 'var(--ws-text-primary)' }}>
                  Camadas
                </h3>
                <button
                  onClick={addLayer}
                  className="p-1 rounded-md transition-colors duration-200"
                  style={{ color: 'var(--ws-accent)' }}
                  aria-label="Adicionar camada"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                {layers.map((layer) => {
                  const isActive = layer.id === activeLayerId;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setActiveLayerId(layer.id)}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors duration-200"
                      style={{
                        background: isActive ? 'color-mix(in srgb, var(--ws-accent) 12%, transparent)' : 'transparent',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className="p-0.5 rounded transition-colors duration-200"
                        style={{ color: layer.visible ? 'var(--ws-text-secondary)' : 'var(--ws-text-tertiary)' }}
                        aria-label={layer.visible ? 'Ocultar camada' : 'Mostrar camada'}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <span
                        className="flex-1 text-[11px] font-medium truncate"
                        style={{ color: isActive ? 'var(--ws-accent)' : 'var(--ws-text-secondary)' }}
                      >
                        {layer.name}
                      </span>
                      {layers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                          className="p-0.5 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--ws-text-tertiary)' }}
                          aria-label="Excluir camada"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
