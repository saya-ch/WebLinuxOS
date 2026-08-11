import { useState, useCallback, useMemo } from 'react'

type TabId = 'diff' | 'base' | 'url' | 'base64' | 'timestamp' | 'hash' | 'uuid' | 'regex' | 'cron' | 'jwt'

interface TabInfo {
  id: TabId
  label: string
  icon: string
}

const TABS: TabInfo[] = [
  { id: 'diff', label: '文本对比', icon: 'diff' },
  { id: 'base', label: '进制转换', icon: 'hash' },
  { id: 'url', label: 'URL编解码', icon: 'link' },
  { id: 'base64', label: 'Base64', icon: 'file' },
  { id: 'timestamp', label: '时间戳', icon: 'clock' },
  { id: 'hash', label: '哈希', icon: 'shield' },
  { id: 'uuid', label: 'UUID', icon: 'fingerprint' },
  { id: 'regex', label: '正则测试', icon: 'search' },
  { id: 'cron', label: 'Cron解析', icon: 'calendar' },
  { id: 'jwt', label: 'JWT解码', icon: 'key' },
]

const PRESET_HASHES = [
  { algo: 'SHA-1', len: 40 },
  { algo: 'SHA-256', len: 64 },
  { algo: 'SHA-384', len: 96 },
  { algo: 'SHA-512', len: 128 },
] as const

export default function InstantTools() {
  const [activeTab, setActiveTab] = useState<TabId>('diff')

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.title}>
          <span style={styles.titleIcon}>⚡</span>
          <h1 style={styles.titleText}>InstantTools</h1>
          <span style={styles.subtitle}>开发者即时工具箱</span>
        </div>
      </header>

      <div style={styles.body}>
        <nav style={styles.sidebar}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.id ? styles.tabBtnActive : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.tabIcon}>{getTabEmoji(tab.icon)}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <main style={styles.content}>
          {activeTab === 'diff' && <DiffTool />}
          {activeTab === 'base' && <BaseConverter />}
          {activeTab === 'url' && <UrlTool />}
          {activeTab === 'base64' && <Base64Tool />}
          {activeTab === 'timestamp' && <TimestampTool />}
          {activeTab === 'hash' && <HashTool />}
          {activeTab === 'uuid' && <UuidTool />}
          {activeTab === 'regex' && <RegexTool />}
          {activeTab === 'cron' && <CronTool />}
          {activeTab === 'jwt' && <JwtTool />}
        </main>
      </div>
    </div>
  )
}

function getTabEmoji(icon: string): string {
  const map: Record<string, string> = {
    diff: '📝',
    hash: '🔢',
    link: '🔗',
    file: '📄',
    clock: '⏰',
    shield: '🛡️',
    fingerprint: '🆔',
    search: '🔍',
    calendar: '📅',
    key: '🔑',
  }
  return map[icon] || '⚙️'
}

