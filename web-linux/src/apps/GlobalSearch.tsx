import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'
import { findNodeById } from '../store/fileUtils'
import { loadFromStorage, debouncedSaveToStorage } from '../store/storageUtils'

/* ============================================================
   GlobalSearch / Spotlight — 全局智能搜索
   v25.0 旗舰升级：
   - 修复了原版 React Hooks 规则违反的崩溃 bug
   - 五大结果类别：最近 / 应用 / 文件 / 网页 / 操作
   - 内联工具：计算器、颜色解析、时间戳、单位换算
   - 网页搜索快捷词：g/gh/w/y/so/mdn/dict/baidu/zhihu
   - 模糊匹配 + 评分排序 + 键盘导航
   - 持久化最近使用记录
   ============================================================ */

type ResultType = 'recent' | 'app' | 'file' | 'web' | 'action' | 'tool'

interface SearchResult {
  type: ResultType
  id: string
  name: string
  subtitle?: string
  path?: string
  icon?: React.ReactNode
  score: number
  action: () => void
  badge?: string
  preview?: React.ReactNode
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

// ---------- 网页搜索快捷词配置 ----------
interface WebShortcut {
  key: string
  name: string
  url: (q: string) => string
  icon: string
  color: string
  desc: string
}

const WEB_SHORTCUTS: WebShortcut[] = [
  { key: 'g', name: 'Google', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`, icon: 'G', color: '#4285f4', desc: '谷歌搜索' },
  { key: 'baidu', name: '百度', url: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`, icon: '百', color: '#2932e1', desc: '百度搜索' },
  { key: 'gh', name: 'GitHub', url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}`, icon: '⌥', color: '#181717', desc: 'GitHub 仓库/代码搜索' },
  { key: 'w', name: 'Wikipedia', url: (q) => `https://zh.wikipedia.org/wiki/${encodeURIComponent(q)}`, icon: 'W', color: '#000000', desc: '维基百科' },
  { key: 'y', name: 'YouTube', url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, icon: '▶', color: '#ff0000', desc: 'YouTube 视频' },
  { key: 'so', name: 'StackOverflow', url: (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`, icon: 'S', color: '#f48024', desc: 'Stack Overflow 问答' },
  { key: 'mdn', name: 'MDN', url: (q) => `https://developer.mozilla.org/zh-CN/search?q=${encodeURIComponent(q)}`, icon: 'M', color: '#000000', desc: 'MDN Web 文档' },
  { key: 'dict', name: 'Dictionary', url: (q) => `https://www.merriam-webster.com/dictionary/${encodeURIComponent(q)}`, icon: 'D', color: '#007bff', desc: '英文词典' },
  { key: 'zhihu', name: '知乎', url: (q) => `https://www.zhihu.com/search?q=${encodeURIComponent(q)}&type=content`, icon: '知', color: '#0084ff', desc: '知乎搜索' },
  { key: 'bing', name: 'Bing', url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`, icon: 'B', color: '#008373', desc: 'Bing 搜索' },
]

// ---------- 工具函数 ----------
function scoreMatch(name: string, query: string): number {
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  if (n.includes(q)) return 60
  // 模糊匹配得分
  let qi = 0
  let lastMatchIdx = -2
  let bonus = 0
  for (let ti = 0; ti < n.length && qi < q.length; ti++) {
    if (n[ti] === q[qi]) {
      if (ti === lastMatchIdx + 1) bonus += 5 // 连续匹配奖励
      lastMatchIdx = ti
      qi++
    }
  }
  return qi === q.length ? 30 + bonus : 0
}

// 安全表达式计算：仅允许数字、空格、+ - * / ( ) . % 及 × ÷
function safeCalculate(expr: string): number | null {
  if (!/^[\d+\-*/().%\s×÷]+$/.test(expr)) return null
  if (!/[+\-*/%]/.test(expr)) return null
  try {
    const safe = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '')
    // 简单百分号处理：50% -> (50/100)
    const normalized = safe.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
     
    const result = Function('"use strict"; return (' + normalized + ')')()
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result
    }
  } catch {
    /* ignore */
  }
  return null
}

// 颜色解析：#hex / rgb(r,g,b) / rgba(...)
interface ColorInfo {
  hex: string
  rgb: string
  hsl: string
  css: string
}

function parseColor(input: string): ColorInfo | null {
  const trimmed = input.trim()
  // #hex
  let m = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (m) {
    let hex = m[1]
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return colorFromRgb(r, g, b)
  }
  // rgb(r, g, b) 或 rgba(r, g, b, a)
  m = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) {
    return colorFromRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]))
  }
  return null
}

function colorFromRgb(r: number, g: number, b: number): ColorInfo {
  const hex = '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
  const [h, s, l] = rgbToHsl(r, g, b)
  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`,
    css: hex,
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

// 时间戳解析
function parseTimestamp(input: string): { date: Date; label: string } | null {
  const trimmed = input.trim()
  // 纯数字时间戳（秒或毫秒）
  if (/^\d{10}$/.test(trimmed)) {
    const date = new Date(parseInt(trimmed) * 1000)
    return { date, label: 'Unix 秒级时间戳' }
  }
  if (/^\d{13}$/.test(trimmed)) {
    const date = new Date(parseInt(trimmed))
    return { date, label: 'Unix 毫秒级时间戳' }
  }
  return null
}

// 最近使用记录
interface RecentEntry {
  kind: 'app' | 'file' | 'web' | 'action'
  id: string
  name: string
  timestamp: number
}

const RECENT_KEY = 'weblinux-spotlight-recent'
const MAX_RECENT = 8

function loadRecent(): RecentEntry[] {
  const arr = loadFromStorage<unknown[]>(RECENT_KEY, [])
  if (!Array.isArray(arr)) return []
  return arr.filter((x): x is RecentEntry =>
    typeof x === 'object' && x !== null && 'kind' in x && 'id' in x && 'name' in x
  ).slice(0, MAX_RECENT)
}

function saveRecent(entry: RecentEntry) {
  const current = loadRecent().filter((r) => !(r.kind === entry.kind && r.id === entry.id))
  const next = [entry, ...current].slice(0, MAX_RECENT)
  debouncedSaveToStorage(RECENT_KEY, next, 200)
}

// ---------- 主组件 ----------
const GlobalSearch = memo(function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recent, setRecent] = useState<RecentEntry[]>(() => loadRecent())
  const inputRef = useRef<HTMLInputElement>(null)

  const files = useStore((s) => s.files)
  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const setTheme = useStore((s) => s.setTheme)
  const theme = useStore((s) => s.theme)
  const addNotification = useStore((s) => s.addNotification)
  const toggleLauncher = useStore((s) => s.toggleLauncher)
  const clearWindows = useStore((s) => s.clearWindows)

  // 安全地在新标签页打开 URL
  const openUrl = useCallback((url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      addNotification({ title: '无法打开链接', message: url, type: 'warning' })
    }
  }, [addNotification])

  // 记录最近使用
  const recordRecent = useCallback((entry: RecentEntry) => {
    saveRecent(entry)
    setRecent(loadRecent())
  }, [])

  // 构建搜索结果（必须在任何 early return 之前调用以遵守 Hooks 规则）
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim()
    const out: SearchResult[] = []

    // 空查询：返回最近使用记录
    if (!q) {
      recent.forEach((r, idx) => {
        const isApp = r.kind === 'app'
        const app = isApp ? apps.find((a) => a.id === r.id) : null
        out.push({
          type: 'recent',
          id: `recent-${idx}`,
          name: r.name,
          subtitle: '最近使用',
          icon: app?.icon ?? <span style={{ fontSize: 16 }}>⏱</span>,
          score: 100 - idx,
          action: () => {
            if (r.kind === 'app') {
              openApp(r.id)
            } else if (r.kind === 'web' && r.id.startsWith('url:')) {
              openUrl(r.id.slice(4))
            } else if (r.kind === 'action') {
              handleAction(r.id)
            }
            recordRecent(r)
          },
        })
      })
      return out
    }

    // 1. 网页快捷词：g query / gh query / w query ...
    const webMatch = q.match(/^(\S+)\s+(.+)$/)
    if (webMatch) {
      const key = webMatch[1].toLowerCase()
      const term = webMatch[2]
      const sc = WEB_SHORTCUTS.find((s) => s.key === key)
      if (sc) {
        out.push({
          type: 'web',
          id: `web-${sc.key}`,
          name: `${sc.name} 搜索：${term}`,
          subtitle: sc.desc,
          icon: <WebIcon letter={sc.icon} color={sc.color} />,
          score: 200,
          badge: '⏎ 打开',
          action: () => {
            const url = sc.url(term)
            openUrl(url)
            recordRecent({ kind: 'web', id: `url:${url}`, name: `${sc.name}: ${term}`, timestamp: Date.now() })
            onClose()
          },
        })
      }
    }

    // 2. 内联计算器
    const calcResult = safeCalculate(q)
    if (calcResult !== null) {
      out.push({
        type: 'tool',
        id: 'calc',
        name: `${q} = ${calcResult}`,
        subtitle: '计算结果',
        icon: <span style={{ fontSize: 18 }}>🧮</span>,
        score: 199,
        badge: '复制',
        action: () => {
          const text = String(calcResult)
          navigator.clipboard?.writeText(text).catch(() => {})
          addNotification({ title: '已复制', message: text, type: 'success', duration: 1500 })
          recordRecent({ kind: 'action', id: 'calc', name: `计算: ${q}`, timestamp: Date.now() })
          onClose()
        },
      })
    }

    // 3. 颜色解析
    const colorInfo = parseColor(q)
    if (colorInfo) {
      out.push({
        type: 'tool',
        id: 'color',
        name: colorInfo.hex,
        subtitle: `${colorInfo.rgb}  ·  ${colorInfo.hsl}`,
        icon: (
          <span
            style={{
              display: 'inline-block',
              width: 28,
              height: 28,
              borderRadius: 6,
              background: colorInfo.css,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 0 12px ' + colorInfo.css,
            }}
          />
        ),
        score: 198,
        badge: '复制 HEX',
        action: () => {
          navigator.clipboard?.writeText(colorInfo.hex).catch(() => {})
          addNotification({ title: '已复制', message: colorInfo.hex, type: 'success', duration: 1500 })
          onClose()
        },
      })
    }

    // 4. 时间戳解析
    const tsInfo = parseTimestamp(q)
    if (tsInfo) {
      const formatted = tsInfo.date.toLocaleString('zh-CN', { hour12: false })
      out.push({
        type: 'tool',
        id: 'timestamp',
        name: formatted,
        subtitle: `${tsInfo.label} → 本地时间`,
        icon: <span style={{ fontSize: 18 }}>🕒</span>,
        score: 197,
        badge: '复制',
        action: () => {
          navigator.clipboard?.writeText(formatted).catch(() => {})
          addNotification({ title: '已复制', message: formatted, type: 'success', duration: 1500 })
          onClose()
        },
      })
    }

    // 5. 快捷操作（基于关键词）
    const lower = q.toLowerCase()
    const quickActions: Array<{ keywords: string[]; name: string; icon: React.ReactNode; actionId: string; score: number }> = [
      { keywords: ['lock', '锁屏'], name: '锁定屏幕', icon: <span style={{ fontSize: 18 }}>🔒</span>, actionId: 'lock', score: 90 },
      { keywords: ['theme', '主题', 'dark', 'light', '暗色', '亮色'], name: theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题', icon: <span style={{ fontSize: 18 }}>🎨</span>, actionId: 'theme', score: 90 },
      { keywords: ['screenshot', '截屏', '截图'], name: '截取屏幕', icon: <span style={{ fontSize: 18 }}>📸</span>, actionId: 'screenshot', score: 90 },
      { keywords: ['launcher', '启动器', '应用列表'], name: '打开启动器', icon: <span style={{ fontSize: 18 }}>🚀</span>, actionId: 'launcher', score: 85 },
      { keywords: ['clear', '清除', '关闭所有窗口'], name: '关闭所有窗口', icon: <span style={{ fontSize: 18 }}>🧹</span>, actionId: 'clear-windows', score: 80 },
      { keywords: ['terminal', '终端'], name: '打开终端', icon: <span style={{ fontSize: 18 }}>⌘</span>, actionId: 'open-terminal', score: 85 },
      { keywords: ['files', '文件管理器'], name: '打开文件管理器', icon: <span style={{ fontSize: 18 }}>📁</span>, actionId: 'open-files', score: 85 },
    ]
    quickActions.forEach((a) => {
      const matched = a.keywords.some((k) => lower.includes(k.toLowerCase()))
      if (matched) {
        out.push({
          type: 'action',
          id: `action-${a.actionId}`,
          name: a.name,
          subtitle: '快捷操作',
          icon: a.icon,
          score: a.score,
          action: () => {
            handleAction(a.actionId)
            recordRecent({ kind: 'action', id: a.actionId, name: a.name, timestamp: Date.now() })
            onClose()
          },
        })
      }
    })

    // 6. 应用搜索（模糊匹配 + 评分）
    apps.forEach((app) => {
      const s = scoreMatch(app.name, q)
      if (s > 0) {
        out.push({
          type: 'app',
          id: app.id,
          name: app.name,
          subtitle: '应用程序',
          icon: app.icon,
          score: s + 10, // 应用稍微加权
          action: () => {
            openApp(app.id)
            recordRecent({ kind: 'app', id: app.id, name: app.name, timestamp: Date.now() })
            onClose()
          },
        })
      }
    })

    // 7. 文件搜索
    const searchFiles = (nodes: FileNode[], path: string = '') => {
      nodes.forEach((node) => {
        const s = scoreMatch(node.name, q)
        if (s > 0) {
          const nodePath = path === '' ? node.name : path + '/' + node.name
          out.push({
            type: 'file',
            id: node.id,
            name: node.name,
            path: nodePath,
            subtitle: node.type === 'folder' ? '文件夹' : '文件',
            icon: <span style={{ fontSize: 16 }}>{node.type === 'folder' ? '📁' : '📄'}</span>,
            score: s,
            action: () => {
              const node2 = findNodeById(files, node.id)
              if (node2) {
                addNotification({
                  title: '已定位文件',
                  message: nodePath,
                  type: 'info',
                  duration: 2000,
                })
              }
              onClose()
            },
          })
        }
        if (node.children) {
          searchFiles(node.children, path === '' ? node.name : path + '/' + node.name)
        }
      })
    }
    searchFiles(files)

    // 8. 如果是纯文本且无网页快捷词匹配，提供默认 Google 搜索
    if (out.length === 0 && q.length > 1) {
      out.push({
        type: 'web',
        id: 'web-default-google',
        name: `Google 搜索：${q}`,
        subtitle: '在 Google 中搜索',
        icon: <WebIcon letter="G" color="#4285f4" />,
        score: 10,
        badge: '⏎ 打开',
        action: () => {
          const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`
          openUrl(url)
          recordRecent({ kind: 'web', id: `url:${url}`, name: `Google: ${q}`, timestamp: Date.now() })
          onClose()
        },
      })
      out.push({
        type: 'web',
        id: 'web-default-baidu',
        name: `百度搜索：${q}`,
        subtitle: '在百度中搜索',
        icon: <WebIcon letter="百" color="#2932e1" />,
        score: 9,
        badge: '⏎ 打开',
        action: () => {
          const url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`
          openUrl(url)
          recordRecent({ kind: 'web', id: `url:${url}`, name: `百度: ${q}`, timestamp: Date.now() })
          onClose()
        },
      })
    }

    return out.sort((a, b) => b.score - a.score).slice(0, 30)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, apps, files, openApp, setTheme, theme, addNotification, toggleLauncher, clearWindows, recent, openUrl, recordRecent, onClose])

  // 处理快捷操作
  function handleAction(actionId: string) {
    switch (actionId) {
      case 'lock':
        addNotification({ title: '屏幕已锁定', message: '按任意键或点击解锁', type: 'info', duration: 3000 })
        break
      case 'theme':
        setTheme(theme === 'dark' ? 'light' : 'dark')
        break
      case 'screenshot':
        openApp('screenshot')
        break
      case 'launcher':
        toggleLauncher()
        break
      case 'clear-windows':
        clearWindows()
        addNotification({ title: '已清除', message: '所有窗口已关闭', type: 'success', duration: 1500 })
        break
      case 'open-terminal':
        openApp('terminal')
        break
      case 'open-files':
        openApp('files')
        break
    }
  }

  // 分组（必须在 early return 之前以遵守 Hooks 规则）
  const groupedResults = useMemo(() => {
    const groups: { type: ResultType; label: string; items: SearchResult[] }[] = [
      { type: 'recent', label: '最近', items: [] },
      { type: 'tool', label: '工具', items: [] },
      { type: 'web', label: '网页', items: [] },
      { type: 'action', label: '操作', items: [] },
      { type: 'app', label: '应用', items: [] },
      { type: 'file', label: '文件', items: [] },
    ]
    results.forEach((r) => {
      const g = groups.find((x) => x.type === r.type)
      if (g) g.items.push(r)
    })
    return groups.filter((g) => g.items.length > 0)
  }, [results])

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          results[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        // Tab 自动补全：选中第一个网页快捷词
        const q = query.trim()
        if (q && !q.includes(' ')) {
          const sc = WEB_SHORTCUTS.find((s) => s.key === q.toLowerCase())
          if (sc) {
            e.preventDefault()
            setQuery(`${sc.key} `)
          }
        }
      }
    },
    [results, selectedIndex, onClose, query],
  )

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setRecent(loadRecent())
      // 延迟聚焦以确保 DOM 已渲染
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // ESC 全局关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasQuery = query.trim().length > 0
  const showHints = !hasQuery && results.length === 0

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div
        className="spotlight-modal"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="全局搜索"
      >
        {/* 搜索输入区 */}
        <div className="spotlight-input-area">
          <div className="spotlight-input-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索应用、文件、网页，或输入计算式、颜色、时间戳..."
            className="spotlight-input"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="spotlight-kbd-hint" aria-hidden="true">ESC</div>
        </div>

