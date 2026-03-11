import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Undo, Type, Paintbrush, Image as ImageIcon, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Invert', value: 'invert(100%)' },
  { name: 'Blur', value: 'blur(4px)' },
  { name: 'Brightness', value: 'brightness(150%)' },
  { name: 'Contrast', value: 'contrast(150%)' },
  { name: 'Saturate', value: 'saturate(200%)' },
];

const COLORS = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(5);
  const [filter, setFilter] = useState('none');
  const [mode, setMode] = useState<'draw' | 'filter'>('draw');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      initCanvas(img, 'none');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const initCanvas = (img: HTMLImageElement, currentFilter: string) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate aspect ratio to fit container
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const imgRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;

    let drawWidth = containerWidth;
    let drawHeight = containerHeight;

    if (imgRatio > containerRatio) {
      drawHeight = containerWidth / imgRatio;
    } else {
      drawWidth = containerHeight * imgRatio;
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    ctx.filter = currentFilter;
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
    ctx.filter = 'none'; // Reset filter for drawing

    saveState();
  };

  useEffect(() => {
    if (imageObj && mode === 'filter') {
      initCanvas(imageObj, filter);
    }
  }, [filter, mode]);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, imageData]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
    >
      <div className="bg-zinc-900 rounded-3xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-pink-500" />
            Image Editor
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="p-2 text-zinc-400 hover:text-white disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors rounded-lg hover:bg-white/5"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity ml-2"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Toolbar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-zinc-900/50 p-4 flex flex-col gap-6 overflow-y-auto">
            {/* Mode Toggle */}
            <div className="flex p-1 bg-zinc-800 rounded-xl">
              <button
                onClick={() => setMode('draw')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'draw' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                Draw
              </button>
              <button
                onClick={() => setMode('filter')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'filter' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Filters
              </button>
            </div>

            {mode === 'draw' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                {/* Colors */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Brush Size */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Brush Size</span>
                    <span className="text-zinc-300">{brushSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Apply Filter</label>
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setFilter(f.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                        filter === f.value
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                          : 'bg-zinc-800 text-zinc-300 border border-transparent hover:bg-zinc-700'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Canvas Area */}
          <div 
            ref={containerRef}
            className="flex-1 bg-zinc-950 flex items-center justify-center p-4 overflow-hidden relative"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`max-w-full max-h-full shadow-2xl rounded-lg ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
