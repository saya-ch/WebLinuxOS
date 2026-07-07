import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import {
  Pencil, Eraser, Square, Circle, Minus, Type,
  Undo2, Redo2, Trash2, Download,
  ArrowRight,
  Diamond, Triangle, Star, StickyNote, Hand,
  ZoomIn, ZoomOut, Maximize2, Layers,
  MousePointer2
} from 'lucide-react';

type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'arrow' | 'diamond' | 'triangle' | 'star' | 'sticky' | 'pan';

interface BaseShape {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  color: string;
  lineWidth: number;
  fillColor?: string;
  filled?: boolean;
  text?: string;
  fontSize?: number;
  points?: { x: number; y: number }[];
}

interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  width: number;
  height: number;
}

const STICKY_COLORS = [
  '#FFE066', '#F4989C', '#74C0FC', '#8CE99A',
  '#FFA94D', '#DA77F2', '#63E6BE', '#FFC9C9'
];

const COLORS = [
  '#1a1a2e', '#e94560', '#0f3460', '#16213e',
  '#ffffff', '#f39c12', '#27ae60', '#3498db',
  '#9b59b6', '#e74c3c', '#1abc9c', '#2c3e50',
  '#f1c40f', '#e67e22', '#95a5a6', '#ecf0f1'
];

