import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface CodeTemplate {
  id: string
  name: string
  html: string
  css: string
  js: string
}

type EditorTab = 'html' | 'css' | 'js'

// ==================== 代码模板 ====================
const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    html: `<div class="container">
  <h1>Hello World! 🌍</h1>
  <p>欢迎使用 CodePen Lite 代码编辑器</p>
  <button id="greetBtn">点击我</button>
  <p id="output"></p>
</div>`,
    css: `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

h1 {
  font-size: 3em;
  margin-bottom: 0.5em;
}

p {
  font-size: 1.2em;
  opacity: 0.9;
}

button {
  margin-top: 20px;
  padding: 12px 32px;
  font-size: 16px;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background: white;
  color: #764ba2;
}`,
    js: `const btn = document.getElementById('greetBtn');
const output = document.getElementById('output');
let count = 0;

btn.addEventListener('click', () => {
  count++;
  output.textContent = \`你已经点击了 \${count} 次！🎉\`;
  output.style.fontSize = '1.3em';
  output.style.fontWeight = 'bold';
});`,
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    html: `<div class="todo-app">
  <h1>📝 待办事项</h1>
  <div class="input-group">
    <input type="text" id="todoInput" placeholder="添加新的待办事项...">
    <button id="addBtn">添加</button>
  </div>
  <ul id="todoList"></ul>
  <div class="stats" id="stats"></div>
</div>`,
    css: `.todo-app {
  max-width: 480px;
  margin: 40px auto;
  padding: 30px;
  font-family: system-ui, sans-serif;
  background: #1a1a2e;
  border-radius: 16px;
  color: #eee;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

h1 { text-align: center; margin-bottom: 20px; }

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #3a3a5c;
  border-radius: 10px;
  background: #2d2d44;
  color: #eee;
  font-size: 14px;
  outline: none;
}

input:focus { border-color: #6c5ce7; }

button {
  padding: 12px 20px;
  background: #6c5ce7;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}

button:hover { background: #5a4bd1; }

ul { list-style: none; padding: 0; }

li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 8px;
  background: #2d2d44;
  border-radius: 10px;
  transition: all 0.2s;
}

li:hover { background: #35355a; }

li.done { opacity: 0.5; text-decoration: line-through; }

.delete-btn {
  margin-left: auto;
  background: #e74c3c;
  padding: 6px 12px;
  font-size: 12px;
}

.stats {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #9090c0;
}`,
    js: `const input = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('todoList');
const stats = document.getElementById('stats');
let todos = [];

function render() {
  list.innerHTML = '';
  todos.forEach((todo, i) => {
    const li = document.createElement('li');
    if (todo.done) li.className = 'done';
    li.innerHTML = \`
      <input type="checkbox" \${todo.done ? 'checked' : ''} data-idx="\${i}">
      <span>\${todo.text}</span>
      <button class="delete-btn" data-del="\${i}">删除</button>
    \`;
    list.appendChild(li);
  });
  const done = todos.filter(t => t.done).length;
  stats.textContent = \`共 \${todos.length} 项，已完成 \${done} 项\`;
}

function addTodo() {
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = '';
  render();
}

addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

list.addEventListener('click', e => {
  const idx = e.target.dataset.idx;
  const del = e.target.dataset.del;
  if (idx !== undefined) { todos[idx].done = !todos[idx].done; render(); }
  if (del !== undefined) { todos.splice(parseInt(del), 1); render(); }
});

render();`,
  },
  {
    id: 'canvas-animation',
    name: 'Canvas动画',
    html: `<canvas id="canvas"></canvas>
<div class="info">移动鼠标与粒子互动 ✨</div>`,
    css: `* { margin: 0; padding: 0; }
body { overflow: hidden; background: #0a0a1a; }
canvas { display: block; }
.info {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(155, 138, 240, 0.7);
  font-family: system-ui;
  font-size: 13px;
  pointer-events: none;
}`,
    js: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], mouse = { x: 0, y: 0 };

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.r = Math.random() * 2 + 1;
  }
  update() {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      this.vx -= dx * 0.002;
      this.vy -= dy * 0.002;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(155, 138, 240, 0.8)';
    ctx.fill();
  }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 26, 0.15)';
  ctx.fillRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  // 连线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = \`rgba(155, 138, 240, \${1 - dist / 100})\`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();`,
  },
  {
    id: 'flexbox-layout',
    name: 'Flexbox布局',
    html: `<div class="page">
  <header class="header">🎨 Flexbox 布局演示</header>
  <nav class="nav">
    <a href="#" class="nav-item active">首页</a>
    <a href="#" class="nav-item">产品</a>
    <a href="#" class="nav-item">关于</a>
    <a href="#" class="nav-item">联系</a>
  </nav>
  <main class="main">
    <aside class="sidebar">侧边栏</aside>
    <section class="content">
      <div class="card">卡片 1</div>
      <div class="card">卡片 2</div>
      <div class="card">卡片 3</div>
      <div class="card">卡片 4</div>
      <div class="card">卡片 5</div>
      <div class="card">卡片 6</div>
    </section>
  </main>
  <footer class="footer">© 2024 Flexbox 布局演示</footer>
</div>`,
    css: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #0d1117; color: #c9d1d9; }

.page { display: flex; flex-direction: column; min-height: 100vh; }

.header {
  padding: 20px 30px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: 0;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

.nav-item {
  padding: 12px 24px;
  color: #8b949e;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.nav-item:hover { color: #c9d1d9; background: rgba(108,92,231,0.1); }
.nav-item.active { color: #a29bfe; border-bottom-color: #6c5ce7; }

.main { display: flex; flex: 1; }

.sidebar {
  width: 200px;
  padding: 20px;
  background: #161b22;
  border-right: 1px solid #30363d;
  font-size: 14px;
}

.content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-content: flex-start;
}

.card {
  flex: 1 1 calc(33.333% - 16px);
  min-width: 150px;
  padding: 24px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s;
}

.card:hover {
  border-color: #6c5ce7;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(108,92,231,0.2);
}

.footer {
  padding: 16px;
  text-align: center;
  background: #161b22;
  border-top: 1px solid #30363d;
  font-size: 13px;
  color: #8b949e;
}`,
    js: `// 动态高亮导航项
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});`,
  },
  {
    id: 'css-animation',
    name: 'CSS动画',
    html: `<div class="scene">
  <div class="ring"></div>
  <div class="ring"></div>
  <div class="ring"></div>
  <div class="pulse"></div>
  <div class="text">CSS 动画</div>
</div>`,
    css: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0a1a;
  overflow: hidden;
}

.scene {
  position: relative;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
}

.ring:nth-child(1) {
  border-top-color: #6c5ce7;
  animation: spin 2s linear infinite;
}

.ring:nth-child(2) {
  width: 75%;
  height: 75%;
  border-right-color: #a29bfe;
  animation: spin 1.5s linear infinite reverse;
}

.ring:nth-child(3) {
  width: 50%;
  height: 50%;
  border-bottom-color: #00d6c1;
  animation: spin 1s linear infinite;
}

.pulse {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, #6c5ce7, #a29bfe);
  animation: pulse 2s ease-in-out infinite;
}

.text {
  position: absolute;
  bottom: -60px;
  color: #c9d1d9;
  font-family: system-ui;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  animation: fadeInUp 1s ease-out 0.5s both;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(108,92,231,0.5); }
  50% { transform: scale(1.3); box-shadow: 0 0 40px rgba(108,92,231,0.8); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`,
    js: `// 页面点击产生涟漪效果
document.body.addEventListener('click', (e) => {
  const ripple = document.createElement('div');
  ripple.style.cssText = \`
    position: fixed;
    left: \${e.clientX}px;
    top: \${e.clientY}px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(108, 92, 231, 0.6);
    transform: translate(-50%, -50%) scale(0);
    animation: rippleEffect 0.8s ease-out forwards;
    pointer-events: none;
  \`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
});

// 注入涟漪动画
const style = document.createElement('style');
style.textContent = \`
  @keyframes rippleEffect {
    to { transform: translate(-50%, -50%) scale(20); opacity: 0; }
  }
\`;
document.head.appendChild(style);`,
  },
]

