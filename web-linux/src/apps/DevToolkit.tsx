import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Code, Link, Binary, Hash, Clock, Sparkles,
  Palette, FileText, Check, Copy, RefreshCw,
  Shield,
} from 'lucide-react'

type ToolId = 'json' | 'url' | 'base64' | 'regex' | 'hash' | 'timestamp' | 'uuid' | 'jwt' | 'color' | 'css'

interface Tool {
  id: ToolId
  name: string
  icon: React.ReactNode
  desc: string
}

const TOOLS: Tool[] = [
  { id: 'json', name: 'JSON 格式化', icon: <Code size={16} />, desc: '格式化 / 压缩 / 验证 JSON' },
  { id: 'url', name: 'URL 编解码', icon: <Link size={16} />, desc: 'URL 编码与解码' },
  { id: 'base64', name: 'Base64 编解码', icon: <Binary size={16} />, desc: 'Base64 编码与解码' },
  { id: 'regex', name: '正则测试', icon: <Shield size={16} />, desc: '正则表达式实时匹配测试' },
  { id: 'hash', name: '哈希生成', icon: <Hash size={16} />, desc: 'MD5 / SHA 哈希生成' },
  { id: 'timestamp', name: '时间戳转换', icon: <Clock size={16} />, desc: 'Unix 时间戳与日期互转' },
  { id: 'uuid', name: 'UUID 生成', icon: <Sparkles size={16} />, desc: '生成 UUID v4' },
  { id: 'jwt', name: 'JWT 解码', icon: <FileText size={16} />, desc: '解码 JWT Payload' },
  { id: 'color', name: '颜色转换', icon: <Palette size={16} />, desc: 'HEX / RGB 互转' },
  { id: 'css', name: 'CSS 验证', icon: <Code size={16} />, desc: 'CSS 语法检查' },
]

