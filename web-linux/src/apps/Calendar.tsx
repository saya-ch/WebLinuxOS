import React, { useState, useMemo } from 'react'

interface CalendarEvent {
  id: string
  date: string
  title: string
  description?: string
  time?: string
  color?: string
}

const EVENT_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '黄色', value: '#eab308' },
  { name: '绿色', value: '#22c55e' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '紫色', value: '#a855f7' },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const now = Date.now()
    return [
      { id: '1', date: new Date().toISOString().split('T')[0], title: '团队会议', description: '每周例会', time: '10:00', color: '#3b82f6' },
      { id: '2', date: new Date().toISOString().split('T')[0], title: '项目评审', time: '14:00', color: '#f97316' },
      { id: '3', date: new Date(now + 86400000).toISOString().split('T')[0], title: '代码审查', color: '#22c55e' },
      { id: '4', date: new Date(now + 86400000 * 2).toISOString().split('T')[0], title: '发布新版本', description: 'WebLinuxOS v3.4', time: '15:00', color: '#a855f7' },
    ]
  })
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventColor, setEventColor] = useState('#3b82f6')
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function prevPeriod() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    }
    setSelectedDate(null)
  }

  function nextPeriod() {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    }
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedDate(todayStr)
  }

  function handleDateClick(dateStr: string) {
    setSelectedDate(dateStr)
    setShowAddEvent(true)
    setEventTitle('')
    setEventDescription('')
    setEventTime('')
    setEventColor('#3b82f6')
  }

  function handleAddEvent() {
    if (eventTitle.trim() && selectedDate) {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        date: selectedDate,
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        time: eventTime || undefined,
        color: eventColor,
      }
      setEvents((prev) => [...prev, newEvent])
      setEventTitle('')
      setEventDescription('')
      setEventTime('')
      setShowAddEvent(false)
    }
  }

  function handleDeleteEvent(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    return events.filter((e) => e.date === dateStr)
  }

  const days = ['日', '一', '二', '三', '四', '五', '六']

  const weekDays = useMemo(() => {
    const result = []
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      for (let i = 0; i < firstDay; i++) {
        result.push(null)
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        result.push(dateStr)
      }
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
      }
    }
    return result
  }, [currentDate, month, year, viewMode])

  const dayViewHours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

  return (
    <div className="app-container app-calendar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="app-calendar-nav-btn" onClick={prevPeriod}>◀</button>
            <span style={{ fontSize: 20, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
              {viewMode === 'month' ? `${year}年 ${month + 1}月` : `${currentDate.getMonth() + 1}/${currentDate.getDate()}`}
            </span>
            <button className="app-calendar-nav-btn" onClick={nextPeriod}>▶</button>
            <button className="app-calendar-today-btn" onClick={goToToday}>今天</button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                className={`app-calendar-view-btn${viewMode === mode ? ' active' : ''}`}
                onClick={() => { setViewMode(mode); setSelectedDate(null) }}
              >
                {mode === 'month' ? '月' : mode === 'week' ? '周' : '日'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedDate || todayStr}</div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
              {days[new Date(selectedDate || todayStr).getDay()]}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
            {dayViewHours.map((hour) => (
              <React.Fragment key={hour}>
                <div style={{ fontSize: 12, color: '#888', padding: 8 }}>{hour}</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', minHeight: 60 }}>
                  {getEventsForDate(selectedDate || todayStr).filter((e) => {
                    if (!e.time) return hour === '09:00'
                    return e.time.startsWith(hour.split(':')[0])
                  }).map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        margin: 4,
                        padding: 8,
                        background: ev.color,
                        borderRadius: 6,
                        fontSize: 13,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        {ev.time && <span style={{ fontSize: 11, opacity: 0.8 }}>{ev.time} </span>}
                        {ev.title}
                        {ev.description && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{ev.description}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: 4,
                          color: '#fff',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
          {showAddEvent && selectedDate && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>添加事件</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="事件标题"
                  className="app-input"
                />
                <input
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="描述（可选）"
                  className="app-input"
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="app-input"
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#888' }}>颜色:</span>
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setEventColor(c.value)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: eventColor === c.value ? '2px solid #fff' : 'none',
                        background: c.value,
                        cursor: 'pointer',
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="app-calendar-btn" onClick={() => setShowAddEvent(false)}>取消</button>
                  <button className="app-calendar-btn primary" onClick={handleAddEvent}>添加</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'week' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
            {weekDays.filter(Boolean).map((dateStr) => {
              if (!dateStr) return null
              const date = new Date(dateStr)
              const isToday = dateStr === todayStr
              return (
                <div key={dateStr} className="app-calendar-weekday-header">
                  <div className={`app-calendar-day-name${isToday ? ' today' : ''}`}>
                    {days[date.getDay()]}
                  </div>
                  <div className={`app-calendar-day-number${isToday ? ' today' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: viewMode === 'week' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)', gap: 2, overflow: 'auto' }}>
            {weekDays.map((dateStr, index) => {
              if (!dateStr) {
                return <div key={`empty-${index}`} className="app-calendar-cell empty" />
              }
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dayEvents = getEventsForDate(dateStr)
              return (
                <div
                  key={dateStr}
                  className={`app-calendar-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  onClick={() => handleDateClick(dateStr)}
                >
                  {viewMode === 'month' && (
                    <span className="app-calendar-day">{new Date(dateStr).getDate()}</span>
                  )}
                  {dayEvents.length > 0 && (
                    <div className="app-calendar-events">
                      {dayEvents.slice(0, viewMode === 'month' ? 4 : undefined).map((ev) => (
                        <div
                          key={ev.id}
                          className="app-calendar-event-item"
                          style={{ background: ev.color }}
                          title={ev.title + (ev.time ? ` ${ev.time}` : '')}
                        >
                          <span style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ev.time && <span className="app-calendar-event-time">{ev.time}</span>}
                            {ev.title}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="app-calendar-event-more">+{dayEvents.length - 4}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {selectedDate ? (
          <div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
              {selectedDate} - {days[new Date(selectedDate).getDay()]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 120, overflow: 'auto' }}>
              {getEventsForDate(selectedDate).map((ev) => (
                <div
                  key={ev.id}
                  className="app-calendar-footer-event"
                  style={{
                    padding: 10,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 20, borderRadius: 2, background: ev.color }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {ev.time && <span style={{ color: '#888', marginRight: 8 }}>{ev.time}</span>}
                        {ev.title}
                      </div>
                      {ev.description && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{ev.description}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="app-calendar-delete-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {showAddEvent && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                <input
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEvent()
                    if (e.key === 'Escape') setShowAddEvent(false)
                  }}
                  placeholder="添加事件..."
                  className="app-input"
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="app-input"
                    style={{ flex: 1 }}
                  />
                  <button className="app-calendar-btn" onClick={handleAddEvent}>添加</button>
                  <button className="app-calendar-btn" onClick={() => setShowAddEvent(false)}>取消</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#666', fontSize: 13 }}>点击日期查看或添加事件</div>
        )}
      </div>
    </div>
  )
}