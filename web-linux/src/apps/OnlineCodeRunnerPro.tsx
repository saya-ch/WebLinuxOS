import { useState, useEffect, useCallback, useRef, memo } from 'react'

// ==================== 类型定义 ====================
interface OutputLine {
  type: 'stdout' | 'stderr' | 'info' | 'error'
  content: string
  time: number
}

type Mode = 'javascript' | 'html' | 'template'
type RightTab = 'preview' | 'output'

// ==================== 模板定义 ====================
interface CodeTemplate {
  id: string
  name: string
  icon: string
  mode: Mode
  code: string
}

const TEMPLATES: CodeTemplate[] = [
  {
    id: 'sort-algo',
    name: '排序算法',
    icon: '📊',
    mode: 'javascript',
    code: `// 经典排序算法可视化
// 快速排序、归并排序、冒泡排序性能对比

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const mid = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...mid, ...quickSort(right)];
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

function bubbleSort(arr) {
  const a = [...arr];
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
      }
    }
  } while (swapped);
  return a;
}

// 生成随机数组
const data = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100) + 1);
console.log('原始数组:', data.join(', '));

// 性能对比
const sizes = [100, 1000, 5000];
for (const size of sizes) {
  const testArr = Array.from({ length: size }, () => Math.floor(Math.random() * 10000));
  
  const t1 = performance.now();
  quickSort([...testArr]);
  const qTime = (performance.now() - t1).toFixed(2);
  
  const t2 = performance.now();
  mergeSort([...testArr]);
  const mTime = (performance.now() - t2).toFixed(2);
  
  const t3 = performance.now();
  bubbleSort([...testArr]);
  const bTime = (performance.now() - t3).toFixed(2);
  
  console.log(\`\\n数组大小: \${size}\`);
  console.log(\`  快速排序: \${qTime}ms\`);
  console.log(\`  归并排序: \${mTime}ms\`);
  console.log(\`  冒泡排序: \${bTime}ms\`);
}

console.log('\\n排序结果:', quickSort(data).join(', '));
console.log('✅ 验证通过:', quickSort(data).every((v, i, a) => i === 0 || a[i - 1] <= v));`
  },
  {
    id: 'canvas-draw',
    name: 'Canvas绘图',
    icon: '🎨',
    mode: 'html',
    code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>Canvas 动态绘图</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0d1117;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: system-ui, sans-serif;
    color: #c9d1d9;
  }
  h1 {
    font-size: 1.4rem;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .controls {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .controls button {
    padding: 8px 16px;
    border: 1px solid #30363d;
    border-radius: 8px;
    background: #161b22;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  .controls button:hover {
    border-color: #667eea;
    color: #667eea;
  }
  .controls button.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border-color: transparent;
  }
  canvas {
    border-radius: 12px;
    border: 1px solid #30363d;
    background: #010409;
  }
  .info {
    margin-top: 12px;
    font-size: 13px;
    color: #8b949e;
  }
</style>
</head>
<body>
  <h1>Canvas 动态绘图演示</h1>
  <div class="controls">
    <button class="active" onclick="setMode('particles')">粒子系统</button>
    <button onclick="setMode('spiral')">螺旋线</button>
    <button onclick="setMode('wave')">波浪</button>
    <button onclick="setMode('fractal')">分形树</button>
    <button onclick="clearCanvas()">清空画布</button>
  </div>
  <canvas id="c" width="600" height="400"></canvas>
  <div class="info">点击画布切换模式 · 移动鼠标与粒子互动</div>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let mode = 'particles';
    let animId = null;
    let mouseX = 300, mouseY = 200;
    const particles = [];

    class Particle {
      constructor(x, y) {
        this.x = x || Math.random() * 600;
        this.y = y || Math.random() * 400;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = 0.003 + Math.random() * 0.005;
        this.size = 2 + Math.random() * 3;
        this.hue = Math.random() * 60 + 220;
      }
      update() {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          this.vx += dx / dist * 0.3;
          this.vy += dy / dist * 0.3;
        }
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        if (this.x < 0 || this.x > 600) this.vx *= -1;
        if (this.y < 0 || this.y > 400) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + this.hue + ', 80%, 60%, ' + this.life + ')';
        ctx.fill();
      }
    }

    function drawParticles() {
      ctx.fillStyle = 'rgba(1, 4, 9, 0.1)';
      ctx.fillRect(0, 0, 600, 400);
      if (particles.length < 120) particles.push(new Particle());
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      // 连线
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(102, 126, 234, ' + (1 - d / 80) * 0.3 + ')';
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(drawParticles);
    }

    function drawSpiral() {
      ctx.fillStyle = 'rgba(1, 4, 9, 0.03)';
      ctx.fillRect(0, 0, 600, 400);
      const t = Date.now() / 1000;
      for (let i = 0; i < 500; i++) {
        const angle = i * 0.1 + t;
        const r = i * 0.5;
        const x = 300 + r * Math.cos(angle);
        const y = 200 + r * Math.sin(angle);
        const hue = (i * 2 + t * 50) % 360;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + hue + ', 80%, 60%, 0.8)';
        ctx.fill();
      }
      animId = requestAnimationFrame(drawSpiral);
    }

    function drawWave() {
      ctx.fillStyle = 'rgba(1, 4, 9, 0.05)';
      ctx.fillRect(0, 0, 600, 400);
      const t = Date.now() / 1000;
      for (let layer = 0; layer < 5; layer++) {
        ctx.beginPath();
        for (let x = 0; x <= 600; x += 2) {
          const y = 200 + Math.sin(x * 0.02 + t + layer * 0.8) * (40 + layer * 15)
                        + Math.cos(x * 0.01 + t * 0.7) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const hue = 220 + layer * 25;
        ctx.strokeStyle = 'hsla(' + hue + ', 80%, 60%, ' + (0.6 - layer * 0.1) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      animId = requestAnimationFrame(drawWave);
    }

    function drawFractal() {
      ctx.fillStyle = 'rgba(1, 4, 9, 0.04)';
      ctx.fillRect(0, 0, 600, 400);
      const t = Date.now() / 2000;
      function branch(x, y, len, angle, depth) {
        if (depth <= 0 || len < 2) return;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        const hue = 120 + depth * 30 + t * 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'hsla(' + hue + ', 70%, 50%, ' + (depth / 10) + ')';
        ctx.lineWidth = depth * 0.8;
        ctx.stroke();
        const spread = 0.4 + Math.sin(t) * 0.15;
        branch(x2, y2, len * 0.72, angle - spread, depth - 1);
        branch(x2, y2, len * 0.72, angle + spread, depth - 1);
      }
      branch(300, 380, 90, -Math.PI / 2, 10);
      animId = requestAnimationFrame(drawFractal);
    }

    function setMode(m) {
      mode = m;
      if (animId) cancelAnimationFrame(animId);
      particles.length = 0;
      ctx.clearRect(0, 0, 600, 400);
      document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      startMode();
    }

    function startMode() {
      if (mode === 'particles') drawParticles();
      else if (mode === 'spiral') drawSpiral();
      else if (mode === 'wave') drawWave();
      else if (mode === 'fractal') drawFractal();
    }

    function clearCanvas() {
      if (animId) cancelAnimationFrame(animId);
      particles.length = 0;
      ctx.clearRect(0, 0, 600, 400);
    }

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y));
      }
    });

    startMode();
  </script>
