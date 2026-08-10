import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { PlayIcon, CopyIcon, SaveIcon, DownloadIcon, RotateCcwIcon, EyeIcon, EyeOffIcon, LayersIcon } from '../icons'

const SAMPLE_PROJECTS = [
  {
    name: 'Hello World',
    html: '<div id="app"><h1 id="title">Hello World!</h1><button id="btn">Click me</button></div>',
    css: '#app { padding: 40px; text-align: center; } #title { color: #4facfe; } #btn { padding: 10px 20px; background: #4facfe; color: white; border: none; border-radius: 8px; cursor: pointer; }',
    js: 'document.getElementById("btn").addEventListener("click", () => { alert("Hello from CodePlayground!"); });',
  },
  {
    name: '计数器',
    html: '<div class="counter"><h2>计数器</h2><p id="count">0</p><button id="inc">+1</button><button id="dec">-1</button><button id="reset">重置</button></div>',
    css: '.counter { padding: 40px; text-align: center; font-family: sans-serif; } h2 { color: #7c6cf0; } p { font-size: 48px; margin: 20px 0; color: #333; } button { margin: 0 5px; padding: 8px 16px; cursor: pointer; border: 1px solid #ddd; background: white; border-radius: 4px; } button:hover { background: #f0f0f0; }',
    js: 'let count = 0;\nconst display = document.getElementById("count");\ndocument.getElementById("inc").onclick = () => { count++; display.textContent = count; };\ndocument.getElementById("dec").onclick = () => { count--; display.textContent = count; };\ndocument.getElementById("reset").onclick = () => { count = 0; display.textContent = count; };',
  },
  {
    name: '数据可视化',
    html: '<div class="viz"><h2>数据柱状图</h2><div class="bars" id="bars"></div></div>',
    css: '.viz { padding: 40px; } h2 { color: #10b981; } .bars { display: flex; align-items: flex-end; gap: 10px; height: 200px; margin-top: 20px; } .bar { width: 40px; background: linear-gradient(to top, #10b981, #34d399); border-radius: 4px 4px 0 0; transition: height 0.5s; display: flex; align-items: flex-start; justify-content: center; color: white; font-size: 12px; padding-top: 4px; }',
    js: 'const data = [65, 45, 80, 30, 90, 55, 70];\nconst maxHeight = 180;\nconst bars = document.getElementById("bars");\ndata.forEach((val, i) => {\n  const bar = document.createElement("div");\n  bar.className = "bar";\n  bar.style.height = (val / 100 * maxHeight) + "px";\n  bar.textContent = val;\n  bars.appendChild(bar);\n});',
  },
]

