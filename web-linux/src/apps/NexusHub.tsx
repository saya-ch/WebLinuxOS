import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Sparkles, RefreshCw, Heart, Copy, Image, BookOpen, Coffee,
  Dog, Cat, Palette, Music, Film, Users, Globe, Search, ChevronRight,
  Star, Bookmark, Clock, TrendingUp, Zap, Shuffle, AlertCircle, CheckCircle2
} from 'lucide-react'

type CategoryKey = 'quotes' | 'jokes' | 'dogs' | 'cats' | 'users' | 'art' | 'meals' | 'apis'

interface CategoryItem {
  key: CategoryKey
  name: string
  icon: React.ReactNode
  desc: string
  accent: string
}

const CATEGORIES: CategoryItem[] = [
  { key: 'quotes', name: '每日箴言', icon: <BookOpen size={20} />, desc: '激发灵感的名言金句', accent: 'from-amber-400 to-orange-500' },
  { key: 'jokes', name: '趣闻笑话', icon: <Coffee size={20} />, desc: '轻松一刻，开心一笑', accent: 'from-pink-400 to-rose-500' },
  { key: 'dogs', name: '萌宠狗狗', icon: <Dog size={20} />, desc: '随机治愈系狗狗图片', accent: 'from-amber-500 to-yellow-600' },
  { key: 'cats', name: '猫咪日记', icon: <Cat size={20} />, desc: '高冷猫咪随机展示', accent: 'from-violet-400 to-purple-600' },
  { key: 'users', name: '虚拟人物', icon: <Users size={20} />, desc: '生成随机用户档案', accent: 'from-cyan-400 to-sky-600' },
  { key: 'art', name: '艺术画廊', icon: <Palette size={20} />, desc: '芝加哥艺术博物馆藏品', accent: 'from-emerald-400 to-teal-600' },
  { key: 'meals', name: '美食食谱', icon: <ChefIcon size={20} />, desc: '随机菜谱灵感推荐', accent: 'from-red-400 to-orange-600' },
  { key: 'apis', name: 'API探索', icon: <Globe size={20} />, desc: '发现有趣的公开API', accent: 'from-indigo-400 to-blue-600' },
]

function ChefIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
      <line x1="6" y1="17" x2="18" y2="17"/>
    </svg>
  )
}

interface QuoteData { q: string; a: string; h?: string }
interface JokeData { setup: string; punchline: string; type: string }
interface DogData { message: string; status: string }
interface CatData { url: string; id?: string; width?: number; height?: number }
interface UserData {
  results: Array<{
    name: { title: string; first: string; last: string }
    email: string
    phone: string
    dob: { date: string; age: number }
    location: { city: string; country: string; state: string }
    picture: { large: string; medium: string; thumbnail: string }
    login: { username: string; uuid: string; password: string }
  }>
}
interface ArtData {
  data: Array<{
    id: number
    title: string
    artist_title: string
    date_display: string
    image_id?: string
    dimensions?: string
    medium_display?: string
  }>
}
interface MealData {
  meals: Array<{
    idMeal: string
    strMeal: string
    strMealThumb: string
    strCategory: string
    strArea: string
    strInstructions: string
    strYoutube?: string
  }> | null
}
type MealItem = NonNullable<MealData['meals']>[number]
interface ApiData {
  entries: Array<{
    API: string
    Description: string
    Category: string
    Link: string
    HTTPS: boolean
    Auth: string
    Cors: string
  }>
}

type ContentData = QuoteData | JokeData | DogData | CatData | UserData | ArtData | MealData | ApiData | null

interface SavedItem {
  id: string
  category: CategoryKey
  timestamp: number
  preview: string
  data: ContentData
}

function copyToClipboard(text: string, onDone?: () => void) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => onDone?.()).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); onDone?.() } catch { /* noop */ }
      document.body.removeChild(ta)
    })
  }
}

const STORAGE_KEY = 'weblinux-nexushub-saved-v1'

function loadSaved(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as SavedItem[] : []
  } catch {
    return []
  }
}

