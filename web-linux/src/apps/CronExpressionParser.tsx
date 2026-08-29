/**
 * CronExpressionParser - Cron 表达式解析器与可视化工具
 * 支持标准5字段和扩展6/7字段Cron表达式
 * 可视化展示：下N次执行时间、字段解释、自然语言描述
 */
import { useState, useMemo, useCallback } from 'react'

// Cron 字段定义
const FIELDS = [
  { name: '分钟', min: 0, max: 59 },
  { name: '小时', min: 0, max: 23 },
  { name: '日', min: 1, max: 31 },
  { name: '月', min: 1, max: 12 },
  { name: '星期', min: 0, max: 7 },
]

const CRON_PRESETS = [
  { label: '每分钟', expr: '* * * * *' },
  { label: '每小时整点', expr: '0 * * * *' },
  { label: '每天 9:00', expr: '0 9 * * *' },
  { label: '工作日 9:00', expr: '0 9 * * 1-5' },
  { label: '每周一 10:00', expr: '0 10 * * 1' },
  { label: '每月1日 0:00', expr: '0 0 1 * *' },
  { label: '每5分钟', expr: '*/5 * * * *' },
  { label: '每15分钟', expr: '*/15 * * * *' },
  { label: '每天午夜', expr: '0 0 * * *' },
  { label: '每季度首日', expr: '0 0 1 1,4,7,10 *' },
]

function expandField(field: string, min: number, max: number): number[] {
  const values = new Set<number>()
  const parts = field.split(',')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === '*') {
      for (let i = min; i <= max; i++) values.add(i)
    } else if (trimmed.includes('/')) {
      const [range, stepStr] = trimmed.split('/')
      const step = parseInt(stepStr, 10)
      if (isNaN(step) || step <= 0) continue
      let rMin = min, rMax = max
      if (range !== '*') {
        if (range.includes('-')) {
          const [a, b] = range.split('-').map(Number)
          rMin = a; rMax = b
        } else {
          rMin = parseInt(range, 10)
        }
      }
      for (let i = rMin; i <= rMax; i += step) values.add(i)
    } else if (trimmed.includes('-')) {
      const [a, b] = trimmed.split('-').map(Number)
      for (let i = a; i <= b; i++) values.add(i)
    } else {
      const v = parseInt(trimmed, 10)
      if (!isNaN(v)) values.add(v)
    }
  }

  // 星期7转0
  if (max === 7 && values.has(7)) { values.delete(7); values.add(0) }

  return Array.from(values).sort((a, b) => a - b)
}

function describeField(field: string, _min: number, _max: number, fieldName: string): string {
  const f = field.trim()
  if (f === '*') return `每${fieldName}`
  if (f === '0' && fieldName === '小时') return '午夜'
  if (f === '12' && fieldName === '小时') return '中午'

  if (f.includes('/')) {
    const [range, step] = f.split('/')
    const stepNum = parseInt(step, 10)
    if (range === '*') return `每 ${stepNum} ${fieldName}`
    return `从 ${range} 起每 ${stepNum} ${fieldName}`
  }

  if (f.includes(',')) {
    return f.split(',').map(v => v.trim()).join(', ') + ` ${fieldName}`
  }

  if (f.includes('-')) {
    const [a, b] = f.split('-')
    return `${a} 到 ${b} ${fieldName}`
  }

  return `${fieldName} ${f}`
}

function parseCron(expression: string): { valid: boolean; fields: string[]; error?: string } {
  const trimmed = expression.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(' ')

  // 支持5,6,7字段
  if (parts.length < 5 || parts.length > 7) {
    return { valid: false, fields: [], error: `需要5-7个字段，当前${parts.length}个` }
  }

  // 如果是7字段，跳过前两个（秒+可选）
  // 如果是6字段，跳过第一个（秒）
  // 5字段是标准cron
  const startIdx = parts.length >= 6 ? (parts.length === 7 ? 2 : 1) : 0
  const fields = parts.slice(startIdx)

  for (let i = 0; i < Math.min(5, fields.length); i++) {
    if (!/^[0-9*\-\/,\s]+$/.test(fields[i])) {
      return { valid: false, fields, error: `字段 "${fields[i]}" 格式不正确` }
    }
  }

  return { valid: true, fields }
}