const CodePlaygroundPro = memo(function CodePlaygroundPro() {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [html, setHtml] = useState(SAMPLE_PROJECTS[0].html)
  const [css, setCss] = useState(SAMPLE_PROJECTS[0].css)
  const [js, setJs] = useState(SAMPLE_PROJECTS[0].js)
  const [showConsole, setShowConsole] = useState(true)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [previewKey, setPreviewKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [savedProjects, setSavedProjects] = useState<string[]>([])
  const previewRef = useRef<HTMLIFrameElement>(null)

  // 加载保存的项目
  useEffect(() => {
    try {
      const saved = localStorage.getItem('code-playground-projects')
      if (saved) setSavedProjects(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('code-playground-projects', JSON.stringify(savedProjects))
  }, [savedProjects])

  const runCode = useCallback(() => {
    const combinedCode = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          const logs = [];
          const origLog = console.log;
          const origError = console.error;
          const origWarn = console.warn;
          console.log = function(...args) {
            logs.push({ type: 'log', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
            origLog.apply(console, args);
          };
          console.error = function(...args) {
            logs.push({ type: 'error', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
            origError.apply(console, args);
          };
          console.warn = function(...args) {
            logs.push({ type: 'warn', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
            origWarn.apply(console, args);
          };
          window.addEventListener('error', (e) => {
            logs.push({ type: 'error', content: e.message });
          });
          window.__getLogs = () => logs;
        <\/script>
      </body>
      </html>
    `

    if (previewRef.current) {
      previewRef.current.srcdoc = combinedCode
    }
    setPreviewKey((k) => k + 1)
    setConsoleOutput([])
  }, [html, css, js])

  const loadConsoleOutput = useCallback(() => {
    // 从 iframe 获取 console 输出
    if (previewRef.current) {
      try {
        const contentWin = previewRef.current.contentWindow as Window & { __getLogs?: () => { type: string; content: string }[] }
        const logs = contentWin.__getLogs?.() || []
        setConsoleOutput(logs.map((l) => `[${l.type}] ${l.content}`))
      } catch {}
    }
  }, [])

  const handleCopy = useCallback(() => {
    const code = activeTab === 'html' ? html : activeTab === 'css' ? css : js
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [activeTab, html, css, js])

  const handleSave = useCallback(() => {
    const project = {
      id: Date.now().toString(),
      html,
      css,
      js,
      name: `项目 ${savedProjects.length + 1}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [...savedProjects, JSON.stringify(project)]
    setSavedProjects(updated)
    alert('项目已保存！')
  }, [html, css, js, savedProjects])

  const handleDownload = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>CodePlayground Project</title>
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
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'project.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [html, css, js])

  const loadSample = useCallback((index: number) => {
    const sample = SAMPLE_PROJECTS[index]
    setHtml(sample.html)
    setCss(sample.css)
    setJs(sample.js)
  }, [])

  const currentCode = activeTab === 'html' ? html : activeTab === 'css' ? css : js
  const setCurrentCode = (code: string) => {
    if (activeTab === 'html') setHtml(code)
    else if (activeTab === 'css') setCss(code)
    else setJs(code)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e2e',
      color: '#cdd6f4',
    }}>
      {/* 顶部工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#181825',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LayersIcon style={{ width: 20, height: 20, color: '#89b4fa' }} />
          <span style={{ fontWeight: 600 }}>CodePlayground Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {SAMPLE_PROJECTS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(idx)}
              style={{
                padding: '6px 12px',
                background: 'rgba(137, 180, 250, 0.1)',
                border: '1px solid rgba(137, 180, 250, 0.3)',
                borderRadius: 6,
                color: '#89b4fa',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              示例 {idx + 1}
            </button>
          ))}
          <button
            onClick={runCode}
            style={{
              padding: '6px 16px',
              background: '#a6e3a1',
              border: 'none',
              borderRadius: 6,
              color: '#1e1e2e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600,
            }}
          >
            <PlayIcon style={{ width: 14, height: 14 }} />
            运行
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* 标签页 */}
          <div style={{
            display: 'flex',
            background: '#181825',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            {(['html', 'css', 'js'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px',
                  background: activeTab === tab ? '#1e1e2e' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #89b4fa' : '2px solid transparent',
                  color: activeTab === tab ? '#cdd6f4' : '#6c7086',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13,
                  fontFamily: 'monospace',
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* 编辑器 */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                padding: 16,
                background: '#1e1e2e',
                color: '#cdd6f4',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.6,
              }}
              spellCheck={false}
            />
          </div>

          {/* 编辑器底部工具栏 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#181825',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 12, color: '#6c7086' }}>
              {currentCode.length} 字符 · {currentCode.split('\n').length} 行
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(137, 180, 250, 0.1)',
                  border: '1px solid rgba(137, 180, 250, 0.3)',
                  borderRadius: 4,
                  color: '#89b4fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <CopyIcon style={{ width: 12, height: 12 }} />
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(249, 226, 175, 0.1)',
                  border: '1px solid rgba(249, 226, 175, 0.3)',
                  borderRadius: 4,
                  color: '#f9e2af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <SaveIcon style={{ width: 12, height: 12 }} />
                保存
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(166, 227, 161, 0.1)',
                  border: '1px solid rgba(166, 227, 161, 0.3)',
                  borderRadius: 4,
                  color: '#a6e3a1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <DownloadIcon style={{ width: 12, height: 12 }} />
                下载
              </button>
            </div>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 预览头部 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#181825',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 13, color: '#a6adc8' }}>预览效果</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setConsoleOutput([])
                  setTimeout(loadConsoleOutput, 500)
                }}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(137, 180, 250, 0.1)',
                  border: '1px solid rgba(137, 180, 250, 0.3)',
                  borderRadius: 4,
                  color: '#89b4fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <RotateCcwIcon style={{ width: 12, height: 12 }} />
                刷新
              </button>
              <button
                onClick={() => setShowConsole(!showConsole)}
                style={{
                  padding: '4px 8px',
                  background: showConsole ? 'rgba(249, 226, 175, 0.1)' : 'rgba(137, 180, 250, 0.1)',
                  border: `1px solid ${showConsole ? 'rgba(249, 226, 175, 0.3)' : 'rgba(137, 180, 250, 0.3)'}`,
                  borderRadius: 4,
                  color: showConsole ? '#f9e2af' : '#89b4fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                {showConsole ? <EyeOffIcon style={{ width: 12, height: 12 }} /> : <EyeIcon style={{ width: 12, height: 12 }} />}
                控制台
              </button>
            </div>
          </div>

          {/* 预览窗口 */}
          <div style={{ flex: showConsole ? 2 : 1 }}>
            <iframe
              ref={previewRef}
              key={previewKey}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white',
              }}
              onLoad={runCode}
            />
          </div>

          {/* 控制台 */}
          {showConsole && (
            <div style={{
              flex: 1,
              background: '#11111b',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              overflow: 'auto',
              padding: 12,
              fontFamily: 'monospace',
              fontSize: 12,
            }}>
              <div style={{ color: '#6c7086', marginBottom: 8 }}>Console Output:</div>
              {consoleOutput.length === 0 ? (
                <div style={{ color: '#6c7086' }}>
                  点击"运行"后，在此处查看 console.log 输出。
                </div>
              ) : (
                consoleOutput.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      marginBottom: 4,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 4,
                      color: log.includes('[error]') ? '#f38ba8' : log.includes('[warn]') ? '#f9e2af' : '#a6adc8',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {log}
                  </div>
                ))
              )}
              <button
                onClick={loadConsoleOutput}
                style={{
                  marginTop: 12,
                  padding: '4px 12px',
                  background: 'rgba(137, 180, 250, 0.1)',
                  border: '1px solid rgba(137, 180, 250, 0.3)',
                  borderRadius: 4,
                  color: '#89b4fa',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                读取 Console
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 16px',
        background: '#181825',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11,
        color: '#6c7086',
      }}>
        <span>HTML + CSS + JavaScript</span>
        <span>{savedProjects.length} 个已保存项目</span>
      </div>
    </div>
  )
})

export default CodePlaygroundPro
