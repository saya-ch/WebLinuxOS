import type { GraphFrame, GraphNode } from './types';

function buildGraph(n: number): { nodes: GraphNode[]; edges: [number, number][] } {
  const nodes: GraphNode[] = [];
  const edges: [number, number][] = [];
  const cx = 160, cy = 150, r = 110;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodes.push({ id: i, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), value: String(i + 1) });
  }
  for (let i = 0; i < n; i++) {
    edges.push([i, (i + 1) % n]);
    if (i % 2 === 0 && i + 2 < n) edges.push([i, i + 2]);
    if (i % 3 === 0 && i + 3 < n) edges.push([i, i + 3]);
  }
  return { nodes, edges };
}

export function generateBFS(nodeCount: number): GraphFrame[] {
  const { nodes, edges } = buildGraph(nodeCount);
  const frames: GraphFrame[] = [];
  const adj: number[][] = nodes.map(() => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const start = 0;
  const visited: number[] = [];
  const queue: number[] = [start];
  const seen = new Set<number>([start]);
  frames.push({ type: 'graph', nodes, edges, visited: [], current: null, queue: [start], line: 0 });
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited.push(node);
    frames.push({ type: 'graph', nodes, edges, visited: [...visited], current: node, queue: [...queue], line: 3 });
    for (const neighbor of adj[node]) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push(neighbor);
        frames.push({ type: 'graph', nodes, edges, visited: [...visited], current: node, queue: [...queue], line: 7 });
      }
    }
  }
  frames.push({ type: 'graph', nodes, edges, visited: [...visited], current: null, queue: [], line: 8 });
  return frames;
}

export function generateDFS(nodeCount: number): GraphFrame[] {
  const { nodes, edges } = buildGraph(nodeCount);
  const frames: GraphFrame[] = [];
  const adj: number[][] = nodes.map(() => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const visited: number[] = [];
  const seen = new Set<number>();

  function dfs(node: number, line: number) {
    seen.add(node);
    visited.push(node);
    frames.push({ type: 'graph', nodes, edges, visited: [...visited], current: node, queue: [], line });
    for (const neighbor of adj[node]) {
      if (!seen.has(neighbor)) {
        dfs(neighbor, line + 2);
      }
    }
  }

  dfs(0, 0);
  frames.push({ type: 'graph', nodes, edges, visited: [...visited], current: null, queue: [], line: 8 });
  return frames;
}