function getNextExecutions(cronExpr: string, count: number = 10): Date[] {
  const parsed = parseCron(cronExpr)
  if (!parsed.valid || parsed.fields.length < 5) return []

  const [minF, hourF, dayF, monthF, weekF] = parsed.fields
  const mins = expandField(minF, 0, 59)
  const hours = expandField(hourF, 0, 23)
  const days = expandField(dayF, 1, 31)
  const months = expandField(monthF, 1, 12)
  const weeks = expandField(weekF, 0, 7)

  const now = new Date()
  const result: Date[] = []
  const cursor = new Date(now)
  cursor.setSeconds(0)
  cursor.setMilliseconds(0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  const maxIterations = 366 * 24 * 60 // 最多遍历一年
  let iterations = 0

  while (result.length < count && iterations < maxIterations) {
    iterations++
    const month = cursor.getMonth() + 1
    const day = cursor.getDate()
    const weekday = cursor.getDay()
    const hour = cursor.getHours()
    const minute = cursor.getMinutes()

    if (!months.includes(month)) {
      cursor.setDate(1)
      cursor.setMonth(cursor.getMonth() + 1)
      cursor.setHours(0, 0, 0, 0)
      continue
    }

    const dayMatch = days.includes(day)
    const weekMatch = weeks.includes(weekday)
    // 如果日和星期都指定了具体值（非*），则需同时满足
    const daySpecified = dayF !== '*'
    const weekSpecified = weekF !== '*'

    if (daySpecified && weekSpecified) {
      if (!dayMatch || !weekMatch) { cursor.setDate(day + 1); cursor.setHours(0, 0, 0, 0); continue }
    } else if (daySpecified) {
      if (!dayMatch) { cursor.setDate(day + 1); cursor.setHours(0, 0, 0, 0); continue }
    } else if (weekSpecified) {
      if (!weekMatch) { cursor.setDate(day + 1); cursor.setHours(0, 0, 0, 0); continue }
    }

    if (!hours.includes(hour)) { cursor.setHours(hour + 1, 0, 0, 0); continue }
    if (!mins.includes(minute)) { cursor.setMinutes(minute + 1); continue }

    result.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return result
}

function describeCron(fields: string[]): string {
  if (fields.length < 5) return '无效表达式'
  const [minF, hourF, dayF, monthF, weekF] = fields

  const parts: string[] = []

  // 星期
  if (weekF !== '*') {
    const weekNames = ['日', '一', '二', '三', '四', '五', '六']
    if (weekF.includes('-')) {
      const [a, b] = weekF.split('-').map(Number)
      parts.push(`星期${weekNames[a]}到星期${weekNames[b]}`)
    } else {
      parts.push(weekF.split(',').map(w => `星期${weekNames[parseInt(w)]}`).join('、'))
    }
  }

  // 月
  if (monthF !== '*') {
    parts.push(monthF.split(',').map(m => `${m}月`).join('、'))
  }

  // 日
  if (dayF !== '*') {
    parts.push(describeField(dayF, 1, 31, '日'))
  }

  // 时间
  if (hourF === '*' && minF === '*') {
    parts.push('每分钟')
  } else if (minF === '*') {
    parts.push(`每小时的第 ${hourF} 分钟`)
  } else if (hourF === '*') {
    parts.push(`每小时的 ${minF} 分`)
  } else {
    parts.push(`${hourF}:${minF.toString().padStart(2, '0')}`)
  }

  return parts.length > 0 ? parts.join('，') : '无'
}

function CronExpressionParser() {
  const [expression, setExpression] = useState('0 9 * * 1-5')
  const [nextCount, setNextCount] = useState(10)

  const parsed = useMemo(() => parseCron(expression), [expression])
  const nextRuns = useMemo(() => getNextExecutions(expression, nextCount), [expression, nextCount])
  const description = useMemo(() => parsed.valid ? describeCron(parsed.fields) : '', [parsed])

  const fieldDetails = useMemo(() => {
    if (!parsed.valid) return []
    return FIELDS.map((f, i) => ({
      name: f.name,
      value: parsed.fields[i] || '*',
      description: describeField(parsed.fields[i] || '*', f.min, f.max, f.name),
      expanded: expandField(parsed.fields[i] || '*', f.min, f.max).length,
    }))
  }, [parsed])

  const handlePreset = useCallback((expr: string) => { setExpression(expr) }, [])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Cron 表达式解析器</h2>
        <span style={styles.subtitle}>可视化解析 cron 调度表达式，预览执行时间</span>
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="输入 cron 表达式，如: 0 9 * * 1-5"
          spellCheck={false}
        />
        {parsed.valid ? (
          <span style={styles.validBadge}>有效</span>
        ) : (
          <span style={styles.errorBadge}>{parsed.error}</span>
        )}
      </div>

      {parsed.valid && description && (
        <div style={styles.descBox}>
          <span style={styles.descIcon}></span>
          <span style={styles.descText}>{description}</span>
        </div>
      )}

      <div style={styles.fields}>
        {fieldDetails.map((fd) => (
          <div key={fd.name} style={styles.fieldCard}>
            <div style={styles.fieldName}>{fd.name}</div>
            <div style={styles.fieldValue}>{fd.value}</div>
            <div style={styles.fieldDesc}>{fd.description}</div>
            <div style={styles.fieldDots}>
              {Array.from({ length: Math.min(fd.expanded, 30) }).map((_, j) => (
                <span key={j} style={styles.dot} />
              ))}
              {fd.expanded > 30 && <span style={styles.dotMore}>+{fd.expanded - 30}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>下次执行时间 (最近 {nextCount} 次)</span>
          <select style={styles.select} value={nextCount} onChange={(e) => setNextCount(Number(e.target.value))}>
            {[5, 10, 20, 30].map((n) => <option key={n} value={n}>{n} 次</option>)}
          </select>
        </div>
        <div style={styles.runList}>
          {nextRuns.length === 0 ? (
            <div style={styles.noRuns}>无匹配的执行时间</div>
          ) : (
            nextRuns.map((date, i) => {
              const now = new Date()
              const diff = date.getTime() - now.getTime()
              const diffMin = Math.round(diff / 60000)
              const diffStr = diffMin < 60 ? `${diffMin}分钟后` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}小时${diffMin % 60}分钟后` : `${Math.floor(diffMin / 1440)}天后`
              return (
                <div key={i} style={styles.runItem}>
                  <span style={styles.runIndex}>#{i + 1}</span>
                  <span style={styles.runDate}>{date.toLocaleString('zh-CN')}</span>
                  <span style={styles.runDiff}>{diffStr}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={styles.presets}>
        <span style={styles.presetLabel}>常用表达式:</span>
        {CRON_PRESETS.map((p) => (
          <button key={p.expr} style={styles.presetBtn} onClick={() => handlePreset(p.expr)} title={p.expr}>
            <span style={styles.presetName}>{p.label}</span>
            <span style={styles.presetExpr}>{p.expr}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: 'var(--text-primary, #1a1a2e)', background: 'var(--bg-primary, #ffffff)', overflow: 'auto' },
  header: { display: 'flex', flexDirection: 'column', gap: '2px' },
  title: { margin: 0, fontSize: '18px', fontWeight: 600 },
  subtitle: { fontSize: '12px', color: 'var(--text-secondary, #6b7280)' },
  inputRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  input: { flex: 1, padding: '10px 14px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', fontSize: '14px', fontFamily: '"JetBrains Mono", monospace', outline: 'none', background: 'var(--bg-input, #f9fafb)', color: 'var(--text-primary, #1a1a2e)' },
  validBadge: { padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' },
  errorBadge: { padding: '4px 10px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' },
  descBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary, #f0f9ff)', border: '1px solid var(--border-color, #e0e7ff)' },
  descIcon: { fontSize: '16px' },
  descText: { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1a1a2e)' },
  fields: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
  fieldCard: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary, #f9fafb)', border: '1px solid var(--border-color, #e5e7eb)' },
  fieldName: { fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldValue: { fontSize: '18px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: 'var(--accent-color, #3b82f6)' },
  fieldDesc: { fontSize: '11px', color: 'var(--text-secondary, #9ca3af)' },
  fieldDots: { display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '4px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color, #3b82f6)', opacity: 0.6 },
  dotMore: { fontSize: '10px', color: 'var(--text-secondary, #9ca3af)' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #1a1a2e)' },
  select: { padding: '4px 8px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text-primary, #1a1a2e)' },
  runList: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflow: 'auto' },
  noRuns: { padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #9ca3af)', fontSize: '12px' },
  runItem: { display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-secondary, #f9fafb)', fontSize: '12px' },
  runIndex: { fontWeight: 500, color: 'var(--text-secondary, #9ca3af)', minWidth: '24px' },
  runDate: { flex: 1, fontFamily: 'monospace', color: 'var(--text-primary, #1a1a2e)' },
  runDiff: { color: 'var(--accent-color, #3b82f6)', fontWeight: 500, fontSize: '11px' },
  presets: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '8px' },
  presetLabel: { fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' },
  presetBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 10px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '8px', background: 'var(--bg-secondary, #f9fafb)', cursor: 'pointer', transition: 'all 0.15s' },
  presetName: { fontSize: '11px', color: 'var(--text-primary, #1a1a2e)', fontWeight: 500 },
  presetExpr: { fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-secondary, #9ca3af)' },
}

export default CronExpressionParser
