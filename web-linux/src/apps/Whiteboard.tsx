import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text';
type Color = '#000000' | '#ff0000' | '#00ff00' | '#0000ff' | '#ffff00' | '#ff00ff' | '#00ffff' | '#ffffff';
type Stroke = {
  type: Tool;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  color: Color;
  lineWidth: number;
  text?: string;
};

export default function Whiteboard() {
  const theme = useStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState<Color>('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');

  const colors: Color[] = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (stroke.type) {
      case 'pen':
        ctx.beginPath();
        ctx.moveTo(stroke.x, stroke.y);
        if (stroke.x2 && stroke.y2) {
          ctx.lineTo(stroke.x2, stroke.y2);
        }
        ctx.stroke();
        break;
      case 'eraser':
        ctx.clearRect(stroke.x - stroke.lineWidth / 2, stroke.y - stroke.lineWidth / 2, stroke.lineWidth, stroke.lineWidth);
        break;
      case 'rectangle':
        if (stroke.x2 !== undefined && stroke.y2 !== undefined) {
          const width = stroke.x2 - stroke.x;
          const height = stroke.y2 - stroke.y;
          ctx.strokeRect(stroke.x, stroke.y, width, height);
        }
        break;
      case 'circle':
        if (stroke.x2 !== undefined && stroke.y2 !== undefined) {
          const radiusX = Math.abs(stroke.x2 - stroke.x) / 2;
          const radiusY = Math.abs(stroke.y2 - stroke.y) / 2;
          const centerX = stroke.x + (stroke.x2 - stroke.x) / 2;
          const centerY = stroke.y + (stroke.y2 - stroke.y) / 2;
          
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      case 'line':
        if (stroke.x2 !== undefined && stroke.y2 !== undefined) {
          ctx.beginPath();
          ctx.moveTo(stroke.x, stroke.y);
          ctx.lineTo(stroke.x2, stroke.y2);
          ctx.stroke();
        }
        break;
      case 'text':
        if (stroke.text) {
          ctx.font = `${16 + stroke.lineWidth}px sans-serif`;
          ctx.fillText(stroke.text, stroke.x, stroke.y);
        }
        break;
    }
  };

  const redrawAll = () => {
    const { canvas, ctx } = getCanvasContext() || {};
    if (!canvas || !ctx) return;

    ctx.fillStyle = theme === 'light' ? '#ffffff' : '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => drawStroke(ctx, stroke));
  };

  const resizeCanvas = () => {
    const { canvas, ctx } = getCanvasContext() || {};
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    redrawAll();
  };

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    redrawAll()
  }, [strokes]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { canvas } = getCanvasContext() || {};
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    setIsDrawing(true);
    setStartX(x);
    setStartY(y);

    if (currentTool === 'text') {
      setTextInputPos({ x, y });
      setShowTextInput(true);
      return;
    }

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const newStroke: Stroke = {
        type: currentTool,
        x,
        y,
        color: currentTool === 'eraser' ? (theme === 'light' ? '#ffffff' : '#1e1e2e') as Color : currentColor,
        lineWidth: currentTool === 'eraser' ? lineWidth * 3 : lineWidth,
      };
      setUndoStack([...undoStack, [...strokes]]);
      setStrokes([...strokes, newStroke]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const { x, y } = getMousePos(e);
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      const lastStroke = strokes[strokes.length - 1];
      if (lastStroke) {
        const newStroke: Stroke = {
          ...lastStroke,
          x: lastStroke.x2 || lastStroke.x,
          y: lastStroke.y2 || lastStroke.y,
          x2: x,
          y2: y,
        };
        setStrokes([...strokes.slice(0, -1), newStroke]);
      }
    } else {
      redrawAll();
      const { ctx } = getCanvasContext() || {};
      if (ctx) {
        const tempStroke: Stroke = {
          type: currentTool,
          x: startX,
          y: startY,
          x2: x,
          y2: y,
          color: currentColor,
          lineWidth,
        };
        drawStroke(ctx, tempStroke);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'text') {
      const x = startX;
      const y = startY;
      const x2 = startX; 
      const y2 = startY;

      const newStroke: Stroke = {
        type: currentTool,
        x,
        y,
        x2,
        y2,
        color: currentColor,
        lineWidth,
      };
      setUndoStack([...undoStack, [...strokes]]);
      setStrokes([...strokes, newStroke]);
    }
  };

  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      const newStroke: Stroke = {
        type: 'text',
        x: textInputPos.x,
        y: textInputPos.y,
        color: currentColor,
        lineWidth,
        text: textInputValue,
      };
      setUndoStack([...undoStack, [...strokes]]);
      setStrokes([...strokes, newStroke]);
    }
    setShowTextInput(false);
    setTextInputValue('');
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setStrokes(previous);
      setUndoStack(undoStack.slice(0, -1));
    }
  };

  const handleClear = () => {
    setUndoStack([...undoStack, [...strokes]]);
    setStrokes([]);
  };

  return (
    <div
      className="app-container"
      style={{
        background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
          background: theme === 'light' ? '#ffffff' : '#252536',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', borderRight: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`, paddingRight: '12px' }}>
          {[
            { id: 'pen', label: '✏️' },
            { id: 'eraser', label: '🧽' },
            { id: 'line', label: '📏' },
            { id: 'rectangle', label: '⬜' },
            { id: 'circle', label: '⭕' },
            { id: 'text', label: 'T' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id as Tool)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: currentTool === tool.id
                  ? `2px solid ${theme === 'light' ? '#007aff' : '#6c5ce7'}`
                  : `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                background: currentTool === tool.id
                  ? (theme === 'light' ? '#007aff20' : '#6c5ce720')
                  : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (currentTool !== tool.id) {
                  e.currentTarget.style.background = theme === 'light' ? '#f0f0f5' : '#2a2a3e';
                }
              }}
              onMouseOut={(e) => {
                if (currentTool !== tool.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', borderRight: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`, paddingRight: '12px' }}>
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: currentColor === color
                  ? `3px solid ${theme === 'light' ? '#007aff' : '#6c5ce7'}`
                  : `2px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                background: color,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderRight: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`, paddingRight: '12px' }}>
          <span style={{ fontSize: '12px' }}>粗细:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', minWidth: '24px' }}>{lineWidth}</span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: undoStack.length === 0 ? (theme === 'light' ? '#e0e0e0' : '#3a3a5c') : 'transparent',
              color: 'inherit',
              cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: undoStack.length === 0 ? 0.5 : 1,
            }}
          >
            ↩️ 撤销
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🗑️ 清空
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '100%',
            height: '100%',
            cursor: currentTool === 'pen' ? 'crosshair' : currentTool === 'text' ? 'text' : 'crosshair',
          }}
        />

        {showTextInput && (
          <div
            style={{
              position: 'absolute',
              left: textInputPos.x,
              top: textInputPos.y,
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
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
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                background: theme === 'light' ? '#ffffff' : '#2a2a3e',
                color: 'inherit',
                fontSize: '14px',
                minWidth: '200px',
              }}
              placeholder="输入文字..."
            />
            <button
              onClick={handleTextSubmit}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: theme === 'light' ? '#007aff' : '#6c5ce7',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              添加
            </button>
            <button
              onClick={() => {
                setShowTextInput(false);
                setTextInputValue('');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