const GRADIENT_PRESETS = [
  { name: 'Sunset', colors: ['#ff6b6b', '#feca57'] },
  { name: 'Ocean', colors: ['#4facfe', '#00f2fe'] },
  { name: 'Forest', colors: ['#134e5e', '#71b280'] },
  { name: 'Purple', colors: ['#654ea3', '#eaafc8'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19'] },
  { name: 'Mint', colors: ['#43e97b', '#38f9d7'] },
];

export default function WhiteboardPro() {
  const theme = useStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState('#7c6cf0');
  const [fillColor, setFillColor] = useState('transparent');
  const [filled, setFilled] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [shapes, setShapes] = useState<BaseShape[]>([]);
  const [undoStack, setUndoStack] = useState<BaseShape[][]>([]);
  const [redoStack, setRedoStack] = useState<BaseShape[][]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [fontSize, setFontSize] = useState(18);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [selectedStickyId, setSelectedStickyId] = useState<string | null>(null);
  const [draggingSticky, setDraggingSticky] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'tools' | 'colors' | 'settings'>('tools');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const tools = useMemo(() => [
    { id: 'select', icon: MousePointer2, label: '选择' },
    { id: 'pen', icon: Pencil, label: '画笔' },
    { id: 'eraser', icon: Eraser, label: '橡皮擦' },
    { id: 'line', icon: Minus, label: '直线' },
    { id: 'arrow', icon: ArrowRight, label: '箭头' },
    { id: 'rectangle', icon: Square, label: '矩形' },
    { id: 'circle', icon: Circle, label: '圆形' },
    { id: 'diamond', icon: Diamond, label: '菱形' },
    { id: 'triangle', icon: Triangle, label: '三角形' },
    { id: 'star', icon: Star, label: '星形' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'sticky', icon: StickyNote, label: '便签' },
    { id: 'pan', icon: Hand, label: '拖动' },
  ], []);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    const gridSize = 20 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [zoom, pan, showGrid, theme]);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: BaseShape) => {
    const x = shape.x * zoom + pan.x;
    const y = shape.y * zoom + pan.y;
    const x2 = shape.x2 !== undefined ? shape.x2 * zoom + pan.x : x;
    const y2 = shape.y2 !== undefined ? shape.y2 * zoom + pan.y : y;

    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.filled && shape.fillColor ? shape.fillColor : 'transparent';
    ctx.lineWidth = shape.lineWidth * zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const w = x2 - x;
    const h = y2 - y;

    switch (shape.type) {
      case 'pen':
        if (shape.points && shape.points.length > 0) {
          ctx.beginPath();
          const firstPt = shape.points[0];
          ctx.moveTo(firstPt.x * zoom + pan.x, firstPt.y * zoom + pan.y);
          for (let i = 1; i < shape.points.length; i++) {
            const pt = shape.points[i];
            ctx.lineTo(pt.x * zoom + pan.x, pt.y * zoom + pan.y);
          }
          ctx.stroke();
        }
        break;
      case 'eraser':
        if (shape.points && shape.points.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = (shape.lineWidth * 3) * zoom;
          ctx.beginPath();
          const firstPt = shape.points[0];
          ctx.moveTo(firstPt.x * zoom + pan.x, firstPt.y * zoom + pan.y);
          for (let i = 1; i < shape.points.length; i++) {
            const pt = shape.points[i];
            ctx.lineTo(pt.x * zoom + pan.x, pt.y * zoom + pan.y);
          }
          ctx.stroke();
          ctx.restore();
        }
        break;
      case 'rectangle':
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor || shape.color + '40';
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeRect(x, y, w, h);
        break;
      case 'circle': {
        const radiusX = Math.abs(w) / 2;
        const radiusY = Math.abs(h) / 2;
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor || shape.color + '40';
          ctx.fill();
        }
        ctx.stroke();
        break;
      }
      case 'line':
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      case 'arrow':
        drawArrow(ctx, x, y, x2, y2);
        break;
      case 'diamond': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(x2, cy);
        ctx.lineTo(cx, y2);
        ctx.lineTo(x, cy);
        ctx.closePath();
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor || shape.color + '40';
          ctx.fill();
        }
        ctx.stroke();
        break;
      }
      case 'triangle': {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x, y2);
        ctx.closePath();
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor || shape.color + '40';
          ctx.fill();
        }
        ctx.stroke();
        break;
      }
      case 'star': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2;
        const innerRadius = outerRadius * 0.4;
        const spikes = 5;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes - Math.PI / 2;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor || shape.color + '40';
          ctx.fill();
        }
        ctx.stroke();
        break;
      }
      case 'text':
        if (shape.text) {
          ctx.font = `${(shape.fontSize || 18) * zoom}px -apple-system, sans-serif`;
          ctx.fillStyle = shape.color;
          ctx.textBaseline = 'top';
          ctx.fillText(shape.text, x, y);
        }
        break;
    }
  }, [zoom, pan, drawArrow]);

  const redrawAll = useCallback(() => {
    const { canvas, ctx } = getCanvasContext() || {};
    if (!canvas || !ctx) return;

    ctx.fillStyle = theme === 'light' ? '#f8f9fa' : '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, canvas.width, canvas.height);

    shapes.forEach(shape => drawShape(ctx, shape));
  }, [theme, shapes, getCanvasContext, drawShape, drawGrid]);

  const resizeCanvas = useCallback(() => {
    const { canvas, ctx } = getCanvasContext() || {};
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    redrawAll();
  }, [getCanvasContext, redrawAll]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { canvas } = getCanvasContext() || {};
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left);
    const screenY = (e.clientY - rect.top);
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
      screenX,
      screenY,
    };
  };

  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev, [...shapes]]);
    setRedoStack([]);
  }, [shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    if (currentTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (currentTool === 'sticky') {
      const newSticky: StickyNote = {
        id: generateId(),
        x: x,
        y: y,
        text: '',
        color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
        width: 180,
        height: 150,
      };
      setStickyNotes(prev => [...prev, newSticky]);
      setSelectedStickyId(newSticky.id);
      return;
    }

    if (currentTool === 'text') {
      setTextInputPos({ x, y });
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartX(x);
    setStartY(y);
    saveState();

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const newShape: BaseShape = {
        id: generateId(),
        type: currentTool,
        x,
        y,
        color: currentColor,
        lineWidth,
        points: [{ x, y }],
      };
      setShapes(prev => [...prev, newShape]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!isDrawing) return;
    const { x, y } = getMousePos(e);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setShapes(prev => {
        const newShapes = [...prev];
        const last = newShapes[newShapes.length - 1];
        if (last && last.points) {
          last.points.push({ x, y });
        }
        return newShapes;
      });
    } else {
      setShapes(prev => {
        const newShapes = [...prev];
        if (newShapes.length > 0 && newShapes[newShapes.length - 1].id === 'temp') {
          newShapes.pop();
        }
        newShapes.push({
          id: 'temp',
          type: currentTool,
          x: startX,
          y: startY,
          x2: x,
          y2: y,
          color: currentColor,
          lineWidth,
          filled,
          fillColor: fillColor,
        });
        return newShapes;
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!isDrawing) return;
    setIsDrawing(false);

    setShapes(prev => {
      const filtered = prev.filter(s => s.id !== 'temp');
      if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'text') {
        const last = prev[prev.length - 1];
        if (last && last.id === 'temp') {
          filtered.push({ ...last, id: generateId() });
        }
      }
      return filtered;
    });
  };

  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      saveState();
      const newShape: BaseShape = {
        id: generateId(),
        type: 'text',
        x: textInputPos.x,
        y: textInputPos.y,
        color: currentColor,
        lineWidth,
        text: textInputValue,
        fontSize,
      };
      setShapes(prev => [...prev, newShape]);
    }
    setShowTextInput(false);
    setTextInputValue('');
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      setRedoStack(prev => [...prev, [...shapes]]);
      const previous = undoStack[undoStack.length - 1];
      setShapes(previous);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      setUndoStack(prev => [...prev, [...shapes]]);
      const next = redoStack[redoStack.length - 1];
      setShapes(next);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    saveState();
    setShapes([]);
    setStickyNotes([]);
  };

  const handleExport = () => {
    const { canvas } = getCanvasContext() || {};
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'whiteboard-export.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleStickyMouseDown = (e: React.MouseEvent, stickyId: string) => {
    e.stopPropagation();
    const sticky = stickyNotes.find(s => s.id === stickyId);
    if (!sticky) return;
    setDraggingSticky(stickyId);
    setSelectedStickyId(stickyId);
    const { x, y } = getMousePos(e as any);
    setDragOffset({ x: x - sticky.x, y: y - sticky.y });
  };

  const handleStickyDrag = (e: React.MouseEvent) => {
    if (!draggingSticky) return;
    const { x, y } = getMousePos(e as any);
    setStickyNotes(prev => prev.map(s =>
      s.id === draggingSticky
        ? { ...s, x: x - dragOffset.x, y: y - dragOffset.y }
        : s
    ));
  };

  const handleStickyDragEnd = () => {
    setDraggingSticky(null);
  };

  const deleteSticky = (id: string) => {
    setStickyNotes(prev => prev.filter(s => s.id !== id));
    if (selectedStickyId === id) setSelectedStickyId(null);
  };

  const updateStickyText = (id: string, text: string) => {
    setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  };

  const changeStickyColor = (id: string, color: string) => {
    setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, color } : s));
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.25, Math.min(4, prev * factor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const tabButtonStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    background: active
      ? (theme === 'light' ? '#7c6cf0' : '#6c5ce7')
      : 'transparent',
    color: active ? '#fff' : 'inherit',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    transition: 'all 0.2s',
  });

  return (
    <div
      ref={containerRef}
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme === 'light' ? '#f8f9fa' : '#0f0f1a',
        color: theme === 'light' ? '#1a1a2e' : '#e0e0e8',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
          background: theme === 'light' ? '#fff' : '#1a1a2e',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="撤销 (Ctrl+Z)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: undoStack.length === 0 ? '#999' : 'inherit',
              cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="重做 (Ctrl+Y)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: redoStack.length === 0 ? '#999' : 'inherit',
              cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e' }} />

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={() => handleZoom(0.8)} title="缩小" style={{
            width: '32px', height: '32px', borderRadius: '6px', border: 'none',
            background: 'transparent', color: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '12px', minWidth: '48px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => handleZoom(1.25)} title="放大" style={{
            width: '32px', height: '32px', borderRadius: '6px', border: 'none',
            background: 'transparent', color: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ZoomIn size={16} />
          </button>
          <button onClick={resetView} title="重置视图" style={{
            width: '32px', height: '32px', borderRadius: '6px', border: 'none',
            background: 'transparent', color: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Maximize2 size={16} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title="网格"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
            background: showGrid
              ? (theme === 'light' ? '#7c6cf020' : '#6c5ce730')
              : 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Layers size={14} />
          网格
        </button>

        <button
          onClick={handleClear}
          title="清空画布"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trash2 size={14} />
          清空
        </button>

        <button
          onClick={handleExport}
          title="导出为PNG"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: theme === 'light' ? '#7c6cf0' : '#6c5ce7',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={14} />
          导出
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            width: '60px',
            background: theme === 'light' ? '#fff' : '#1a1a2e',
            borderRight: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 4px',
            gap: '4px',
          }}
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id as ToolType)}
                title={tool.label}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive
                    ? (theme === 'light' ? '#7c6cf020' : '#6c5ce730')
                    : 'transparent',
                  color: isActive
                    ? (theme === 'light' ? '#7c6cf0' : '#a29bfe')
                    : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = theme === 'light' ? '#f1f3f5' : '#252536';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        <div
          style={{
            width: '200px',
            background: theme === 'light' ? '#fff' : '#1a1a2e',
            borderRight: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '4px',
              gap: '4px',
              borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            }}
          >
            <button onClick={() => setActiveTab('tools')} style={tabButtonStyle(activeTab === 'tools')}>
              工具
            </button>
            <button onClick={() => setActiveTab('colors')} style={tabButtonStyle(activeTab === 'colors')}>
              颜色
            </button>
            <button onClick={() => setActiveTab('settings')} style={tabButtonStyle(activeTab === 'settings')}>
              设置
            </button>
          </div>

          <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
            {activeTab === 'tools' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    线条粗细
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>{lineWidth}px</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    字体大小
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>{fontSize}px</div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filled}
                      onChange={(e) => setFilled(e.target.checked)}
                    />
                    填充形状
                  </label>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    渐变预设
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {GRADIENT_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentColor(preset.colors[0]);
                          setFillColor(preset.colors[1] + '40');
                        }}
                        style={{
                          height: '32px',
                          borderRadius: '6px',
                          border: 'none',
                          background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                        title={preset.name}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    描边颜色
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCurrentColor(color)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '6px',
                          border: currentColor === color
                            ? `2px solid ${theme === 'light' ? '#7c6cf0' : '#a29bfe'}`
                            : '2px solid transparent',
                          background: color,
                          cursor: 'pointer',
                          boxShadow: color === '#ffffff' ? '0 0 0 1px #ddd' : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={currentColor.startsWith('#') ? currentColor : '#7c6cf0'}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) => setCurrentColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
                        background: 'transparent',
                        color: 'inherit',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                {filled && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                      填充颜色
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFillColor(color + '60')}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '6px',
                            border: fillColor === color + '60'
                              ? `2px solid ${theme === 'light' ? '#7c6cf0' : '#a29bfe'}`
                              : '2px solid transparent',
                            background: color + '60',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    画布设置
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                    显示网格
                  </label>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    快捷键
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 2, color: theme === 'light' ? '#495057' : '#bbb' }}>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>Ctrl+Z</kbd> 撤销</div>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>Ctrl+Y</kbd> 重做</div>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>H</kbd> 拖动工具</div>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>P</kbd> 画笔</div>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>E</kbd> 橡皮</div>
                    <div><kbd style={{ padding: '2px 6px', background: theme === 'light' ? '#e9ecef' : '#2a2a3e', borderRadius: '4px', fontSize: '11px' }}>滚轮</kbd> 缩放</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#868e96' : '#888' }}>
                    统计
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: 1.8 }}>
                    <div>图形数量: {shapes.length}</div>
                    <div>便签数量: {stickyNotes.length}</div>
                    <div>缩放比例: {Math.round(zoom * 100)}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseMove={(e) => {
            if (draggingSticky) handleStickyDrag(e);
          }}
          onMouseUp={handleStickyDragEnd}
          onMouseLeave={handleStickyDragEnd}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '100%',
              cursor: currentTool === 'pan'
                ? (isPanning ? 'grabbing' : 'grab')
                : currentTool === 'text'
                  ? 'text'
                  : 'crosshair',
            }}
          />

          {showTextInput && (
            <div
              style={{
                position: 'absolute',
                left: textInputPos.x * zoom + pan.x,
                top: textInputPos.y * zoom + pan.y,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <input
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTextSubmit();
                  if (e.key === 'Escape') {
                    setShowTextInput(false);
                    setTextInputValue('');
                  }
                }}
                autoFocus
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `2px solid ${currentColor}`,
                  background: theme === 'light' ? '#fff' : '#1a1a2e',
                  color: currentColor,
                  fontSize: `${fontSize}px`,
                  minWidth: '200px',
                  outline: 'none',
                }}
                placeholder="输入文字..."
              />
              <button
                onClick={handleTextSubmit}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentColor,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                添加
              </button>
            </div>
          )}

          {stickyNotes.map((sticky) => (
            <div
              key={sticky.id}
              onMouseDown={(e) => handleStickyMouseDown(e, sticky.id)}
              style={{
                position: 'absolute',
                left: sticky.x * zoom + pan.x,
                top: sticky.y * zoom + pan.y,
                width: sticky.width * zoom,
                minHeight: sticky.height * zoom,
                background: sticky.color,
                borderRadius: '4px',
                padding: '12px',
                boxShadow: selectedStickyId === sticky.id
                  ? '0 8px 24px rgba(0,0,0,0.3)'
                  : '0 4px 12px rgba(0,0,0,0.2)',
                cursor: draggingSticky === sticky.id ? 'grabbing' : 'grab',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                zIndex: selectedStickyId === sticky.id ? 5 : 2,
                transition: draggingSticky === sticky.id ? 'none' : 'box-shadow 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {STICKY_COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeStickyColor(sticky.id, color);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: 'none',
                        background: color,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSticky(sticky.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.4)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.4)'}
                >
                  ×
                </button>
              </div>
              <textarea
                value={sticky.text}
                onChange={(e) => updateStickyText(sticky.id, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="输入便签内容..."
                style={{
                  width: '100%',
                  height: 'calc(100% - 36px)',
                  minHeight: '80px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '13px',
                  color: '#1a1a2e',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
