import type { GridFrame } from './types';

export function generateAStar(grid: number[][], start: [number, number], end: [number, number]): GridFrame[] {
  const frames: GridFrame[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const walls = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) walls.add(`${r},${c}`);
    }
  }

  const visited = new Set<string>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const openSet = new Set<string>([`${start[0]},${start[1]}`]);
  gScore.set(`${start[0]},${start[1]}`, 0);
  fScore.set(`${start[0]},${start[1]}`, Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]));

  const gridCopy = grid.map(row => [...row]);
  gridCopy[start[0]][start[1]] = 2;
  gridCopy[end[0]][end[1]] = 3;

  frames.push({ type: 'grid', grid: gridCopy, start, end, walls: new Set(walls), visited: new Set(), path: new Set(), current: null, line: 0 });

  while (openSet.size > 0) {
    let current: string | null = null;
    let bestF = Infinity;
    for (const node of openSet) {
      const f = fScore.get(node) ?? Infinity;
      if (f < bestF) { bestF = f; current = node; }
    }
    if (!current) break;
    const [cr, cc] = current.split(',').map(Number);
    openSet.delete(current);
    visited.add(current);

    const visGrid = gridCopy.map(row => [...row]);
    for (const v of visited) { const [vr, vc] = v.split(',').map(Number); if (visGrid[vr][vc] !== 2 && visGrid[vr][vc] !== 3) visGrid[vr][vc] = 4; }
    frames.push({ type: 'grid', grid: visGrid, start, end, walls: new Set(walls), visited: new Set(visited), path: new Set(), current: [cr, cc], line: 3 });

    if (cr === end[0] && cc === end[1]) {
      const path = new Set<string>();
      let c: string | undefined = current;
      while (c) { path.add(c); c = cameFrom.get(c); }
      const pathGrid = gridCopy.map(row => [...row]);
      for (const p of path) { const [pr, pc] = p.split(',').map(Number); if (pathGrid[pr][pc] !== 2 && pathGrid[pr][pc] !== 3) pathGrid[pr][pc] = 5; }
      frames.push({ type: 'grid', grid: pathGrid, start, end, walls: new Set(walls), visited: new Set(visited), path, current: null, line: 6 });
      return frames;
    }

    const neighbors: [number, number][] = [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]];
    for (const [nr, nc] of neighbors) {
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || walls.has(key)) continue;
      const tentative = (gScore.get(current) ?? Infinity) + 1;
      if (tentative < (gScore.get(key) ?? Infinity)) {
        cameFrom.set(key, current);
        gScore.set(key, tentative);
        fScore.set(key, tentative + Math.abs(nr - end[0]) + Math.abs(nc - end[1]));
        openSet.add(key);
      }
    }
  }
  frames.push({ type: 'grid', grid: gridCopy, start, end, walls: new Set(walls), visited: new Set(visited), path: new Set(), current: null, line: 7 });
  return frames;
}
