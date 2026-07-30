import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Leaf, Car, Plane, Bike, Home, Utensils, ShoppingBag, Lightbulb,
  Plus, Trash2, TrendingDown, BarChart3, Target, History, Trophy,
  AlertCircle, CheckCircle2, Info, ArrowRight, PieChart
} from 'lucide-react'

type ActivityCategory = 'transport' | 'home' | 'food' | 'shopping' | 'energy'

interface Activity {
  id: string
  category: ActivityCategory
  type: string
  label: string
  amount: number
  unit: string
  co2: number // kg CO2
  timestamp: number
  note?: string
}

interface ActivityPreset {
  type: string
  label: string
  unit: string
  factor: number // kg CO2 per unit
  hint: string
  icon: React.ReactNode
  color: string
}

// 碳排因子参考来源：IPCC / 中国碳核算数据库 / 环保公开数据 (近似因子，便于教育和参考)
const PRESETS: Record<ActivityCategory, ActivityPreset[]> = {
  transport: [
    { type: 'car_petrol', label: '私家车(汽油)', unit: '公里', factor: 0.192, hint: '小客车 · 汽油 · 含制造分摊', icon: <Car size={18} />, color: '#ef4444' },
    { type: 'car_electric', label: '私家车(纯电)', unit: '公里', factor: 0.042, hint: '电动车 · 中国电网平均碳排', icon: <Car size={18} />, color: '#22c55e' },
    { type: 'bus', label: '公共汽车', unit: '公里', factor: 0.089, hint: '城市公交 · 平均载客', icon: <Bike size={18} />, color: '#3b82f6' },
    { type: 'subway', label: '地铁/城轨', unit: '公里', factor: 0.032, hint: '城市轨道交通', icon: <Bike size={18} />, color: '#6366f1' },
    { type: 'train_high', label: '高铁出行', unit: '公里', factor: 0.027, hint: '高速铁路 · 二等座', icon: <Bike size={18} />, color: '#0ea5e9' },
    { type: 'plane_short', label: '短途飞行(<1000km)', unit: '公里', factor: 0.279, hint: '国内短程 · 经济舱', icon: <Plane size={18} />, color: '#f97316' },
    { type: 'plane_long', label: '长途飞行(>1000km)', unit: '公里', factor: 0.186, hint: '国际长途 · 经济舱', icon: <Plane size={18} />, color: '#dc2626' },
    { type: 'bike', label: '骑行/步行', unit: '公里', factor: 0, hint: '零碳绿色出行 🌿', icon: <Bike size={18} />, color: '#10b981' },
  ],
  home: [
    { type: 'elec_cn', label: '家庭用电', unit: '千瓦时(kWh)', factor: 0.581, hint: '中国区域电网平均排放因子', icon: <Home size={18} />, color: '#f59e0b' },
    { type: 'gas', label: '天然气(做饭/取暖)', unit: '立方米', factor: 2.162, hint: '燃烧热值折算', icon: <Home size={18} />, color: '#8b5cf6' },
    { type: 'water', label: '自来水使用', unit: '吨', factor: 0.91, hint: '供水+污水处理全流程', icon: <Home size={18} />, color: '#06b6d4' },
    { type: 'heating_district', label: '集中供热', unit: '平方米·月', factor: 2.78, hint: '北方冬季供暖 · 平方米/月', icon: <Home size={18} />, color: '#fb7185' },
  ],
  food: [
    { type: 'meat_beef', label: '牛肉餐食', unit: '餐', factor: 6.61, hint: '约含 150g 牛肉 · 畜牧业碳排', icon: <Utensils size={18} />, color: '#b91c1c' },
    { type: 'meat_pork', label: '猪肉餐食', unit: '餐', factor: 1.58, hint: '约含 150g 猪肉', icon: <Utensils size={18} />, color: '#f472b6' },
    { type: 'meat_chicken', label: '鸡肉餐食', unit: '餐', factor: 0.69, hint: '约含 150g 禽肉', icon: <Utensils size={18} />, color: '#eab308' },
    { type: 'vegetarian', label: '素食餐', unit: '餐', factor: 0.27, hint: '无红肉 · 蛋奶素', icon: <Utensils size={18} />, color: '#84cc16' },
    { type: 'vegan', label: '纯素餐', unit: '餐', factor: 0.15, hint: '全植物饮食 · 环保首选', icon: <Utensils size={18} />, color: '#22c55e' },
    { type: 'milk', label: '乳制品(牛奶)', unit: '升', factor: 1.56, hint: '含饲料/养殖/加工环节', icon: <Utensils size={18} />, color: '#e2e8f0' },
  ],
  shopping: [
    { type: 'clothes_new', label: '购买新衣服', unit: '件', factor: 7.58, hint: '棉/混纺 · 全生命周期估算', icon: <ShoppingBag size={18} />, color: '#a78bfa' },
    { type: 'phone_new', label: '新手机', unit: '部', factor: 79, hint: '旗舰级智能手机 · 生产为主', icon: <ShoppingBag size={18} />, color: '#f43f5e' },
    { type: 'laptop_new', label: '新笔记本电脑', unit: '台', factor: 287, hint: '制造阶段占比极高', icon: <ShoppingBag size={18} />, color: '#6366f1' },
    { type: 'book_paper', label: '纸质书', unit: '本', factor: 1.0, hint: '约 300 页 · 纸张印刷', icon: <ShoppingBag size={18} />, color: '#d97706' },
    { type: 'coffee', label: '外带咖啡(自带杯减碳)', unit: '杯', factor: 0.28, hint: '含杯盖包装等', icon: <ShoppingBag size={18} />, color: '#78350f' },
  ],
  energy: [
    { type: 'ac_cool', label: '空调制冷', unit: '小时', factor: 0.87, hint: '1.5匹 · 每小时电耗折算', icon: <Lightbulb size={18} />, color: '#38bdf8' },
    { type: 'heater', label: '电暖器/小太阳', unit: '小时', factor: 1.16, hint: '2000W 额定功率', icon: <Lightbulb size={18} />, color: '#ef4444' },
    { type: 'led_tv', label: '电视(大屏LED)', unit: '小时', factor: 0.11, hint: '55寸 · 典型使用功率', icon: <Lightbulb size={18} />, color: '#8b5cf6' },
    { type: 'stream_1h', label: '流媒体/高清视频', unit: '小时', factor: 0.055, hint: '数据中心+网络+终端设备', icon: <Lightbulb size={18} />, color: '#ec4899' },
    { type: 'led_light', label: 'LED照明(10W)', unit: '小时', factor: 0.0058, hint: 'LED 节能灯具', icon: <Lightbulb size={18} />, color: '#facc15' },
  ],
}

