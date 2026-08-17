import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import {
  PlayIcon,
  TrashIcon,
  SaveIcon,
  DownloadIcon,
  CopyIcon,
  Code2Icon,
  ClockIcon,
  ActivityIcon,
  FileCodeIcon,
  Trash2Icon,
  ExternalLinkIcon,
} from '../icons'

interface ConsoleEntry {
  id: number
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
  timestamp: string
}

interface Snippet {
  id: string
  name: string
  code: string
  createdAt: number
}

interface Template {
  name: string
  description: string
  code: string
}

const TEMPLATES: Template[] = [
  {
    name: '数组方法',
    description: 'map/filter/reduce/some/every 实战',
    code: `// 数组方法实战
const data = [
  { name: 'Alice', age: 28, score: 95 },
  { name: 'Bob', age: 34, score: 87 },
  { name: 'Charlie', age: 22, score: 91 },
  { name: 'Diana', age: 45, score: 76 },
];

// map: 提取姓名
const names = data.map(d => d.name);
console.log('姓名列表:', names);

// filter: 筛选高分
const topPerformers = data.filter(d => d.score >= 90);
console.log('高分学员:', topPerformers);

// reduce: 平均分
const avgScore = data.reduce((sum, d) => sum + d.score, 0) / data.length;
console.log('平均分:', avgScore.toFixed(1));

// some/every
console.log('是否有不及格:', data.some(d => d.score < 60));
console.log('是否全部及格:', data.every(d => d.score >= 60));

// 链式调用
const result = data
  .filter(d => d.age < 40)
  .sort((a, b) => b.score - a.score)
  .map(d => ({ name: d.name, level: d.score >= 90 ? 'A' : 'B' }));
console.log('结果:', result);`,
  },
  {
    name: 'async/await',
    description: '异步请求与并发控制',
    code: `// async/await 异步编程
function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

async function fetchUser(id) {
  console.log('开始获取用户', id);
  const user = await delay(500, { id, name: 'User' + id });
  console.log('获取完成:', user);
  return user;
}

async function fetchPosts(userId) {
  console.log('开始获取用户', userId, '的文章');
  const posts = await delay(300, [
    { id: 1, title: '文章一' },
    { id: 2, title: '文章二' },
  ]);
  return posts;
}

// 串行执行
async function serialDemo() {
  console.log('=== 串行执行 ===');
  const user = await fetchUser(1);
  const posts = await fetchPosts(user.id);
  console.log('串行完成:', { user, posts });
}

// 并发执行
async function parallelDemo() {
  console.log('=== 并发执行 ===');
  const [user, posts] = await Promise.all([
    fetchUser(2),
    fetchPosts(2),
  ]);
  console.log('并发完成:', { user, posts });
}

// 错误处理
async function safeFetch() {
  try {
    await fetchUser(999);
  } catch (e) {
    console.error('捕获错误:', e.message);
  }
}

serialDemo();
parallelDemo();
safeFetch();`,
  },
  {
    name: 'DOM 操作',
    description: '在沙盒中直接操作文档',
    code: `// DOM 操作示例
const container = document.createElement('div');
container.style.cssText = 'padding:20px;font-family:system-ui;';
document.body.appendChild(container);

// 创建标题
const h1 = document.createElement('h1');
h1.textContent = '🚀 DOM 操作演示';
h1.style.color = '#4ec9b0';
container.appendChild(h1);

// 创建按钮
const btn = document.createElement('button');
btn.textContent = '点击我';
btn.style.cssText = 'padding:8px 16px;background:#0e639c;color:#fff;border:none;border-radius:4px;cursor:pointer;';
btn.onclick = () => {
  const p = document.createElement('p');
  p.textContent = '✨ 已在 ' + new Date().toLocaleTimeString() + ' 点击';
  p.style.color = '#dcdcaa';
  container.appendChild(p);
};
container.appendChild(btn);

// Canvas 绘图
const canvas = document.createElement('canvas');
canvas.width = 300;
canvas.height = 150;
canvas.style.marginTop = '16px';
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 300, 0);
gradient.addColorStop(0, '#0e639c');
gradient.addColorStop(1, '#4ec9b0');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 300, 150);
ctx.fillStyle = '#fff';
ctx.font = 'bold 20px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Canvas 绘图', 150, 85);
container.appendChild(canvas);

console.log('DOM 操作完成');`,
  },
  {
    name: 'Fetch API',
    description: '网络请求与错误处理',
    code: `// Fetch API 使用示例
async function loadData() {
  console.log('开始请求数据...');
  
  try {
    // 使用公开的测试 API
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    
    const data = await response.json();
    console.log('获取成功:', data);
    
    // 显示结果
    const div = document.createElement('div');
    div.style.cssText = 'padding:16px;font-family:monospace;background:#1e1e1e;color:#d4d4d4;border-radius:8px;margin:8px;';
    div.innerHTML = '<h3 style="color:#4ec9b0">' + data.name + '</h3>' +
      '<p>📧 ' + data.email + '</p>' +
      '<p>📱 ' + data.phone + '</p>' +
      '<p>🏢 ' + data.company.name + '</p>';
    document.body.appendChild(div);
    
  } catch (error) {
    console.error('请求失败:', error.message);
    
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'padding:16px;background:#2d1a1a;color:#f44747;border-radius:8px;margin:8px;';
    errDiv.textContent = '❌ 请求失败: ' + error.message + '（可能由于 CORS 限制）';
    document.body.appendChild(errDiv);
  }
}

loadData();`,
  },
  {
    name: '数据结构',
    description: 'Map/Set/WeakMap 使用',
    code: `// 现代数据结构
// Map: 键值对，任何类型作键
const userMap = new Map();
userMap.set('alice', { role: 'admin', age: 28 });
userMap.set('bob', { role: 'user', age: 34 });

for (const [name, info] of userMap) {
  console.log(name + ':', info);
}

console.log('Map 大小:', userMap.size);
console.log('alice 角色:', userMap.get('alice')?.role);

// Set: 唯一值集合
const tags = new Set(['js', 'ts', 'react', 'js', 'node']);
console.log('标签:', [...tags]);
console.log('包含 react:', tags.has('react'));

// 集合运算
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);
const intersection = new Set([...a].filter(x => b.has(x)));
console.log('交集:', [...intersection]);
const union = new Set([...a, ...b]);
console.log('并集:', [...union]);

// WeakMap: 弱引用，键为对象
const privateData = new WeakMap();
class Person {
  constructor(name) {
    privateData.set(this, { name });
  }
  getName() {
    return privateData.get(this).name;
  }
}
const p = new Person('Charlie');
console.log('WeakMap 示例:', p.getName());

// Symbol 作为私有属性
const _internal = Symbol('internal');
const obj = {
  public: 'visible',
  [_internal]: 'hidden'
};
console.log('公开属性:', obj.public);
console.log('Symbol 属性:', obj[_internal]);
console.log('Object.keys:', Object.keys(obj));`,
  },
]

