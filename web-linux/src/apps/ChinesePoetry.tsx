import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface Poem {
  title: string
  author: string
  dynasty: string
  content: string
  category?: string
}

interface CategoryOption {
  key: string
  label: string
  keyword: string
}

const CATEGORIES: CategoryOption[] = [
  { key: 'love', label: '爱情', keyword: '爱情' },
  { key: 'homesick', label: '思乡', keyword: '思乡' },
  { key: 'farewell', label: '离别', keyword: '离别' },
  { key: 'inspiration', label: '励志', keyword: '励志' },
  { key: 'frontier', label: '边塞', keyword: '边塞' },
  { key: 'landscape', label: '山水', keyword: '山水' },
]

const FALLBACK_POEMS: Poem[] = [
  {
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。',
    category: '思乡',
  },
  {
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: '白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。',
    category: '励志',
  },
  {
    title: '相思',
    author: '王维',
    dynasty: '唐',
    content: '红豆生南国，\n春来发几枝。\n愿君多采撷，\n此物最相思。',
    category: '爱情',
  },
  {
    title: '送元二使安西',
    author: '王维',
    dynasty: '唐',
    content: '渭城朝雨浥轻尘，\n客舍青青柳色新。\n劝君更尽一杯酒，\n西出阳关无故人。',
    category: '离别',
  },
  {
    title: '出塞',
    author: '王昌龄',
    dynasty: '唐',
    content: '秦时明月汉时关，\n万里长征人未还。\n但使龙城飞将在，\n不教胡马度阴山。',
    category: '边塞',
  },
  {
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    content: '日照香炉生紫烟，\n遥看瀑布挂前川。\n飞流直下三千尺，\n疑是银河落九天。',
    category: '山水',
  },
  {
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: '春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。',
    category: '山水',
  },
  {
    title: '游子吟',
    author: '孟郊',
    dynasty: '唐',
    content: '慈母手中线，\n游子身上衣。\n临行密密缝，\n意恐迟迟归。\n谁言寸草心，\n报得三春晖。',
    category: '思乡',
  },
  {
    title: '将进酒',
    author: '李白',
    dynasty: '唐',
    content: '君不见，黄河之水天上来，\n奔流到海不复回。\n君不见，高堂明镜悲白发，\n朝如青丝暮成雪。\n人生得意须尽欢，\n莫使金樽空对月。\n天生我材必有用，\n千金散尽还复来。',
    category: '励志',
  },
  {
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    content: '千山鸟飞绝，\n万径人踪灭。\n孤舟蓑笠翁，\n独钓寒江雪。',
    category: '山水',
  },
  {
    title: '关雎',
    author: '佚名',
    dynasty: '先秦',
    content: '关关雎鸠，\n在河之洲。\n窈窕淑女，\n君子好逑。',
    category: '爱情',
  },
  {
    title: '九月九日忆山东兄弟',
    author: '王维',
    dynasty: '唐',
    content: '独在异乡为异客，\n每逢佳节倍思亲。\n遥知兄弟登高处，\n遍插茱萸少一人。',
    category: '思乡',
  },
]

const STORAGE_KEY = 'chinese-poetry-favorites'

