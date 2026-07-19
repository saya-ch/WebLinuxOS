import { useState, useMemo, useEffect, useCallback } from 'react'

/**
 * CronLab
 *
 * Cron 表达式实验室：构建、解释、计算下次触发时间。
 *
 * 功能：
 *  1. 可视化构建器：分（minute/hour/day/month/weekday）独立配置
 *  2. 人类可读解释：将 cron 表达式翻译为自然语言
 *  3. 下次触发预览：枚举未来 N 次触发时间
 *  4. 常用预设：每分钟、每小时、每天、每周、每月、工作日等
 *  5. 表达式校验：实时检查语法并提示错误
 *
 * 全部本地计算，无外部依赖。
 */

type CronPart = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

interface ParsedField {
  // 每个字段被解析后的可能取值集合（数字集合）
  values: Set<number>
  // 错误信息
  error?: string
}

const FIELD_RANGES: Record<CronPart, { min: number; max: number; label: string; altNames?: string[] }> = {
  minute: { min: 0, max: 59, label: '分钟' },
  hour: { min: 0, max: 23, label: '小时' },
  dayOfMonth: { min: 1, max: 31, label: '日' },
  month: { min: 1, max: 12, label: '月', altNames: ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] },
  dayOfWeek: { min: 0, max: 7, label: '周', altNames: ['sun','mon','tue','wed','thu','fri','sat'] },
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const PRESETS: { name: string; expr: string; desc: string }[] = [
  { name: '每分钟', expr: '* * * * *', desc: '每分钟执行一次' },
  { name: '每 5 分钟', expr: '*/5 * * * *', desc: '每 5 分钟执行一次' },
  { name: '每小时整点', expr: '0 * * * *', desc: '每小时整点执行' },
  { name: '每天 0:00', expr: '0 0 * * *', desc: '每天凌晨执行' },
  { name: '每天 9:00', expr: '0 9 * * *', desc: '每天上午 9 点执行' },
  { name: '工作日 9:00', expr: '0 9 * * 1-5', desc: '周一至周五 9 点执行' },
  { name: '每周日 0:00', expr: '0 0 * * 0', desc: '每周日凌晨执行' },
  { name: '每月 1 日 0:00', expr: '0 0 1 * *', desc: '每月 1 号凌晨执行' },
  { name: '每季度', expr: '0 0 1 */3 *', desc: '每季度首月 1 号执行' },
  { name: '每年 1 月 1 日', expr: '0 0 1 1 *', desc: '每年 1 月 1 日执行' },
  { name: '每 30 分钟', expr: '*/30 * * * *', desc: '每 30 分钟执行' },
  { name: '工作日 18:30', expr: '30 18 * * 1-5', desc: '工作日下午 6:30 执行' },
]

