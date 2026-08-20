import { useEffect, useMemo, useState } from 'react'

/* ============================================================
 * RecipeForge · 智能菜谱探索
 * 基于 TheMealDB 公开免费 API (https://www.themealdb.com/api.php)
 * ——免注册、免 Key、CORS 友好。
 *
 * 功能：
 *  1. 按名称搜索菜谱 / 按首字母浏览
 *  2. 按食材搜索 (有哪些食材做什么菜)
 *  3. 分类浏览 + 地区浏览 + 随机推荐
 *  4. 菜谱详情：食材清单、用量、步骤视频、标签、地区
 *  5. 我的收藏（localStorage）+ 最近浏览 + 购物清单
 *  6. 7 日菜单计划：每天三餐、可随机生成 / 手动搭配
 * ============================================================ */

type Tab = 'search' | 'categories' | 'areas' | 'random' | 'favorites' | 'planner'

interface MealBrief { idMeal: string; strMeal: string; strMealThumb: string; strCategory?: string; strArea?: string }
interface MealDetail {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags?: string
  strYoutube?: string
  strSource?: string
  [key: `strIngredient${number}`]: string | undefined
  [key: `strMeasure${number}`]: string | undefined
}
interface Category { idCategory: string; strCategory: string; strCategoryThumb: string; strCategoryDescription: string }
interface Area { strArea: string }

interface PlanMeal { idMeal: string; name: string; thumb: string }
interface DayPlan { breakfast?: PlanMeal; lunch?: PlanMeal; dinner?: PlanMeal }
type Plan = [DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan] // 7 days

const FAV_KEY = 'recipeforge:favs:v1'
const HIST_KEY = 'recipeforge:history:v1'
const CART_KEY = 'recipeforge:cart:v1'
const PLAN_KEY = 'recipeforge:plan:v1'
const CACHE_MS = 6 * 3600 * 1000 // 6h

function load<T>(k: string, fb: T): T {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb } catch { return fb }
}
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

/* small LRU-style cache in memory to avoid duplicate fetches */
const memCache: Record<string, { t: number; v: unknown }> = {}
async function cachedFetch<T>(url: string): Promise<T> {
  const cached = memCache[url]
  if (cached && Date.now() - cached.t < CACHE_MS) return cached.v as T
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = (await resp.json()) as T
  memCache[url] = { t: Date.now(), v: json }
  return json
}

