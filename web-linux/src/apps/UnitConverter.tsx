import { useState, useMemo, useCallback, type FC } from 'react'
import { SearchIcon, CopyIcon, ClockIcon, CheckIcon } from '../icons'

/* ==================== 类型定义 ==================== */

interface UnitDef {
  key: string
  label: string
  short: string
}

interface CategoryDef {
  key: string
  label: string
  color: string
  icon: string
  units: UnitDef[]
}

interface ConversionHistoryItem {
  id: number
  category: string
  fromValue: string
  fromUnit: string
  toValue: string
  toUnit: string
  timestamp: number
}

/* ==================== 单位数据 ==================== */

const CATEGORIES: CategoryDef[] = [
  {
    key: 'length',
    label: '长度',
    color: '#7c6cf0',
    icon: '📏',
    units: [
      { key: 'mm', label: '毫米', short: 'mm' },
      { key: 'cm', label: '厘米', short: 'cm' },
      { key: 'm', label: '米', short: 'm' },
      { key: 'km', label: '千米', short: 'km' },
      { key: 'inch', label: '英寸', short: 'in' },
      { key: 'ft', label: '英尺', short: 'ft' },
      { key: 'yd', label: '码', short: 'yd' },
      { key: 'mi', label: '英里', short: 'mi' },
      { key: 'nmi', label: '海里', short: 'nmi' },
    ],
  },
  {
    key: 'weight',
    label: '重量',
    color: '#f06c9b',
    icon: '⚖️',
    units: [
      { key: 'mg', label: '毫克', short: 'mg' },
      { key: 'g', label: '克', short: 'g' },
      { key: 'kg', label: '千克', short: 'kg' },
      { key: 't', label: '吨', short: 't' },
      { key: 'oz', label: '盎司', short: 'oz' },
      { key: 'lb', label: '磅', short: 'lb' },
    ],
  },
  {
    key: 'temperature',
    label: '温度',
    color: '#f0a96c',
    icon: '🌡️',
    units: [
      { key: 'c', label: '摄氏度', short: '°C' },
      { key: 'f', label: '华氏度', short: '°F' },
      { key: 'k', label: '开尔文', short: 'K' },
    ],
  },
  {
    key: 'speed',
    label: '速度',
    color: '#6cf0b4',
    icon: '🚀',
    units: [
      { key: 'ms', label: '米/秒', short: 'm/s' },
      { key: 'kmh', label: '千米/时', short: 'km/h' },
      { key: 'mph', label: '英里/时', short: 'mph' },
      { key: 'knot', label: '节', short: 'kn' },
    ],
  },
  {
    key: 'data',
    label: '数据存储',
    color: '#6cb4f0',
    icon: '💾',
    units: [
      { key: 'b', label: '字节', short: 'B' },
      { key: 'kb', label: 'KB', short: 'KB' },
      { key: 'mb', label: 'MB', short: 'MB' },
      { key: 'gb', label: 'GB', short: 'GB' },
      { key: 'tb', label: 'TB', short: 'TB' },
      { key: 'pb', label: 'PB', short: 'PB' },
    ],
  },
  {
    key: 'time',
    label: '时间',
    color: '#c86cf0',
    icon: '⏱️',
    units: [
      { key: 's', label: '秒', short: 's' },
      { key: 'min', label: '分', short: 'min' },
      { key: 'h', label: '时', short: 'h' },
      { key: 'd', label: '天', short: 'd' },
      { key: 'w', label: '周', short: 'w' },
      { key: 'mo', label: '月', short: 'mo' },
      { key: 'y', label: '年', short: 'y' },
    ],
  },
  {
    key: 'area',
    label: '面积',
    color: '#f0dc6c',
    icon: '📐',
    units: [
      { key: 'sqmm', label: '平方毫米', short: 'mm²' },
      { key: 'sqcm', label: '平方厘米', short: 'cm²' },
      { key: 'sqm', label: '平方米', short: 'm²' },
      { key: 'sqkm', label: '平方千米', short: 'km²' },
      { key: 'ha', label: '公顷', short: 'ha' },
      { key: 'acre', label: '英亩', short: 'ac' },
      { key: 'sqmi', label: '平方英里', short: 'mi²' },
    ],
  },
]