function parseField(expr: string, part: CronPart): ParsedField {
  const range = FIELD_RANGES[part]
  const result = new Set<number>()
  if (!expr) return { values: result, error: '空字段' }
  // 处理别名（mon, tue 等）
  let normalized = expr.toLowerCase()
  if (range.altNames) {
    range.altNames.forEach((name, idx) => {
      normalized = normalized.replace(new RegExp(`\\b${name}\\b`, 'g'), String(idx))
    })
  }
  // 处理 L（最后一天）和 W（最近工作日）- 仅 dayOfMonth 支持
  if (part === 'dayOfMonth' && /L|W/.test(normalized)) {
    // 简化处理：返回所有 1-31，并标注支持 L/W
    for (let i = range.min; i <= range.max; i++) result.add(i)
    return { values: result }
  }
  // 处理 #（第 N 个周X）- 仅 dayOfWeek 支持
  if (part === 'dayOfWeek' && normalized.includes('#')) {
    const [dayStr] = normalized.split('#')
    const day = parseInt(dayStr, 10)
    if (!isNaN(day)) {
      // 7 等同于 0（周日）
      result.add(day === 7 ? 0 : day)
      return { values: result }
    }
  }

  const parts = normalized.split(',')
  for (const p of parts) {
    // 步进值：*/N 或 a-b/N
    const stepMatch = p.match(/^(\*|\d+-\d+)\/(\d+)$/)
    if (stepMatch) {
      const [, range_, stepStr] = stepMatch
      const step = parseInt(stepStr, 10)
      if (step <= 0) return { values: result, error: `步进值必须 > 0（"${p}"）` }
      const [start, end] = range_ === '*' ? [range.min, range.max] : range_.split('-').map(Number)
      if (isNaN(start) || isNaN(end) || start > end) return { values: result, error: `范围无效: "${p}"` }
      for (let i = start; i <= end; i += step) {
        if (i < range.min || i > range.max) return { values: result, error: `值 ${i} 超出${range.label}范围` }
        result.add(i)
      }
      continue
    }
    // 范围：a-b
    const rangeMatch = p.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const [, aStr, bStr] = rangeMatch
      const a = parseInt(aStr, 10)
      const b = parseInt(bStr, 10)
      if (a > b) return { values: result, error: `范围起始 > 结束: "${p}"` }
      for (let i = a; i <= b; i++) {
        if (i < range.min || i > range.max) return { values: result, error: `${i} 超出${range.label}范围 (${range.min}-${range.max})` }
        result.add(i)
      }
      continue
    }
    // 通配符
    if (p === '*') {
      for (let i = range.min; i <= range.max; i++) result.add(i)
      continue
    }
    // 单个数字
    const num = parseInt(p, 10)
    if (isNaN(num)) return { values: result, error: `无法解析: "${p}"` }
    // dayOfWeek: 7 等同于 0（周日）
    const normalizedNum = part === 'dayOfWeek' && num === 7 ? 0 : num
    if (normalizedNum < range.min || normalizedNum > range.max) {
      return { values: result, error: `${num} 超出${range.label}范围 (${range.min}-${range.max})` }
    }
    result.add(normalizedNum)
  }
  return { values: result }
}

interface ParsedCron {
  minute: ParsedField
  hour: ParsedField
  dayOfMonth: ParsedField
  month: ParsedField
  dayOfWeek: ParsedField
  error?: string
}

function parseCron(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return {
      minute: { values: new Set() },
      hour: { values: new Set() },
      dayOfMonth: { values: new Set() },
      month: { values: new Set() },
      dayOfWeek: { values: new Set() },
      error: `Cron 表达式应为 5 段（minute hour day month weekday），当前为 ${parts.length} 段`,
    }
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  const parsed = {
    minute: parseField(minute, 'minute'),
    hour: parseField(hour, 'hour'),
    dayOfMonth: parseField(dayOfMonth, 'dayOfMonth'),
    month: parseField(month, 'month'),
    dayOfWeek: parseField(dayOfWeek, 'dayOfWeek'),
  }
  for (const key of Object.keys(parsed) as CronPart[]) {
    if (parsed[key].error) {
      return { ...parsed, error: `${FIELD_RANGES[key].label}字段: ${parsed[key].error}` }
    }
  }
  return parsed
}

