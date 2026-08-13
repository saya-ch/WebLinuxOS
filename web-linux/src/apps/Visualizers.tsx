import type { SortFrame, SearchFrame, GraphFrame, GridFrame, DSFrame } from './algorithms/types';

export function BarVisualizer({ frame }: { frame: SortFrame | SearchFrame }) {
  const array = frame?.array ?? [];
  if (!array.length) return <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>No data</div>;
  const maxVal = Math.max(...array, 1);
  const containerW = 800;
  const containerH = 420;
  const gap = 2;
  const barW = Math.max(2, Math.min(40, (containerW - gap * (array.length - 1)) / array.length));
  const totalW = barW * array.length + gap * (array.length - 1);
  const offsetX = (containerW - totalW) / 2;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${containerW} ${containerH}`} preserveAspectRatio="xMidYMid meet">
        {array.map((val, i) => {
          const h = (val / maxVal) * (containerH - 60) + 10;
          const x = offsetX + i * (barW + gap);
          const y = containerH - h - 30;
          let color = '#334155';
          if (frame.type === 'sort') {
            if (frame.sorted.includes(i)) color = '#22c55e';
            else if (frame.swapping.includes(i)) color = '#ef4444';
            else if (frame.comparing.includes(i)) color = '#f59e0b';
            else if (frame.pivot === i) color = '#f97316';
          } else {
            if (frame.comparing.includes(i)) color = '#f59e0b';
            if (frame.found && frame.index === i) color = '#22c55e';
            if (!frame.found && frame.index === i) color = '#ef4444';
          }
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`bgrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={barW} height={h} fill={`url(#bgrad-${i})`} rx={2} ry={2}
                style={{ transition: 'all 0.15s ease-out' }}
              />
              {barW >= 14 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">{val}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GraphVisualizer({ frame }: { frame: GraphFrame }) {
  const w = 320, h = 300;
  const nodes = frame?.nodes ?? [];
  const edges = frame?.edges ?? [];
  if (!nodes.length) return <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>No graph data</div>;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visitedSet = new Set(frame?.visited ?? []);
  const queueSet = new Set(frame?.queue ?? []);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxHeight: '100%' }}>
      {edges.map(([u, v], i) => {
        const a = nodeMap.get(u);
        const b = nodeMap.get(v);
        if (!a || !b) return null;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#334155" strokeWidth="1.5" opacity="0.6" />;
      })}
      {nodes.map(node => {
        const isVisited = visitedSet.has(node.id);
        const isCurrent = frame?.current === node.id;
        const isInQueue = queueSet.has(node.id);
        let fill = '#1e293b';
        let stroke = '#475569';
        if (isCurrent) { fill = '#ec4899'; stroke = '#f472b6'; }
        else if (isVisited) { fill = '#22c55e'; stroke = '#4ade80'; }
        else if (isInQueue) { fill = '#f59e0b'; stroke = '#fbbf24'; }
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={18} fill={fill} stroke={stroke} strokeWidth="2"
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{node.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function GridVisualizer({ frame, editable, onCellClick }: { frame: GridFrame; editable?: boolean; onCellClick?: (r: number, c: number) => void }) {
  const gridData = frame?.grid ?? [];
  if (!gridData.length) return <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>No grid data</div>;
  const rows = gridData.length;
  const cols = gridData[0]?.length ?? 0;
  const cellSize = 32;
  const w = cols * cellSize;
  const h = rows * cellSize;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxHeight: '100%', cursor: editable ? 'pointer' : 'default' }}>
      {gridData.map((row, r) =>
        row.map((cell, c) => {
          let fill = '#1e293b';
          if (cell === 1) fill = '#475569';
          if (cell === 2) fill = '#22c55e';
          if (cell === 3) fill = '#f59e0b';
          if (cell === 4) fill = '#1e40af';
          if (cell === 5) fill = '#8b5cf6';
          if (frame?.current && frame.current[0] === r && frame.current[1] === c) fill = '#ec4899';
          return (
            <g key={`${r}-${c}`} onClick={() => editable && onCellClick && onCellClick(r, c)}>
              <rect x={c * cellSize} y={r * cellSize} width={cellSize - 1} height={cellSize - 1} fill={fill} rx={3}
                style={{ transition: 'fill 0.2s ease' }}
              />
              {cell === 2 && <text x={c * cellSize + cellSize / 2} y={r * cellSize + cellSize / 2 + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" pointerEvents="none">S</text>}
              {cell === 3 && <text x={c * cellSize + cellSize / 2} y={r * cellSize + cellSize / 2 + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" pointerEvents="none">E</text>}
            </g>
          );
        })
      )}
    </svg>
  );
}

export function DSVisualizer({ frame }: { frame: DSFrame }) {
  const structure = frame?.structure ?? 'stack';
  const data = frame?.data ?? [];
  if (!data.length) return <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center' }}>Empty structure</div>;
  const containerW = 500;
  const containerH = 360;

  if (structure === 'stack') {
    const blockW = 80, blockH = 30, gap = 4;
    const totalH = data.length * (blockH + gap);
    const startY = containerH - totalH - 30;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${containerW} ${containerH}`}>
        <line x1={containerW / 2 - blockW / 2 - 5} y1={20} x2={containerW / 2 - blockW / 2 - 5} y2={containerH - 20} stroke="#334155" strokeWidth="2" />
        <line x1={containerW / 2 + blockW / 2 + 5} y1={20} x2={containerW / 2 + blockW / 2 + 5} y2={containerH - 20} stroke="#334155" strokeWidth="2" />
        <line x1={containerW / 2 - blockW / 2 - 5} y1={containerH - 20} x2={containerW / 2 + blockW / 2 + 5} y2={containerH - 20} stroke="#334155" strokeWidth="2" />
        {data.map((val, i) => {
          const y = startY + i * (blockH + gap);
          return (
            <g key={i}>
              <rect x={containerW / 2 - blockW / 2} y={y} width={blockW} height={blockH} fill="#8b5cf6" rx={4}
                style={{ transition: 'all 0.3s ease' }}
              />
              <text x={containerW / 2} y={y + blockH / 2 + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="monospace">{val}</text>
            </g>
          );
        })}
        <text x={containerW / 2} y={containerH - 5} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">Bottom</text>
        <text x={containerW / 2} y={15} textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="monospace">Top</text>
      </svg>
    );
  }

  if (structure === 'queue') {
    const blockW = 70, blockH = 50, gap = 4;
    const totalW = data.length * (blockW + gap);
    const startX = Math.max(20, (containerW - totalW) / 2);
    const y = containerH / 2 - blockH / 2;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${containerW} ${containerH}`}>
        {data.map((val, i) => (
          <g key={i}>
            <rect x={startX + i * (blockW + gap)} y={y} width={blockW} height={blockH}
              fill={i === 0 ? '#ec4899' : '#8b5cf6'} rx={4}
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={startX + i * (blockW + gap) + blockW / 2} y={y + blockH / 2 + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="monospace">{val}</text>
          </g>
        ))}
        {data.length > 0 && (
          <>
            <text x={startX} y={y - 8} fill="#ec4899" fontSize="11" fontFamily="monospace">Front</text>
            <text x={startX + (data.length - 1) * (blockW + gap) + blockW} y={y - 8} fill="#8b5cf6" fontSize="11" fontFamily="monospace">Rear</text>
          </>
        )}
      </svg>
    );
  }

  const nodeW = 60, nodeH = 40, gap = 20, arrowSize = 12;
  const totalW = data.length * nodeW + (data.length - 1) * (gap + arrowSize);
  const startX = Math.max(20, (containerW - totalW) / 2);
  const y = containerH / 2 - nodeH / 2;
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${containerW} ${containerH}`}>
      {data.map((val, i) => {
        const x = startX + i * (nodeW + gap + arrowSize);
        return (
          <g key={i}>
            <rect x={x} y={y} width={nodeW} height={nodeH} fill="#ec4899" rx={6}
              style={{ transition: 'all 0.3s ease' }}
            />
            <text x={x + nodeW / 2} y={y + nodeH / 2 + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="monospace">{val}</text>
            {i < data.length - 1 && (
              <>
                <line x1={x + nodeW} y1={y + nodeH / 2} x2={x + nodeW + gap + arrowSize} y2={y + nodeH / 2} stroke="#475569" strokeWidth="2" />
                <polygon
                  points={`${x + nodeW + gap + arrowSize},${y + nodeH / 2} ${x + nodeW + gap + arrowSize - 6},${y + nodeH / 2 - 5} ${x + nodeW + gap + arrowSize - 6},${y + nodeH / 2 + 5}`}
                  fill="#475569"
                />
              </>
            )}
          </g>
        );
      })}
      {data.length > 0 && <text x={startX - 10} y={y - 10} fill="#ec4899" fontSize="11" fontFamily="monospace">Head</text>}
    </svg>
  );
}