/* ==================== 转换系数（基于基准单位） ==================== */

// 长度基准: 米
const LENGTH_TO_BASE: Record<string, number> = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  inch: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852,
}

// 重量基准: 千克
const WEIGHT_TO_BASE: Record<string, number> = {
  mg: 0.000001, g: 0.001, kg: 1, t: 1000,
  oz: 0.0283495, lb: 0.453592,
}

// 速度基准: 米/秒
const SPEED_TO_BASE: Record<string, number> = {
  ms: 1, kmh: 1 / 3.6, mph: 0.44704, knot: 0.514444,
}

// 数据存储基准: 字节
const DATA_TO_BASE: Record<string, number> = {
  b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3,
  tb: 1024 ** 4, pb: 1024 ** 5,
}

// 时间基准: 秒
const TIME_TO_BASE: Record<string, number> = {
  s: 1, min: 60, h: 3600, d: 86400,
  w: 604800, mo: 2629746, y: 31556952,
}

// 面积基准: 平方米
const AREA_TO_BASE: Record<string, number> = {
  sqmm: 0.000001, sqcm: 0.0001, sqm: 1, sqkm: 1000000,
  ha: 10000, acre: 4046.8564224, sqmi: 2589988.110336,
}

/* ==================== 转换函数 ==================== */

function convert(
  category: string,
  fromUnit: string,
  toUnit: string,
  value: number
): number {
  if (fromUnit === toUnit) return value

  if (category === 'temperature') {
    return convertTemperature(fromUnit, toUnit, value)
  }

  const tables: Record<string, Record<string, number>> = {
    length: LENGTH_TO_BASE,
    weight: WEIGHT_TO_BASE,
    speed: SPEED_TO_BASE,
    data: DATA_TO_BASE,
    time: TIME_TO_BASE,
    area: AREA_TO_BASE,
  }

  const table = tables[category]
  if (!table) return NaN

  const baseValue = value * (table[fromUnit] ?? 1)
  return baseValue / (table[toUnit] ?? 1)
}

function convertTemperature(from: string, to: string, value: number): number {
  if (from === to) return value

  // 先转换为摄氏度
  let celsius: number
  switch (from) {
    case 'c': celsius = value; break
    case 'f': celsius = (value - 32) * 5 / 9; break
    case 'k': celsius = value - 273.15; break
    default: return NaN
  }

  // 再从摄氏度转换为目标
  switch (to) {
    case 'c': return celsius
    case 'f': return celsius * 9 / 5 + 32
    case 'k': return celsius + 273.15
    default: return NaN
  }
}

/* ==================== 快捷转换预设 ==================== */

const QUICK_PRESETS: Record<string, Array<{ from: string; to: string; label: string }>> = {
  length: [
    { from: 'km', to: 'mi', label: '千米→英里' },
    { from: 'cm', to: 'inch', label: '厘米→英寸' },
    { from: 'm', to: 'ft', label: '米→英尺' },
    { from: 'nmi', to: 'km', label: '海里→千米' },
  ],
  weight: [
    { from: 'kg', to: 'lb', label: '千克→磅' },
    { from: 'oz', to: 'g', label: '盎司→克' },
    { from: 't', to: 'kg', label: '吨→千克' },
  ],
  temperature: [
    { from: 'c', to: 'f', label: '°C→°F' },
    { from: 'f', to: 'c', label: '°F→°C' },
    { from: 'c', to: 'k', label: '°C→K' },
  ],
  speed: [
    { from: 'kmh', to: 'mph', label: 'km/h→mph' },
    { from: 'ms', to: 'kmh', label: 'm/s→km/h' },
    { from: 'knot', to: 'kmh', label: '节→km/h' },
  ],
  data: [
    { from: 'gb', to: 'mb', label: 'GB→MB' },
    { from: 'tb', to: 'gb', label: 'TB→GB' },
    { from: 'mb', to: 'kb', label: 'MB→KB' },
  ],
  time: [
    { from: 'h', to: 'min', label: '时→分' },
    { from: 'd', to: 'h', label: '天→时' },
    { from: 'w', to: 'd', label: '周→天' },
  ],
  area: [
    { from: 'ha', to: 'acre', label: '公顷→英亩' },
    { from: 'sqkm', to: 'ha', label: 'km²→公顷' },
    { from: 'sqm', to: 'sqcm', label: 'm²→cm²' },
  ],
}