function saveSaved(list: SavedItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 60))) } catch { /* noop */ }
}

const API_FETCHERS: Record<CategoryKey, () => Promise<ContentData>> = {
  quotes: async () => {
    const res = await fetch('https://zenquotes.io/api/random')
    if (!res.ok) throw new Error('网络请求失败')
    const data = await res.json()
    return (data && data[0]) as QuoteData
  },
  jokes: async () => {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke')
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as JokeData
  },
  dogs: async () => {
    const res = await fetch('https://dog.ceo/api/breeds/image/random')
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as DogData
  },
  cats: async () => {
    const res = await fetch('https://api.thecatapi.com/v1/images/search')
    if (!res.ok) throw new Error('网络请求失败')
    const arr = await res.json() as CatData[]
    return arr?.[0] ?? null
  },
  users: async () => {
    const res = await fetch('https://randomuser.me/api?nat=us,gb,fr,de,jp,cn,au,ca')
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as UserData
  },
  art: async () => {
    const page = Math.floor(Math.random() * 80) + 1
    const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=8&fields=id,title,artist_title,date_display,image_id,dimensions,medium_display`)
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as ArtData
  },
  meals: async () => {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as MealData
  },
  apis: async () => {
    const res = await fetch('https://api.publicapis.org/random?count=10')
    if (!res.ok) throw new Error('网络请求失败')
    return await res.json() as ApiData
  },
}

export default function NexusHub() {
  const [activeCat, setActiveCat] = useState<CategoryKey>('quotes')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<ContentData>(null)
  const [saved, setSaved] = useState<SavedItem[]>(() => loadSaved())
  const [showSaved, setShowSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedFlash, setSavedFlash] = useState<string | null>(null)
  const [jokeRevealed, setJokeRevealed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const cat = CATEGORIES.find(c => c.key === activeCat) ?? CATEGORIES[0]

  const fetchContent = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    setJokeRevealed(false)
    try {
      const data = await Promise.race([
        API_FETCHERS[activeCat](),
        new Promise<ContentData>((_, rej) => setTimeout(() => rej(new Error('请求超时')), 15000))
      ])
      setContent(data)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || '加载失败，请稍后重试')
        setContent(null)
      }
    } finally {
      setLoading(false)
    }
  }, [activeCat])

  useEffect(() => {
    fetchContent()
    return () => abortRef.current?.abort()
  }, [fetchContent])

  useEffect(() => { saveSaved(saved) }, [saved])

  const getPreview = (c: CategoryKey, d: ContentData): string => {
    switch (c) {
      case 'quotes': return `"${(d as QuoteData)?.q ?? ''}" — ${(d as QuoteData)?.a ?? ''}`.slice(0, 120)
      case 'jokes': return `${(d as JokeData)?.setup ?? ''}`.slice(0, 120)
      case 'dogs': return `🐕 ${(d as DogData)?.message ?? ''}`.slice(0, 100)
      case 'cats': return `🐈 ${(d as CatData)?.url ?? ''}`.slice(0, 100)
      case 'users': {
        const u = (d as UserData)?.results?.[0]
        return u ? `👤 ${u.name.first} ${u.name.last}, ${u.location.city}, ${u.location.country}` : ''
      }
      case 'art': {
        const a = (d as ArtData)?.data?.[0]
        return a ? `🎨 ${a.title} — ${a.artist_title || '未知'}` : ''
      }
      case 'meals': {
        const m = (d as MealData)?.meals?.[0]
        return m ? `🍽️ ${m.strMeal} (${m.strArea || ''} · ${m.strCategory || ''})` : ''
      }
      case 'apis': {
        const e = (d as ApiData)?.entries?.[0]
        return e ? `🔗 ${e.API}: ${e.Description}`.slice(0, 120) : ''
      }
      default: return ''
    }
  }

  const handleSave = () => {
    if (!content) return
    const item: SavedItem = {
      id: `${activeCat}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: activeCat,
      timestamp: Date.now(),
      preview: getPreview(activeCat, content),
      data: content,
    }
    setSaved(prev => [item, ...prev])
    setSavedFlash(item.id)
    setTimeout(() => setSavedFlash(null), 1500)
  }

  const handleDeleteSaved = (id: string) => {
    setSaved(prev => prev.filter(it => it.id !== id))
  }

  const handleCopy = () => {
    const text = getPreview(activeCat, content)
    copyToClipboard(text, () => { setCopied(true); setTimeout(() => setCopied(false), 1200) })
  }

  const filteredSaved = saved.filter(s =>
    !searchTerm ||
    s.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    CATEGORIES.find(c => c.key === s.category)?.name.includes(searchTerm)
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a15 100%)', color: '#e8e8ff', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(155, 138, 240, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'linear-gradient(90deg, rgba(124,108,240,0.08) 0%, rgba(0,214,193,0.06) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(124,108,240,0.4)'
          }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.02 }}>NexusHub 互联枢纽</div>
            <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>发现 · 探索 · 收藏 — 连接全球公开 API</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowSaved(s => !s)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid',
              borderColor: showSaved ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)',
              background: showSaved ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
              color: showSaved ? '#fbbf24' : '#c0c0e0',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <Bookmark size={15} />
            收藏夹 {saved.length > 0 && <span style={{ fontSize: 11, opacity: 0.8 }}>({saved.length})</span>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar categories */}
        <div style={{
          width: 200,
          borderRight: '1px solid rgba(155, 138, 240, 0.1)',
          padding: '16px 10px',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, color: '#777799', padding: '0 10px 8px', letterSpacing: 0.06, textTransform: 'uppercase' }}>探索分类</div>
          {CATEGORIES.map(c => {
            const isActive = c.key === activeCat && !showSaved
            return (
              <button
                key={c.key}
                onClick={() => { setActiveCat(c.key); setShowSaved(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', marginBottom: 4,
                  borderRadius: 10, cursor: 'pointer',
                  border: 'none',
                  background: isActive ? `linear-gradient(90deg, ${c.accent}, transparent)` : 'transparent',
                  color: isActive ? '#fff' : '#b0b0d0',
                  textAlign: 'left',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.18s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {c.icon}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, lineHeight: 1.2 }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: isActive ? 'rgba(255,255,255,0.75)' : '#777799', marginTop: 2, lineHeight: 1.3 }}>{c.desc}</div>
                </div>
                {isActive && <ChevronRight size={14} />}
              </button>
            )
          })}
          <div style={{ marginTop: 18, padding: 12, borderRadius: 12, background: 'rgba(124,108,240,0.06)', border: '1px solid rgba(124,108,240,0.12)' }}>
            <div style={{ fontSize: 11, color: '#9b8af0', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={13} /> 数据来源
            </div>
            <div style={{ fontSize: 11, color: '#8888aa', lineHeight: 1.6 }}>
              所有内容来自合规公开 API，无需密钥。每次刷新获取全新数据。
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {showSaved ? (
            <SavedView
              items={filteredSaved}
              search={searchTerm}
              onSearchChange={setSearchTerm}
              onDelete={handleDeleteSaved}
              onRecover={(item) => { setActiveCat(item.category); setContent(item.data); setShowSaved(false); setJokeRevealed(true) }}
            />
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(155, 138, 240, 0.08)',
                background: 'rgba(255,255,255,0.015)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    padding: '5px 12px', borderRadius: 8,
                    background: `linear-gradient(135deg, ${cat.accent})`,
                    color: '#fff', fontSize: 12, fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                  }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#8888aa' }}>{cat.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={handleSave}
                    disabled={!content || loading}
                    style={{
                      padding: '7px 12px', borderRadius: 9, cursor: content && !loading ? 'pointer' : 'not-allowed',
                      border: '1px solid rgba(245,158,11,0.3)',
                      background: savedFlash ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.03)',
                      color: savedFlash ? '#fbbf24' : '#d0d0f0',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5,
                      opacity: loading || !content ? 0.45 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {savedFlash ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                    {savedFlash ? '已收藏' : '收藏'}
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!content || loading}
                    style={{
                      padding: '7px 12px', borderRadius: 9, cursor: content && !loading ? 'pointer' : 'not-allowed',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)',
                      color: copied ? '#34d399' : '#d0d0f0',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5,
                      opacity: loading || !content ? 0.45 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                  <button
                    onClick={fetchContent}
                    disabled={loading}
                    style={{
                      padding: '7px 14px', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
                      boxShadow: '0 4px 14px rgba(124,108,240,0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
                    {loading ? '加载中…' : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Shuffle size={13} /> 换一批
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Content viewport */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0 }}>
                {loading && <LoadingSkeleton catKey={activeCat} />}
                {!loading && error && <ErrorState message={error} onRetry={fetchContent} />}
                {!loading && !error && content && <ContentView catKey={activeCat} data={content} jokeRevealed={jokeRevealed} onRevealJoke={() => setJokeRevealed(true)} />}
                {!loading && !error && !content && <div style={{ textAlign: 'center', color: '#777799', padding: 60, fontSize: 14 }}>暂无内容</div>}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .nx-fade { animation: fadeInUp 0.35s cubic-bezier(0.4,0,0.2,1) both; }
        .nx-scroll::-webkit-scrollbar { width: 8px; }
        .nx-scroll::-webkit-scrollbar-thumb { background: rgba(155,138,240,0.35); border-radius: 4px; }
      `}</style>
    </div>
  )
}

function LoadingSkeleton({ catKey }: { catKey: CategoryKey }) {
  const isImageCard = catKey === 'dogs' || catKey === 'cats' || catKey === 'art' || catKey === 'users' || catKey === 'meals'
  return (
    <div className="nx-fade" style={{
      padding: 24, borderRadius: 16,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(155, 138, 240, 0.08)'
    }}>
      <div style={{ height: 14, width: '35%', background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 16 }} />
      {isImageCard ? (
        <>
          <div style={{ width: '100%', height: 260, background: 'rgba(255,255,255,0.05)', borderRadius: 12, animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 16 }} />
          <div style={{ height: 12, width: '55%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 10 }} />
          <div style={{ height: 11, width: '35%', background: 'rgba(255,255,255,0.04)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />
        </>
      ) : (
        <>
          {[78, 92, 65, 48].map((w, i) => (
            <div key={i} style={{ height: 14, width: `${w}%`, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 12, animation: `pulse 1.4s ease-in-out ${i * 0.12}s infinite` }} />
          ))}
        </>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.9 } }`}</style>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="nx-fade" style={{
      padding: 40, borderRadius: 16, textAlign: 'center',
      background: 'rgba(239, 68, 68, 0.06)',
      border: '1px solid rgba(239, 68, 68, 0.18)',
    }}>
      <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={26} color="#f87171" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#fca5a5', marginBottom: 6 }}>加载失败</div>
      <div style={{ fontSize: 13, color: '#9494b4', marginBottom: 18 }}>{message}</div>
      <button onClick={onRetry} style={{
        padding: '9px 20px', borderRadius: 10, cursor: 'pointer',
        border: 'none',
        background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> 重试</span>
      </button>
    </div>
  )
}

function ContentView({ catKey, data, jokeRevealed, onRevealJoke }: {
  catKey: CategoryKey; data: ContentData; jokeRevealed: boolean; onRevealJoke: () => void
}) {
  switch (catKey) {
    case 'quotes': return <QuoteCard d={data as QuoteData} />
    case 'jokes': return <JokeCard d={data as JokeData} revealed={jokeRevealed} onReveal={onRevealJoke} />
    case 'dogs': return <ImageCard title="🐕 萌宠狗狗" src={(data as DogData).message} />
    case 'cats': return <ImageCard title="🐈 猫咪日记" src={(data as CatData).url} />
    case 'users': return <UserCard u={(data as UserData).results[0]} />
    case 'art': return <ArtGallery d={data as ArtData} />
    case 'meals': return <MealCard m={(data as MealData).meals?.[0]} />
    case 'apis': return <ApiList d={data as ApiData} />
    default: return null
  }
}

const cardWrap = (children: React.ReactNode, extraStyle?: React.CSSProperties) => (
  <div className="nx-fade" style={{
    padding: 32, borderRadius: 20,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
    border: '1px solid rgba(155, 138, 240, 0.1)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
    ...extraStyle
  }}>{children}</div>
)

function QuoteCard({ d }: { d: QuoteData }) {
  return cardWrap(
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: -8, left: -4,
        fontSize: 72, color: 'rgba(155,138,240,0.18)', fontFamily: 'Georgia, serif',
        lineHeight: 1, pointerEvents: 'none'
      }}>“</div>
      <blockquote style={{
        fontSize: 24, lineHeight: 1.6, color: '#f0efff',
        fontWeight: 500, letterSpacing: -0.01,
        padding: '12px 24px 12px 40px',
        fontFamily: 'Georgia, "Noto Serif SC", serif',
      }}>
        {d.q}
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 20, gap: 10, paddingRight: 8 }}>
        <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, transparent, #9b8af0)' }} />
        <div style={{
          fontSize: 14, color: '#b8a8ff', fontWeight: 600,
          fontStyle: 'italic', fontFamily: 'Georgia, "Noto Serif SC", serif'
        }}>— {d.a}</div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginTop: 28, padding: '6px 12px',
        borderRadius: 999, fontSize: 11.5, color: '#94a3b8',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Sparkles size={13} color="#fbbf24" /> 每日箴言 · ZenQuotes
      </div>
    </div>
  )
}

function JokeCard({ d, revealed, onReveal }: { d: JokeData; revealed: boolean; onReveal: () => void }) {
  return cardWrap(
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'inline-block', padding: '4px 14px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, color: '#fff',
        background: d.type === 'general' ? 'linear-gradient(135deg,#7c6cf0,#5b4bd6)'
          : d.type === 'programming' ? 'linear-gradient(135deg,#00d6c1,#00a896)'
          : 'linear-gradient(135deg,#f59e0b,#ef4444)',
        marginBottom: 20, letterSpacing: 0.02
      }}>{d.type.toUpperCase()}</div>
      <div style={{
        fontSize: 22, lineHeight: 1.55, color: '#f0efff', fontWeight: 500,
        letterSpacing: -0.01, marginBottom: revealed ? 16 : 28,
        fontFamily: '"Noto Sans SC", sans-serif'
      }}>{d.setup}</div>
      {!revealed ? (
        <button onClick={onReveal} style={{
          padding: '12px 26px', borderRadius: 12, cursor: 'pointer',
          border: '1px dashed rgba(155,138,240,0.4)',
          background: 'rgba(155,138,240,0.06)',
          color: '#c4b5fd', fontSize: 14, fontWeight: 600,
          transition: 'all 0.2s',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={15} /> 点击揭晓答案
          </span>
        </button>
      ) : (
        <div className="nx-fade" style={{
          padding: '20px 24px', borderRadius: 14,
          background: 'linear-gradient(90deg, rgba(251,191,36,0.12), rgba(16,185,129,0.08))',
          borderLeft: '3px solid #fbbf24',
          fontSize: 18, lineHeight: 1.55, color: '#e0f2fe',
          fontFamily: '"Noto Sans SC", sans-serif'
        }}>{d.punchline}</div>
      )}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginTop: 28, padding: '6px 12px',
        borderRadius: 999, fontSize: 11.5, color: '#94a3b8',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Coffee size={13} color="#fb7185" /> Official Joke API
      </div>
    </div>
  )
}

function ImageCard({ title, src }: { title: string; src: string }) {
  const [loaded, setLoaded] = useState(false)
  return cardWrap(
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f0efff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image size={18} color="#9b8af0" /> {title}
        </div>
        <a href={src} target="_blank" rel="noreferrer noopener" style={{
          padding: '6px 12px', borderRadius: 8, fontSize: 11.5, color: '#9b8af0',
          border: '1px solid rgba(155,138,240,0.25)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 4
        }}>原图 ↗</a>
      </div>
      <div style={{
        width: '100%', borderRadius: 16, overflow: 'hidden',
        background: 'rgba(0,0,0,0.25)',
        aspectRatio: '16 / 10', position: 'relative',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#777799', fontSize: 13,
          }}>图片加载中…</div>
        )}
        <img
          src={src}
          alt={title}
          onLoad={() => setLoaded(true)}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2' }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}
        />
      </div>
    </div>
  )
}

