export type AlgoCategory = 'sorting' | 'searching' | 'graph' | 'pathfinding' | 'datastructure';

export interface AlgoInfo {
  id: string;
  name: string;
  category: AlgoCategory;
  description: string;
  pseudocode: string[];
}

export interface SortFrame {
  type: 'sort';
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot: number | null;
  line: number;
  comparisons: number;
  swaps: number;
}

export interface SearchFrame {
  type: 'search';
  array: number[];
  comparing: number[];
  found: boolean;
  index: number;
  line: number;
  comparisons: number;
}

export interface GraphNode {
  id: number;
  x: number;
  y: number;
  value: string;
}

export interface GraphFrame {
  type: 'graph';
  nodes: GraphNode[];
  edges: [number, number][];
  visited: number[];
  current: number | null;
  queue: number[];
  line: number;
}

export interface GridFrame {
  type: 'grid';
  grid: number[][];
  start: [number, number];
  end: [number, number];
  walls: Set<string>;
  visited: Set<string>;
  path: Set<string>;
  current: [number, number] | null;
  line: number;
}

export interface DSFrame {
  type: 'ds';
  structure: 'stack' | 'queue' | 'linkedlist';
  data: number[];
  operation: string;
  line: number;
  pointer?: number;
}

export type Frame = SortFrame | SearchFrame | GraphFrame | GridFrame | DSFrame;

export const CATEGORY_LABELS: Record<AlgoCategory, string> = {
  sorting: 'Sorting',
  searching: 'Searching',
  graph: 'Graph',
  pathfinding: 'Pathfinding',
  datastructure: 'Data Structures',
};

export const CATEGORY_COLORS: Record<AlgoCategory, string> = {
  sorting: '#8b5cf6',
  searching: '#06b6d4',
  graph: '#ec4899',
  pathfinding: '#f59e0b',
  datastructure: '#22c55e',
};

export const ALGORITHMS: AlgoInfo[] = [
  { id: 'bubble', name: 'Bubble Sort', category: 'sorting', description: 'Repeatedly compares adjacent elements.', pseudocode: [
    'function bubbleSort(arr):', '  for i from 0 to n-1:', '    for j from 0 to n-i-2:',
    '      compare arr[j] and arr[j+1]', '      if arr[j] > arr[j+1]:',
    '        swap arr[j], arr[j+1]', '    mark arr[n-i-1] as sorted',
  ]},
  { id: 'quick', name: 'Quick Sort', category: 'sorting', description: 'Divide and conquer using pivot.', pseudocode: [
    'function quickSort(arr, low, high):', '  if low < high:', '    pivot = arr[high]',
    '    partition around pivot', '    quickSort left partition', '    quickSort right partition',
  ]},
  { id: 'merge', name: 'Merge Sort', category: 'sorting', description: 'Divide, conquer, merge.', pseudocode: [
    'function mergeSort(arr):', '  if length <= 1: return', '  mid = length / 2',
    '  mergeSort left half', '  mergeSort right half', '  merge halves',
  ]},
  { id: 'heap', name: 'Heap Sort', category: 'sorting', description: 'Max heap extraction sort.', pseudocode: [
    'function heapSort(arr):', '  buildMaxHeap(arr)',
    '  for i from n-1 to 1:', '    swap arr[0], arr[i]', '    heapify(arr, 0, i)',
  ]},
  { id: 'insertion', name: 'Insertion Sort', category: 'sorting', description: 'Incremental sorted build.', pseudocode: [
    'function insertionSort(arr):', '  for i from 1 to n-1:', '    key = arr[i]',
    '    shift larger elements right', '    insert key in correct position',
  ]},
  { id: 'linear', name: 'Linear Search', category: 'searching', description: 'Sequential scan.', pseudocode: [
    'function linearSearch(arr, target):', '  for i from 0 to n-1:',
    '    compare arr[i] with target', '    if equal: return i', '  return -1',
  ]},
  { id: 'binary', name: 'Binary Search', category: 'searching', description: 'Halving search space.', pseudocode: [
    'function binarySearch(arr, target):', '  while low <= high:',
    '    mid = (low + high) / 2', '    compare arr[mid] with target',
    '    adjust low/high accordingly', '  return -1',
  ]},
  { id: 'bfs', name: 'BFS Traversal', category: 'graph', description: 'Queue-based traversal.', pseudocode: [
    'function BFS(graph, start):', '  queue = [start]', '  visited = {start}',
    '  while queue:', '    node = dequeue()', '    enqueue unvisited neighbors',
  ]},
  { id: 'dfs', name: 'DFS Traversal', category: 'graph', description: 'Stack-based traversal.', pseudocode: [
    'function DFS(graph, start):', '  stack = [start]', '  visited = {}',
    '  while stack:', '    node = pop()', '    push unvisited neighbors',
  ]},
  { id: 'astar', name: 'A* Pathfinding', category: 'pathfinding', description: 'Heuristic grid search.', pseudocode: [
    'function A*(grid, start, end):', '  openSet = {start}',
    '  while openSet:', '    current = lowest f-score',
    '    if current == end: reconstruct path', '    update neighbors',
  ]},
  { id: 'stack', name: 'Stack Operations', category: 'datastructure', description: 'LIFO operations.', pseudocode: [
    'function stackDemo():', '  push(10)', '  push(20)', '  push(30)',
    '  peek()', '  pop()', '  push(40)', '  pop()',
  ]},
  { id: 'queue', name: 'Queue Operations', category: 'datastructure', description: 'FIFO operations.', pseudocode: [
    'function queueDemo():', '  enqueue(10)', '  enqueue(20)', '  enqueue(30)',
    '  peek()', '  dequeue()', '  enqueue(40)', '  dequeue()',
  ]},
  { id: 'linkedlist', name: 'Linked List', category: 'datastructure', description: 'Node-based operations.', pseudocode: [
    'function linkedListDemo():', '  insert(10)', '  insert(20)',
    '  insert(30)', '  insert(40)', '  delete(20)', '  insert(50)',
  ]},
];

export function getAlgorithmsByCategory(): Record<AlgoCategory, AlgoInfo[]> {
  return ALGORITHMS.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<AlgoCategory, AlgoInfo[]>);
}