/* ==================== Swap 图标（内联SVG） ==================== */

const SwapIcon: FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 16l-4-4 4-4" />
    <path d="M17 8l4 4-4 4" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
)

/* ==================== 格式化数字 ==================== */

function formatResult(value: number): string {
  if (Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return '∞'
  const abs = Math.abs(value)
  if (abs === 0) return '0'
  if (abs >= 1e15 || abs < 1e-10) return value.toExponential(6)
  if (abs >= 1e9) return value.toFixed(2)
  if (abs >= 1e6) return value.toFixed(4)
  if (abs >= 1) return value.toFixed(8).replace(/\.?0+$/, '')
  return value.toFixed(10).replace(/\.?0+$/, '')
}

/* ==================== 主组件 ==================== */

const UnitConverter: FC = () => {
  const [activeCategory, setActiveCategory] = useState('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')
  const [fromValue, setFromValue] = useState('1')
  const [activeSide, setActiveSide] = useState<'from' | 'to'>('from')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [history, setHistory] = useState<ConversionHistoryItem[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [historyIdCounter, setHistoryIdCounter] = useState(0)
  const [inputFocused, setInputFocused] = useState(false)

  const currentCategory = useMemo(
    () => CATEGORIES.find(c => c.key === activeCategory)!,
    [activeCategory]
  )

  // 当切换类别时，重置单位选择
  const handleCategoryChange = useCallback((catKey: string) => {
    setActiveCategory(catKey)
    const cat = CATEGORIES.find(c => c.key === catKey)
    if (cat && cat.units.length >= 2) {
      setFromUnit(cat.units[0].key)
      setToUnit(cat.units[1].key)
      setFromValue('1')
    }
    setSearchQuery('')
    setShowSearch(false)
  }, [])

  // 过滤可搜索的单位
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return currentCategory.units
    const q = searchQuery.toLowerCase()
    return currentCategory.units.filter(
      u => u.label.toLowerCase().includes(q) ||
        u.short.toLowerCase().includes(q) ||
        u.key.toLowerCase().includes(q)
    )
  }, [currentCategory, searchQuery])

  // 计算转换结果
  const result = useMemo(() => {
    const num = parseFloat(fromValue)
    if (isNaN(num) || fromValue.trim() === '') return ''
    return formatResult(convert(activeCategory, fromUnit, toUnit, num))
  }, [activeCategory, fromUnit, toUnit, fromValue])

  // 交换按钮
  const handleSwap = useCallback(() => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }, [fromUnit, toUnit])

  // 快捷按钮
  const handleQuickPreset = useCallback((from: string, to: string) => {
    setFromUnit(from)
    setToUnit(to)
  }, [])

  // 选择单位
  const handleSelectUnit = useCallback((unitKey: string, side: 'from' | 'to') => {
    if (side === 'from') {
      setFromUnit(unitKey)
    } else {
      setToUnit(unitKey)
    }
    setShowSearch(false)
    setSearchQuery('')
  }, [])

  // 复制结果
  const handleCopy = useCallback(async (text: string, id?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (id !== undefined) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 1500)
      } else {
        setCopiedId(-1)
        setTimeout(() => setCopiedId(null), 1500)
      }
    } catch {
      // clipboard API 不可用时静默失败
    }
  }, [])

  // 添加历史记录
  const addToHistory = useCallback(() => {
    const num = parseFloat(fromValue)
    if (isNaN(num) || fromValue.trim() === '' || !result) return

    const fromUnitDef = currentCategory.units.find(u => u.key === fromUnit)
    const toUnitDef = currentCategory.units.find(u => u.key === toUnit)

    setHistoryIdCounter(prev => {
      const newId = prev + 1
      setHistory(prev => {
        const newItem: ConversionHistoryItem = {
          id: newId,
          category: currentCategory.label,
          fromValue: fromValue,
          fromUnit: fromUnitDef?.short ?? fromUnit,
          toValue: result,
          toUnit: toUnitDef?.short ?? toUnit,
          timestamp: Date.now(),
        }
        return [newItem, ...prev].slice(0, 10)
      })
      return newId
    })
  }, [fromValue, fromUnit, toUnit, result, currentCategory])

  // 获取当前类别颜色
  const catColor = currentCategory.color

  // 单位选择下拉框渲染
  const renderUnitSelector = (side: 'from' | 'to') => {
    const selectedKey = side === 'from' ? fromUnit : toUnit
    const selectedUnit = currentCategory.units.find(u => u.key === selectedKey)

    return (
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          onClick={() => {
            setActiveSide(side)
            setShowSearch(true)
            setSearchQuery('')
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--bg-tertiary, #16213e)',
            border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
            borderRadius: '10px',
            color: 'var(--text-primary, #e0e0e8)',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = catColor)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedUnit?.label ?? selectedKey} ({selectedUnit?.short ?? selectedKey})
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showSearch && activeSide === side && (
          <>
            {/* 遮罩 */}
            <div
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 99,
              }}
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
            />
            {/* 下拉面板 */}
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'var(--bg-secondary, #1a1a2e)',
                border: '1px solid var(--window-border, rgba(255,255,255,0.12))',
                borderRadius: '10px',
                zIndex: 100,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
            >
              {/* 搜索框 */}
              <div style={{ padding: '8px', borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'var(--bg-primary, #0f0f1a)',
                  borderRadius: '8px',
                }}>
                  <SearchIcon size={14} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索单位..."
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary, #e0e0e8)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
              {/* 单位列表 */}
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredUnits.length === 0 && (
                  <div style={{
                    padding: '12px 14px',
                    color: 'var(--text-secondary, #9090a4)',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}>
                    未找到匹配的单位
                  </div>
                )}
                {filteredUnits.map(unit => {
                  const isSelected = unit.key === selectedKey
                  return (
                    <button
                      key={unit.key}
                      onClick={() => handleSelectUnit(unit.key, side)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: isSelected ? `${catColor}22` : 'transparent',
                        border: 'none',
                        color: isSelected ? catColor : 'var(--text-primary, #e0e0e8)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span>{unit.label}</span>
                      <span style={{
                        color: 'var(--text-secondary, #9090a4)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}>
                        {unit.short}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const fromUnitDef = currentCategory.units.find(u => u.key === fromUnit)
  const toUnitDef = currentCategory.units.find(u => u.key === toUnit)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary, #0f0f1a)',
      color: 'var(--text-primary, #e0e0e8)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      borderRadius: 'var(--window-radius, 12px)',
    }}>
      {/* 顶部类别选择栏 */}
      <div style={{
        padding: '12px 16px 0',
        borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        background: 'var(--bg-secondary, #1a1a2e)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '12px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {CATEGORIES.map(cat => {
            const isActive = cat.key === activeCategory
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isActive ? cat.color : 'var(--window-border, rgba(255,255,255,0.08))',
                  background: isActive ? `${cat.color}22` : 'transparent',
                  color: isActive ? cat.color : 'var(--text-secondary, #9090a4)',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = `${cat.color}66`
                    e.currentTarget.style.color = cat.color
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.color = ''
                  }
                }}
              >
                <span style={{ fontSize: '13px' }}>{cat.icon}</span>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* 快捷转换按钮 */}
        <div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-secondary, #9090a4)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
          }}>
            快捷转换
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(QUICK_PRESETS[activeCategory] || []).map(preset => (
              <button
                key={`${preset.from}-${preset.to}`}
                onClick={() => handleQuickPreset(preset.from, preset.to)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
                  background: 'var(--bg-tertiary, #16213e)',
                  color: 'var(--text-secondary, #9090a4)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = catColor
                  e.currentTarget.style.color = catColor
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.color = ''
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 转换区域 */}
        <div style={{
          background: 'var(--bg-secondary, #1a1a2e)',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        }}>
          {/* 从单位选择 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary, #9090a4)',
              marginBottom: '6px',
              fontWeight: 500,
            }}>
              从
            </div>
            {renderUnitSelector('from')}
          </div>

          {/* 数值输入 */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              inputMode="decimal"
              value={fromValue}
              onChange={e => {
                const val = e.target.value
                if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                  setFromValue(val)
                }
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => { setInputFocused(false); addToHistory() }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--bg-primary, #0f0f1a)',
                border: '2px solid',
                borderColor: inputFocused ? catColor : `${catColor}33`,
                borderRadius: '10px',
                color: 'var(--text-primary, #e0e0e8)',
                fontSize: '22px',
                fontWeight: 600,
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              placeholder="输入数值..."
            />
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary, #9090a4)',
              marginTop: '4px',
              paddingLeft: '4px',
            }}>
              {fromUnitDef?.label} ({fromUnitDef?.short})
            </div>
          </div>

          {/* 交换按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <button
              onClick={handleSwap}
              title="交换单位"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `2px solid ${catColor}44`,
                background: `${catColor}15`,
                color: catColor,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${catColor}33`
                e.currentTarget.style.transform = 'rotate(180deg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${catColor}15`
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
            >
              <SwapIcon size={20} color={catColor} />
            </button>
          </div>

          {/* 到单位选择 */}
          <div style={{ marginTop: '12px', marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary, #9090a4)',
              marginBottom: '6px',
              fontWeight: 500,
            }}>
              到
            </div>
            {renderUnitSelector('to')}
          </div>

          {/* 结果显示 */}
          <div style={{
            background: 'var(--bg-primary, #0f0f1a)',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: result && result.length > 20 ? '20px' : '28px',
                  fontWeight: 700,
                  color: catColor,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {result || '—'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #9090a4)',
                  marginTop: '4px',
                }}>
                  {toUnitDef?.label} ({toUnitDef?.short})
                </div>
              </div>
              {result && result !== '—' && (
                <button
                  onClick={() => handleCopy(result)}
                  title="复制结果"
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: copiedId === -1 ? '#4caf5033' : 'var(--bg-tertiary, #16213e)',
                    color: copiedId === -1 ? '#4caf50' : 'var(--text-secondary, #9090a4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {copiedId === -1 ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </button>
              )}
            </div>
            {/* 转换公式 */}
            {fromValue && result && result !== '—' && (
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--window-border, rgba(255,255,255,0.06))',
                fontSize: '12px',
                color: 'var(--text-secondary, #9090a4)',
              }}>
                {fromValue} {fromUnitDef?.short} = {result} {toUnitDef?.short}
              </div>
            )}
          </div>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}>
              <ClockIcon size={14} />
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary, #9090a4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
              }}>
                最近转换记录
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {history.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary, #1a1a2e)',
                    borderRadius: '8px',
                    border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
                    gap: '8px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-primary, #e0e0e8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{ color: catColor, fontWeight: 600 }}>{item.fromValue}</span>
                      {' '}{item.fromUnit}
                      {' → '}
                      <span style={{ color: catColor, fontWeight: 600 }}>{item.toValue}</span>
                      {' '}{item.toUnit}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary, #9090a4)',
                      marginTop: '2px',
                    }}>
                      {item.category} · {new Date(item.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(`${item.fromValue} ${item.fromUnit} = ${item.toValue} ${item.toUnit}`, item.id)}
                    title="复制"
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      color: copiedId === item.id ? '#4caf50' : 'var(--text-secondary, #9090a4)',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {copiedId === item.id ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnitConverter
