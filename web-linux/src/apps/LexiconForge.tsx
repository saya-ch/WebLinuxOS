import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface DatamuseWord {
  word: string
  score?: number
  numSyllables?: number
  defs?: string[]
  tags?: string[]
}

type TabKey = 'rhymes' | 'nearrhymes' | 'synonyms' | 'antonyms' | 'triggers' | 'homophones' | 'spelling'

interface TabConfig {
  key: TabKey
  label: string
  zh: string
  hint: string
  /** 拼装 Datamuse 查询参数 */
  buildQuery: (input: string) => string
  /** 是否需要严格输入（spelling/spelled-like 支持 * 和 ?） */
  allowsPattern?: boolean
}

interface HistoryItem {
  term: string
  tab: TabKey
  ts: number
}

// ==================== 常量 ====================
const DATAMUSE_BASE = 'https://api.datamuse.com/words'
const PROXY_FALLBACK = 'https://corsproxy.io/?url='
const STORAGE_KEY_HISTORY = 'weblinux-lexicon-history'
const STORAGE_KEY_FAV = 'weblinux-lexicon-favorites'
const STORAGE_CACHE = 'weblinux-lexicon-cache'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h
const MAX_RESULTS = 80

const TABS: TabConfig[] = [
  {
    key: 'rhymes',
    label: 'Perfect Rhymes',
    zh: '完全押韵',
    hint: '末尾音节完全相同的词（写诗、作词必备）',
    buildQuery: (w) => `rel_rhy=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'nearrhymes',
    label: 'Near Rhymes',
    zh: '近似押韵',
    hint: '末尾音节相近但不完全相同的词（slant rhyme）',
    buildQuery: (w) => `rel_nry=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'synonyms',
    label: 'Synonyms',
    zh: '同义词',
    hint: '意思相近的词（避免用词重复、丰富表达）',
    buildQuery: (w) => `rel_syn=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'antonyms',
    label: 'Antonyms',
    zh: '反义词',
    hint: '意思相反的词',
    buildQuery: (w) => `rel_ant=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'triggers',
    label: 'Associations',
    zh: '联想词',
    hint: '在语料中经常与该词一起出现的词（写作灵感、头脑风暴）',
    buildQuery: (w) => `rel_trg=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'homophones',
    label: 'Homophones',
    zh: '同音词',
    hint: '发音相同但拼写和意思不同的词（homophones）',
    buildQuery: (w) => `rel_hmg=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
  },
  {
    key: 'spelling',
    label: 'Spelled Like',
    zh: '拼写匹配',
    hint: '按拼写模式查找（* 匹配任意字符、? 匹配单个字符，填字游戏/Scrabble利器）',
    buildQuery: (w) => `sp=${encodeURIComponent(w)}&md=fdp&max=${MAX_RESULTS}`,
    allowsPattern: true,
  },
]

const TAB_MAP: Record<TabKey, TabConfig> = TABS.reduce((acc, t) => {
  acc[t.key] = t
  return acc
}, {} as Record<TabKey, TabConfig>)

// ==================== 工具函数 ====================
function safeGet<T>(parse: () => T, fallback: T): T {
  try {
    const v = parse()
    return v === null || v === undefined ? fallback : v
  } catch {
    return fallback
  }
}

async function fetchDatamuse(query: string): Promise<DatamuseWord[]> {
  const url = `${DATAMUSE_BASE}?${query}`
  // 先直连（Datamuse 支持 CORS）
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (res.ok) return (await res.json()) as DatamuseWord[]
  } catch {
    // 落入代理回退
  }
  // CORS 代理回退（受限网络环境兜底）
  const proxied = `${PROXY_FALLBACK}${encodeURIComponent(url)}`
  const res = await fetch(proxied, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`请求失败 (HTTP ${res.status})`)
  return (await res.json()) as DatamuseWord[]
}

