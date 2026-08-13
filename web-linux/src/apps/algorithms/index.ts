export * from './types';
import { generateBubbleSort, generateQuickSort, generateMergeSort, generateHeapSort, generateInsertionSort } from './sorting';
import { generateLinearSearch, generateBinarySearch } from './searching';
import { generateBFS, generateDFS } from './graph';
import { generateAStar } from './pathfinding';
import { generateStackFrames, generateQueueFrames, generateLinkedListFrames } from './datastructure';
import type { Frame } from './types';

export { generateBubbleSort, generateQuickSort, generateMergeSort, generateHeapSort, generateInsertionSort };
export { generateLinearSearch, generateBinarySearch };
export { generateBFS, generateDFS };
export { generateAStar };
export { generateStackFrames, generateQueueFrames, generateLinkedListFrames };

export function makeGrid(rows = 10, cols = 10): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

export function randomGrid(rows = 10, cols = 10, wallProb = 0.3): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() < wallProb ? 1 : 0));
}

export function generateFrames(
  algoId: string,
  input: number[],
  searchTarget?: number,
  gridConfig?: { grid: number[][]; start: [number, number]; end: [number, number] }
): Frame[] {
  switch (algoId) {
    case 'bubble': return generateBubbleSort(input);
    case 'quick': return generateQuickSort(input);
    case 'merge': return generateMergeSort(input);
    case 'heap': return generateHeapSort(input);
    case 'insertion': return generateInsertionSort(input);
    case 'linear': return generateLinearSearch(input, searchTarget ?? input[0]);
    case 'binary': return generateBinarySearch(input, searchTarget ?? input[0]);
    case 'bfs': return generateBFS(8);
    case 'dfs': return generateDFS(8);
    case 'astar': return gridConfig ? generateAStar(gridConfig.grid, gridConfig.start, gridConfig.end) : generateAStar(makeGrid(), [0, 0], [9, 9]);
    case 'stack': return generateStackFrames();
    case 'queue': return generateQueueFrames();
    case 'linkedlist': return generateLinkedListFrames();
    default: return [];
  }
}

