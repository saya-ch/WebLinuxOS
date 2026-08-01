import { useState, useCallback, useEffect, useRef, memo } from 'react'

/**
 * RecipeLab — 食谱实验室
 * 基于 TheMealDB 免费 API (https://www.themealdb.com/api.php)
 * 功能：食谱搜索 / 分类浏览 / 随机食谱 / 食谱详情 / 食材筛选 / 周计划 / 购物清单 / 收藏夹
 */

// ─── 颜色常量 ───
const C = {
  bg: '#0a0a18',
  bg2: '#12122a',
  accent: '#8b7cf0',
  food: '#f0932b',
  foodLight: '#ffb347',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  border: 'rgba(139,124,240,0.15)',
  glass: 'rgba(18,18,42,0.75)',
  glassHover: 'rgba(139,124,240,0.08)',
  danger: '#ef4444',
  success: '#22c55e',
}

// ─── API 基地址 ───
const API = 'https://www.themealdb.com/api/json/v1/1'

// ─── localStorage 键 ───
const FAV_KEY = 'recipelab-favorites'
const PLAN_KEY = 'recipelab-mealplan'
const SHOP_KEY = 'recipelab-shopping'

// ─── 类型 ───
interface Meal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags: string | null
  strYoutube: string | null
  strSource: string | null
  [key: string]: string | null
}

interface MealPreview {
  idMeal: string
  strMeal: string
  strMealThumb: string
}

interface Category {
  idCategory: string
  strCategory: string
  strCategoryThumb: string
  strCategoryDescription: string
}

interface Favorite {
  idMeal: string
  strMeal: string
  strMealThumb: string
  tags: string[]
  savedAt: number
}

interface ShoppingItem {
  text: string
  checked: boolean
}

type Tab = 'search' | 'categories' | 'random' | 'planner' | 'shopping' | 'favorites'
type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四',
  Fri: '周五', Sat: '周六', Sun: '周日',
}

// ─── 工具函数 ───

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
}

function getIngredients(meal: Meal): string[] {
  const items: string[] = []
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (ing && ing.trim()) {
      const m = measure && measure.trim() ? measure.trim() + ' ' : ''
      items.push(`${m}${ing.trim()}`)
    }
  }
  return items
}

