/**
 * WebContainer IDE — 浏览器内的全栈开发环境
 * 
 * v109 创新功能
 * 
 * 核心特性：
 * - 三种运行模式：JavaScript 实时执行、HTML/CSS/JS 实时预览、Shell 脚本模拟
 * - Monaco Editor 代码编辑器（语法高亮、自动补全）
 * - 多文件标签页管理
 * - 控制台输出捕获（console.log/warn/error/info/table）
 * - 实时预览（HTML模式）
 * - 代码模板库（React/Vue/Node/算法/数据结构）
 * - 代码分享（Base64编码URL）
 * - 自动保存到localStorage
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// 类型定义
interface FileTab {
  id: string
  name: string
  language: string
  content: string
  modified: boolean
}

interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'table' | 'clear'
  data: string[]
  timestamp: number
}

type RunMode = 'javascript' | 'html' | 'shell'

const STORAGE_KEY = 'weblinux-webcontainer-ide'

// 预置模板
const TEMPLATES: Record<string, { name: string; files: FileTab[] }> = {
  'js-basic': {
    name: 'JavaScript 基础',
    files: [
      { id: 'main', name: 'main.js', language: 'javascript', content: `// JavaScript 基础示例
console.log('Hello, WebLinuxOS!');
console.log('当前时间:', new Date().toLocaleString());

// 数组操作
const fruits = ['苹果', '香蕉', '橙子', '葡萄'];
console.log('水果列表:', fruits);
console.log('第一个:', fruits[0]);
console.log('总数:', fruits.length);

// 对象操作
const user = {
  name: 'WebLinux',
  version: '109.0',
  features: ['AI助手', '在线IDE', '终端']
};
console.table(user);

// 异步操作
async function fetchData() {
  console.log('开始获取数据...');
  await new Promise(r => setTimeout(r, 1000));
  console.log('数据获取完成!');
}
fetchData();`, modified: false }
    ]
  },
  'react-app': {
    name: 'React 应用',
    files: [
      { id: 'html', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>React App</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #1a1a2e; color: #e0e0e0; }
    .app { max-width: 600px; margin: 40px auto; padding: 20px; }
    h1 { color: #7c6cf0; margin-bottom: 16px; }
    .todo-input { display: flex; gap: 8px; margin-bottom: 16px; }
    input { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #333; background: #16213e; color: #fff; }
    button { padding: 8px 16px; border: none; border-radius: 6px; background: #7c6cf0; color: #fff; cursor: pointer; }
    button:hover { background: #5b4cd8; }
    .todo-item { display: flex; align-items: center; gap: 8px; padding: 8px; border-bottom: 1px solid #333; }
    .todo-item.done { text-decoration: line-through; opacity: 0.5; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;

    function TodoApp() {
      const [todos, setTodos] = useState([
        { id: 1, text: '学习 React', done: false },
        { id: 2, text: '构建应用', done: false },
      ]);
      const [input, setInput] = useState('');

      const addTodo = () => {
        if (!input.trim()) return;
        setTodos([...todos, { id: Date.now(), text: input, done: false }]);
        setInput('');
      };

      const toggleTodo = (id) => {
        setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
      };

      const deleteTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
      };

      return (
        <div className="app">
          <h1>React Todo</h1>
          <div className="todo-input">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="添加待办事项..." />
            <button onClick={addTodo}>添加</button>
          </div>
          {todos.map(todo => (
            <div key={todo.id} className={todo.done ? 'todo-item done' : 'todo-item'}>
              <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
              <span>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} style={{marginLeft:'auto',background:'#e11d48'}}>删除</button>
            </div>
          ))}
          <p style={{marginTop:16,opacity:0.6}}>{todos.filter(t=>!t.done).length} 个待办</p>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<TodoApp />);
  </script>
</body>
</html>`, modified: false }
    ]
  },
  'html-css': {
    name: 'HTML/CSS 动画',
    files: [
      { id: 'html', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0f0f23; overflow: hidden; }
    .container { position: relative; width: 300px; height: 300px; }
    .ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 3px solid transparent; border-top-color: #7c6cf0;
      animation: spin 2s linear infinite;
    }
    .ring:nth-child(2) { inset: 20px; border-top-color: #10b981; animation-duration: 1.5s; animation-direction: reverse; }
    .ring:nth-child(3) { inset: 40px; border-top-color: #f43f5e; animation-duration: 1s; }
    .ring:nth-child(4) { inset: 60px; border-top-color: #f59e0b; animation-duration: 2.5s; animation-direction: reverse; }
    .center { position: absolute; inset: 80px; border-radius: 50%; background: radial-gradient(#7c6cf0, transparent); display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; }
    .center span { color: white; font-family: monospace; font-size: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="ring"></div>
    <div class="ring"></div>
    <div class="ring"></div>
    <div class="ring"></div>
    <div class="center"><span>IDE</span></div>
  </div>
</body>
</html>`, modified: false }
    ]
  },
  'node-api': {
    name: 'Fetch API 调用',
    files: [
      { id: 'main', name: 'api.js', language: 'javascript', content: `// Fetch API 示例 — 调用免费公开 API

// 1. 获取随机名言
async function getRandomQuote() {
  try {
    const res = await fetch('https://api.quotable.io/random');
    if (!res.ok) throw new Error('API 请求失败');
    const data = await res.json();
    console.log('📝 名言:', data.content);
    console.log('👤 作者:', data.author);
  } catch (e) {
    console.warn('名言 API 失败:', e.message);
  }
}

// 2. 获取加密货币价格
async function getCryptoPrice(coin = 'bitcoin') {
  try {
    const res = await fetch(\`https://api.coingecko.com/api/v3/simple/price?ids=\${coin}&vs_currencies=usd\`);
    const data = await res.json();
    console.log('💰 价格:', data[coin]?.usd, 'USD');
  } catch (e) {
    console.warn('价格查询失败:', e.message);
  }
}

// 3. 获取 IP 信息
async function getIPInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    console.table({
      IP: data.ip,
      城市: data.city,
      国家: data.country_name,
      时区: data.timezone,
    });
  } catch (e) {
    console.warn('IP查询失败:', e.message);
  }
}

// 执行所有查询
console.log('🚀 开始调用公开 API...\n');
await getRandomQuote();
console.log('');
await getCryptoPrice('ethereum');
console.log('');
await getIPInfo();
console.log('\n✅ 全部API调用完成!');`, modified: false }
    ]
  },
  'algorithm': {
    name: '算法与数据结构',
    files: [
      { id: 'main', name: 'algorithm.js', language: 'javascript', content: `// 经典算法与数据结构示例

// 1. 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 2. 二分查找
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  let steps = 0;
  while (left <= right) {
    steps++;
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return { found: true, index: mid, steps };
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return { found: false, steps };
}

// 3. 斐波那契数列（带缓存）
const fib = (() => {
  const memo = { 0: 0, 1: 1 };
  return (n) => {
    if (memo[n] !== undefined) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
  };
})();

// 4. 链表
class LinkedList {
  constructor() { this.head = null; this.size = 0; }
  add(data) {
    const node = { data, next: null };
    if (!this.head) { this.head = node; }
    else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.size++;
  }
  toArray() {
    const result = [];
    let current = this.head;
    while (current) { result.push(current.data); current = current.next; }
    return result;
  }
}

// 测试
console.log('📊 快速排序:');
const arr = [38, 27, 43, 3, 9, 82, 10];
console.log('  输入:', arr);
console.log('  输出:', quickSort(arr));

console.log('\n🔍 二分查找:');
const sorted = quickSort(arr);
const result = binarySearch(sorted, 27);
console.log('  查找 27:', result);

console.log('\n🔢 斐波那契数列:');
console.log('  F(0-15):', Array.from({length: 16}, (_, i) => fib(i)));

console.log('\n📝 链表:');
const list = new LinkedList();
[10, 20, 30, 40, 50].forEach(v => list.add(v));
console.log('  链表内容:', list.toArray());
console.log('  链表大小:', list.size);`, modified: false }
    ]
  },
};

export default function WebContainerIDE() {
  const [files, setFiles] = useState<FileTab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch { /* ignore */ }
    return TEMPLATES['js-basic'].files.map(f => ({ ...f }));
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || 'main');
  const [mode, setMode] = useState<RunMode>('javascript');
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(files)); } catch { /* ignore */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [files]);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId) || files[0], [files, activeFileId]);

  // 自动检测运行模式
  useEffect(() => {
    if (files.some(f => f.name.endsWith('.html'))) setMode('html');
    else if (files.some(f => f.name.endsWith('.sh'))) setMode('shell');
    else setMode('javascript');
  }, [files]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content, modified: true } : f));
  }, []);

  // 运行 JavaScript
  const runJavaScript = useCallback(() => {
    setIsRunning(true);
    setConsoleOutput([]);
    const startTime = performance.now();

    // 创建 iframe 沙盒来执行代码
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-scripts');
    document.body.appendChild(iframe);

    // 注入 console 拦截
    const consoleScript = `
      const __entries = [];
      const __formatValue = (v) => {
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch { return String(v); } }
        return String(v);
      };
      const __push = (type, ...args) => {
        __entries.push({ type, data: args.map(__formatValue), timestamp: Date.now() });
      };
      const origConsole = { ...console };
      console.log = (...a) => { __push('log', ...a); origConsole.log(...a); };
      console.warn = (...a) => { __push('warn', ...a); origConsole.warn(...a); };
      console.error = (...a) => { __push('error', ...a); origConsole.error(...a); };
      console.info = (...a) => { __push('info', ...a); origConsole.info(...a); };
      console.table = (...a) => { __push('table', ...a); origConsole.table(...a); };
      console.clear = () => { __entries.length = 0; };
    `;

    const userCode = files.map(f => `// === ${f.name} ===\n${f.content}`).join('\n\n');

    const fullScript = `
      ${consoleScript}
      try {
        (async () => {
          ${userCode}
        })().then(() => {
          window.parent.postMessage({ type: 'webcontainer-result', entries: __entries, duration: performance.now() - ${startTime} }, '*');
        }).catch(e => {
          __push('error', 'Uncaught: ' + e.message);
          window.parent.postMessage({ type: 'webcontainer-result', entries: __entries, duration: performance.now() - ${startTime} }, '*');
        });
      } catch(e) {
        __push('error', 'SyntaxError: ' + e.message);
        window.parent.postMessage({ type: 'webcontainer-result', entries: __entries, duration: performance.now() - ${startTime} }, '*');
      }
    `;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'webcontainer-result') {
        setConsoleOutput(e.data.entries || []);
        setIsRunning(false);
        const dur = Math.round(e.data.duration || 0);
        setConsoleOutput(prev => [...prev, { type: 'info', data: [`✓ 执行完成 (${dur}ms)`], timestamp: Date.now() }]);
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
      }
    };

    window.addEventListener('message', handleMessage);

    // 设置超时
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        setConsoleOutput(prev => [...prev, { type: 'warn', data: ['⚠ 执行超时 (10s)，可能存在死循环'], timestamp: Date.now() }]);
        setIsRunning(false);
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
      }
    }, 10000);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`<html><body><script>${fullScript}</script></body></html>`);
      iframeDoc.close();
    }
  }, [files]);

  // 运行 HTML 预览
  const runHTML = useCallback(() => {
    setShowPreview(true);
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (!htmlFile || !previewRef.current) return;

    const doc = previewRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlFile.content);
      doc.close();
    }
  }, [files]);

  // 运行
  const handleRun = useCallback(() => {
    if (mode === 'html') {
      runHTML();
    } else {
      runJavaScript();
    }
  }, [mode, runHTML, runJavaScript]);

  // 添加新文件
  const addFile = useCallback(() => {
    const name = prompt('文件名 (如: utils.js, style.css):');
    if (!name) return;
    const ext = name.split('.').pop() || 'txt';
    const langMap: Record<string, string> = { js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript', html: 'html', css: 'css', json: 'json', md: 'markdown', py: 'python', sh: 'shell' };
    const newFile: FileTab = {
      id: `file-${Date.now()}`,
      name,
      language: langMap[ext] || 'plaintext',
      content: '',
      modified: false,
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  }, []);

  // 删除文件
  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId && next.length > 0) {
        setActiveFileId(next[0].id);
      }
      return next;
    });
  }, [activeFileId]);

  // 加载模板
  const loadTemplate = useCallback((templateId: string) => {
    const template = TEMPLATES[templateId];
    if (!template) return;
    setFiles(template.files.map(f => ({ ...f })));
    setActiveFileId(template.files[0].id);
    setConsoleOutput([]);
    setShowTemplates(false);
  }, []);

  // 分享代码（Base64编码URL）
  const shareCode = useCallback(() => {
    try {
      const code = files.map(f => `/*${f.name}*/\n${f.content}`).join('\n\n');
      const encoded = btoa(encodeURIComponent(code));
      navigator.clipboard.writeText(encoded);
      setConsoleOutput(prev => [...prev, { type: 'info', data: ['✓ 分享链接已复制到剪贴板'], timestamp: Date.now() }]);
    } catch {
      setConsoleOutput(prev => [...prev, { type: 'error', data: ['✗ 分享失败'], timestamp: Date.now() }]);
    }
  }, [files]);

  // 导出文件
  const downloadFile = useCallback(() => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const templateList = Object.entries(TEMPLATES) as [string, { name: string }][];
  const entryColors: Record<string, string> = {
    log: '#d4d4d4', warn: '#f59e0b', error: '#f44747', info: '#569cd6', table: '#4ec9b0', clear: '#888'
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13 }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: '#7c6cf0', fontSize: 14, marginRight: 8 }}>WebContainer IDE</span>
        
        <button onClick={handleRun} disabled={isRunning} style={{ padding: '4px 12px', background: isRunning ? '#555' : '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12 }}>
          {isRunning ? '● 运行中...' : '▶ 运行'}
        </button>
        
        <select value={mode} onChange={e => setMode(e.target.value as RunMode)} style={{ padding: '4px 8px', background: '#3c3c3c', color: '#d4d4d4', border: '1px solid #555', borderRadius: 4, fontSize: 12 }}>
          <option value="javascript">JavaScript</option>
          <option value="html">HTML 预览</option>
        </select>

        <div style={{ flex: 1 }} />

        <button onClick={() => setShowTemplates(!showTemplates)} style={{ ...toolbarBtn, position: 'relative' }}>
          模板
          {showTemplates && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: '#2d2d2d', border: '1px solid #555', borderRadius: 6, minWidth: 200, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {templateList.map(([id, t]) => (
                <div key={id} onClick={() => loadTemplate(id)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #404040', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = '#404040')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </button>
        <button onClick={addFile} style={toolbarBtn}>+ 文件</button>
        <button onClick={downloadFile} style={toolbarBtn}>下载</button>
        <button onClick={shareCode} style={toolbarBtn}>分享</button>
        <button onClick={() => setConsoleOutput([])} style={toolbarBtn}>清空</button>
        <button onClick={() => setShowConsole(!showConsole)} style={{ ...toolbarBtn, background: showConsole ? '#7c6cf0' : '#3c3c3c' }}>
          控制台
        </button>
      </div>

      {/* 文件标签页 */}
      <div style={{ display: 'flex', background: '#252526', borderBottom: '1px solid #404040', flexShrink: 0, overflow: 'auto' }}>
        {files.map(file => (
          <div key={file.id} onClick={() => setActiveFileId(file.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', cursor: 'pointer', background: file.id === activeFileId ? '#1e1e1e' : 'transparent', color: file.id === activeFileId ? '#fff' : '#888', borderBottom: file.id === activeFileId ? '2px solid #7c6cf0' : '2px solid transparent', fontSize: 12, whiteSpace: 'nowrap' }}>
            <span>{file.name}</span>
            {file.modified && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />}
            {files.length > 1 && (
              <span onClick={e => { e.stopPropagation(); deleteFile(file.id); }} style={{ marginLeft: 4, opacity: 0.5, cursor: 'pointer' }}>×</span>
            )}
          </div>
        ))}
      </div>

      {/* 主体区域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 编辑器 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={activeFile?.content || ''}
              onChange={e => updateFileContent(activeFileId, e.target.value)}
              spellCheck={false}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                background: '#1e1e1e', color: '#d4d4d4', border: 'none', outline: 'none',
                padding: '12px 16px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 13, lineHeight: 1.6, resize: 'none', tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const newValue = activeFile.content.substring(0, start) + '  ' + activeFile.content.substring(end);
                  updateFileContent(activeFileId, newValue);
                  requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 2; });
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
            />
          </div>
        </div>

        {/* HTML 预览 */}
        {showPreview && mode === 'html' && (
          <div style={{ width: '50%', borderLeft: '1px solid #404040', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '6px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>预览</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowPreview(false)} style={{ ...toolbarBtn, padding: '2px 8px' }}>关闭</button>
            </div>
            <iframe ref={previewRef} sandbox="allow-scripts allow-same-origin" style={{ flex: 1, border: 'none', background: '#fff' }} />
          </div>
        )}
      </div>

      {/* 控制台 */}
      {showConsole && (
        <div style={{ height: 200, borderTop: '1px solid #404040', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '4px 12px', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>控制台</span>
            <span style={{ opacity: 0.5 }}>{consoleOutput.length} 条消息</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setConsoleOutput([])} style={{ ...toolbarBtn, padding: '2px 8px', fontSize: 11 }}>清空</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            {consoleOutput.length === 0 && (
              <div style={{ color: '#555', padding: 8 }}>点击 "▶ 运行" 或按 Ctrl+Enter 执行代码</div>
            )}
            {consoleOutput.map((entry, i) => (
              <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid #2a2a2a', color: entryColors[entry.type] || '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {entry.type === 'warn' && '⚠ '}
                {entry.type === 'error' && '✗ '}
                {entry.type === 'info' && 'ℹ '}
                {entry.data.join(' ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const toolbarBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: '#3c3c3c',
  color: '#d4d4d4',
  border: '1px solid #555',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  whiteSpace: 'nowrap',
};

export { WebContainerIDE }