const styles = {
  root: {
    height: '100%', display: 'flex', flexDirection: 'column',
    background: 'var(--window-bg)', color: 'var(--text-primary)', overflow: 'hidden',
    fontFamily: 'var(--font-family, system-ui, sans-serif)',
  } as React.CSSProperties,
  sidebar: {
    width: 200, flexShrink: 0, borderRight: '1px solid var(--window-border)',
    background: 'var(--window-bg)', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  sidebarHeader: {
    padding: '14px 14px 10px', borderBottom: '1px solid var(--window-border)',
    display: 'flex', flexDirection: 'column', gap: 4,
  } as React.CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 } as React.CSSProperties,
  logoSub: { fontSize: 11, color: 'var(--text-secondary)', opacity: 0.7 } as React.CSSProperties,
  toolList: { flex: 1, overflowY: 'auto', padding: '6px 0' } as React.CSSProperties,
  toolItem: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
    background: active ? 'var(--accent-bg, rgba(99,102,241,0.12))' : 'transparent',
    border: 'none', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
    color: active ? 'var(--accent)' : 'var(--text-primary)',
    cursor: 'pointer', textAlign: 'left', fontSize: 13, transition: 'all 0.15s',
  }),
  toolIcon: { display: 'flex', alignItems: 'center', opacity: 0.85 } as React.CSSProperties,
  toolInfo: { display: 'flex', flexDirection: 'column', minWidth: 0 } as React.CSSProperties,
  toolName: { fontWeight: 600, fontSize: 13 } as React.CSSProperties,
  toolDesc: { fontSize: 11, color: 'var(--text-secondary)', opacity: 0.65 } as React.CSSProperties,
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as React.CSSProperties,
  mainHeader: {
    padding: '12px 16px', borderBottom: '1px solid var(--window-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as React.CSSProperties,
  toolTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 } as React.CSSProperties,
  toolDescription: { fontSize: 12, color: 'var(--text-secondary)', opacity: 0.7, marginTop: 2 } as React.CSSProperties,
  content: { flex: 1, overflow: 'auto', padding: 16 } as React.CSSProperties,
  toolbar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' } as React.CSSProperties,
  btnGroup: { display: 'flex', gap: 4 } as React.CSSProperties,
  btn: (active: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: '1px solid var(--window-border)',
    background: active ? 'var(--accent)' : 'var(--window-bg)',
    color: active ? '#fff' : 'var(--text-primary)',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }),
  btnPrimary: {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: 'var(--accent)', color: '#fff',
    cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  } as React.CSSProperties,
  btnDanger: {
    padding: '6px 12px', borderRadius: 6, border: '1px solid var(--window-border)',
    background: 'var(--window-bg)', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
  } as React.CSSProperties,
  panels: { display: 'flex', gap: 12, flexDirection: 'column' } as React.CSSProperties,
  panel: {
    border: '1px solid var(--window-border)', borderRadius: 8, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', background: 'var(--window-bg)',
  } as React.CSSProperties,
  panelLabel: {
    padding: '8px 12px', borderBottom: '1px solid var(--window-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    background: 'var(--desktop-bg)',
  } as React.CSSProperties,
  textarea: {
    width: '100%', minHeight: 120, padding: 10, border: 'none', background: 'transparent',
    color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13,
    resize: 'vertical', outline: 'none', lineHeight: 1.5,
  } as React.CSSProperties,
  textareaReadonly: {
    width: '100%', minHeight: 120, padding: 10, border: 'none',
    background: 'var(--desktop-bg)', color: 'var(--text-primary)',
    fontFamily: 'monospace', fontSize: 13, resize: 'vertical', outline: 'none',
    lineHeight: 1.5,
  } as React.CSSProperties,
  error: {
    padding: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)',
    fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap',
  } as React.CSSProperties,
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 4, border: '1px solid var(--window-border)',
    background: 'var(--window-bg)', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 11, transition: 'all 0.15s',
  } as React.CSSProperties,
  row: { display: 'flex', gap: 8, alignItems: 'center' } as React.CSSProperties,
  input: {
    flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--window-border)',
    background: 'var(--window-bg)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', fontFamily: 'monospace',
  } as React.CSSProperties,
  copyBtnInline: (copied: boolean): React.CSSProperties => ({
    ...styles.copyBtn,
    color: copied ? 'var(--accent)' : 'var(--text-secondary)',
    borderColor: copied ? 'var(--accent)' : 'var(--window-border)',
  }),
  statCard: {
    border: '1px solid var(--window-border)', borderRadius: 8, padding: '10px 14px',
    background: 'var(--desktop-bg)', display: 'flex', flexDirection: 'column', gap: 4,
    flex: 1, minWidth: 120,
  } as React.CSSProperties,
  statLabel: { fontSize: 11, color: 'var(--text-secondary)', opacity: 0.7 } as React.CSSProperties,
  statValue: {
    fontSize: 14, fontWeight: 600, fontFamily: 'monospace',
    display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all',
  } as React.CSSProperties,
  inlineCode: {
    fontFamily: 'monospace', fontSize: 12, padding: '2px 6px',
    borderRadius: 4, background: 'var(--desktop-bg)',
  } as React.CSSProperties,
  listItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
    borderBottom: '1px solid var(--window-border)', fontSize: 13,
  } as React.CSSProperties,
  matchCount: { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 } as React.CSSProperties,
  label: { fontSize: 12, color: 'var(--text-secondary)' } as React.CSSProperties,
}