</body>
</html>`
  },
  {
    id: 'todo-app',
    name: 'TODO App',
    icon: '✅',
    mode: 'html',
    code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>TODO App</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #0d1117;
    color: #c9d1d9;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 40px 16px;
  }
  .app {
    width: 100%;
    max-width: 480px;
  }
  h1 {
    font-size: 1.8rem;
    text-align: center;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .input-row input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #30363d;
    border-radius: 8px;
    background: #161b22;
    color: #e6edf3;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .input-row input:focus {
    border-color: #667eea;
  }
  .input-row button {
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }
  .filters {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }
  .filters button {
    padding: 6px 14px;
    border: 1px solid #30363d;
    border-radius: 6px;
    background: transparent;
    color: #8b949e;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  .filters button.active {
    background: linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2));
    border-color: #667eea;
    color: #d7d9fc;
  }
  .stats {
    font-size: 12px;
    color: #8b949e;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
  }
  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .todo-item:hover {
    border-color: #30363d;
  }
  .todo-item.done {
    opacity: 0.5;
  }
  .todo-item.done .todo-text {
    text-decoration: line-through;
  }
  .check-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid #30363d;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    color: transparent;
    font-size: 12px;
  }
  .todo-item.done .check-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: transparent;
    color: #fff;
  }
  .todo-text {
    flex: 1;
    font-size: 14px;
  }
  .delete-btn {
    background: transparent;
    border: none;
    color: #484f58;
    cursor: pointer;
    font-size: 18px;
    padding: 0 4px;
    transition: color 0.2s;
  }
  .delete-btn:hover {
    color: #f85149;
  }
  .empty {
    text-align: center;
    padding: 40px;
    color: #484f58;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="app">
    <h1>TODO App</h1>
    <div class="input-row">
      <input id="inp" type="text" placeholder="添加新任务..." />
      <button onclick="addTodo()">添加</button>
    </div>
    <div class="filters">
      <button class="active" onclick="setFilter('all', this)">全部</button>
      <button onclick="setFilter('active', this)">进行中</button>
      <button onclick="setFilter('done', this)">已完成</button>
    </div>
    <div class="stats">
      <span id="statsText">0 个任务</span>
      <span id="doneText">已完成 0 个</span>
    </div>
    <div class="todo-list" id="list"></div>
  </div>
  <script>
    let todos = [
      { id: 1, text: '学习 JavaScript 基础', done: true },
      { id: 2, text: '练习 React Hooks', done: false },
      { id: 3, text: '构建在线代码编辑器', done: false },
      { id: 4, text: '学习 TypeScript 类型系统', done: false },
    ];
    let filter = 'all';
    let nextId = 5;

    function addTodo() {
      const inp = document.getElementById('inp');
      const text = inp.value.trim();
      if (!text) return;
      todos.push({ id: nextId++, text, done: false });
      inp.value = '';
      render();
    }

    function toggleTodo(id) {
      const t = todos.find(t => t.id === id);
      if (t) t.done = !t.done;
      render();
    }

    function deleteTodo(id) {
      todos = todos.filter(t => t.id !== id);
      render();
    }

    function setFilter(f, btn) {
      filter = f;
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    }

    function render() {
      const list = document.getElementById('list');
      const filtered = todos.filter(t => {
        if (filter === 'active') return !t.done;
        if (filter === 'done') return t.done;
        return true;
      });
      const doneCount = todos.filter(t => t.done).length;

      document.getElementById('statsText').textContent = todos.length + ' 个任务';
      document.getElementById('doneText').textContent = '已完成 ' + doneCount + ' 个';

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty">没有任务</div>';
        return;
      }

      list.innerHTML = filtered.map(t => 
        '<div class="todo-item ' + (t.done ? 'done' : '') + '">' +
          '<button class="check-btn" onclick="toggleTodo(' + t.id + ')">' + (t.done ? '✓' : '') + '</button>' +
          '<span class="todo-text">' + escapeHtml(t.text) + '</span>' +
          '<button class="delete-btn" onclick="deleteTodo(' + t.id + ')">×</button>' +
        '</div>'
      ).join('');
    }

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    document.getElementById('inp').addEventListener('keydown', e => {
      if (e.key === 'Enter') addTodo();
    });

    render();
  </script>
</body>
</html>`
  },
  {
    id: 'js-basic',
    name: 'JS基础',
    icon: '🟨',
    mode: 'javascript',
    code: `// JavaScript 基础示例
// 体验 Function 构造器安全执行

// 1. 变量与数据类型
const name = "WebLinuxOS";
const version = 3.0;
const features = ["在线IDE", "代码分享", "实时预览"];
const info = { name, version, features };

console.log("项目信息:", JSON.stringify(info, null, 2));

// 2. 数组操作
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("\\n原始数组:", numbers);
console.log("求和:", numbers.reduce((a, b) => a + b, 0));
console.log("偶数:", numbers.filter(n => n % 2 === 0));
console.log("平方:", numbers.map(n => n ** 2));

// 3. 异步操作
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("\\n⏳ 开始异步任务...");
  for (let i = 1; i <= 3; i++) {
    await delay(100);
    console.log("  步骤 " + i + " 完成");
  }
  console.log("✅ 异步任务全部完成!");
}

main();

// 4. 类与继承
class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }
  speak() {
    return this.name + " says " + this.sound;
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name, "Woof!");
  }
  fetch(item) {
    return this.name + " fetches " + item;
  }
}

const dog = new Dog("Rex");
console.log("\\n" + dog.speak());
console.log(dog.fetch("the ball"));`
  }
]