function youtubeEmbed(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function mealToPreview(m: Meal): MealPreview {
  return { idMeal: m.idMeal, strMeal: m.strMeal, strMealThumb: m.strMealThumb }
}

// ─── 动画 keyframes ───
const ANIM = {
  fadeIn: 'rl-fadeIn 0.3s ease forwards',
  slideUp: 'rl-slideUp 0.35s ease forwards',
  spin: 'rl-spin 0.8s linear infinite',
  pulse: 'rl-pulse 1.5s ease-in-out infinite',
  shake: 'rl-shake 0.5s ease',
  pop: 'rl-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
}

const GLOBAL_CSS = `
@keyframes rl-fadeIn { from{opacity:0} to{opacity:1} }
@keyframes rl-slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes rl-spin { to{transform:rotate(360deg)} }
@keyframes rl-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes rl-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes rl-pop { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
@keyframes rl-dice { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.2)} 100%{transform:rotate(360deg) scale(1)} }
.rl-scroll::-webkit-scrollbar{width:6px}
.rl-scroll::-webkit-scrollbar-track{background:transparent}
.rl-scroll::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
.rl-scroll::-webkit-scrollbar-thumb:hover{background:${C.accent}}
`

// ─── 子组件：全局样式注入 ───

function GlobalStyles() {
  useEffect(() => {
    const id = 'recipelab-global-css'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = GLOBAL_CSS
    document.head.appendChild(style)
    return () => { document.getElementById(id)?.remove() }
  }, [])
  return null
}

// ─── 子组件：加载动画 ───

function Spinner({ size = 32, color = C.accent }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${C.border}`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: ANIM.spin,
    }} />
  )
}

function LoadingOverlay({ message = '加载中...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: 48, color: C.textDim,
    }}>
      <Spinner size={40} color={C.food} />
      <span style={{ fontSize: 14 }}>{message}</span>
    </div>
  )
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, padding: 32, color: C.danger, animation: ANIM.shake,
    }}>
      <span style={{ fontSize: 40 }}>⚠️</span>
      <p style={{ margin: 0, fontSize: 14, color: C.textDim }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding: '8px 20px', background: C.danger, color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
        }}>重试</button>
      )}
    </div>
  )
}

// ─── 子组件：食谱卡片 ───

const MealCard = memo(function MealCard({
  meal, onClick, isFav, onToggleFav, delay = 0, compact = false,
}: {
  meal: MealPreview
  onClick: () => void
  isFav: boolean
  onToggleFav: (e: React.MouseEvent) => void
  delay?: number
  compact?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.glassHover : C.glass,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hovered ? C.accent + '40' : C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 32px ${C.accent}20` : 'none',
        animation: `${ANIM.slideUp}`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div style={{
        height: compact ? 100 : 150,
        background: `linear-gradient(135deg, ${C.food}30, ${C.accent}20)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <img
          src={meal.strMealThumb}
          alt={meal.strMeal}
          loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.3s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, ${C.bg}60, transparent)`,
        }} />
        <button
          onClick={onToggleFav}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            border: 'none', borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={{ padding: compact ? '8px 10px' : '12px 14px' }}>
        <h3 style={{
          margin: 0, fontSize: compact ? 12 : 14, fontWeight: 600,
          color: C.text, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {meal.strMeal}
        </h3>
      </div>
    </div>
  )
})

// ─── 子组件：食谱详情 ───

function RecipeDetail({
  meal, isFav, onToggleFav, onAddToPlan, onAddToShopping,
}: {
  meal: Meal
  isFav: boolean
  onToggleFav: () => void
  onAddToPlan: () => void
  onAddToShopping: () => void
}) {
  const ingredients = getIngredients(meal)
  const embedUrl = youtubeEmbed(meal.strYoutube)
  const tags = meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div style={{ animation: ANIM.fadeIn }}>
      {/* Hero */}
      <div style={{
        height: 220, position: 'relative', overflow: 'hidden',
      }}>
        <img
          src={meal.strMealThumb}
          alt={meal.strMeal}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, ${C.bg} 10%, ${C.bg}80 50%, transparent)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 16, left: 20, right: 20,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 700, color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            {meal.strMeal}
          </h1>
          <button onClick={onToggleFav} style={{
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            border: 'none', borderRadius: 10, padding: '8px 14px',
            cursor: 'pointer', fontSize: 16, color: '#fff',
          }}>
            {isFav ? '❤️ 已收藏' : '🤍 收藏'}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Meta badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, marginBottom: 16 }}>
          {meal.strCategory && (
            <span style={{
              background: `${C.food}20`, color: C.food,
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            }}>
              🍽️ {meal.strCategory}
            </span>
          )}
          {meal.strArea && (
            <span style={{
              background: `${C.accent}20`, color: C.accent,
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            }}>
              🌍 {meal.strArea}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} style={{
              background: `${C.border}`, color: C.textDim,
              padding: '4px 12px', borderRadius: 20, fontSize: 12,
            }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={onAddToPlan} style={{
            padding: '8px 16px', background: `${C.accent}25`, color: C.accent,
            border: `1px solid ${C.accent}40`, borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'background 0.2s',
          }}>
            📅 加入计划
          </button>
          <button onClick={onAddToShopping} style={{
            padding: '8px 16px', background: `${C.food}25`, color: C.food,
            border: `1px solid ${C.food}40`, borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'background 0.2s',
          }}>
            🛒 生成购物清单
          </button>
          {meal.strSource && (
            <a href={meal.strSource} target="_blank" rel="noopener noreferrer" style={{
              padding: '8px 16px', background: `${C.border}`, color: C.textDim,
              border: `1px solid ${C.border}`, borderRadius: 8,
              fontSize: 13, textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: 4,
            }}>
              🔗 来源 ↗
            </a>
          )}
        </div>

        {/* Ingredients */}
        <div style={{
          background: C.glass, backdropFilter: 'blur(12px)',
          border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 18, marginBottom: 18,
        }}>
          <h3 style={{
            margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: C.text,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: C.food }}>🥗</span> 食材清单
          </h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 6,
          }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8,
                background: i % 2 === 0 ? 'rgba(139,124,240,0.05)' : 'transparent',
                fontSize: 13, color: C.textDim,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.food, flexShrink: 0,
                }} />
                {ing}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: C.glass, backdropFilter: 'blur(12px)',
          border: `1px solid ${C.border}`, borderRadius: 14,
          padding: 18, marginBottom: 18,
        }}>
          <h3 style={{
            margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: C.text,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: C.food }}>👨‍🍳</span> 烹饪步骤
          </h3>
          <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {meal.strInstructions}
          </div>
        </div>

        {/* YouTube */}
        {embedUrl && (
          <div style={{
            background: C.glass, backdropFilter: 'blur(12px)',
            border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 18, marginBottom: 18,
          }}>
            <h3 style={{
              margin: '0 0 14px 0', fontSize: 15, fontWeight: 600, color: C.text,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: '#ff0000' }}>▶️</span> 视频教程
            </h3>
            <div style={{
              position: 'relative', paddingBottom: '56.25%', height: 0,
              borderRadius: 10, overflow: 'hidden',
            }}>
              <iframe
                src={embedUrl}
                title="Recipe Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%', border: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 主组件 ───

export default memo(function RecipeLab() {
  // 状态
  const [tab, setTab] = useState<Tab>('search')
  const [query, setQuery] = useState('')
  const [ingredientQuery, setIngredientQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MealPreview[]>([])
  const [ingredientResults, setIngredientResults] = useState<MealPreview[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryMeals, setCategoryMeals] = useState<MealPreview[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [randomMeal, setRandomMeal] = useState<Meal | null>(null)
  const [detailMeal, setDetailMeal] = useState<Meal | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadJSON(FAV_KEY, []))
  const [mealPlan, setMealPlan] = useState<Record<DayOfWeek, MealPreview | null>>(() => loadJSON(PLAN_KEY, {
    Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null,
  }))
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => loadJSON(SHOP_KEY, []))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'name' | 'ingredient'>('name')
  const [planPickerDay, setPlanPickerDay] = useState<DayOfWeek | null>(null)
  const [favTagInput, setFavTagInput] = useState<Record<string, string>>({})
  const [isSpinning, setIsSpinning] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  // 持久化
  useEffect(() => { saveJSON(FAV_KEY, favorites) }, [favorites])
  useEffect(() => { saveJSON(PLAN_KEY, mealPlan) }, [mealPlan])
  useEffect(() => { saveJSON(SHOP_KEY, shoppingList) }, [shoppingList])

  // 清理
  useEffect(() => { return () => { abortRef.current?.abort() } }, [])

  // ─── API 调用 ───

  const searchByName = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    fetchJSON<{ meals: Meal[] | null }>(`${API}/search.php?s=${encodeURIComponent(trimmed)}`, ac.signal)
      .then(data => {
        setSearchResults(data.meals ? data.meals.map(mealToPreview) : [])
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setError('搜索失败，请检查网络后重试')
        setLoading(false)
      })
  }, [])

  const searchByIngredient = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    fetchJSON<{ meals: MealPreview[] | null }>(`${API}/filter.php?i=${encodeURIComponent(trimmed)}`, ac.signal)
      .then(data => {
        setIngredientResults(data.meals || [])
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setError('搜索失败，请检查网络后重试')
        setLoading(false)
      })
  }, [])

  const fetchCategories = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchJSON<{ categories: Category[] | null }>(`${API}/categories.php`)
      .then(data => {
        setCategories(data.categories || [])
        setLoading(false)
      })
      .catch(() => {
        setError('无法加载分类')
        setLoading(false)
      })
  }, [])

  const fetchCategoryMeals = useCallback((cat: string) => {
    setLoading(true)
    setError(null)
    setSelectedCategory(cat)
    fetchJSON<{ meals: MealPreview[] | null }>(`${API}/filter.php?c=${encodeURIComponent(cat)}`)
      .then(data => {
        setCategoryMeals(data.meals || [])
        setLoading(false)
      })
      .catch(() => {
        setError('无法加载分类食谱')
        setLoading(false)
      })
  }, [])

  const fetchRandomMeal = useCallback(() => {
    setIsSpinning(true)
    setLoading(true)
    setError(null)
    fetchJSON<{ meals: Meal[] | null }>(`${API}/random.php`)
      .then(data => {
        setRandomMeal(data.meals ? data.meals[0] : null)
        setTimeout(() => {
          setIsSpinning(false)
          setLoading(false)
        }, 500)
      })
      .catch(() => {
        setError('无法获取随机食谱')
        setIsSpinning(false)
        setLoading(false)
      })
  }, [])

  const fetchMealDetail = useCallback((id: string) => {
    setLoading(true)
    setError(null)
    fetchJSON<{ meals: Meal[] | null }>(`${API}/lookup.php?i=${id}`)
      .then(data => {
        setDetailMeal(data.meals ? data.meals[0] : null)
        setLoading(false)
      })
      .catch(() => {
        setError('无法加载食谱详情')
        setLoading(false)
      })
  }, [])

  // ─── 收藏 ───

  const isFav = useCallback((id: string) => favorites.some(f => f.idMeal === id), [favorites])

  const toggleFav = useCallback((meal: MealPreview, tags: string[] = []) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.idMeal === meal.idMeal)
      if (exists) {
        return prev.filter(f => f.idMeal !== meal.idMeal)
      }
      return [{ idMeal: meal.idMeal, strMeal: meal.strMeal, strMealThumb: meal.strMealThumb, tags, savedAt: Date.now() }, ...prev]
    })
  }, [])

  const addFavTag = useCallback((idMeal: string, tag: string) => {
    if (!tag.trim()) return
    setFavorites(prev => prev.map(f =>
      f.idMeal === idMeal && !f.tags.includes(tag.trim())
        ? { ...f, tags: [...f.tags, tag.trim()] }
        : f
    ))
    setFavTagInput(prev => ({ ...prev, [idMeal]: '' }))
  }, [])

  const removeFavTag = useCallback((idMeal: string, tag: string) => {
    setFavorites(prev => prev.map(f =>
      f.idMeal === idMeal
        ? { ...f, tags: f.tags.filter(t => t !== tag) }
        : f
    ))
  }, [])

  // ─── 周计划 ───

  const setPlanSlot = useCallback((day: DayOfWeek, meal: MealPreview | null) => {
    setMealPlan(prev => ({ ...prev, [day]: meal }))
    setPlanPickerDay(null)
  }, [])

  // ─── 购物清单 ───

  const addMealToShopping = useCallback((meal: Meal) => {
    const items = getIngredients(meal)
    setShoppingList(prev => {
      const existing = new Set(prev.map(i => i.text.toLowerCase()))
      const newItems = items.filter(i => !existing.has(i.toLowerCase())).map(i => ({ text: i, checked: false }))
      return [...prev, ...newItems]
    })
  }, [])

  const toggleShopItem = useCallback((index: number) => {
    setShoppingList(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item))
  }, [])

  const removeShopItem = useCallback((index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearChecked = useCallback(() => {
    setShoppingList(prev => prev.filter(i => !i.checked))
  }, [])

  // ─── 搜索处理 ───

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchMode === 'name') searchByName(query)
    else searchByIngredient(ingredientQuery)
  }, [searchMode, query, ingredientQuery, searchByName, searchByIngredient])

  // 初始加载分类
  useEffect(() => {
    if (tab === 'categories' && categories.length === 0) fetchCategories()
  }, [tab, categories.length, fetchCategories])

  // ─── 渲染 ───

  const activeResults = searchMode === 'name' ? searchResults : ingredientResults

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 100%)`,
      color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <GlobalStyles />

      {/* Header */}
      <div style={{
        padding: '12px 20px',
        background: `linear-gradient(135deg, ${C.food}dd 0%, ${C.accent}99 100%)`,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 24 }}>
          {isSpinning ? '🎲' : '🧪'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: 0.5 }}>
            食谱实验室
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
            RecipeLab · TheMealDB · 探索全球美味
          </div>
        </div>
        {detailMeal && (
          <button onClick={() => setDetailMeal(null)} style={{
            padding: '6px 14px', background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, backdropFilter: 'blur(4px)',
          }}>
            ← 返回
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, padding: '8px 12px',
        background: C.bg2, borderBottom: `1px solid ${C.border}`,
        overflowX: 'auto', flexShrink: 0,
      }} className="rl-scroll">
        {([
          ['search', '🔍 搜索'],
          ['categories', '📂 分类'],
          ['random', '🎲 随机'],
          ['planner', '📅 计划'],
          ['shopping', '🛒 购物'],
          ['favorites', '❤️ 收藏'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setDetailMeal(null); setError(null) }}
            style={{
              padding: '7px 14px', border: 'none', borderRadius: 8,
              background: tab === key ? `${C.accent}30` : 'transparent',
              color: tab === key ? C.accent : C.textDim,
              cursor: 'pointer', fontSize: 12, fontWeight: tab === key ? 600 : 400,
              whiteSpace: 'nowrap', transition: 'all 0.2s',
              borderRight: tab === key ? `2px solid ${C.accent}` : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }} className="rl-scroll">

        {/* === Detail View (overlay) === */}
        {detailMeal ? (
          loading ? <LoadingOverlay message="加载食谱详情..." /> :
          error ? <ErrorBox message={error} onRetry={() => fetchMealDetail(detailMeal.idMeal)} /> :
          <RecipeDetail
            meal={detailMeal}
            isFav={isFav(detailMeal.idMeal)}
            onToggleFav={() => toggleFav(mealToPreview(detailMeal), detailMeal.strTags ? detailMeal.strTags.split(',').map(t => t.trim()) : [])}
            onAddToPlan={() => {
              const emptyDay = DAYS.find(d => !mealPlan[d])
              if (emptyDay) {
                setPlanSlot(emptyDay, mealToPreview(detailMeal))
              } else {
                setPlanPickerDay(DAYS[0])
              }
            }}
            onAddToShopping={() => addMealToShopping(detailMeal)}
          />
        ) : (

          /* === Search Tab === */
          tab === 'search' ? (
            <div style={{ padding: 16 }}>
              {/* Search mode toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setSearchMode('name')}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: searchMode === 'name' ? `${C.accent}25` : 'transparent',
                    color: searchMode === 'name' ? C.accent : C.textMuted,
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    borderBottom: searchMode === 'name' ? `2px solid ${C.accent}` : '2px solid transparent',
                  }}
                >
                  按名称搜索
                </button>
                <button
                  onClick={() => setSearchMode('ingredient')}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: searchMode === 'ingredient' ? `${C.food}25` : 'transparent',
                    color: searchMode === 'ingredient' ? C.food : C.textMuted,
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    borderBottom: searchMode === 'ingredient' ? `2px solid ${C.food}` : '2px solid transparent',
                  }}
                >
                  按食材筛选
                </button>
              </div>

              {/* Search form */}
              <form onSubmit={handleSearch} style={{
                display: 'flex', gap: 8, marginBottom: 16,
              }}>
                <div style={{
                  flex: 1, position: 'relative',
                  background: C.glass, backdropFilter: 'blur(12px)',
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  display: 'flex', alignItems: 'center',
                }}>
                  <span style={{ paddingLeft: 12, color: C.textMuted, fontSize: 14 }}>
                    {searchMode === 'name' ? '🔍' : '🥕'}
                  </span>
                  <input
                    type="text"
                    value={searchMode === 'name' ? query : ingredientQuery}
                    onChange={e => searchMode === 'name' ? setQuery(e.target.value) : setIngredientQuery(e.target.value)}
                    placeholder={searchMode === 'name' ? '搜索食谱名称 (如 chicken)...' : '输入食材 (如 chicken_breast)...'}
                    style={{
                      flex: 1, padding: '10px 12px', background: 'transparent',
                      border: 'none', color: C.text, fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.food})`,
                  border: 'none', borderRadius: 10, color: '#fff',
                  cursor: loading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? '...' : '搜索'}
                </button>
              </form>

              {/* Results */}
              {loading ? <LoadingOverlay /> :
              error ? <ErrorBox message={error} /> :
              activeResults.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 48, color: C.textMuted,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    {searchMode === 'name' ? '🍽️' : '🥕'}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {searchMode === 'name' ? '输入菜名开始探索' : '输入食材查找可用食谱'}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 12,
                }}>
                  {activeResults.map((m, i) => (
                    <MealCard
                      key={m.idMeal} meal={m} delay={Math.min(i * 40, 400)}
                      isFav={isFav(m.idMeal)}
                      onClick={() => fetchMealDetail(m.idMeal)}
                      onToggleFav={e => { e.stopPropagation(); toggleFav(m) }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) :

          /* === Categories Tab === */
          tab === 'categories' ? (
            <div style={{ padding: 16 }}>
              {selectedCategory && (
                <button onClick={() => { setSelectedCategory(null); setCategoryMeals([]) }} style={{
                  padding: '6px 14px', background: `${C.accent}20`, color: C.accent,
                  border: `1px solid ${C.accent}40`, borderRadius: 8,
                  cursor: 'pointer', fontSize: 12, marginBottom: 12,
                }}>
                  ← 返回分类列表
                </button>
              )}

              {loading ? <LoadingOverlay /> :
              error ? <ErrorBox message={error} onRetry={fetchCategories} /> :
              selectedCategory && categoryMeals.length > 0 ? (
                <div>
                  <h3 style={{
                    margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: C.food,
                  }}>
                    {selectedCategory} 食谱
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 12,
                  }}>
                    {categoryMeals.map((m, i) => (
                      <MealCard
                        key={m.idMeal} meal={m} delay={Math.min(i * 35, 400)}
                        isFav={isFav(m.idMeal)}
                        onClick={() => fetchMealDetail(m.idMeal)}
                        onToggleFav={e => { e.stopPropagation(); toggleFav(m) }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 12,
                }}>
                  {categories.map((cat, i) => (
                    <div
                      key={cat.idCategory}
                      onClick={() => fetchCategoryMeals(cat.strCategory)}
                      style={{
                        background: C.glass, backdropFilter: 'blur(12px)',
                        border: `1px solid ${C.border}`, borderRadius: 14,
                        padding: 16, cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.25s',
                        animation: `${ANIM.slideUp}`,
                        animationDelay: `${Math.min(i * 50, 500)}ms`,
                        animationFillMode: 'backwards',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = C.food + '50'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 6px 24px ${C.food}15`
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.border
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <img
                        src={cat.strCategoryThumb}
                        alt={cat.strCategory}
                        style={{
                          width: 80, height: 80, objectFit: 'cover',
                          borderRadius: 12, marginBottom: 10,
                        }}
                      />
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: C.text,
                        marginBottom: 4,
                      }}>
                        {cat.strCategory}
                      </div>
                      <div style={{
                        fontSize: 11, color: C.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {cat.strCategoryDescription}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) :

          /* === Random Tab === */
          tab === 'random' ? (
            <div style={{ padding: 16 }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 20, marginBottom: 24,
              }}>
                <div style={{
                  fontSize: 64,
                  animation: isSpinning ? 'rl-dice 0.5s ease' : 'none',
                  filter: isSpinning ? `drop-shadow(0 0 20px ${C.food})` : 'none',
                }}>
                  🎲
                </div>
                <button
                  onClick={fetchRandomMeal}
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    background: `linear-gradient(135deg, ${C.food}, ${C.foodLight})`,
                    border: 'none', borderRadius: 12,
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    boxShadow: `0 4px 20px ${C.food}40`,
                    transition: 'all 0.3s',
                    transform: loading ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  {loading ? '探索中...' : '🎲 随机发现'}
                </button>
                <span style={{ fontSize: 12, color: C.textMuted }}>
                  点击按钮，发现一道新美食
                </span>
              </div>

              {loading && !randomMeal ? <LoadingOverlay message="寻找美味中..." /> :
              error ? <ErrorBox message={error} onRetry={fetchRandomMeal} /> :
              randomMeal ? (
                <div style={{ animation: ANIM.pop }}>
                  <RecipeDetail
                    meal={randomMeal}
                    isFav={isFav(randomMeal.idMeal)}
                    onToggleFav={() => toggleFav(mealToPreview(randomMeal), randomMeal.strTags ? randomMeal.strTags.split(',').map(t => t.trim()) : [])}
                    onAddToPlan={() => {
                      const emptyDay = DAYS.find(d => !mealPlan[d])
                      if (emptyDay) setPlanSlot(emptyDay, mealToPreview(randomMeal))
                    }}
                    onAddToShopping={() => addMealToShopping(randomMeal)}
                  />
                </div>
              ) : null}
            </div>
          ) :

          /* === Meal Planner Tab === */
          tab === 'planner' ? (
            <div style={{ padding: 16 }}>
              <h3 style={{
                margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: C.text,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: C.accent }}>📅</span> 每周食谱计划
              </h3>

              <div style={{
                display: 'grid', gap: 10,
              }}>
                {DAYS.map(day => {
                  const planned = mealPlan[day]
                  return (
                    <div key={day} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: C.glass, backdropFilter: 'blur(12px)',
                      border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: '10px 14px', transition: 'border-color 0.2s',
                      borderColor: planPickerDay === day ? C.accent + '60' : C.border,
                    }}>
                      <span style={{
                        width: 40, fontSize: 13, fontWeight: 600,
                        color: C.accent, flexShrink: 0,
                      }}>
                        {DAY_LABELS[day]}
                      </span>

                      {planned ? (
                        <div style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                          cursor: 'pointer',
                        }} onClick={() => fetchMealDetail(planned.idMeal)}>
                          <img
                            src={planned.strMealThumb}
                            alt={planned.strMeal}
                            style={{
                              width: 40, height: 40, objectFit: 'cover',
                              borderRadius: 8,
                            }}
                          />
                          <span style={{ fontSize: 13, color: C.text }}>
                            {planned.strMeal}
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          flex: 1, fontSize: 13, color: C.textMuted,
                          fontStyle: 'italic',
                        }}>
                          未安排
                        </div>
                      )}

                      <button
                        onClick={() => setPlanPickerDay(planPickerDay === day ? null : day)}
                        style={{
                          padding: '4px 10px', background: `${C.accent}20`,
                          border: 'none', borderRadius: 6, color: C.accent,
                          cursor: 'pointer', fontSize: 11,
                        }}
                      >
                        {planned ? '换' : '选'}
                      </button>
                      {planned && (
                        <button
                          onClick={() => setPlanSlot(day, null)}
                          style={{
                            padding: '4px 8px', background: `${C.danger}20`,
                            border: 'none', borderRadius: 6, color: C.danger,
                            cursor: 'pointer', fontSize: 11,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Plan picker panel */}
              {planPickerDay && (
                <div style={{
                  marginTop: 16, padding: 16,
                  background: C.glass, backdropFilter: 'blur(12px)',
                  border: `1px solid ${C.accent}40`, borderRadius: 14,
                  animation: ANIM.slideUp,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>
                      为 {DAY_LABELS[planPickerDay]} 选择食谱
                    </span>
                    <button onClick={() => setPlanPickerDay(null)} style={{
                      background: 'none', border: 'none', color: C.textMuted,
                      cursor: 'pointer', fontSize: 16,
                    }}>✕</button>
                  </div>

                  {/* Quick pick from favorites */}
                  {favorites.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                        从收藏中选择：
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 8,
                      }}>
                        {favorites.map(f => (
                          <div
                            key={f.idMeal}
                            onClick={() => setPlanSlot(planPickerDay, {
                              idMeal: f.idMeal, strMeal: f.strMeal, strMealThumb: f.strMealThumb,
                            })}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', background: C.glassHover,
                              border: `1px solid ${C.border}`, borderRadius: 8,
                              cursor: 'pointer', transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + '60' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
                          >
                            <img src={f.strMealThumb} alt={f.strMeal} style={{
                              width: 30, height: 30, objectFit: 'cover', borderRadius: 6,
                            }} />
                            <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.strMeal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search for a recipe */}
                  <div style={{ marginTop: favorites.length > 0 ? 12 : 0 }}>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                      或搜索食谱：
                    </div>
                    <form onSubmit={e => {
                      e.preventDefault()
                      if (query.trim()) searchByName(query)
                    }} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="输入菜名搜索..."
                        style={{
                          flex: 1, padding: '8px 12px', background: C.bg,
                          border: `1px solid ${C.border}`, borderRadius: 8,
                          color: C.text, fontSize: 12, outline: 'none',
                        }}
                      />
                      <button type="submit" style={{
                        padding: '8px 14px', background: `${C.accent}30`,
                        border: 'none', borderRadius: 8, color: C.accent,
                        cursor: 'pointer', fontSize: 12,
                      }}>
                        搜索
                      </button>
                    </form>

                    {/* Search results for picker */}
                    {searchResults.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 8, marginTop: 10,
                      }}>
                        {searchResults.slice(0, 6).map(m => (
                          <div
                            key={m.idMeal}
                            onClick={() => setPlanSlot(planPickerDay, m)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', background: C.glassHover,
                              border: `1px solid ${C.border}`, borderRadius: 8,
                              cursor: 'pointer', transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.food + '60' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
                          >
                            <img src={m.strMealThumb} alt={m.strMeal} style={{
                              width: 30, height: 30, objectFit: 'cover', borderRadius: 6,
                            }} />
                            <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.strMeal}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add all planned to shopping */}
              <button
                onClick={() => {
                  const plannedMeals = DAYS.map(d => mealPlan[d]).filter(Boolean) as MealPreview[]
                  if (plannedMeals.length === 0) return
                  // Fetch all details then add ingredients
                  Promise.all(
                    plannedMeals.map(m =>
                      fetchJSON<{ meals: Meal[] | null }>(`${API}/lookup.php?i=${m.idMeal}`)
                        .then(data => data.meals ? data.meals[0] : null)
                        .catch(() => null)
                    )
                  ).then(meals => {
                    meals.forEach(m => { if (m) addMealToShopping(m) })
                    setTab('shopping')
                  }).catch(() => {
                    setTab('shopping')
                  })
                }}
                style={{
                  marginTop: 16, padding: '10px 20px', width: '100%',
                  background: `linear-gradient(135deg, ${C.food}30, ${C.accent}30)`,
                  border: `1px solid ${C.food}40`, borderRadius: 10,
                  color: C.food, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                🛒 将本周计划生成购物清单
              </button>
            </div>
          ) :

          /* === Shopping List Tab === */
          tab === 'shopping' ? (
            <div style={{ padding: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <h3 style={{
                  margin: 0, fontSize: 16, fontWeight: 600, color: C.text,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: C.food }}>🛒</span> 购物清单
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
                    ({shoppingList.filter(i => i.checked).length}/{shoppingList.length})
                  </span>
                </h3>
                {shoppingList.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={clearChecked} style={{
                      padding: '5px 12px', background: `${C.accent}20`,
                      border: 'none', borderRadius: 6, color: C.accent,
                      cursor: 'pointer', fontSize: 11,
                    }}>
                      清除已选
                    </button>
                    <button onClick={() => setShoppingList([])} style={{
                      padding: '5px 12px', background: `${C.danger}20`,
                      border: 'none', borderRadius: 6, color: C.danger,
                      cursor: 'pointer', fontSize: 11,
                    }}>
                      全部清空
                    </button>
                  </div>
                )}
              </div>

              {/* Add item manually */}
              <form onSubmit={e => {
                e.preventDefault()
                const input = e.currentTarget.querySelector('input')!
                const val = input.value.trim()
                if (!val) return
                setShoppingList(prev => [...prev, { text: val, checked: false }])
                input.value = ''
              }} style={{
                display: 'flex', gap: 8, marginBottom: 16,
              }}>
                <input
                  type="text"
                  placeholder="手动添加食材..."
                  style={{
                    flex: 1, padding: '8px 12px', background: C.glass,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.text, fontSize: 13, outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  padding: '8px 14px', background: `${C.food}30`,
                  border: `1px solid ${C.food}40`, borderRadius: 8,
                  color: C.food, cursor: 'pointer', fontSize: 12,
                }}>
                  添加
                </button>
              </form>

              {shoppingList.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 48, color: C.textMuted,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontSize: 14 }}>购物清单为空</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    在食谱详情中点击"生成购物清单"添加食材
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {shoppingList.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px',
                        background: item.checked ? `${C.success}08` : C.glass,
                        border: `1px solid ${item.checked ? `${C.success}30` : C.border}`,
                        borderRadius: 10, transition: 'all 0.2s',
                        animation: `${ANIM.slideUp}`,
                        animationDelay: `${Math.min(i * 20, 300)}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <button
                        onClick={() => toggleShopItem(i)}
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: item.checked ? 'none' : `2px solid ${C.border}`,
                          background: item.checked ? C.success : 'transparent',
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >
                        {item.checked && '✓'}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 13,
                        color: item.checked ? C.textMuted : C.text,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => removeShopItem(i)}
                        style={{
                          background: 'none', border: 'none',
                          color: C.textMuted, cursor: 'pointer', fontSize: 14,
                          opacity: 0.5, transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.danger }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = C.textMuted }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) :

          /* === Favorites Tab === */
          tab === 'favorites' ? (
            <div style={{ padding: 16 }}>
              <h3 style={{
                margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: C.text,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: C.danger }}>❤️</span> 我的收藏
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>
                  ({favorites.length})
                </span>
              </h3>

              {favorites.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 48, color: C.textMuted,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                  <div style={{ fontSize: 14 }}>还没有收藏的食谱</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    搜索或发现食谱后，点击 ♡ 添加收藏
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {favorites.map((fav, i) => (
                    <div key={fav.idMeal} style={{
                      display: 'flex', gap: 12,
                      background: C.glass, backdropFilter: 'blur(12px)',
                      border: `1px solid ${C.border}`, borderRadius: 14,
                      padding: 14, transition: 'border-color 0.2s',
                      animation: `${ANIM.slideUp}`,
                      animationDelay: `${Math.min(i * 50, 400)}ms`,
                      animationFillMode: 'backwards',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + '40' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
                    >
                      <img
                        src={fav.strMealThumb}
                        alt={fav.strMeal}
                        onClick={() => fetchMealDetail(fav.idMeal)}
                        style={{
                          width: 60, height: 60, objectFit: 'cover',
                          borderRadius: 10, cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          onClick={() => fetchMealDetail(fav.idMeal)}
                          style={{
                            fontSize: 14, fontWeight: 600, color: C.text,
                            cursor: 'pointer', marginBottom: 4,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fav.strMeal}
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {fav.tags.map(tag => (
                            <span key={tag} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              background: `${C.accent}15`, color: C.accent,
                              padding: '2px 8px', borderRadius: 10, fontSize: 11,
                            }}>
                              {tag}
                              <button
                                onClick={() => removeFavTag(fav.idMeal, tag)}
                                style={{
                                  background: 'none', border: 'none',
                                  color: C.accent, cursor: 'pointer',
                                  fontSize: 10, padding: 0, lineHeight: 1,
                                }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add tag input */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="text"
                            value={favTagInput[fav.idMeal] || ''}
                            onChange={e => setFavTagInput(prev => ({ ...prev, [fav.idMeal]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addFavTag(fav.idMeal, favTagInput[fav.idMeal] || '')
                              }
                            }}
                            placeholder="添加标签..."
                            style={{
                              padding: '3px 8px', background: C.bg,
                              border: `1px solid ${C.border}`, borderRadius: 6,
                              color: C.text, fontSize: 11, outline: 'none',
                              width: 90,
                            }}
                          />
                          <button
                            onClick={() => addFavTag(fav.idMeal, favTagInput[fav.idMeal] || '')}
                            style={{
                              padding: '3px 8px', background: `${C.accent}20`,
                              border: 'none', borderRadius: 6,
                              color: C.accent, cursor: 'pointer', fontSize: 11,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFav(fav)}
                        style={{
                          alignSelf: 'flex-start',
                          background: `${C.danger}15`, border: 'none',
                          borderRadius: 8, padding: '6px 10px',
                          color: C.danger, cursor: 'pointer', fontSize: 12,
                        }}
                      >
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  )
})
