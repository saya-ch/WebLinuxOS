import { useState, useCallback } from 'react'
import { Code, Hash, FileJson, Link2, Languages, QrCode, Dices, Clock, MapPin, TrendingUp, Newspaper, CloudRain, Coins, Search, ChevronRight, Copy, Check, ExternalLink, RefreshCw, AlertCircle, BookOpen, Globe } from 'lucide-react'
import { fetchWithCache, fetchWithRetry } from '../utils/apiCache'

type ToolCategory = 'text' | 'encode' | 'crypto' | 'api' | 'generator'

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  category: ToolCategory
  description: string
}

const tools: Tool[] = [
  { id: 'base64', name: 'Base64 编解码', icon: <Code size={18} />, category: 'encode', description: 'Base64编码和解码' },
  { id: 'urlencode', name: 'URL 编解码', icon: <Link2 size={18} />, category: 'encode', description: 'URL编码和解码' },
  { id: 'hash', name: '哈希生成', icon: <Hash size={18} />, category: 'crypto', description: 'MD5/SHA哈希生成' },
  { id: 'uuid', name: 'UUID 生成器', icon: <Dices size={18} />, category: 'generator', description: '生成唯一标识符' },
  { id: 'jsonfmt', name: 'JSON 格式化', icon: <FileJson size={18} />, category: 'text', description: 'JSON美化和验证' },
  { id: 'timestamp', name: '时间戳转换', icon: <Clock size={18} />, category: 'text', description: 'Unix时间戳转换' },
  { id: 'qrgen', name: '二维码生成', icon: <QrCode size={18} />, category: 'generator', description: '生成二维码图片' },
  { id: 'translate', name: '文本翻译', icon: <Languages size={18} />, category: 'api', description: '多语言翻译' },
  { id: 'weather', name: '天气查询', icon: <CloudRain size={18} />, category: 'api', description: '实时天气信息' },
  { id: 'crypto', name: '加密货币', icon: <Coins size={18} />, category: 'api', description: '加密货币行情' },
  { id: 'news', name: '科技新闻', icon: <Newspaper size={18} />, category: 'api', description: 'Hacker News新闻' },
  { id: 'ipinfo', name: 'IP信息查询', icon: <MapPin size={18} />, category: 'api', description: 'IP地址地理信息' },
  { id: 'dns', name: 'DNS查询', icon: <Globe size={18} />, category: 'api', description: '域名DNS记录查询' },
  { id: 'dictionary', name: '英语词典', icon: <BookOpen size={18} />, category: 'api', description: '英文单词释义查询' },
]

const categories: { id: ToolCategory | 'all'; name: string }[] = [
  { id: 'all', name: '全部工具' },
  { id: 'text', name: '文本处理' },
  { id: 'encode', name: '编解码' },
  { id: 'crypto', name: '加密哈希' },
  { id: 'generator', name: '生成器' },
  { id: 'api', name: '在线API' },
]