// ==================== localStorage 键名 ====================
const STORAGE_KEY = 'weblinux-codepen-lite'

// ==================== 行号显示组件 ====================
function LineNumberedTextarea({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label: string
}) {
  const lineCount = (value || '').split('\n').length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* 行号 */}
      <div
        aria-hidden="true"
        style={{
          padding: '12px 8px 12px 4px',
          background: 'rgba(0,0,0,0.15)',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          lineHeight: 1.7,
          textAlign: 'right',
          userSelect: 'none',
          minWidth: 32,
          overflow: 'hidden',
          opacity: 0.6,
        }}
      >
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      {/* 代码编辑区 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        aria-label={label}
        style={{
          flex: 1,
          padding: 12,
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
          fontSize: 13,
          lineHeight: 1.7,
          background: 'transparent',
          color: 'var(--text-primary)',
          tabSize: 2,
          whiteSpace: 'pre',
          overflow: 'auto',
        }}
        onKeyDown={(e) => {
          // Tab键插入缩进
          if (e.key === 'Tab') {
            e.preventDefault()
            const start = e.currentTarget.selectionStart
            const end = e.currentTarget.selectionEnd
            const newValue = value.substring(0, start) + '  ' + value.substring(end)
            onChange(newValue)
            // 延迟设置光标位置
            requestAnimationFrame(() => {
              e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2
            })
          }
        }}
      />
    </div>
  )
}

// ==================== 主组件 ====================
export default function CodePenLite() {
  const addNotification = useStore((s) => s.addNotification)

  const [htmlCode, setHtmlCode] = useState(CODE_TEMPLATES[0].html)
  const [cssCode, setCssCode] = useState(CODE_TEMPLATES[0].css)
  const [jsCode, setJsCode] = useState(CODE_TEMPLATES[0].js)
  const [activeTab, setActiveTab] = useState<EditorTab>('html')
  const [activeTemplateId, setActiveTemplateId] = useState(CODE_TEMPLATES[0].id)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isAutoSave, setIsAutoSave] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 从localStorage恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.html) setHtmlCode(parsed.html)
        if (parsed.css) setCssCode(parsed.css)
        if (parsed.js) setJsCode(parsed.js)
        if (parsed.templateId) setActiveTemplateId(parsed.templateId)
      }
    } catch { /* 忽略 */ }
  }, [])

  // 自动保存到localStorage
  useEffect(() => {
    if (!isAutoSave) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          templateId: activeTemplateId,
        }))
      } catch { /* 忽略 */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [htmlCode, cssCode, jsCode, activeTemplateId, isAutoSave])

  // 生成预览HTML
  const generatePreviewHTML = useCallback(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch(e) {
      document.body.innerHTML += '<div style="padding:16px;margin:16px;background:rgba(255,77,95,0.15);border:1px solid rgba(255,77,95,0.4);border-radius:8px;color:#ff4d5f;font-family:monospace;font-size:13px;"><strong>JS错误：</strong>' + e.message + '</div>';
    }
  </script>
</body>
</html>`
  }, [htmlCode, cssCode, jsCode])

  // 更新预览
  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return
    const html = generatePreviewHTML()
    iframeRef.current.srcdoc = html
  }, [generatePreviewHTML])

  // 实时预览（防抖）
  useEffect(() => {
    const timer = setTimeout(updatePreview, 400)
    return () => clearTimeout(timer)
  }, [htmlCode, cssCode, jsCode, updatePreview])

  // 加载模板
  const loadTemplate = useCallback((template: CodeTemplate) => {
    setHtmlCode(template.html)
    setCssCode(template.css)
    setJsCode(template.js)
    setActiveTemplateId(template.id)
    setShowTemplates(false)
    addNotification({ title: 'CodePen Lite', message: `已加载模板：${template.name}`, type: 'success' })
  }, [addNotification])

  // 导出HTML文件
  const exportHTML = useCallback(() => {
    const html = generatePreviewHTML()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codepen-lite-export.html'
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ title: 'CodePen Lite', message: 'HTML文件已导出', type: 'success' })
  }, [generatePreviewHTML, addNotification])

  // 运行代码
  const runCode = useCallback(() => {
    updatePreview()
  }, [updatePreview])

  // 当前编辑区的代码
  const currentCode = activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode
  const setCurrentCode = activeTab === 'html' ? setHtmlCode : activeTab === 'css' ? setCssCode : setJsCode

  const EDITOR_TABS: { id: EditorTab; name: string; color: string }[] = [
    { id: 'html', name: 'HTML', color: '#ff7a59' },
    { id: 'css', name: 'CSS', color: '#5ac8fa' },
    { id: 'js', name: 'JS', color: '#ffd43b' },
  ]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {/* 模板选择 */}
        <div style={{ position: 'relative' }}>
          <button
            className="app-button"
            onClick={() => setShowTemplates(!showTemplates)}
            aria-label="选择代码模板"
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            📋 模板
          </button>
          {showTemplates && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100,
                marginTop: 4,
                minWidth: 180,
                borderRadius: 10,
                background: 'var(--window-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-medium)',
                overflow: 'hidden',
              }}
            >
              {CODE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: activeTemplateId === t.id ? 'var(--accent-bg)' : 'transparent',
                    color: activeTemplateId === t.id ? 'var(--accent)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = activeTemplateId === t.id ? 'var(--accent-bg)' : 'transparent' }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 编辑器标签页 */}
        <div style={{ display: 'flex', gap: 2, borderRadius: 8, background: 'rgba(0,0,0,0.15)', padding: 2 }}>
          {EDITOR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={`切换到${tab.name}编辑器`}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === tab.id ? 'var(--window-bg)' : 'transparent',
                color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.2s',
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* 自动保存切换 */}
        <button
          className="app-button"
          onClick={() => setIsAutoSave(!isAutoSave)}
          aria-label={`自动保存：${isAutoSave ? '开启' : '关闭'}`}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: isAutoSave ? 'var(--accent-bg)' : 'var(--glass-bg)',
            color: isAutoSave ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          {isAutoSave ? '💾 自动保存' : '💾 手动'}
        </button>

        {/* 运行按钮 */}
        <button
          className="app-button"
          onClick={runCode}
          aria-label="运行代码"
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent-gradient, linear-gradient(135deg, #7c6cf0, #9b8af0))',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ▶ 运行
        </button>

        {/* 导出按钮 */}
        <button
          className="app-button"
          onClick={exportHTML}
          aria-label="导出为HTML文件"
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          📥 导出
        </button>
      </div>

      {/* 主体：编辑器 + 预览 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 代码编辑区 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--glass-border)',
            overflow: 'hidden',
            minWidth: 0,
          }}
          role="region"
          aria-label="代码编辑区域"
        >
          {/* 编辑区标题 */}
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'rgba(0,0,0,0.1)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>
              {EDITOR_TABS.find((t) => t.id === activeTab)?.name} 编辑器
            </span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              {currentCode.split('\n').length} 行 · {currentCode.length} 字符
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.1)' }}>
            <LineNumberedTextarea
              value={currentCode}
              onChange={setCurrentCode}
              placeholder={`// 在此输入 ${activeTab.toUpperCase()} 代码...`}
              label={`${activeTab.toUpperCase()} 代码编辑器`}
            />
          </div>
        </div>

        {/* 预览区 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
          role="region"
          aria-label="实时预览区域"
        >
          <div style={{
            padding: '6px 12px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'rgba(0,0,0,0.1)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>👁️ 实时预览</span>
            <button
              onClick={runCode}
              style={{
                padding: '2px 10px',
                borderRadius: 4,
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
              }}
            >
              刷新
            </button>
          </div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-modals"
            title="代码预览"
            style={{
              flex: 1,
              border: 'none',
              background: '#fff',
              width: '100%',
            }}
          />
        </div>
      </div>
    </div>
  )
}
