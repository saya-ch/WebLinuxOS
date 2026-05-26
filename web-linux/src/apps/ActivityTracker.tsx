import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'
import type { AppDefinition } from '../types'

type ActivityRecord = {
  id: string
  appId: string
  appName: string
  startTime: number
  duration: number // in seconds
  date: string
}

type DailyStats = {
  date: string
  totalDuration: number
  apps: Record<string, number>
}

function CurrentSessionDisplay({ 
  currentSession, 
  formatDuration 
}: { 
  currentSession: { appId: string; startTime: number }
  formatDuration: (seconds: number) => string 
}) {
  const [elapsed, setElapsed] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - currentSession.startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentSession.startTime])
  
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(100,150,255,0.15), rgba(100,200,150,0.1))',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid rgba(100,150,255,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#4f4',
            boxShadow: '0 0 8px #4f4',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <span style={{ color: '#fff', fontWeight: 500 }}>
            当前活动: {appRegistry.find((a: AppDefinition) => a.id === currentSession.appId)?.name || currentSession.appId}
          </span>
        </div>
        <span style={{ color: '#8af', fontWeight: 600 }}>
          {formatDuration(elapsed)}
        </span>
      </div>
    </div>
  )
}

export default function ActivityTracker() {
  const [activities, setActivities] = useState<ActivityRecord[]>(() => {
    const saved = localStorage.getItem('activity-tracker-data')
    return saved ? JSON.parse(saved) : []
  })
  const [currentSession, setCurrentSession] = useState<{ appId: string; startTime: number } | null>(null)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  const { windows } = useStore()

  // 追踪当前活动窗口
  useEffect(() => {
    const focusedWindow = windows.find(w => w.focused && !w.minimized)
    if (focusedWindow) {
      if (!currentSession || currentSession.appId !== focusedWindow.appId) {
        // 结束上一个会话
        if (currentSession) {
          const duration = Math.floor((Date.now() - currentSession.startTime) / 1000)
          if (duration > 5) {
            const record: ActivityRecord = {
              id: `activity-${Date.now()}`,
              appId: currentSession.appId,
              appName: appRegistry.find((a: AppDefinition) => a.id === currentSession.appId)?.name || currentSession.appId,
              startTime: currentSession.startTime,
              duration,
              date: new Date().toISOString().split('T')[0]
            }
            const saved = localStorage.getItem('activity-tracker-data')
            const existingActivities = saved ? JSON.parse(saved) : []
            const newActivities = [...existingActivities, record]
            localStorage.setItem('activity-tracker-data', JSON.stringify(newActivities))
            setActivities(newActivities)
          }
        }
        setCurrentSession({
          appId: focusedWindow.appId,
          startTime: Date.now()
        })
      }
    }
  }, [windows, currentSession])

  // 定期更新当前会话时间
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSession(prev => prev ? { ...prev, startTime: prev.startTime } : null)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // 生成统计数据
  const stats = useMemo(() => {
    const now = new Date()
    const cutoff = new Date()
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(now.getMonth() - 1)
        break
    }

    const filteredActivities = activities.filter(a => new Date(a.startTime) >= cutoff)
    
    const dailyStats: Record<string, DailyStats> = {}
    const appTotals: Record<string, number> = {}

    for (const activity of filteredActivities) {
      if (!dailyStats[activity.date]) {
        dailyStats[activity.date] = {
          date: activity.date,
          totalDuration: 0,
          apps: {}
        }
      }
      dailyStats[activity.date].totalDuration += activity.duration
      dailyStats[activity.date].apps[activity.appId] = 
        (dailyStats[activity.date].apps[activity.appId] || 0) + activity.duration
      
      appTotals[activity.appId] = (appTotals[activity.appId] || 0) + activity.duration
    }

    return {
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      appTotals,
      totalDuration: filteredActivities.reduce((sum, a) => sum + a.duration, 0)
    }
  }, [activities, timeframe])

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}小时${m}分钟`
    } else if (m > 0) {
      return `${m}分钟${s}秒`
    } else {
      return `${s}秒`
    }
  }

  // 排序应用统计
  const sortedApps = useMemo(() => {
    return Object.entries(stats.appTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [stats])

  // 最长活动时间作为基准
  const maxDuration = sortedApps.length > 0 ? sortedApps[0][1] : 1

  return (
    <div className="app-container app-activity-tracker" style={{ 
      background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '28px' }}>📊</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>活动追踪器</h2>
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>追踪你的应用使用情况</p>
        </div>
      </div>

      {/* 时间范围选择 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['day', 'week', 'month'] as const).map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: timeframe === tf ? '2px solid #6af' : '1px solid #444',
              background: timeframe === tf ? 'rgba(100,150,255,0.2)' : 'rgba(60,60,80,0.4)',
              color: timeframe === tf ? '#8af' : '#aaa',
              cursor: 'pointer',
              fontWeight: timeframe === tf ? 600 : 400
            }}
          >
            {tf === 'day' ? '今日' : tf === 'week' ? '本周' : '本月'}
          </button>
        ))}
      </div>

      {/* 当前活动 */}
      {currentSession && (
        <CurrentSessionDisplay currentSession={currentSession} formatDuration={formatDuration} />
      )}

      {/* 总统计 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        <div style={{
          background: 'rgba(60,60,80,0.4)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>总使用时长</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
            {formatDuration(stats.totalDuration)}
          </div>
        </div>
        <div style={{
          background: 'rgba(60,60,80,0.4)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '4px' }}>活跃应用数</div>
          <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
            {Object.keys(stats.appTotals).length}
          </div>
        </div>
      </div>

      {/* 应用排行 */}
      <div style={{ flex: 1 }}>
        <h3 style={{ color: '#aaa', fontSize: '14px', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          应用使用排行
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedApps.map(([appId, duration]: [string, number], idx: number) => {
            const app = appRegistry.find((a: AppDefinition) => a.id === appId)
            const percentage = (duration / maxDuration) * 100
            const colors = ['#6af', '#6fa', '#fa6', '#f6a', '#a6f', '#6ff', '#ff6', '#f96']
            return (
              <div key={appId} style={{
                background: 'rgba(60,60,80,0.4)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: colors[idx % colors.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>{idx + 1}</span>
                    <span style={{ color: '#fff' }}>{app?.name || appId}</span>
                  </div>
                  <span style={{ color: '#8af', fontWeight: 500 }}>{formatDuration(duration)}</span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(60,60,80,0.8)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]})`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            )
          })}
          {sortedApps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
              <p>开始使用应用，数据将在这里显示</p>
            </div>
          )}
        </div>
      </div>

      {/* 每日趋势 */}
      {stats.dailyStats.length > 0 && (
        <div>
          <h3 style={{ color: '#aaa', fontSize: '14px', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            每日趋势
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px' }}>
            {stats.dailyStats.slice(-7).map((day) => {
              const maxDay = Math.max(...stats.dailyStats.map(d => d.totalDuration))
              const height = maxDay > 0 ? (day.totalDuration / maxDay) * 100 : 0
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: 'linear-gradient(180deg, #6af, #48f)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px'
                  }} />
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                    {new Date(day.date).getDate()}日
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