function decodeDef(def: string): { pos: string; text: string } {
  // Datamuse defs 格式："n\ta unit of language..." -> pos=n, text=...
  const [rawPos, ...rest] = def.split('\t')
  const text = rest.join(' ').trim()
  const posMap: Record<string, string> = {
    n: 'noun 名词',
    v: 'verb 动词',
    a: 'adj 形容词',
    r: 'adv 副词',
    s: 'adj 形容词',
    u: 'unknown 未知',
  }
  return { pos: posMap[rawPos] || rawPos, text: text || def }
}

function formatTs(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ==================== 主组件 ====================
export default function LexiconForge() {
  // 使用 resolvedTheme 以正确处理 'auto' 主题（'auto' 会解析为 dark/light）
  const resolvedTheme = useStore((s) => s.resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  const [activeTab, setActiveTab] = useState<TabKey>('rhymes')
  const [input, setInput] = useState('')
  const [results, setResults] = useState<DatamuseWord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedTerm, setSearchedTerm] = useState('')

  const [history, setHistory] = useState<HistoryItem[]>(() =>
    safeGet(() => JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]'), [])
  )
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeGet(() => JSON.parse(localStorage.getItem(STORAGE_KEY_FAV) || '[]'), [])
  )
  const [showHistory, setShowHistory] = useState(false)
  const [showFavs, setShowFavs] = useState(false)
  const [copiedWord, setCopiedWord] = useState<string | null>(null)
  const [expandedWord, setExpandedWord] = useState<string | null>(null)
  const [syllableFilter, setSyllableFilter] = useState<number | 'all'>('all')

  const cacheRef = useRef<Map<string, { ts: number; data: DatamuseWord[] }>>(
    new Map(
      safeGet(() => {
        const raw = localStorage.getItem(STORAGE_CACHE)
        return raw ? JSON.parse(raw) : []
      }, [] as Array<[string, { ts: number; data: DatamuseWord[] }]>)
    )
  )
  const inputRef = useRef<HTMLInputElement>(null)

  // ============ 主题色：编辑式墨水与羊皮纸风格 ============
  const palette = useMemo(() => {
    if (isDark) {
      return {
        bg: '#14111d',
        bgGrad: 'radial-gradient(circle at 20% 0%, #1f1a2e 0%, #14111d 55%, #0d0a14 100%)',
        panel: '#1c1729',
        panelAlt: '#221c33',
        border: '#342a4a',
        text: '#ece6f5',
        textDim: '#9a8fb5',
        accent: '#e8b86d', // 暖琥珀色高亮
        accentSoft: 'rgba(232,184,109,0.16)',
        chip: '#241c36',
        chipBorder: '#3a2f55',
        fav: '#f0a070',
        hover: '#2a2240',
        ink: '#d8c9a8',
      }
    }
    return {
      bg: '#f6efe0',
      bgGrad: 'radial-gradient(circle at 20% 0%, #fbf5e7 0%, #f6efe0 55%, #efe5d0 100%)',
      panel: '#fffdf7',
      panelAlt: '#faf4e6',
      border: '#d9cdb2',
      text: '#2a2418',
      textDim: '#7a6f5a',
      accent: '#8a5a2b', // 墨水棕
      accentSoft: 'rgba(138,90,43,0.12)',
      chip: '#f3ead4',
      chipBorder: '#d9cdb2',
      fav: '#b8651f',
      hover: '#efe5d0',
      ink: '#3a2f1c',
    }
  }, [isDark])

  // ============ 持久化 ============
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 50)))
  }, [history])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(favorites.slice(0, 200)))
  }, [favorites])

  useEffect(() => {
    const arr = Array.from(cacheRef.current.entries()).slice(0, 100)
    localStorage.setItem(STORAGE_CACHE, JSON.stringify(arr))
  }, [results, searchedTerm, activeTab])

  // ============ 搜索逻辑 ============
  const doSearch = useCallback(
    async (rawTerm: string, tab: TabKey) => {
      const term = rawTerm.trim()
      const cfg = TAB_MAP[tab]
      // spelling 允许 * ? 占位符，其它 tab 至少需要一个字母
      const minLen = cfg.allowsPattern ? 1 : 2
      if (term.length < minLen) {
        setError(cfg.allowsPattern ? '请输入至少 1 个字符（支持 * 和 ?）' : '请输入至少 2 个字符')
        setResults([])
        return
      }
      // spelling 如果全是通配符，也提示
      if (cfg.allowsPattern && /^[*?]+$/.test(term)) {
        setError('拼写模式里至少要有一个字母')
        setResults([])
        return
      }

      const query = cfg.buildQuery(term)
      const cacheKey = query
      const cached = cacheRef.current.get(cacheKey)
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setResults(cached.data)
        setSearchedTerm(term)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await fetchDatamuse(query)
        cacheRef.current.set(cacheKey, { ts: Date.now(), data })
        setResults(data)
        setSearchedTerm(term)
        setHistory((prev) => {
          const without = prev.filter((h) => !(h.term === term && h.tab === tab))
          return [{ term, tab, ts: Date.now() }, ...without].slice(0, 50)
        })
        if (data.length === 0) {
          setError('没有找到匹配的词，试试换个写法或切换其它词表')
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误'
        setError(`查询失败：${msg}（Datamuse API 可能暂时不可用）`)
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      doSearch(input, activeTab)
    },
    [input, activeTab, doSearch]
  )

  const switchTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab)
      setExpandedWord(null)
      setSyllableFilter('all')
      if (input.trim().length >= (TAB_MAP[tab].allowsPattern ? 1 : 2)) {
        doSearch(input, tab)
      } else {
        setResults([])
        setError(null)
      }
    },
    [input, doSearch]
  )

  // ============ 收藏 / 复制 ============
  const toggleFav = useCallback((word: string) => {
    setFavorites((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [word, ...prev].slice(0, 200)
    )
  }, [])

  const copyWord = useCallback(async (word: string) => {
    try {
      await navigator.clipboard.writeText(word)
      setCopiedWord(word)
      setTimeout(() => setCopiedWord((c) => (c === word ? null : c)), 1400)
    } catch {
      // 降级：选中文本
      const ta = document.createElement('textarea')
      ta.value = word
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopiedWord(word)
        setTimeout(() => setCopiedWord((c) => (c === word ? null : c)), 1400)
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
    }
  }, [])

  // ============ 过滤后的结果 ============
  const filteredResults = useMemo(() => {
    if (syllableFilter === 'all') return results
    return results.filter((w) => (w.numSyllables ?? 0) === syllableFilter)
  }, [results, syllableFilter])

  const syllableOptions = useMemo(() => {
    const set = new Set<number>()
    results.forEach((w) => {
      if (typeof w.numSyllables === 'number') set.add(w.numSyllables)
    })
    return Array.from(set).sort((a, b) => a - b)
  }, [results])

  const currentTabCfg = TAB_MAP[activeTab]

  // ============ 样式工厂 ============
  const S = useMemo(
    () => ({
      root: {
        width: '100%',
        height: '100%',
        background: palette.bgGrad,
        color: palette.text,
        display: 'flex',
        flexDirection: 'column' as const,
        fontFamily: '"PingFang SC", "Noto Sans CJK SC", "Segoe UI", system-ui, sans-serif',
        overflow: 'hidden',
      },
      header: {
        padding: '18px 24px 12px',
        borderBottom: `1px solid ${palette.border}`,
        background: isDark ? 'rgba(28,23,41,0.6)' : 'rgba(255,253,247,0.7)',
        backdropFilter: 'blur(6px)',
      },
      title: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: palette.ink,
        fontFamily: 'Georgia, "Times New Roman", "Noto Serif CJK SC", serif',
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
      },
      subtitle: {
        fontSize: 12,
        color: palette.textDim,
        marginTop: 4,
      },
      tabbar: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: 4,
        marginTop: 12,
      },
      tab: (active: boolean): React.CSSProperties => ({
        padding: '6px 12px',
        fontSize: 12.5,
        borderRadius: 6,
        border: `1px solid ${active ? palette.accent : palette.border}`,
        background: active ? palette.accentSoft : 'transparent',
        color: active ? palette.accent : palette.textDim,
        cursor: 'pointer',
        transition: 'all .15s ease',
        fontWeight: active ? 600 : 400,
      }),
      body: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '16px 24px 24px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
      },
      searchRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap' as const,
      },
      input: {
        flex: 1,
        minWidth: 220,
        padding: '10px 14px',
        fontSize: 15,
        fontFamily: 'Georgia, "Times New Roman", serif',
        background: palette.panel,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        outline: 'none',
      } as React.CSSProperties,
      btn: {
        padding: '10px 18px',
        fontSize: 14,
        fontWeight: 600,
        background: palette.accent,
        color: isDark ? '#14111d' : '#fffdf7',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
      } as React.CSSProperties,
      btnGhost: {
        padding: '8px 12px',
        fontSize: 12,
        background: 'transparent',
        color: palette.textDim,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        cursor: 'pointer',
      } as React.CSSProperties,
      hint: {
        fontSize: 12.5,
        color: palette.textDim,
        fontStyle: 'italic',
        fontFamily: 'Georgia, serif',
      },
      filterRow: {
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        fontSize: 12,
        color: palette.textDim,
      },
      chip: (active: boolean): React.CSSProperties => ({
        padding: '2px 8px',
        borderRadius: 10,
        border: `1px solid ${active ? palette.accent : palette.chipBorder}`,
        background: active ? palette.accentSoft : palette.chip,
        color: active ? palette.accent : palette.textDim,
        cursor: 'pointer',
        fontSize: 11.5,
      }),
      metaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: palette.textDim,
      },
      wordCard: {
        background: palette.panel,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 6,
        transition: 'border-color .15s, background .15s',
      } as React.CSSProperties,
      wordHead: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap' as const,
      },
      word: {
        fontFamily: 'Georgia, "Times New Roman", "Noto Serif CJK SC", serif',
        fontSize: 18,
        fontWeight: 600,
        color: palette.ink,
      } as React.CSSProperties,
      sylBadge: {
        fontSize: 10.5,
        padding: '1px 6px',
        borderRadius: 8,
        background: palette.chip,
        border: `1px solid ${palette.chipBorder}`,
        color: palette.textDim,
      } as React.CSSProperties,
      iconBtn: {
        background: 'transparent',
        border: 'none',
        color: palette.textDim,
        cursor: 'pointer',
        fontSize: 14,
        padding: '2px 4px',
        lineHeight: 1,
      } as React.CSSProperties,
      defs: {
        fontSize: 13,
        color: palette.textDim,
        lineHeight: 1.55,
        borderTop: `1px dashed ${palette.border}`,
        paddingTop: 6,
      } as React.CSSProperties,
      empty: {
        textAlign: 'center' as const,
        padding: '40px 20px',
        color: palette.textDim,
        fontSize: 14,
      },
      historyItem: {
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${palette.border}`,
        background: palette.panelAlt,
        cursor: 'pointer',
        fontSize: 13,
        color: palette.text,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      } as React.CSSProperties,
      spinner: {
        width: 22,
        height: 22,
        border: `2.5px solid ${palette.border}`,
        borderTopColor: palette.accent,
        borderRadius: '50%',
        animation: 'lf-spin .8s linear infinite',
      } as React.CSSProperties,
      errBox: {
        padding: '10px 14px',
        borderRadius: 8,
        background: isDark ? 'rgba(220,90,80,0.12)' : 'rgba(180,60,50,0.08)',
        border: `1px solid ${isDark ? '#5a2a2a' : '#e6c0b8'}`,
        color: isDark ? '#ffb4a8' : '#a04030',
        fontSize: 13,
      } as React.CSSProperties,
    }),
    [palette, isDark]
  )

  // ============ 渲染 ============
  return (
    <div style={S.root}>
      <style>{`@keyframes lf-spin { to { transform: rotate(360deg) } }
        .lf-word-card:hover { border-color: ${palette.accent} !important; background: ${palette.hover} !important; }
        .lf-tab:hover { border-color: ${palette.accent} !important; color: ${palette.accent} !important; }
        .lf-hist:hover { background: ${palette.hover} !important; border-color: ${palette.accent} !important; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <h2 style={S.title}>
          LexiconForge
          <span style={{ fontSize: 13, fontWeight: 400, color: palette.textDim, fontFamily: 'inherit' }}>
            词语锻造坊
          </span>
        </h2>
        <div style={S.subtitle}>
          基于 Datamuse 语料库 API 的多语种写作辅助 · 押韵 / 同反义 / 联想 / 同音 / 拼写匹配 · 数据本地缓存
        </div>

        {/* Tab Bar */}
        <div style={S.tabbar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className="lf-tab"
              style={S.tab(activeTab === t.key)}
              onClick={() => switchTab(t.key)}
              title={t.hint}
            >
              {t.label} · {t.zh}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {/* Search row */}
        <form style={S.searchRow} onSubmit={handleSearch}>
          <input
            ref={inputRef}
            style={S.input}
            placeholder={
              currentTabCfg.allowsPattern
                ? '拼写模式：如 c*at、?oat、*ing'
                : `输入一个词，例如 ${activeTab === 'rhymes' ? '"orange"' : '"happy"'}`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? '查询中…' : '查找'}
          </button>
          <button type="button" style={S.btnGhost} onClick={() => setShowHistory((v) => !v)}>
            历史 ({history.length})
          </button>
          <button type="button" style={S.btnGhost} onClick={() => setShowFavs((v) => !v)}>
            收藏 ({favorites.length})
          </button>
        </form>

        <div style={S.hint}>{currentTabCfg.hint}</div>

        {/* Syllable filter */}
        {syllableOptions.length > 1 && (
          <div style={S.filterRow}>
            <span>按音节过滤：</span>
            <span
              style={S.chip(syllableFilter === 'all')}
              onClick={() => setSyllableFilter('all')}
            >
              全部
            </span>
            {syllableOptions.map((n) => (
              <span
                key={n}
                style={S.chip(syllableFilter === n)}
                onClick={() => setSyllableFilter(n)}
              >
                {n} 音节
              </span>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <div style={S.errBox}>{error}</div>}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
            <div style={S.spinner} />
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div>
            <div style={{ ...S.metaRow, marginBottom: 8 }}>
              <span>搜索历史（最近 50 条）</span>
              <button
                style={S.btnGhost}
                onClick={() => {
                  setHistory([])
                  localStorage.removeItem(STORAGE_KEY_HISTORY)
                }}
              >
                清空
              </button>
            </div>
            {history.length === 0 ? (
              <div style={S.empty}>还没有历史记录</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                {history.map((h, i) => (
                  <div
                    key={`${h.term}-${h.ts}-${i}`}
                    className="lf-hist"
                    style={S.historyItem}
                    onClick={() => {
                      setInput(h.term)
                      setActiveTab(h.tab)
                      setShowHistory(false)
                      doSearch(h.term, h.tab)
                    }}
                  >
                    <span style={{ fontWeight: 600, color: palette.accent }}>{h.term}</span>
                    <span style={{ fontSize: 11, color: palette.textDim }}>
                      {TAB_MAP[h.tab].zh} · {formatTs(h.ts).slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites panel */}
        {showFavs && (
          <div>
            <div style={{ ...S.metaRow, marginBottom: 8 }}>
              <span>收藏词库</span>
              <button
                style={S.btnGhost}
                onClick={() => {
                  setFavorites([])
                  localStorage.removeItem(STORAGE_KEY_FAV)
                }}
              >
                清空
              </button>
            </div>
            {favorites.length === 0 ? (
              <div style={S.empty}>还没有收藏的词，点击词卡右侧星标添加</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {favorites.map((w) => (
                  <span
                    key={w}
                    style={{
                      ...S.chip(false),
                      padding: '4px 10px',
                      fontSize: 13,
                      fontFamily: 'Georgia, serif',
                      color: palette.fav,
                    }}
                    onClick={() => copyWord(w)}
                    title="点击复制"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!loading && !showHistory && !showFavs && (
          <>
            {searchedTerm && results.length > 0 && (
              <div style={S.metaRow}>
                <span>
                  关于「<b style={{ color: palette.accent }}>{searchedTerm}</b>」的{currentTabCfg.zh}：
                  共 {results.length} 个
                  {syllableFilter !== 'all' && filteredResults.length !== results.length
                    ? `（过滤后 ${filteredResults.length} 个）`
                    : ''}
                </span>
                <span style={{ fontSize: 11 }}>来源：Datamuse · 词频 score 越高越常用</span>
              </div>
            )}

            {filteredResults.length === 0 && !error && searchedTerm && (
              <div style={S.empty}>该筛选条件下没有结果</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredResults.map((w, idx) => {
                const isFav = favorites.includes(w.word)
                const isExpanded = expandedWord === `${w.word}-${idx}`
                const hasDefs = w.defs && w.defs.length > 0
                return (
                  <div key={`${w.word}-${idx}`} className="lf-word-card" style={S.wordCard}>
                    <div style={S.wordHead}>
                      <span style={S.word}>{w.word}</span>
                      {typeof w.numSyllables === 'number' && (
                        <span style={S.sylBadge}>{w.numSyllables} 音节</span>
                      )}
                      {typeof w.score === 'number' && (
                        <span style={{ fontSize: 11, color: palette.textDim }}>
                          频率 {w.score}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                        <button
                          style={{ ...S.iconBtn, color: isFav ? palette.fav : palette.textDim }}
                          onClick={() => toggleFav(w.word)}
                          title={isFav ? '取消收藏' : '收藏'}
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                        <button
                          style={S.iconBtn}
                          onClick={() => copyWord(w.word)}
                          title="复制到剪贴板"
                        >
                          {copiedWord === w.word ? '✓ 已复制' : '⧉'}
                        </button>
                        {hasDefs && (
                          <button
                            style={S.iconBtn}
                            onClick={() => setExpandedWord(isExpanded ? null : `${w.word}-${idx}`)}
                            title={isExpanded ? '收起定义' : '展开定义'}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        )}
                      </span>
                    </div>
                    {isExpanded && hasDefs && (
                      <div style={S.defs}>
                        {w.defs!.slice(0, 4).map((d, di) => {
                          const { pos, text } = decodeDef(d)
                          return (
                            <div key={di} style={{ marginBottom: 4 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  minWidth: 70,
                                  color: palette.accent,
                                  fontSize: 11.5,
                                }}
                              >
                                [{pos}]
                              </span>
                              {text}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {!isExpanded && hasDefs && w.defs && (
                      <div style={{ fontSize: 12.5, color: palette.textDim }}>
                        {decodeDef(w.defs[0]).text.slice(0, 70)}
                        {decodeDef(w.defs[0]).text.length > 70 ? '…' : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!searchedTerm && !error && (
              <div style={S.empty}>
                <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>✦</div>
                在上方输入一个词开始探索语言的可能性。
                <br />
                押韵写诗、同义换言、联想拓展、拼字解谜——一个工具，多种可能。
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
