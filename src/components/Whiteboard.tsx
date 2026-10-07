'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pencil,
  Square,
  Circle as CircleIcon,
  Minus,
  ArrowRight,
  Type,
  Eraser,
  RotateCcw,
  Trash2,
  Download,
} from 'lucide-react';

export type ToolType = 'pen' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'eraser';

export interface DrawElement {
  id: string;
  tool: ToolType;
  points?: { x: number; y: number }[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  width: number;
}

interface WhiteboardProps {
  roomId: string;
  initialState?: string | null;
  onSaveState?: (stateJson: string) => void;
  readOnly?: boolean;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#f8fafc'];

export default function Whiteboard({ roomId, initialState, onSaveState, readOnly = false }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState('#06b6d4');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);

  // Load initial state
  useEffect(() => {
    if (initialState) {
      try {
        const parsed = JSON.parse(initialState);
        if (Array.isArray(parsed)) {
          setElements(parsed);
        }
      } catch (err) {
        console.error('Failed to parse whiteboard state:', err);
      }
    }
  }, [initialState]);

  // Debounced Save state
  useEffect(() => {
    if (!onSaveState || readOnly) return;
    const timeoutId = setTimeout(() => {
      onSaveState(JSON.stringify(elements));
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [elements, onSaveState, readOnly]);

  // Canvas Redraw Loop
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const allElements = currentElement ? [...elements, currentElement] : elements;

    allElements.forEach((el) => {
      ctx.strokeStyle = el.tool === 'eraser' ? '#0f172a' : el.color;
      ctx.fillStyle = el.tool === 'eraser' ? '#0f172a' : el.color;
      ctx.lineWidth = el.tool === 'eraser' ? el.width * 4 : el.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.tool === 'pen' || el.tool === 'eraser') {
        if (el.points && el.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      } else if (el.tool === 'rectangle' && el.x1 !== undefined && el.y1 !== undefined) {
        const w = (el.x2 || el.x1) - el.x1;
        const h = (el.y2 || el.y1) - el.y1;
        ctx.beginPath();
        ctx.rect(el.x1, el.y1, w, h);
        ctx.stroke();
      } else if (el.tool === 'circle' && el.x1 !== undefined && el.y1 !== undefined) {
        const rx = Math.abs((el.x2 || el.x1) - el.x1) / 2;
        const ry = Math.abs((el.y2 || el.y1) - el.y1) / 2;
        const cx = Math.min(el.x1, el.x2 || el.x1) + rx;
        const cy = Math.min(el.y1, el.y2 || el.y1) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (el.tool === 'line' && el.x1 !== undefined && el.y1 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2 || el.x1, el.y2 || el.y1);
        ctx.stroke();
      } else if (el.tool === 'arrow' && el.x1 !== undefined && el.y1 !== undefined) {
        const x2 = el.x2 || el.x1;
        const y2 = el.y2 || el.y1;
        const headlen = 12;
        const dx = x2 - el.x1;
        const dy = y2 - el.y1;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(x2, y2);
        ctx.fill();
      } else if (el.tool === 'text' && el.x1 !== undefined && el.y1 !== undefined && el.text) {
        ctx.font = `${el.width * 6 + 12}px sans-serif`;
        ctx.fillText(el.text, el.x1, el.y1);
      }
    });
  }, [elements, currentElement]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 800;
        canvasRef.current.height = 600;
        redrawCanvas();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);

    if (activeTool === 'text') {
      const userText = prompt('Enter text to add to canvas:');
      if (userText) {
        const newEl: DrawElement = {
          id: `text-${Date.now()}`,
          tool: 'text',
          x1: x,
          y1: y,
          text: userText,
          color: selectedColor,
          width: strokeWidth,
        };
        setElements((prev) => [...prev, newEl]);
      }
      setIsDrawing(false);
      return;
    }

    const id = `el-${Date.now()}`;
    if (activeTool === 'pen' || activeTool === 'eraser') {
      setCurrentElement({
        id,
        tool: activeTool,
        points: [{ x, y }],
        color: selectedColor,
        width: strokeWidth,
      });
    } else {
      setCurrentElement({
        id,
        tool: activeTool,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        color: selectedColor,
        width: strokeWidth,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement || readOnly) return;
    const { x, y } = getCanvasCoords(e);

    if (currentElement.tool === 'pen' || currentElement.tool === 'eraser') {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), { x, y }],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        x2: x,
        y2: y,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    if (currentElement) {
      setElements((prev) => [...prev, currentElement]);
      setCurrentElement(null);
    }
  };

  const handleClear = () => {
    if (confirm('Clear entire whiteboard canvas?')) {
      setElements([]);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = image;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden relative">
      {/* Whiteboard Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          {/* Tools Selection */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'pen' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Pencil / Draw"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('rectangle')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'rectangle' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('circle')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'circle' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Circle"
            >
              <CircleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('line')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'line' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('arrow')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'arrow' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Arrow"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'text' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Add Text"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2 rounded-lg transition ${
                activeTool === 'eraser' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette & Stroke Width */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                    selectedColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-700" />

            <div className="flex items-center space-x-1">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    strokeWidth === w ? 'bg-slate-700 text-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Clear & Export Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
              title="Download Canvas PNG"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-[600px] touch-none"
        />
      </div>
    </div>
  );
}