function DevToolkit() {
  const [activeTool, setActiveTool] = useState<ToolId>('json')

  const currentTool = useMemo(() => TOOLS.find((t) => t.id === activeTool)!, [activeTool])

  return (
    <div style={styles.root}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span>开发者工具箱</span>
          </div>
          <div style={styles.logoSub}>10 合 1 开发工具</div>
        </div>
        <div style={styles.toolList}>
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              style={styles.toolItem(activeTool === tool.id)}
              onClick={() => setActiveTool(tool.id)}
              onMouseEnter={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = 'var(--accent-bg, rgba(99,102,241,0.08))' }}
              onMouseLeave={(e) => { if (activeTool !== tool.id) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={styles.toolIcon}>{tool.icon}</span>
              <div style={styles.toolInfo}>
                <div style={styles.toolName}>{tool.name}</div>
                <div style={styles.toolDesc}>{tool.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.mainHeader}>
          <div>
            <div style={styles.toolTitle}>
              {currentTool.icon}
              <span>{currentTool.name}</span>
            </div>
            <div style={styles.toolDescription}>{currentTool.desc}</div>
          </div>
        </div>
        <div style={styles.content}>
          {activeTool === 'json' && <JSONTool />}
          {activeTool === 'url' && <URLTool />}
          {activeTool === 'base64' && <Base64Tool />}
          {activeTool === 'regex' && <RegexTool />}
          {activeTool === 'hash' && <HashTool />}
          {activeTool === 'timestamp' && <TimestampTool />}
          {activeTool === 'uuid' && <UUIDTool />}
          {activeTool === 'jwt' && <JWTTool />}
          {activeTool === 'color' && <ColorTool />}
          {activeTool === 'css' && <CSSTool />}
        </div>
      </div>
    </div>
  )
}

function useCopy() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copy = useCallback((text: string, id?: string) => {
    try {
      navigator.clipboard.writeText(text)
      if (id) setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch { /* ignore */ }
  }, [])
  return { copy, copiedId }
}

function ToolShell({ toolbar, children }: { toolbar: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <div style={styles.toolbar}>{toolbar}</div>
      {children}
    </>
  )
}

function JSONTool() {
  const [input, setInput] = useState('{"name":"WebLinuxOS","version":"1.0.0","features":["桌面","窗口","应用"]}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'format' | 'minify' | 'validate'>('format')
  const { copy, copiedId } = useCopy()

  const process = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setError('')
      if (mode === 'format') setOutput(JSON.stringify(parsed, null, 2))
      else if (mode === 'minify') setOutput(JSON.stringify(parsed))
      else setOutput('✓ JSON 格式有效\n\n键值数量: ' + Object.keys(parsed).length + '\n字符串长度: ' + input.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析错误')
      setOutput('')
    }
  }, [input, mode])

  const clear = () => { setInput(''); setOutput(''); setError('') }

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.btnGroup}>
            {(['format', 'minify', 'validate'] as const).map((m) => (
              <button key={m} style={styles.btn(mode === m)} onClick={() => setMode(m)}>
                {m === 'format' ? '格式化' : m === 'minify' ? '压缩' : '验证'}
              </button>
            ))}
          </div>
          <button style={styles.btnPrimary} onClick={process}>
            <RefreshCw size={12} /> 处理
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>输入</div>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder='在此输入 JSON...' spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>输出</span>
            <button style={styles.copyBtn} onClick={() => copy(output, 'json')} disabled={!output}>
              {copiedId === 'json' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'json' ? '已复制' : '复制'}
            </button>
          </div>
          {error ? <div style={styles.error}>{error}</div> :
            <textarea style={styles.textareaReadonly} value={output} readOnly spellCheck={false} />}
        </div>
      </div>
    </ToolShell>
  )
}