// ==================== JS 沙盒执行 ====================
function stringifyValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  if (v instanceof Error) return `${v.name}: ${v.message}`
  try {
    return JSON.stringify(v, (_k, val) => {
      if (typeof val === 'bigint') return val.toString() + 'n'
      if (typeof val === 'function') return '[Function]'
      if (typeof val === 'symbol') return val.toString()
      return val
    }, 2)
  } catch {
    return String(v)
  }
}

async function executeJavaScript(code: string): Promise<{ logs: OutputLine[]; duration: number }> {
  const logs: OutputLine[] = []
  const now = Date.now()
  const push = (type: OutputLine['type'], content: string) => {
    logs.push({ type, content, time: Date.now() - now })
  }

  const customConsole = {
    log: (...args: unknown[]) => push('stdout', args.map(stringifyValue).join(' ')),
    info: (...args: unknown[]) => push('info', args.map(stringifyValue).join(' ')),
    warn: (...args: unknown[]) => push('stderr', args.map(stringifyValue).join(' ')),
    error: (...args: unknown[]) => push('error', args.map(stringifyValue).join(' ')),
    debug: (...args: unknown[]) => push('stdout', args.map(stringifyValue).join(' ')),
    clear: () => { logs.length = 0 }
  }

  const start = performance.now()
  try {
    const fn = new Function('console', `"use strict"; return (async () => { ${code} })();`)
    const result = await fn(customConsole)
    if (result !== undefined) {
      push('stdout', '=> ' + stringifyValue(result))
    }
  } catch (err) {
    push('error', err instanceof Error ? err.message : String(err))
  }
  return { logs, duration: performance.now() - start }
}

