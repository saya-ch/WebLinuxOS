import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { PlayIcon, DownloadIcon, CopyIcon, CheckIcon, CodeIcon, EyeIcon, FileCodeIcon, TrashIcon, MonitorIcon, Code2Icon, SmartphoneIcon, TabletIcon, SplitSquareHorizontalIcon } from '../icons'

const defaultHtml = `<div class="container">
  <h1>欢迎使用 WebIDE</h1>
  <p>在左侧编辑代码，右侧实时预览效果</p>
  <button onclick="greet()">点击我</button>
  <div id="output"></div>
</div>`

const defaultCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
}

p {
  color: #666;
  margin-bottom: 25px;
  font-size: 16px;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 30px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

#output {
  margin-top: 20px;
  padding: 15px;
  background: #f0f0ff;
  border-radius: 10px;
  min-height: 40px;
  color: #333;
}`

const defaultJs = `function greet() {
  const messages = [
    '你好，世界！ 👋',
    '欢迎来到 WebIDE！ 🚀',
    '开始你的创作之旅吧！ ✨',
    '代码改变世界！ 💻',
    '今天也要加油哦！ 💪'
  ];
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById('output').innerHTML = 
    '<strong>' + randomMsg + '</strong>';
}

console.log('WebIDE 已加载完成！');`

interface Snippet {
  id: string
  name: string
  html: string
  css: string
  js: string
}

const templates: Snippet[] = [
  { id: 'blank', name: '空白模板', html: '', css: '', js: '' },
  { id: 'welcome', name: '欢迎页面', html: defaultHtml, css: defaultCss, js: defaultJs },
  { id: 'counter', name: '计数器', html: `<div class="counter">
  <h1>计数器</h1>
  <div class="count" id="count">0</div>
  <div class="buttons">
    <button onclick="decrement()">-</button>
    <button onclick="reset()">重置</button>
    <button onclick="increment()">+</button>
  </div>
