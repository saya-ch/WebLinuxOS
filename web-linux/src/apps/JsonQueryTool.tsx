import { useState, useCallback, useMemo } from 'react'

/**
 * JSONQueryTool — 类 jq 的 JSON 数据查询工具
 * 支持 JSONPath 子集语法：$.key, $[0], $.arr[*], $.obj?.key, 深度搜索等
 */

interface QueryResult {
  value: unknown
  path: string
}

const SAMPLE_JSON = `{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin", "tags": ["dev", "lead"] },
    { "id": 2, "name": "Bob", "email": "bob@example.com", "role": "user", "tags": ["design"] },
    { "id": 3, "name": "Charlie", "email": "charlie@example.com", "role": "user", "tags": ["dev", "qa"] }
  ],
  "config": {
    "version": "2.1.0",
    "features": { "darkMode": true, "beta": false },
    "limits": { "maxUsers": 100, "storage": "5GB" }
  },
  "stats": {
    "totalUsers": 3,
    "activeToday": 2,
    "revenue": [1200, 3400, 2100, 5600]
  }
}`

const PRESETS: { label: string; query: string; desc: string }[] = [
  { label: '所有用户名', query: '$.users[*].name', desc: '提取所有用户的 name 字段' },
  { label: '管理员信息', query: '$.users[?(@.role==="admin")]', desc: '筛选 role 为 admin 的用户' },
  { label: '收入总和', query: '$.stats.revenue[*]', desc: '获取所有收入数据' },
  { label: '版本号', query: '$.config.version', desc: '获取嵌套属性' },
  { label: '功能开关', query: '$.config.features', desc: '获取对象属性' },
  { label: '用户邮箱列表', query: '$.users[*].email', desc: '所有用户邮箱' },
  { label: '开发者标签', query: '$.users[?(@.tags.includes("dev"))]', desc: '包含 dev 标签的用户' },
  { label: '限制配置', query: '$.config.limits', desc: 'limits 对象内容' },
]

/** 简化的 JSONPath 查询引擎 */
function jsonQuery(data: unknown, query: string): QueryResult[] {
  const results: QueryResult[] = []
  const q = query.trim()

  if (!q || q === '$') {
    results.push({ value: data, path: '$' })
    return results
  }

  // 移除开头的 $
  const path = q.startsWith('$') ? q.slice(1) : q

  // 递归查询
  function resolve(obj: unknown, remainingPath: string, currentPath: string): void {
    if (!remainingPath) {
      results.push({ value: obj, path: currentPath || '$' })
      return
    }

    // 处理 [?(@.field==="value")] 过滤语法
    const filterMatch = remainingPath.match(/^\[\?\(@\.(\w+)(?:===?)"?([^"\]]+)"?\)\]$/)
    if (filterMatch) {
      const [, field, value] = filterMatch
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          if (item && typeof item === 'object' && (item as Record<string, unknown>)[field] === value) {
            results.push({ value: item, path: `${currentPath}[${i}]` })
          }
        })
      }
      return
    }

    // 处理 .field 语法
    const dotMatch = remainingPath.match(/^\.(\w+)(.*)$/)
    if (dotMatch) {
      const [, key, rest] = dotMatch
      if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
        const val = (obj as Record<string, unknown>)[key]
        if (!rest) {
          results.push({ value: val, path: `${currentPath}.${key}` })
        } else {
          resolve(val, rest, `${currentPath}.${key}`)
        }
      }
      return
    }

    // 处理 [*] 通配符
    const starMatch = remainingPath.match(/^\[\*\](.*)$/)
    if (starMatch) {
      const [, rest] = starMatch
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          if (!rest) {
            results.push({ value: item, path: `${currentPath}[${i}]` })
          } else {
            resolve(item, rest, `${currentPath}[${i}]`)
          }
        })
      }
      return
    }

    // 处理 [n] 数组索引
    const indexMatch = remainingPath.match(/^\[(\d+)\](.*)$/)
    if (indexMatch) {
      const [, idx, rest] = indexMatch
      const i = parseInt(idx)
      if (Array.isArray(obj) && i < obj.length) {
        if (!rest) {
          results.push({ value: obj[i], path: `${currentPath}[${i}]` })
        } else {
          resolve(obj[i], rest, `${currentPath}[${i}]`)
        }
      }
      return
    }

    // 处理嵌套对象搜索 (..field)
    if (remainingPath.startsWith('..')) {
      const field = remainingPath.slice(2)
      deepSearch(obj, field, currentPath)
      return
    }
  }

  function deepSearch(obj: unknown, field: string, currentPath: string): void {
    if (!obj || typeof obj !== 'object') return
    if (field in (obj as Record<string, unknown>)) {
      results.push({ value: (obj as Record<string, unknown>)[field], path: `${currentPath}.${field}` })
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => deepSearch(item, field, `${currentPath}[${i}]`))
    } else {
      Object.entries(obj as Record<string, unknown>).forEach(([key, val]) => {
        deepSearch(val, field, `${currentPath}.${key}`)
      })
    }
  }

  resolve(data, path, '$')
  return results
}

function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

export default function JsonQueryTool() {
  const [input, setInput] = useState(SAMPLE_JSON)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const parsedData = useMemo(() => {
    try {
      const data = JSON.parse(input)
      setError('')
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析失败')
      return null
    }
  }, [input])

  const results = useMemo(() => {
    if (!parsedData || !query.trim()) return []
    try {
      return jsonQuery(parsedData, query)
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败')
      return []
    }
  }, [parsedData, query])

  const handlePreset = useCallback((presetQuery: string) => {
    setQuery(presetQuery)
  }, [])

  const copyResult = useCallback(() => {
    const text = results.length === 1
      ? formatValue(results[0].value)
      : JSON.stringify(results.map(r => r.value), null, 2)
    navigator.clipboard.writeText(text)
  }, [results])

  const statsText = useMemo(() => {
    if (!query.trim()) return '输入查询表达式开始过滤'
    if (results.length === 0) return '无匹配结果'
    return `${results.length} 个匹配结果`
  }, [results.length, query])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--window-border)', background: 'var(--bg-secondary)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>JSON Query</span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>{statsText}</span>
        <div style={{ flex: 1 }} />
        {results.length > 0 && (
          <button onClick={copyResult} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--window-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            复制结果
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧：输入区 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '45%', borderRight: '1px solid var(--window-border)' }}>
          {/* 查询输入 */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--window-border)', background: 'var(--bg-secondary)' }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>查询表达式</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="例: $.users[*].name"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--window-border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* 预设查询 */}
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--window-border)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.query)}
                title={p.desc}
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 3,
                  border: '1px solid var(--window-border)',
                  background: query === p.query ? 'var(--accent)' : 'var(--bg-primary)',
                  color: query === p.query ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* JSON 输入 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                lineHeight: 1.5,
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* 右侧：结果区 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '55%' }}>
          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, borderBottom: '1px solid var(--window-border)' }}>
              {error}
            </div>
          )}

          <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
            {results.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                {query.trim() ? '无匹配结果' : '输入 JSON 数据和查询表达式'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--window-border)',
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontFamily: 'monospace' }}>
                      {r.path}
                    </div>
                    <pre style={{
                      margin: 0,
                      fontSize: 12,
                      fontFamily: "'SF Mono', monospace",
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      lineHeight: 1.5,
                    }}>
                      {formatValue(r.value)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