const CATEGORIES: Array<{ key: ActivityCategory; name: string; desc: string; icon: React.ReactNode; accent: string }> = [
  { key: 'transport', name: '交通出行', desc: '通勤 · 出差 · 日常代步', icon: <Car size={18} />, accent: 'from-sky-500 to-indigo-600' },
  { key: 'home', name: '居家生活', desc: '水电气 · 取暖 · 物业', icon: <Home size={18} />, accent: 'from-amber-500 to-orange-600' },
  { key: 'food', name: '饮食餐饮', desc: '三餐 · 肉类 · 素食', icon: <Utensils size={18} />, accent: 'from-rose-500 to-red-600' },
  { key: 'shopping', name: '消费购物', desc: '数码 · 服装 · 日用品', icon: <ShoppingBag size={18} />, accent: 'from-violet-500 to-purple-600' },
  { key: 'energy', name: '能耗电器', desc: '空调 · 照明 · 流媒体', icon: <Lightbulb size={18} />, accent: 'from-emerald-500 to-teal-600' },
]

const STORAGE_KEY = 'weblinux-ecotrack-v1'

function loadData(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Activity[]) : []
  } catch { return [] }
}

function saveData(arr: Activity[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-500))) } catch { /* noop */ }
}

// 1棵树≈年吸碳 21kg，参考：全球森林碳汇公开研究 (近似教育值)
const TREES_YEAR = 21
// 成年人年均呼吸 ≈ 2.3e5 kg，这里用「开车 X 公里」更直观
function equivalentKmByCar(co2: number) { return Math.round(co2 / 0.192) }
function equivalentTrees(co2: number) { return (co2 / TREES_YEAR).toFixed(1) }

