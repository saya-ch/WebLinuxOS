import { useState, useCallback, memo, useMemo, useEffect } from 'react'
import { Code, FileText, Zap, Brain, Sparkles, Play, Copy, Check, ChevronRight, Folder, Search, Settings, Clock, TrendingUp, Coffee, Lightbulb, Rocket, Shield, Palette } from 'lucide-react'
import '../styles/smart-dev-flow.css'

type ToolId = 'dashboard' | 'code-assistant' | 'api-tester' | 'snippet-lab' | 'regex-tester' | 'json-tools' | 'color-lab' | 'workflow'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  tags: string[]
  createdAt: number
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: string
  status: 'pending' | 'active' | 'done'
}

const defaultSnippets: Snippet[] = [
  {
    id: '1',
    title: '防抖函数',
    language: 'javascript',
    code: 'function debounce(fn, delay) {\n  let timer = null\n  return function(...args) {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn.apply(this, args), delay)\n  }\n}',
    tags: ['工具函数', '性能优化'],
    createdAt: Date.now() - 86400000
  },
  {
    id: '2',
    title: '深拷贝',
    language: 'javascript',
    code: 'function deepClone(obj, map = new WeakMap()) {\n  if (obj === null || typeof obj !== "object") return obj\n  if (map.has(obj)) return map.get(obj)\n  const clone = Array.isArray(obj) ? [] : {}\n  map.set(obj, clone)\n  for (const key in obj) {\n    if (obj.hasOwnProperty(key)) {\n      clone[key] = deepClone(obj[key], map)\n    }\n  }\n  return clone\n}',
    tags: ['工具函数', '基础'],
    createdAt: Date.now() - 172800000
  },
  {
    id: '3',
    title: 'React useFetch Hook',
    language: 'typescript',
    code: 'import { useState, useEffect } from "react"\n\nexport function useFetch<T>(url: string, options?: RequestInit) {\n  const [data, setData] = useState<T | null>(null)\n  const [loading, setLoading] = useState(true)\n  const [error, setError] = useState<Error | null>(null)\n\n  useEffect(() => {\n    const controller = new AbortController()\n    setLoading(true)\n    fetch(url, { ...options, signal: controller.signal })\n      .then(res => res.json())\n      .then(setData)\n      .catch(setError)\n      .finally(() => setLoading(false))\n    return () => controller.abort()\n  }, [url])\n\n  return { data, loading, error }\n}',
    tags: ['React', 'Hooks', '网络请求'],
    createdAt: Date.now() - 259200000
  }
]

const defaultWorkflows: WorkflowStep[] = [
  { id: '1', title: '需求分析', description: '明确功能需求和技术方案', icon: '📋', status: 'done' },
  { id: '2', title: '架构设计', description: '设计系统架构和数据模型', icon: '🏗️', status: 'done' },
  { id: '3', title: '编码实现', description: '编写核心功能代码', icon: '💻', status: 'active' },
  { id: '4', title: '代码审查', description: '检查代码质量和规范', icon: '🔍', status: 'pending' },
  { id: '5', title: '测试验证', description: '单元测试和集成测试', icon: '🧪', status: 'pending' },
  { id: '6', title: '部署上线', description: '构建部署和发布', icon: '🚀', status: 'pending' },
]

