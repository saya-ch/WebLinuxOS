import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react'

interface Template {
  name: string
  html: string
  css: string
  js: string
}

const TEMPLATES: Record<string, Template> = {
  '空白': {
    name: '空白',
    html: '<div class="container">\n  <h1>Hello, World!</h1>\n  <p>开始编写你的代码吧</p>\n</div>',
    css: 'body {\n  font-family: system-ui, -apple-system, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  margin: 0;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.container {\n  text-align: center;\n  padding: 2rem;\n}\n\nh1 {\n  font-size: 3rem;\n  margin: 0 0 1rem;\n}\n\np {\n  font-size: 1.2rem;\n  opacity: 0.9;\n}',
    js: 'console.log("Hello from CodeLab!");\n\n// 点击事件示例\ndocument.addEventListener("click", (e) => {\n  const target = e.target;\n  if (target.tagName === "H1") {\n    target.style.transform = "scale(1.1) rotate(-5deg)";\n    setTimeout(() => {\n      target.style.transform = "scale(1) rotate(0deg)";\n    }, 300);\n  }\n});'
  },
  '待办列表': {
    name: '待办列表',
    html: '<div class="app">\n  <h1>✍️ 待办事项</h1>\n  <div class="input-row">\n    <input type="text" id="todoInput" placeholder="添加新任务..." />\n    <button id="addBtn">添加</button>\n  </div>\n  <ul id="todoList"></ul>\n  <div class="stats">\n    <span id="count">0 个任务</span>\n    <button id="clearBtn">清除已完成</button>\n  </div>\n</div>',
    css: '* { box-sizing: border-box; }\nbody {\n  font-family: system-ui, sans-serif;\n  background: #1a1a2e;\n  color: #eee;\n  margin: 0;\n  padding: 2rem;\n  min-height: 100vh;\n}\n.app { max-width: 500px; margin: 0 auto; }\nh1 { text-align: center; color: #00d4ff; }\n.input-row { display: flex; gap: 8px; margin-bottom: 1rem; }\ninput {\n  flex: 1; padding: 10px 14px; border-radius: 6px;\n  border: 1px solid #333; background: #16213e; color: #eee; font-size: 14px;\n}\nbutton {\n  padding: 10px 20px; border-radius: 6px; border: none;\n  background: #00d4ff; color: #000; cursor: pointer; font-weight: 600;\n}\nul { list-style: none; padding: 0; margin: 0 0 1rem; }\nli {\n  display: flex; align-items: center; gap: 10px;\n  padding: 10px 14px; background: #16213e; border-radius: 6px; margin-bottom: 8px;\n}\nli.completed span { text-decoration: line-through; opacity: 0.5; }\nli span { flex: 1; cursor: pointer; }\nli button { background: #ff4757; color: white; padding: 4px 10px; font-size: 12px; }\n.stats { display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.7; }',
    js: 'const input = document.getElementById("todoInput");\nconst addBtn = document.getElementById("addBtn");\nconst list = document.getElementById("todoList");\nconst count = document.getElementById("count");\nconst clearBtn = document.getElementById("clearBtn");\n\nlet todos = JSON.parse(localStorage.getItem("codelab-todos") || "[]");\n\nfunction save() {\n  localStorage.setItem("codelab-todos", JSON.stringify(todos));\n}\n\nfunction render() {\n  list.innerHTML = "";\n  todos.forEach((todo, i) => {\n    const li = document.createElement("li");\n    if (todo.done) li.className = "completed";\n    li.innerHTML = `<input type="checkbox" ${todo.done ? "checked" : ""} /><span>${todo.text}</span><button>删除</button>`;\n    const [checkbox, text, delBtn] = li.children;\n    checkbox.onchange = () => { todos[i].done = checkbox.checked; save(); render(); };\n    text.onclick = () => { todos[i].done = !todos[i].done; save(); render(); };\n    delBtn.onclick = () => { todos.splice(i, 1); save(); render(); };\n    list.appendChild(li);\n  });\n  count.textContent = `${todos.length} 个任务 (${todos.filter(t => !t.done).length} 未完成)`;\n}\n\nfunction addTodo() {\n  const text = input.value.trim();\n  if (!text) return;\n  todos.unshift({ text, done: false });\n  input.value = ""; save(); render();\n}\n\naddBtn.onclick = addTodo;\ninput.onkeydown = (e) => { if (e.key === "Enter") addTodo(); };\nclearBtn.onclick = () => { todos = todos.filter(t => !t.done); save(); render(); };\n\nrender();'
  },
  '天气卡片': {
    name: '天气卡片',
    html: '<div class="card">\n  <div class="icon">☀️</div>\n  <div class="temp">26°C</div>\n  <div class="city">北京</div>\n  <div class="desc">晴朗 · 微风</div>\n  <div class="details">\n    <div><span>💧</span> 45%</div>\n    <div><span>💨</span> 12 km/h</div>\n    <div><span>🌡️</span> 22°</div>\n    <div><span>🌅</span> 06:12</div>\n  </div>\n</div>',
    css: 'body {\n  font-family: system-ui, sans-serif;\n  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);\n  display: flex; align-items: center; justify-content: center;\n  min-height: 100vh; margin: 0; color: white;\n}\n.card {\n  background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);\n  border-radius: 20px; padding: 2rem 3rem; text-align: center;\n  box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2);\n}\n.icon { font-size: 4rem; margin-bottom: 0.5rem; }\n.temp { font-size: 3.5rem; font-weight: 200; line-height: 1; }\n.city { font-size: 1.5rem; margin: 0.5rem 0; font-weight: 600; }\n.desc { opacity: 0.9; margin-bottom: 1.5rem; }\n.details {\n  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;\n  padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2);\n  font-size: 0.85rem; opacity: 0.95;\n}\n.details span { margin-right: 4px; }',
    js: 'console.log("天气卡片已加载");\n\n// 简单的温度切换动画\nlet celsius = true;\nconst tempEl = document.querySelector(".temp");\ntempEl.style.cursor = "pointer";\ntempEl.onclick = () => {\n  if (celsius) {\n    const f = Math.round(26 * 9/5 + 32);\n    tempEl.textContent = f + "°F";\n  } else {\n    tempEl.textContent = "26°C";\n  }\n  celsius = !celsius;\n};'
  },
  '按钮动效库': {
    name: '按钮动效库',
    html: '<div class="wrap">\n  <h2>按钮动效库</h2>\n  <button class="btn btn-1">悬浮渐入</button>\n  <button class="btn btn-2">3D 按压</button>\n  <button class="btn btn-3">霓虹灯</button>\n  <button class="btn btn-4">滑动边框</button>\n  <button class="btn btn-5">膨胀</button>\n  <p style="margin-top: 2rem; opacity: 0.6; font-size: 12px;">点击任意按钮查看效果</p>\n</div>',
    css: 'body {\n  font-family: system-ui, sans-serif;\n  background: #0f0f23; color: white; margin: 0;\n  display: flex; align-items: center; justify-content: center; min-height: 100vh;\n}\n.wrap { text-align: center; padding: 2rem; }\nh2 { margin-bottom: 2rem; font-weight: 300; letter-spacing: 2px; }\n.btn {\n  display: block; margin: 12px auto; min-width: 200px;\n  padding: 14px 28px; font-size: 14px; font-weight: 600;\n  border: none; border-radius: 8px; cursor: pointer;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  letter-spacing: 1px;\n}\n.btn-1 { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; position: relative; overflow: hidden; }\n.btn-1:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4); }\n.btn-2 { background: #3498db; color: white; transform-style: preserve-3d; }\n.btn-2:hover { background: #2980b9; }\n.btn-2:active { transform: translateY(4px); }\n.btn-3 { background: transparent; color: #00ff88; border: 2px solid #00ff88; }\n.btn-3:hover { background: rgba(0, 255, 136, 0.1); box-shadow: 0 0 20px #00ff88, inset 0 0 20px rgba(0,255,136,0.1); }\n.btn-4 { background: #2d3436; color: white; position: relative; }\n.btn-4::before { content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 3px; background: #e84393; transition: left 0.3s; }\n.btn-4:hover::before { left: 0; }\n.btn-5 { background: #6c5ce7; color: white; border-radius: 50px; }\n.btn-5:hover { transform: scale(1.05); background: #a29bfe; }',
    js: 'document.querySelectorAll(".btn").forEach(btn => {\n  btn.addEventListener("click", () => {\n    btn.style.transform = "scale(0.95)";\n    setTimeout(() => { btn.style.transform = ""; }, 150);\n  });\n});'
  }
}

