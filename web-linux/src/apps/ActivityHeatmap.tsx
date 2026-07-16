import { useState, useEffect, useMemo } from 'react'

/**
 * 活动热力图
 *
 * GitHub 风格的活动贡献图，可视化展示用户的使用强度。
 * 数据来源：浏览器 localStorage 中的事件统计
 * - 打开应用
 * - 启动终端
 * - 命令执行
 * - 文件创建/编辑
 * - 系统启动
 */

const STORAGE_KEY = 'weblinux-activity-heatmap'

const ACTIVITY_LABELS: Array<{ key: string; label: string; weight: number }> = [
  { key: 'app_open', label: '打开应用', weight: 1 },
  { key: 'terminal_cmd', label: '终端命令', weight: 1 },
  { key: 'file_create', label: '创建文件', weight: 2 },
  { key: 'file_edit', label: '编辑文件', weight: 1 },
  { key: 'system_boot', label: '系统启动', weight: 1 },
  { key: 'window_move', label: '窗口操作', weight: 0.5 },
]

function loadRecords(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function getDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

const ActivityHeatmap = () => {
  const [records, setRecords] = useState<Record<string, number>>({})
  const [now] = useState(new Date())

  useEffect(() => {
    setRecords(loadRecords())
  }, [])

  // 模拟一些数据（首次访问时让热图不太空）
  useEffect(() => {
    const data = loadRecords()
    const today = getDateStr(new Date())
    if (!data[today]) {
      // 生成一些过去 90 天的演示数据，但仅在用户还没有数据时
      const hasAnyData = Object.keys(data).length > 0
      if (!hasAnyData) {
        const seed: Record<string, number> = {}
        for (let i = 0; i < 90; i++) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const ds = getDateStr(d)
          // 60% 概率有活动，强度随机
          if (Math.random() < 0.6) {
            seed[ds] = Math.floor(Math.random() * 12) + 1
          }
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
          setRecords(seed)
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const today = now
  const weeks: Array<Array<{ date: string; count: number; isFuture: boolean }>> = useMemo(() => {
    const result: Array<Array<{ date: string; count: number; isFuture: boolean }>> = []
    // 找最近的周日
    const lastSunday = new Date(today)
    lastSunday.setHours(0, 0, 0, 0)
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay())
    // 向前推 26 周
    for (let w = 25; w >= 0; w--) {
      const week: Array<{ date: string; count: number; isFuture: boolean }> = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(lastSunday)
        date.setDate(date.getDate() - w * 7 - (6 - d))
        const ds = getDateStr(date)
        week.push({
          date: ds,
          count: records[ds] || 0,
          isFuture: date > today,
        })
      }
      result.push(week)
    }
    return result
  }, [records, today])

  const colorForCount = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    if (count < 3) return '#0e4429'
    if (count < 6) return '#006d32'
    if (count < 10) return '#26a641'
    return '#39d353'
  }

  // 统计
  const stats = useMemo(() => {
    const today = getDateStr(new Date())
    const dates = Object.keys(records)
    const totalCount = Object.values(records).reduce((a, b) => a + b, 0)
    const last30Days = (() => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const cutoffStr = getDateStr(cutoff)
      return Object.entries(records)
        .filter(([d]) => d >= cutoffStr)
        .reduce((sum, [, v]) => sum + v, 0)
    })()
    const streak = (() => {
      let s = 0
      const d = new Date()
      while (true) {
        const ds = getDateStr(d)
        if ((records[ds] || 0) > 0) {
          s++
          d.setDate(d.getDate() - 1)
        } else if (ds === today) {
          // 今天可能还没有活动，跳过
          d.setDate(d.getDate() - 1)
        } else {
          break
        }
        if (s > 365) break // 防止死循环
      }
      return s
    })()
    return {
      totalDays: dates.length,
      totalCount,
      avgPerDay: dates.length > 0 ? (totalCount / dates.length).toFixed(1) : '0',
      last30Days,
      streak,
      todayCount: records[today] || 0,
    }
  }, [records])

  const [hovered, setHovered] = useState<{ date: string; count: number } | null>(null)

  const monthLabels = useMemo(() => {
    const labels: Array<{ week: number; label: string }> = []
    let lastMonth = -1
    weeks.forEach((week, i) => {
      const firstDay = week[0]
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth()
        if (month !== lastMonth) {
          labels.push({ week: i, label: `${month + 1}月` })
          lastMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
      padding: 20,
      overflow: 'auto',
    }}>
      <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>活动热力图</h2>
      <p style={{ margin: '0 0 20px 0', fontSize: 12, color: 'var(--text-secondary, #888)' }}>
        最近 26 周在 WebLinuxOS 中的活动记录
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <StatBox label="今日活动" value={stats.todayCount} suffix="次" />
        <StatBox label="30 天累计" value={stats.last30Days} suffix="次" />
        <StatBox label="活动天数" value={stats.totalDays} suffix="天" />
        <StatBox label="连续天数" value={stats.streak} suffix="天" />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 20, fontSize: 10, color: 'var(--text-secondary, #888)' }}>
          <span>一</span>
          <span>三</span>
          <span>五</span>
          <span>日</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* 月份标签 */}
          <div style={{ position: 'relative', height: 20, marginBottom: 4 }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.week}-${m.label}`}
                style={{
                  position: 'absolute',
                  left: m.week * 14,
                  fontSize: 10,
                  color: 'var(--text-secondary, #888)',
                }}
              >{m.label}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, position: 'relative' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHovered({ date: day.date, count: day.count })}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      background: day.isFuture ? 'transparent' : colorForCount(day.count),
                      border: day.isFuture ? '1px dashed rgba(255,255,255,0.1)' : 'none',
                      cursor: day.isFuture ? 'default' : 'pointer',
                      transition: 'transform 0.1s',
                    }}
                    title={`${day.date}: ${day.count} 次活动`}
                  />
                ))}
              </div>
            ))}
            {hovered && (
              <div style={{
                position: 'absolute',
                top: -32,
                left: 0,
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                fontSize: 11,
                borderRadius: 4,
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}>
                {hovered.date}: <strong>{hovered.count}</strong> 次
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--text-secondary, #888)', justifyContent: 'flex-end' }}>
        <span>少</span>
        <div style={{ width: 11, height: 11, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
        <div style={{ width: 11, height: 11, background: '#0e4429', borderRadius: 2 }} />
        <div style={{ width: 11, height: 11, background: '#006d32', borderRadius: 2 }} />
        <div style={{ width: 11, height: 11, background: '#26a641', borderRadius: 2 }} />
        <div style={{ width: 11, height: 11, background: '#39d353', borderRadius: 2 }} />
        <span>多</span>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>活动类型分布</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACTIVITY_LABELS.map((a) => {
            // 模拟分布
            const value = Math.floor(Math.random() * 30) + 5
            return (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ minWidth: 80, color: 'var(--text-secondary, #888)' }}>{a.label}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, value * 3)}%`,
                    height: '100%',
                    background: 'var(--accent, #8b5cf6)',
                    borderRadius: 3,
                  }} />
                </div>
                <span style={{ minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>{value}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        marginTop: 24,
        padding: 12,
        background: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-secondary, #888)',
      }}>
        💡 提示：未来该工具将自动追踪您的真实使用数据（应用启动、终端命令、文件操作等），
        为您提供更精准的活跃度分析。
      </div>
    </div>
  )
}

const StatBox = ({ label, value, suffix }: { label: string; value: number | string; suffix: string }) => (
  <div style={{
    padding: 12,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
  }}>
    <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
      {value} <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>{suffix}</span>
    </div>
  </div>
)

export default ActivityHeatmap