function explainCron(parsed: ParsedCron): string {
  if (parsed.error) return `无效表达式: ${parsed.error}`

  const explainField = (field: ParsedField, part: CronPart): string => {
    const range = FIELD_RANGES[part]
    const values = Array.from(field.values).sort((a, b) => a - b)
    // 通配
    if (values.length === range.max - range.min + 1) {
      if (part === 'dayOfWeek' && values.length === 8) return '每天'
      return part === 'minute' ? '每分钟' : part === 'hour' ? '每小时' : `每${range.label}`
    }
    // 步进检测
    if (values.length >= 2) {
      const step = values[1] - values[0]
      const isArithmetic = values.every((v, i) => i === 0 || v - values[i - 1] === step)
      if (isArithmetic && step > 1) {
        return `每 ${step} ${range.label}（从 ${formatValue(values[0], part)} 开始）`
      }
    }
    if (values.length > 5) {
      return `${formatValue(values[0], part)} 到 ${formatValue(values[values.length - 1], part)}`
    }
    return values.map((v) => formatValue(v, part)).join('、')
  }

  const minuteStr = explainField(parsed.minute, 'minute')
  const hourStr = explainField(parsed.hour, 'hour')
  const dayOfMonthStr = explainField(parsed.dayOfMonth, 'dayOfMonth')
  const monthStr = explainField(parsed.month, 'month')
  const dayOfWeekStr = explainField(parsed.dayOfWeek, 'dayOfWeek')

  const allDays = parsed.dayOfMonth.values.size === 32 // 1-31
  const allWeekdays = parsed.dayOfWeek.values.size >= 7 // 0-6 或 0-7
  const allMonths = parsed.month.values.size === 12

  // 组合
  const parts: string[] = []
  // 时间部分
  if (parsed.minute.values.size === 60 && parsed.hour.values.size === 24) {
    parts.push('每分钟执行')
  } else if (parsed.minute.values.size === 60) {
    parts.push(`每小时的${hourStr}时每分钟执行`)
  } else if (parsed.hour.values.size === 24) {
    parts.push(`每小时的${minuteStr}分执行`)
  } else {
    parts.push(`在${hourStr}时${minuteStr}分执行`)
  }
  // 日期部分
  if (!allDays || !allWeekdays) {
    if (!allDays && allWeekdays) {
      parts.push(`每月${dayOfMonthStr}日`)
    } else if (allDays && !allWeekdays) {
      parts.push(`每${dayOfWeekStr}`)
    } else if (!allDays && !allWeekdays) {
      parts.push(`每月${dayOfMonthStr}日 且为${dayOfWeekStr}`)
    }
  }
  // 月份部分
  if (!allMonths) {
    parts.push(`${monthStr}月`)
  }

  return parts.join('，')
}

function formatValue(v: number, part: CronPart): string {
  if (part === 'dayOfWeek') return WEEKDAY_NAMES[v] || String(v)
  if (part === 'month') return MONTH_NAMES[v - 1] || String(v)
  return String(v)
}

// 计算下次触发时间（朴素实现：从当前时间起逐分钟扫描）
function nextRuns(parsed: ParsedCron, count: number, from: Date = new Date()): Date[] {
  if (parsed.error) return []
  const result: Date[] = []
  // 从下一分钟开始
  const start = new Date(from.getTime() + 60 * 1000)
  start.setSeconds(0, 0)
  const limit = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) // 一年内
  let cursor = new Date(start)
  while (result.length < count && cursor < limit) {
    const month = cursor.getMonth() + 1 // 1-12
    const day = cursor.getDate()
    const weekday = cursor.getDay() // 0-6 (周日=0)
    const hour = cursor.getHours()
    const minute = cursor.getMinutes()
    if (
      parsed.month.values.has(month) &&
      parsed.dayOfMonth.values.has(day) &&
      parsed.dayOfWeek.values.has(weekday) &&
      parsed.hour.values.has(hour) &&
      parsed.minute.values.has(minute)
    ) {
      // 同时检查 dayOfMonth 和 dayOfWeek：cron 标准是任一满足即可（除非都被显式限制）
      // 这里采用「两者都满足 OR 至少一个为通配」的简化逻辑
      const dayOMAll = parsed.dayOfMonth.values.size === 31
      const dayOWAll = parsed.dayOfWeek.values.size >= 7
      if (dayOMAll || dayOWAll || (parsed.dayOfMonth.values.has(day) && parsed.dayOfWeek.values.has(weekday))) {
        result.push(new Date(cursor))
      }
    }
    // 前进 1 分钟
    cursor = new Date(cursor.getTime() + 60 * 1000)
  }
  return result
}

