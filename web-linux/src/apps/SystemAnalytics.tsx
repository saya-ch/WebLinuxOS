import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useStore } from '../store'
import { loadFromStorage, saveToStorage, clearStorage } from '../store/storageUtils'

const STORAGE_KEY = 'weblinux-app-analytics'
const SESSION_KEY = 'weblinux-analytics-session'

interface AppUsageRecord {
  appId: string
  appName: string
  openCount: number
  totalDuration: number
  lastUsedAt: string | null
  firstUsedAt: string | null
  hourlyData: number[]
}

interface AnalyticsData {
  records: Record<string, AppUsageRecord>
  systemUptimeStart: number
  totalOpens: number
  totalSessions: number
}

interface SessionInfo {
  appId: string
  windowId: string
  startedAt: number
}

const defaultData: AnalyticsData = {
  records: {},
  systemUptimeStart: Date.now(),
  totalOpens: 0,
  totalSessions: 0,
}

function loadAnalytics(): AnalyticsData {
  return loadFromStorage<AnalyticsData>(STORAGE_KEY, defaultData)
}

function saveAnalytics(data: AnalyticsData) {
  saveToStorage(STORAGE_KEY, data)
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}天 ${hours}时 ${minutes}分`
  if (hours > 0) return `${hours}时 ${minutes}分 ${seconds}秒`
  if (minutes > 0) return `${minutes}分 ${seconds}秒`
  return `${seconds}秒`
}

function formatShortDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}分${seconds}秒`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}时${mins}分`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '从未使用'
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '从未使用'
  }
}

function SystemAnalytics() {
  const windows = useStore((s) => s.windows)
  const apps = useStore((s) => s.apps)
  const resolvedTheme = useStore((s) => s.resolvedTheme)

  const [data, setData] = useState<AnalyticsData>(() => loadAnalytics())
  const [tick, setTick] = useState(0)
  const [sortBy, setSortBy] = useState<'opens' | 'duration'>('opens')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const activeSessionsRef = useRef<Map<string, SessionInfo>>(new Map())
  const prevWindowsRef = useRef(windows)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const prev = prevWindowsRef.current
    const curr = windows

    const opened = curr.filter(
      (w) => !prev.find((pw) => pw.id === w.id)
    )
    const closed = prev.filter(
      (w) => !curr.find((cw) => cw.id === w.id)
    )

    if (opened.length > 0 || closed.length > 0) {
      setData((prevData) => {
        const newData: AnalyticsData = {
          ...prevData,
          records: { ...prevData.records },
        }

        if (opened.length > 0) {
          newData.totalOpens += opened.length
          const now = Date.now()
          const hour = new Date(now).getHours()

          opened.forEach((win) => {
            const appDef = apps.find((a) => a.id === win.appId)
            const appName = appDef?.name || win.appId
            activeSessionsRef.current.set(win.id, {
              appId: win.appId,
              windowId: win.id,
              startedAt: now,
            })

            const existing = newData.records[win.appId]
            if (existing) {
              const hourly = [...existing.hourlyData]
              hourly[hour] = (hourly[hour] || 0) + 1
              newData.records[win.appId] = {
                ...existing,
                openCount: existing.openCount + 1,
                lastUsedAt: new Date(now).toISOString(),
                hourlyData: hourly,
              }
            } else {
              const hourly = new Array(24).fill(0)
              hourly[hour] = 1
              newData.records[win.appId] = {
                appId: win.appId,
                appName,
                openCount: 1,
                totalDuration: 0,
                lastUsedAt: new Date(now).toISOString(),
                firstUsedAt: new Date(now).toISOString(),
                hourlyData: hourly,
              }
            }
          })
        }

        if (closed.length > 0) {
          closed.forEach((win) => {
            const session = activeSessionsRef.current.get(win.id)
            if (session) {
              const duration = Date.now() - session.startedAt
              activeSessionsRef.current.delete(win.id)
              const rec = newData.records[session.appId]
              if (rec) {
                newData.records[session.appId] = {
                  ...rec,
                  totalDuration: rec.totalDuration + duration,
                }
              }
            }
          })
        }

        saveAnalytics(newData)
        return newData
      })
    }

    prevWindowsRef.current = curr
  }, [windows, apps])

  useEffect(() => {
    const sessionStr = loadFromStorage<SessionInfo[]>(SESSION_KEY, [])
    const nowActive = new Map<string, SessionInfo>()
    sessionStr.forEach((s) => nowActive.set(s.windowId, s))

    windows.forEach((w) => {
      if (!nowActive.has(w.id)) {
        const appDef = apps.find((a) => a.id === w.appId)
        const appName = appDef?.name || w.appId
        const session: SessionInfo = {
          appId: w.appId,
          windowId: w.id,
          startedAt: Date.now(),
        }
        nowActive.set(w.id, session)
        activeSessionsRef.current.set(w.id, session)

        setData((prevData) => {
          const existing = prevData.records[w.appId]
          const hour = new Date().getHours()
          if (existing) {
            const hourly = [...existing.hourlyData]
            hourly[hour] = (hourly[hour] || 0) + 1
            const newRecords = { ...prevData.records }
            newRecords[w.appId] = {
              ...existing,
              openCount: existing.openCount + 1,
              lastUsedAt: new Date().toISOString(),
              hourlyData: hourly,
            }
            const newData = {
              ...prevData,
              records: newRecords,
              totalOpens: prevData.totalOpens + 1,
            }
            saveAnalytics(newData)
            return newData
          } else {
            const hourly = new Array(24).fill(0)
            hourly[hour] = 1
            const newRecords = { ...prevData.records }
            newRecords[w.appId] = {
              appId: w.appId,
              appName,
              openCount: 1,
              totalDuration: 0,
              lastUsedAt: new Date().toISOString(),
              firstUsedAt: new Date().toISOString(),
              hourlyData: hourly,
            }
            const newData = {
              ...prevData,
              records: newRecords,
              totalOpens: prevData.totalOpens + 1,
            }
            saveAnalytics(newData)
            return newData
          }
        })
      }
    })

    const sessionsToSave = Array.from(nowActive.values())
    saveToStorage(SESSION_KEY, sessionsToSave)
    activeSessionsRef.current = nowActive
  }, [apps.length])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSessionsRef.current.size === 0) return

      setData((prevData) => {
        let changed = false
        const newRecords = { ...prevData.records }
        const now = Date.now()

        activeSessionsRef.current.forEach((session) => {
          const elapsed = now - session.startedAt
          if (elapsed >= 5000) {
            const rec = newRecords[session.appId]
            if (rec) {
              newRecords[session.appId] = {
                ...rec,
                totalDuration: rec.totalDuration + elapsed,
              }
              changed = true
            }
            session.startedAt = now
          }
        })

        if (!changed) return prevData

        const newData = { ...prevData, records: newRecords }
        saveAnalytics(newData)
        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const currentUptime = useMemo(() => {
    return Date.now() - data.systemUptimeStart
  }, [data.systemUptimeStart, tick])

  const topApps = useMemo(() => {
    const list = Object.values(data.records)
    list.sort((a, b) => {
      if (sortBy === 'opens') return b.openCount - a.openCount
      return b.totalDuration - a.totalDuration
    })
    return list.slice(0, 10)
  }, [data.records, sortBy])

  const heatmapData = useMemo(() => {
    const hourlyTotals = new Array(24).fill(0)
    Object.values(data.records).forEach((rec) => {
      rec.hourlyData.forEach((count, hour) => {
        hourlyTotals[hour] += count
      })
    })
    return hourlyTotals
  }, [data.records])

  const maxHeatValue = useMemo(() => {
    return Math.max(1, ...heatmapData)
  }, [heatmapData])

  const totalApps = Object.keys(data.records).length
  const activeWindowCount = windows.length
  const runningAppIds = new Set(windows.map((w) => w.appId))
  const runningAppCount = runningAppIds.size

  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalAppsTracked: totalApps,
        totalOpens: data.totalOpens,
        systemUptime: currentUptime,
        totalSessions: data.totalSessions,
      },
      apps: Object.values(data.records).map((rec) => ({
        appId: rec.appId,
        appName: rec.appName,
        openCount: rec.openCount,
        totalDuration: rec.totalDuration,
        totalDurationFormatted: formatDuration(rec.totalDuration),
        lastUsedAt: rec.lastUsedAt,
        firstUsedAt: rec.firstUsedAt,
      })),
    }

    let content: string
    let mimeType: string
    let extension: string

    if (exportFormat === 'json') {
      content = JSON.stringify(exportData, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    } else {
      const headers = ['应用ID', '应用名称', '打开次数', '总使用时长(ms)', '总使用时长', '最近使用', '首次使用']
      const rows = exportData.apps.map((a) => [
        a.appId,
        a.appName,
        String(a.openCount),
        String(a.totalDuration),
        a.totalDurationFormatted,
        a.lastUsedAt || '',
        a.firstUsedAt || '',
      ])
      content = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
      mimeType = 'text/csv;charset=utf-8'
      extension = 'csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weblinux-analytics-${new Date().toISOString().slice(0, 10)}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`已导出为 ${exportFormat.toUpperCase()} 文件`)
  }, [data, exportFormat, totalApps, currentUptime, showToast])

  const handleReset = useCallback(() => {
    clearStorage(STORAGE_KEY, SESSION_KEY)
    activeSessionsRef.current.clear()
    prevWindowsRef.current = []
    setData({
      records: {},
      systemUptimeStart: Date.now(),
      totalOpens: 0,
      totalSessions: 0,
    })
    setShowResetConfirm(false)
    showToast('所有统计数据已清除')
  }, [showToast])

  const isDark = resolvedTheme === 'dark'

  const heatColor = (val: number) => {
    if (val === 0) return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    const ratio = val / maxHeatValue
    if (isDark) {
      if (ratio < 0.2) return 'rgba(124,108,240,0.15)'
      if (ratio < 0.4) return 'rgba(124,108,240,0.30)'
      if (ratio < 0.6) return 'rgba(124,108,240,0.50)'
      if (ratio < 0.8) return 'rgba(124,108,240,0.70)'
      return 'rgba(124,108,240,0.95)'
    } else {
      if (ratio < 0.2) return 'rgba(91,76,216,0.12)'
      if (ratio < 0.4) return 'rgba(91,76,216,0.25)'
      if (ratio < 0.6) return 'rgba(91,76,216,0.45)'
      if (ratio < 0.8) return 'rgba(91,76,216,0.65)'
      return 'rgba(91,76,216,0.90)'
    }
  }

  const statCards = [
    {
      label: '活跃窗口',
      value: activeWindowCount,
      icon: '🪟',
      color: '#7c6cf0',
    },
    {
      label: '运行中应用',
      value: runningAppCount,
      icon: '⚡',
      color: '#00d6c1',
    },
    {
      label: '已追踪应用',
      value: totalApps,
      icon: '📊',
      color: '#f59e0b',
    },
    {
      label: '累计启动次数',
      value: data.totalOpens,
      icon: '🚀',
      color: '#ef4444',
    },
  ]

  const rankColors = [
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #94a3b8, #64748b)',
    'linear-gradient(135deg, #cd7f32, #a0522d)',
  ]

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100%',
      height: '100%',
      padding: '20px',
      overflow: 'auto',
      color: isDark ? '#f0f0ff' : '#1c1c1e',
      background: isDark
        ? 'linear-gradient(135deg, rgba(18,18,30,0.95) 0%, rgba(28,28,48,0.95) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,247,0.95) 100%)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    title: {
      fontSize: '22px',
      fontWeight: 700,
      margin: 0,
      background: isDark
        ? 'linear-gradient(135deg, #f0f0ff, #b8a8ff)'
        : 'linear-gradient(135deg, #1c1c1e, #5b4cd8)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '13px',
      color: isDark ? '#9090c0' : '#8e8e93',
      margin: '4px 0 0 0',
    },
    actionGroup: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    glassCard: {
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: '16px',
      padding: '18px',
      boxShadow: isDark
        ? '0 8px 32px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0,0,0,0.06)',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '14px',
      marginBottom: '20px',
    },
    statCard: {
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    statIcon: {
      fontSize: '28px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    statLabel: {
      fontSize: '12px',
      color: isDark ? '#9090c0' : '#8e8e93',
      marginTop: '2px',
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: 600,
      margin: 0,
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    row: {
      display: 'flex',
      gap: '16px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    col6: {
      flex: '1 1 400px',
      minWidth: '300px',
    },
    heatmapGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(24, 1fr)',
      gap: '3px',
      marginTop: '10px',
    },
    heatCell: {
      aspectRatio: '1',
      borderRadius: '4px',
      transition: 'transform 0.15s ease',
      cursor: 'pointer',
      minWidth: '18px',
    },
    heatLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      color: isDark ? '#6060a0' : '#8e8e93',
      marginTop: '6px',
      padding: '0 2px',
    },
    heatLegend: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: isDark ? '#9090c0' : '#8e8e93',
      marginTop: '12px',
    },
    legendCells: {
      display: 'flex',
      gap: '3px',
    },
    rankingList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      maxHeight: '360px',
      overflowY: 'auto' as const,
    },
    rankingItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      borderRadius: '10px',
      marginBottom: '6px',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
      transition: 'all 0.2s ease',
    },
    rankBadge: {
      width: '28px',
      height: '28px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: 700,
      color: '#fff',
      marginRight: '12px',
      flexShrink: 0,
    },
    rankInfo: {
      flex: 1,
      minWidth: 0,
    },
    rankName: {
      fontSize: '14px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    rankMeta: {
      fontSize: '11px',
      color: isDark ? '#9090c0' : '#8e8e93',
      marginTop: '2px',
    },
    rankBar: {
      height: '4px',
      borderRadius: '2px',
      marginTop: '6px',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      overflow: 'hidden',
    },
    rankBarFill: {
      height: '100%',
      borderRadius: '2px',
      background: isDark
        ? 'linear-gradient(90deg, #7c6cf0, #00d6c1)'
        : 'linear-gradient(90deg, #5b4cd8, #0ea5a0)',
      transition: 'width 0.5s ease',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '10px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
      color: isDark ? '#f0f0ff' : '#1c1c1e',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
    primaryButton: {
      padding: '8px 16px',
      borderRadius: '10px',
      border: 'none',
      background: isDark
        ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
        : 'linear-gradient(135deg, #5b4cd8, #7c6cf0)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: isDark ? '0 4px 16px rgba(124,108,240,0.3)' : '0 4px 16px rgba(91,76,216,0.25)',
    },
    dangerButton: {
      padding: '8px 16px',
      borderRadius: '10px',
      border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.3)'}`,
      background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.08)',
      color: isDark ? '#fca5a5' : '#dc2626',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
    toggleGroup: {
      display: 'inline-flex',
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    },
    toggleBtn: {
      padding: '6px 14px',
      border: 'none',
      background: 'transparent',
      color: isDark ? '#9090c0' : '#8e8e93',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
    toggleBtnActive: {
      padding: '6px 14px',
      border: 'none',
      background: isDark ? 'rgba(124,108,240,0.2)' : 'rgba(91,76,216,0.12)',
      color: isDark ? '#b8a8ff' : '#5b4cd8',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
    },
    uptimeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 14px',
      borderRadius: '12px',
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
      marginTop: '10px',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: isDark ? '#6060a0' : '#8e8e93',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
      opacity: 0.5,
    },
    toast: {
      position: 'fixed' as const,
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: '12px',
      background: isDark ? 'rgba(20,20,35,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      color: isDark ? '#f0f0ff' : '#1c1c1e',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 9999,
      fontSize: '13px',
      fontWeight: 500,
      animation: 'fadeInUp 0.3s ease',
    },
    confirmOverlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
    },
    confirmDialog: {
      background: isDark ? 'rgba(20,20,35,0.98)' : 'rgba(255,255,255,0.98)',
      borderRadius: '18px',
      padding: '24px',
      maxWidth: '380px',
      width: '90%',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
  }

  const maxValue = useMemo(() => {
    if (sortBy === 'opens') {
      return topApps[0]?.openCount || 1
    }
    return topApps[0]?.totalDuration || 1
  }, [topApps, sortBy])

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes confirmIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📊 系统分析器</h2>
          <p style={styles.subtitle}>追踪应用使用情况，洞察你的使用习惯</p>
        </div>
        <div style={styles.actionGroup}>
          <div style={styles.toggleGroup}>
            <button
              style={exportFormat === 'json' ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => setExportFormat('json')}
            >
              JSON
            </button>
            <button
              style={exportFormat === 'csv' ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => setExportFormat('csv')}
            >
              CSV
            </button>
          </div>
          <button style={styles.primaryButton} onClick={handleExport}>
            📥 导出数据
          </button>
          <button style={styles.dangerButton} onClick={() => setShowResetConfirm(true)}>
            🗑️ 重置数据
          </button>
        </div>
      </div>

      <div style={styles.statGrid}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              ...styles.statCard,
              borderLeft: `3px solid ${card.color}`,
            }}
          >
            <div style={styles.statIcon}>{card.icon}</div>
            <div>
              <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.row}>
        <div style={{ ...styles.glassCard, ...styles.col6 }}>
          <h3 style={styles.sectionTitle}>
            ⏱️ 系统运行时间
          </h3>
          <div style={styles.uptimeRow}>
            <span style={{ fontSize: '32px' }}>⏰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>
                {formatDuration(currentUptime)}
              </div>
              <div style={{ fontSize: '12px', color: isDark ? '#9090c0' : '#8e8e93', marginTop: '2px' }}>
                系统自启动以来已运行
              </div>
            </div>
          </div>

          <h3 style={{ ...styles.sectionTitle, marginTop: '20px' }}>
            📈 使用热力图
          </h3>
          <div style={{ fontSize: '12px', color: isDark ? '#9090c0' : '#8e8e93', marginBottom: '4px' }}>
            各时段应用启动频率（24小时制）
          </div>
          <div style={styles.heatmapGrid}>
            {heatmapData.map((val, hour) => (
              <div
                key={hour}
                style={{
                  ...styles.heatCell,
                  background: heatColor(val),
                }}
                title={`${hour}:00 - ${val} 次启动`}
              />
            ))}
          </div>
          <div style={styles.heatLabels}>
            <span>0时</span>
            <span>6时</span>
            <span>12时</span>
            <span>18时</span>
            <span>23时</span>
          </div>
          <div style={styles.heatLegend}>
            <span>少</span>
            <div style={styles.legendCells}>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.heatCell,
                    width: '14px',
                    height: '14px',
                    background: heatColor(Math.round(r * maxHeatValue)),
                  }}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>

        <div style={{ ...styles.glassCard, ...styles.col6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={styles.sectionTitle}>
              🏆 应用排行榜 TOP 10
            </h3>
            <div style={styles.toggleGroup}>
              <button
                style={sortBy === 'opens' ? styles.toggleBtnActive : styles.toggleBtn}
                onClick={() => setSortBy('opens')}
              >
                按次数
              </button>
              <button
                style={sortBy === 'duration' ? styles.toggleBtnActive : styles.toggleBtn}
                onClick={() => setSortBy('duration')}
              >
                按时长
              </button>
            </div>
          </div>

          {topApps.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>暂无使用数据</div>
              <div style={{ fontSize: '12px' }}>打开一些应用后，这里将显示使用统计</div>
            </div>
          ) : (
            <ul style={styles.rankingList}>
              {topApps.map((app, idx) => {
                const rank = idx + 1
                const isTop3 = rank <= 3
                const badgeStyle = isTop3
                  ? { ...styles.rankBadge, background: rankColors[rank - 1] }
                  : {
                      ...styles.rankBadge,
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      color: isDark ? '#9090c0' : '#8e8e93',
                    }
                const currentValue = sortBy === 'opens' ? app.openCount : app.totalDuration
                const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0

                return (
                  <li key={app.appId} style={styles.rankingItem}>
                    <div style={badgeStyle}>{rank}</div>
                    <div style={styles.rankInfo}>
                      <div style={styles.rankName}>{app.appName}</div>
                      <div style={styles.rankMeta}>
                        {sortBy === 'opens'
                          ? `${app.openCount} 次启动`
                          : `累计 ${formatShortDuration(app.totalDuration)}`}
                        {' · '}
                        {formatDateTime(app.lastUsedAt)}
                      </div>
                      <div style={styles.rankBar}>
                        <div
                          style={{
                            ...styles.rankBarFill,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {showResetConfirm && (
        <div style={styles.confirmOverlay} onClick={() => setShowResetConfirm(false)}>
          <div style={{ ...styles.confirmDialog, animation: 'confirmIn 0.25s ease' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ textAlign: 'center', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>
              确认清除所有数据？
            </h3>
            <p style={{
              textAlign: 'center',
              fontSize: '13px',
              color: isDark ? '#9090c0' : '#8e8e93',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}>
              此操作将清除所有应用使用统计数据，且不可恢复。<br />
              确定要继续吗？
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button style={styles.button} onClick={() => setShowResetConfirm(false)}>
                取消
              </button>
              <button style={styles.dangerButton} onClick={handleReset}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  )
}

export default SystemAnalytics