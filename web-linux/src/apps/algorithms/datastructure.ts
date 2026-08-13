import type { DSFrame } from './types';

export function generateStackFrames(): DSFrame[] {
  const frames: DSFrame[] = [];
  let stack: number[] = [];
  frames.push({ type: 'ds', structure: 'stack', data: [], operation: 'Init', line: 0 });
  const ops: [string, number][] = [['push', 10], ['push', 20], ['push', 30], ['peek', 0], ['pop', 0], ['push', 40], ['pop', 0], ['pop', 0]];
  ops.forEach(([op, val]) => {
    if (op === 'push') { stack = [...stack, val]; frames.push({ type: 'ds', structure: 'stack', data: [...stack], operation: `push(${val})`, line: 1 }); }
    else if (op === 'pop') { stack = stack.slice(0, -1); frames.push({ type: 'ds', structure: 'stack', data: [...stack], operation: 'pop()', line: 2 }); }
    else if (op === 'peek') { frames.push({ type: 'ds', structure: 'stack', data: [...stack], operation: `peek() → ${stack[stack.length - 1]}`, line: 3 }); }
  });
  return frames;
}

export function generateQueueFrames(): DSFrame[] {
  const frames: DSFrame[] = [];
  let queue: number[] = [];
  frames.push({ type: 'ds', structure: 'queue', data: [], operation: 'Init', line: 0 });
  const ops: [string, number][] = [['enqueue', 10], ['enqueue', 20], ['enqueue', 30], ['peek', 0], ['dequeue', 0], ['enqueue', 40], ['dequeue', 0], ['dequeue', 0]];
  ops.forEach(([op, val]) => {
    if (op === 'enqueue') { queue = [...queue, val]; frames.push({ type: 'ds', structure: 'queue', data: [...queue], operation: `enqueue(${val})`, line: 1 }); }
    else if (op === 'dequeue') { queue = queue.slice(1); frames.push({ type: 'ds', structure: 'queue', data: [...queue], operation: 'dequeue()', line: 2 }); }
    else if (op === 'peek') { frames.push({ type: 'ds', structure: 'queue', data: [...queue], operation: `peek() → ${queue[0]}`, line: 3 }); }
  });
  return frames;
}

export function generateLinkedListFrames(): DSFrame[] {
  const frames: DSFrame[] = [];
  let list: number[] = [];
  frames.push({ type: 'ds', structure: 'linkedlist', data: [], operation: 'Init', line: 0 });
  const ops: [string, number][] = [['insert', 10], ['insert', 20], ['insert', 30], ['insert', 40], ['delete', 20], ['insert', 50]];
  ops.forEach(([op, val]) => {
    if (op === 'insert') { list = [...list, val]; frames.push({ type: 'ds', structure: 'linkedlist', data: [...list], operation: `insert(${val})`, line: 1 }); }
    else if (op === 'delete') { list = list.filter(x => x !== val); frames.push({ type: 'ds', structure: 'linkedlist', data: [...list], operation: `delete(${val})`, line: 2 }); }
  });
  return frames;
}