export default function RecipeForge() {
  const [tab, setTab] = useState<Tab>('search')

  // === Search ===
  const [query, setQuery] = useState('')
  const [ingredientMode, setIngredientMode] = useState(false)
  const [searchResults, setSearchResults] = useState<MealBrief[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [letter, setLetter] = useState<string>('')

  // === Categories ===
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [catLoading, setCatLoading] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string>('')
  const [catMeals, setCatMeals] = useState<MealBrief[] | null>(null)

  // === Areas ===
  const [areas, setAreas] = useState<Area[] | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [areaMeals, setAreaMeals] = useState<MealBrief[] | null>(null)

  // === Random ===
  const [randomMeal, setRandomMeal] = useState<MealDetail | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)

  // === Detail ===
  const [detail, setDetail] = useState<MealDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // === Favorites ===
  const [favs, setFavs] = useState<string[]>(() => load(FAV_KEY, []))
  const [history, setHistory] = useState<string[]>(() => load(HIST_KEY, []))
  const [cart, setCart] = useState<Record<string, string>>(() => load(CART_KEY, {})) // ingredient -> measure / note
  const [plan, setPlan] = useState<Plan>(() => {
    const raw = load<Plan | null>(PLAN_KEY, null)
    return raw ?? [{}, {}, {}, {}, {}, {}, {}]
  })

  useEffect(() => { save(FAV_KEY, favs) }, [favs])
  useEffect(() => { save(HIST_KEY, history.slice(0, 50)) }, [history])
  useEffect(() => { save(CART_KEY, cart) }, [cart])
  useEffect(() => { save(PLAN_KEY, plan) }, [plan])

  // 首屏：加载分类和地区
  useEffect(() => {
    (async () => {
      try {
        setCatLoading(true)
        const c = await cachedFetch<{ categories: Category[] }>('https://www.themealdb.com/api/json/v1/1/categories.php')
        setCategories(c.categories || [])
      } catch { /* noop */ } finally { setCatLoading(false) }
      try {
        const a = await cachedFetch<{ meals: Area[] }>('https://www.themealdb.com/api/json/v1/1/list.php?a=list')
        setAreas(a.meals || [])
      } catch { /* noop */ }
    })()
    pullRandom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ===== Search ===== */
  async function runSearch() {
    setSearchLoading(true); setSearchError(null); setSearchResults(null)
    try {
      let url = ''
      if (query.trim() === '' && letter) {
        url = `https://www.themealdb.com/api/json/v1/1/search.php?f=${encodeURIComponent(letter)}`
      } else if (ingredientMode) {
        const ing = query.trim().split(/[,，、\s]+/).filter(Boolean).join(',')
        // first by multi-ingredient filter
        url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ing)}`
      } else {
        url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
      }
      const res = await cachedFetch<{ meals: MealBrief[] | null }>(url)
      setSearchResults(res.meals ?? [])
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '搜索失败')
    } finally { setSearchLoading(false) }
  }

  /* ===== Category filter ===== */
  async function filterCategory(cat: string) {
    setSelectedCat(cat); setCatMeals(null)
    if (!cat) return
    try {
      const res = await cachedFetch<{ meals: MealBrief[] | null }>(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`)
      setCatMeals(res.meals ?? [])
    } catch { setCatMeals([]) }
  }

  /* ===== Area filter ===== */
  async function filterArea(a: string) {
    setSelectedArea(a); setAreaMeals(null)
    if (!a) return
    try {
      const res = await cachedFetch<{ meals: MealBrief[] | null }>(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(a)}`)
      setAreaMeals(res.meals ?? [])
    } catch { setAreaMeals([]) }
  }

  /* ===== Random ===== */
  async function pullRandom() {
    setRandomLoading(true)
    try {
      const res = await cachedFetch<{ meals: MealDetail[] }>('https://www.themealdb.com/api/json/v1/1/random.php')
      if (res.meals?.[0]) setRandomMeal(res.meals[0])
    } catch { /* noop */ } finally { setRandomLoading(false) }
  }

  /* ===== Detail ===== */
  async function openDetail(id: string, fromTab?: Tab) {
    setDetailLoading(true); setDetail(null)
    // 记录浏览历史
    setHistory(prev => [id, ...prev.filter(x => x !== id)].slice(0, 50))
    if (fromTab) void fromTab
    try {
      const res = await cachedFetch<{ meals: MealDetail[] }>(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`)
      if (res.meals?.[0]) setDetail(res.meals[0])
    } catch { /* noop */ } finally { setDetailLoading(false) }
  }

  /* ===== Ingredient extraction helper ===== */
  function extractIngredients(m: MealDetail): Array<{ i: string; m: string }> {
    const list: Array<{ i: string; m: string }> = []
    for (let n = 1; n <= 20; n++) {
      const i = m[`strIngredient${n}`]?.trim()
      const ms = m[`strMeasure${n}`]?.trim()
      if (i) list.push({ i, m: ms || '' })
    }
    return list
  }

  /* ===== Favorite toggle ===== */
  function toggleFav(id: string) {
    setFavs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev])
  }

  /* ===== Shopping cart ===== */
  function addIngredientsToCart(meal: MealDetail) {
    setCart(prev => {
      const next = { ...prev }
      for (const { i, m } of extractIngredients(meal)) {
        if (!next[i]) next[i] = m
        else if (next[i] && !next[i].includes(m)) next[i] = `${next[i]} + ${m}`
      }
      return next
    })
  }
  function removeFromCart(ing: string) {
    setCart(prev => { const n = { ...prev }; delete n[ing]; return n })
  }

  /* ===== Planner ===== */
  function planSet(day: number, slot: keyof DayPlan, meal?: PlanMeal) {
    setPlan(prev => {
      const next = [...prev] as Plan
      next[day] = { ...next[day], [slot]: meal }
      return next
    })
  }
  async function planRandomize() {
    // 一次性随机 7 天 × 3 餐
    const next: Plan = [{}, {}, {}, {}, {}, {}, {}]
    for (let d = 0; d < 7; d++) {
      for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
        try {
          const res = await cachedFetch<{ meals: MealDetail[] }>('https://www.themealdb.com/api/json/v1/1/random.php')
          const m = res.meals?.[0]
          if (m) next[d][slot] = { idMeal: m.idMeal, name: m.strMeal, thumb: m.strMealThumb }
        } catch { /* noop */ }
      }
    }
    setPlan(next)
  }
  function planExportShopping() {
    // 汇总 7 天计划所有菜的食材，并打开详情（如果当前未打开，则先弹出提示）
    const ids = new Set<string>()
    plan.forEach(d => {
      [d.breakfast, d.lunch, d.dinner].forEach(m => { if (m?.idMeal) ids.add(m.idMeal) })
    })
    if (ids.size === 0) { alert('菜单计划是空的，先添加几道菜吧！'); return }
    const promises: Promise<void>[] = []
    const collected: Record<string, string> = { ...cart }
    Array.from(ids).forEach(id => {
      promises.push(
        cachedFetch<{ meals: MealDetail[] }>(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`)
          .then(res => {
            const m = res.meals?.[0]; if (!m) return
            for (const { i, m: ms } of extractIngredients(m)) {
              if (!collected[i]) collected[i] = ms
              else if (!collected[i].includes(ms)) collected[i] = `${collected[i]} + ${ms}`
            }
          })
          .catch(() => { /* ignore */ })
      )
    })
    Promise.all(promises).then(() => { setCart(collected); setTab('favorites') })
  }

  /* ===== Favorites full info ===== */
  const favDetails = useMemo(() => {
    // 从 memCache 中读取曾经加载过的；未加载的用 null 占位，点击再查
    return favs.map(id => {
      const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
      const cached = memCache[url]
      const meals = cached?.v as { meals: MealDetail[] } | undefined
      const m = meals?.meals?.[0]
      return m ? {
        idMeal: m.idMeal, strMeal: m.strMeal, strMealThumb: m.strMealThumb,
        strCategory: m.strCategory, strArea: m.strArea,
      } : null
    })
  }, [favs])

  /* ================== RENDER ================== */
  return (
    <div style={st.wrap}>
      <header style={st.header}>
        <div style={st.brand}>
          <div style={st.brandMark}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v7a3 3 0 0 0 6 0V2M6 9h6M15 2c1 0 2 1 2 3s-1 2.5-1 2.5l-1 .5V15M10 22V15h4v7"/>
            </svg>
          </div>
          <div>
            <div style={st.brandTitle}>RecipeForge</div>
            <div style={st.brandSub}>智能菜谱探索 · TheMealDB 公开数据</div>
          </div>
        </div>
        <nav style={st.tabs}>
          {([
            ['search', '🔍 搜索'],
            ['categories', '🍱 分类'],
            ['areas', '🌍 地区'],
            ['random', '🎲 随机'],
            ['favorites', `⭐ 收藏(${favs.length})/购物`],
            ['planner', '📅 菜单计划'],
          ] as Array<[Tab, string]>).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setDetail(null) }}
              style={{ ...st.tab, ...(tab === k ? st.tabActive : {}) }}>{l}</button>
          ))}
        </nav>
      </header>

      <main style={st.body}>
        {/* =============== DETAIL OVERLAY =============== */}
        {detail && (
          <div style={st.detailOverlay}>
            <div style={st.detailBox}>
              <div style={st.detailHead}>
                <button style={st.closeBtn} onClick={() => setDetail(null)}>← 返回</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={st.btnGhostSmall} onClick={() => toggleFav(detail.idMeal)}>
                    {favs.includes(detail.idMeal) ? '⭐ 已收藏' : '☆ 收藏'}
                  </button>
                  <button style={st.btnGhostSmall} onClick={() => addIngredientsToCart(detail)}>🛒 加入购物清单</button>
                </div>
              </div>
              {detailLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>加载中…</div>
              ) : (
                <div style={st.detailBody}>
                  <div style={st.detailHero}>
                    <img src={detail.strMealThumb} alt={detail.strMeal} style={st.detailImg}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 260 }}>
                      <h1 style={st.detailTitle}>{detail.strMeal}</h1>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={st.tagPrimary}>🥘 {detail.strCategory}</span>
                        <span style={st.tagSecondary}>📍 {detail.strArea}</span>
                        {detail.strTags?.split(',').filter(Boolean).map(t => (
                          <span key={t} style={st.tagTertiary}>#{t.trim()}</span>
                        ))}
                      </div>
                      {detail.strYoutube && (
                        <a href={detail.strYoutube} target="_blank" rel="noreferrer" style={st.linkBtn}>
                          ▶️ 在 YouTube 查看做法视频
                        </a>
                      )}
                      {detail.strSource && (
                        <a href={detail.strSource} target="_blank" rel="noreferrer" style={st.linkBtnGhost}>
                          📖 查看原食谱来源
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginTop: 20 }}>
                    <section>
                      <h3 style={st.h3}>🥬 食材 ({extractIngredients(detail).length})</h3>
                      <ul style={st.ingList}>
                        {extractIngredients(detail).map(({ i, m }, idx) => (
                          <li key={idx} style={st.ingItem}>
                            <span style={{ fontWeight: 600 }}>{i}</span>
                            {m && <span style={{ color: 'var(--text-dim)' }}> · {m}</span>}
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3 style={st.h3}>👨‍🍳 制作步骤</h3>
                      <div style={st.instructions}>
                        {detail.strInstructions
                          .split(/\r?\n+/)
                          .map(line => line.trim())
                          .filter(Boolean)
                          .map((step, i) => (
                            <p key={i} style={st.stepP}>
                              <span style={st.stepNum}>{i + 1}</span> {step}
                            </p>
                          ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============== SEARCH =============== */}
        {tab === 'search' && !detail && (
          <div>
            <div style={st.searchBar}>
              <input
                style={st.searchInput}
                placeholder={ingredientMode ? '输入食材名，多个用逗号/空格分隔（例：chicken, onion, garlic）' : '搜索菜名（例：pasta、宫保、chicken）'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
              />
              <label style={st.check}>
                <input type="checkbox" checked={ingredientMode} onChange={e => setIngredientMode(e.target.checked)} />
                <span>按食材搜索</span>
              </label>
              <button style={st.btnPrimary} onClick={runSearch} disabled={searchLoading}>
                {searchLoading ? '搜索中…' : '搜索'}
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 12, alignSelf: 'center' }}>按首字母：</span>
              {['','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(l => (
                <button key={l || 'empty'} onClick={() => { setLetter(l); if (l) runSearch(); else setSearchResults(null) }}
                  style={{ ...st.chip, ...(letter === l ? { background: 'var(--accent)', color: '#fff' } : {}) }}>
                  {l || '✕'}
                </button>
              ))}
            </div>

            {searchError && <div style={st.errorBox}>{searchError}</div>}

            <div style={{ marginTop: 16 }}>
              {searchLoading && <MealGridSkeleton count={8} />}
              {!searchLoading && searchResults === null && (
                <div style={st.emptyBox}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
                  <div>尝试：搜索 "chicken"，或勾选「按食材搜索」输入 "beef,onion"，或点上方字母 A。</div>
                </div>
              )}
              {!searchLoading && searchResults !== null && searchResults.length === 0 && (
                <div style={st.emptyBox}>没有找到匹配的菜谱，换个关键词试试。</div>
              )}
              {!searchLoading && searchResults && searchResults.length > 0 && (
                <MealGrid meals={searchResults} onOpen={id => openDetail(id, 'search')} favs={favs} onFav={toggleFav} />
              )}
            </div>
          </div>
        )}

        {/* =============== CATEGORIES =============== */}
        {tab === 'categories' && !detail && (
          <div>
            <h3 style={st.h3}>🍱 菜系分类</h3>
            {catLoading && <div style={st.emptyBox}>加载中…</div>}
            {!catLoading && categories && (
              <div style={st.catGrid}>
                {categories.map(c => (
                  <button key={c.idCategory} onClick={() => filterCategory(selectedCat === c.strCategory ? '' : c.strCategory)}
                    style={{ ...st.catCard, ...(selectedCat === c.strCategory ? st.catCardActive : {}) }}>
                    <img src={c.strCategoryThumb} alt={c.strCategory} style={st.catImg}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }} />
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.strCategory}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.strCategoryDescription}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedCat && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ ...st.h3, margin: 0 }}>「{selectedCat}」的菜谱 ({catMeals?.length ?? 0})</h3>
                </div>
                {catMeals === null ? <MealGridSkeleton count={6} /> :
                  catMeals.length === 0 ? <div style={st.emptyBox}>暂无</div> :
                  <MealGrid meals={catMeals} onOpen={id => openDetail(id, 'categories')} favs={favs} onFav={toggleFav} />}
              </div>
            )}
          </div>
        )}

        {/* =============== AREAS =============== */}
        {tab === 'areas' && !detail && (
          <div>
            <h3 style={st.h3}>🌍 按地区浏览</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {areas?.map(a => (
                <button key={a.strArea} onClick={() => filterArea(selectedArea === a.strArea ? '' : a.strArea)}
                  style={{ ...st.chip, ...(selectedArea === a.strArea ? { background: 'var(--accent)', color: '#fff' } : {}) }}>
                  {a.strArea}
                </button>
              ))}
            </div>
            {selectedArea && (
              <div style={{ marginTop: 20 }}>
                <h3 style={st.h3}>「{selectedArea}」地区菜 ({areaMeals?.length ?? 0})</h3>
                {areaMeals === null ? <MealGridSkeleton count={6} /> :
                  areaMeals.length === 0 ? <div style={st.emptyBox}>暂无</div> :
                  <MealGrid meals={areaMeals} onOpen={id => openDetail(id, 'areas')} favs={favs} onFav={toggleFav} />}
              </div>
            )}
          </div>
        )}

        {/* =============== RANDOM =============== */}
        {tab === 'random' && !detail && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ ...st.h3, margin: 0 }}>🎲 今日推荐</h3>
              <button style={st.btnPrimary} onClick={pullRandom} disabled={randomLoading}>
                {randomLoading ? '抽取中…' : '🎲 换一个'}
              </button>
            </div>
            {randomLoading && <MealGridSkeleton count={1} big />}
            {!randomLoading && randomMeal && (
              <div style={st.randomCard}>
                <div style={{ position: 'relative', minHeight: 360, borderRadius: 20, overflow: 'hidden' }}>
                  <img src={randomMeal.strMealThumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  <div style={{ position: 'absolute', inset: 0, padding: 30, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
                      🥘 {randomMeal.strCategory} · 📍 {randomMeal.strArea}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>{randomMeal.strMeal}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button style={st.btnLight} onClick={() => openDetail(randomMeal.idMeal, 'random')}>查看详情 →</button>
                      <button style={st.btnLightGhost} onClick={() => toggleFav(randomMeal.idMeal)}>
                        {favs.includes(randomMeal.idMeal) ? '⭐ 已收藏' : '☆ 收藏'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============== FAVORITES + CART =============== */}
        {tab === 'favorites' && !detail && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...st.h3, margin: 0 }}>⭐ 我的收藏 ({favs.length})</h3>
                {favs.length > 0 && <button style={st.btnGhostSmall} onClick={() => { if (confirm('清空全部收藏？')) setFavs([]) }}>清空</button>}
              </div>
              {favs.length === 0 ? <div style={st.emptyBox}>暂无收藏，浏览菜谱时点击 ⭐ 加入收藏。</div> : (
                <div style={st.mealGrid}>
                  {favDetails.map((m, i) => {
                    const id = favs[i]
                    if (m) return <MealCard key={id} meal={m} onOpen={() => openDetail(id, 'favorites')} isFav onFav={() => toggleFav(id)} />
                    // 占位 + 懒加载
                    return (
                      <div key={id} style={st.mealCard} onClick={() => openDetail(id, 'favorites')}>
                        <div style={{ ...st.mealImg, background: 'linear-gradient(135deg,#fcd34d,#f97316)' }}>
                          <span style={{ color: '#fff', fontSize: 12 }}>点击加载</span>
                        </div>
                        <div style={st.mealTitle}>菜 #{id}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {history.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ ...st.h3, margin: 0 }}>🕓 最近浏览</h3>
                    <button style={st.btnGhostSmall} onClick={() => setHistory([])}>清空</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {history.slice(0, 15).map(id => (
                      <button key={id} style={st.chip} onClick={() => openDetail(id, 'favorites')}>#{id.slice(-4)}</button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ ...st.h3, margin: 0 }}>🛒 购物清单 ({Object.keys(cart).length})</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={st.btnGhostSmall} onClick={() => {
                    const txt = Object.entries(cart).map(([i, m]) => `- ${i}${m ? ` (${m})` : ''}`).join('\n')
                    if (txt) navigator.clipboard?.writeText(txt)
                    else alert('购物清单是空的')
                  }}>复制文本</button>
                  <button style={st.btnGhostSmall} onClick={() => { if (confirm('清空购物清单？')) setCart({}) }}>清空</button>
                </div>
              </div>
              {Object.keys(cart).length === 0 ? (
                <div style={st.emptyBox}>
                  打开菜谱详情后，点击「🛒 加入购物清单」即可汇总所有食材。
                </div>
              ) : (
                <ul style={st.cartList}>
                  {Object.entries(cart).map(([ing, ms]) => (
                    <li key={ing} style={st.cartItem}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>▢</span>
                        <span style={{ fontWeight: 600 }}>{ing}</span>
                        {ms && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>· {ms}</span>}
                      </div>
                      <button style={st.iconBtn} onClick={() => removeFromCart(ing)} title="移除">🗑</button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}

        {/* =============== PLANNER =============== */}
        {tab === 'planner' && !detail && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ ...st.h3, margin: 0 }}>📅 七日菜单计划</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={st.btnGhost} onClick={planRandomize}>🎲 随机生成</button>
                <button style={st.btnPrimary} onClick={planExportShopping}>🛒 导出到购物清单</button>
                <button style={st.btnGhost} onClick={() => { if (confirm('清空整周菜单？')) setPlan([{}, {}, {}, {}, {}, {}, {}]) }}>清空</button>
              </div>
            </div>
            <div style={st.planGrid}>
              {DAY_NAMES.map((name, d) => (
                <div key={d} style={st.planDay}>
                  <div style={st.planDayHead}>{name}</div>
                  {(['breakfast', 'lunch', 'dinner'] as const).map(slot => (
                    <div key={slot} style={st.planSlot}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {slot === 'breakfast' ? '🌅 早餐' : slot === 'lunch' ? '☀️ 午餐' : '🌙 晚餐'}
                      </div>
                      {plan[d][slot] ? (
                        <div style={st.planMealCard} onClick={() => openDetail(plan[d][slot]!.idMeal, 'planner')}>
                          <img src={plan[d][slot]!.thumb} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{plan[d][slot]!.name}</div>
                          <button onClick={e => { e.stopPropagation(); planSet(d, slot, undefined) }} style={st.iconBtn}>✕</button>
                        </div>
                      ) : (
                        <button style={st.planEmpty} onClick={async () => {
                          try {
                            const res = await cachedFetch<{ meals: MealDetail[] }>('https://www.themealdb.com/api/json/v1/1/random.php')
                            const m = res.meals?.[0]
                            if (m) planSet(d, slot, { idMeal: m.idMeal, name: m.strMeal, thumb: m.strMealThumb })
                          } catch { /* noop */ }
                        }}>＋ 随机添加</button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={st.footer}>
        <span>Powered by TheMealDB · 数据仅用于学习与演示</span>
        <span>收藏/历史/菜单/购物清单均保存在本地</span>
      </footer>
    </div>
  )
}

/* ================= Sub Components ================= */

function MealGrid({ meals, onOpen, favs, onFav }: {
  meals: MealBrief[]; onOpen: (id: string) => void; favs: string[]; onFav: (id: string) => void
}) {
  return (
    <div style={st.mealGrid}>
      {meals.map(m => (
        <MealCard key={m.idMeal} meal={m} onOpen={() => onOpen(m.idMeal)}
          isFav={favs.includes(m.idMeal)} onFav={() => onFav(m.idMeal)} />
      ))}
    </div>
  )
}

function MealCard({ meal, onOpen, isFav, onFav }: {
  meal: MealBrief; onOpen: () => void; isFav: boolean; onFav: () => void
}) {
  return (
    <div style={st.mealCard} onClick={onOpen}>
      <div style={st.mealImg}>
        <img src={meal.strMealThumb} alt={meal.strMeal} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        <button
          onClick={e => { e.stopPropagation(); onFav() }}
          style={{ ...st.favBtn, color: isFav ? '#f59e0b' : '#fff' }}
          title={isFav ? '取消收藏' : '收藏'}
        >{isFav ? '★' : '☆'}</button>
        {(meal.strCategory || meal.strArea) && (
          <div style={st.mealCatBadge}>
            {meal.strCategory && <span>🥘{meal.strCategory}</span>}
            {meal.strArea && <span>📍{meal.strArea}</span>}
          </div>
        )}
      </div>
      <div style={st.mealTitle}>{meal.strMeal}</div>
    </div>
  )
}

function MealGridSkeleton({ count = 6, big = false }: { count?: number; big?: boolean }) {
  return (
    <div style={{ ...st.mealGrid, ...(big ? { gridTemplateColumns: '1fr' } : {}) }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={st.mealCard}>
          <div style={{ ...st.mealImg, background: 'linear-gradient(90deg, rgba(127,127,127,0.1), rgba(127,127,127,0.2), rgba(127,127,127,0.1))' }} />
          <div style={{ ...st.sk, width: '70%', height: 14, marginTop: 10 }} />
          <div style={{ ...st.sk, width: '50%', height: 12, marginTop: 6 }} />
        </div>
      ))}
    </div>
  )
}

/* ================= STYLES ================= */
const st: Record<string, React.CSSProperties> = {
  wrap: {
    height: '100%', width: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, "Noto Sans SC", "PingFang SC", sans-serif',
    background: 'linear-gradient(180deg, #fff7ed 0%, color-mix(in srgb, var(--panel) 80%, transparent) 100%)',
    color: 'var(--text, #1f2937)',
  },
  header: {
    padding: '14px 22px', borderBottom: '1px solid var(--border, rgba(127,127,127,0.15))',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    background: 'color-mix(in srgb, var(--panel) 90%, rgba(255,247,237,0.6))',
    backdropFilter: 'blur(6px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg,#f97316 0%, #ef4444 100%)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 22px -10px rgba(239,68,68,0.6)',
  },
  brandTitle: { fontWeight: 800, fontSize: 20 },
  brandSub: { fontSize: 12, color: 'var(--text-dim, #666)' },
  tabs: { display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'rgba(127,127,127,0.06)', overflowX: 'auto' },
  tab: {
    padding: '8px 14px', borderRadius: 10, border: 0, cursor: 'pointer',
    background: 'transparent', color: 'var(--text-dim, #555)',
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit',
  },
  tabActive: { background: 'var(--panel, #fff)', color: 'var(--text, #1f2937)', boxShadow: '0 3px 10px -6px rgba(0,0,0,0.15)' },

  body: { flex: 1, overflow: 'auto', padding: '22px 26px', position: 'relative' },

  searchBar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 280, padding: '12px 16px', borderRadius: 14,
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
    background: 'var(--panel, rgba(255,255,255,0.8))',
    color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'inherit',
  },
  check: { display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--text-dim)' },
  btnPrimary: {
    padding: '10px 18px', borderRadius: 12, border: 0, cursor: 'pointer', fontWeight: 700,
    background: 'linear-gradient(135deg,#f97316 0%,#ef4444 100%)', color: '#fff',
    fontFamily: 'inherit', fontSize: 14, boxShadow: '0 8px 22px -10px rgba(239,68,68,0.6)',
  },
  btnGhost: {
    padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel, rgba(255,255,255,0.6))', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
  },
  btnGhostSmall: {
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.06))', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  },
  btnLight: {
    padding: '10px 16px', borderRadius: 999, border: 0, cursor: 'pointer',
    background: '#fff', color: '#111', fontWeight: 700,
    boxShadow: '0 10px 30px -12px rgba(0,0,0,0.4)',
  },
  btnLightGhost: {
    padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, backdropFilter: 'blur(4px)',
  },

  chip: {
    padding: '6px 12px', borderRadius: 999, border: 0, cursor: 'pointer',
    background: 'rgba(127,127,127,0.08)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit',
  },

  errorBox: {
    marginTop: 14, padding: 12, borderRadius: 10,
    background: 'rgba(239,68,68,0.08)', color: '#dc2626',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  emptyBox: {
    padding: 40, borderRadius: 16, textAlign: 'center',
    background: 'rgba(127,127,127,0.05)', color: 'var(--text-dim)',
  },

  h3: { fontSize: 17, fontWeight: 700, margin: '0 0 14px 0' },

  mealGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14,
  },
  mealCard: {
    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
    background: 'var(--panel, #fff)',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
    boxShadow: '0 6px 18px -12px rgba(0,0,0,0.15)',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    display: 'flex', flexDirection: 'column',
  },
  mealImg: { position: 'relative', aspectRatio: '4 / 3', background: 'linear-gradient(135deg,#fde68a,#fca5a5)', overflow: 'hidden' },
  mealTitle: { padding: '10px 12px 14px', fontWeight: 600, fontSize: 14, lineHeight: 1.4 },
  mealCatBadge: {
    position: 'absolute', left: 8, top: 8, display: 'flex', flexDirection: 'column', gap: 4,
  },
  favBtn: {
    position: 'absolute', right: 8, top: 8, width: 32, height: 32, border: 0,
    borderRadius: '50%', background: 'rgba(0,0,0,0.35)', cursor: 'pointer',
    fontSize: 16, backdropFilter: 'blur(4px)',
  },

  sk: { height: 12, borderRadius: 6, background: 'linear-gradient(90deg, rgba(127,127,127,0.12) 0%, rgba(127,127,127,0.25) 50%, rgba(127,127,127,0.12) 100%)' },

  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 },
  catCard: {
    borderRadius: 14, border: '1px solid var(--border, rgba(127,127,127,0.12))',
    background: 'var(--panel, #fff)', padding: 12, cursor: 'pointer', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'inherit',
  },
  catCardActive: {
    borderColor: '#f97316', boxShadow: '0 0 0 3px rgba(249,115,22,0.15)',
  },
  catImg: { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10 },

  randomCard: {
    borderRadius: 22, overflow: 'hidden',
    boxShadow: '0 30px 60px -30px rgba(0,0,0,0.3)',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
  },

  /* Detail overlay */
  detailOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
    zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30,
    backdropFilter: 'blur(4px)',
  },
  detailBox: {
    width: '100%', maxWidth: 1040, maxHeight: '100%',
    background: 'var(--panel, #fff)', borderRadius: 22,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
  },
  detailHead: {
    padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid var(--border, rgba(127,127,127,0.15))',
  },
  closeBtn: {
    padding: '6px 12px', borderRadius: 8, border: 0, cursor: 'pointer',
    background: 'rgba(127,127,127,0.1)', fontWeight: 600, fontFamily: 'inherit',
  },
  detailBody: { padding: '18px 26px 26px', overflow: 'auto' },
  detailHero: { display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' },
  detailImg: { width: '100%', maxWidth: 360, aspectRatio: '1/1', objectFit: 'cover', borderRadius: 18, boxShadow: '0 18px 40px -18px rgba(0,0,0,0.3)' },
  detailTitle: { margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.2 },
  tagPrimary: { padding: '4px 10px', borderRadius: 8, background: 'rgba(249,115,22,0.12)', color: '#c2410c', fontSize: 12, fontWeight: 600 },
  tagSecondary: { padding: '4px 10px', borderRadius: 8, background: 'rgba(14,165,233,0.12)', color: '#0369a1', fontSize: 12, fontWeight: 600 },
  tagTertiary: { padding: '3px 8px', borderRadius: 999, background: 'rgba(17,24,39,0.06)', fontSize: 11, color: 'var(--text)' },
  linkBtn: {
    display: 'inline-block', padding: '10px 14px', borderRadius: 10,
    background: 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff',
    textDecoration: 'none', fontWeight: 600, fontSize: 13,
  },
  linkBtnGhost: {
    display: 'inline-block', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border, rgba(127,127,127,0.2))', color: 'var(--text)',
    textDecoration: 'none', fontWeight: 600, fontSize: 13,
  },
  ingList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  ingItem: {
    padding: '10px 12px', borderRadius: 10, fontSize: 14,
    background: 'rgba(127,127,127,0.05)',
    borderLeft: '3px solid #f97316',
  },
  instructions: { display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, lineHeight: 1.75 },
  stepP: { margin: 0 },
  stepNum: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: '50%', marginRight: 8,
    background: 'linear-gradient(135deg,#f97316,#ef4444)', color: '#fff',
    fontSize: 12, fontWeight: 700,
  },

  cartList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  cartItem: {
    padding: '10px 12px', borderRadius: 10,
    background: 'var(--panel, rgba(255,255,255,0.8))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  iconBtn: { background: 'transparent', border: 0, cursor: 'pointer', padding: 4 },

  planGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10,
    overflowX: 'auto',
  },
  planDay: {
    minWidth: 180,
    borderRadius: 14, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
    background: 'var(--panel, rgba(255,255,255,0.6))',
    border: '1px solid var(--border, rgba(127,127,127,0.12))',
  },
  planDayHead: { textAlign: 'center', fontWeight: 700, padding: '4px 0', borderRadius: 8, background: 'rgba(249,115,22,0.12)', color: '#c2410c' },
  planSlot: { display: 'flex', flexDirection: 'column', gap: 6 },
  planMealCard: {
    padding: 6, borderRadius: 10, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(127,127,127,0.05)', border: '1px solid transparent',
  },
  planEmpty: {
    padding: 14, borderRadius: 10, border: '1px dashed rgba(127,127,127,0.3)',
    background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer',
    fontSize: 12, fontFamily: 'inherit',
  },

  footer: {
    padding: '10px 22px', fontSize: 11, color: 'var(--text-dim, #888)',
    display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
    borderTop: '1px solid var(--border, rgba(127,127,127,0.15))',
  },
}
