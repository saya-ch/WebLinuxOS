import type { SearchFrame } from './types';

export function generateLinearSearch(arr: number[], target: number): SearchFrame[] {
  const frames: SearchFrame[] = [];
  const a = [...arr];
  let comparisons = 0;
  for (let i = 0; i < a.length; i++) {
    comparisons++;
    const found = a[i] === target;
    frames.push({ type: 'search', array: [...a], comparing: [i], found, index: i, line: 3, comparisons });
    if (found) {
      frames.push({ type: 'search', array: [...a], comparing: [], found: true, index: i, line: 4, comparisons });
      return frames;
    }
  }
  frames.push({ type: 'search', array: [...a], comparing: [], found: false, index: -1, line: 5, comparisons });
  return frames;
}

export function generateBinarySearch(arr: number[], target: number): SearchFrame[] {
  const frames: SearchFrame[] = [];
  const a = [...arr].sort((x, y) => x - y);
  let comparisons = 0;
  let low = 0, high = a.length - 1;
  frames.push({ type: 'search', array: [...a], comparing: [], found: false, index: -1, line: 0, comparisons });
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    frames.push({ type: 'search', array: [...a], comparing: [mid], found: false, index: mid, line: 3, comparisons });
    if (a[mid] === target) {
      frames.push({ type: 'search', array: [...a], comparing: [], found: true, index: mid, line: 5, comparisons });
      return frames;
    } else if (a[mid] < target) {
      low = mid + 1;
      frames.push({ type: 'search', array: [...a], comparing: [], found: false, index: mid, line: 7, comparisons });
    } else {
      high = mid - 1;
      frames.push({ type: 'search', array: [...a], comparing: [], found: false, index: mid, line: 9, comparisons });
    }
  }
  frames.push({ type: 'search', array: [...a], comparing: [], found: false, index: -1, line: 10, comparisons });
  return frames;
}