const STORAGE_KEY = 'codelab-session'

function CodeLab() {
  const [html, setHtml] = useState(TEMPLATES['空白'].html)
  const [css, setCss] = useState(TEMPLATES['空白'].css)
  const [js, setJs] = useState(TEMPLATES['空白'].js)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [showPreview, setShowPreview] = useState(true)
  const [autoRun, setAutoRun] = useState(true)
  const [consoleLogs, setConsoleLogs] = useState<{ type: string; content: string }[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceRef = useRef<number | null>(null)

  // 从 localStorage 恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.html) setHtml(parsed.html)
        if (parsed.css) setCss(parsed.css)
        if (parsed.js) setJs(parsed.js)
      }
    } catch (_e) { /* ignore */ }
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ html, css, js }))
    } catch (_e) { /* ignore */ }
  }, [html, css, js])

  const runCode = useCallback(() => {
    if (!iframeRef.current) return
    const code = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          (function() {
            const oldLog = console.log;
            const oldError = console.error;
            const oldWarn = console.warn;
            function post(type, args) {
              try {
                parent.postMessage({
                  source: 'codelab',
                  type: type,
                  content: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')
                }, '*');
              } catch(e) {}
            }
            console.log = function() { post('log', arguments); oldLog.apply(console, arguments); };
            console.error = function() { post('error', arguments); oldError.apply(console, arguments); };
            console.warn = function() { post('warn', arguments); oldWarn.apply(console, arguments); };
            window.onerror = function(msg, url, line) {
              post('error', ['Error: ' + msg + ' (line ' + line + ')']);
            };
            try {
              ${js}
            } catch(e) {
              console.error(e.message);
            }
          })();
        <\/script>
      </body>
      </html>
    `
    iframeRef.current.srcdoc = code
  }, [html, css, js])

  // 自动运行 (防抖)
  useEffect(() => {
    if (!autoRun) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(runCode, 600)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [html, css, js, autoRun, runCode])

  // 接收 iframe 消息
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.source === 'codelab') {
        setConsoleLogs(prev => [...prev.slice(-40), { type: e.data.type, content: e.data.content }])
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const applyTemplate = (name: string) => {
    const t = TEMPLATES[name]
    if (t) {
      setHtml(t.html)
      setCss(t.css)
      setJs(t.js)
    }
  }

  const exportCode = () => {
    const full = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
</style>
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`
    const blob = new Blob([full], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codelab-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentCode = useMemo(() => {
    switch (activeTab) {
      case 'html': return html
      case 'css': return css
      case 'js': return js
    }
  }, [activeTab, html, css, js])

  const handleCodeChange = (value: string) => {
    switch (activeTab) {
      case 'html': setHtml(value); break
      case 'css': setCss(value); break
      case 'js': setJs(value); break
    }
  }

  const codeCount = useMemo(() => {
    return {
      html: html.split('\n').length,
      css: css.split('\n').length,
      js: js.split('\n').length,
      total: html.length + css.length + js.length
    }
  }, [html, css, js])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)'
      }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>🧪</span> CodeLab
        </div>

        <div style={{ marginLeft: 16, display: 'flex', gap: 4 }}>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            style={{
              padding: '6px 10px', fontSize: 12, background: 'var(--bg)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer'
            }}
            defaultValue=""
          >
            <option value="" disabled>📁 加载模板...</option>
            {Object.keys(TEMPLATES).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
          自动运行
        </label>

        <button onClick={runCode} style={{
          padding: '6px 14px', fontSize: 12, background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600
        }}>▶ 运行</button>

        <button onClick={() => setShowPreview(!showPreview)} style={{
          padding: '6px 14px', fontSize: 12, background: 'transparent', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer'
        }}>{showPreview ? '👁 隐藏预览' : '👁 显示预览'}</button>

        <button onClick={exportCode} style={{
          padding: '6px 14px', fontSize: 12, background: 'transparent', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer'
        }}>⬇ 导出 HTML</button>

        <button onClick={() => setConsoleLogs([])} style={{
          padding: '6px 12px', fontSize: 12, background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer'
        }}>🧹 清空日志</button>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：代码编辑器 */}
        <div style={{ flex: showPreview ? 1 : 2, display: 'flex', flexDirection: 'column', minWidth: 300, borderRight: showPreview ? '1px solid var(--border)' : 'none' }}>
          {/* 代码 Tab */}
          <div style={{ display: 'flex', gap: 2, padding: '4px 8px', background: 'var(--bg-secondary)' }}>
            {([
              { id: 'html', label: 'HTML', color: '#e34f26' },
              { id: 'css', label: 'CSS', color: '#1572b6' },
              { id: 'js', label: 'JS', color: '#f7df1e' }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  background: activeTab === tab.id ? 'var(--bg)' : 'transparent',
                  color: activeTab === tab.id ? tab.color : 'var(--text-muted)',
                  border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                  borderBottom: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer',
                }}
              >
                {tab.label} · {codeCount[tab.id]} 行
              </button>
            ))}
            <div style={{ marginLeft: 'auto', padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
              总 {codeCount.total.toLocaleString()} 字符
            </div>
          </div>

          {/* 代码编辑器 (纯 textarea 实现) */}
          <textarea
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            placeholder="在此编写代码..."
            style={{
              flex: 1, padding: 16, fontSize: 13, fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
              background: 'var(--bg)', color: 'var(--text)', border: 'none', outline: 'none',
              resize: 'none', lineHeight: 1.6, tabSize: 2, whiteSpace: 'pre'
            }}
          />

          {/* 控制台日志 */}
          {consoleLogs.length > 0 && (
            <div style={{
              borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
              maxHeight: 140, overflowY: 'auto', padding: 8, fontSize: 11,
              fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace"
            }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 10 }}>CONSOLE</div>
              {consoleLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '3px 6px',
                    color: log.type === 'error' ? '#ff6b6b' : log.type === 'warn' ? '#ffd93d' : 'var(--text)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>
                    [{log.type === 'log' ? 'LOG' : log.type === 'error' ? 'ERR' : 'WRN'}]
                  </span>
                  {log.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：预览 */}
        {showPreview && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 300 }}>
            <div style={{
              padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)',
              background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ marginLeft: 12 }}>实时预览 · 每秒自动刷新</span>
            </div>
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-modals allow-forms"
              style={{ flex: 1, border: 'none', background: 'white' }}
              title="CodeLab Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CodeLab)