</div>`, css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: #1a1a2e;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.counter {
  text-align: center;
  color: white;
}

h1 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: #e0e0ff;
}

.count {
  font-size: 5rem;
  font-weight: bold;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

button {
  padding: 12px 25px;
  font-size: 1.2rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.05);
}`, js: `let count = 0;
const countEl = document.getElementById('count');

function increment() {
  count++;
  updateDisplay();
}

function decrement() {
  count--;
  updateDisplay();
}

function reset() {
  count = 0;
  updateDisplay();
}

function updateDisplay() {
  countEl.textContent = count;
  countEl.style.animation = 'none';
  countEl.offsetHeight;
  countEl.style.animation = 'bounce 0.3s';
}` },
  { id: 'clock', name: '数字时钟', html: `<div class="clock-container">
  <div class="date" id="date"></div>
  <div class="clock" id="clock"></div>
  <div class="greeting" id="greeting"></div>
</div>`, css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clock-container {
  text-align: center;
  color: white;
}

.date {
  font-size: 1.5rem;
  color: #888;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.clock {
  font-size: 6rem;
  font-weight: bold;
  letter-spacing: 5px;
  background: linear-gradient(135deg, #00d6c1, #7c6cf0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(124, 108, 240, 0.5);
}

.greeting {
  font-size: 1.2rem;
  color: #aaa;
  margin-top: 15px;
}`, js: `function updateClock() {
  const now = new Date();
  
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString('zh-CN', dateOptions);
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = hours + ':' + minutes + ':' + seconds;
  
  const hour = now.getHours();
  let greeting = '';
  if (hour < 6) greeting = '夜深了，注意休息 🌙';
  else if (hour < 9) greeting = '早上好，新的一天开始了！ ☀️';
  else if (hour < 12) greeting = '上午好，工作顺利！ 💼';
  else if (hour < 14) greeting = '中午好，记得吃饭哦！ 🍱';
  else if (hour < 18) greeting = '下午好，继续加油！ 💪';
  else if (hour < 22) greeting = '晚上好，放松一下吧！ 🌆';
  else greeting = '夜深了，早点休息 🌃';
  document.getElementById('greeting').textContent = greeting;
}

updateClock();
setInterval(updateClock, 1000);` },
]

type ViewMode = 'split' | 'code' | 'preview'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'

const WebIDE = memo(function WebIDE() {
  const [html, setHtml] = useState(defaultHtml)
  const [css, setCss] = useState(defaultCss)
  const [js, setJs] = useState(defaultJs)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [autoRun, setAutoRun] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runCode = useCallback(() => {
    if (!iframeRef.current) return
    
    const consoleCapture = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          function sendToParent(type, args) {
            window.parent.postMessage({
              type: 'webide-console',
              logType: type,
              message: Array.from(args).map(a => 
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              ).join(' ')
            }, '*');
          }
          
          console.log = function() { sendToParent('log', arguments); originalLog.apply(console, arguments); };
          console.error = function() { sendToParent('error', arguments); originalError.apply(console, arguments); };
          console.warn = function() { sendToParent('warn', arguments); originalWarn.apply(console, arguments); };
          
          window.onerror = function(msg, url, line, col, error) {
            sendToParent('error', [msg + ' (line ' + line + ')']);
            return false;
          };
        })();
      </script>
    `
    
    const src = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
          ${consoleCapture}
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `
    
    iframeRef.current.srcdoc = src
    setConsoleOutput([])
  }, [html, css, js])

  useEffect(() => {
    if (autoRun) {
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current)
      autoRunTimer.current = setTimeout(runCode, 500)
    }
    return () => {
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current)
    }
  }, [html, css, js, autoRun, runCode])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'webide-console') {
        setConsoleOutput(prev => [...prev, `[${e.data.logType}] ${e.data.message}`].slice(-50))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const copyCode = useCallback(() => {
    const fullCode = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}\n\n// JavaScript\n${js}`
    navigator.clipboard.writeText(fullCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [html, css, js])

  const downloadCode = useCallback(() => {
    const fullCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebIDE Project</title>
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
    const blob = new Blob([fullCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'webide-project.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [html, css, js])

  const loadTemplate = useCallback((template: Snippet) => {
    setHtml(template.html)
    setCss(template.css)
    setJs(template.js)
    setShowTemplates(false)
  }, [])

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'mobile': return '375px'
      case 'tablet': return '768px'
      default: return '100%'
    }
  }

  const getActiveEditor = () => {
    switch (activeTab) {
      case 'html': return { value: html, setValue: setHtml, lang: 'HTML' }
      case 'css': return { value: css, setValue: setCss, lang: 'CSS' }
      case 'js': return { value: js, setValue: setJs, lang: 'JavaScript' }
    }
  }

  const editor = getActiveEditor()

  return (
    <div className="webide-container">
      <div className="webide-toolbar">
        <div className="webide-toolbar-left">
          <div className="webide-logo">
            <Code2Icon size={18} />
            <span>WebIDE</span>
          </div>
          <div className="webide-template-btn" onClick={() => setShowTemplates(!showTemplates)}>
            <FileCodeIcon size={14} />
            <span>模板</span>
            {showTemplates && (
              <div className="webide-template-dropdown" onClick={(e) => e.stopPropagation()}>
                {templates.map(t => (
                  <div 
                    key={t.id} 
                    className="webide-template-item"
                    onClick={() => loadTemplate(t)}
                  >
                    {t.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="webide-toolbar-center">
          <div className="webide-device-toggle">
            <button 
              className={`device-btn ${deviceMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setDeviceMode('desktop')}
              title="桌面视图"
            >
              <MonitorIcon size={14} />
            </button>
            <button 
              className={`device-btn ${deviceMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setDeviceMode('tablet')}
              title="平板视图"
            >
              <TabletIcon size={14} />
            </button>
            <button 
              className={`device-btn ${deviceMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setDeviceMode('mobile')}
              title="手机视图"
            >
              <SmartphoneIcon size={14} />
            </button>
          </div>
        </div>
        
        <div className="webide-toolbar-right">
          <label className="webide-autorun">
            <input 
              type="checkbox" 
              checked={autoRun} 
              onChange={(e) => setAutoRun(e.target.checked)} 
            />
            <span>自动运行</span>
          </label>
          <button className="webide-btn" onClick={runCode}>
            <PlayIcon size={14} />
            <span>运行</span>
          </button>
          <button className="webide-btn" onClick={copyCode}>
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
          <button className="webide-btn" onClick={downloadCode}>
            <DownloadIcon size={14} />
            <span>下载</span>
          </button>
          <div className="webide-view-toggle">
            <button 
              className={`view-btn ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
              title="仅代码"
            >
              <CodeIcon size={14} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="分屏"
            >
              <SplitSquareHorizontalIcon size={14} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="仅预览"
            >
              <EyeIcon size={14} />
            </button>
          </div>
        </div>
      </div>
      
      <div className={`webide-main ${viewMode}`}>
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className="webide-editor-pane">
            <div className="webide-tabs">
              <button 
                className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
                onClick={() => setActiveTab('html')}
              >
                index.html
              </button>
              <button 
                className={`tab-btn ${activeTab === 'css' ? 'active' : ''}`}
                onClick={() => setActiveTab('css')}
              >
                style.css
              </button>
              <button 
                className={`tab-btn ${activeTab === 'js' ? 'active' : ''}`}
                onClick={() => setActiveTab('js')}
              >
                script.js
              </button>
            </div>
            <div className="webide-editor-wrapper">
              <textarea
                className="webide-editor"
                value={editor.value}
                onChange={(e) => editor.setValue(e.target.value)}
                spellCheck={false}
                placeholder={`在此输入${editor.lang}代码...`}
              />
            </div>
          </div>
        )}
        
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="webide-preview-pane">
            <div className="webide-preview-header">
              <EyeIcon size={14} />
              <span>预览</span>
            </div>
            <div className="webide-preview-wrapper">
              <div 
                className="webide-preview-frame"
                style={{ width: getDeviceWidth() }}
              >
                <iframe
                  ref={iframeRef}
                  className="webide-iframe"
                  title="WebIDE Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
            {consoleOutput.length > 0 && (
              <div className="webide-console">
                <div className="webide-console-header">
                  <span>控制台</span>
                  <button 
                    className="console-clear"
                    onClick={() => setConsoleOutput([])}
                    title="清空控制台"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
                <div className="webide-console-output">
                  {consoleOutput.map((line, i) => (
                    <div key={i} className={`console-line ${line.includes('[error]') ? 'error' : line.includes('[warn]') ? 'warn' : ''}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default WebIDE