function UserCard({ u }: { u: UserData['results'][0] }) {
  if (!u) return null
  return cardWrap(
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 128, height: 128, borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
          padding: 3,
          boxShadow: '0 10px 30px rgba(124,108,240,0.35)'
        }}>
          <img src={u.picture.large} alt="" style={{ width: '100%', height: '100%', borderRadius: 21, objectFit: 'cover' }} />
        </div>
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '5px 12px', borderRadius: 999,
            background: 'rgba(0,214,193,0.12)', color: '#5eead4',
            fontSize: 11, fontWeight: 600, border: '1px solid rgba(0,214,193,0.25)'
          }}>
            <Users size={11} style={{ display: 'inline-block', marginRight: 5 }} /> RandomUser.me
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{
          fontSize: 26, fontWeight: 700, color: '#f0efff', letterSpacing: -0.02, marginBottom: 4
        }}>{u.name.title} {u.name.first} {u.name.last}</div>
        <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 22 }}>@{u.login.username} · {u.dob.age} 岁</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { i: <Users size={15} />, l: '邮箱', v: u.email },
            { i: <Music size={15} />, l: '电话', v: u.phone },
            { i: <Globe size={15} />, l: '位置', v: `${u.location.city}, ${u.location.state}, ${u.location.country}` },
            { i: <Star size={15} />, l: '登录密码', v: u.login.password },
          ].map((f, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 11,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8888aa', fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: '#9b8af0' }}>{f.i}</span>{f.l}
              </div>
              <div style={{ fontSize: 13, color: '#e0e0ff', wordBreak: 'break-all', lineHeight: 1.4 }}>{f.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ArtGallery({ d }: { d: ArtData }) {
  const items = d?.data ?? []
  if (items.length === 0) return <div style={{ color: '#777799', textAlign: 'center', padding: 40 }}>暂无藏品</div>
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f0efff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={18} color="#34d399" /> Art Institute of Chicago · 精选藏品
        </div>
        <div style={{ fontSize: 12, color: '#8888aa' }}>共 {items.length} 件</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {items.map((art, i) => {
          const imgUrl = art.image_id ? `https://www.artic.edu/iiif/2/${art.image_id}/full/600,/0/default.jpg` : ''
          return (
            <div key={art.id ?? i} className="nx-fade" style={{
              animationDelay: `${i * 40}ms`,
              borderRadius: 14, overflow: 'hidden',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'transform 0.25s, box-shadow 0.25s',
              cursor: 'pointer',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg,#1a1a2e,#0f0f1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {imgUrl ? (
                  <img src={imgUrl} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <div style={{ color: '#555577', fontSize: 12 }}>无图片</div>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8ff', marginBottom: 4, lineHeight: 1.35, minHeight: 34 }}>{art.title}</div>
                <div style={{ fontSize: 11.5, color: '#9b8af0', marginBottom: 3 }}>{art.artist_title || '佚名艺术家'}</div>
                <div style={{ fontSize: 10.5, color: '#777799', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={11} /> {art.date_display || '年代未知'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MealCard({ m }: { m: MealItem | undefined }) {
  if (!m) return <div style={{ color: '#777799', textAlign: 'center', padding: 40 }}>暂无食谱</div>
  return cardWrap(
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden', aspectRatio: '1 / 1',
          boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <img src={m.strMealThumb} alt={m.strMeal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>{m.strCategory}</span>
          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>{m.strArea} 料理</span>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999,
            fontSize: 11, background: 'rgba(155,138,240,0.12)', color: '#c4b5fd',
            border: '1px solid rgba(155,138,240,0.25)'
          }}><Film size={11} /> TheMealDB</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 260 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#f0efff', letterSpacing: -0.02, marginBottom: 16 }}>{m.strMeal}</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#8888aa', marginBottom: 8, fontWeight: 600 }}>📝 制作步骤</div>
          <div style={{
            maxHeight: 260, overflowY: 'auto', padding: 14, borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: 13, color: '#d0d0ee', lineHeight: 1.75,
            whiteSpace: 'pre-wrap'
          }} className="nx-scroll">{m.strInstructions}</div>
        </div>
        {m.strYoutube && (
          <a href={m.strYoutube} target="_blank" rel="noreferrer noopener" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            fontSize: 12.5, textDecoration: 'none', fontWeight: 500,
            border: '1px solid rgba(239,68,68,0.3)'
          }}>
            ▶ 在 YouTube 观看教程
          </a>
        )}
      </div>
    </div>
  )
}

function ApiList({ d }: { d: ApiData }) {
  const entries = d?.entries ?? []
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f0efff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} color="#7c6cf0" /> Public APIs · 随机发现
        </div>
        <div style={{ fontSize: 12, color: '#8888aa' }}>{entries.length} 个可用 API</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {entries.map((e, i) => (
          <a key={`${e.API}-${i}`} href={e.Link} target="_blank" rel="noreferrer noopener"
            className="nx-fade"
            style={{
              animationDelay: `${i * 35}ms`,
              display: 'block', padding: 16, borderRadius: 14, textDecoration: 'none',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.borderColor = 'rgba(155,138,240,0.4)';
              ev.currentTarget.style.background = 'rgba(155,138,240,0.06)';
              ev.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.borderColor = '';
              ev.currentTarget.style.background = '';
              ev.currentTarget.style.transform = '';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#e8e8ff' }}>{e.API}</div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {e.HTTPS && <span title="HTTPS" style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>HTTPS</span>}
                {!e.Auth && <span title="无需认证" style={{ padding: '2px 6px', borderRadius: 5, fontSize: 10, background: 'rgba(0,214,193,0.12)', color: '#5eead4' }}>NoKey</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.5, marginBottom: 10, minHeight: 34 }}>{e.Description}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 10.5, background: 'rgba(155,138,240,0.1)', color: '#b8a8ff' }}>{e.Category}</span>
              <ChevronRight size={14} style={{ color: '#777799' }} />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function SavedView({ items, search, onSearchChange, onDelete, onRecover }: {
  items: SavedItem[]; search: string; onSearchChange: (s: string) => void;
  onDelete: (id: string) => void; onRecover: (item: SavedItem) => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(155, 138, 240, 0.08)',
        background: 'rgba(245,158,11,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <Search size={14} color="#777799" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索收藏内容…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#e0e0ff', fontSize: 13,
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#8888aa' }}>{items.length} 项收藏</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }} className="nx-scroll">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8888aa' }}>
            <div style={{ width: 60, height: 60, margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={26} color="#fbbf24" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#c0c0e0', marginBottom: 6 }}>收藏夹为空</div>
            <div style={{ fontSize: 12.5 }}>浏览有趣内容时，点击「收藏」按钮保存到这里</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {items.map((it, i) => {
              const c = CATEGORIES.find(x => x.key === it.category)
              const date = new Date(it.timestamp)
              return (
                <div key={it.id} className="nx-fade" style={{
                  animationDelay: `${i * 30}ms`,
                  padding: 14, borderRadius: 13,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  minHeight: 148,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: c ? `linear-gradient(135deg, ${c.accent})` : '#333',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12,
                      }}>{c?.icon}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{c?.name}</span>
                    </div>
                    <button
                      onClick={() => onDelete(it.id)}
                      title="删除"
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#666688', padding: 4, borderRadius: 6,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.background = '' }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#d0d0ee', lineHeight: 1.55, flex: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {it.preview}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, color: '#777799' }}>
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={() => onRecover(it)} style={{
                      padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                      background: 'rgba(124,108,240,0.12)', color: '#c4b5fd',
                      border: '1px solid rgba(124,108,240,0.25)',
                      fontSize: 11, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      查看 <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