function formatDateTime(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

const FIVE_FIELDS: { key: CronPart; label: string; description: string; exampleValues: string }[] = [
  { key: 'minute', label: '分', description: '0-59', exampleValues: '0,15,30,45 或 */15' },
  { key: 'hour', label: '时', description: '0-23', exampleValues: '0,12 或 */6' },
  { key: 'dayOfMonth', label: '日', description: '1-31', exampleValues: '1,15 或 *' },
  { key: 'month', label: '月', description: '1-12', exampleValues: '*' },
  { key: 'dayOfWeek', label: '周', description: '0-6 (0=周日)', exampleValues: '*' },
]

export default function CronLab() {
  const [expr, setExpr] = useState('*/5 * * * *')
  const [customField, setCustomField] = useState<Record<CronPart, string>>({
    minute: '*/5',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  })
  const [previewCount, setPreviewCount] = useState(6)

  const parsed = useMemo(() => parseCron(expr), [expr])
  const explanation = useMemo(() => (parsed.error ? '' : explainCron(parsed)), [parsed])
  const nextRunTimes = useMemo(() => nextRuns(parsed, previewCount), [parsed, previewCount])

  // 同步表达式与字段
  const applyExprToFields = useCallback((newExpr: string) => {
    const parts = newExpr.trim().split(/\s+/)
    if (parts.length === 5) {
      setCustomField({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      })
    }
  }, [])

  const applyFieldToExpr = useCallback((field: CronPart, value: string) => {
    const next = { ...customField, [field]: value }
    setCustomField(next)
    setExpr(`${next.minute} ${next.hour} ${next.dayOfMonth} ${next.month} ${next.dayOfWeek}`)
  }, [customField])

  useEffect(() => {
    applyExprToFields(expr)
  }, [expr, applyExprToFields])

  const setQuickStep = (field: CronPart, step: number) => {
    applyFieldToExpr(field, `*/${step}`)
  }

  const setEvery = (field: CronPart) => applyFieldToExpr(field, '*')

  return (
    <div style={container}>
      <header style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={logo}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
              <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
            </svg>
          </div>
          <div>
            <h1 style={title}>CronLab</h1>
            <p style={subtitle}>Cron 表达式实验室 · 构建 / 解释 / 下次触发预览</p>
          </div>
        </div>
      </header>

      {/* Expression bar */}
      <div style={exprBar}>
        <div style={exprCells}>
          {FIVE_FIELDS.map((f) => (
            <div key={f.key} style={exprCell}>
              <div style={exprCellLabel}>{f.label}</div>
              <input
                value={customField[f.key]}
                onChange={(e) => applyFieldToExpr(f.key, e.target.value)}
                style={exprCellInput}
                spellCheck={false}
                title={`${f.label} (${f.description}) - 例: ${f.exampleValues}`}
              />
            </div>
          ))}
        </div>
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
          style={{
            ...exprRawInput,
            borderColor: parsed.error ? 'rgba(239,68,68,0.4)' : 'rgba(34,211,238,0.3)',
            background: parsed.error ? 'rgba(239,68,68,0.05)' : 'rgba(34,211,238,0.04)',
          }}
        />
      </div>

      {/* Validation / Explanation */}
      <div style={{
        padding: '12px 16px',
        background: parsed.error ? 'rgba(239,68,68,0.06)' : 'rgba(34,211,238,0.04)',
        border: `1px solid ${parsed.error ? 'rgba(239,68,68,0.2)' : 'rgba(34,211,238,0.2)'}`,
        borderRadius: 10,
        marginBottom: 14,
      }}>
        {parsed.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
            <strong>错误：</strong>{parsed.error}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>人类可读解释</div>
            <div style={{ color: '#67e8f9', fontSize: 14, fontWeight: 500 }}>{explanation}</div>
          </div>
        )}
      </div>

      {/* Body: presets + next runs */}
      <div style={body}>
        {/* Presets */}
        <div style={leftPane}>
          <div style={sectionHeader}>
            <span>常用预设</span>
          </div>
          <div style={presetGrid}>
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                onClick={() => setExpr(p.expr)}
                style={{
                  ...presetBtn,
                  background: expr === p.expr ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'rgba(255,255,255,0.02)',
                  color: expr === p.expr ? '#fff' : '#cbd5e1',
                  borderColor: expr === p.expr ? 'transparent' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: expr === p.expr ? '#a5f3fc' : '#64748b', marginTop: 3 }}>{p.expr}</div>
              </button>
            ))}
          </div>

          <div style={{ ...sectionHeader, marginTop: 16 }}>
            <span>快捷操作</span>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {FIVE_FIELDS.map((f) => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', width: 28, fontWeight: 600 }}>{f.label}</span>
                <button onClick={() => setEvery(f.key)} style={miniBtn}>每</button>
                <button onClick={() => setQuickStep(f.key, 2)} style={miniBtn}>/2</button>
                <button onClick={() => setQuickStep(f.key, 5)} style={miniBtn}>/5</button>
                <button onClick={() => setQuickStep(f.key, 10)} style={miniBtn}>/10</button>
                <button onClick={() => setQuickStep(f.key, 15)} style={miniBtn}>/15</button>
                <button onClick={() => setQuickStep(f.key, 30)} style={miniBtn}>/30</button>
              </div>
            ))}
          </div>
        </div>

        {/* Next runs */}
        <div style={rightPane}>
          <div style={{ ...sectionHeader, marginBottom: 10 }}>
            <span>未来触发时间</span>
            <select value={previewCount} onChange={(e) => setPreviewCount(parseInt(e.target.value, 10))} style={selectStyle}>
              <option value={3}>3 次</option>
              <option value={6}>6 次</option>
              <option value={12}>12 次</option>
              <option value={24}>24 次</option>
            </select>
          </div>
          {nextRunTimes.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              {parsed.error ? '请修复表达式错误后再预览' : '一年内未找到匹配时间（可能字段配置过严）'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {nextRunTimes.map((d, idx) => {
                const isNext = idx === 0
                const daysUntil = Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                return (
                  <div key={idx} style={{
                    padding: '10px 14px',
                    background: isNext ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isNext ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, color: isNext ? '#67e8f9' : '#e2e8f0', fontWeight: isNext ? 700 : 500, fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDateTime(d)}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {WEEKDAY_NAMES[d.getDay()]}
                        {idx === 0 && daysUntil >= 0 && ` · ${daysUntil === 0 ? '今天' : daysUntil === 1 ? '明天' : `${daysUntil} 天后`}`}
                      </div>
                    </div>
                    {isNext && (
                      <span style={{ fontSize: 10, padding: '2px 8px', background: '#06b6d4', color: '#fff', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em' }}>
                        下次
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Reference */}
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>语法参考</div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', lineHeight: 1.8 }}>
              <div><span style={{ color: '#67e8f9' }}>*</span> 任意值　<span style={{ color: '#67e8f9' }}>/N</span> 每 N 步　<span style={{ color: '#67e8f9' }}>A-B</span> 范围</div>
              <div><span style={{ color: '#67e8f9' }}>A,B,C</span> 列表　<span style={{ color: '#67e8f9' }}>L</span> 最后一天　<span style={{ color: '#67e8f9' }}>W</span> 最近工作日</div>
              <div><span style={{ color: '#67e8f9' }}>mon-fri</span> 工作日　<span style={{ color: '#67e8f9' }}>jan,feb</span> 月份缩写</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 样式
const container: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'radial-gradient(ellipse at top, #0a1f24 0%, #050d10 50%, #020608 100%)',
  color: '#e2e8f0',
  fontFamily: "'JetBrains Mono', 'Cabinet Grotesk', monospace",
  padding: 18,
  overflow: 'auto',
  boxSizing: 'border-box',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
}

const logo: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 11,
  background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  boxShadow: '0 8px 20px rgba(6,182,212,0.35)',
}

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #a5f3fc 0%, #67e8f9 50%, #06b6d4 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const subtitle: React.CSSProperties = { margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8' }

const exprBar: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 14,
  alignItems: 'stretch',
  flexWrap: 'wrap',
}

const exprCells: React.CSSProperties = { display: 'flex', gap: 4, flex: 1, minWidth: 320 }

const exprCell: React.CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '6px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const exprCellLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 600,
}

const exprCellInput: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#67e8f9',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
  width: '100%',
  padding: 0,
}

const exprRawInput: React.CSSProperties = {
  flex: '0 0 280px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(34,211,238,0.3)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#67e8f9',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
}

const body: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.4fr)',
  gap: 14,
  flex: 1,
  minHeight: 0,
}

const leftPane: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

const rightPane: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
  fontSize: 11,
  color: '#94a3b8',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontWeight: 600,
}

const presetGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
  gap: 6,
}

const presetBtn: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

const miniBtn: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 5,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.02)',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0',
  padding: '4px 8px',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 11,
}