function DiffTool() {
  const [left, setLeft] = useState('Hello World\nLine 2\nLine 3\nCommon line\nEnd')
  const [right, setRight] = useState('Hello World\nLine 2 modified\nLine 3\nNew line\nCommon line\nEnd')

  const diffResult = useMemo(() => computeDiff(left, right), [left, right])
  const stats = useMemo(() => {
    const leftLines = left.split('\n')
    const rightLines = right.split('\n')
    const added = diffResult.filter((d) => d.type === 'added').length
    const removed = diffResult.filter((d) => d.type === 'removed').length
    return { left: leftLines.length, right: rightLines.length, added, removed }
  }, [left, right, diffResult])

  return (
    <ToolSection title="文本差异比较" description="逐行比较两段文本，高亮显示新增和删除的内容">
      <div style={styles.diffContainer}>
        <div style={styles.textColumn}>
          <div style={styles.columnHeader}>原文 ({stats.left}行)</div>
          <textarea
            style={styles.textArea}
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="输入原文..."
            spellCheck={false}
          />
        </div>
        <div style={styles.textColumn}>
          <div style={styles.columnHeader}>对比 ({stats.right}行)</div>
          <textarea
            style={styles.textArea}
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="输入对比文本..."
            spellCheck={false}
          />
        </div>
      </div>
      <div style={styles.diffStats}>
        <span>新增 <strong style={{ color: '#4ade80' }}>{stats.added}</strong> 行</span>
        <span>删除 <strong style={{ color: '#f87171' }}>{stats.removed}</strong> 行</span>
      </div>
      <div style={styles.diffResult}>
        {diffResult.map((item, i) => (
          <div
            key={i}
            style={{
              ...styles.diffLine,
              ...(item.type === 'added' ? styles.diffAdded : item.type === 'removed' ? styles.diffRemoved : styles.diffUnchanged),
            }}
          >
            <span style={styles.diffMarker}>{item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </ToolSection>
  )
}

function computeDiff(left: string, right: string): Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> {
  const leftLines = left.split('\n')
  const rightLines = right.split('\n')
  const m = leftLines.length
  const n = rightLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (leftLines[i - 1] === rightLines[j - 1]) {
      result.unshift({ type: 'unchanged', text: leftLines[i - 1] })
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.unshift({ type: 'removed', text: leftLines[i - 1] })
      i--
    } else {
      result.unshift({ type: 'added', text: rightLines[j - 1] })
      j--
    }
  }
  while (i > 0) {
    result.unshift({ type: 'removed', text: leftLines[i - 1] })
    i--
  }
  while (j > 0) {
    result.unshift({ type: 'added', text: rightLines[j - 1] })
    j--
  }
  return result
}

function BaseConverter() {
  const [value, setValue] = useState('255')
  const [fromBase, setFromBase] = useState(10)

  const results = useMemo(() => {
    const num = parseInt(value, fromBase)
    if (isNaN(num)) return null
    return {
      binary: num.toString(2),
      octal: num.toString(8),
      decimal: num.toString(10),
      hex: num.toString(16).toUpperCase(),
      base36: num.toString(36).toUpperCase(),
    }
  }, [value, fromBase])

  const bases = [2, 8, 10, 16]

  return (
    <ToolSection title="进制转换器" description="在二进制、八进制、十进制、十六进制等进制之间相互转换">
      <div style={styles.inputRow}>
        <input
          style={{ ...styles.input, flex: 2 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="输入数值"
          spellCheck={false}
        />
        <select
          style={styles.select}
          value={fromBase}
          onChange={(e) => setFromBase(Number(e.target.value))}
        >
          {bases.map((b) => (
            <option key={b} value={b}>从 {b} 进制</option>
          ))}
        </select>
      </div>
      {results ? (
        <div style={styles.resultGrid}>
          <ResultCard label="二进制 (Base 2)" value={results.binary} onCopy={() => navigator.clipboard.writeText(results.binary)} />
          <ResultCard label="八进制 (Base 8)" value={results.octal} onCopy={() => navigator.clipboard.writeText(results.octal)} />
          <ResultCard label="十进制 (Base 10)" value={results.decimal} onCopy={() => navigator.clipboard.writeText(results.decimal)} />
          <ResultCard label="十六进制 (Base 16)" value={results.hex} onCopy={() => navigator.clipboard.writeText(results.hex)} />
          <ResultCard label="三十六进制 (Base 36)" value={results.base36} onCopy={() => navigator.clipboard.writeText(results.base36)} />
        </div>
      ) : (
        <div style={styles.errorMsg}>请输入有效的数值</div>
      )}
      <div style={styles.presetRow}>
        <span style={styles.presetLabel}>快速转换：</span>
        {['0', '42', '255', '1024', '65535', '0xFF', '0b1010'].map((v) => (
          <button key={v} style={styles.presetBtn} onClick={() => {
            if (v.startsWith('0x')) { setValue(v.slice(2)); setFromBase(16) }
            else if (v.startsWith('0b')) { setValue(v.slice(2)); setFromBase(2) }
            else { setValue(v); setFromBase(10) }
          }}>{v}</button>
        ))}
      </div>
    </ToolSection>
  )
}

function UrlTool() {
  const [input, setInput] = useState('https://www.example.com/path?q=hello world&name=test')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const output = useMemo(() => {
    try {
      return mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
    } catch {
      return '解码失败：输入不是有效的编码字符串'
    }
  }, [input, mode])

  const parsedUrl = useMemo(() => {
    if (mode === 'encode') {
      try {
        const url = new URL(input)
        return {
          protocol: url.protocol,
          hostname: url.hostname,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          origin: url.origin,
        }
      } catch {
        return null
      }
    }
    return null
  }, [input, mode])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(output)
  }, [output])

  return (
    <ToolSection title="URL 编解码器" description="URL 编码/解码，同时解析 URL 各组成部分">
      <div style={styles.toggleRow}>
        <button
          style={{ ...styles.toggleBtn, ...(mode === 'encode' ? styles.toggleActive : {}) }}
          onClick={() => setMode('encode')}
        >编码</button>
        <button
          style={{ ...styles.toggleBtn, ...(mode === 'decode' ? styles.toggleActive : {}) }}
          onClick={() => setMode('decode')}
        >解码</button>
      </div>
      <textarea
        style={{ ...styles.textArea, height: 100 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入 URL 文本..."
        spellCheck={false}
      />
      <div style={styles.outputBox}>
        <div style={styles.outputHeader}>
          <span>结果</span>
          <button style={styles.copyBtn} onClick={copy}>📋 复制</button>
        </div>
        <code style={styles.outputCode}>{output}</code>
      </div>
      {parsedUrl && (
        <div style={styles.urlParsed}>
          <h3 style={styles.subHeading}>URL 解析结果</h3>
          {Object.entries(parsedUrl).map(([k, v]) => (
            <div key={k} style={styles.parseRow}>
              <span style={styles.parseKey}>{k}</span>
              <code style={styles.parseValue}>{v || '-'}</code>
            </div>
          ))}
        </div>
      )}
    </ToolSection>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('Hello, WebLinuxOS!')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const output = useMemo(() => {
    try {
      if (mode === 'encode') {
        return btoa(unescape(encodeURIComponent(input)))
      } else {
        return decodeURIComponent(escape(atob(input)))
      }
    } catch {
      return '操作失败：输入格式无效'
    }
  }, [input, mode])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(output)
  }, [output])

  return (
    <ToolSection title="Base64 编解码" description="在文本和 Base64 之间相互转换，支持多语言字符">
      <div style={styles.toggleRow}>
        <button
          style={{ ...styles.toggleBtn, ...(mode === 'encode' ? styles.toggleActive : {}) }}
          onClick={() => setMode('encode')}
        >编码</button>
        <button
          style={{ ...styles.toggleBtn, ...(mode === 'decode' ? styles.toggleActive : {}) }}
          onClick={() => setMode('decode')}
        >解码</button>
      </div>
      <textarea
        style={{ ...styles.textArea, height: 100 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入 Base64 字符串...'}
        spellCheck={false}
      />
      <div style={styles.outputBox}>
        <div style={styles.outputHeader}>
          <span>结果</span>
          <button style={styles.copyBtn} onClick={copy}>📋 复制</button>
        </div>
        <code style={styles.outputCode}>{output}</code>
      </div>
    </ToolSection>
  )
}

function TimestampTool() {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString())
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 19))

  const fromTsResult = useMemo(() => {
    const ts = Number(timestamp)
    if (isNaN(ts)) return null
    const ms = timestamp.length <= 10 ? ts * 1000 : ts
    const date = new Date(ms)
    if (isNaN(date.getTime())) return null
    return {
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      iso: date.toISOString(),
      relative: getRelativeTime(date),
    }
  }, [timestamp])

  const fromDateResult = useMemo(() => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return {
      unix: Math.floor(d.getTime() / 1000).toString(),
      ms: d.getTime().toString(),
      iso: d.toISOString(),
    }
  }, [dateStr])

  return (
    <ToolSection title="时间戳转换" description="Unix 时间戳与日期格式相互转换，支持秒级和毫秒级">
      <div style={styles.timestampGrid}>
        <div style={styles.timestampCard}>
          <h3 style={styles.subHeading}>时间戳 → 日期</h3>
          <input
            style={styles.input}
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="输入时间戳（秒或毫秒）"
            spellCheck={false}
          />
          {fromTsResult ? (
            <div style={styles.resultList}>
              <ResultLine label="UTC" value={fromTsResult.utc} />
              <ResultLine label="本地" value={fromTsResult.local} />
              <ResultLine label="ISO" value={fromTsResult.iso} />
              <ResultLine label="相对" value={fromTsResult.relative} />
            </div>
          ) : (
            <div style={styles.errorMsg}>无效的时间戳</div>
          )}
          <button style={styles.actionBtn} onClick={() => setTimestamp(Math.floor(Date.now() / 1000).toString())}>
            获取当前时间戳
          </button>
        </div>

        <div style={styles.timestampCard}>
          <h3 style={styles.subHeading}>日期 → 时间戳</h3>
          <input
            style={styles.input}
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
          {fromDateResult ? (
            <div style={styles.resultList}>
              <ResultLine label="Unix 秒" value={fromDateResult.unix} />
              <ResultLine label="Unix 毫秒" value={fromDateResult.ms} />
              <ResultLine label="ISO" value={fromDateResult.iso} />
            </div>
          ) : (
            <div style={styles.errorMsg}>无效的日期</div>
          )}
        </div>
      </div>
    </ToolSection>
  )
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const absDiff = Math.abs(diff)
  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const prefix = diff > 0 ? '已过去' : '将在'
  const suffix = diff > 0 ? '前' : '后'

  if (seconds < 60) return `${prefix} ${seconds} 秒${suffix}`
  if (minutes < 60) return `${prefix} ${minutes} 分钟${suffix}`
  if (hours < 24) return `${prefix} ${hours} 小时${suffix}`
  if (days < 7) return `${prefix} ${days} 天${suffix}`
  if (weeks < 5) return `${prefix} ${weeks} 周${suffix}`
  if (months < 12) return `${prefix} ${months} 个月${suffix}`
  return `${prefix} ${years} 年${suffix}`
}

async function computeHash(text: string, algo: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest(algo, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return '哈希计算失败'
  }
}

function HashTool() {
  const [text, setText] = useState('Hello WebLinuxOS')
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [computing, setComputing] = useState(false)

  const compute = useCallback(async () => {
    setComputing(true)
    const results: Record<string, string> = {}
    for (const { algo } of PRESET_HASHES) {
      results[algo] = await computeHash(text, algo)
    }
    setHashes(results)
    setComputing(false)
  }, [text])

  useMemo(() => { compute() }, [text])

  return (
    <ToolSection title="哈希生成器" description="使用 Web Crypto API 在本地计算 SHA-1/256/384/512 哈希值">
      <textarea
        style={{ ...styles.textArea, height: 100 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入要计算哈希的文本..."
        spellCheck={false}
      />
      {computing && <div style={styles.loading}>计算中...</div>}
      <div style={styles.hashGrid}>
        {PRESET_HASHES.map(({ algo, len }) => (
          <div key={algo} style={styles.hashCard}>
            <div style={styles.hashHeader}>
              <span style={styles.hashName}>{algo}</span>
              <span style={styles.hashLen}>{len} 字符</span>
              <button
                style={styles.copySmallBtn}
                onClick={() => hashes[algo] && navigator.clipboard.writeText(hashes[algo])}
              >📋</button>
            </div>
            <code style={styles.hashCode}>{hashes[algo] || '...'}</code>
          </div>
        ))}
      </div>
    </ToolSection>
  )
}

function UuidTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(5)

  const generate = useCallback(() => {
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push(generateV4())
    }
    setUuids(list)
  }, [count])

  const copyAll = useCallback(() => {
    navigator.clipboard.writeText(uuids.join('\n'))
  }, [uuids])

  useMemo(() => { generate() }, [])

  return (
    <ToolSection title="UUID 生成器" description="生成符合 RFC 4122 v4 标准的 UUID">
      <div style={styles.inputRow}>
        <label style={styles.label}>数量:</label>
        <input
          style={{ ...styles.input, width: 80 }}
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
        />
        <button style={styles.primaryBtn} onClick={generate}>生成</button>
        <button style={styles.copyBtn} onClick={copyAll}>复制全部</button>
      </div>
      <div style={styles.uuidList}>
        {uuids.map((uuid, i) => (
          <div key={i} style={styles.uuidItem}>
            <code style={styles.uuidCode}>{uuid}</code>
            <button
              style={styles.copySmallBtn}
              onClick={() => navigator.clipboard.writeText(uuid)}
            >📋</button>
          </div>
        ))}
      </div>
    </ToolSection>
  )
}

function generateV4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\b(\\w+)\\b')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('Hello World! This is a test with numbers 123 and emails test@example.com')

  const matches = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags)
      const found: Array<{ match: string; index: number; groups: string[] }> = []
      let m
      if (flags.includes('g')) {
        while ((m = regex.exec(testText)) !== null) {
          found.push({ match: m[0], index: m.index, groups: m.slice(1) })
          if (m[0] === '') regex.lastIndex++
        }
      } else {
        m = regex.exec(testText)
        if (m) found.push({ match: m[0], index: m.index, groups: m.slice(1) })
      }
      return { matches: found, error: null as string | null }
    } catch (e) {
      return { matches: [], error: (e as Error).message }
    }
  }, [pattern, flags, testText])

  const presetPatterns = [
    { name: '邮箱', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+' },
    { name: '手机号', pattern: '1[3-9]\\d{9}' },
    { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?' },
    { name: 'IP', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
    { name: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}' },
    { name: '中文字', pattern: '[\\u4e00-\\u9fff]+' },
  ]

  return (
    <ToolSection title="正则表达式测试器" description="实时测试正则表达式，查看匹配结果和捕获组">
      <div style={styles.regexHeader}>
        <input
          style={styles.regexInput}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="正则表达式"
          spellCheck={false}
        />
        <input
          style={styles.flagsInput}
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          spellCheck={false}
        />
      </div>
      <textarea
        style={{ ...styles.textArea, height: 80 }}
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        placeholder="输入测试文本..."
        spellCheck={false}
      />
      {matches.error && <div style={styles.errorMsg}>正则错误: {matches.error}</div>}
      <div style={styles.matchInfo}>
        <span>找到 <strong style={{ color: '#60a5fa' }}>{matches.matches.length}</strong> 个匹配</span>
      </div>
      <div style={styles.matchesList}>
        {matches.matches.slice(0, 20).map((m, i) => (
          <div key={i} style={styles.matchItem}>
            <span style={styles.matchIndex}>#{i + 1}</span>
            <code style={styles.matchText}>{m.match}</code>
            {m.groups.length > 0 && (
              <span style={styles.matchGroups}>组: [{m.groups.join(', ')}]</span>
            )}
          </div>
        ))}
        {matches.matches.length > 20 && (
          <div style={styles.moreMsg}>还有 {matches.matches.length - 20} 个匹配...</div>
        )}
      </div>
      <div style={styles.presetRow}>
        <span style={styles.presetLabel}>常用正则：</span>
        {presetPatterns.map((p) => (
          <button
            key={p.name}
            style={styles.presetBtn}
            onClick={() => { setPattern(p.pattern); setFlags('g') }}
          >{p.name}</button>
        ))}
      </div>
    </ToolSection>
  )
}

function CronTool() {
  const [expression, setExpression] = useState('*/5 * * * *')

  const parsed = useMemo(() => parseCron(expression), [expression])

  const presets = [
    { name: '每 5 分钟', value: '*/5 * * * *' },
    { name: '每小时', value: '0 * * * *' },
    { name: '每天零点', value: '0 0 * * *' },
    { name: '工作日 9 点', value: '0 9 * * 1-5' },
    { name: '每周一早 8', value: '0 8 * * 1' },
    { name: '每月 1 号', value: '0 0 1 * *' },
  ]

  return (
    <ToolSection title="Cron 表达式解析" description="解析 Cron 表达式，显示含义和最近几次执行时间">
      <div style={styles.inputRow}>
        <input
          style={{ ...styles.input, fontFamily: 'monospace', fontSize: 18 }}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
        />
      </div>
      {parsed.valid ? (
        <>
          <div style={styles.cronDescription}>
            <strong>含义：</strong> {parsed.description}
          </div>
          <div style={styles.cronFields}>
            {['分钟', '小时', '日', '月', '星期'].map((label, i) => (
              <div key={i} style={styles.cronField}>
                <span style={styles.cronFieldLabel}>{label}</span>
                <code style={styles.cronFieldValue}>{parsed.fields[i]}</code>
              </div>
            ))}
          </div>
          <div style={styles.cronSchedule}>
            <strong>最近执行时间：</strong>
            <div style={styles.scheduleList}>
              {parsed.nextTimes.map((t, i) => (
                <div key={i} style={styles.scheduleItem}>{t}</div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={styles.errorMsg}>无效的 Cron 表达式</div>
      )}
      <div style={styles.presetRow}>
        <span style={styles.presetLabel}>预设：</span>
        {presets.map((p) => (
          <button key={p.value} style={styles.presetBtn} onClick={() => setExpression(p.value)}>
            {p.name}
          </button>
        ))}
      </div>
    </ToolSection>
  )
}

function parseCron(expr: string): { valid: boolean; description: string; fields: string[]; nextTimes: string[] } {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return { valid: false, description: '', fields: [], nextTimes: [] }

  const [minute, hour, day, month, weekday] = parts
  const fieldNames = ['分钟', '小时', '日', '月', '星期']
  const descriptions: string[] = []

  parts.forEach((part, i) => {
    if (part === '*') {
      descriptions.push(`每${fieldNames[i]}`)
    } else if (part.startsWith('*/')) {
      descriptions.push(`每 ${part.slice(2)} ${fieldNames[i]}`)
    } else if (part.includes(',')) {
      descriptions.push(`${fieldNames[i]}在 ${part}`)
    } else if (part.includes('-')) {
      descriptions.push(`${fieldNames[i]} ${part}`)
    } else {
      descriptions.push(`${fieldNames[i]}为 ${part}`)
    }
  })

  try {
    const nextTimes: string[] = []
    const now = new Date()
    const minutes = parseField(minute, 0, 59)
    const hours = parseField(hour, 0, 23)
    const days = parseField(day, 1, 31)
    const months = parseField(month, 1, 12)
    const weekdays = parseField(weekday, 0, 6)

    if (minutes.length === 0 || hours.length === 0 || days.length === 0 || months.length === 0 || weekdays.length === 0) {
      return { valid: false, description: '', fields: parts, nextTimes: [] }
    }

    let candidate = new Date(now)
    candidate.setSeconds(0, 0)
    candidate.setMinutes(candidate.getMinutes() + 1)

    for (let iter = 0; iter < 500; iter++) {
      const m = candidate.getMinutes()
      const h = candidate.getHours()
      const d = candidate.getDate()
      const mo = candidate.getMonth() + 1
      const wd = candidate.getDay()

      if (minutes.includes(m) && hours.includes(h) && days.includes(d) && months.includes(mo) && weekdays.includes(wd)) {
        nextTimes.push(candidate.toLocaleString())
        if (nextTimes.length === 5) break
        candidate = new Date(candidate.getTime() + 60000)
      } else {
        candidate = new Date(candidate.getTime() + 60000)
      }
    }

    return {
      valid: true,
      description: descriptions.join('，'),
      fields: parts,
      nextTimes,
    }
  } catch {
    return { valid: false, description: '', fields: parts, nextTimes: [] }
  }
}

function parseField(field: string, min: number, max: number): number[] {
  const values = new Set<number>()
  const parts = field.split(',')

  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i)
    } else if (part.startsWith('*/')) {
      const step = Number(part.slice(2))
      if (step > 0) {
        for (let i = min; i <= max; i += step) values.add(i)
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (start <= end) {
        for (let i = Math.max(min, start); i <= Math.min(max, end); i++) values.add(i)
      }
    } else {
      const val = Number(part)
      if (!isNaN(val) && val >= min && val <= max) values.add(val)
    }
  }

  return Array.from(values).sort((a, b) => a - b)
}

function JwtTool() {
  const [token, setToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')

  const decoded = useMemo(() => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return { valid: false, error: 'JWT 必须包含 3 部分' }
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      const exp = payload.exp ? new Date(payload.exp * 1000) : null
      const isExpired = exp ? Date.now() > exp.getTime() : null
      return { valid: true, header, payload, exp, isExpired, raw: parts }
    } catch (e) {
      return { valid: false, error: '无效的 JWT 格式' }
    }
  }, [token])

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return (
    <ToolSection title="JWT 解码器" description="解析 JWT Token 的 Header、Payload 和签名信息">
      <textarea
        style={{ ...styles.textArea, height: 100 }}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="粘贴 JWT Token..."
        spellCheck={false}
      />
      {decoded.valid ? (
        <div style={styles.jwtContainer}>
          {decoded.exp && (
            <div style={{
              ...styles.jwtBadge,
              ...(decoded.isExpired ? styles.jwtExpired : styles.jwtValid),
            }}>
              {decoded.isExpired ? '⚠️ 已过期' : '✅ 有效'}
              {decoded.exp && ` (过期时间: ${decoded.exp.toLocaleString()})`}
            </div>
          )}
          <div style={styles.jwtSection}>
            <div style={styles.jwtSectionHeader}>
              <span>Header</span>
              <button style={styles.copySmallBtn} onClick={() => copy(JSON.stringify(decoded.header, null, 2))}>📋</button>
            </div>
            <pre style={styles.jwtCode}>{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>
          <div style={styles.jwtSection}>
            <div style={styles.jwtSectionHeader}>
              <span>Payload</span>
              <button style={styles.copySmallBtn} onClick={() => copy(JSON.stringify(decoded.payload, null, 2))}>📋</button>
            </div>
            <pre style={styles.jwtCode}>{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
          <div style={styles.jwtSection}>
            <div style={styles.jwtSectionHeader}>
              <span>Signature</span>
            </div>
            <code style={styles.jwtSig}>{decoded.raw?.[2]}</code>
          </div>
        </div>
      ) : (
        <div style={styles.errorMsg}>{decoded.error}</div>
      )}
    </ToolSection>
  )
}

function ToolSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={styles.toolSection}>
      <div style={styles.toolHeader}>
        <h2 style={styles.toolTitle}>{title}</h2>
        <p style={styles.toolDesc}>{description}</p>
      </div>
      <div style={styles.toolContent}>{children}</div>
    </div>
  )
}

function ResultCard({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div style={styles.resultCard}>
      <div style={styles.resultCardHeader}>
        <span style={styles.resultLabel}>{label}</span>
        <button style={styles.copySmallBtn} onClick={onCopy}>📋</button>
      </div>
      <code style={styles.resultCode}>{value}</code>
    </div>
  )
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.resultLine}>
      <span style={styles.resultLineLabel}>{label}</span>
      <code style={styles.resultLineCode}>{value}</code>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0f0f1a',
    color: '#e2e8f0',
    fontFamily: 'inherit',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
    flexShrink: 0,
  },
  title: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  titleIcon: { fontSize: 28 },
  titleText: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 400,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: 140,
    padding: 12,
    background: 'rgba(30, 27, 75, 0.5)',
    borderRight: '1px solid rgba(99, 102, 241, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflowY: 'auto',
    flexShrink: 0,
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#c7d2fe',
    fontWeight: 600,
  },
  tabIcon: { fontSize: 16 },
  content: {
    flex: 1,
    padding: 24,
    overflowY: 'auto',
  },
  toolSection: {
    maxWidth: 900,
  },
  toolHeader: {
    marginBottom: 20,
  },
  toolTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: '0 0 6px',
    color: '#f1f5f9',
  },
  toolDesc: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0,
  },
  toolContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 12px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
  },
  textArea: {
    width: '100%',
    padding: 14,
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    resize: 'vertical',
    outline: 'none',
    minHeight: 80,
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  toggleRow: {
    display: 'flex',
    gap: 8,
  },
  toggleBtn: {
    padding: '8px 20px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'rgba(99, 102, 241, 0.3)',
    color: '#c7d2fe',
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  primaryBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  actionBtn: {
    padding: '10px 16px',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#c7d2fe',
    cursor: 'pointer',
    fontSize: 13,
  },
  copyBtn: {
    padding: '10px 16px',
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    color: '#6ee7b7',
    cursor: 'pointer',
    fontSize: 13,
  },
  copySmallBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    padding: 2,
  },
  label: { fontSize: 13, color: '#94a3b8' },
  errorMsg: {
    padding: 12,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    color: '#fca5a5',
    fontSize: 13,
  },
  loading: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    padding: 8,
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 10,
  },
  resultCard: {
    padding: 12,
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  resultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultLabel: { fontSize: 12, color: '#94a3b8' },
  resultCode: {
    display: 'block',
    padding: 8,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
    minHeight: 20,
  },
  resultList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    margin: '10px 0',
  },
  resultLine: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    padding: '6px 10px',
    background: 'rgba(15, 15, 26, 0.4)',
    borderRadius: 6,
  },
  resultLineLabel: {
    width: 60,
    fontSize: 12,
    color: '#94a3b8',
    flexShrink: 0,
  },
  resultLineCode: {
    flex: 1,
    color: '#c7d2fe',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
  },
  diffContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  textColumn: { display: 'flex', flexDirection: 'column', gap: 6 },
  columnHeader: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
    padding: '4px 8px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
  },
  diffStats: {
    display: 'flex',
    gap: 16,
    padding: '8px 12px',
    background: 'rgba(15, 15, 26, 0.6)',
    borderRadius: 8,
    fontSize: 13,
  },
  diffResult: {
    maxHeight: 300,
    overflowY: 'auto',
    borderRadius: 8,
    border: '1px solid rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
  },
  diffLine: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '4px 10px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    borderBottom: '1px solid rgba(99, 102, 241, 0.05)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  diffAdded: { background: 'rgba(34, 197, 94, 0.15)', color: '#86efac' },
  diffRemoved: { background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' },
  diffUnchanged: { background: 'transparent', color: '#94a3b8' },
  diffMarker: {
    width: 20,
    flexShrink: 0,
    textAlign: 'center',
    fontWeight: 700,
  },
  outputBox: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(99, 102, 241, 0.1)',
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  outputCode: {
    display: 'block',
    padding: 12,
    color: '#c7d2fe',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
  },
  urlParsed: {
    marginTop: 12,
    padding: 12,
    background: 'rgba(15, 15, 26, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 8px',
    color: '#f1f5f9',
  },
  parseRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '4px 0',
    fontSize: 12,
  },
  parseKey: {
    width: 80,
    color: '#818cf8',
    fontWeight: 600,
  },
  parseValue: {
    flex: 1,
    color: '#e2e8f0',
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
  },
  presetRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  presetLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 4,
  },
  presetBtn: {
    padding: '4px 10px',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
    color: '#c7d2fe',
    cursor: 'pointer',
    fontSize: 12,
  },
  timestampGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  timestampCard: {
    padding: 16,
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  hashGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 10,
  },
  hashCard: {
    padding: 12,
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  hashHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  hashName: { fontSize: 13, fontWeight: 600, color: '#c7d2fe' },
  hashLen: { fontSize: 11, color: '#64748b', flex: 1 },
  hashCode: {
    display: 'block',
    padding: 8,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
    minHeight: 20,
    maxHeight: 80,
    overflowY: 'auto',
  },
  uuidList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 300,
    overflowY: 'auto',
  },
  uuidItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(15, 15, 26, 0.6)',
    borderRadius: 6,
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  uuidCode: {
    flex: 1,
    color: '#c7d2fe',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
  },
  regexHeader: {
    display: 'flex',
    gap: 8,
  },
  regexInput: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, monospace',
    outline: 'none',
  },
  flagsInput: {
    width: 80,
    padding: '10px 12px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, monospace',
    outline: 'none',
    textAlign: 'center',
  },
  matchInfo: {
    fontSize: 13,
    color: '#94a3b8',
  },
  matchesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 200,
    overflowY: 'auto',
  },
  matchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    background: 'rgba(96, 165, 250, 0.08)',
    borderRadius: 6,
    fontSize: 13,
  },
  matchIndex: {
    width: 30,
    color: '#818cf8',
    fontWeight: 600,
    fontSize: 12,
  },
  matchText: {
    flex: 1,
    color: '#bfdbfe',
    fontFamily: 'JetBrains Mono, monospace',
  },
  matchGroups: {
    fontSize: 11,
    color: '#64748b',
  },
  moreMsg: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    padding: 4,
  },
  cronDescription: {
    padding: '10px 14px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
    fontSize: 14,
    color: '#c7d2fe',
  },
  cronFields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
  },
  cronField: {
    padding: 8,
    background: 'rgba(15, 15, 26, 0.6)',
    borderRadius: 6,
    textAlign: 'center',
  },
  cronFieldLabel: {
    display: 'block',
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  cronFieldValue: {
    display: 'block',
    fontSize: 14,
    color: '#e2e8f0',
    fontFamily: 'JetBrains Mono, monospace',
  },
  cronSchedule: {
    fontSize: 13,
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 8,
  },
  scheduleItem: {
    padding: '4px 10px',
    background: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 4,
    color: '#6ee7b7',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
  },
  jwtContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  jwtBadge: {
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  jwtValid: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#6ee7b7',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  jwtExpired: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  jwtSection: {
    background: 'rgba(15, 15, 26, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
  },
  jwtSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(99, 102, 241, 0.1)',
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  jwtCode: {
    margin: 0,
    padding: 12,
    color: '#c7d2fe',
    fontSize: 12,
    fontFamily: 'JetBrains Mono, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: 150,
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 0,
  },
  jwtSig: {
    display: 'block',
    padding: 12,
    color: '#fbbf24',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    wordBreak: 'break-all',
    background: 'rgba(0, 0, 0, 0.3)',
  },
}