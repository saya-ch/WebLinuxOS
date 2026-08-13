import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
  Shuffle, ChevronDown, BarChart3, Network,
  Settings, Search, Binary, LayoutGrid, List, Flag, MousePointer,
} from 'lucide-react';
import type { AlgoInfo, AlgoCategory, Frame, SortFrame, SearchFrame, GraphFrame, GridFrame, DSFrame } from './algorithms';
import { ALGORITHMS, generateFrames, makeGrid, randomGrid, getAlgorithmsByCategory, CATEGORY_LABELS, CATEGORY_COLORS } from './algorithms';
import { BarVisualizer, GraphVisualizer, GridVisualizer, DSVisualizer } from './Visualizers';

type InputMode = 'random' | 'reversed' | 'nearly' | 'custom';

function genArray(size: number, mode: InputMode, customInput?: string): number[] {
  if (mode === 'custom' && customInput) {
    return customInput.split(/[,\s]+/).map(Number).filter(n => !isNaN(n)).slice(0, size);
  }
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 5);
  if (mode === 'reversed') return arr.sort((a, b) => b - a);
  if (mode === 'nearly') {
    const sorted = [...arr].sort((a, b) => a - b);
    const swaps = Math.max(1, Math.floor(size * 0.1));
    for (let i = 0; i < swaps; i++) {
      const a = Math.floor(Math.random() * size);
      const b = Math.floor(Math.random() * size);
      [sorted[a], sorted[b]] = [sorted[b], sorted[a]];
    }
    return sorted;
  }
  return arr;
}

function EraserIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 20H7L3 16a2 2 0 010-3l9-9a2 2 0 013 0l6 6a2 2 0 010 3L12 20" />
    </svg>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color }}>{value}</span>
    </div>
  );
}