// ==================== TypeScript 类型擦除 ====================
function stripTypeScript(src: string): string {
  let out = src
  out = out.replace(/^\s*interface\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}/gm, '')
  out = out.replace(/^\s*type\s+[A-Za-z_$][\w$]*\s*=[^;]+;/gm, '')
  out = out.replace(/^\s*declare\s+.*$/gm, '')
  out = out.replace(/^\s*(export\s+)?\s*enum\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}/gm, '')
  out = out.replace(/:\s*([A-Za-z_$][\w$<>.,\[\]|&\s]*|\{[\s\S]*?\})/g, '')
  out = out.replace(/<[A-Za-z_$][\w$<>.,\s]*>/g, '')
  out = out.replace(/\s+as\s+[A-Za-z_$][\w$<>.,\[\]|&\s]*/g, '')
  out = out.replace(/(\w)!/g, '$1')
  out = out.replace(/implements\s+[A-Za-z_$][\w$,\s]*/g, '')
  out = out.replace(/^\s*(public|private|protected|readonly)\s+/gm, ' ')
  return out
}

// ==================== URL Hash 分享 ====================
function encodeShareCode(code: string, mode: Mode): string {
  try {
    const payload = JSON.stringify({ c: code, m: mode })
    return btoa(unescape(encodeURIComponent(payload)))
  } catch {
    return ''
  }
}

function decodeShareCode(hash: string): { code: string; mode: Mode } | null {
  try {
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    const json = decodeURIComponent(escape(atob(raw)))
    const obj = JSON.parse(json)
    if (obj.c && obj.m) return { code: obj.c, mode: obj.m }
    return null
  } catch {
    return null
  }
}

