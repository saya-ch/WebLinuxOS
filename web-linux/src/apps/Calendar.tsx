import { useState } from 'react'

interface CalendarEvent {
  date: string
  title: string
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  function handleDateClick(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setShowAddEvent(true)
    setEventTitle('')
  }

  function handleAddEvent() {
    if (eventTitle.trim() && selectedDate) {
      setEvents((prev) => [...prev, { date: selectedDate, title: eventTitle.trim() }])
      setEventTitle('')
      setShowAddEvent(false)
    }
  }

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    return events.filter((e) => e.date === dateStr)
  }

  const days = ['日', '一', '二', '三', '四', '五', '六']
  const cells: React.ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="app-calendar-cell empty" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const isSelected = dateStr === selectedDate
    const dayEvents = getEventsForDate(dateStr)

    cells.push(
      <div
        key={day}
        className={`app-calendar-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
        onClick={() => handleDateClick(day)}
      >
        <span className="app-calendar-day">{day}</span>
        {dayEvents.length > 0 && (
          <div className="app-calendar-event-dots">
            {dayEvents.slice(0, 3).map((ev, i) => (
              <span key={i} className="app-calendar-dot" title={ev.title} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-container app-calendar" style={{ padding: 16 }}>
      <div className="app-calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="app-toolbar-btn" onClick={prevMonth}>◀</button>
        <span style={{ fontSize: 20, fontWeight: 600 }}>
          {year}年 {month + 1}月
        </span>
        <button className="app-toolbar-btn" onClick={nextMonth}>▶</button>
      </div>

      <div className="app-calendar-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8, fontWeight: 600, color: '#888', fontSize: 14 }}>
        {days.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="app-calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells}
      </div>

      <div className="app-calendar-footer" style={{ marginTop: 16, padding: '12px 16px', borderTop: '1px solid #333', minHeight: 80 }}>
        {selectedDate && (
          <div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>选中日期: {selectedDate}</div>
            <div style={{ marginBottom: 8 }}>
              {getEventsForDate(selectedDate).map((ev, i) => (
                <div key={i} className="app-calendar-event" style={{ padding: '4px 8px', marginBottom: 4, background: 'var(--accent-bg)', borderRadius: 4, fontSize: 13 }}>
                  📌 {ev.title}
                </div>
              ))}
            </div>
            {showAddEvent && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddEvent(); if (e.key === 'Escape') setShowAddEvent(false) }}
                  placeholder="事件标题"
                  className="app-input"
                  style={{ flex: 1 }}
                />
                <button className="app-toolbar-btn" onClick={handleAddEvent}>添加</button>
                <button className="app-toolbar-btn" onClick={() => setShowAddEvent(false)}>取消</button>
              </div>
            )}
          </div>
        )}
        {!selectedDate && (
          <div style={{ color: '#666', fontSize: 13 }}>点击日期查看或添加事件</div>
        )}
      </div>
    </div>
  )
}