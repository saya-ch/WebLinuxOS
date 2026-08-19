import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Sparkles, Quote, Heart, Wind, Sun, Cloud, Target, CheckCircle2,
  Plus, Trash2, RefreshCw, Star, Coffee, PartyPopper, Mountain,
  Flower2, Share2, Bookmark, BookOpen, Lightbulb, Smile, CloudRain,
  Flame, Trophy, Calendar, X, Copy, Image as ImageIcon
} from 'lucide-react'

type Tab = 'quote' | 'breathe' | 'goals' | 'gratitude' | 'wins'

interface QuoteData { text: string; author: string }
interface Goal { id: string; text: string; done: boolean; createdAt: string }
interface Gratitude { id: string; text: string; createdAt: string }
interface Win { id: string; text: string; createdAt: string }

const STORAGE_KEY = 'weblinux_motivation_dashboard_v1'

const FALLBACK_QUOTES: QuoteData[] = [
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '黄蘖禅师' },
  { text: '路虽远，行则将至；事虽难，做则必成。', author: '《荀子》' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: '自律给我自由。', author: 'Keep' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '丹比萨·莫约' },
  { text: '念念不忘，必有回响。', author: '李叔同' },
  { text: '合抱之木，生于毫末；九层之台，起于累土。', author: '老子' },
  { text: '昨日种种，皆成今我，切莫思量更莫哀。从今往后，怎么收获怎么栽。', author: '胡适' },
]

const JOKES = [
  '程序员最讨厌的数字是什么？1024，因为它比1000还多24。',
  '一个 SQL 查询走进酒吧，看到两张表，问道：我可以 JOIN 你们吗？',
  '世界上只有 10 种人：懂二进制的和不懂二进制的。',
  '"这是个 feature，不是 bug。"——每个程序员，在某个周五下午',
  'Java 程序员喝咖啡，因为他们不能 C#。',
  '为什么程序员总把万圣节和圣诞节搞混？因为 Oct 31 = Dec 25。',
  '代码就像幽默。当你不得不去解释它的时候，它就不好了。',
  '一个程序员在杂货店门口停下来，因为牌子写着"7天24小时营业"——他想："这不可能，闰年怎么办？"',
  '调试代码就像破案，而你恰好就是凶手。',
]

const BREATH_PATTERNS = [
  { id: '4-7-8',   name: '4-7-8 舒眠',   inhale: 4, hold: 7, exhale: 8, desc: '快速平静、助眠推荐' },
  { id: 'box',     name: 'Box 方形呼吸',  inhale: 4, hold: 4, exhale: 4, hold2: 4, desc: '稳定情绪、提升专注' },
  { id: 'balance', name: '平衡呼吸 5-5', inhale: 5, hold: 0, exhale: 5, desc: '日常放松、缓解压力' },
  { id: 'energy',  name: '提神 4-0-4',   inhale: 4, hold: 0, exhale: 4, desc: '快速醒脑，短暂呼吸' },
] as const