// ==================== 主组件 ====================
const OnlineCodeRunnerPro = memo(function OnlineCodeRunnerPro() {
  const [mode, setMode] = useState<Mode>('javascript')
  const [code, setCode] = useState(TEMPLATES[3].code)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>('output')
  const [htmlSrc, setHtmlSrc] = useState('')
  const [, setShareUrl] = useState('')
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState('js-basic')
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)

  const outputRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)

  // 从 URL hash 恢复代码
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.length > 1) {
      const decoded = decodeShareCode(hash)
      if (decoded) {
        setMode(decoded.mode)
        setCode(decoded.code)
        setActiveTemplate('')
        if (decoded.mode === 'html') {
          setHtmlSrc(decoded.code)
          setRightTab('preview')
        }
      }
    }
  }, [])

  // 自动滚动输出到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // 同步行号滚动
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  // 运行代码
  const runCode = useCallback(async () => {
    if (!code.trim()) return
    setIsRunning(true)
    setOutput([])

    try {
      if (mode === 'html') {
        setHtmlSrc(code)
        setRightTab('preview')
        setOutput([{ type: 'info', content: 'HTML 预览已更新', time: 0 }])
        setIsRunning(false)
        return
      }

      // JavaScript / TypeScript
      const jsCode = mode === 'javascript' ? code : stripTypeScript(code)
      if (mode !== 'javascript') {
        setOutput([{ type: 'info', content: 'ℹ TypeScript 代码已做基础类型擦除，按 JavaScript 执行', time: 0 }])
      }
      const result = await executeJavaScript(jsCode)
      setOutput(prev => [
        ...prev,
        { type: 'info', content: `▶ 执行${mode === 'javascript' ? 'JavaScript' : 'TypeScript'} (${result.duration.toFixed(1)}ms)`, time: 0 },
        ...result.logs,
        { type: 'info', content: `✅ 完成 (${result.duration.toFixed(1)}ms)`, time: result.duration }
      ])
      setRightTab('output')
    } catch (err) {
      setOutput([{ type: 'error', content: `执行失败: ${err instanceof Error ? err.message : String(err)}`, time: 0 }])
    }
    setIsRunning(false)
  }, [code, mode])

  // 分享代码
  const shareCode = useCallback(() => {
    const encoded = encodeShareCode(code, mode)
    if (!encoded) return
    const url = window.location.origin + window.location.pathname + '#' + encoded
    setShareUrl(url)
    window.history.replaceState(null, '', '#' + encoded)
    navigator.clipboard.writeText(url).then(() => {
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    }).catch(() => {
      // 剪贴板写入失败，仅显示链接
    })
  }, [code, mode])

  // 加载模板
  const loadTemplate = useCallback((tpl: CodeTemplate) => {
    setMode(tpl.mode)
    setCode(tpl.code)
    setActiveTemplate(tpl.id)
    setShowTemplatePanel(false)
    setOutput([])
    if (tpl.mode === 'html') {
      setHtmlSrc(tpl.code)
      setRightTab('preview')
    } else {
      setRightTab('output')
    }
  }, [])

  // 切换模式
  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setOutput([])
    setActiveTemplate('')
    if (m === 'html') {
      setRightTab('preview')
    } else {
      setRightTab('output')
    }
  }, [])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runCode()
    }
  }, [code, runCode])

  // 行号计算
  const lines = code.split('\n')
  const lineCount = lines.length

  // 输出行颜色
  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'error': return '#f85149'
      case 'stderr': return '#ff7b72'
      case 'info': return '#79c0ff'
      default: return '#e6edf3'
    }
  }

  // ==================== 样式常量 ====================
  const COLORS = {
    bg: '#0d1117',
    bgSecondary: '#161b22',
    border: '#30363d',
    borderLight: '#21262d',
    text: '#e6edf3',
    textMuted: '#8b949e',
    textDim: '#484f58',
    accent: '#667eea',
    accent2: '#764ba2',
    green: '#3fb950',
    red: '#f85149',
  }

  const monoFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ========== 顶部标题栏 ========== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        height: 40,
        background: COLORS.bgSecondary,
        borderBottom: `1px solid ${COLORS.border}`,
        gap: 8,
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingRight: 12,
          borderRight: `1px solid ${COLORS.border}`,
          marginRight: 4
        }}>
          <div style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#fff',
            fontWeight: 700
          }}>▶</div>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: 0.3
          }}>CodeRunner Pro</span>
        </div>

        {/* 模式标签 */}
        {(['javascript', 'html'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              background: mode === m
                ? `linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))`
                : 'transparent',
              color: mode === m ? '#d7d9fc' : COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: mode === m ? 600 : 400,
              transition: 'all 0.15s'
            }}
          >
            {m === 'javascript' ? '🟨 JS/TS' : '🌐 HTML/CSS/JS'}
          </button>
        ))}

        {/* 模板按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowTemplatePanel(!showTemplatePanel)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: showTemplatePanel ? COLORS.accent : COLORS.border,
              background: showTemplatePanel ? `rgba(102,126,234,0.1)` : 'transparent',
              color: showTemplatePanel ? '#d7d9fc' : COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.15s'
            }}
          >
            📁 示例模板
          </button>
          {showTemplatePanel && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: COLORS.bgSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: 6,
              zIndex: 100,
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: 6,
                    background: activeTemplate === tpl.id
                      ? `linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))`
                      : 'transparent',
                    color: activeTemplate === tpl.id ? '#d7d9fc' : COLORS.text,
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (activeTemplate !== tpl.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (activeTemplate !== tpl.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{tpl.icon}</span>
                  <span>{tpl.name}</span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: COLORS.border,
                    color: COLORS.textMuted
                  }}>{tpl.mode.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* 分享按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={shareCode}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: `1px solid ${COLORS.border}`,
              background: 'transparent',
              color: COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.15s'
            }}
          >
            🔗 分享
          </button>
          {showShareTooltip && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              padding: '6px 12px',
              background: COLORS.green,
              color: '#fff',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              ✅ 分享链接已复制到剪贴板
            </div>
          )}
        </div>

        {/* 运行按钮 */}
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            padding: '5px 16px',
            borderRadius: 6,
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: '#fff',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 700,
            opacity: isRunning ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(118,75,162,0.3)'
          }}
        >
          {isRunning ? '⏳ 执行中...' : '▶ 运行'}
        </button>
      </div>

      {/* ========== 主内容区 ========== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* ---- 左侧：代码编辑器 ---- */}
        <div style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${COLORS.border}`,
          minWidth: 0
        }}>
          {/* 编辑器标题栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: COLORS.bgSecondary,
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700
              }}>
                {mode === 'javascript' ? 'JS' : 'HTML'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.text }}>
                {mode === 'javascript' ? 'JavaScript / TypeScript' : 'HTML / CSS / JS'}
              </span>
            </div>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
              {lineCount} 行 · {code.length} 字符
            </span>
          </div>

          {/* 代码编辑区域（带行号） */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* 行号 */}
            <div
              ref={lineNumRef}
              style={{
                width: 44,
                flexShrink: 0,
                background: COLORS.bgSecondary,
                borderRight: `1px solid ${COLORS.border}`,
                padding: '14px 0',
                overflow: 'hidden',
                userSelect: 'none',
                textAlign: 'right',
                fontFamily: monoFont,
                fontSize: 13,
                lineHeight: 1.6,
                color: COLORS.textDim
              }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} style={{ paddingRight: 12, height: 20.8 }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* 代码输入 */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder={mode === 'javascript' ? '在此输入 JavaScript / TypeScript 代码...' : '在此输入 HTML 代码...'}
              style={{
                flex: 1,
                padding: '14px 14px 14px 12px',
                background: COLORS.bg,
                color: COLORS.text,
                border: 'none',
                resize: 'none',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: monoFont,
                outline: 'none',
                whiteSpace: 'pre',
                overflow: 'auto',
                tabSize: 2,
                caretColor: COLORS.accent
              }}
            />
          </div>

          {/* 快捷键提示 */}
          <div style={{
            padding: '4px 12px',
            background: COLORS.bgSecondary,
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: COLORS.textDim,
            flexShrink: 0
          }}>
            <span>Ctrl+Enter 运行</span>
            <span>Tab 缩进</span>
          </div>
        </div>

        {/* ---- 右侧：预览 / 输出 ---- */}
        <div style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: COLORS.bg
        }}>
          {/* 右侧标签栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: 34,
            background: COLORS.bgSecondary,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 4,
            flexShrink: 0
          }}>
            <button
              onClick={() => setRightTab('output')}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                background: rightTab === 'output' ? `rgba(102,126,234,0.15)` : 'transparent',
                color: rightTab === 'output' ? '#d7d9fc' : COLORS.textMuted,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: rightTab === 'output' ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              📋 输出
            </button>
            <button
              onClick={() => setRightTab('preview')}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                background: rightTab === 'preview' ? `rgba(102,126,234,0.15)` : 'transparent',
                color: rightTab === 'preview' ? '#d7d9fc' : COLORS.textMuted,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: rightTab === 'preview' ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              👁 预览
            </button>
            <div style={{ flex: 1 }} />
            {rightTab === 'output' && output.length > 0 && (
              <button
                onClick={() => setOutput([])}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: `1px solid ${COLORS.border}`,
                  background: 'transparent',
                  color: COLORS.textMuted,
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                清空
              </button>
            )}
          </div>

          {/* 右侧内容 */}
          {rightTab === 'preview' ? (
            <iframe
              srcDoc={htmlSrc || code}
              title="HTML 预览"
              sandbox="allow-scripts allow-forms allow-modals"
              style={{
                flex: 1,
                border: 'none',
                background: '#fff',
                width: '100%',
                height: '100%'
              }}
            />
          ) : (
            <div
              ref={outputRef}
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 12,
                fontFamily: monoFont,
                fontSize: 12.5,
                lineHeight: 1.6
              }}
            >
              {output.length === 0 ? (
                <div style={{
                  color: COLORS.textDim,
                  textAlign: 'center',
                  padding: '48px 12px',
                  fontSize: 13
                }}>
                  <div style={{
                    fontSize: 36,
                    marginBottom: 12,
                    opacity: 0.5
                  }}>▷</div>
                  <div>点击 <b style={{ color: '#d7d9fc' }}>▶ 运行</b> 或按 <b style={{ color: '#d7d9fc' }}>Ctrl+Enter</b> 执行代码</div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {mode === 'javascript'
                      ? '支持 console.log / async/await / class 等语法'
                      : 'HTML 模式下运行将自动切换到预览'}
                  </div>
                </div>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '2px 0',
                      color: getLineColor(line.type),
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {line.type === 'info' && (
                      <span style={{ color: COLORS.textDim, marginRight: 8, fontSize: 11 }}>
                        ℹ
                      </span>
                    )}
                    {line.type === 'error' && (
                      <span style={{ color: COLORS.red, marginRight: 8, fontSize: 11 }}>
                        ✘
                      </span>
                    )}
                    {line.content}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========== 底部状态栏 ========== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        height: 26,
        background: COLORS.bgSecondary,
        borderTop: `1px solid ${COLORS.border}`,
        fontSize: 11,
        color: COLORS.textMuted,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isRunning ? '#d29922' : COLORS.green,
              display: 'inline-block'
            }} />
            {isRunning ? '运行中' : '就绪'}
          </span>
          <span>|</span>
          <span>模式: <span style={{ color: '#d7d9fc' }}>{mode === 'javascript' ? 'JS/TS' : 'HTML'}</span></span>
          <span>|</span>
          <span>行: {lineCount}</span>
          <span>|</span>
          <span>字符: {code.length}</span>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          letterSpacing: 0.3
        }}>
          CodeRunner Pro
        </div>
      </div>

      {/* 点击外部关闭模板面板 */}
      {showTemplatePanel && (
        <div
          onClick={() => setShowTemplatePanel(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99
          }}
        />
      )}
    </div>
  )
})

export default OnlineCodeRunnerPro