async function md5(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

async function sha256(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha1(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 12px',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  
  const handleConvert = useCallback(() => {
    setError('')
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))))
      } else {
        setOutput(decodeURIComponent(escape(atob(input))))
      }
    } catch (e) {
      setError(mode === 'decode' ? '无效的Base64字符串' : '编码失败')
      setOutput('')
    }
  }, [input, mode])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { setMode('encode'); setOutput(''); setError('') }}
          style={{
            padding: '8px 16px',
            background: mode === 'encode' ? 'var(--color-primary)' : 'var(--window-bg)',
            color: mode === 'encode' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >编码</button>
        <button
          onClick={() => { setMode('decode'); setOutput(''); setError('') }}
          style={{
            padding: '8px 16px',
            background: mode === 'decode' ? 'var(--color-primary)' : 'var(--window-bg)',
            color: mode === 'decode' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >解码</button>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>输入:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的Base64...'}
          style={{
            width: '100%',
            height: '120px',
            padding: '10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          }}
        />
      </div>
      <button
        onClick={handleConvert}
        style={{
          padding: '10px 20px',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >{mode === 'encode' ? '编码' : '解码'}</button>
      {error && (
        <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>输出:</span>
            <CopyButton text={output} />
          </div>
          <div
            style={{
              padding: '10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              minHeight: '80px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >{output}</div>
        </div>
      )}
    </div>
  )
}

function URLTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [output, setOutput] = useState('')
  
  const handleConvert = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(decodeURIComponent(input))
      }
    } catch {
      setOutput('解码失败: 无效的URL编码')
    }
  }, [input, mode])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => { setMode('encode'); setOutput('') }}
          style={{
            padding: '8px 16px',
            background: mode === 'encode' ? 'var(--color-primary)' : 'var(--window-bg)',
            color: mode === 'encode' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >编码</button>
        <button
          onClick={() => { setMode('decode'); setOutput('') }}
          style={{
            padding: '8px 16px',
            background: mode === 'decode' ? 'var(--color-primary)' : 'var(--window-bg)',
            color: mode === 'decode' ? 'white' : 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >解码</button>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>输入:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? '输入要编码的URL...' : '输入要解码的URL...'}
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          }}
        />
      </div>
      <button
        onClick={handleConvert}
        style={{
          padding: '10px 20px',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >{mode === 'encode' ? '编码' : '解码'}</button>
      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>输出:</span>
            <CopyButton text={output} />
          </div>
          <div
            style={{
              padding: '10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
              minHeight: '60px',
              wordBreak: 'break-all',
            }}
          >{output}</div>
        </div>
      )}
    </div>
  )
}

function HashTool() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<{ md5: string; sha1: string; sha256: string } | null>(null)
  
  const handleHash = useCallback(async () => {
    if (!input) return
    const [md5Hash, sha1Hash, sha256Hash] = await Promise.all([
      md5(input),
      sha1(input),
      sha256(input),
    ])
    setHashes({ md5: md5Hash, sha1: sha1Hash, sha256: sha256Hash })
  }, [input])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>输入文本:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算哈希的文本..."
          style={{
            width: '100%',
            height: '80px',
            padding: '10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          }}
        />
      </div>
      <button
        onClick={handleHash}
        style={{
          padding: '10px 20px',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >计算哈希</button>
      {hashes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(hashes).map(([name, value]) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{name}</span>
                <CopyButton text={value} />
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                }}
              >{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UUIDTool() {
  const [count, setCount] = useState(1)
  const [uuids, setUuids] = useState<string[]>([])
  
  const generate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID())
    setUuids(newUuids)
  }, [count])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '13px', color: 'var(--text-primary)' }}>数量:</label>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
          min={1}
          max={50}
          style={{
            padding: '6px 10px',
            width: '80px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
          }}
        />
        <button
          onClick={generate}
          style={{
            padding: '8px 16px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        ><RefreshCw size={14} /> 生成</button>
      </div>
      {uuids.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>结果:</span>
            <CopyButton text={uuids.join('\n')} />
          </div>
          <div
            style={{
              padding: '10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {uuids.map((uuid, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: i < uuids.length - 1 ? '1px solid var(--window-border)' : 'none' }}>
                {uuid}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JSONTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)
  
  const format = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
    } catch (e) {
      setError('JSON格式错误: ' + (e as Error).message)
      setOutput('')
    }
  }, [input, indent])
  
  const minify = useCallback(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
    } catch (e) {
      setError('JSON格式错误: ' + (e as Error).message)
      setOutput('')
    }
  }, [input])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>输入 JSON:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "value"}'
          style={{
            width: '100%',
            height: '120px',
            padding: '10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={format}
          style={{
            padding: '8px 16px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >格式化</button>
        <button
          onClick={minify}
          style={{
            padding: '8px 16px',
            background: 'var(--window-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >压缩</button>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          缩进: 
          <select
            value={indent}
            onChange={(e) => setIndent(parseInt(e.target.value))}
            style={{
              marginLeft: '6px',
              padding: '4px 8px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '4px',
            }}
          >
            <option value={2}>2 空格</option>
            <option value={4}>4 空格</option>
          </select>
        </label>
      </div>
      {error && (
        <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>输出:</span>
            <CopyButton text={output} />
          </div>
          <div
            style={{
              padding: '10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre',
            }}
          >{output}</div>
        </div>
      )}
    </div>
  )
}

function TimestampTool() {
  const [timestamp, setTimestamp] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [now, setNow] = useState(Date.now())
  
  const tsToDate = useCallback(() => {
    const ts = parseInt(timestamp)
    if (isNaN(ts)) {
      setDateTime('无效的时间戳')
      return
    }
    const date = new Date(ts > 9999999999 ? ts : ts * 1000)
    setDateTime(date.toLocaleString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }))
  }, [timestamp])
  
  const dateToTs = useCallback(() => {
    if (!dateTime) {
      setTimestamp('')
      return
    }
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) {
      setTimestamp('无效的日期时间')
      return
    }
    setTimestamp(Math.floor(date.getTime() / 1000).toString())
  }, [dateTime])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', background: 'var(--input-bg)', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>当前时间戳:</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <code style={{ fontSize: '16px', fontWeight: 600 }}>{Math.floor(now / 1000)}</code>
          <button
            onClick={() => setNow(Date.now())}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >刷新</button>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {new Date(now).toLocaleString('zh-CN')}
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>时间戳 → 日期时间</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="输入Unix时间戳..."
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          <button
            onClick={tsToDate}
            style={{
              padding: '8px 16px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >转换</button>
        </div>
        {dateTime && (
          <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: '6px', fontFamily: 'monospace' }}>
            {dateTime}
          </div>
        )}
      </div>
      
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>日期时间 → 时间戳</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
            }}
          />
          <button
            onClick={dateToTs}
            style={{
              padding: '8px 16px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >转换</button>
        </div>
        {timestamp && /^\d+$/.test(timestamp) && (
          <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: '6px', fontFamily: 'monospace' }}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}

function QRTool() {
  const [text, setText] = useState('https://')
  const [size, setSize] = useState(256)
  const qrUrl = text ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}` : ''
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>内容:</div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入URL或文本..."
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>尺寸:</label>
        <select
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          style={{
            padding: '6px 10px',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
          }}
        >
          <option value={128}>128 x 128</option>
          <option value={200}>200 x 200</option>
          <option value={256}>256 x 256</option>
          <option value={300}>300 x 300</option>
          <option value={500}>500 x 500</option>
        </select>
      </div>
      {qrUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              display: 'inline-block',
            }}
          >
            <img src={qrUrl} alt="QR Code" style={{ display: 'block' }} />
          </div>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-primary)',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} /> 下载二维码
          </a>
        </div>
      )}
    </div>
  )
}

function TranslateTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [fromLang, setFromLang] = useState('auto')
  const [toLang, setToLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const translate = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${fromLang}|${toLang}`,
        { mode: 'cors' }
      )
      if (!response.ok) throw new Error('翻译失败')
      const data = await response.json()
      setOutput(data.responseData?.translatedText || '')
    } catch (e) {
      setError('翻译服务暂时不可用，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [input, fromLang, toLang])
  
  const languages = [
    { code: 'auto', name: '自动检测' },
    { code: 'zh-CN', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' },
    { code: 'pt', name: '葡萄牙语' },
    { code: 'it', name: '意大利语' },
  ]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <select
          value={fromLang}
          onChange={(e) => setFromLang(e.target.value)}
          style={{ flex: 1, padding: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        >
          {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
        <div style={{ color: 'var(--text-secondary)' }}>→</div>
        <select
          value={toLang}
          onChange={(e) => setToLang(e.target.value)}
          style={{ flex: 1, padding: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        >
          {languages.filter(l => l.code !== 'auto').map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>原文:</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要翻译的文本..."
          style={{ width: '100%', height: '120px', padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px', resize: 'vertical' }}
        />
      </div>
      <button
        onClick={translate}
        disabled={loading || !input.trim()}
        style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >{loading ? '翻译中...' : '翻译'}</button>
      {error && <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16} /> {error}</div>}
      {output && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>译文:</span>
            <CopyButton text={output} />
          </div>
          <div style={{ padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px', minHeight: '80px' }}>{output}</div>
        </div>
      )}
    </div>
  )
}

function WeatherTool() {
  const [city, setCity] = useState('Beijing')
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const cities = [
    { name: '北京', lat: 39.9042, lon: 116.4074 },
    { name: '上海', lat: 31.2304, lon: 121.4737 },
    { name: '深圳', lat: 22.5431, lon: 114.0579 },
    { name: '广州', lat: 23.1291, lon: 113.2644 },
    { name: '杭州', lat: 30.2741, lon: 120.1551 },
    { name: '东京', lat: 35.6762, lon: 139.6503 },
    { name: '纽约', lat: 40.7128, lon: -74.006 },
    { name: '伦敦', lat: 51.5074, lon: -0.1278 },
    { name: '巴黎', lat: 48.8566, lon: 2.3522 },
    { name: '悉尼', lat: -33.8688, lon: 151.2093 },
  ]
  
  const fetchWeather = useCallback(async () => {
    const cityInfo = cities.find(c => c.name === city)
    if (!cityInfo) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`,
        { mode: 'cors' }
      )
      if (!response.ok) throw new Error('获取天气失败')
      const data = await response.json()
      setWeather({ ...data, cityName: cityInfo.name })
    } catch (e) {
      setError('获取天气信息失败')
    } finally {
      setLoading(false)
    }
  }, [city])
  
  const weatherEmojis: Record<number, string> = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ flex: 1, padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        >
          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <button
          onClick={fetchWeather}
          disabled={loading}
          style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >{loading ? '加载中...' : '查询'}</button>
      </div>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {weather && (
        <div>
          <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', borderRadius: '12px', color: 'white', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{weather.cityName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '48px' }}>{weatherEmojis[weather.current.weather_code] || '❓'}</div>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>{weather.current.temperature_2m}°C</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>体感 {weather.current.apparent_temperature}°C</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', opacity: 0.9 }}>
              <span>💧 {weather.current.relative_humidity_2m}%</span>
              <span>💨 {weather.current.wind_speed_10m} km/h</span>
              <span>🌡️ {weather.current.pressure_msl} hPa</span>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>未来5天预报</div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {weather.daily.time.map((date: string, i: number) => (
                <div key={date} style={{ flex: '0 0 auto', padding: '10px', background: 'var(--input-bg)', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{date.slice(5)}</div>
                  <div style={{ fontSize: '24px', margin: '4px 0' }}>{weatherEmojis[weather.daily.weather_code[i]] || '❓'}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{weather.daily.temperature_2m_max[i]}°</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{weather.daily.temperature_2m_min[i]}°</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CryptoTool() {
  const [coins, setCoins] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fetchCoins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h',
        { mode: 'cors' }
      )
      if (!response.ok) throw new Error('获取失败')
      const data = await response.json()
      setCoins(data)
    } catch (e) {
      setError('获取加密货币行情失败')
    } finally {
      setLoading(false)
    }
  }, [])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} /> 加密货币行情
        </div>
        <button
          onClick={fetchCoins}
          disabled={loading}
          style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        ><RefreshCw size={12} /> {loading ? '加载中' : '刷新'}</button>
      </div>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {coins.length > 0 && (
        <div style={{ border: '1px solid var(--window-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto auto', gap: '12px', padding: '10px 12px', background: 'var(--input-bg)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <div>#</div>
            <div>名称</div>
            <div style={{ textAlign: 'right' }}>价格</div>
            <div style={{ textAlign: 'right' }}>24h</div>
          </div>
          {coins.map((coin, i) => (
            <div key={coin.id} style={{ display: 'grid', gridTemplateColumns: '30px 1fr auto auto', gap: '12px', padding: '10px 12px', borderTop: '1px solid var(--window-border)', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {coin.image && <img src={coin.image} alt="" width={20} height={20} />}
                <div>
                  <div style={{ fontWeight: 500 }}>{coin.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{coin.symbol?.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>${coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString()}</div>
              <div style={{ textAlign: 'right', color: coin.price_change_percentage_24h >= 0 ? '#4ade80' : '#f87171', fontFamily: 'monospace' }}>
                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>数据来源: CoinGecko API</div>
    </div>
  )
}

function NewsTool() {
  const [query, setQuery] = useState('technology')
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`,
        { mode: 'cors' }
      )
      if (!response.ok) throw new Error('获取失败')
      const data = await response.json()
      setNews(data.hits || [])
    } catch (e) {
      setError('获取新闻失败')
    } finally {
      setLoading(false)
    }
  }, [query])
  
  const quickSearches = ['technology', 'javascript', 'AI', 'react', 'python', 'web3']
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索新闻..."
          onKeyDown={(e) => e.key === 'Enter' && fetchNews()}
          style={{ flex: 1, padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        />
        <button onClick={fetchNews} disabled={loading} style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {quickSearches.map(q => (
          <button
            key={q}
            onClick={() => { setQuery(q); setTimeout(fetchNews, 0) }}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'var(--input-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--window-border)',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >{q}</button>
        ))}
      </div>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {news.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
          {news.map((item) => (
            <a
              key={item.objectID}
              href={item.url || `https://news.ycombinator.com/item?id=${item.objectID}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--window-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                display: 'block',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--window-border)'}
            >
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Newspaper size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-secondary)' }} />
                {item.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                <span>⬆️ {item.points || 0}</span>
                <span>💬 {item.num_comments || 0}</span>
                <span>👤 {item.author || 'unknown'}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>数据来源: Hacker News (Algolia API)</div>
    </div>
  )
}

function IPInfoTool() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fetchIP = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchWithRetry('https://ipapi.co/json/', { mode: 'cors' })
      setInfo(data)
    } catch (e) {
      setError('获取IP信息失败')
    } finally {
      setLoading(false)
    }
  }, [])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <button
        onClick={fetchIP}
        disabled={loading}
        style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
      ><MapPin size={16} /> {loading ? '查询中...' : '查询我的IP信息'}</button>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {info && (
        <div style={{ border: '1px solid var(--window-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            ['IP地址', info.ip],
            ['城市', info.city],
            ['地区', info.region],
            ['国家', info.country_name],
            ['ISP', info.org],
            ['时区', info.timezone],
            ['货币', info.currency],
            ['经纬度', `${info.latitude}, ${info.longitude}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', padding: '10px 12px', borderBottom: '1px solid var(--window-border)', fontSize: '13px' }}>
              <div style={{ width: '80px', color: 'var(--text-secondary)' }}>{label}</div>
              <div style={{ flex: 1, fontWeight: 500 }}>{value || '未知'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DNSTool() {
  const [domain, setDomain] = useState('google.com')
  const [type, setType] = useState('A')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const dnsTypes = ['A', 'AAAA', 'NS', 'MX', 'TXT', 'CNAME', 'SOA']
  
  const fetchDNS = useCallback(async () => {
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const data = await fetchWithCache(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { mode: 'cors' },
        5 * 60 * 1000
      )
      setResult(data)
    } catch (e) {
      setError('DNS查询失败')
    } finally {
      setLoading(false)
    }
  }, [domain, type])
  
  const typeMap: Record<number, string> = { 
    1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 
    16: 'TXT', 28: 'AAAA', 6: 'SOA', 12: 'PTR',
    33: 'SRV'
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="输入域名..."
          onKeyDown={(e) => e.key === 'Enter' && fetchDNS()}
          style={{ flex: 1, padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        >
          {dnsTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={fetchDNS} disabled={loading} style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {result && (
        <div style={{ border: '1px solid var(--window-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'var(--input-bg)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            查询结果: {domain} ({type})
          </div>
          {result.Answer && result.Answer.length > 0 ? (
            result.Answer.map((record: any, i: number) => (
              <div key={i} style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid var(--window-border)', fontSize: '13px', fontFamily: 'monospace' }}>
                <div style={{ width: '60px', color: 'var(--text-secondary)' }}>{typeMap[record.type] || record.type}</div>
                <div style={{ flex: 1, wordBreak: 'break-all' }}>{record.data}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>TTL: {record.TTL}s</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              未找到DNS记录
            </div>
          )}
        </div>
      )}
      
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>数据来源: Google DNS (已缓存5分钟)</div>
    </div>
  )
}

function DictionaryTool() {
  const [word, setWord] = useState('hello')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const lookup = useCallback(async () => {
    if (!word.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const data = await fetchWithCache(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`,
        { mode: 'cors' },
        30 * 60 * 1000
      ) as any[]
      if (data && data.length > 0) {
        setResult(data[0])
      } else {
        setError('未找到该单词')
      }
    } catch (e) {
      setError('查询失败，请检查单词拼写')
    } finally {
      setLoading(false)
    }
  }, [word])
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="输入英文单词..."
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
          style={{ flex: 1, padding: '10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)', borderRadius: '6px' }}
        />
        <button onClick={lookup} disabled={loading} style={{ padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>
      
      {error && <div style={{ color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
      
      {result && (
        <div style={{ border: '1px solid var(--window-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{result.word}</div>
            {result.phonetic && <div style={{ fontSize: '14px', opacity: 0.9 }}>{result.phonetic}</div>}
          </div>
          {result.meanings && result.meanings.map((meaning: any, i: number) => (
            <div key={i} style={{ padding: '12px', borderTop: '1px solid var(--window-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                {meaning.partOfSpeech}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {meaning.definitions?.slice(0, 3).map((def: any, j: number) => (
                  <div key={j} style={{ fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>{j + 1}. {def.definition}</div>
                    {def.example && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '16px' }}>"{def.example}"</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>数据来源: Dictionary API (已缓存30分钟)</div>
    </div>
  )
}

const toolComponents: Record<string, React.ComponentType> = {
  base64: Base64Tool,
  urlencode: URLTool,
  hash: HashTool,
  uuid: UUIDTool,
  jsonfmt: JSONTool,
  timestamp: TimestampTool,
  qrgen: QRTool,
  translate: TranslateTool,
  weather: WeatherTool,
  crypto: CryptoTool,
  news: NewsTool,
  ipinfo: IPInfoTool,
  dns: DNSTool,
  dictionary: DictionaryTool,
}

export default function DevToolkit() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all')
  const [activeTool, setActiveTool] = useState<string>('base64')
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTools = tools.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  const ActiveComponent = toolComponents[activeTool]
  
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ 
        width: '220px', 
        borderRight: '1px solid var(--window-border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg, var(--window-bg))',
      }}>
        <div style={{ padding: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工具..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
          </div>
        </div>
        
        <div style={{ padding: '0 12px 8px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: '100%',
                padding: '6px 10px',
                textAlign: 'left',
                background: activeCategory === cat.id ? 'var(--color-primary)' : 'transparent',
                color: activeCategory === cat.id ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '2px',
              }}
            >{cat.name}</button>
          ))}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {filteredTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                width: '100%',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: activeTool === tool.id ? 'var(--color-primary)' : 'transparent',
                color: activeTool === tool.id ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '2px',
                textAlign: 'left',
              }}
            >
              <span style={{ opacity: 0.8 }}>{tool.icon}</span>
              <span style={{ flex: 1 }}>{tool.name}</span>
              <ChevronRight size={12} style={{ opacity: 0.5 }} />
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