const SNIPPETS_KEY = 'web-sandbox-ide-snippets'

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

const DEFAULT_CODE = `// 欢迎使用 WebSandbox 代码沙盒
// 在左侧编辑代码，点击 ▶ 运行按钮执行
// 所有 console 输出将显示在下方控制台

const greeting = 'Hello from WebSandbox IDE!';
console.log(greeting);

const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log('求和:', sum);
console.log('平均值:', sum / numbers.length);

// 尝试运行更多模板：点击"模板"按钮`

export default function WebSandboxIDE() {
  const addNotification = useStore((s) => s.addNotification)

  const [code, setCode] = useState<string>(DEFAULT_CODE)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSnippets, setShowSnippets] = useState(false)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [memoryEstimate, setMemoryEstimate] = useState<number | null>(null)
  const [autoRun, setAutoRun] = useState(false)
  const [savedSnippetName, setSavedSnippetName] = useState('')
  const [activeTemplate, setActiveTemplate] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const entryIdRef = useRef(0)
  const autoRunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const charCount = code.length
  const lineCount = code.split('\n').length

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNIPPETS_KEY)
      if (saved) {
        setSnippets(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const saveSnippetsToStorage = useCallback((list: Snippet[]) => {
    try {
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(list))
    } catch {}
  }, [])

  const appendEntry = useCallback((level: ConsoleEntry['level'], message: string) => {
    const entry: ConsoleEntry = {
      id: ++entryIdRef.current,
      level,
      message,
      timestamp: formatTimestamp(new Date()),
    }
    setConsoleEntries((prev) => [...prev, entry])
  }, [])

  const runCode = useCallback(() => {
    if (!iframeRef.current) return
    if (!code.trim()) {
      addNotification({ title: '提示', message: '代码不能为空', type: 'info' })
      return
    }

    setIsRunning(true)
    setConsoleEntries([])
    setExecutionTime(null)
    setMemoryEstimate(null)

    const startTime = performance.now()

    const sandboxHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin: 0; padding: 16px; font-family: Menlo, Consolas, monospace; font-size: 13px; color: #d4d4d4; background: transparent; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<script>
(function() {
  const logs = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;

  function capture(level, args) {
    const formatted = args.map(function(a) {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') {
        try { return JSON.stringify(a, null, 2); }
        catch(e) { return String(a); }
      }
      return String(a);
    }).join(' ');
    logs.push({ level: level, message: formatted, timestamp: new Date().toISOString() });
  }

  console.log = function() { capture('log', Array.from(arguments)); };
  console.warn = function() { capture('warn', Array.from(arguments)); };
  console.error = function() { capture('error', Array.from(arguments)); };
  console.info = function() { capture('info', Array.from(arguments)); };

  try {
    ${code}
  } catch (e) {
    logs.push({ level: 'error', message: (e && e.message) ? e.message : String(e), timestamp: new Date().toISOString() });
  }

  setTimeout(function() {
    parent.postMessage({ __sandbox_result__: true, logs: logs }, '*');
  }, 100);
})();
<\/script>
</body>
</html>`

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.__sandbox_result__) {
        const elapsed = performance.now() - startTime
        setExecutionTime(Math.round(elapsed * 100) / 100)

        const entries: ConsoleEntry[] = (e.data.logs || []).map((l: { level: string; message: string; timestamp: string }) => ({
          id: ++entryIdRef.current,
          level: l.level as ConsoleEntry['level'],
          message: l.message,
          timestamp: formatTimestamp(new Date(l.timestamp)),
        }))
        setConsoleEntries(entries)

        const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number } }
        if (perfWithMemory.memory) {
          setMemoryEstimate(Math.round(perfWithMemory.memory.usedJSHeapSize / 1024))
        }

        setIsRunning(false)
        window.removeEventListener('message', handleMessage)

        const errorCount = entries.filter((en) => en.level === 'error').length
        if (errorCount > 0) {
          addNotification({
            title: '执行完成',
            message: `耗时 ${Math.round(elapsed)}ms，有 ${errorCount} 个错误`,
            type: 'error',
          })
        } else {
          addNotification({
            title: '执行成功',
            message: `耗时 ${Math.round(elapsed)}ms`,
            type: 'success',
          })
        }
      }
    }

    window.addEventListener('message', handleMessage)

    const sandbox = iframeRef.current
    sandbox.srcdoc = sandboxHTML

    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      setIsRunning(false)
      appendEntry('error', '执行超时（10秒），代码可能包含无限循环')
      addNotification({ title: '超时', message: '代码执行超时，请检查是否存在无限循环', type: 'error' })
    }, 10000)

    const origRemoveEventListener = window.removeEventListener
    window.removeEventListener = function(...args: unknown[]) {
      if (args[0] === 'message') {
        clearTimeout(timeoutId)
      }
      return origRemoveEventListener.apply(window, args as unknown as Parameters<typeof window.removeEventListener>)
    }
  }, [code, addNotification, appendEntry])

  const clearConsole = useCallback(() => {
    setConsoleEntries([])
    setExecutionTime(null)
    setMemoryEstimate(null)
  }, [])

  const clearCode = useCallback(() => {
    setCode('')
    setConsoleEntries([])
    setExecutionTime(null)
  }, [])

  const loadTemplate = useCallback((template: Template) => {
    setCode(template.code)
    setActiveTemplate(template.name)
    setShowTemplates(false)
    setConsoleEntries([])
    setExecutionTime(null)
    appendEntry('info', `已加载模板: ${template.name}`)
  }, [appendEntry])

  const saveSnippet = useCallback(() => {
    const name = savedSnippetName.trim() || `代码片段 ${new Date().toLocaleString()}`
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      name,
      code,
      createdAt: Date.now(),
    }
    const updated = [newSnippet, ...snippets]
    setSnippets(updated)
    saveSnippetsToStorage(updated)
    setSavedSnippetName('')
    addNotification({ title: '已保存', message: `代码片段"${name}"已保存`, type: 'success' })
  }, [code, snippets, savedSnippetName, saveSnippetsToStorage, addNotification])

  const loadSnippet = useCallback((snippet: Snippet) => {
    setCode(snippet.code)
    setShowSnippets(false)
    setConsoleEntries([])
    setExecutionTime(null)
    appendEntry('info', `已加载片段: ${snippet.name}`)
  }, [appendEntry])

  const deleteSnippet = useCallback((id: string) => {
    const updated = snippets.filter((s) => s.id !== id)
    setSnippets(updated)
    saveSnippetsToStorage(updated)
  }, [snippets, saveSnippetsToStorage])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success' })
    } catch {
      addNotification({ title: '复制失败', message: '请手动选择复制', type: 'error' })
    }
  }, [code, addNotification])

  const downloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `web-sandbox-${Date.now()}.js`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: '下载成功', message: '代码已下载为 .js 文件', type: 'success' })
  }, [code, addNotification])

  const handleAutoRun = useCallback((value: string) => {
    setCode(value)
    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current)
    }
    if (autoRun) {
      autoRunTimerRef.current = setTimeout(() => {
        runCode()
      }, 1000)
    }
  }, [autoRun, runCode])

  useEffect(() => {
    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current)
      }
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newValue)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }, [code])

  const consoleStats = useMemo(() => {
    const counts = { log: 0, error: 0, warn: 0, info: 0 }
    for (const entry of consoleEntries) {
      counts[entry.level]++
    }
    return counts
  }, [consoleEntries])

  const levelColors: Record<ConsoleEntry['level'], string> = {
    log: '#d4d4d4',
    error: '#f44747',
    warn: '#dcdcaa',
    info: '#4ec9b0',
  }

  const levelIcons: Record<ConsoleEntry['level'], string> = {
    log: '›',
    error: '✕',
    warn: '⚠',
    info: 'ℹ',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#252526',
        borderBottom: '1px solid #333',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12, borderRight: '1px solid #333' }}>
            <Code2Icon size={16} style={{ color: '#569cd6' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>WebSandbox IDE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={runCode}
              disabled={isRunning}
              title="运行代码 (Ctrl+Enter)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                background: isRunning ? '#2d5a3d' : '#0e639c',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.background = '#1177bb' }}
              onMouseLeave={(e) => { if (!isRunning) e.currentTarget.style.background = '#0e639c' }}
            >
              <PlayIcon size={13} />
              {isRunning ? '运行中...' : '运行'}
            </button>

            <button
              onClick={() => setShowTemplates((v) => !v)}
              title="代码模板"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                background: '#3c3c3c',
                color: '#d4d4d4',
                border: '1px solid #555',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4a4a4a' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#3c3c3c' }}
            >
              <FileCodeIcon size={13} />
              模板
            </button>

            <button
              onClick={() => setShowSnippets((v) => !v)}
              title="代码片段库"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                background: '#3c3c3c',
                color: '#d4d4d4',
                border: '1px solid #555',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4a4a4a' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#3c3c3c' }}
            >
              <SaveIcon size={13} />
              片段 ({snippets.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#999', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              style={{ accentColor: '#0e639c' }}
            />
            自动运行
          </label>

          <div style={{ width: 1, height: 18, background: '#444', margin: '0 6px' }} />

          <button
            onClick={copyToClipboard}
            title="复制代码"
            style={{
              padding: '6px 8px',
              background: 'transparent',
              color: '#9cdcfe',
              border: '1px solid #3c3c3c',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <CopyIcon size={14} />
          </button>

          <button
            onClick={downloadCode}
            title="下载为 .js 文件"
            style={{
              padding: '6px 8px',
              background: 'transparent',
              color: '#ce9178',
              border: '1px solid #3c3c3c',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <DownloadIcon size={14} />
          </button>

          <button
            onClick={clearCode}
            title="清空编辑器"
            style={{
              padding: '6px 8px',
              background: 'transparent',
              color: '#f48771',
              border: '1px solid #3c3c3c',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* 模板下拉面板 */}
      {showTemplates && (
        <div style={{
          position: 'absolute',
          top: 44,
          left: 130,
          background: '#252526',
          border: '1px solid #3c3c3c',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 100,
          width: 340,
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #3c3c3c', fontSize: 12, fontWeight: 600, color: '#e0e0e0' }}>
            代码模板
          </div>
          {TEMPLATES.map((t) => (
            <div
              key={t.name}
              onClick={() => loadTemplate(t)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #2d2d2d',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#094771' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontSize: 13, color: '#9cdcfe', fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* 片段库下拉面板 */}
      {showSnippets && (
        <div style={{
          position: 'absolute',
          top: 44,
          left: 280,
          background: '#252526',
          border: '1px solid #3c3c3c',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 100,
          width: 360,
          maxHeight: 340,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #3c3c3c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={savedSnippetName}
              onChange={(e) => setSavedSnippetName(e.target.value)}
              placeholder="保存当前代码为片段..."
              style={{
                flex: 1,
                padding: '5px 8px',
                background: '#3c3c3c',
                color: '#d4d4d4',
                border: '1px solid #555',
                borderRadius: 3,
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={saveSnippet}
              style={{
                padding: '5px 10px',
                background: '#0e639c',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              保存
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {snippets.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>
                暂无保存的代码片段
              </div>
            ) : (
              snippets.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #2d2d2d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div
                    onClick={() => loadSnippet(s)}
                    style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    <div style={{ fontSize: 12, color: '#ce9178', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                      {new Date(s.createdAt).toLocaleString()} · {s.code.length} 字符
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSnippet(s.id)}
                    style={{
                      padding: '3px 6px',
                      background: 'transparent',
                      color: '#f48771',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="删除"
                  >
                    <Trash2Icon size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 主体编辑区 */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* 编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #333',
          minWidth: 0,
        }}>
          <div style={{
            padding: '4px 12px',
            background: '#2d2d2d',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888' }}>
              <FileCodeIcon size={11} />
              <span>sandbox.js</span>
              {activeTemplate && (
                <span style={{ color: '#6a9955' }}>· {activeTemplate}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#888' }}>
              <span>Ln {lineCount}</span>
              <span>{charCount} 字符</span>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleAutoRun(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                runCode()
              }
            }}
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px 16px',
              background: '#1e1e1e',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Fira Code', 'Menlo', 'Consolas', 'Liberation Mono', monospace",
              fontSize: 13,
              lineHeight: 1.6,
              tabSize: 2,
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          />
        </div>

        {/* 预览/沙盒区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          <div style={{
            padding: '4px 12px',
            background: '#2d2d2d',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
              沙盒预览 (iframe sandbox)
            </span>
          </div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-modals"
            style={{
              flex: 1,
              width: '100%',
              border: 'none',
              background: '#252526',
            }}
            title="sandbox-preview"
          />
        </div>
      </div>

      {/* 底部控制台 */}
      <div style={{
        height: 200,
        background: '#1e1e1e',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '4px 12px',
          background: '#252526',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e0e0e0' }}>控制台</span>
            <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
              {consoleStats.log > 0 && <span style={{ color: '#d4d4d4' }}>● {consoleStats.log}</span>}
              {consoleStats.error > 0 && <span style={{ color: '#f44747' }}>✕ {consoleStats.error}</span>}
              {consoleStats.warn > 0 && <span style={{ color: '#dcdcaa' }}>⚠ {consoleStats.warn}</span>}
              {consoleStats.info > 0 && <span style={{ color: '#4ec9b0' }}>ℹ {consoleStats.info}</span>}
            </div>
          </div>
          <button
            onClick={clearConsole}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: 'transparent',
              color: '#888',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 11,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#3c3c3c'; e.currentTarget.style.color = '#d4d4d4' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}
          >
            <TrashIcon size={11} />
            清空
          </button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          fontFamily: "'Fira Code', 'Menlo', 'Consolas', monospace",
          fontSize: 12,
        }}>
          {consoleEntries.length === 0 ? (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: '#555',
              fontSize: 12,
            }}>
              点击"运行"执行代码，控制台输出将显示在此处
            </div>
          ) : (
            consoleEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  padding: '2px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{
                  color: levelColors[entry.level],
                  fontWeight: 700,
                  fontSize: 11,
                  flexShrink: 0,
                  width: 14,
                  textAlign: 'center',
                }}>
                  {levelIcons[entry.level]}
                </span>
                <span style={{ color: '#666', fontSize: 11, flexShrink: 0 }}>
                  {entry.timestamp}
                </span>
                <span style={{
                  color: levelColors[entry.level],
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flex: 1,
                }}>
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        padding: '4px 12px',
        background: '#007acc',
        color: '#fff',
        fontSize: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Code2Icon size={11} />
            WebSandbox IDE
          </span>
          {executionTime !== null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ClockIcon size={11} />
              执行: {executionTime}ms
            </span>
          )}
          {memoryEstimate !== null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ActivityIcon size={11} />
              内存: {memoryEstimate.toLocaleString()} KB
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{lineCount} 行</span>
          <span>{charCount} 字符</span>
          {isRunning && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#fff',
                animation: 'pulse 1s infinite',
              }} />
              运行中
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8 }}>
            <ExternalLinkIcon size={10} />
            iframe sandbox
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        ::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }
        textarea::selection {
          background: #264f78;
        }
      `}</style>
    </div>
  )
}