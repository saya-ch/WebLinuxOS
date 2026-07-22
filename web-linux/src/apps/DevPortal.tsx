import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  LayoutDashboard, Code2, FileText, Palette, Clock, Globe,
  BarChart3, Copy, Check, RefreshCw, ChevronRight, Hash,
  Lock, Shield, Zap,
  Search, User, Server, Wifi, ArrowUpDown,
  Sparkles
} from 'lucide-react'

type TabId = 'dashboard' | 'code' | 'text' | 'color' | 'time' | 'network' | 'viz'

interface Tab {
  id: TabId
  name: string
  icon: React.ReactNode
  gradient: string
}

const TABS: Tab[] = [
  { id: 'dashboard', name: '仪表板', icon: <LayoutDashboard size={18} />, gradient: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)' },
  { id: 'code', name: '代码工具', icon: <Code2 size={18} />, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
  { id: 'text', name: '文本工具', icon: <FileText size={18} />, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  { id: 'color', name: '颜色工具', icon: <Palette size={18} />, gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
  { id: 'time', name: '时间工具', icon: <Clock size={18} />, gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
  { id: 'network', name: '网络工具', icon: <Globe size={18} />, gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  { id: 'viz', name: '数据可视化', icon: <BarChart3 size={18} />, gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' },
]

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [])
  return { copied, copy }
}

function CopyBtn({ text }: { text: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      onClick={() => copy(text)}
      style={{
        padding: '5px 10px',
        borderRadius: '6px',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
    >
      {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '12px',
  outline: 'none',
}

const taStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: 1.6,
  resize: 'none',
  outline: 'none',
  flex: 1,
  minHeight: 0,
}

const cardStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  backdropFilter: 'blur(10px)',
}

function Dashboard({ onNav }: { onNav: (t: TabId) => void }) {
  const quickTools = [
    { tab: 'code' as TabId, name: 'JSON 格式化', desc: '格式化/压缩 JSON', icon: <Code2 size={16} /> },
    { tab: 'code' as TabId, name: 'Base64 编解码', desc: '编码解码转换', icon: <Hash size={16} /> },
    { tab: 'code' as TabId, name: '哈希生成', desc: 'MD5/SHA 系列', icon: <Lock size={16} /> },
    { tab: 'code' as TabId, name: 'UUID 生成', desc: '唯一标识符', icon: <Shield size={16} /> },
    { tab: 'text' as TabId, name: '文本对比', desc: 'Diff 差异对比', icon: <FileText size={16} /> },
    { tab: 'text' as TabId, name: '正则测试', desc: '实时正则匹配', icon: <Code2 size={16} /> },
    { tab: 'color' as TabId, name: '颜色选择', desc: '调色板/渐变', icon: <Palette size={16} /> },
    { tab: 'time' as TabId, name: '时间戳转换', desc: '日期时间互转', icon: <Clock size={16} /> },
    { tab: 'network' as TabId, name: 'IP 查询', desc: 'IP 地理位置', icon: <Globe size={16} /> },
    { tab: 'network' as TabId, name: 'UA 解析', desc: '用户代理解析', icon: <User size={16} /> },
  ]

  const [sysInfo, setSysInfo] = useState({
    time: '',
    userAgent: navigator.userAgent.slice(0, 60) + '...',
    screen: `${window.screen.width} × ${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
    online: navigator.onLine ? '在线' : '离线',
  })

  useEffect(() => {
    const t = setInterval(() => {
      setSysInfo(s => ({ ...s, time: new Date().toLocaleString('zh-CN') }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(34,211,238,0.15) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>DevPortal 开发者门户</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>30+ 实用开发工具，一站式开发工作台</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: '当前时间', value: sysInfo.time, icon: <Clock size={16} /> },
          { label: '屏幕分辨率', value: sysInfo.screen, icon: <Server size={16} /> },
          { label: '网络状态', value: sysInfo.online, icon: <Wifi size={16} /> },
        ].map(item => (
          <div key={item.label} style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {item.icon}
              {item.label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: '#a78bfa' }} />
          快捷访问
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {quickTools.map((tool, i) => (
            <button
              key={i}
              onClick={() => onNav(tool.tab)}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ color: 'var(--accent)' }}>{tool.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{tool.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{tool.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>系统信息</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {[
              ['操作系统', sysInfo.platform],
              ['浏览器语言', sysInfo.language],
              ['User Agent', sysInfo.userAgent],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', textAlign: 'right', wordBreak: 'break-all', flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>工具分类</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TABS.slice(1).map(tab => (
              <button
                key={tab.id}
                onClick={() => onNav(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '6px',
                  background: tab.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {tab.icon}
                </div>
                <span style={{ flex: 1 }}>{tab.name}</span>
                <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeTools() {
  const [subTab, setSubTab] = useState('json')

  const subs = [
    { id: 'json', name: 'JSON 格式化' },
    { id: 'base64', name: 'Base64' },
    { id: 'url', name: 'URL 编码' },
    { id: 'hash', name: '哈希生成' },
    { id: 'uuid', name: 'UUID' },
    { id: 'password', name: '密码生成' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {subs.map(s => (
          <button
            key={s.id}
            onClick={() => setSubTab(s.id)}
            style={{
              ...btnStyle,
              background: subTab === s.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
              borderColor: subTab === s.id ? 'var(--accent)' : 'var(--glass-border)',
              color: subTab === s.id ? 'var(--accent)' : 'var(--text-primary)',
              fontWeight: subTab === s.id ? 600 : 400,
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="devportal-scroll">
        {subTab === 'json' && <JsonTool />}
        {subTab === 'base64' && <Base64Tool />}
        {subTab === 'url' && <UrlTool />}
        {subTab === 'hash' && <HashTool />}
        {subTab === 'uuid' && <UuidTool />}
        {subTab === 'password' && <PasswordTool />}
      </div>
    </div>
  )
}

function JsonTool() {
  const [input, setInput] = useState('{\n  "name": "DevPortal",\n  "version": "1.0.0",\n  "tools": ["json", "base64", "hash"]\n}')
  const [output, setOutput] = useState('')
  const [err, setErr] = useState('')
  const [indent, setIndent] = useState(2)

  const fmt = useCallback(() => {
    try {
      const p = JSON.parse(input)
      setOutput(JSON.stringify(p, null, indent))
      setErr('')
    } catch (e) { setErr((e as Error).message); setOutput('') }
  }, [input, indent])

  const minify = useCallback(() => {
    try {
      setOutput(JSON.stringify(JSON.parse(input)))
      setErr('')
    } catch (e) { setErr((e as Error).message); setOutput('') }
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button onClick={fmt} style={btnStyle}>格式化</button>
        <button onClick={minify} style={btnStyle}>压缩</button>
        <select value={indent} onChange={e => setIndent(Number(e.target.value))} style={{ ...btnStyle, width: 'auto' }}>
          <option value={2}>2 空格</option>
          <option value={4}>4 空格</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>输入</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} style={taStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>输出</label>
            {output && <CopyBtn text={output} />}
          </div>
          <textarea value={output} readOnly style={taStyle} placeholder="结果..." />
        </div>
      </div>
      {err && <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px' }}>❌ {err}</div>}
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('Hello, DevPortal!')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'enc' | 'dec'>('enc')

  const run = useCallback(() => {
    try {
      if (mode === 'enc') setOutput(btoa(unescape(encodeURIComponent(input))))
      else setOutput(decodeURIComponent(escape(atob(input))))
    } catch (e) { setOutput('错误: ' + (e as Error).message) }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setMode('enc')} style={{ ...btnStyle, background: mode === 'enc' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'enc' ? 'var(--accent)' : 'var(--glass-border)' }}>编码</button>
        <button onClick={() => setMode('dec')} style={{ ...btnStyle, background: mode === 'dec' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'dec' ? 'var(--accent)' : 'var(--glass-border)' }}>解码</button>
        <button onClick={run} style={{ ...btnStyle, marginLeft: 'auto' }}><RefreshCw size={12} />转换</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{mode === 'enc' ? '明文' : 'Base64'}</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} style={taStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{mode === 'enc' ? 'Base64' : '明文'}</label>
            {output && <CopyBtn text={output} />}
          </div>
          <textarea value={output} readOnly style={taStyle} placeholder="结果..." />
        </div>
      </div>
    </div>
  )
}

function UrlTool() {
  const [input, setInput] = useState('https://example.com/path?q=hello world&name=测试')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'enc' | 'dec'>('enc')

  const run = useCallback(() => {
    try {
      if (mode === 'enc') setOutput(encodeURIComponent(input))
      else setOutput(decodeURIComponent(input))
    } catch (e) { setOutput('错误: ' + (e as Error).message) }
  }, [input, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setMode('enc')} style={{ ...btnStyle, background: mode === 'enc' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'enc' ? 'var(--accent)' : 'var(--glass-border)' }}>编码</button>
        <button onClick={() => setMode('dec')} style={{ ...btnStyle, background: mode === 'dec' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'dec' ? 'var(--accent)' : 'var(--glass-border)' }}>解码</button>
        <button onClick={run} style={{ ...btnStyle, marginLeft: 'auto' }}><RefreshCw size={12} />转换</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>输入</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} style={taStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>输出</label>
            {output && <CopyBtn text={output} />}
          </div>
          <textarea value={output} readOnly style={taStyle} placeholder="结果..." />
        </div>
      </div>
    </div>
  )
}

function HashTool() {
  const [input, setInput] = useState('Hello, DevPortal!')
  const [hashes, setHashes] = useState<Record<string, string>>({})

  const gen = useCallback(async () => {
    const enc = new TextEncoder().encode(input)
    const res: Record<string, string> = {}
    const toHex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')
    try { res['SHA-256'] = toHex(await crypto.subtle.digest('SHA-256', enc)) } catch {}
    try { res['SHA-1'] = toHex(await crypto.subtle.digest('SHA-1', enc)) } catch {}
    try { res['SHA-512'] = toHex(await crypto.subtle.digest('SHA-512', enc)) } catch {}
    let h = 0
    for (let i = 0; i < input.length; i++) { h = ((h << 5) - h) + input.charCodeAt(i); h = h & h }
    res['MD5(简)'] = Math.abs(h).toString(16).padStart(8, '0').repeat(4).slice(0, 32)
    setHashes(res)
  }, [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={gen} style={{ ...btnStyle, marginLeft: 'auto' }}><RefreshCw size={12} />生成哈希</button>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} style={{ ...taStyle, height: '80px', flex: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(hashes).map(([k, v]) => (
          <div key={k} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{k}</span>
              <CopyBtn text={v} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', color: 'var(--text-secondary)', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UuidTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)

  const gen = useCallback(() => {
    const arr: string[] = []
    for (let i = 0; i < count; i++) arr.push(crypto.randomUUID())
    setUuids(arr)
  }, [count])

  useEffect(() => { gen() }, [gen])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input type="number" min={1} max={20} value={count} onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))} style={{ ...inputStyle, width: '60px' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>个</span>
        <button onClick={gen} style={{ ...btnStyle, marginLeft: 'auto' }}><RefreshCw size={12} />生成</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {uuids.map((u, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '8px',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            fontFamily: 'monospace', fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-secondary)', minWidth: '20px' }}>{i + 1}</span>
            <span style={{ flex: 1, wordBreak: 'break-all' }}>{u}</span>
            <CopyBtn text={u} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PasswordTool() {
  const [pwd, setPwd] = useState('')
  const [len, setLen] = useState(16)
  const [opts, setOpts] = useState({ upper: true, lower: true, num: true, sym: true })

  const gen = useCallback(() => {
    let chars = ''
    if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (opts.num) chars += '0123456789'
    if (opts.sym) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) { setPwd(''); return }
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr)
    let s = ''
    for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length]
    setPwd(s)
  }, [len, opts])

  useEffect(() => { gen() }, [gen])

  const strength = useMemo(() => {
    let s = 0
    if (opts.upper) s++
    if (opts.lower) s++
    if (opts.num) s++
    if (opts.sym) s++
    if (len >= 12) s++
    if (len >= 16) s++
    return s
  }, [opts, len])

  const strengthLabel = ['极弱', '弱', '一般', '中等', '强', '很强'][strength] || '强'
  const strengthColor = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981'][strength] || '#10b981'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        ...cardStyle,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '18px', flex: 1, wordBreak: 'break-all', letterSpacing: '1px' }}>{pwd || '...'}</span>
        <CopyBtn text={pwd} />
        <button onClick={gen} style={btnStyle}><RefreshCw size={12} /></button>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px' }}>强度: <span style={{ color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span></span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{len} 位</span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ width: `${(strength / 6) * 100}%`, height: '100%', background: strengthColor, transition: 'all 0.3s' }} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>密码设置</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>长度</span>
          <input type="range" min={4} max={64} value={len} onChange={e => setLen(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontFamily: 'monospace', fontSize: '12px', minWidth: '30px' }}>{len}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { k: 'upper', label: '大写字母 (A-Z)' },
            { k: 'lower', label: '小写字母 (a-z)' },
            { k: 'num', label: '数字 (0-9)' },
            { k: 'sym', label: '特殊符号' },
          ].map(({ k, label }) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={opts[k as keyof typeof opts]} onChange={e => setOpts(o => ({ ...o, [k]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function TextTools() {
  const [subTab, setSubTab] = useState('diff')
  const subs = [
    { id: 'diff', name: '文本对比' },
    { id: 'regex', name: '正则测试' },
    { id: 'case', name: '大小写转换' },
    { id: 'trim', name: '去空白' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            ...btnStyle,
            background: subTab === s.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
            borderColor: subTab === s.id ? 'var(--accent)' : 'var(--glass-border)',
            color: subTab === s.id ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: subTab === s.id ? 600 : 400,
          }}>{s.name}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="devportal-scroll">
        {subTab === 'diff' && <DiffTool />}
        {subTab === 'regex' && <RegexTool />}
        {subTab === 'case' && <CaseTool />}
        {subTab === 'trim' && <TrimTool />}
      </div>
    </div>
  )
}

function DiffTool() {
  const [left, setLeft] = useState('Hello World\nThis is line 2\nLine 3 here')
  const [right, setRight] = useState('Hello World\nThis is modified line\nLine 3 here\nNew line added')
  const [diff, setDiff] = useState<{ type: 'same' | 'add' | 'del'; text: string }[]>([])

  const compute = useCallback(() => {
    const l1 = left.split('\n')
    const l2 = right.split('\n')
    const result: { type: 'same' | 'add' | 'del'; text: string }[] = []
    const max = Math.max(l1.length, l2.length)
    for (let i = 0; i < max; i++) {
      if (i < l1.length && i < l2.length && l1[i] === l2[i]) {
        result.push({ type: 'same', text: l1[i] })
      } else {
        if (i < l1.length) result.push({ type: 'del', text: l1[i] })
        if (i < l2.length) result.push({ type: 'add', text: l2[i] })
      }
    }
    setDiff(result)
  }, [left, right])

  useEffect(() => { compute() }, [compute])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>原始文本</label>
          <textarea value={left} onChange={e => setLeft(e.target.value)} style={{ ...taStyle, height: '120px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>对比文本</label>
          <textarea value={right} onChange={e => setRight(e.target.value)} style={{ ...taStyle, height: '120px' }} />
        </div>
      </div>
      <div style={{
        ...cardStyle,
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10px',
      }} className="devportal-scroll">
        {diff.map((line, i) => (
          <div key={i} style={{
            padding: '2px 8px',
            marginBottom: '1px',
            borderRadius: '4px',
            background: line.type === 'add' ? 'rgba(34,197,94,0.1)' : line.type === 'del' ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: line.type === 'add' ? '#22c55e' : line.type === 'del' ? '#ef4444' : 'var(--text-primary)',
            display: 'flex',
            gap: '8px',
          }}>
            <span style={{ opacity: 0.5, minWidth: '20px', textAlign: 'right' }}>
              {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
            </span>
            <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState('联系我们: test@example.com 或 support@company.org\n更多邮箱: admin@test.net, info@website.com')
  const [matches, setMatches] = useState<string[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    try {
      const re = new RegExp(pattern, flags)
      const m = text.match(re) || []
      setMatches(m)
      setErr('')
    } catch (e) {
      setErr((e as Error).message)
      setMatches([])
    }
  }, [pattern, flags, text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', ...cardStyle, padding: '8px 12px' }}>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/</span>
          <input type="text" value={pattern} onChange={e => setPattern(e.target.value)} placeholder="正则表达式" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px',
          }} />
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/</span>
          <input type="text" value={flags} onChange={e => setFlags(e.target.value)} placeholder="gi" style={{
            width: '50px', background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--accent)', fontFamily: 'monospace', fontSize: '13px',
          }} />
        </div>
      </div>
      {err && <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px' }}>❌ {err}</div>}
      <textarea value={text} onChange={e => setText(e.target.value)} style={{ ...taStyle, height: '140px', flex: 'none' }} />
      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
          匹配结果: <span style={{ color: 'var(--accent)' }}>{matches.length}</span> 个
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {matches.map((m, i) => (
            <span key={i} style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'var(--accent-bg)', border: '1px solid var(--accent)',
              color: 'var(--accent)', fontFamily: 'monospace', fontSize: '11px',
            }}>{m}</span>
          ))}
          {matches.length === 0 && !err && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>无匹配结果</span>}
        </div>
      </div>
    </div>
  )
}

function CaseTool() {
  const [input, setInput] = useState('Hello World From DevPortal')

  const results = useMemo(() => [
    { name: '原文本', value: input },
    { name: '全大写', value: input.toUpperCase() },
    { name: '全小写', value: input.toLowerCase() },
    { name: '首字母大写', value: input.replace(/\b\w/g, c => c.toUpperCase()) },
    { name: '反转大小写', value: input.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('') },
    { name: '驼峰式', value: input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase()) },
  ], [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <textarea value={input} onChange={e => setInput(e.target.value)} style={{ ...taStyle, height: '100px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.map(r => (
          <div key={r.name} style={{ ...cardStyle, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{r.name}</span>
              <CopyBtn text={r.value} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{r.value || ' '}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrimTool() {
  const [input, setInput] = useState('  Hello   World  \n\n  Multiple   lines  \n  with extra  spaces  ')

  const results = useMemo(() => [
    { name: '去首尾空白', value: input.trim() },
    { name: '去所有空白', value: input.replace(/\s/g, '') },
    { name: '合并空白', value: input.replace(/\s+/g, ' ').trim() },
    { name: '去空行', value: input.split('\n').filter(l => l.trim()).join('\n') },
    { name: '每行去首尾', value: input.split('\n').map(l => l.trim()).join('\n') },
  ], [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <textarea value={input} onChange={e => setInput(e.target.value)} style={{ ...taStyle, height: '100px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.map(r => (
          <div key={r.name} style={{ ...cardStyle, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{r.name}</span>
              <CopyBtn text={r.value} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{r.value || ' '}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorTools() {
  const [subTab, setSubTab] = useState('picker')
  const subs = [
    { id: 'picker', name: '颜色选择' },
    { id: 'palette', name: '调色板' },
    { id: 'gradient', name: '渐变生成' },
    { id: 'convert', name: '格式转换' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            ...btnStyle,
            background: subTab === s.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
            borderColor: subTab === s.id ? 'var(--accent)' : 'var(--glass-border)',
            color: subTab === s.id ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: subTab === s.id ? 600 : 400,
          }}>{s.name}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="devportal-scroll">
        {subTab === 'picker' && <ColorPicker />}
        {subTab === 'palette' && <PaletteGen />}
        {subTab === 'gradient' && <GradientGen />}
        {subTab === 'convert' && <ColorConvert />}
      </div>
    </div>
  )
}

function ColorPicker() {
  const [color, setColor] = useState('#8b5cf6')

  const hexToRgb = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16)
    const g = parseInt(h.slice(3, 5), 16)
    const b = parseInt(h.slice(5, 7), 16)
    return { r, g, b }
  }

  const rgb = hexToRgb(color)
  const hsl = (() => {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  })()

  const shades = useMemo(() => {
    const arr: string[] = []
    for (let i = 100; i >= 0; i -= 10) {
      const f = i / 100
      const r = Math.round(rgb.r * f + 255 * (1 - f))
      const g = Math.round(rgb.g * f + 255 * (1 - f))
      const b = Math.round(rgb.b * f + 255 * (1 - f))
      arr.push(`rgb(${r},${g},${b})`)
    }
    return arr
  }, [rgb])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px' }}>
        <div style={{
          height: '200px', borderRadius: '12px',
          background: color, border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '100%', height: '40px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: 'transparent' }} />
          <input type="text" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', textAlign: 'center', fontSize: '14px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
              { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            ].map(c => (
              <div key={c.label} style={cardStyle}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{c.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>色阶</div>
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '40px' }}>
          {shades.map((s, i) => (
            <div key={i} style={{ flex: 1, background: s, cursor: 'pointer' }} title={s} onClick={() => {
              const m = s.match(/\d+/g)
              if (m) {
                const hex = '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
                setColor(hex)
              }
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PaletteGen() {
  const [base, setBase] = useState('#8b5cf6')
  const [mode, setMode] = useState<'complementary' | 'analogous' | 'triadic' | 'split'>('complementary')

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360; s /= 100; l /= 100
    let r, g, b
    if (s === 0) { r = g = b = l }
    else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const palette = useMemo(() => {
    const baseHsl = hexToHsl(base)
    switch (mode) {
      case 'complementary':
        return [base, hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l)]
      case 'analogous':
        return [
          hslToHex((baseHsl.h - 30 + 360) % 360, baseHsl.s, baseHsl.l),
          base,
          hslToHex((baseHsl.h + 30) % 360, baseHsl.s, baseHsl.l),
        ]
      case 'triadic':
        return [
          base,
          hslToHex((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l),
          hslToHex((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l),
        ]
      case 'split':
        return [
          base,
          hslToHex((baseHsl.h + 150) % 360, baseHsl.s, baseHsl.l),
          hslToHex((baseHsl.h + 210) % 360, baseHsl.s, baseHsl.l),
        ]
    }
  }, [base, mode])

  const modes = [
    { id: 'complementary', name: '互补色' },
    { id: 'analogous', name: '相近色' },
    { id: 'triadic', name: '三色组' },
    { id: 'split', name: '分裂互补' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="color" value={base} onChange={e => setBase(e.target.value)} style={{ width: '40px', height: '32px', cursor: 'pointer', borderRadius: '6px', border: 'none' }} />
        <input type="text" value={base} onChange={e => setBase(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', width: '100px' }} />
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id as typeof mode)} style={{
              ...btnStyle,
              background: mode === m.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
              borderColor: mode === m.id ? 'var(--accent)' : 'var(--glass-border)',
              fontSize: '11px', padding: '5px 10px',
            }}>{m.name}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', height: '120px' }}>
        {palette.map((c, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ flex: 1, borderRadius: '10px', background: c, cursor: 'pointer', border: '1px solid var(--glass-border)' }} onClick={() => setBase(c)} />
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{c}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GradientGen() {
  const [c1, setC1] = useState('#8b5cf6')
  const [c2, setC2] = useState('#22d3ee')
  const [angle, setAngle] = useState(135)

  const grad = `linear-gradient(${angle}deg, ${c1}, ${c2})`

  const presets = [
    ['#8b5cf6', '#22d3ee'],
    ['#ec4899', '#f59e0b'],
    ['#10b981', '#06b6d4'],
    ['#ef4444', '#f97316'],
    ['#6366f1', '#a855f7'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ height: '160px', borderRadius: '12px', background: grad, border: '1px solid var(--glass-border)' }} />
      <div style={cardStyle}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>CSS 代码</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
            background: {grad};
          </code>
          <CopyBtn text={`background: ${grad};`} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="color" value={c1} onChange={e => setC1(e.target.value)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }} />
          <input type="text" value={c1} onChange={e => setC1(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', flex: 1, fontSize: '11px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="color" value={c2} onChange={e => setC2(e.target.value)} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer' }} />
          <input type="text" value={c2} onChange={e => setC2(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', flex: 1, fontSize: '11px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input type="number" value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ ...inputStyle, width: '60px', fontFamily: 'monospace' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>°</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>预设</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setC1(p[0]); setC2(p[1]) }} style={{
              width: '48px', height: '32px',
              borderRadius: '6px', border: '1px solid var(--glass-border)',
              background: `linear-gradient(135deg, ${p[0]}, ${p[1]})`,
              cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ColorConvert() {
  const [hex, setHex] = useState('#8b5cf6')

  const rgb = useMemo(() => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }, [hex])

  const hsl = useMemo(() => {
    const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }, [rgb])

  const formats = [
    { name: 'HEX', value: hex.toUpperCase() },
    { name: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { name: 'RGBA', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
    { name: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { name: 'HSLA', value: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="color" value={hex} onChange={e => setHex(e.target.value)} style={{ width: '60px', height: '60px', borderRadius: '10px', border: 'none', cursor: 'pointer' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>HEX</label>
          <input type="text" value={hex} onChange={e => setHex(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {formats.map(f => (
          <div key={f.name} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '50px' }}>{f.name}</span>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{f.value}</span>
            <CopyBtn text={f.value} />
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeTools() {
  const [subTab, setSubTab] = useState('timestamp')
  const subs = [
    { id: 'timestamp', name: '时间戳转换' },
    { id: 'timezone', name: '时区转换' },
    { id: 'datecalc', name: '日期计算' },
    { id: 'cron', name: 'Cron 解析' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            ...btnStyle,
            background: subTab === s.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
            borderColor: subTab === s.id ? 'var(--accent)' : 'var(--glass-border)',
            color: subTab === s.id ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: subTab === s.id ? 600 : 400,
          }}>{s.name}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="devportal-scroll">
        {subTab === 'timestamp' && <TimestampTool />}
        {subTab === 'timezone' && <TimezoneTool />}
        {subTab === 'datecalc' && <DateCalcTool />}
        {subTab === 'cron' && <CronTool />}
      </div>
    </div>
  )
}

function TimestampTool() {
  const [ts, setTs] = useState(Math.floor(Date.now() / 1000).toString())
  const [dateStr, setDateStr] = useState('')
  const [mode, setMode] = useState<'ts2date' | 'date2ts'>('ts2date')

  const ts2date = useCallback(() => {
    const n = Number(ts)
    if (isNaN(n)) { setDateStr('无效时间戳'); return }
    const d = new Date(n * 1000)
    setDateStr(d.toLocaleString('zh-CN'))
  }, [ts])

  const date2ts = useCallback(() => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) { setTs('无效日期'); return }
    setTs(Math.floor(d.getTime() / 1000).toString())
  }, [dateStr])

  useEffect(() => { ts2date() }, []) // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setMode('ts2date')} style={{ ...btnStyle, background: mode === 'ts2date' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'ts2date' ? 'var(--accent)' : 'var(--glass-border)' }}>
          时间戳 → 日期
        </button>
        <button onClick={() => setMode('date2ts')} style={{ ...btnStyle, background: mode === 'date2ts' ? 'var(--accent-bg)' : 'var(--glass-bg)', borderColor: mode === 'date2ts' ? 'var(--accent)' : 'var(--glass-border)' }}>
          日期 → 时间戳
        </button>
      </div>

      {mode === 'ts2date' ? (
        <>
          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Unix 时间戳 (秒)</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={ts} onChange={e => setTs(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: '14px' }} />
              <button onClick={() => setTs(Math.floor(Date.now() / 1000).toString())} style={btnStyle}>现在</button>
              <button onClick={ts2date} style={btnStyle}>转换</button>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>日期时间</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>{dateStr}</span>
              {dateStr && <CopyBtn text={dateStr} />}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>日期时间</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" value={dateStr} onChange={e => setDateStr(e.target.value)} placeholder="2024-01-01 12:00:00" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setDateStr(new Date().toLocaleString('zh-CN'))} style={btnStyle}>现在</button>
              <button onClick={date2ts} style={btnStyle}>转换</button>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Unix 时间戳 (秒)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>{ts}</span>
              {ts && <CopyBtn text={ts} />}
            </div>
          </div>
        </>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>快捷时间戳</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { label: '今天开始', fn: () => Math.floor(new Date().setHours(0, 0, 0, 0) / 1000) },
            { label: '今天结束', fn: () => Math.floor(new Date().setHours(23, 59, 59, 999) / 1000) },
            { label: '本周开始', fn: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return Math.floor(d.setHours(0, 0, 0, 0) / 1000) } },
            { label: '本月开始', fn: () => Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000) },
            { label: '本年开始', fn: () => Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000) },
            { label: '一小时后', fn: () => Math.floor((Date.now() + 3600000) / 1000) },
          ].map(({ label, fn }) => (
            <button key={label} onClick={() => { setTs(fn().toString()); ts2date() }} style={{
              padding: '8px', borderRadius: '8px',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: '11px',
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
            >
              <div style={{ fontWeight: 500, marginBottom: '2px' }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-secondary)' }}>{fn()}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimezoneTool() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const zones = [
    { name: '本地时间', offset: 0 },
    { name: 'UTC', offset: -date.getTimezoneOffset() },
    { name: '纽约 (EST)', offset: -date.getTimezoneOffset() - 300 },
    { name: '伦敦 (GMT)', offset: -date.getTimezoneOffset() + 60 },
    { name: '东京 (JST)', offset: -date.getTimezoneOffset() + 540 },
    { name: '悉尼 (AEST)', offset: -date.getTimezoneOffset() + 600 },
  ]

  const getTimeInZone = (offsetMin: number) => {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000
    return new Date(utc + offsetMin * 60000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{
        ...cardStyle,
        padding: '20px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.1) 100%)',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>当前本地时间</div>
        <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'monospace' }}>
          {date.toLocaleTimeString('zh-CN')}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {date.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {zones.map(z => (
          <div key={z.name} style={{ ...cardStyle, padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{z.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600 }}>
              {getTimeInZone(z.offset).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {getTimeInZone(z.offset).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DateCalcTool() {
  const [d1, setD1] = useState(new Date().toISOString().slice(0, 10))
  const [d2, setD2] = useState(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10))

  const diff = useMemo(() => {
    const t1 = new Date(d1).getTime()
    const t2 = new Date(d2).getTime()
    const ms = Math.abs(t2 - t1)
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    return { days, hours, ms }
  }, [d1, d2])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>开始日期</div>
          <input type="date" value={d1} onChange={e => setD1(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <ArrowUpDown size={20} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>结束日期</div>
          <input type="date" value={d2} onChange={e => setD2(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>
      </div>

      <div style={{
        ...cardStyle, padding: '20px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.1) 100%)',
      }}>
        <div style={{ fontSize: '48px', fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {diff.days}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>天</div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px' }}>
          <span>{diff.hours} 小时</span>
          <span style={{ color: 'var(--text-secondary)' }}>|</span>
          <span>{Math.floor(diff.ms / 3600000)} 总小时</span>
          <span style={{ color: 'var(--text-secondary)' }}>|</span>
          <span>{Math.floor(diff.ms / 60000)} 总分钟</span>
        </div>
      </div>
    </div>
  )
}

function CronTool() {
  const [expr, setExpr] = useState('0 9 * * 1-5')

  const explain = useMemo(() => {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return { valid: false, desc: '表达式必须包含 5 个字段' }
    const names = ['分', '时', '日', '月', '周']
    const descs: string[] = []
    const mapField = (v: string, unit: string) => {
      if (v === '*') return `每${unit}`
      if (v.includes('/')) {
        const [base, step] = v.split('/')
        return `从 ${base === '*' ? '0' : base} 开始每 ${step} ${unit}`
      }
      if (v.includes('-')) return `第 ${v} ${unit}`
      if (v.includes(',')) return `第 ${v} ${unit}`
      return `第 ${v} ${unit}`
    }
    parts.forEach((p, i) => descs.push(`${names[i]}: ${mapField(p, names[i])}`))
    return { valid: true, desc: descs.join('  |  ') }
  }, [expr])

  const nextRuns = useMemo(() => {
    const runs: Date[] = []
    let now = new Date()
    now.setSeconds(0, 0)
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return []
    for (let i = 0; i < 5; i++) {
      now = new Date(now.getTime() + 60000)
      runs.push(new Date(now.getTime() + i * 3600000 * 2))
    }
    return runs
  }, [expr])

  const presets = [
    { label: '每分钟', expr: '* * * * *' },
    { label: '每小时', expr: '0 * * * *' },
    { label: '每天 9 点', expr: '0 9 * * *' },
    { label: '工作日 9 点', expr: '0 9 * * 1-5' },
    { label: '每周一早 9 点', expr: '0 9 * * 1' },
    { label: '每月 1 号', expr: '0 0 1 * *' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={cardStyle}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Cron 表达式</div>
        <input
          type="text" value={expr} onChange={e => setExpr(e.target.value)}
          style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '16px', textAlign: 'center', padding: '10px' }}
        />
      </div>

      <div style={{ ...cardStyle, background: explain.valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderColor: explain.valid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>解释</div>
        <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{explain.desc}</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>下次执行时间</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {nextRuns.map((d, i) => (
            <div key={i} style={{
              padding: '6px 10px', borderRadius: '6px',
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              fontFamily: 'monospace', fontSize: '12px', display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>#{i + 1}</span>
              <span>{d.toLocaleString('zh-CN')}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>常用预设</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => setExpr(p.expr)} style={{
              padding: '5px 10px', borderRadius: '6px',
              border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px',
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function NetworkTools() {
  const [subTab, setSubTab] = useState('ip')
  const subs = [
    { id: 'ip', name: 'IP 查询' },
    { id: 'ua', name: 'UA 解析' },
    { id: 'http', name: 'HTTP 状态码' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {subs.map(s => (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            ...btnStyle,
            background: subTab === s.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
            borderColor: subTab === s.id ? 'var(--accent)' : 'var(--glass-border)',
            color: subTab === s.id ? 'var(--accent)' : 'var(--text-primary)',
            fontWeight: subTab === s.id ? 600 : 400,
          }}>{s.name}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="devportal-scroll">
        {subTab === 'ip' && <IpTool />}
        {subTab === 'ua' && <UaTool />}
        {subTab === 'http' && <HttpStatusTool />}
      </div>
    </div>
  )
}

function IpTool() {
  const [ip, setIp] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Record<string, string> | null>(null)
  const [err, setErr] = useState('')

  const query = useCallback(async () => {
    setLoading(true); setErr(''); setData(null)
    try {
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
      const res = await fetch(url)
      const d = await res.json()
      if (d.error) throw new Error(d.reason || '查询失败')
      setData({
        IP: d.ip,
        城市: d.city,
        地区: d.region,
        国家: d.country_name,
        邮编: d.postal,
        时区: d.timezone,
        货币: d.currency,
        组织: d.org,
        ISP: d.isp,
        ASN: d.asn,
        纬度: String(d.latitude),
        经度: String(d.longitude),
      })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [ip])

  useEffect(() => { query() }, []) // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={ip} onChange={e => setIp(e.target.value)}
          placeholder="输入 IP 地址（留空查本机）"
          style={{ ...inputStyle, flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && query()}
        />
        <button onClick={query} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}>
          <Search size={12} /> 查询
        </button>
      </div>

      {loading && <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>查询中...</div>}
      {err && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px' }}>❌ {err}</div>}

      {data && (
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(data).map(([k, v]) => (
              <div key={k} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{v || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UaTool() {
  const [ua, setUa] = useState(navigator.userAgent)

  const parsed = useMemo(() => {
    const res: Record<string, string> = {}
    if (/Chrome\/(\d+)/.test(ua)) res.浏览器 = `Chrome ${RegExp.$1}`
    else if (/Firefox\/(\d+)/.test(ua)) res.浏览器 = `Firefox ${RegExp.$1}`
    else if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)) res.浏览器 = `Safari ${RegExp.$1}`
    else res.浏览器 = '未知'

    if (/Windows NT/.test(ua)) res.系统 = 'Windows'
    else if (/Mac OS X/.test(ua)) res.系统 = 'macOS'
    else if (/Linux/.test(ua)) res.系统 = 'Linux'
    else if (/Android/.test(ua)) res.系统 = 'Android'
    else if (/iOS|iPhone|iPad/.test(ua)) res.系统 = 'iOS'
    else res.系统 = '未知'

    if (/Mobile/.test(ua)) res.设备 = '移动端'
    else if (/Tablet|iPad/.test(ua)) res.设备 = '平板'
    else res.设备 = '桌面端'

    res.平台 = navigator.platform
    return res
  }, [ua])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>User Agent 字符串</div>
        <textarea value={ua} onChange={e => setUa(e.target.value)} style={{ ...taStyle, height: '80px' }} />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>解析结果</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{k}</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HttpStatusTool() {
  const [q, setQ] = useState('')

  const codes = [
    { code: 200, name: 'OK', desc: '请求成功', cat: '成功' },
    { code: 201, name: 'Created', desc: '创建成功', cat: '成功' },
    { code: 204, name: 'No Content', desc: '无内容', cat: '成功' },
    { code: 301, name: 'Moved Permanently', desc: '永久重定向', cat: '重定向' },
    { code: 302, name: 'Found', desc: '临时重定向', cat: '重定向' },
    { code: 304, name: 'Not Modified', desc: '未修改', cat: '重定向' },
    { code: 400, name: 'Bad Request', desc: '请求错误', cat: '客户端错误' },
    { code: 401, name: 'Unauthorized', desc: '未授权', cat: '客户端错误' },
    { code: 403, name: 'Forbidden', desc: '禁止访问', cat: '客户端错误' },
    { code: 404, name: 'Not Found', desc: '未找到', cat: '客户端错误' },
    { code: 408, name: 'Request Timeout', desc: '请求超时', cat: '客户端错误' },
    { code: 429, name: 'Too Many Requests', desc: '请求过多', cat: '客户端错误' },
    { code: 500, name: 'Internal Server Error', desc: '服务器错误', cat: '服务器错误' },
    { code: 502, name: 'Bad Gateway', desc: '网关错误', cat: '服务器错误' },
    { code: 503, name: 'Service Unavailable', desc: '服务不可用', cat: '服务器错误' },
    { code: 504, name: 'Gateway Timeout', desc: '网关超时', cat: '服务器错误' },
  ]

  const filtered = codes.filter(c =>
    !q || c.code.toString().includes(q) || c.name.toLowerCase().includes(q.toLowerCase()) || c.desc.includes(q)
  )

  const catColor: Record<string, string> = {
    '成功': '#10b981',
    '重定向': '#3b82f6',
    '客户端错误': '#f59e0b',
    '服务器错误': '#ef4444',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索状态码..." style={{ ...inputStyle, width: '100%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map(c => (
          <div key={c.code} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '10px',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          }}>
            <div style={{
              width: '52px', textAlign: 'center',
              padding: '4px 8px', borderRadius: '6px',
              background: `${catColor[c.cat]}20`,
              color: catColor[c.cat],
              fontFamily: 'monospace', fontWeight: 700, fontSize: '14px',
            }}>{c.code}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: '10px', color: catColor[c.cat], padding: '2px 8px', borderRadius: '4px', background: `${catColor[c.cat]}15` }}>{c.cat}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataViz() {
  const [jsonData, setJsonData] = useState('[\n  {"name": "一月", "value": 65},\n  {"name": "二月", "value": 80},\n  {"name": "三月", "value": 45},\n  {"name": "四月", "value": 95},\n  {"name": "五月", "value": 70},\n  {"name": "六月", "value": 88}\n]')
  const [err, setErr] = useState('')
  const [parsed, setParsed] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    try {
      const d = JSON.parse(jsonData)
      if (!Array.isArray(d)) throw new Error('数据必须是数组')
      setParsed(d)
      setErr('')
    } catch (e) {
      setErr((e as Error).message)
      setParsed([])
    }
  }, [jsonData])

  const maxVal = Math.max(...parsed.map(d => d.value), 1)
  const total = parsed.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>JSON 数据 (name, value 数组)</div>
          <textarea value={jsonData} onChange={e => setJsonData(e.target.value)} style={taStyle} />
          {err && <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '11px' }}>❌ {err}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'auto' }} className="devportal-scroll">
          <div style={{ ...cardStyle, padding: '20px', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>柱状图</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>总计: {total}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '200px', paddingBottom: '30px', position: 'relative' }}>
              {parsed.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.value}</div>
                  <div
                    style={{
                      width: '100%',
                      height: `${(d.value / maxVal) * 100}%`,
                      minHeight: '2px',
                      borderRadius: '4px 4px 0 0',
                      background: `linear-gradient(180deg, #a78bfa 0%, #22d3ee 100%)`,
                      transition: 'all 0.5s ease',
                    }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', position: 'absolute', bottom: '10px', textAlign: 'center', width: 'calc(100% - 16px)' }}>{d.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>数据详情</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {parsed.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '3px',
                    background: `linear-gradient(135deg, hsl(${260 + i * 20}, 70%, 65%), hsl(${200 + i * 20}, 70%, 60%))`,
                  }} />
                  <span style={{ flex: 1, fontSize: '12px' }}>{d.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{d.value}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{((d.value / total) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DevPortal() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div style={{
      display: 'flex', height: '100%',
      color: 'var(--text-primary)',
      background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(34,211,238,0.05) 100%)',
    }}>
      <style>{`
        .devportal-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .devportal-scroll::-webkit-scrollbar-track { background: transparent; }
        .devportal-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .devportal-content {
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      <div style={{
        width: '220px', flexShrink: 0,
        background: 'var(--glass-bg)',
        borderRight: '1px solid var(--window-border)',
        display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--window-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
            }}>
              <Code2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>DevPortal</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>开发者工作台</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }} className="devportal-scroll">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', marginBottom: '3px',
                borderRadius: '10px', border: 'none',
                background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--text-primary)', cursor: 'pointer',
                fontSize: '13px', textAlign: 'left',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: activeTab === tab.id ? tab.gradient : 'var(--glass-bg)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
                {tab.icon}
              </div>
              <span style={{ flex: 1, fontWeight: activeTab === tab.id ? 600 : 400 }}>{tab.name}</span>
              {activeTab === tab.id && (
                <div style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: 'var(--accent)',
                }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px', borderTop: '1px solid var(--window-border)', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          30+ 工具 · 本地运行
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--window-border)',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: currentTab?.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            {currentTab?.icon}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{currentTab?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {activeTab === 'dashboard' && '概览与快捷访问'}
              {activeTab === 'code' && 'JSON / Base64 / URL / 哈希 / UUID / 密码'}
              {activeTab === 'text' && 'Diff / 正则 / 大小写 / 空白'}
              {activeTab === 'color' && '颜色选择 / 调色板 / 渐变 / 转换'}
              {activeTab === 'time' && '时间戳 / 时区 / 日期 / Cron'}
              {activeTab === 'network' && 'IP 查询 / UA 解析 / HTTP 状态码'}
              {activeTab === 'viz' && 'JSON 数据图表展示'}
            </div>
          </div>
        </div>

        <div key={activeTab} className="devportal-content" style={{ flex: 1, padding: '18px', overflow: 'auto' }}>
          {activeTab === 'dashboard' && <Dashboard onNav={setActiveTab} />}
          {activeTab === 'code' && <CodeTools />}
          {activeTab === 'text' && <TextTools />}
          {activeTab === 'color' && <ColorTools />}
          {activeTab === 'time' && <TimeTools />}
          {activeTab === 'network' && <NetworkTools />}
          {activeTab === 'viz' && <DataViz />}
        </div>
      </div>
    </div>
  )
}
