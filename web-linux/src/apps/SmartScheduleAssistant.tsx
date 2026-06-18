import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../../store'

interface ScheduleEvent {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  category: 'work' | 'personal' | 'meeting' | 'learning' | 'health' | 'other'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  aiSuggestion?: string
}

interface DayAnalysis {
  totalHours: number
  workHours: number
  meetingHours: number
  personalHours: number
  freeHours: number
  suggestions: string[]
  productivityScore: number
}

const CATEGORY_COLORS = {
  work: { bg: '#3b82f6', text: '#fff' },
  personal: { bg: '#8b5cf6', text: '#fff' },
  meeting: { bg: '#f59e0b', text: '#fff' },
  learning: { bg: '#10b981', text: '#fff' },
  health: { bg: '#ef4444', text: '#fff' },
  other: { bg: '#6b7280', text: '#fff' }
}

const CATEGORY_NAMES = {
  work: '工作',
  personal: '个人',
  meeting: '会议',
  learning: '学习',
  health: '健康',
  other: '其他'
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function analyzeDay(events: ScheduleEvent[]): DayAnalysis {
  const totalMinutes = 24 * 60
  let workMinutes = 0
  let meetingMinutes = 0
  let personalMinutes = 0
  let healthMinutes = 0
  let learningMinutes = 0
  
  events.forEach(event => {
    if (event.completed) return
    const start = parseTime(event.startTime)
    const end = parseTime(event.endTime)
    const duration = end - start
    
    switch (event.category) {
      case 'work': workMinutes += duration; break
      case 'meeting': meetingMinutes += duration; break
      case 'personal': personalMinutes += duration; break
      case 'health': healthMinutes += duration; break
      case 'learning': learningMinutes += duration; break
    }
  })
  
  const scheduledMinutes = workMinutes + meetingMinutes + personalMinutes + healthMinutes + learningMinutes
  const freeMinutes = totalMinutes - scheduledMinutes
  
  // 生成AI建议
  const suggestions: string[] = []
  
  if (workMinutes > 8 * 60) {
    suggestions.push('工作时间超过8小时，建议适当休息，避免过度疲劳')
  }
  
  if (meetingMinutes > 4 * 60) {
    suggestions.push('会议时间较长，建议评估会议必要性，提高会议效率')
  }
  
  if (healthMinutes < 30) {
    suggestions.push('健康活动时间不足，建议安排运动或休息时间')
  }
  
  if (freeMinutes < 2 * 60) {
    suggestions.push('自由时间较少，建议留出缓冲时间应对突发情况')
  }
  
  if (learningMinutes === 0 && workMinutes > 0) {
    suggestions.push('建议安排学习时间，持续提升技能')
  }
  
  // 计算生产力评分
  let score = 100
  if (workMinutes > 10 * 60) score -= 20
  if (meetingMinutes > 5 * 60) score -= 10
  if (healthMinutes < 30) score -= 15
  if (freeMinutes < 60) score -= 10
  if (events.filter(e => e.priority === 'high' && !e.completed).length > 5) score -= 10
  
  score = Math.max(0, Math.min(100, score))
  
  return {
    totalHours: 24,
    workHours: workMinutes / 60,
    meetingHours: meetingMinutes / 60,
    personalHours: personalMinutes / 60,
    freeHours: freeMinutes / 60,
    suggestions,
    productivityScore: score
  }
}

function generateAISuggestion(event: ScheduleEvent, allEvents: ScheduleEvent[]): string {
  const suggestions: string[] = []
  
  if (event.category === 'meeting' && parseTime(event.endTime) - parseTime(event.startTime) > 90) {
    suggestions.push('会议时间较长，建议提前准备议程，确保高效进行')
  }
  
  if (event.category === 'work' && event.priority === 'high') {
    suggestions.push('高优先级工作，建议在精力充沛时段完成')
  }
  
  if (event.category === 'health') {
    suggestions.push('健康活动有助于提高工作效率，建议坚持')
  }
  
  // 检查时间冲突
  const conflicts = allEvents.filter(e => 
    e.id !== event.id &&
    !e.completed &&
    (parseTime(event.startTime) >= parseTime(e.startTime) && parseTime(event.startTime) < parseTime(e.endTime)) ||
    (parseTime(event.endTime) > parseTime(e.startTime) && parseTime(event.endTime) <= parseTime(e.endTime))
  )
  
  if (conflicts.length > 0) {
    suggestions.push(`与 ${conflicts.length} 个日程存在时间重叠，请检查安排`)
  }
  
  return suggestions.join('\n') || '日程安排合理'
}

export default function SmartScheduleAssistant() {
  const theme = useStore((s) => s.theme)
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem('smart-schedule-events')
    return saved ? JSON.parse(saved) : []
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'analysis'>('timeline')
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    category: 'work' as ScheduleEvent['category'],
    priority: 'medium' as ScheduleEvent['priority']
  })
  
  // 保存到localStorage
  useEffect(() => {
    localStorage.setItem('smart-schedule-events', JSON.stringify(events))
  }, [events])
  
  // 分析当天日程
  const dayAnalysis = useMemo(() => analyzeDay(events), [events])
  
  // 添加日程
  const handleAddEvent = useCallback(() => {
    if (!formData.title.trim()) return
    
    const newEvent: ScheduleEvent = {
      id: generateId(),
      ...formData,
      completed: false,
      aiSuggestion: ''
    }
    
    newEvent.aiSuggestion = generateAISuggestion(newEvent, events)
    
    setEvents(prev => [...prev, newEvent].sort((a, b) => 
      parseTime(a.startTime) - parseTime(b.startTime)
    ))
    
    setFormData({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      priority: 'medium'
    })
    setShowAddForm(false)
  }, [formData, events])
  
  // 更新日程
  const handleUpdateEvent = useCallback(() => {
    if (!editingEvent || !formData.title.trim()) return
    
    setEvents(prev => prev.map(e => 
      e.id === editingEvent.id 
        ? { ...e, ...formData, aiSuggestion: generateAISuggestion({ ...e, ...formData }, prev.filter(x => x.id !== e.id)) }
        : e
    ).sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)))
    
    setEditingEvent(null)
    setFormData({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      priority: 'medium'
    })
  }, [editingEvent, formData])
  
  // 删除日程
  const handleDeleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])
  
  // 标记完成
  const handleToggleComplete = useCallback((id: string) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, completed: !e.completed } : e
    ))
  }, [])
  
  // 开始编辑
  const handleStartEdit = useCallback((event: ScheduleEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      priority: event.priority
    })
    setShowAddForm(true)
  }, [])
  
  // 时间轴点击
  const handleTimelineClick = useCallback((hour: number) => {
    setSelectedHour(hour)
    setFormData({
      title: '',
      description: '',
      startTime: formatTime(hour * 60),
      endTime: formatTime((hour + 1) * 60),
      category: 'work',
      priority: 'medium'
    })
    setShowAddForm(true)
  }, [])
  
  // 时间轴渲染
  const renderTimeline = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '16px',
        maxHeight: '600px',
        overflow: 'auto'
      }}>
        {hours.map(hour => {
          const hourEvents = events.filter(e => {
            const startHour = Math.floor(parseTime(e.startTime) / 60)
            return startHour === hour
          })
          
          return (
            <div 
              key={hour}
              onClick={() => handleTimelineClick(hour)}
              style={{
                display: 'flex',
                minHeight: '50px',
                borderRadius: '6px',
                background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {/* 时间标签 */}
              <div style={{
                width: '60px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 500,
                color: theme === 'dark' ? '#888' : '#666',
                borderRight: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`
              }}>
                {formatTime(hour * 60)}
              </div>
              
              {/* 事件区域 */}
              <div style={{
                flex: 1,
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(event)
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      background: CATEGORY_COLORS[event.category].bg,
                      color: CATEGORY_COLORS[event.category].text,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: event.completed ? 0.6 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: PRIORITY_COLORS[event.priority]
                    }} />
                    <span style={{ flex: 1 }}>{event.title}</span>
                    <span style={{ fontSize: '10px' }}>
                      {event.startTime} - {event.endTime}
                    </span>
                    {event.completed && <span>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  
  // 列表渲染
  const renderList = () => (
    <div style={{
      padding: '16px',
      maxHeight: '600px',
      overflow: 'auto'
    }}>
      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#888'
        }}>
          暂无日程安排，点击添加按钮创建新日程
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {events.map(event => (
            <div
              key={event.id}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1a1a2e' : '#fff',
                border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                opacity: event.completed ? 0.6 : 1
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={event.completed}
                  onChange={() => handleToggleComplete(event.id)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: CATEGORY_COLORS[event.category].bg,
                      color: CATEGORY_COLORS[event.category].text,
                      fontSize: '11px'
                    }}>
                      {CATEGORY_NAMES[event.category]}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: event.completed ? 'line-through' : 'none'
                    }}>
                      {event.title}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    {event.startTime} - {event.endTime}
                    {event.description && ` · ${event.description}`}
                  </div>
                  {event.aiSuggestion && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: '4px',
                      background: theme === 'dark' ? '#0d0d1a' : '#f0f0f0',
                      fontSize: '11px',
                      color: '#6366f1'
                    }}>
                      💡 {event.aiSuggestion}
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => handleStartEdit(event)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#6366f1',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  
  // 分析视图渲染
  const renderAnalysis = () => (
    <div style={{
      padding: '16px',
      maxHeight: '600px',
      overflow: 'auto'
    }}>
      {/* 生产力评分 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: dayAnalysis.productivityScore >= 80 ? '#10b981' :
                 dayAnalysis.productivityScore >= 60 ? '#f59e0b' : '#ef4444'
        }}>
          {dayAnalysis.productivityScore}
        </div>
        <div style={{ fontSize: '14px', color: '#888' }}>生产力评分</div>
      </div>
      
      {/* 时间分布 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>工作时间</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{dayAnalysis.workHours.toFixed(1)}h</div>
        </div>
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>会议时间</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{dayAnalysis.meetingHours.toFixed(1)}h</div>
        </div>
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>个人时间</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{dayAnalysis.personalHours.toFixed(1)}h</div>
        </div>
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>自由时间</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{dayAnalysis.freeHours.toFixed(1)}h</div>
        </div>
      </div>
      
      {/* AI建议 */}
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        background: '#6366f1',
        color: '#fff'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
          AI 智能建议
        </div>
        {dayAnalysis.suggestions.length > 0 ? (
          <ul style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {dayAnalysis.suggestions.map((s, i) => (
              <li key={i} style={{ fontSize: '12px' }}>💡 {s}</li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: '12px' }}>日程安排合理，继续保持</div>
        )}
      </div>
      
      {/* 时间分布可视化 */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        borderRadius: '8px',
        background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>24小时时间分布</div>
        <div style={{
          display: 'flex',
          height: '30px',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {dayAnalysis.workHours > 0 && (
            <div style={{
              width: `${(dayAnalysis.workHours / 24) * 100}%`,
              background: CATEGORY_COLORS.work.bg
            }} title={`工作: ${dayAnalysis.workHours.toFixed(1)}h`} />
          )}
          {dayAnalysis.meetingHours > 0 && (
            <div style={{
              width: `${(dayAnalysis.meetingHours / 24) * 100}%`,
              background: CATEGORY_COLORS.meeting.bg
            }} title={`会议: ${dayAnalysis.meetingHours.toFixed(1)}h`} />
          )}
          {dayAnalysis.personalHours > 0 && (
            <div style={{
              width: `${(dayAnalysis.personalHours / 24) * 100}%`,
              background: CATEGORY_COLORS.personal.bg
            }} title={`个人: ${dayAnalysis.personalHours.toFixed(1)}h`} />
          )}
          {dayAnalysis.freeHours > 0 && (
            <div style={{
              width: `${(dayAnalysis.freeHours / 24) * 100}%`,
              background: theme === 'dark' ? '#3a3a5e' : '#ddd'
            }} title={`自由: ${dayAnalysis.freeHours.toFixed(1)}h`} />
          )}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '10px',
          color: '#888'
        }}>
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    </div>
  )
  
  return (
    <div style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
      color: theme === 'dark' ? '#e0e0e0' : '#333'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: theme === 'dark' ? '#fff' : '#333'
        }}>
          智能日程助手
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['timeline', 'list', 'analysis'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === mode 
                  ? '#6366f1' 
                  : (theme === 'dark' ? '#3a3a5e' : '#e0e0e0'),
                color: viewMode === mode ? '#fff' : (theme === 'dark' ? '#ccc' : '#666'),
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {mode === 'timeline' ? '时间轴' : mode === 'list' ? '列表' : '分析'}
            </button>
          ))}
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingEvent(null)
              setFormData({
                title: '',
                description: '',
                startTime: '09:00',
                endTime: '10:00',
                category: 'work',
                priority: 'medium'
              })
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            + 添加日程
          </button>
        </div>
      </div>
      
      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          background: theme === 'dark' ? '#0d0d1a' : '#fff',
          border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
          marginBottom: '8px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="日程标题"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                类别
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ScheduleEvent['category'] }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              >
                {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                开始时间
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                结束时间
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ScheduleEvent['priority'] }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'block' }}>
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="可选描述"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
                  background: theme === 'dark' ? '#1a1a2e' : '#fff',
                  color: theme === 'dark' ? '#e0e0e0' : '#333',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingEvent(null)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: theme === 'dark' ? '#3a3a5e' : '#e0e0e0',
                color: theme === 'dark' ? '#ccc' : '#666',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              取消
            </button>
            <button
              onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#6366f1',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {editingEvent ? '更新' : '添加'}
            </button>
          </div>
        </div>
      )}
      
      {/* 内容区 */}
      <div style={{
        flex: 1,
        borderRadius: '8px',
        background: theme === 'dark' ? '#0d0d1a' : '#fff',
        border: `1px solid ${theme === 'dark' ? '#3a3a5e' : '#ddd'}`,
        overflow: 'hidden'
      }}>
        {viewMode === 'timeline' && renderTimeline()}
        {viewMode === 'list' && renderList()}
        {viewMode === 'analysis' && renderAnalysis()}
      </div>
    </div>
  )
}