function formatCO2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} 吨`
  if (kg >= 1) return `${kg.toFixed(2)} kg`
  return `${(kg * 1000).toFixed(0)} g`
}

const today0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() }
const days7 = today0() - 7 * 86400_000
const days30 = today0() - 30 * 86400_000

export default function EcoTrack() {
  const [activities, setActivities] = useState<Activity[]>(() => loadData())
  const [catTab, setCatTab] = useState<ActivityCategory>('transport')
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS.transport[0].type)
  const [amount, setAmount] = useState<string>('10')
  const [note, setNote] = useState('')
  const [historyTab, setHistoryTab] = useState<'today' | '7d' | '30d' | 'all'>('7d')
  const [flash, setFlash] = useState<{ id: string; msg: string; tone: 'ok' | 'warn' } | null>(null)

  useEffect(() => { saveData(activities) }, [activities])

  const showFlash = useCallback((msg: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = `f-${Date.now()}`
    setFlash({ id, msg, tone })
    setTimeout(() => setFlash(f => (f?.id === id ? null : f)), 2200)
  }, [])

  const preset = PRESETS[catTab].find(p => p.type === selectedPreset) ?? PRESETS[catTab][0]
  const computedCO2 = useMemo(() => {
    const n = parseFloat(amount) || 0
    return Math.max(0, n * preset.factor)
  }, [amount, preset])

  const totals = useMemo(() => {
    const inRange = (min: number) => activities.filter(a => a.timestamp >= min)
    return {
      today: inRange(today0()).reduce((s, a) => s + a.co2, 0),
      d7: inRange(days7).reduce((s, a) => s + a.co2, 0),
      d30: inRange(days30).reduce((s, a) => s + a.co2, 0),
      all: activities.reduce((s, a) => s + a.co2, 0),
      count: activities.length,
    }
  }, [activities])

  const categorySplit = useMemo(() => {
    const map: Record<ActivityCategory, number> = { transport: 0, home: 0, food: 0, shopping: 0, energy: 0 }
    const rangeMin = historyTab === 'today' ? today0() : historyTab === '7d' ? days7 : historyTab === '30d' ? days30 : 0
    activities.filter(a => a.timestamp >= rangeMin).forEach(a => { map[a.category] += a.co2 })
    return map
  }, [activities, historyTab])

  const filteredHistory = useMemo(() => {
    const minTs = historyTab === 'today' ? today0() : historyTab === '7d' ? days7 : historyTab === '30d' ? days30 : 0
    return [...activities].filter(a => a.timestamp >= minTs).sort((a, b) => b.timestamp - a.timestamp)
  }, [activities, historyTab])

  const handleAdd = () => {
    const n = parseFloat(amount)
    if (!isFinite(n) || n <= 0) { showFlash('请输入大于 0 的数量', 'warn'); return }
    const entry: Activity = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category: catTab,
      type: preset.type,
      label: preset.label,
      amount: n,
      unit: preset.unit,
      co2: computedCO2,
      timestamp: Date.now(),
      note: note.trim() || undefined,
    }
    setActivities(prev => [entry, ...prev])
    setNote('')
    showFlash(`已记录 · ${formatCO2(entry.co2)} CO₂e`)
  }

  const handleDelete = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
    showFlash('已删除该条记录', 'warn')
  }

  const handleClearAll = () => {
    if (activities.length === 0) return
    if (confirm('确定清空所有碳足迹记录吗？')) {
      setActivities([])
      showFlash('已清空所有记录')
    }
  }

  const rangeTotal = (() => {
    switch (historyTab) {
      case 'today': return totals.today
      case '7d': return totals.d7
      case '30d': return totals.d30
      case 'all': return totals.all
    }
  })()

  // 每日目标：7kg CO2e / 人 · 日 (约为迈向 1.5°C 路径的公平参考)
  const DAILY_GOAL = 7
  const todayPct = Math.min(100, Math.round((totals.today / DAILY_GOAL) * 100))
  const weekGoal = DAILY_GOAL * 7
  const weekPct = Math.min(100, Math.round((totals.d7 / weekGoal) * 100))

  const rangeMax = Math.max(1, ...Object.values(categorySplit))

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, #0b130d 0%, #08090a 100%)',
      color: '#e6ffe9', fontFamily: 'inherit', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(16,185,129,0.12)',
        background: 'linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(16,185,129,0.35)'
          }}>
            <Leaf size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.02 }}>EcoTrack 碳足迹追踪器</div>
            <div style={{ fontSize: 12, color: '#678b77', marginTop: 2 }}>记录日常 · 量化碳排 · 一起为地球降温 🌍</div>
          </div>
        </div>
        {flash && (
          <div style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 12.5,
            display: 'flex', alignItems: 'center', gap: 8,
            background: flash.tone === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${flash.tone === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            color: flash.tone === 'ok' ? '#6ee7b7' : '#fcd34d',
          }}>
            {flash.tone === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {flash.msg}
          </div>
        )}
      </div>

      {/* Stat strip */}
      <div style={{
        padding: '14px 24px', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10,
        borderBottom: '1px solid rgba(16,185,129,0.08)',
        background: 'rgba(255,255,255,0.012)'
      }}>
        <StatCard icon={<Target size={15} />} label="今日目标完成度" value={`${todayPct}%`} sub={`${formatCO2(totals.today)} / ${DAILY_GOAL} kg`} tone="#10b981" meter={todayPct} />
        <StatCard icon={<BarChart3 size={15} />} label="近 7 天" value={formatCO2(totals.d7)} sub={`目标 ${weekGoal} kg · ${weekPct}%`} tone="#06b6d4" meter={weekPct} />
        <StatCard icon={<History size={15} />} label="近 30 天" value={formatCO2(totals.d30)} sub={`≈ ${equivalentKmByCar(totals.d30)} 公里油车`} tone="#8b5cf6" />
        <StatCard icon={<Trophy size={15} />} label="累计记录" value={`${totals.count} 条`} sub={`共 ${formatCO2(totals.all)} · ≈ ${equivalentTrees(totals.all)} 棵树/年`} tone="#f59e0b" />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Logger */}
        <div style={{
          width: 420, flexShrink: 0, padding: '18px 20px',
          borderRight: '1px solid rgba(16,185,129,0.08)',
          overflowY: 'auto',
        }}>
          {/* Category tabs */}
          <div style={{ fontSize: 11, color: '#5f806e', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
            选择记录分类
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 6, marginBottom: 18 }}>
            {CATEGORIES.map(c => {
              const isActive = c.key === catTab
              return (
                <button key={c.key} onClick={() => { setCatTab(c.key); setSelectedPreset(PRESETS[c.key][0].type) }}
                  style={{
                    padding: '10px 10px 11px', borderRadius: 11, cursor: 'pointer',
                    border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: isActive ? `linear-gradient(135deg, ${c.accent})` : 'rgba(255,255,255,0.025)',
                    color: isActive ? '#fff' : '#c0d2c8', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#fff' : '#34d399',
                    }}>{c.icon}</div>
                    <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 600 }}>{c.name}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: isActive ? 'rgba(255,255,255,0.8)' : '#5f806e', lineHeight: 1.35 }}>{c.desc}</div>
                </button>
              )
            })}
          </div>

          {/* Presets */}
          <div style={{ fontSize: 11, color: '#5f806e', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
            {CATEGORIES.find(c => c.key === catTab)?.name} · 活动类型
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {PRESETS[catTab].map(p => {
              const active = p.type === selectedPreset
              return (
                <button key={p.type} onClick={() => setSelectedPreset(p.type)}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', background: p.color,
                    boxShadow: active ? `0 4px 12px ${p.color}55` : 'none',
                  }}>{p.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#a7f3d0' : '#c0d2c8' }}>
                      {p.label}
                      <span style={{ marginLeft: 8, fontSize: 10.5, color: '#5f806e', fontWeight: 500 }}>
                        {p.factor > 0 ? `${p.factor} kg/${p.unit}` : '零排放 🌿'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#5f806e', marginTop: 2 }}>{p.hint}</div>
                  </div>
                  {active && <CheckCircle2 size={15} color="#34d399" />}
                </button>
              )
            })}
          </div>

          {/* Amount + Add */}
          <div style={{
            padding: 16, borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(16,185,129,0.06), rgba(255,255,255,0.02))',
            border: '1px solid rgba(16,185,129,0.16)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: '#9fd8ba', fontWeight: 600 }}>数量输入</div>
              <div style={{ fontSize: 11, color: '#678b77' }}>{preset.unit}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(16,185,129,0.22)'
              }}>
                <ArrowRight size={14} color="#34d399" />
                <input
                  type="number" min="0" step="any" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#ecfdf5', fontSize: 15, fontWeight: 600, letterSpacing: -0.01,
                  }}
                />
                <div style={{ fontSize: 12, color: '#678b77' }}>{preset.unit}</div>
              </div>
            </div>
            {/* Quick amounts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
              {preset.unit === '餐' || preset.unit === '部' || preset.unit === '台' || preset.unit === '杯' || preset.unit === '本' || preset.unit === '件'
                ? ['1', '2', '3', '5'].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    style={{
                      padding: '7px 6px', borderRadius: 8, cursor: 'pointer',
                      background: amount === v ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${amount === v ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.06)'}`,
                      color: amount === v ? '#a7f3d0' : '#9fb6a8',
                      fontSize: 12, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}>{v} {preset.unit}</button>
                ))
                : ['1', '10', '50', '100'].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    style={{
                      padding: '7px 6px', borderRadius: 8, cursor: 'pointer',
                      background: amount === v ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${amount === v ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.06)'}`,
                      color: amount === v ? '#a7f3d0' : '#9fb6a8',
                      fontSize: 12, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}>{v}</button>
                ))
              }
            </div>
            <div style={{
              padding: 12, borderRadius: 10,
              background: computedCO2 === 0
                ? 'linear-gradient(90deg, rgba(16,185,129,0.14), rgba(20,184,166,0.14))'
                : 'linear-gradient(90deg, rgba(234,179,8,0.1), rgba(239,68,68,0.08))',
              border: `1px solid ${computedCO2 === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <div>
                <div style={{ fontSize: 11, color: computedCO2 === 0 ? '#6ee7b7' : '#fcd34d', marginBottom: 3 }}>
                  {computedCO2 === 0 ? '🌿 恭喜，零碳活动！' : '本次活动碳足迹'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.02, color: computedCO2 === 0 ? '#34d399' : '#fef3c7' }}>
                  {formatCO2(computedCO2)}
                  <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, color: '#678b77' }}>CO₂e</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {computedCO2 > 0 && (
                  <>
                    <div style={{ fontSize: 10.5, color: '#678b77' }}>≈ 需种树抵消</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a7f3d0' }}>{equivalentTrees(computedCO2)} 棵/年</div>
                  </>
                )}
              </div>
            </div>
            <input
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={'添加备注（可选：如"上班通勤""周末自驾"等）'}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9, marginBottom: 12,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#d6ebe0', fontSize: 12, outline: 'none'
              }}
            />
            <button onClick={handleAdd}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 11, cursor: 'pointer',
                border: 'none', color: '#fff',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                fontSize: 13.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 26px rgba(16,185,129,0.35)',
                transition: 'transform 0.15s',
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
            >
              <Plus size={16} /> 记录到碳足迹
            </button>
          </div>

          <div style={{
            marginTop: 16, padding: 12, borderRadius: 12,
            background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)',
            fontSize: 11.5, color: '#8bafa0', lineHeight: 1.65
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5eead4', fontWeight: 600, marginBottom: 5 }}>
              <Info size={13} /> 数据说明
            </div>
            排放因子参考自 IPCC、中国碳核算数据库与环保公开研究结果，为近似教育参考值。不同车型/地区/饮食习惯会有差异。
          </div>
        </div>

        {/* Right: History + Analytics */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{
            padding: '14px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              {([['today', '今日'], ['7d', '近 7 天'], ['30d', '近 30 天'], ['all', '全部']] as const).map(([k, l]) => {
                const isActive = historyTab === k
                return (
                  <button key={k} onClick={() => setHistoryTab(k as typeof historyTab)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                      background: isActive ? 'linear-gradient(135deg,#10b981,#14b8a6)' : 'transparent',
                      color: isActive ? '#fff' : '#9fb6a8',
                      border: 'none',
                      fontSize: 12, fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.15s'
                    }}>{l}</button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <TrendingDown size={14} color="#6ee7b7" />
                <div>
                  <div style={{ fontSize: 10, color: '#678b77' }}>本时段总排放</div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#a7f3d0', letterSpacing: -0.01 }}>
                    {formatCO2(rangeTotal)}
                    <span style={{ fontSize: 10.5, fontWeight: 500, marginLeft: 4, color: '#678b77' }}>CO₂e</span>
                  </div>
                </div>
              </div>
              {activities.length > 0 && (
                <button onClick={handleClearAll}
                  style={{
                    padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#fca5a5', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  <Trash2 size={13} /> 清空
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
            {/* Category breakdown */}
            <div style={{ width: 320, flexShrink: 0, padding: '16px 20px 20px', borderRight: '1px solid rgba(16,185,129,0.06)', overflowY: 'auto' }}>
              <div style={{ fontSize: 12, color: '#678b77', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <PieChart size={14} /> 分类排放分布
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CATEGORIES.map(c => {
                  const v = categorySplit[c.key]
                  const pct = rangeTotal > 0 ? (v / rangeTotal) * 100 : 0
                  return (
                    <div key={c.key}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 999, background: `linear-gradient(135deg, ${c.accent})`, boxShadow: `0 0 8px ${c.accent.includes('emerald') ? '#10b98144' : '#8b5cf644'}` }} />
                          <span style={{ fontSize: 12, color: '#c0d2c8', fontWeight: 500 }}>{c.name}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9fb6a8' }}>
                          <span style={{ fontWeight: 700, color: '#a7f3d0' }}>{formatCO2(v)}</span>
                          <span style={{ color: '#5f806e', marginLeft: 6 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 999,
                          background: `linear-gradient(90deg, ${c.accent})`,
                          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {rangeTotal > 0 && (
                <div style={{
                  marginTop: 20, padding: 14, borderRadius: 12,
                  background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
                  border: '1px solid rgba(16,185,129,0.18)'
                }}>
                  <div style={{ fontSize: 11.5, color: '#6ee7b7', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={13} /> 等价值换算
                  </div>
                  <div style={{ fontSize: 12.5, color: '#d6ebe0', lineHeight: 1.9 }}>
                    🌱 约 <b style={{ color: '#a7f3d0' }}>{equivalentTrees(rangeTotal)}</b> 棵树木一年的碳汇<br />
                    🚗 油车行驶 <b style={{ color: '#a7f3d0' }}>{equivalentKmByCar(rangeTotal).toLocaleString()}</b> 公里<br />
                    💡 约 <b style={{ color: '#a7f3d0' }}>{Math.round(rangeTotal / 0.581).toLocaleString()}</b> 度家庭用电
                  </div>
                </div>
              )}

              {/* Bar of max category */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11.5, color: '#678b77', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart3 size={13} /> 类别相对量级
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CATEGORIES.map(c => {
                    const v = categorySplit[c.key]
                    const h = rangeMax > 0 ? Math.max(4, (v / rangeMax) * 120) : 4
                    return (
                      <div key={c.key} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130 }}>
                        <div style={{ width: 34, fontSize: 10, color: '#5f806e' }}>{c.name.slice(0, 2)}</div>
                        <div style={{
                          flex: 1, height: h, borderRadius: 6,
                          background: `linear-gradient(180deg, ${c.accent})`,
                          opacity: v > 0 ? 0.95 : 0.2,
                          transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)',
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                          paddingTop: 4,
                          color: 'rgba(255,255,255,0.9)', fontSize: 10.5, fontWeight: 700,
                        }}>{v > 0 ? (v >= 1 ? `${v.toFixed(1)}kg` : `${(v * 1000).toFixed(0)}g`) : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Activity list */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '14px 20px 10px', fontSize: 11.5, color: '#678b77',
                fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={13} /> 活动记录
                  <span style={{ color: '#5f806e', fontWeight: 500 }}>· {filteredHistory.length} 条</span>
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
                {filteredHistory.length === 0 ? (
                  <div style={{
                    height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#678b77', textAlign: 'center', padding: 20
                  }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', marginBottom: 16,
                      background: 'radial-gradient(circle at 30% 30%, rgba(16,185,129,0.2), transparent 70%)',
                      border: '1px dashed rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Leaf size={30} color="#34d399" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#a7f3d0', marginBottom: 6 }}>还没有记录</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, maxWidth: 380 }}>
                      从左侧选择活动类型并输入数量，点击「记录到碳足迹」开始量化你的日常生活。<br />
                      每一次绿色选择，都是送给地球的一份礼物 🌳
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredHistory.map((a, idx) => {
                      const c = CATEGORIES.find(x => x.key === a.category)
                      const preset = PRESETS[a.category].find(p => p.type === a.type)
                      const date = new Date(a.timestamp)
                      return (
                        <div key={a.id} style={{
                          animation: `ecoFadeUp 0.35s ${idx * 25}ms cubic-bezier(0.4,0,0.2,1) both`,
                          padding: 14, borderRadius: 13,
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', gap: 12,
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.22)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = '' }}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                            background: preset?.color ? `${preset.color}22` : 'rgba(16,185,129,0.12)',
                            border: `1px solid ${preset?.color ? preset.color + '55' : 'rgba(16,185,129,0.25)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: preset?.color || '#34d399'
                          }}>
                            {preset?.icon ?? c?.icon ?? <Leaf size={18} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#d6ebe0' }}>{a.label}</div>
                              <span style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: 10,
                                background: c ? `linear-gradient(90deg, ${c.accent})` : 'rgba(16,185,129,0.2)',
                                color: '#fff', fontWeight: 600
                              }}>{c?.name}</span>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#678b77', lineHeight: 1.55 }}>
                              <b style={{ color: '#9fd8ba' }}>{a.amount} {a.unit}</b>
                              {a.note && <> · <span style={{ color: '#8bafa0' }}>{a.note}</span></>}
                              <span style={{ marginLeft: 10, color: '#5f806e' }}>
                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginRight: 4 }}>
                            <div style={{
                              fontSize: 15, fontWeight: 800, letterSpacing: -0.01,
                              color: a.co2 === 0 ? '#34d399' : '#fcd34d'
                            }}>{formatCO2(a.co2)}</div>
                            <div style={{ fontSize: 10, color: '#678b77', marginTop: 1 }}>CO₂e</div>
                          </div>
                          <button onClick={() => handleDelete(a.id)} title="删除该条"
                            style={{
                              padding: 7, borderRadius: 8, cursor: 'pointer',
                              background: 'transparent', border: 'none',
                              color: '#5f806e',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ''; (e.currentTarget as HTMLElement).style.background = ''; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ecoFadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, sub, tone, meter }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tone: string; meter?: number
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 13,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', right: -12, top: -12, width: 56, height: 56, borderRadius: '50%',
        background: `radial-gradient(circle, ${tone}33 0%, transparent 70%)`
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `${tone}22`, color: tone,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{icon}</div>
        <span style={{ fontSize: 11, color: '#7a9689', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.02, color: '#e6ffe9', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: '#678b77', marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
      {typeof meter === 'number' && (
        <div style={{ marginTop: 9, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            width: `${meter}%`, height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${tone}, ${tone}cc)`,
            transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)'
          }} />
        </div>
      )}
    </div>
  )
}