function loadFavorites(): Poem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveFavorites(list: Poem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function isSamePoem(a: Poem, b: Poem) {
  return a.title === b.title && a.author === b.author
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function fetchRandomPoem(): Promise<Poem> {
  const res = await fetch('https://v1.jinrishici.com/all.json')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const content: string =
    (data.content && String(data.content)) ||
    (data.data?.content && String(data.data.content)) ||
    ''
  const title: string =
    (data.title && String(data.title)) ||
    (data.data?.origin && String(data.data.origin)) ||
    '佚名'
  const author: string =
    (data.author && String(data.author)) ||
    (data.data?.author && String(data.data.author)) ||
    '佚名'
  const dynasty: string = (data.dynasty && String(data.dynasty)) || '未知'
  return {
    title,
    author,
    dynasty,
    content: content.replace(/[，。？！；：、]/g, (ch) => ch + '\n').replace(/\n+/g, '\n'),
    category: undefined,
  }
}

async function fetchByKeyword(keyword: string): Promise<Poem[]> {
  const url = `https://v1.jinrishici.com/shuqing/theme/${encodeURIComponent(keyword)}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const items: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : [data]
  const poems: Poem[] = items
    .map((item) => {
      const it = item as Record<string, unknown>
      const inner = (it.data ?? {}) as Record<string, unknown>
      const content = String(it.content ?? inner.content ?? '').trim()
      const title = String(it.title ?? inner.origin ?? '佚名')
      const author = String(it.author ?? inner.author ?? '佚名')
      const dynasty = String(it.dynasty ?? '未知')
      return {
        title,
        author,
        dynasty,
        content: content || title,
        category: keyword,
      }
    })
    .filter((p) => p.content && p.title)
  if (!poems.length) throw new Error('未找到相关诗词')
  return poems
}

export default function ChinesePoetry() {
  const { theme } = useStore()
  const isDark = theme === 'dark'

  const [poems, setPoems] = useState<Poem[]>([])
  const [active, setActive] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Poem[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const current: Poem | null =
    showFavorites ? favorites[active] ?? null : poems[active] ?? null

  const setRandomPoem = useCallback(async () => {
    setLoading(true)
    setError(null)
    setUsedFallback(false)
    setShowFavorites(false)
    setActiveCategory(null)
    try {
      const poem = await fetchRandomPoem()
      setPoems([poem])
      setActive(0)
    } catch (apiErr) {
      const poem = pickRandom(FALLBACK_POEMS)
      setPoems([poem])
      setActive(0)
      setUsedFallback(true)
      setError(
        `API 调用失败（${apiErr instanceof Error ? apiErr.message : String(apiErr)}），已为你展示本地经典诗词。`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const searchByKeyword = useCallback(async () => {
    const k = keyword.trim()
    if (!k) {
      setError('请先输入关键词。')
      return
    }
    setLoading(true)
    setError(null)
    setUsedFallback(false)
    setShowFavorites(false)
    setActiveCategory(null)
    try {
      const list = await fetchByKeyword(k)
      setPoems(list)
      setActive(0)
    } catch (apiErr) {
      const list = FALLBACK_POEMS.filter((p) =>
        (p.title + p.content + (p.category ?? '')).includes(k)
      )
      const finalList = list.length ? list : FALLBACK_POEMS
      setPoems(finalList)
      setActive(0)
      setUsedFallback(true)
      setError(
        `主题检索 API 调用失败（${apiErr instanceof Error ? apiErr.message : String(apiErr)}），已切换到本地诗词库。`
      )
    } finally {
      setLoading(false)
    }
  }, [keyword])

  const pickCategory = useCallback(async (cat: CategoryOption) => {
    setLoading(true)
    setError(null)
    setUsedFallback(false)
    setShowFavorites(false)
    setActiveCategory(cat.key)
    try {
      const list = await fetchByKeyword(cat.keyword)
      setPoems(list)
      setActive(0)
    } catch (apiErr) {
      const list = FALLBACK_POEMS.filter(
        (p) => (p.category ?? '') === cat.keyword || (p.category ?? '') === cat.label
      )
      const finalList = list.length ? list : FALLBACK_POEMS
      setPoems(finalList)
      setActive(0)
      setUsedFallback(true)
      setError(
        `主题 API 失败（${apiErr instanceof Error ? apiErr.message : String(apiErr)}），已切换到本地诗词库。`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleFavorite = useCallback(
    (poem: Poem) => {
      setFavorites((prev) => {
        const exists = prev.some((p) => isSamePoem(p, poem))
        const next = exists
          ? prev.filter((p) => !isSamePoem(p, poem))
          : [...prev, poem]
        saveFavorites(next)
        return next
      })
    },
    []
  )

  const isFavorite = (poem: Poem) =>
    favorites.some((p) => isSamePoem(p, poem))

  const copyAll = async (poem: Poem) => {
    const text = `${poem.title} · ${poem.dynasty} · ${poem.author}\n\n${poem.content}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const speak = (poem: Poem) => {
    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持语音朗读。')
      return
    }
    try {
      window.speechSynthesis.cancel()
      const text = `${poem.title}，${poem.dynasty}，${poem.author}。${poem.content}`
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'zh-CN'
      utter.rate = 0.9
      utter.pitch = 1
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    } catch (e) {
      setError('朗读启动失败：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const stopSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const bg = isDark ? '#2b1d10' : '#f6ecd6'
  const cardBg = isDark ? '#3a2916' : '#fff8e7'
  const borderColor = isDark ? '#5a3f22' : '#d9c7a0'
  const textColor = isDark ? '#f1e4cc' : '#3a2b1a'
  const mutedColor = isDark ? '#b8a07a' : '#7a5c3a'
  const accent = isDark ? '#d9a441' : '#8b4513'

  const listSource = showFavorites ? favorites : poems

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: bg,
        color: textColor,
        fontFamily:
          '"Songti SC", "SimSun", "STSong", "KaiTi", "STKaiti", "Noto Serif SC", serif',
        padding: 20,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          borderBottom: `1px solid ${borderColor}`,
          paddingBottom: 12,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            letterSpacing: 4,
            color: accent,
            fontFamily: 'inherit',
          }}
        >
          中国古诗词
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={setRandomPoem}
            disabled={loading}
            style={buttonStyle(isDark, accent, loading)}
          >
            {loading ? '加载中…' : '随机推荐'}
          </button>
          <button
            onClick={() => {
              setShowFavorites((s) => !s)
              setActive(0)
            }}
            style={buttonStyle(isDark, accent, false)}
          >
            {showFavorites ? '返回' : `收藏夹 (${favorites.length})`}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') searchByKeyword()
          }}
          placeholder="按主题搜索诗词（如：思乡、明月、春）"
          style={{
            flex: '1 1 280px',
            minWidth: 200,
            padding: '10px 14px',
            fontSize: 15,
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            background: cardBg,
            color: textColor,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button onClick={searchByKeyword} disabled={loading} style={buttonStyle(isDark, accent, loading)}>
          搜索
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => pickCategory(cat)}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: 18,
              border: `1px solid ${activeCategory === cat.key ? accent : borderColor}`,
              background: activeCategory === cat.key ? accent : cardBg,
              color: activeCategory === cat.key ? '#fff8e7' : textColor,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            background: isDark ? '#4a1f1f' : '#fbe3d9',
            color: isDark ? '#f4b8a5' : '#8b2b00',
            fontSize: 14,
            marginBottom: 12,
            border: `1px solid ${borderColor}`,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {!showFavorites && poems.length > 1 && (
          <div
            style={{
              width: 260,
              minWidth: 200,
              borderRight: `1px solid ${borderColor}`,
              overflowY: 'auto',
              paddingRight: 10,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: mutedColor,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              共 {poems.length} 首 {usedFallback ? '（本地库）' : ''}
            </div>
            {poems.map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                onClick={() => setActive(i)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: i === active ? (isDark ? '#4a3520' : '#efe1c3') : 'transparent',
                  borderLeft:
                    i === active ? `3px solid ${accent}` : `3px solid transparent`,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: 15, color: textColor, fontFamily: 'inherit' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                  {p.dynasty} · {p.author}
                </div>
              </div>
            ))}
          </div>
        )}

        {showFavorites && favorites.length > 1 && (
          <div
            style={{
              width: 260,
              minWidth: 200,
              borderRight: `1px solid ${borderColor}`,
              overflowY: 'auto',
              paddingRight: 10,
            }}
          >
            <div style={{ fontSize: 13, color: mutedColor, marginBottom: 8, paddingLeft: 4 }}>
              我的收藏 · {favorites.length} 首
            </div>
            {favorites.map((p, i) => (
              <div
                key={`fav-${p.title}-${i}`}
                onClick={() => setActive(i)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: i === active ? (isDark ? '#4a3520' : '#efe1c3') : 'transparent',
                  borderLeft: i === active ? `3px solid ${accent}` : `3px solid transparent`,
                }}
              >
                <div style={{ fontSize: 15, color: textColor, fontFamily: 'inherit' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                  {p.dynasty} · {p.author}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowY: 'auto',
            padding: '24px 28px',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            position: 'relative',
            boxShadow: isDark
              ? 'inset 0 0 60px rgba(0,0,0,0.35)'
              : 'inset 0 0 60px rgba(180,140,80,0.15)',
          }}
        >
          {!current && !loading && (
            <div style={{ textAlign: 'center', color: mutedColor, padding: '60px 20px' }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>暂无诗词</div>
              <div style={{ fontSize: 14 }}>
                点击右上角「随机推荐」，或按主题浏览，开始你的诗词之旅。
              </div>
              {favorites.length > 0 && (
                <button
                  onClick={() => {
                    setShowFavorites(true)
                    setActive(0)
                  }}
                  style={{ ...buttonStyle(isDark, accent, false), marginTop: 16 }}
                >
                  查看收藏夹
                </button>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', color: mutedColor, padding: '60px 20px' }}>
              正在为你寻诗…
            </div>
          )}

          {current && !loading && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 30, color: accent, fontFamily: 'inherit', letterSpacing: 4 }}>
                  {current.title}
                </h2>
                <div style={{ color: mutedColor, fontSize: 14 }}>
                  【{current.dynasty}】{current.author}
                </div>
              </div>

              {current.category && (
                <div style={{ marginBottom: 20 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 12,
                      padding: '2px 10px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 10,
                      color: mutedColor,
                    }}
                  >
                    {current.category}
                  </span>
                </div>
              )}

              <div
                style={{
                  fontSize: 22,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  color: textColor,
                  fontFamily: 'inherit',
                  letterSpacing: 2,
                  padding: '20px 0',
                  borderTop: `1px dashed ${borderColor}`,
                  borderBottom: `1px dashed ${borderColor}`,
                  marginBottom: 20,
                }}
              >
                {current.content}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => toggleFavorite(current)}
                  style={buttonStyle(isDark, accent, false)}
                >
                  {isFavorite(current) ? '★ 取消收藏' : '☆ 加入收藏'}
                </button>
                <button onClick={() => copyAll(current)} style={buttonStyle(isDark, accent, false)}>
                  {copied ? '✓ 已复制' : '复制全文'}
                </button>
                {speaking ? (
                  <button onClick={stopSpeak} style={buttonStyle(isDark, accent, false)}>
                    停止朗读
                  </button>
                ) : (
                  <button onClick={() => speak(current)} style={buttonStyle(isDark, accent, false)}>
                    朗读
                  </button>
                )}
                {listSource.length > 1 && (
                  <>
                    <button
                      onClick={() => setActive((a) => (a - 1 + listSource.length) % listSource.length)}
                      style={buttonStyle(isDark, accent, false)}
                    >
                      上一首
                    </button>
                    <button
                      onClick={() => setActive((a) => (a + 1) % listSource.length)}
                      style={buttonStyle(isDark, accent, false)}
                    >
                      下一首
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function buttonStyle(isDark: boolean, accent: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 6,
    border: `1px solid ${accent}`,
    background: isDark ? '#3a2916' : '#fff8e7',
    color: accent,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontFamily:
      '"Songti SC", "SimSun", "STSong", "KaiTi", "STKaiti", "Noto Serif SC", serif',
    opacity: disabled ? 0.6 : 1,
    transition: 'background 0.15s, color 0.15s',
  }
}