const toolDefinitions: { id: ToolId; name: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: 'dashboard', name: '工作台', icon: <Sparkles size={20} />, description: '开发概览和快捷操作', color: '#7c6cf0' },
  { id: 'code-assistant', name: 'AI代码助手', icon: <Brain size={20} />, description: '智能代码生成和优化建议', color: '#00d6c1' },
  { id: 'api-tester', name: 'API测试', icon: <Zap size={20} />, description: 'REST API 快速测试', color: '#ff7a59' },
  { id: 'snippet-lab', name: '代码片段', icon: <Code size={20} />, description: '收藏和管理常用代码片段', color: '#5ac8fa' },
  { id: 'regex-tester', name: '正则测试', icon: <Search size={20} />, description: '正则表达式在线测试', color: '#a855f7' },
  { id: 'json-tools', name: 'JSON工具', icon: <FileText size={20} />, description: '格式化、验证、转换', color: '#f59e0b' },
  { id: 'color-lab', name: '调色实验室', icon: <Palette size={20} />, description: '颜色选择和调色板生成', color: '#ec4899' },
  { id: 'workflow', name: '工作流', icon: <Rocket size={20} />, description: '开发工作流追踪和管理', color: '#10b981' },
]

const codingTips = [
  '使用 `const` 而不是 `let` 来声明不会重新赋值的变量',
  '函数参数最好不超过3个，太多的话考虑用对象参数',
  '给函数起一个能准确描述其作用的名字',
  '代码是写给人看的，顺便能在机器上运行',
  '先让代码工作，再让代码正确，最后让代码快',
  '好的代码自身就是最好的文档',
  'DRY原则：不要重复你自己',
  '单一职责原则：每个函数只做一件事',
]

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: string; trend?: string; color: string }) {
  return (
    <div className="sdf-stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="sdf-stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
      <div className="sdf-stat-content">
        <div className="sdf-stat-label">{label}</div>
        <div className="sdf-stat-value">{value}</div>
        {trend && <div className="sdf-stat-trend">{trend}</div>}
      </div>
    </div>
  )
}