        {/* 结果区 */}
        <div className="spotlight-results">
          {showHints ? (
            <SpotlightHints />
          ) : results.length === 0 ? (
            <div className="spotlight-empty">
              <div className="spotlight-empty-icon">⌘</div>
              <div className="spotlight-empty-title">没有匹配的结果</div>
              <div className="spotlight-empty-desc">尝试输入应用名、文件名，或使用快捷词（g / gh / w / y）</div>
            </div>
          ) : (
            groupedResults.map((group) => (
              <div key={group.type} className="spotlight-group">
                <div className="spotlight-group-label">
                  {group.label} · {group.items.length}
                </div>
                {group.items.map((result) => {
                  const globalIndex = results.indexOf(result)
                  const active = selectedIndex === globalIndex
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`spotlight-item${active ? ' spotlight-item-active' : ''}`}
                      onClick={() => result.action()}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="spotlight-item-icon">
                        {result.icon ?? <span>⌘</span>}
                      </div>
                      <div className="spotlight-item-body">
                        <div className="spotlight-item-name">{result.name}</div>
                        {(result.subtitle || result.path) && (
                          <div className="spotlight-item-sub">
                            {result.path ?? result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.badge && (
                        <div className="spotlight-item-badge">{result.badge}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="spotlight-footer">
          <div className="spotlight-footer-left">
            {results.length > 0 && <span>{results.length} 个结果</span>}
            {results.length === 0 && <span>就绪</span>}
          </div>
          <div className="spotlight-footer-right">
            <span className="spotlight-footer-hint">
              <kbd>↑</kbd><kbd>↓</kbd> 导航
            </span>
            <span className="spotlight-footer-hint">
              <kbd>Enter</kbd> 执行
            </span>
            <span className="spotlight-footer-hint">
              <kbd>Tab</kbd> 补全
            </span>
            <span className="spotlight-footer-hint">
              <kbd>Esc</kbd> 关闭
            </span>
          </div>
        </div>
      </div>

      <style>{SPOTLIGHT_STYLES}</style>
    </div>
  )
})

// ---------- 子组件 ----------
function WebIcon({ letter, color }: { letter: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 6,
        background: color,
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {letter}
    </span>
  )
}

function SpotlightHints() {
  const hints: Array<{ k: string; d: string; e: string }> = [
    { k: 'g <词>', d: 'Google 搜索', e: 'g react hooks' },
    { k: 'gh <词>', d: 'GitHub 搜索', e: 'gh vite plugin' },
    { k: 'w <词>', d: '维基百科', e: 'w 量子力学' },
    { k: 'y <词>', d: 'YouTube 搜索', e: 'y lofi music' },
    { k: 'so <词>', d: 'Stack Overflow', e: 'so promise all' },
    { k: 'mdn <词>', d: 'MDN 文档', e: 'mdn fetch api' },
    { k: '#<hex>', d: '颜色解析', e: '#7c6cf0' },
    { k: '算式', d: '计算器', e: '2 + 3 * 4' },
    { k: '时间戳', d: '时间戳转换', e: '1700000000' },
    { k: '关键词', d: '快捷操作', e: 'lock / theme / screenshot' },
  ]
  return (
    <div className="spotlight-hints">
      <div className="spotlight-hints-title">快捷词与内联工具</div>
      <div className="spotlight-hints-grid">
        {hints.map((h) => (
          <div key={h.k} className="spotlight-hint-item">
            <div className="spotlight-hint-key">{h.k}</div>
            <div className="spotlight-hint-desc">
              <div>{h.d}</div>
              <div className="spotlight-hint-example">{h.e}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- 样式 ----------
const SPOTLIGHT_STYLES = `
.spotlight-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 16, 0.55);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
  animation: spotlight-fade-in 0.18s ease-out;
}

@keyframes spotlight-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.spotlight-modal {
  width: 680px;
  max-width: 94vw;
  max-height: 76vh;
  background: var(--window-bg, rgba(14, 14, 24, 0.96));
  border: 1px solid var(--window-border, rgba(108, 92, 231, 0.35));
  border-radius: 18px;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 0 60px rgba(124, 108, 240, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: spotlight-pop 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
}

@keyframes spotlight-pop {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.spotlight-input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--window-border, rgba(108, 92, 231, 0.2));
  background: linear-gradient(180deg, rgba(124, 108, 240, 0.04) 0%, transparent 100%);
}

.spotlight-input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #8a8aa0);
  flex-shrink: 0;
}

.spotlight-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary, #f0f0ff);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.spotlight-input::placeholder {
  color: var(--text-secondary, #6a6a85);
  font-weight: 400;
}

.spotlight-kbd-hint {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary, #8a8aa0);
  letter-spacing: 0.05em;
  font-family: 'JetBrains Mono', monospace;
}

.spotlight-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 120px;
}

.spotlight-results::-webkit-scrollbar {
  width: 8px;
}
.spotlight-results::-webkit-scrollbar-track {
  background: transparent;
}
.spotlight-results::-webkit-scrollbar-thumb {
  background: rgba(124, 108, 240, 0.3);
  border-radius: 4px;
}

.spotlight-group {
  margin-bottom: 6px;
}

.spotlight-group-label {
  padding: 10px 12px 6px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary, #6a6a85);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.spotlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
  border: 1px solid transparent;
}

.spotlight-item-active {
  background: linear-gradient(90deg, rgba(124, 108, 240, 0.22), rgba(124, 108, 240, 0.08));
  border-color: rgba(124, 108, 240, 0.35);
  transform: translateX(2px);
}

.spotlight-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 16px;
}

.spotlight-item-active .spotlight-item-icon {
  background: rgba(124, 108, 240, 0.2);
}

.spotlight-item-body {
  flex: 1;
  min-width: 0;
}

.spotlight-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #f0f0ff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spotlight-item-sub {
  font-size: 12px;
  color: var(--text-secondary, #8a8aa0);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'JetBrains Mono', monospace;
}

.spotlight-item-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 5px;
  background: rgba(124, 108, 240, 0.25);
  color: #c5bdff;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.spotlight-empty {
  text-align: center;
  padding: 56px 24px;
  color: var(--text-secondary, #6a6a85);
}

.spotlight-empty-icon {
  font-size: 44px;
  margin-bottom: 14px;
  opacity: 0.5;
}

.spotlight-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #c0c0d0);
  margin-bottom: 6px;
}

.spotlight-empty-desc {
  font-size: 12px;
  opacity: 0.75;
}

.spotlight-hints {
  padding: 14px 16px 18px;
}

.spotlight-hints-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary, #6a6a85);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  padding: 0 4px;
}

.spotlight-hints-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.spotlight-hint-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s;
}

.spotlight-hint-item:hover {
  background: rgba(124, 108, 240, 0.08);
}

.spotlight-hint-key {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(124, 108, 240, 0.18);
  color: #c5bdff;
  font-size: 11px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  height: fit-content;
  white-space: nowrap;
}

.spotlight-hint-desc {
  font-size: 12px;
  color: var(--text-secondary, #a0a0b5);
  line-height: 1.5;
}

.spotlight-hint-example {
  font-size: 11px;
  color: var(--text-secondary, #6a6a85);
  opacity: 0.7;
  font-family: 'JetBrains Mono', monospace;
  margin-top: 1px;
}

.spotlight-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--window-border, rgba(108, 92, 231, 0.2));
  background: rgba(0, 0, 0, 0.2);
  font-size: 11px;
  color: var(--text-secondary, #6a6a85);
}

.spotlight-footer-right {
  display: flex;
  gap: 14px;
}

.spotlight-footer-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.spotlight-footer-hint kbd {
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

:root.light .spotlight-modal {
  background: rgba(252, 252, 255, 0.98);
  box-shadow:
    0 30px 80px rgba(60, 60, 120, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.04) inset,
    0 0 60px rgba(124, 108, 240, 0.1);
}

:root.light .spotlight-overlay {
  background: rgba(240, 240, 250, 0.6);
}

:root.light .spotlight-input-icon,
:root.light .spotlight-item-sub,
:root.light .spotlight-footer,
:root.light .spotlight-empty-desc {
  color: #6a6a85;
}

:root.light .spotlight-item-name,
:root.light .spotlight-empty-title {
  color: #1a1a2e;
}

:root.light .spotlight-item-icon {
  background: rgba(0, 0, 0, 0.04);
}

:root.light .spotlight-hint-item {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.05);
}
`

export default GlobalSearch