const BACKGROUND_THEMES = [
  { id: 'aurora', name: '极光',  icon: <Sparkles size={14}/>, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' },
  { id: 'sunset', name: '日落',  icon: <Sun size={14}/>,      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffb88c 100%)' },
  { id: 'ocean',  name: '海洋',  icon: <Cloud size={14}/>,    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', name: '森林',  icon: <Mountain size={14}/>, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'night',  name: '星夜',  icon: <Star size={14}/>,     gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'peach',  name: '蜜桃',  icon: <Flower2 size={14}/>,  gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'warm',   name: '暖阳',  icon: <Coffee size={14}/>,   gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'calm',   name: '静谧',  icon: <CloudRain size={14}/>,gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' },
]

export default function MotivationalDashboard() {
  const [tab, setTab] = useState<Tab>('quote')
  const [theme, setTheme] = useState(BACKGROUND_THEMES[0])
  const [quote, setQuote] = useState<QuoteData>(FALLBACK_QUOTES[0])
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteHistory, setQuoteHistory] = useState<QuoteData[]>([])
  const [joke, setJoke] = useState(JOKES[0])
  const [imgError, setImgError] = useState(false)
  const [imgSeed, setImgSeed] = useState(() => Math.floor(Math.random() * 999))
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([])
  const [saved, setSaved] = useState(false)

  // ===== 呼吸冥想 =====
  const [patternIdx, setPatternIdx] = useState(0)
  const [breathing, setBreathing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2'>('idle')
  const [breathTime, setBreathTime] = useState(0)
  const [breathCycles, setBreathCycles] = useState(0)
  const breathTimerRef = useRef<number | null>(null)

  // ===== 目标/感恩/小成就 =====
  const [goals, setGoals] = useState<Goal[]>([])
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([])
  const [wins, setWins] = useState<Win[]>([])
  const [newGoal, setNewGoal] = useState('')
  const [newGratitude, setNewGratitude] = useState('')
  const [newWin, setNewWin] = useState('')

  // 加载/保存持久化
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        setSavedQuotes(d.savedQuotes || [])
        setGoals(d.goals || [])
        setGratitudes(d.gratitudes || [])
        setWins(d.wins || [])
        setBreathCycles(d.breathCycles || 0)
        if (d.themeId) {
          const t = BACKGROUND_THEMES.find(x => x.id === d.themeId)
          if (t) setTheme(t)
        }
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        savedQuotes, goals, gratitudes, wins, breathCycles, themeId: theme.id
      }))
    } catch {}
  }, [savedQuotes, goals, gratitudes, wins, breathCycles, theme])

  // 获取箴言（公开API：zenquotes.io，CORS友好，无需key）
  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true)
    setSaved(false)
    // 候选：zenquotes 免费 CORS 友好；失败则回退本地
    const apis = [
      async () => {
        const r = await fetch('https://zenquotes.io/api/random', { cache: 'no-store' })
        if (!r.ok) throw 0
        const d = await r.json()
        if (d && d[0]) return { text: d[0].q, author: d[0].a }
        throw 0
      },
      async () => {
        // 备用 stoic quotes API
        const r = await fetch('https://api.themotivate365.com/stoic-quote', { cache: 'no-store' })
        if (!r.ok) throw 0
        const d = await r.json()
        if (d) return { text: d.quote, author: d.author || 'Stoic' }
        throw 0
      }
    ]
    let got: QuoteData | null = null
    for (const api of apis) {
      try { got = await api(); break } catch {}
    }
    // 最终回退到本地库
    if (!got) {
      got = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
    }
    setQuote(got)
    setQuoteHistory(h => [got!, ...h].slice(0, 15))
    setQuoteLoading(false)
    // 每次换箴言顺手换个背景图seed
    setImgSeed(Math.floor(Math.random() * 999))
    setImgError(false)
  }, [])

  // 启动时加载一次
  useEffect(() => {
    fetchQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 随机换笑话
  const nextJoke = () => setJoke(JOKES[Math.floor(Math.random() * JOKES.length)])

  // ===== 呼吸冥想循环 =====
  const pattern = BREATH_PATTERNS[patternIdx]

  const startBreathing = () => {
    if (breathing) { stopBreathing(); return }
    setBreathing(true)
    const p = pattern as typeof BREATH_PATTERNS[number]
    const seq: Array<'inhale' | 'hold' | 'exhale' | 'hold2'> = ['inhale']
    if (p.hold > 0) seq.push('hold')
    seq.push('exhale')
    if ((p as { hold2?: number }).hold2 && (p as { hold2?: number }).hold2! > 0) seq.push('hold2')

    let seqIdx = 0
    const runPhase = () => {
      const phase = seq[seqIdx]
      setBreathPhase(phase)
      const durSec = phase === 'inhale' ? p.inhale
        : phase === 'hold' ? p.hold
        : phase === 'exhale' ? p.exhale
        : (p as { hold2?: number }).hold2 || 0
      let remaining = durSec
      setBreathTime(remaining)
      const tick = () => {
        remaining -= 0.1
        if (remaining <= 0) {
          // 进入下一阶段
          seqIdx = (seqIdx + 1) % seq.length
          if (seqIdx === 0) {
            // 完成一个循环
            setBreathCycles(c => c + 1)
          }
          runPhase()
        } else {
          setBreathTime(+remaining.toFixed(1))
          breathTimerRef.current = window.setTimeout(tick, 100)
        }
      }
      breathTimerRef.current = window.setTimeout(tick, 100)
    }
    runPhase()
  }
  const stopBreathing = () => {
    setBreathing(false)
    setBreathPhase('idle')
    setBreathTime(0)
    if (breathTimerRef.current) {
      clearTimeout(breathTimerRef.current)
      breathTimerRef.current = null
    }
  }

  // 呼吸动画进度 0~1
  const breathProgress = useMemo(() => {
    if (breathPhase === 'inhale') {
      return 1 - (breathTime / pattern.inhale)
    }
    if (breathPhase === 'exhale') {
      return breathTime / pattern.exhale
    }
    if (breathPhase === 'hold' || breathPhase === 'hold2') return 1
    return 0
  }, [breathPhase, breathTime, pattern])

  // Web Audio 播放柔和提示音
  const playChime = (freq = 528, duration = 0.3, type: OscillatorType = 'sine') => {
    try {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + duration)
    } catch {}
  }
  // 呼吸阶段切换时播放
  useEffect(() => {
    if (!breathing) return
    if (breathPhase === 'inhale') playChime(528, 0.2, 'sine')
    else if (breathPhase === 'exhale') playChime(396, 0.25, 'sine')
    else if (breathPhase === 'hold' || breathPhase === 'hold2') playChime(639, 0.12, 'triangle')
  }, [breathPhase, breathing])

  // ===== 目标管理 =====
  const addGoal = () => {
    if (!newGoal.trim()) return
    setGoals(g => [{ id: 'g' + Date.now(), text: newGoal.trim(), done: false, createdAt: new Date().toISOString() }, ...g])
    setNewGoal('')
  }
  const toggleGoal = (id: string) => setGoals(g => g.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const delGoal = (id: string) => setGoals(g => g.filter(x => x.id !== id))

  // ===== 感恩/小成就 =====
  const addGratitude = () => {
    if (!newGratitude.trim()) return
    setGratitudes(x => [{ id: 'gr' + Date.now(), text: newGratitude.trim(), createdAt: new Date().toISOString() }, ...x])
    setNewGratitude('')
  }
  const delGratitude = (id: string) => setGratitudes(x => x.filter(g => g.id !== id))
  const addWin = () => {
    if (!newWin.trim()) return
    setWins(x => [{ id: 'w' + Date.now(), text: newWin.trim(), createdAt: new Date().toISOString() }, ...x])
    setNewWin('')
  }
  const delWin = (id: string) => setWins(x => x.filter(w => w.id !== id))

  // 复制箴言
  const copyQuote = async () => {
    try { await navigator.clipboard.writeText(`"${quote.text}"\n\n—— ${quote.author}`)
      alert('✨ 已复制到剪贴板')
    } catch { alert('复制失败，请手动选中复制') }
  }
  const toggleSaveQuote = () => {
    const exists = savedQuotes.some(q => q.text === quote.text && q.author === quote.author)
    if (exists) {
      setSavedQuotes(x => x.filter(q => !(q.text === quote.text && q.author === quote.author)))
      setSaved(false)
    } else {
      setSavedQuotes(x => [quote, ...x])
      setSaved(true)
    }
  }
  useEffect(() => {
    setSaved(savedQuotes.some(q => q.text === quote.text && q.author === quote.author))
  }, [quote, savedQuotes])

  const todayDone = goals.filter(g => g.done).length
  const todayGoalTotal = goals.length
  const todayGoalPct = todayGoalTotal ? Math.round(todayDone / todayGoalTotal * 100) : 0

  // 今日日期
  const dateStr = useMemo(() => {
    const now = new Date()
    const week = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]
    return `${now.getFullYear()} 年 ${now.getMonth()+1} 月 ${now.getDate()} 日 · ${week}`
  }, [])

  const breathPhaseLabel = { idle: '准备好就开始吧', inhale: '吸气...', hold: '屏住', exhale: '呼气...', hold2: '暂停' }[breathPhase]

  const breathScale = 0.6 + 0.4 * breathProgress

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      color: '#fff', fontFamily: 'inherit',
      background: theme.gradient,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* 装饰光斑 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(circle at 15% 20%, rgba(255,255,255,0.18), transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(255,255,255,0.12), transparent 45%)
        `
      }}/>
      {/* 玻璃拟态叠加层 */}
      <div style={{ position: 'absolute', inset: 0, backdropFilter: 'saturate(120%)' }}/>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 顶部 Header */}
        <div style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={22} style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}/>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>MotivationalDashboard · 励志仪表盘</div>
          </div>
          <div style={{ marginLeft: 12, padding: '4px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.25)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13}/> {dateStr}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', padding: 3, borderRadius: 10, background: 'rgba(0,0,0,0.2)', gap: 3 }} title="切换主题色">
              {BACKGROUND_THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)}
                  title={t.name}
                  style={{
                    width: 26, height: 26, borderRadius: 8, border: theme.id === t.id ? '2px solid white' : '2px solid transparent',
                    background: t.gradient, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white',
                    boxShadow: theme.id === t.id ? '0 0 0 2px rgba(255,255,255,0.3)' : undefined
                  }}>{t.icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div style={{
          padding: '0 20px 14px', display: 'flex', gap: 6, flexWrap: 'wrap'
        }}>
          {[
            { k: 'quote' as Tab, label: '每日箴言',   icon: <Quote size={14}/> },
            { k: 'breathe' as Tab, label: '呼吸冥想', icon: <Wind size={14}/> },
            { k: 'goals' as Tab, label: '今日目标',   icon: <Target size={14}/> },
            { k: 'gratitude' as Tab, label: '感恩日记', icon: <Heart size={14}/> },
            { k: 'wins' as Tab, label: '小成就墙',   icon: <Trophy size={14}/> },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: tab === t.k ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.22)',
                color: tab === t.k ? '#1f2937' : '#fff',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: tab === t.k ? '0 6px 20px rgba(0,0,0,0.2)' : undefined
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* === 内容主体 === */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 20px 20px' }}>
          {/* 箴言 */}
          {tab === 'quote' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, minHeight: 0 }}>
              {/* 左侧：大图 + 箴言卡片 */}
              <div style={{
                borderRadius: 16, overflow: 'hidden', position: 'relative',
                boxShadow: '0 16px 50px rgba(0,0,0,0.35)', minHeight: 0,
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'rgba(0,0,0,0.15)' }}>
                  {!imgError ? (
                    <img
                      src={`https://picsum.photos/seed/motiv${imgSeed}/1200/900`}
                      alt="每日灵感"
                      onError={() => setImgError(true)}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `
                        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(255,255,255,0.2), transparent 50%)
                      `
                    }}/>
                  )}
                  {/* 箴言覆盖层 */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.85) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: 32,
                  }}>
                    <div style={{ opacity: 0.85, marginBottom: 16 }}>
                      <Quote size={48} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                    </div>
                    <div style={{
                      fontSize: 28, fontWeight: 600, lineHeight: 1.45, marginBottom: 16,
                      textShadow: '0 2px 16px rgba(0,0,0,0.55)',
                      letterSpacing: '0.01em',
                    }}>{quoteLoading ? '✨ 正在寻找今日灵感...' : `"${quote.text}"`}</div>
                    {!quoteLoading && (
                      <div style={{
                        fontSize: 15, opacity: 0.95, fontWeight: 500,
                        display: 'inline-flex', alignItems: 'center', gap: 8
                      }}>
                        <span style={{ width: 24, height: 2, background: '#fff', opacity: 0.7, display: 'inline-block' }}/>
                        {quote.author}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(0,0,0,0.75)', borderTop: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <button onClick={fetchQuote} disabled={quoteLoading}
                    style={whiteBtn(quoteLoading)}>
                    <RefreshCw size={14} style={quoteLoading ? { animation: 'spin 1s linear infinite' } : undefined}/> 换一句
                  </button>
                  <button onClick={copyQuote} disabled={quoteLoading} style={whiteBtn()}>
                    <Copy size={14}/> 复制
                  </button>
                  <button onClick={toggleSaveQuote} disabled={quoteLoading}
                    style={whiteBtn(false, saved ? '#f59e0b' : undefined)}>
                    <Bookmark size={14} fill={saved ? 'currentColor' : 'none'}/>
                    {saved ? '已收藏' : '收藏'}
                  </button>
                  <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ImageIcon size={13}/> 图：Lorem Picsum · 箴言：ZenQuotes / Stoic API
                  </div>
                </div>
              </div>

              {/* 右侧：笑话 + 收藏 + 历史 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
                {/* 小笑话卡片 */}
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Smile size={16}/> 程序员小幽默
                    </div>
                    <button onClick={nextJoke} style={miniBtn()}>
                      <RefreshCw size={12}/> 换一条
                    </button>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.75, opacity: 0.95 }}>{joke}</div>
                </div>

                {/* 今日目标进度简报 */}
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target size={16}/> 今日目标
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{todayDone}/{todayGoalTotal} · {todayGoalPct}%</div>
                  </div>
                  <div style={{
                    width: '100%', height: 10, borderRadius: 999, overflow: 'hidden',
                    background: 'rgba(0,0,0,0.2)', marginBottom: 12
                  }}>
                    <div style={{
                      width: `${todayGoalPct}%`, height: '100%',
                      background: todayGoalPct === 100 && todayGoalTotal > 0
                        ? 'linear-gradient(90deg, #fde047, #fb923c, #f87171)'
                        : 'linear-gradient(90deg, #fff, #fef08a)',
                      transition: 'width 0.3s'
                    }}/>
                  </div>
                  {goals.slice(0, 5).map(g => (
                    <div key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, padding: '4px 0', opacity: g.done ? 0.6 : 1,
                      textDecoration: g.done ? 'line-through' : 'none'
                    }}>
                      <CheckCircle2 size={14} style={{ color: g.done ? '#fde047' : 'rgba(255,255,255,0.5)' }}/>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.text}</span>
                    </div>
                  ))}
                  {todayGoalTotal > 5 && (
                    <div onClick={() => setTab('goals')} style={{
                      marginTop: 6, fontSize: 12, opacity: 0.8, cursor: 'pointer', textDecoration: 'underline'
                    }}>查看全部 {todayGoalTotal} 个目标 →</div>
                  )}
                  {todayGoalTotal === 0 && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>还没有目标 → 切到「今日目标」添加第一个吧！</div>
                  )}
                </div>

                {/* 收藏箴言 / 历史 （Tab 式） */}
                <div style={{
                  flex: 1, minHeight: 0, borderRadius: 14,
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                  <MiniTabs tabs={['我的收藏', '最近浏览']} render={tabIdx => (
                    <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
                      {tabIdx === 0 && (
                        savedQuotes.length === 0 ? (
                          <EmptyState icon={<Bookmark size={24}/>} text="还没有收藏的箴言，点击卡片里的「收藏」按钮吧" />
                        ) : savedQuotes.map((q, i) => (
                          <QuoteMiniCard key={i} q={q} onUse={() => setQuote(q)}
                            onDelete={() => setSavedQuotes(x => x.filter(sq => !(sq.text === q.text && sq.author === q.author)))} />
                        ))
                      )}
                      {tabIdx === 1 && (
                        quoteHistory.length === 0 ? (
                          <EmptyState icon={<BookOpen size={24}/>} text="点击「换一句」积累浏览历史" />
                        ) : quoteHistory.map((q, i) => (
                          <QuoteMiniCard key={i} q={q} onUse={() => setQuote(q)} />
                        ))
                      )}
                    </div>
                  )} />
                </div>
              </div>
            </div>
          )}

          {/* 呼吸冥想 */}
          {tab === 'breathe' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>
              {/* 左侧：动画区 */}
              <div style={{
                borderRadius: 16, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
              }}>
                {/* 背景脉动光环 */}
                <div style={{
                  position: 'absolute', width: 340, height: 340, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  transform: `scale(${breathScale + 0.2})`,
                  transition: breathing ? 'transform 0.1s linear' : 'transform 0.5s ease',
                  opacity: breathing ? 0.9 : 0.5
                }}/>
                <div style={{
                  position: 'absolute', width: 260, height: 260, borderRadius: '50%',
                  border: '1px dashed rgba(255,255,255,0.25)'
                }}/>
                <div style={{
                  width: 220, height: 220, borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.15))`,
                  boxShadow: breathing
                    ? '0 0 80px rgba(255,255,255,0.45), inset 0 0 40px rgba(255,255,255,0.25)'
                    : '0 0 40px rgba(255,255,255,0.25), inset 0 0 30px rgba(255,255,255,0.15)',
                  transform: `scale(${breathScale})`,
                  transition: breathing ? 'transform 0.1s linear' : 'transform 0.5s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                  position: 'relative', zIndex: 1
                }}>
                  <div style={{
                    fontSize: 30, fontWeight: 300, marginBottom: 6, letterSpacing: '0.05em'
                  }}>{breathPhaseLabel}</div>
                  {breathing && (
                    <div style={{
                      fontSize: 56, fontWeight: 200, letterSpacing: '-0.03em',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1, marginTop: 8
                    }}>{Math.max(0, Math.ceil(breathTime))}<span style={{ fontSize: 22, opacity: 0.7 }}>s</span></div>
                  )}
                </div>

                <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
                  <button onClick={startBreathing} style={bigBtn(breathing ? '#ef4444' : '#fff', breathing ? '#1f2937' : 'rgba(0,0,0,0.45)')}>
                    {breathing ? <X size={18}/> : <Wind size={18}/>}
                    {breathing ? '停止' : '开始冥想'}
                  </button>
                </div>

                <div style={{
                  marginTop: 16, fontSize: 12, opacity: 0.8,
                  display: 'inline-flex', alignItems: 'center', gap: 6
                }}>
                  <Flame size={14}/> 累计完成 <strong style={{ fontSize: 14 }}>{breathCycles}</strong> 个呼吸循环
                </div>
              </div>

              {/* 右侧：模式 + 说明 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
                <div style={{
                  borderRadius: 14, padding: 18,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={16}/> 选择呼吸模式
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {BREATH_PATTERNS.map((p, i) => {
                      const active = i === patternIdx
                      return (
                        <label key={p.id} style={{
                          padding: 12, borderRadius: 10, cursor: 'pointer',
                          background: active ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)',
                          border: active ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
                          alignItems: 'center', transition: 'all 0.15s'
                        }}>
                          <input type="radio" checked={active} onChange={() => { setPatternIdx(i); if (breathing) { stopBreathing(); } }}
                            style={{ transform: 'scale(1.2)' }}/>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{p.desc}</div>
                          </div>
                          <div style={{
                            fontSize: 11, padding: '4px 8px', borderRadius: 6,
                            background: 'rgba(0,0,0,0.3)', fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'nowrap'
                          }}>
                            吸 {p.inhale}s
                            {p.hold > 0 && ` · 屏 ${p.hold}s`}
                            · 呼 {p.exhale}s
                            {'hold2' in p && (p as { hold2: number }).hold2 > 0 && ` · 屏 ${(p as { hold2: number }).hold2}s`}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div style={{
                  borderRadius: 14, padding: 18, flex: 1, overflow: 'auto',
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 13, lineHeight: 1.75, opacity: 0.95
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16}/> 冥想小贴士
                  </div>
                  <ul style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
                    <li>找一个舒适的坐姿，放松肩膀，挺直但不僵硬</li>
                    <li>闭上眼睛或温柔地注视下方动画</li>
                    <li>用 <strong>鼻子</strong> 吸气，用 <strong>嘴巴</strong>（或鼻子）缓慢呼气</li>
                    <li>注意力被思绪带走是 <em>正常的</em>，温柔地把注意力拉回呼吸即可</li>
                    <li>4-7-8 模式是 Dr. Weil 推荐的「天然镇静剂」，睡前练习很有效</li>
                    <li>坚持每天 5 分钟，可显著降低压力激素皮质醇水平</li>
                    <li>首次使用需要授权音频播放（系统会在你点击开始后自动激活）</li>
                  </ul>
                  <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: 12 }}>
                    <strong>🎯 推荐方案：</strong> 早晨 Box 方形呼吸 10 轮提升专注；晚上 4-7-8 模式 5 分钟助眠；焦虑发作时立刻切换平衡呼吸 3-5 轮。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 今日目标 */}
          {tab === 'goals' && (
            <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minHeight: 0 }}>
              <div style={{
                borderRadius: 14, padding: 20,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.22)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                minHeight: 0
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={18}/> 添加今日目标
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGoal()}
                    placeholder="今天我想完成的一件小事..."
                    style={inputWhite()} />
                  <button onClick={addGoal} style={bigBtn('rgba(0,0,0,0.5)')}>
                    <Plus size={16}/> 添加
                  </button>
                </div>

                <div style={{
                  padding: 18, borderRadius: 12, marginBottom: 16,
                  background: 'rgba(0,0,0,0.25)', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>今日完成度</div>
                  <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {todayGoalPct}%
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                    {todayDone}/{todayGoalTotal} 个目标
                    {todayGoalTotal > 0 && todayGoalPct === 100 && (
                      <span style={{ marginLeft: 8 }}>
                        <PartyPopper size={14} style={{ display: 'inline' }}/> 全部完成，太棒了！
                      </span>
                    )}
                  </div>
                  <div style={{
                    marginTop: 12, height: 12, borderRadius: 999,
                    background: 'rgba(255,255,255,0.2)', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${todayGoalPct}%`, height: '100%',
                      background: todayGoalPct === 100 && todayGoalTotal > 0
                        ? 'linear-gradient(90deg, #fde047, #fca5a5, #c084fc)'
                        : 'linear-gradient(90deg, #a7f3d0, #fef08a)',
                      transition: 'width 0.3s'
                    }}/>
                  </div>
                </div>

                {/* 建议模板 */}
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>💡 快速添加：</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['阅读 30 分钟','运动 30 分钟','冥想 5 分钟','学习新技能 1h','喝 8 杯水','写日记','完成今日待办 TOP3'].map(tpl => (
                    <button key={tpl} onClick={() => setNewGoal(tpl)}
                      style={{
                        padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer',
                        background: 'rgba(0,0,0,0.2)', color: 'white',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}>+ {tpl}</button>
                  ))}
                </div>
              </div>

              <div style={{
                borderRadius: 14, padding: 20,
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.12)',
                overflow: 'auto', minHeight: 0,
                display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={18}/> 我的今日清单
                  <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginLeft: 'auto' }}>
                    共 {todayGoalTotal} 项
                  </span>
                </div>
                {goals.length === 0 && (
                  <EmptyState icon={<Target size={28}/>} text="还没有目标，在左侧输入今天想要完成的第一件事吧！"/>
                )}
                {goals.map(g => (
                  <div key={g.id} style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
                    padding: 12, borderRadius: 10, cursor: 'pointer',
                    background: g.done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${g.done ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                    transition: 'all 0.15s', alignItems: 'center'
                  }}
                    onClick={() => toggleGoal(g.id)}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: g.done ? '#10b981' : 'rgba(255,255,255,0.15)',
                      border: g.done ? 'none' : '2px solid rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {g.done && <CheckCircle2 size={16}/>}
                    </div>
                    <div style={{
                      fontSize: 14, lineHeight: 1.4,
                      textDecoration: g.done ? 'line-through' : 'none',
                      opacity: g.done ? 0.6 : 1
                    }}>{g.text}</div>
                    <button onClick={(e) => { e.stopPropagation(); delGoal(g.id) }}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: 'none', cursor: 'pointer',
                        background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 感恩日记 */}
          {tab === 'gratitude' && (
            <SimpleList<Gratitude>
              title="感恩日记"
              subtitle="记录今天值得感谢的 3 件小事：一杯热咖啡、朋友的关心、阳光明媚..."
              icon={<Heart size={18}/>}
              items={gratitudes}
              placeholder="我今天感谢..."
              color="#ec4899"
              btnLabel="记录感恩"
              inputValue={newGratitude}
              onInput={setNewGratitude}
              onAdd={addGratitude}
              onDelete={delGratitude}
              emptyIcon={<Heart size={28}/>}
              emptyText="开始练习感恩吧。哪怕是'今天没有下雨'这样的小事，也值得记下来。研究表明：每日记录 3 件感恩的事，坚持 21 天可显著提升幸福感。"
              templates={['家人健康平安','今天的美食','有份稳定的工作','朋友的陪伴','阳光明媚的天气','一杯好喝的咖啡','读到一本好书','睡了个好觉']}
            />
          )}

          {/* 小成就墙 */}
          {tab === 'wins' && (
            <SimpleList<Win>
              title="小成就墙"
              subtitle="不要小看任何一个微小的胜利。每一次坚持都是未来的底气。"
              icon={<Trophy size={18}/>}
              items={wins}
              placeholder="今天我完成了..."
              color="#f59e0b"
              btnLabel="记录成就"
              inputValue={newWin}
              onInput={setNewWin}
              onAdd={addWin}
              onDelete={delWin}
              emptyIcon={<PartyPopper size={28}/>}
              emptyText="还没有记录成就。哪怕今天只是'早起10分钟'、'看完了一页书'，都值得被记录和庆祝！"
              templates={['完成了一个棘手的需求','坚持跑步第 7 天','读完一本书','学习了新的技术点','输出了一篇技术博客','完成了面试','健身打卡','把房间收拾干净了']}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { filter: brightness(1.08); }
        button:active { transform: translateY(1px); }
      `}</style>
    </div>
  )
}

function whiteBtn(disabled = false, color?: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: color ? color : 'rgba(255,255,255,0.15)',
    color: disabled ? '#ccc' : '#fff',
    border: '1px solid rgba(255,255,255,0.2)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, transition: 'all 0.15s'
  }
}
function miniBtn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 9px', borderRadius: 6, fontSize: 11,
    background: 'rgba(0,0,0,0.25)', color: 'white',
    border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer'
  }
}
function bigBtn(bg: string | undefined, color = 'white'): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700,
    background: bg ?? 'rgba(0,0,0,0.4)', color: color,
    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,0.2)',
    transition: 'all 0.15s'
  }
}
function inputWhite(): React.CSSProperties {
  return {
    flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
    background: 'rgba(0,0,0,0.3)', color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    outline: 'none', fontFamily: 'inherit'
  }
}

function QuoteMiniCard({ q, onUse, onDelete }: { q: QuoteData; onUse?: () => void; onDelete?: () => void }) {
  return (
    <div style={{
      padding: 12, borderRadius: 8, marginBottom: 8,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 6, opacity: 0.95 }}>"{q.text}"</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>—— {q.author}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {onUse && (
          <button onClick={onUse} style={miniBtn()}>
            <Share2 size={11}/> 引用这句
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} style={{ ...miniBtn(), background: 'rgba(239,68,68,0.2)' }}>
            <Trash2 size={11}/> 删除
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      padding: 30, textAlign: 'center', opacity: 0.75,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
    }}>
      {icon}
      <div style={{ fontSize: 13, lineHeight: 1.7 }}>{text}</div>
    </div>
  )
}

// 简易双Tab组件
function MiniTabs({ tabs, render }: { tabs: string[]; render: (idx: number) => React.ReactNode }) {
  const [i, setI] = useState(0)
  return (
    <>
      <div style={{
        display: 'flex', gap: 2, padding: 4,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {tabs.map((t, idx) => (
          <button key={t} onClick={() => setI(idx)} style={{
            flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: i === idx ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'white', border: 'none', cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>
      {render(i)}
    </>
  )
}

// 通用列表（感恩/小成就共用）
function SimpleList<T extends { id: string; text: string; createdAt: string }>({
  title, subtitle, icon, items, placeholder, color, btnLabel, inputValue, onInput,
  onAdd, onDelete, emptyIcon, emptyText, templates,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  items: T[]
  placeholder: string
  color: string
  btnLabel: string
  inputValue: string
  onInput: (s: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  emptyIcon: React.ReactNode
  emptyText: string
  templates?: string[]
}) {
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, minHeight: 0 }}>
      <div style={{
        borderRadius: 14, padding: 24,
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.22)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)', minHeight: 0
      }}>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: color + '33', color
          }}>{icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
        <div style={{
          padding: 14, borderRadius: 12, marginTop: 20, marginBottom: 14,
          background: 'rgba(0,0,0,0.25)',
          border: `1px dashed ${color}55`,
          fontSize: 13, lineHeight: 1.7, opacity: 0.92
        }}>
          🌸 心理学小知识：<strong>「三件好事练习」</strong>
          <br/>积极心理学创始人 Seligman 的研究表明：坚持每天写下 3 件进展顺利的事情，并思考原因，
          <strong>6 个月后抑郁水平平均下降 36%</strong>，幸福感显著提升。
          <br/>
          关键：不要只写结果，也可以想想「为什么这件好事会发生？是因为我的努力？他人的善意？还是环境的馈赠？」
        </div>
        <textarea
          value={inputValue}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onAdd() }}
          placeholder={placeholder}
          rows={5}
          style={{
            padding: 14, borderRadius: 10, fontSize: 14, resize: 'vertical',
            background: 'rgba(0,0,0,0.3)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            fontFamily: 'inherit', outline: 'none', lineHeight: 1.6
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={onAdd}
            style={{
              padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: color, color: 'white', border: 'none',
              boxShadow: `0 6px 20px ${color}55`
            }}>
            <Plus size={16}/> {btnLabel}
          </button>
          <span style={{ fontSize: 11, opacity: 0.7 }}>💡 按 Ctrl/Cmd + Enter 快速提交</span>
        </div>

        {templates && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>✨ 灵感模板（点击即可填入）</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map(t => (
                <button key={t} onClick={() => onInput(t)}
                  style={{
                    padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer',
                    background: 'rgba(0,0,0,0.2)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>{t.length > 14 ? t.slice(0, 14) + '…' : t}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        borderRadius: 14, padding: 20, minHeight: 0,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} style={{ color }}/> 时间线
          </div>
          <span style={{
            padding: '3px 12px', borderRadius: 999, fontSize: 11,
            background: color + '22', color
          }}>共 {items.length} 条</span>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={emptyIcon} text={emptyText}/>
        ) : (
          items.map((it, i) => (
            <div key={it.id} style={{
              position: 'relative', padding: '14px 14px 14px 24px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{
                position: 'absolute', left: -2, top: 17,
                width: 10, height: 10, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 0 4px ${color}33`
              }}/>
              <div style={{ fontSize: 13.5, lineHeight: 1.65, opacity: 0.95, whiteSpace: 'pre-wrap' }}>{it.text}</div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.55 }}>
                  {(() => {
                    const d = new Date(it.createdAt)
                    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                  })()} · #{items.length - i}
                </div>
                <button onClick={() => onDelete(it.id)}
                  style={{
                    padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.18)', color: '#fecaca',
                    border: '1px solid rgba(239,68,68,0.25)', fontSize: 11,
                    display: 'inline-flex', alignItems: 'center', gap: 3
                  }}>
                  <Trash2 size={11}/> 删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