function URLTool() {
  const [input, setInput] = useState('https://example.com/path?q=hello world&lang=中文')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [useComponent, setUseComponent] = useState(false)
  const { copy, copiedId } = useCopy()

  const process = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(useComponent ? encodeURIComponent(input) : encodeURI(input))
      } else {
        setOutput(useComponent ? decodeURIComponent(input) : decodeURI(input))
      }
    } catch {
      setOutput(mode === 'encode' ? '编码失败' : '解码失败：无效的 URI 组件')
    }
  }, [input, mode, useComponent])

  const clear = () => { setInput(''); setOutput('') }

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.btnGroup}>
            <button style={styles.btn(mode === 'encode')} onClick={() => setMode('encode')}>编码</button>
            <button style={styles.btn(mode === 'decode')} onClick={() => setMode('decode')}>解码</button>
          </div>
          <button style={styles.btn(useComponent)} onClick={() => setUseComponent(!useComponent)}>
            {useComponent ? 'encodeURIComponent' : 'encodeURI'}
          </button>
          <button style={styles.btnPrimary} onClick={process}>
            <RefreshCw size={12} /> {mode === 'encode' ? '编码' : '解码'}
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>{mode === 'encode' ? '原文' : '编码后'}</div>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入 URL 或文本..." spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>结果</span>
            <button style={styles.copyBtn} onClick={() => copy(output, 'url')} disabled={!output}>
              {copiedId === 'url' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'url' ? '已复制' : '复制'}
            </button>
          </div>
          <textarea style={styles.textareaReadonly} value={output} readOnly spellCheck={false} />
        </div>
      </div>
    </ToolShell>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')
  const { copy, copiedId } = useCopy()

  const process = useCallback(() => {
    try {
      setError('')
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch {
      setError('解码失败：无效的 Base64 字符串')
      setOutput('')
    }
  }, [input, mode])

  const clear = () => { setInput(''); setOutput(''); setError('') }

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.btnGroup}>
            <button style={styles.btn(mode === 'encode')} onClick={() => setMode('encode')}>编码</button>
            <button style={styles.btn(mode === 'decode')} onClick={() => setMode('decode')}>解码</button>
          </div>
          <button style={styles.btnPrimary} onClick={process}>
            <RefreshCw size={12} /> {mode === 'encode' ? '编码' : '解码'}
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>{mode === 'encode' ? '原文' : 'Base64'}</div>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'} spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>{mode === 'encode' ? 'Base64 结果' : '解码结果'}</span>
            <button style={styles.copyBtn} onClick={() => copy(output, 'b64')} disabled={!output}>
              {copiedId === 'b64' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'b64' ? '已复制' : '复制'}
            </button>
          </div>
          {error ? <div style={styles.error}>{error}</div> :
            <textarea style={styles.textareaReadonly} value={output} readOnly spellCheck={false} />}
        </div>
      </div>
    </ToolShell>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('联系我们：support@example.com 或 sales@company.org\n更多信息请访问官网。')
  const [matches, setMatches] = useState<RegExpMatchArray[]>([])
  const [error, setError] = useState('')
  const { copy, copiedId } = useCopy()

  const testRegex = useCallback(() => {
    try {
      const regex = new RegExp(pattern, flags)
      const allMatches: RegExpMatchArray[] = []
      let match: RegExpExecArray | null
      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          allMatches.push(match)
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        const m = testText.match(regex)
        if (m) allMatches.push(m)
      }
      setMatches(allMatches)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '正则表达式错误')
      setMatches([])
    }
  }, [pattern, flags, testText])

  const clear = () => { setPattern(''); setTestText(''); setMatches([]); setError('') }

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.row}>
            <span style={styles.inlineCode}>/</span>
            <input style={styles.input} value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="正则表达式" spellCheck={false} />
            <span style={styles.inlineCode}>/</span>
            <input style={{ ...styles.input, maxWidth: 60 }} value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="gim" spellCheck={false} />
          </div>
          <button style={styles.btnPrimary} onClick={testRegex}>
            <RefreshCw size={12} /> 测试
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>测试文本</div>
          <textarea style={styles.textarea} value={testText} onChange={(e) => setTestText(e.target.value)} placeholder="输入要测试的文本..." spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>结果</span>
            <span style={styles.matchCount}>{matches.length} 个匹配</span>
          </div>
          {error ? <div style={styles.error}>{error}</div> :
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {matches.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6, fontSize: 13 }}>
                  {pattern ? '没有找到匹配' : '输入正则表达式并点击测试'}
                </div>
              ) : matches.slice(0, 30).map((m, i) => (
                <div key={i} style={styles.listItem}>
                  <span style={{ ...styles.inlineCode, minWidth: 40, textAlign: 'center' }}>{i + 1}</span>
                  <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>{m[0]}</code>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>位置: {m.index}</span>
                  <button style={styles.copyBtn} onClick={() => copy(m[0], `re-${i}`)}>
                    {copiedId === `re-${i}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </ToolShell>
  )
}

function HashTool() {
  const [input, setInput] = useState('Hello, World!')
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const { copy, copiedId } = useCopy()

  const crc32 = useCallback((str: string): string => {
    let crc = 0xFFFFFFFF
    const table: number[] = []
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      }
      table[i] = c
    }
    for (let i = 0; i < str.length; i++) {
      crc = table[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8)
    }
    const result = (crc ^ 0xFFFFFFFF) >>> 0
    return result.toString(16).padStart(8, '0')
  }, [])

  const generate = useCallback(async () => {
    setError('')
    const results: Record<string, string> = {}
    try {
      const enc = new TextEncoder().encode(input)
      for (const algo of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
        const buf = await crypto.subtle.digest(algo, enc)
        results[algo] = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    } catch { setError('Web Crypto API 不可用') }
    try { results['CRC32'] = crc32(input) } catch { /* ignore */ }
    setHashes(results)
  }, [input, crc32])

  const clear = () => { setInput(''); setHashes({}) }

  return (
    <ToolShell
      toolbar={
        <>
          <button style={styles.btnPrimary} onClick={generate}>
            <Hash size={12} /> 生成哈希
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>输入</div>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入要哈希的文本..." spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>哈希结果</div>
          {error ? <div style={styles.error}>{error}</div> :
            <div>
              {Object.keys(hashes).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6, fontSize: 13 }}>
                  点击"生成哈希"按钮开始
                </div>
              ) : Object.entries(hashes).map(([name, value]) => (
                <div key={name} style={styles.listItem}>
                  <span style={{ ...styles.inlineCode, minWidth: 90, textAlign: 'center' }}>{name}</span>
                  <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{value}</code>
                  <button style={styles.copyBtn} onClick={() => copy(value, `hash-${name}`)}>
                    {copiedId === `hash-${name}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </ToolShell>
  )
}

function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  const [tsInput, setTsInput] = useState(() => Math.floor(Date.now() / 1000))
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 16))
  const [direction, setDirection] = useState<'ts2date' | 'date2ts'>('ts2date')
  const { copy, copiedId } = useCopy()

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const tsToDate = (ts: number) => {
    try { return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false }) }
    catch { return '无效时间戳' }
  }

  const dateToTs = (str: string) => {
    try { return Math.floor(new Date(str).getTime() / 1000) }
    catch { return 0 }
  }

  const unixNow = Math.floor(now / 1000)
  const msNow = now
  const conversionResult = direction === 'ts2date' ? tsToDate(tsInput) : String(dateToTs(dateInput))
  const isoResult = direction === 'ts2date' ? new Date(tsInput * 1000).toISOString() : new Date(dateToTs(dateInput) * 1000).toISOString()

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.btnGroup}>
            <button style={styles.btn(direction === 'ts2date')} onClick={() => setDirection('ts2date')}>时间戳 → 日期</button>
            <button style={styles.btn(direction === 'date2ts')} onClick={() => setDirection('date2ts')}>日期 → 时间戳</button>
          </div>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unix (秒)</div>
          <div style={styles.statValue}>
            <code>{unixNow}</code>
            <button style={styles.copyBtn} onClick={() => copy(String(unixNow), 'ts-sec')}>
              {copiedId === 'ts-sec' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unix (毫秒)</div>
          <div style={styles.statValue}>
            <code>{msNow}</code>
            <button style={styles.copyBtn} onClick={() => copy(String(msNow), 'ts-ms')}>
              {copiedId === 'ts-ms' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>当前时间</div>
          <div style={{ ...styles.statValue, fontFamily: 'inherit', fontSize: 13 }}>
            {new Date(now).toLocaleString('zh-CN', { hour12: false })}
          </div>
        </div>
      </div>
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>输入</div>
          {direction === 'ts2date' ? (
            <input type="number" style={{ ...styles.input, margin: 10 }} value={tsInput} onChange={(e) => setTsInput(parseInt(e.target.value) || 0)} placeholder="输入 Unix 时间戳（秒）" />
          ) : (
            <input type="datetime-local" style={{ ...styles.input, margin: 10 }} value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
          )}
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>转换结果</span>
            <button style={styles.copyBtn} onClick={() => copy(conversionResult, 'ts-res')}>
              {copiedId === 'ts-res' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'ts-res' ? '已复制' : '复制'}
            </button>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontFamily: 'monospace' }}>
            <div><span style={styles.label}>日期时间：</span><code>{conversionResult}</code></div>
            <div><span style={styles.label}>ISO 格式：</span><code>{isoResult}</code></div>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}

function UUIDTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const { copy, copiedId } = useCopy()

  const generate = useCallback(() => {
    const make = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    setUuids(Array.from({ length: count }, make))
  }, [count])

  const clear = () => setUuids([])

  return (
    <ToolShell
      toolbar={
        <>
          <div style={styles.row}>
            <span style={styles.label}>数量：</span>
            <input type="number" min={1} max={100} style={{ ...styles.input, maxWidth: 80 }}
              value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))} />
          </div>
          <button style={styles.btnPrimary} onClick={generate}>
            <Sparkles size={12} /> 生成 UUID
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panel}>
        <div style={styles.panelLabel}>
          <span>UUID 列表</span>
          {uuids.length > 0 && (
            <button style={styles.copyBtn} onClick={() => copy(uuids.join('\n'), 'uuids')}>
              {copiedId === 'uuids' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'uuids' ? '已复制全部' : '复制全部'}
            </button>
          )}
        </div>
        <div>
          {uuids.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6, fontSize: 13 }}>
              点击"生成 UUID"按钮开始
            </div>
          ) : uuids.map((uuid, i) => (
            <div key={i} style={styles.listItem}>
              <span style={{ ...styles.inlineCode, minWidth: 40, textAlign: 'center' }}>{i + 1}</span>
              <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>{uuid}</code>
              <button style={styles.copyBtn} onClick={() => copy(uuid, `uuid-${i}`)}>
                {copiedId === `uuid-${i}` ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  )
}

function JWTTool() {
  const [token, setToken] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const { copy, copiedId } = useCopy()

  const decode = useCallback(() => {
    setError('')
    setHeader(''); setPayload(''); setSignature('')
    try {
      const parts = token.trim().split('.')
      if (parts.length !== 3) { setError('无效的 JWT 格式，应由三段以 . 分隔的字符串组成'); return }
      const decodePart = (s: string) => {
        const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
        try { return JSON.stringify(JSON.parse(decodeURIComponent(escape(b))), null, 2) }
        catch { return b }
      }
      setHeader(decodePart(parts[0]))
      setPayload(decodePart(parts[1]))
      setSignature(parts[2])
    } catch (e) {
      setError('解码失败：' + (e instanceof Error ? e.message : '无效的 Base64'))
    }
  }, [token])

  const clear = () => { setToken(''); setHeader(''); setPayload(''); setSignature(''); setError('') }

  return (
    <ToolShell
      toolbar={
        <>
          <button style={styles.btnPrimary} onClick={decode}>
            <RefreshCw size={12} /> 解码
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>JWT Token</div>
          <textarea style={{ ...styles.textarea, minHeight: 80 }} value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="粘贴 JWT Token..." spellCheck={false} />
        </div>
        {error ? <div style={styles.error}>{error}</div> :
          <>
            <div style={styles.panel}>
              <div style={styles.panelLabel}>
                <span>Header (头部)</span>
                {header && <button style={styles.copyBtn} onClick={() => copy(header, 'jwt-h')}>
                  {copiedId === 'jwt-h' ? <Check size={12} /> : <Copy size={12} />}
                </button>}
              </div>
              <textarea style={styles.textareaReadonly} value={header} readOnly spellCheck={false} />
            </div>
            <div style={styles.panel}>
              <div style={styles.panelLabel}>
                <span>Payload (载荷)</span>
                {payload && <button style={styles.copyBtn} onClick={() => copy(payload, 'jwt-p')}>
                  {copiedId === 'jwt-p' ? <Check size={12} /> : <Copy size={12} />}
                </button>}
              </div>
              <textarea style={styles.textareaReadonly} value={payload} readOnly spellCheck={false} />
            </div>
            <div style={styles.panel}>
              <div style={styles.panelLabel}>
                <span>Signature (签名)</span>
                {signature && <button style={styles.copyBtn} onClick={() => copy(signature, 'jwt-s')}>
                  {copiedId === 'jwt-s' ? <Check size={12} /> : <Copy size={12} />}
                </button>}
              </div>
              <textarea style={styles.textareaReadonly} value={signature} readOnly spellCheck={false} />
            </div>
          </>
        }
      </div>
    </ToolShell>
  )
}

function ColorTool() {
  const [color, setColor] = useState('#6366f1')
  const { copy, copiedId } = useCopy()

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
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
  }

  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const hexUpper = color.toUpperCase()

  return (
    <ToolShell
      toolbar={
        <>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ width: 44, height: 32, border: '1px solid var(--window-border)', borderRadius: 6, padding: 0, cursor: 'pointer', background: 'none' }} />
          <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ ...styles.input, maxWidth: 120 }} spellCheck={false} />
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={{ height: 80, background: color, borderRadius: 8, margin: 10 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>HEX</div>
            <div style={styles.statValue}>
              <code>{hexUpper}</code>
              <button style={styles.copyBtn} onClick={() => copy(hexUpper, 'hex')}>
                {copiedId === 'hex' ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>RGB</div>
            <div style={styles.statValue}>
              <code>{rgbStr}</code>
              <button style={styles.copyBtn} onClick={() => copy(rgbStr, 'rgb')}>
                {copiedId === 'rgb' ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>HSL</div>
            <div style={styles.statValue}>
              <code>{hslStr}</code>
              <button style={styles.copyBtn} onClick={() => copy(hslStr, 'hsl')}>
                {copiedId === 'hsl' ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>RGB 输入</div>
          <div style={{ display: 'flex', gap: 10, padding: 10 }}>
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textAlign: 'center' }}>
                  {ch.toUpperCase()} ({rgb[ch]})
                </div>
                <input type="range" min={0} max={255} value={rgb[ch]}
                  onChange={(e) => setColor(rgbToHex(
                    ch === 'r' ? parseInt(e.target.value) : rgb.r,
                    ch === 'g' ? parseInt(e.target.value) : rgb.g,
                    ch === 'b' ? parseInt(e.target.value) : rgb.b
                  ))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  )
}

function CSSTool() {
  const [input, setInput] = useState(`.button {
  background: #6366f1;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  transition: background 0.2s;
}

.button:hover {
  background: #4f46e5;
}`)
  const [result, setResult] = useState('')
  const { copy, copiedId } = useCopy()

  const validate = useCallback(() => {
    const errors: string[] = []
    const warnings: string[] = []

    const openBraces = (input.match(/\{/g) || []).length
    const closeBraces = (input.match(/\}/g) || []).length
    if (openBraces !== closeBraces) {
      errors.push(`大括号不匹配：左 { ${openBraces} 个，右 } ${closeBraces} 个`)
    }

    const rules = input.split('}').map(r => r.trim()).filter(Boolean)
    rules.forEach((rule, i) => {
      const parts = rule.split('{')
      if (parts.length > 1) {
        const decls = parts[1].split(';').map(d => d.trim()).filter(Boolean)
        decls.forEach((decl) => {
          if (!decl.includes(':')) {
            errors.push(`规则 ${i + 1}：声明缺少冒号 → "${decl.slice(0, 40)}"`)
          } else {
            const [prop] = decl.split(':')
            const validProps = ['color', 'background', 'background-color', 'font-size', 'font-weight',
              'padding', 'margin', 'border', 'border-radius', 'width', 'height',
              'display', 'position', 'top', 'left', 'right', 'bottom',
              'transition', 'transform', 'box-shadow', 'opacity', 'z-index',
              'flex', 'flex-direction', 'justify-content', 'align-items', 'gap',
              'grid', 'grid-template-columns', 'animation', 'overflow', 'cursor',
              'text-align', 'text-decoration', 'line-height', 'letter-spacing',
              'max-width', 'min-width', 'max-height', 'min-height']
            if (!validProps.includes(prop.trim()) && !prop.includes('--')) {
              warnings.push(`规则 ${i + 1}：可能的非标准属性 → "${prop.trim()}"`)
            }
          }
        })
      }
    })

    const hexColors = input.match(/#[0-9a-fA-F]{3,8}/g) || []
    hexColors.forEach((c) => {
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c)) {
        warnings.push(`可能无效的十六进制颜色 → "${c}"`)
      }
    })

    if (errors.length === 0 && warnings.length === 0) {
      setResult('✓ CSS 语法检查通过，未发现问题。')
    } else {
      const output: string[] = []
      if (errors.length > 0) {
        output.push(`❌ 错误 (${errors.length})：\n${errors.map(e => '  • ' + e).join('\n')}`)
      }
      if (warnings.length > 0) {
        output.push(`\n⚠️  警告 (${warnings.length})：\n${warnings.map(w => '  • ' + w).join('\n')}`)
      }
      if (errors.length === 0) {
        output.push('\n✓ 无语法错误，仅有警告。')
      }
      setResult(output.join('\n'))
    }
  }, [input])

  const clear = () => { setInput(''); setResult('') }

  return (
    <ToolShell
      toolbar={
        <>
          <button style={styles.btnPrimary} onClick={validate}>
            <RefreshCw size={12} /> 验证
          </button>
          <button style={styles.btnDanger} onClick={clear}>清空</button>
        </>
      }
    >
      <div style={styles.panels}>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>CSS 输入</div>
          <textarea style={styles.textarea} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 CSS 代码..." spellCheck={false} />
        </div>
        <div style={styles.panel}>
          <div style={styles.panelLabel}>
            <span>验证结果</span>
            {result && <button style={styles.copyBtn} onClick={() => copy(result, 'css')}>
              {copiedId === 'css' ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === 'css' ? '已复制' : '复制'}
            </button>}
          </div>
          <textarea style={styles.textareaReadonly} value={result} readOnly spellCheck={false} />
        </div>
      </div>
    </ToolShell>
  )
}

export default DevToolkit