export default function AlgorithmVisualizer() {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoInfo>(ALGORITHMS[0]);
  const [expandedCats, setExpandedCats] = useState<Record<AlgoCategory, boolean>>({
    sorting: true, searching: false, graph: false, pathfinding: false, datastructure: false,
  });
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState(500);
  const [inputMode, setInputMode] = useState<InputMode>('random');
  const [customInput, setCustomInput] = useState('');
  const [input, setInput] = useState<number[]>(() => genArray(30, 'random'));
  const [frames, setFrames] = useState<Frame[]>(() => {
    try {
      return generateFrames(ALGORITHMS[0]?.id || 'bubble', genArray(30, 'random'));
    } catch {
      return [];
    }
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [grid, setGrid] = useState<number[][]>(() => makeGrid());
  const [gridStart, setGridStart] = useState<[number, number]>([0, 0]);
  const [gridEnd, setGridEnd] = useState<[number, number]>([9, 9]);
  const [gridMode, setGridMode] = useState<'wall' | 'start' | 'end' | 'erase'>('wall');
  const [searchTarget, setSearchTarget] = useState<number>(50);

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const isSorting = selectedAlgo.category === 'sorting';
  const isSearching = selectedAlgo.category === 'searching';
  const isPathfinding = selectedAlgo.category === 'pathfinding';

  const generateAlgorithm = useCallback(() => {
    try {
      let newInput = input;
      if (isSorting || isSearching) {
        newInput = genArray(arraySize, inputMode, customInput);
        setInput(newInput);
      }
      const gridConfig = isPathfinding ? { grid, start: gridStart, end: gridEnd } : undefined;
      const newFrames = generateFrames(selectedAlgo.id, newInput, isSearching ? searchTarget : undefined, gridConfig);
      setFrames(newFrames);
      setCurrentFrame(0);
      setIsPlaying(false);
      setElapsed(0);
      elapsedRef.current = 0;
    } catch (e) {
      console.error('Failed to generate frames:', e);
      setFrames([]);
      setCurrentFrame(0);
      setIsPlaying(false);
    }
  }, [selectedAlgo, arraySize, inputMode, customInput, input, grid, gridStart, gridEnd, isSorting, isSearching, isPathfinding, searchTarget]);

  useEffect(() => {
    generateAlgorithm();
  }, [selectedAlgo.id, selectedAlgo.category]);

  const nextFrame = useCallback(() => {
    setCurrentFrame(prev => {
      const nf = prev + 1;
      if (nf >= frames.length) { setIsPlaying(false); return prev; }
      return nf;
    });
  }, [frames.length]);

  const prevFrame = useCallback(() => {
    setCurrentFrame(prev => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentFrame(0);
    setIsPlaying(false);
    setElapsed(0);
    elapsedRef.current = 0;
  }, []);

  const togglePlay = useCallback(() => {
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0);
      elapsedRef.current = 0;
      setElapsed(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, [currentFrame, frames.length]);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      elapsedRef.current += delta;
      setElapsed(elapsedRef.current);
      if (delta >= speed) {
        nextFrame();
        lastTimeRef.current = now;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, speed, nextFrame]);

  const handleGridClick = useCallback((r: number, c: number) => {
    let newGrid = grid.map(row => [...row]);
    let newStart = [...gridStart] as [number, number];
    let newEnd = [...gridEnd] as [number, number];
    if (gridMode === 'start') {
      if (gridEnd[0] === r && gridEnd[1] === c) return;
      newGrid[gridStart[0]][gridStart[1]] = 0;
      newGrid[r][c] = 2;
      newStart = [r, c];
    } else if (gridMode === 'end') {
      if (gridStart[0] === r && gridStart[1] === c) return;
      newGrid[gridEnd[0]][gridEnd[1]] = 0;
      newGrid[r][c] = 3;
      newEnd = [r, c];
    } else if (gridMode === 'erase') {
      newGrid[r][c] = 0;
    } else {
      if ((r === gridStart[0] && c === gridStart[1]) || (r === gridEnd[0] && c === gridEnd[1])) return;
      newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1;
    }
    setGrid(newGrid);
    setGridStart(newStart);
    setGridEnd(newEnd);
    const newFrames = generateFrames(selectedAlgo.id, input, undefined, { grid: newGrid, start: newStart, end: newEnd });
    setFrames(newFrames);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, [grid, gridMode, gridStart, gridEnd, selectedAlgo.id, input]);

  const handleResetGrid = () => {
    setGrid(makeGrid());
    setGridStart([0, 0]);
    setGridEnd([9, 9]);
    setIsPlaying(false);
  };

  const handleRandomGrid = () => {
    setGrid(randomGrid(10, 10, 0.3));
    setGridStart([0, 0]);
    setGridEnd([9, 9]);
    setIsPlaying(false);
  };

  const currentFrameData = frames[currentFrame] ?? null;
  const categories = getAlgorithmsByCategory();
  const totalFrames = frames.length;
  const currentLine = currentFrameData?.line ?? 0;

  return (
    <div style={{ ...styles.root }}>
      <div style={styles.gridOverlay} />
      <div style={styles.container}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <BarChart3 size={20} color="#8b5cf6" />
            <span style={styles.sidebarTitle}>Algorithm</span>
          </div>
          <div style={styles.sidebarContent}>
            {(Object.keys(categories) as AlgoCategory[]).map(cat => (
              <div key={cat} style={{ marginBottom: 4 }}>
                <button style={styles.catButton} onClick={() => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }))}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: CATEGORY_COLORS[cat] }}>
                    {cat === 'sorting' && <BarChart3 size={14} />}
                    {cat === 'searching' && <Search size={14} />}
                    {cat === 'graph' && <Network size={14} />}
                    {cat === 'pathfinding' && <LayoutGrid size={14} />}
                    {cat === 'datastructure' && <List size={14} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{CATEGORY_LABELS[cat]}</span>
                  </span>
                  {expandedCats[cat] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expandedCats[cat] && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {categories[cat].map(algo => (
                      <button key={algo.id}
                        style={{
                          ...styles.algoButton,
                          background: selectedAlgo.id === algo.id ? `${CATEGORY_COLORS[cat]}22` : 'transparent',
                          borderColor: selectedAlgo.id === algo.id ? CATEGORY_COLORS[cat] : 'transparent',
                          color: selectedAlgo.id === algo.id ? CATEGORY_COLORS[cat] : '#94a3b8',
                        }}
                        onClick={() => setSelectedAlgo(algo)}
                      >{algo.name}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={styles.sidebarFooter}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Algorithm</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: CATEGORY_COLORS[selectedAlgo.category], fontFamily: 'monospace' }}>{selectedAlgo.name}</span>
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.canvasContainer}>
            {currentFrameData?.type === 'sort' && (
              <BarVisualizer frame={currentFrameData as SortFrame} />
            )}
            {currentFrameData?.type === 'search' && (
              <BarVisualizer frame={currentFrameData as SearchFrame} />
            )}
            {currentFrameData?.type === 'graph' && (
              <GraphVisualizer frame={currentFrameData as GraphFrame} />
            )}
            {isPathfinding && (
              <GridVisualizer frame={(currentFrameData?.type === 'grid' ? currentFrameData : null) as GridFrame || { type: 'grid', grid, start: gridStart, end: gridEnd, walls: new Set(), visited: new Set(), path: new Set(), current: null, line: 0 }} editable={!isPlaying} onCellClick={handleGridClick} />
            )}
            {currentFrameData?.type === 'ds' && (
              <DSVisualizer frame={currentFrameData as DSFrame} />
            )}
          </div>

          <div style={styles.controlsBar}>
            <div style={styles.controlsLeft}>
              <button style={styles.iconBtn} onClick={reset} title="Reset"><RotateCcw size={16} /></button>
              <button style={styles.iconBtn} onClick={prevFrame} title="Previous"><ChevronLeft size={16} /></button>
              <button style={{
                ...styles.playBtn,
                background: isPlaying ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              }} onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button style={styles.iconBtn} onClick={nextFrame} title="Next"><ChevronRight size={16} /></button>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${totalFrames > 1 ? (currentFrame / (totalFrames - 1)) * 100 : 0}%` }} />
              </div>
              <span style={styles.progressText}>{currentFrame + 1} / {totalFrames}</span>
            </div>

            {(isSorting || isSearching) && (
              <div style={styles.sizeControl}>
                <span style={styles.controlLabel}>Size</span>
                <input type="range" min={5} max={100} value={arraySize} onChange={e => setArraySize(Number(e.target.value))} style={styles.slider} />
                <span style={styles.sizeValue}>{arraySize}</span>
              </div>
            )}
          </div>

          <div style={styles.statsBar}>
            {currentFrameData && 'comparisons' in currentFrameData && (
              <StatItem label="Comparisons" value={String(currentFrameData.comparisons)} color="#f59e0b" />
            )}
            {currentFrameData && 'swaps' in currentFrameData && (
              <StatItem label="Swaps" value={String(currentFrameData.swaps)} color="#ec4899" />
            )}
            <StatItem label="Frame" value={`${currentFrame + 1}/${totalFrames}`} color="#8b5cf6" />
            <StatItem label="Time" value={`${(elapsed / 1000).toFixed(2)}s`} color="#22c55e" />
            <StatItem label="Speed" value={`${speed}ms`} color="#06b6d4" />
          </div>
        </main>

        <aside style={styles.rightPanel}>
          <div style={styles.settingsSection}>
            <div style={styles.settingsHeader}>
              <Settings size={14} color="#8b5cf6" />
              <span style={styles.settingsTitle}>Controls</span>
            </div>
            <div style={styles.settingsBody}>
              <div style={styles.controlGroup}>
                <label style={styles.controlLabel}>Speed: {speed}ms</label>
                <input type="range" min={100} max={2000} step={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={styles.slider} />
              </div>

              {(isSorting || isSearching) && (
                <>
                  <div style={styles.controlGroup}>
                    <label style={styles.controlLabel}>Input Type</label>
                    <div style={styles.inputRow}>
                      {(['random', 'reversed', 'nearly', 'custom'] as InputMode[]).map(m => (
                        <button key={m} style={{
                          ...styles.inputModeBtn,
                          background: inputMode === m ? '#8b5cf6' : 'transparent',
                          borderColor: inputMode === m ? '#8b5cf6' : '#334155',
                        }} onClick={() => setInputMode(m)}>{m}</button>
                      ))}
                    </div>
                  </div>

                  {inputMode === 'custom' && (
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Custom Values</label>
                      <input type="text" value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="5, 3, 8, 1, 9, 2..." style={styles.textInput} />
                    </div>
                  )}

                  {isSearching && (
                    <div style={styles.controlGroup}>
                      <label style={styles.controlLabel}>Search Target</label>
                      <input type="number" value={searchTarget} onChange={e => setSearchTarget(Number(e.target.value))} style={styles.numberInput} />
                    </div>
                  )}

                  <button style={styles.generateBtn} onClick={generateAlgorithm}>
                    <Shuffle size={14} /> Generate
                  </button>
                </>
              )}

              {isPathfinding && (
                <>
                  <div style={styles.controlGroup}>
                    <label style={styles.controlLabel}>Grid Mode</label>
                    <div style={styles.inputRow}>
                      {([['wall', 'Wall', <MousePointer size={10} />], ['start', 'Start', <Flag size={10} />], ['end', 'End', <Flag size={10} />], ['erase', 'Erase', <EraserIcon />]] as const).map(([mode, label, icon]) => (
                        <button key={mode} style={{
                          ...styles.inputModeBtn,
                          background: gridMode === mode ? '#8b5cf6' : 'transparent',
                          borderColor: gridMode === mode ? '#8b5cf6' : '#334155',
                        }} onClick={() => setGridMode(mode)}>{icon} {label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={styles.gridBtnRow}>
                    <button style={styles.smallBtn} onClick={handleResetGrid}>Clear</button>
                    <button style={styles.smallBtn} onClick={handleRandomGrid}>Random</button>
                    <button style={styles.smallBtn} onClick={generateAlgorithm}>Visualize</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={styles.pseudocodeSection}>
            <div style={styles.pseudocodeHeader}>
              <Binary size={14} color="#ec4899" />
              <span style={styles.pseudocodeTitle}>Pseudocode</span>
            </div>
            <div style={styles.pseudocodeBody}>
              {selectedAlgo.pseudocode.map((line, i) => (
                <div key={i} style={{
                  ...styles.pseudocodeLine,
                  background: i === currentLine ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: i === currentLine ? '#c4b5fd' : '#64748b',
                  borderLeft: i === currentLine ? '2px solid #8b5cf6' : '2px solid transparent',
                }}>
                  <span style={styles.lineNum}>{i + 1}</span>
                  <span style={styles.lineText}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { width: '100%', height: '100%', minHeight: 600, position: 'relative', background: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e2e8f0', overflow: 'hidden' },
  gridOverlay: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.04) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' },
  container: { position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', gap: 12, padding: 12 },
  sidebar: { width: 200, minWidth: 200, background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  sidebarTitle: { fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sidebarContent: { flex: 1, overflowY: 'auto', padding: '8px 4px' },
  sidebarFooter: { padding: '10px 12px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', background: 'rgba(15, 23, 42, 0.4)' },
  catButton: { width: '100%', padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 500 },
  algoButton: { width: '100%', padding: '5px 10px', margin: '2px 0', background: 'transparent', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 12, transition: 'all 0.15s ease' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  canvasContainer: { flex: 1, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, overflow: 'hidden' },
  controlsBar: { background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16 },
  controlsLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.15)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', transition: 'all 0.15s ease' },
  playBtn: { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 12, color: 'white', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' },
  progressContainer: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 4, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: 2, transition: 'width 0.1s linear' },
  progressText: { fontSize: 11, color: '#64748b', fontFamily: 'monospace', minWidth: 50, textAlign: 'right' },
  sizeControl: { display: 'flex', alignItems: 'center', gap: 8 },
  controlLabel: { fontSize: 11, color: '#64748b', fontWeight: 500 },
  sizeValue: { fontSize: 12, color: '#c4b5fd', fontFamily: 'monospace', minWidth: 32, textAlign: 'center' },
  slider: { width: 100, height: 4, appearance: 'none', background: 'rgba(148, 163, 184, 0.2)', borderRadius: 2, outline: 'none', cursor: 'pointer' },
  statsBar: { background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: '10px 16px', display: 'flex', gap: 24 },
  rightPanel: { width: 260, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 },
  settingsSection: { background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', overflow: 'hidden' },
  settingsHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  settingsTitle: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  settingsBody: { padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  inputRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  inputModeBtn: { padding: '5px 8px', fontSize: 10, border: '1px solid #334155', borderRadius: 6, background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 },
  textInput: { padding: '6px 8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', outline: 'none' },
  numberInput: { padding: '6px 8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', outline: 'none', width: '100%' },
  generateBtn: { padding: '8px 12px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  gridBtnRow: { display: 'flex', gap: 6 },
  smallBtn: { flex: 1, padding: '6px 8px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: 6, color: '#c4b5fd', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  pseudocodeSection: { background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  pseudocodeHeader: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' },
  pseudocodeTitle: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  pseudocodeBody: { padding: 8, flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 },
  pseudocodeLine: { display: 'flex', padding: '2px 6px', borderRadius: 4, transition: 'all 0.15s ease' },
  lineNum: { width: 22, textAlign: 'right', marginRight: 8, color: '#475569', fontSize: 10 },
  lineText: { whiteSpace: 'pre' },
};