function DashboardView() {
  const [currentTip, setCurrentTip] = useState(0)
  const codingTime = { hours: 3, minutes: 42 }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % codingTips.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Sparkles size={20} style={{ color: '#7c6cf0' }} />
          开发者工作台
        </h2>
        <p className="sdf-section-subtitle">欢迎回来，今天也要写出优雅的代码 ✨</p>
      </div>

      <div className="sdf-stats-grid">
        <StatCard icon={<Code size={18} />} label="代码片段" value="128" trend="+12 本周" color="#7c6cf0" />
        <StatCard icon={<Clock size={18} />} label="今日编码" value={`${codingTime.hours}h ${codingTime.minutes}m`} trend="专注模式" color="#00d6c1" />
        <StatCard icon={<Check size={18} />} label="完成任务" value="24" trend="+5 今日" color="#10b981" />
        <StatCard icon={<Coffee size={18} />} label="咖啡杯数" value="3" trend="该休息了 ☕" color="#f59e0b" />
      </div>

      <div className="sdf-two-col">
        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3><Lightbulb size={18} /> 编程小贴士</h3>
          </div>
          <div className="sdf-tip-container">
            <div className="sdf-tip-text" key={currentTip}>
              💡 {codingTips[currentTip]}
            </div>
          </div>
          <div className="sdf-tip-dots">
            {codingTips.map((_, i) => (
              <span key={i} className={`sdf-tip-dot ${i === currentTip ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3><TrendingUp size={18} /> 快捷操作</h3>
          </div>
          <div className="sdf-quick-actions">
            {toolDefinitions.slice(1).map(tool => (
              <button key={tool.id} className="sdf-quick-action-btn" style={{ '--tool-color': tool.color } as React.CSSProperties}>
                <span className="sdf-quick-action-icon">{tool.icon}</span>
                <span className="sdf-quick-action-name">{tool.name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sdf-card">
        <div className="sdf-card-header">
          <h3><Folder size={18} /> 最近代码片段</h3>
          <button className="sdf-link-btn">查看全部</button>
        </div>
        <div className="sdf-snippet-list">
          {defaultSnippets.slice(0, 3).map(snippet => (
            <div key={snippet.id} className="sdf-snippet-item">
              <div className="sdf-snippet-icon" style={{ background: '#7c6cf020', color: '#7c6cf0' }}>
                <Code size={16} />
              </div>
              <div className="sdf-snippet-info">
                <div className="sdf-snippet-title">{snippet.title}</div>
                <div className="sdf-snippet-meta">
                  <span className="sdf-snippet-lang">{snippet.language}</span>
                  <span className="sdf-snippet-date">{new Date(snippet.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <button className="sdf-icon-btn"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CodeAssistantView() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; code?: string }[]>([
    { role: 'assistant', content: '你好！我是你的AI代码助手 🤖 我可以帮你：\n\n• 生成代码片段\n• 解释代码逻辑\n• 优化现有代码\n• 查找bug和问题\n\n请告诉我你需要什么帮助？' }
  ])
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(() => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const responses = [
        { content: '好的，我来帮你实现这个功能。以下是一个简洁高效的实现：', code: '// 示例代码\nfunction helloWorld(name: string): string {\n  return `Hello, ${name}! 👋`\n}\n\nconsole.log(helloWorld("开发者"))' },
        { content: '这段代码可以这样优化，提升可读性和性能：', code: '// 优化前\nconst result = arr.filter(x => x > 0).map(x => x * 2)\n\n// 优化后 - 单次遍历\nconst result: number[] = []\nfor (const x of arr) {\n  if (x > 0) result.push(x * 2)\n}' },
        { content: '我发现了一个潜在的问题，建议这样修改：', code: '// 问题：内存泄漏\nuseEffect(() => {\n  const timer = setInterval(() => {\n    // ...\n  }, 1000)\n  // 缺少清理函数！\n}, [])\n\n// 修复：添加清理函数\nuseEffect(() => {\n  const timer = setInterval(() => {\n    // ...\n  }, 1000)\n  return () => clearInterval(timer) // ✅\n}, [])' },
      ]
      const response = responses[Math.floor(Math.random() * responses.length)]
      setMessages(prev => [...prev, { role: 'assistant', ...response }])
      setLoading(false)
    }, 1200)
  }, [input, loading])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Brain size={20} style={{ color: '#00d6c1' }} />
          AI 代码助手
        </h2>
        <p className="sdf-section-subtitle">智能生成、解释和优化代码</p>
      </div>

      <div className="sdf-chat-container">
        <div className="sdf-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`sdf-chat-msg ${msg.role}`}>
              <div className="sdf-chat-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="sdf-chat-bubble">
                <div className="sdf-chat-content">{msg.content.split('\n').map((line, j) => <div key={j}>{line}</div>)}</div>
                {msg.code && (
                  <pre className="sdf-code-block">
                    <code>{msg.code}</code>
                    <button className="sdf-copy-btn"><Copy size={12} /> 复制</button>
                  </pre>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="sdf-chat-msg assistant">
              <div className="sdf-chat-avatar">🤖</div>
              <div className="sdf-chat-bubble sdf-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div className="sdf-chat-input">
          <textarea
            className="sdf-textarea"
            placeholder="输入你的问题，比如：帮我写一个防抖函数..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            rows={2}
          />
          <button className="sdf-send-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
            <Play size={16} />
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

function SnippetLabView() {
  const [snippets] = useState<Snippet[]>(defaultSnippets)
  const [selectedId, setSelectedId] = useState<string>(defaultSnippets[0].id)
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState('')

  const filteredSnippets = useMemo(() => {
    if (!filter) return snippets
    const q = filter.toLowerCase()
    return snippets.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.language.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [snippets, filter])

  const selectedSnippet = snippets.find(s => s.id === selectedId)

  const handleCopy = useCallback(() => {
    if (selectedSnippet) {
      navigator.clipboard.writeText(selectedSnippet.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [selectedSnippet])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Code size={20} style={{ color: '#5ac8fa' }} />
          代码片段库
        </h2>
        <p className="sdf-section-subtitle">收藏和管理你常用的代码片段</p>
      </div>

      <div className="sdf-split-view">
        <div className="sdf-sidebar">
          <div className="sdf-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="搜索片段..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <div className="sdf-snippet-sidebar-list">
            {filteredSnippets.map(snippet => (
              <div
                key={snippet.id}
                className={`sdf-snippet-sidebar-item ${selectedId === snippet.id ? 'active' : ''}`}
                onClick={() => setSelectedId(snippet.id)}
              >
                <div className="sdf-snippet-sidebar-title">{snippet.title}</div>
                <div className="sdf-snippet-sidebar-meta">
                  <span className="sdf-lang-badge">{snippet.language}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sdf-main-content">
          {selectedSnippet ? (
            <>
              <div className="sdf-detail-header">
                <div>
                  <h3 className="sdf-detail-title">{selectedSnippet.title}</h3>
                  <div className="sdf-detail-tags">
                    {selectedSnippet.tags.map(tag => (
                      <span key={tag} className="sdf-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <button className="sdf-primary-btn" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制' : '复制代码'}
                </button>
              </div>
              <pre className="sdf-code-view">
                <code>{selectedSnippet.code}</code>
              </pre>
            </>
          ) : (
            <div className="sdf-empty-state">
              <Code size={48} />
              <p>选择一个代码片段查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ApiTesterView() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ code: number; text: string; time: number } | null>(null)
  const [requestBody, setRequestBody] = useState('')
  const [activeTab, setActiveTab] = useState<'params' | 'body' | 'headers'>('params')

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

  const handleSend = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setResponse(null)
    setStatus(null)
    const startTime = Date.now()

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
        options.body = requestBody
      }
      const res = await fetch(url, options)
      const elapsed = Date.now() - startTime
      setStatus({ code: res.status, text: res.statusText, time: elapsed })
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponse(JSON.stringify(json, null, 2))
      } catch {
        setResponse(text)
      }
    } catch (err) {
      setStatus({ code: 0, text: 'Error', time: Date.now() - startTime })
      setResponse(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }, [method, url, requestBody])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Zap size={20} style={{ color: '#ff7a59' }} />
          API 测试工具
        </h2>
        <p className="sdf-section-subtitle">快速测试 REST API 接口</p>
      </div>

      <div className="sdf-request-bar">
        <select className="sdf-method-select" value={method} onChange={e => setMethod(e.target.value)}>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          className="sdf-url-input"
          type="text"
          placeholder="输入请求 URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="sdf-send-btn" onClick={handleSend} disabled={loading}>
          {loading ? '发送中...' : '发送'}
        </button>
      </div>

      <div className="sdf-tabs">
        <button className={`sdf-tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Params</button>
        <button className={`sdf-tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</button>
        <button className={`sdf-tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</button>
      </div>

      {activeTab === 'body' && (
        <textarea
          className="sdf-textarea sdf-body-textarea"
          placeholder='{"key": "value"}'
          value={requestBody}
          onChange={e => setRequestBody(e.target.value)}
          rows={6}
        />
      )}

      {activeTab === 'params' && (
        <div className="sdf-card">
          <p className="sdf-muted-text">URL 查询参数会自动从 URL 中解析</p>
        </div>
      )}

      {activeTab === 'headers' && (
        <div className="sdf-card">
          <p className="sdf-muted-text">默认 Content-Type: application/json</p>
        </div>
      )}

      <div className="sdf-response-section">
        <div className="sdf-response-header">
          <span>响应</span>
          {status && (
            <div className="sdf-response-status">
              <span className={`sdf-status-badge ${status.code >= 200 && status.code < 300 ? 'success' : status.code >= 400 ? 'error' : 'warning'}`}>
                {status.code} {status.text}
              </span>
              <span className="sdf-response-time">{status.time}ms</span>
            </div>
          )}
        </div>
        <div className="sdf-response-body">
          {loading ? (
            <div className="sdf-loading">加载中...</div>
          ) : response ? (
            <pre className="sdf-response-pre"><code>{response}</code></pre>
          ) : (
            <div className="sdf-empty-state small">
              <Zap size={32} />
              <p>发送请求查看响应结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RegexTesterView() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+)\\.(\\w+)')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('联系我们：hello@example.com 或 support@test.org\n更多邮箱：admin@site.net, info@company.com')
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<RegExpMatchArray[]>([])

  useEffect(() => {
    try {
      setError(null)
      const regex = new RegExp(pattern, flags)
      const allMatches: RegExpMatchArray[] = []
      if (flags.includes('g')) {
        let match
        while ((match = regex.exec(testString)) !== null) {
          allMatches.push(match)
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        const m = testString.match(regex)
        if (m) allMatches.push(m)
      }
      setMatches(allMatches)
    } catch (e) {
      setError(e instanceof Error ? e.message : '无效的正则表达式')
      setMatches([])
    }
  }, [pattern, flags, testString])

  const highlightedText = useMemo(() => {
    if (!pattern || error) return testString
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      let match
      while ((match = regex.exec(testString)) !== null) {
        if (match.index > lastIndex) {
          parts.push(testString.slice(lastIndex, match.index))
        }
        parts.push(<mark key={match.index} className="sdf-highlight">{match[0]}</mark>)
        lastIndex = match.index + match[0].length
        if (match.index === regex.lastIndex) regex.lastIndex++
      }
      if (lastIndex < testString.length) {
        parts.push(testString.slice(lastIndex))
      }
      return parts
    } catch {
      return testString
    }
  }, [pattern, flags, testString, error])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Search size={20} style={{ color: '#a855f7' }} />
          正则表达式测试器
        </h2>
        <p className="sdf-section-subtitle">实时测试和调试正则表达式</p>
      </div>

      <div className="sdf-regex-input">
        <div className="sdf-regex-pattern-row">
          <span className="sdf-regex-delimiter">/</span>
          <input
            type="text"
            className="sdf-regex-input-field"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="正则表达式"
          />
          <span className="sdf-regex-delimiter">/</span>
          <input
            type="text"
            className="sdf-flags-input"
            value={flags}
            onChange={e => setFlags(e.target.value)}
            placeholder="flags"
          />
        </div>
        {error && <div className="sdf-error-text">⚠️ {error}</div>}
      </div>

      <div className="sdf-two-col">
        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>测试文本</h3>
          </div>
          <textarea
            className="sdf-textarea"
            value={testString}
            onChange={e => setTestString(e.target.value)}
            rows={10}
            placeholder="输入要测试的文本..."
          />
        </div>

        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>高亮结果</h3>
            <span className="sdf-match-count">{matches.length} 个匹配</span>
          </div>
          <div className="sdf-highlight-result">
            {highlightedText}
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>匹配详情</h3>
          </div>
          <div className="sdf-match-list">
            {matches.map((match, i) => (
              <div key={i} className="sdf-match-item">
                <span className="sdf-match-index">匹配 {i + 1}</span>
                <code className="sdf-match-value">{match[0]}</code>
                {match.length > 1 && (
                  <div className="sdf-capture-groups">
                    {Array.from(match).slice(1).map((group, j) => (
                      <span key={j} className="sdf-capture-group">
                        组 {j + 1}: <code>{group || '(empty)'}</code>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JsonToolsView() {
  const [input, setInput] = useState('{\n  "name": "WebLinuxOS",\n  "version": "15.3.0",\n  "features": ["终端", "文件管理器", "代码编辑器"],\n  "active": true\n}')
  const [tab, setTab] = useState<'format' | 'validate' | 'minify'>('format')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setError(null)
      const parsed = JSON.parse(input)
      if (tab === 'format') {
        setOutput(JSON.stringify(parsed, null, 2))
      } else if (tab === 'minify') {
        setOutput(JSON.stringify(parsed))
      } else {
        setOutput('✓ 有效的 JSON 格式\n\n' + JSON.stringify(parsed, null, 2))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析错误')
      setOutput('')
    }
  }, [input, tab])

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <FileText size={20} style={{ color: '#f59e0b' }} />
          JSON 工具集
        </h2>
        <p className="sdf-section-subtitle">格式化、验证和压缩 JSON</p>
      </div>

      <div className="sdf-tabs">
        <button className={`sdf-tab ${tab === 'format' ? 'active' : ''}`} onClick={() => setTab('format')}>格式化</button>
        <button className={`sdf-tab ${tab === 'validate' ? 'active' : ''}`} onClick={() => setTab('validate')}>验证</button>
        <button className={`sdf-tab ${tab === 'minify' ? 'active' : ''}`} onClick={() => setTab('minify')}>压缩</button>
      </div>

      <div className="sdf-two-col">
        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>输入</h3>
          </div>
          <textarea
            className="sdf-textarea sdf-monospace"
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={16}
            placeholder="粘贴 JSON 数据..."
          />
        </div>

        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>输出</h3>
            <button className="sdf-icon-btn" onClick={() => output && navigator.clipboard.writeText(output)}>
              <Copy size={14} />
            </button>
          </div>
          {error ? (
            <div className="sdf-error-block">
              <Shield size={20} />
              <div>
                <strong>解析错误</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <pre className="sdf-output-pre"><code>{output}</code></pre>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorLabView() {
  const [color, setColor] = useState('#7c6cf0')
  const [shades, setShades] = useState<string[]>([])

  useEffect(() => {
    const generateShades = (hex: string) => {
      const result: string[] = []
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      
      for (let i = 0; i <= 9; i++) {
        const factor = i / 9
        if (factor < 0.5) {
          const k = factor * 2
          result.push(`rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`)
        } else {
          const k = (factor - 0.5) * 2
          result.push(`rgb(${Math.round(r + (255 - r) * k)}, ${Math.round(g + (255 - g) * k)}, ${Math.round(b + (255 - b) * k)})`)
        }
      }
      return result
    }
    setShades(generateShades(color))
  }, [color])

  const complementaryColor = useMemo(() => {
    const r = 255 - parseInt(color.slice(1, 3), 16)
    const g = 255 - parseInt(color.slice(3, 5), 16)
    const b = 255 - parseInt(color.slice(5, 7), 16)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }, [color])

  const palettes = [
    { name: 'Analogous', colors: ['#5ac8fa', '#7c6cf0', '#a855f7'] },
    { name: 'Triadic', colors: ['#7c6cf0', '#f59e0b', '#10b981'] },
    { name: 'Split Complementary', colors: ['#7c6cf0', '#f59e0b', '#ec4899'] },
  ]

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Palette size={20} style={{ color: '#ec4899' }} />
          调色实验室
        </h2>
        <p className="sdf-section-subtitle">探索色彩搭配和调色板生成</p>
      </div>

      <div className="sdf-color-main">
        <div className="sdf-color-picker-card">
          <div className="sdf-color-preview" style={{ background: color }} />
          <div className="sdf-color-inputs">
            <div className="sdf-color-input-row">
              <label>HEX</label>
              <input type="text" value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sdf-color-picker-native" />
          </div>
        </div>

        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>色阶 (50-900)</h3>
          </div>
          <div className="sdf-shades-row">
            {shades.map((shade, i) => (
              <div key={i} className="sdf-shade-item" style={{ background: shade }} title={`${i * 100}`}>
                <span className="sdf-shade-label">{i * 100}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sdf-two-col">
        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>互补色</h3>
          </div>
          <div className="sdf-complementary">
            <div className="sdf-color-swatch" style={{ background: color }} />
            <div className="sdf-color-arrow">→</div>
            <div className="sdf-color-swatch" style={{ background: complementaryColor }} />
          </div>
          <p className="sdf-color-code">{complementaryColor}</p>
        </div>

        <div className="sdf-card">
          <div className="sdf-card-header">
            <h3>配色方案</h3>
          </div>
          <div className="sdf-palettes">
            {palettes.map(palette => (
              <div key={palette.name} className="sdf-palette">
                <div className="sdf-palette-name">{palette.name}</div>
                <div className="sdf-palette-colors">
                  {palette.colors.map((c, i) => (
                    <div key={i} className="sdf-palette-color" style={{ background: c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkflowView() {
  const [steps] = useState<WorkflowStep[]>(defaultWorkflows)
  const [activeStep, setActiveStep] = useState('3')

  const handleStepClick = useCallback((id: string) => {
    setActiveStep(id)
  }, [])

  const completedCount = steps.filter(s => s.status === 'done').length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="sdf-view">
      <div className="sdf-section-header">
        <h2 className="sdf-section-title">
          <Rocket size={20} style={{ color: '#10b981' }} />
          开发工作流
        </h2>
        <p className="sdf-section-subtitle">追踪和管理你的开发进度</p>
      </div>

      <div className="sdf-card">
        <div className="sdf-progress-header">
          <div>
            <div className="sdf-progress-title">项目进度</div>
            <div className="sdf-progress-subtitle">{completedCount} / {steps.length} 步骤完成</div>
          </div>
          <div className="sdf-progress-percent">{progress}%</div>
        </div>
        <div className="sdf-progress-bar">
          <div className="sdf-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="sdf-card">
        <div className="sdf-card-header">
          <h3>工作流步骤</h3>
        </div>
        <div className="sdf-workflow-timeline">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`sdf-workflow-step ${step.status} ${activeStep === step.id ? 'active' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="sdf-workflow-icon">{step.icon}</div>
              <div className="sdf-workflow-line">
                {i < steps.length - 1 && <div className={`sdf-workflow-line-fill ${step.status === 'done' ? 'done' : ''}`} />}
              </div>
              <div className="sdf-workflow-content">
                <div className="sdf-workflow-title">{step.title}</div>
                <div className="sdf-workflow-desc">{step.description}</div>
                {activeStep === step.id && step.status === 'active' && (
                  <button className="sdf-primary-btn small">标记完成</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SmartDevFlow = memo(function SmartDevFlow() {
  const [activeTool, setActiveTool] = useState<ToolId>('dashboard')

  const renderView = () => {
    switch (activeTool) {
      case 'dashboard': return <DashboardView />
      case 'code-assistant': return <CodeAssistantView />
      case 'api-tester': return <ApiTesterView />
      case 'snippet-lab': return <SnippetLabView />
      case 'regex-tester': return <RegexTesterView />
      case 'json-tools': return <JsonToolsView />
      case 'color-lab': return <ColorLabView />
      case 'workflow': return <WorkflowView />
      default: return <DashboardView />
    }
  }

  return (
    <div className="smart-dev-flow">
      <div className="sdf-sidebar-nav">
        <div className="sdf-brand">
          <div className="sdf-brand-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="sdf-brand-title">DevFlow</div>
            <div className="sdf-brand-subtitle">智能开发工作台</div>
          </div>
        </div>

        <nav className="sdf-nav">
          {toolDefinitions.map(tool => (
            <button
              key={tool.id}
              className={`sdf-nav-item ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              style={{ '--tool-color': tool.color } as React.CSSProperties}
            >
              <span className="sdf-nav-icon">{tool.icon}</span>
              <span className="sdf-nav-text">
                <span className="sdf-nav-name">{tool.name}</span>
                <span className="sdf-nav-desc">{tool.description}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sdf-sidebar-footer">
          <button className="sdf-settings-btn">
            <Settings size={16} />
            设置
          </button>
        </div>
      </div>

      <div className="sdf-content">
        {renderView()}
      </div>
    </div>
  )
})

export default SmartDevFlow
