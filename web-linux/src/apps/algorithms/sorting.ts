import type { SortFrame } from './types';

export function generateBubbleSort(arr: number[]): SortFrame[] {
  const frames: SortFrame[] = [];
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const sorted: number[] = [];
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: [], pivot: null, line: 0, comparisons, swaps });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      frames.push({ type: 'sort', array: [...a], comparing: [j, j + 1], swapping: [], sorted: [...sorted], pivot: null, line: 3, comparisons, swaps });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [j, j + 1], sorted: [...sorted], pivot: null, line: 5, comparisons, swaps });
      }
    }
    sorted.push(n - i - 1);
  }
  sorted.push(0);
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i), pivot: null, line: 7, comparisons, swaps });
  return frames;
}

export function generateQuickSort(arr: number[]): SortFrame[] {
  const frames: SortFrame[] = [];
  const a = [...arr];
  let comparisons = 0, swaps = 0;
  const sorted: number[] = [];

  function partition(low: number, high: number): number {
    const pivot = a[high];
    frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: [...sorted], pivot: high, line: 3, comparisons, swaps });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      comparisons++;
      frames.push({ type: 'sort', array: [...a], comparing: [j, high], swapping: [], sorted: [...sorted], pivot: high, line: 5, comparisons, swaps });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          swaps++;
          frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [i, j], sorted: [...sorted], pivot: high, line: 7, comparisons, swaps });
        }
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    swaps++;
    sorted.push(i + 1);
    frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [i + 1, high], sorted: [...sorted], pivot: null, line: 8, comparisons, swaps });
    return i + 1;
  }

  function qs(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      qs(low, pi - 1);
      qs(pi + 1, high);
    } else if (low === high) {
      sorted.push(low);
      frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: [...sorted], pivot: null, line: 2, comparisons, swaps });
    }
  }

  qs(0, a.length - 1);
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: a.length }, (_, i) => i), pivot: null, line: 10, comparisons, swaps });
  return frames;
}

export function generateMergeSort(arr: number[]): SortFrame[] {
  const frames: SortFrame[] = [];
  const a = [...arr];
  let comparisons = 0, swaps = 0;

  function merge(l: number, m: number, r: number) {
    const left = a.slice(l, m + 1);
    const right = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      comparisons++;
      frames.push({ type: 'sort', array: [...a], comparing: [l + i, m + 1 + j], swapping: [], sorted: [], pivot: null, line: 5, comparisons, swaps });
      if (left[i] <= right[j]) {
        a[k++] = left[i++];
      } else {
        a[k++] = right[j++];
        swaps++;
      }
      frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [k - 1], sorted: [], pivot: null, line: 6, comparisons, swaps });
    }
    while (i < left.length) a[k++] = left[i++];
    while (j < right.length) a[k++] = right[j++];
  }

  function ms(l: number, r: number) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: [], pivot: null, line: 3, comparisons, swaps });
      ms(l, m);
      ms(m + 1, r);
      merge(l, m, r);
    }
  }

  ms(0, a.length - 1);
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: a.length }, (_, i) => i), pivot: null, line: 8, comparisons, swaps });
  return frames;
}

export function generateHeapSort(arr: number[]): SortFrame[] {
  const frames: SortFrame[] = [];
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const sorted: number[] = [];

  function heapify(size: number, root: number) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;
    if (left < size) { comparisons++; if (a[left] > a[largest]) largest = left; }
    if (right < size) { comparisons++; if (a[right] > a[largest]) largest = right; }
    if (largest !== root) {
      frames.push({ type: 'sort', array: [...a], comparing: [root, largest], swapping: [], sorted: [...sorted], pivot: null, line: 4, comparisons, swaps });
      [a[root], a[largest]] = [a[largest], a[root]];
      swaps++;
      frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [root, largest], sorted: [...sorted], pivot: null, line: 6, comparisons, swaps });
      heapify(size, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    swaps++;
    sorted.push(i);
    frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [0, i], sorted: [...sorted], pivot: null, line: 3, comparisons, swaps });
    heapify(i, 0);
  }
  sorted.push(0);
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i), pivot: null, line: 5, comparisons, swaps });
  return frames;
}

export function generateInsertionSort(arr: number[]): SortFrame[] {
  const frames: SortFrame[] = [];
  const a = [...arr];
  const n = a.length;
  let comparisons = 0, swaps = 0;

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: [], pivot: i, line: 2, comparisons, swaps });
    while (j >= 0) {
      comparisons++;
      frames.push({ type: 'sort', array: [...a], comparing: [j, j + 1], swapping: [], sorted: [], pivot: i, line: 4, comparisons, swaps });
      if (a[j] > key) {
        a[j + 1] = a[j];
        swaps++;
        frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [j, j + 1], sorted: [], pivot: i, line: 5, comparisons, swaps });
        j--;
      } else break;
    }
    a[j + 1] = key;
    frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [j + 1], sorted: [], pivot: null, line: 6, comparisons, swaps });
  }
  frames.push({ type: 'sort', array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i), pivot: null, line: 7, comparisons, swaps });
  return frames;
}
