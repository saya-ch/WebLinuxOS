import { useState, useEffect, useRef, useMemo } from 'react'

type Category = 'Work' | 'Personal' | 'Study' | 'Health' | 'Other'

interface AgendaEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  category: Category
}

const CATEGORY_COLORS: Record<Category, string> = {
  Work: '#3b82f6',
  Personal: '#22c55e',
  Study: '#a855f7',
  Health: '#f97316',
  Other: '#6b7280',
}

const CATEGORIES: Category[] = ['Work', 'Personal', 'Study', 'Health', 'Other']

const STORAGE_KEY = 'daily-agenda-events'

const HOURS: number[] = Array.from({ length: 16 }, (_, i) => 7 + i)

const DAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeToHour(t: string): number {
  return parseInt(t.split(':')[0], 10)
}

function hourToTime(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

export default function DailyAgenda() {
  const [events, setEvents] = useState<AgendaEvent[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [currentDate, setCurrentDate] = useState<string>(fmtDate(new Date()))
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [dragEventId, setDragEventId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<number>(0)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalStart, setModalStart] = useState('09:00')
  const [modalEnd, setModalEnd] = useState('10:00')
  const [modalCategory, setModalCategory] = useState<Category>('Work')
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events])

  const dayEvents = useMemo(
    () => events.filter((e) => e.date === currentDate),
    [events, currentDate]
  )

  const weekDates = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const start = new Date(d)
    start.setDate(d.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(start)
      nd.setDate(start.getDate() + i)
      return fmtDate(nd)
    })
  }, [currentDate])

  const stats = useMemo(() => {
    const byCat: Record<Category, number> = {
      Work: 0, Personal: 0, Study: 0, Health: 0, Other: 0,
    }
    for (const e of dayEvents) {
      const h = timeToHour(e.endTime) - timeToHour(e.startTime)
      byCat[e.category] += h
    }
    const total = dayEvents.reduce((s, e) => s + timeToHour(e.endTime) - timeToHour(e.startTime), 0)
    return { count: dayEvents.length, byCat, total }
  }, [dayEvents])

  const openAddModal = (startHour?: number) => {
    setEditingEvent(null)
    setModalTitle('')
    setModalStart(startHour !== undefined ? hourToTime(startHour) : '09:00')
    setModalEnd(startHour !== undefined ? hourToTime(Math.min(startHour + 1, 22)) : '10:00')
    setModalCategory('Work')
    setShowEventModal(true)
  }

  const openEditModal = (ev: AgendaEvent) => {
    setEditingEvent(ev)
    setModalTitle(ev.title)
    setModalStart(ev.startTime)
    setModalEnd(ev.endTime)
    setModalCategory(ev.category)
    setShowEventModal(true)
  }

  const saveEvent = () => {
    if (!modalTitle.trim()) return
    if (timeToHour(modalEnd) <= timeToHour(modalStart)) return

    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? { ...e, title: modalTitle.trim(), startTime: modalStart, endTime: modalEnd, category: modalCategory }
            : e
        )
      )
    } else {
      const newEv: AgendaEvent = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: modalTitle.trim(),
        date: currentDate,
        startTime: modalStart,
        endTime: modalEnd,
        category: modalCategory,
      }
      setEvents((prev) => [...prev, newEv])
    }
    setShowEventModal(false)
  }

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const handleGridClick = (e: React.MouseEvent) => {
    if (dragEventId) return
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const hourHeight = 48
    const hour = Math.max(7, Math.min(22, 7 + Math.floor(y / hourHeight)))

    if (selectionStart === null) {
      setSelectionStart(hour)
    } else {
      const start = Math.min(selectionStart, hour)
      const end = Math.max(selectionStart, hour) + 1
      setSelectionStart(null)
      openAddModal(start)
      setModalEnd(hourToTime(Math.min(end, 22)))
    }
  }

  const handleEventMouseDown = (e: React.MouseEvent, ev: AgendaEvent) => {
    e.stopPropagation()
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const evStartPx = (timeToHour(ev.startTime) - 7) * 48
    setDragOffset(y - evStartPx)
    setDragEventId(ev.id)
  }

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!dragEventId) return
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top - dragOffset
    const newHour = Math.max(7, Math.min(22, 7 + Math.round(y / 48)))
    const ev = events.find((x) => x.id === dragEventId)
    if (!ev) return
    const duration = timeToHour(ev.endTime) - timeToHour(ev.startTime)
    const newStart = Math.max(7, Math.min(22 - duration, newHour))
    const newEnd = newStart + duration
    setEvents((prev) =>
      prev.map((x) =>
        x.id === dragEventId
          ? { ...x, startTime: hourToTime(newStart), endTime: hourToTime(newEnd) }
          : x
      )
    )
  }

  const handleGridMouseUp = () => {
    setDragEventId(null)
  }

  const goPrevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(fmtDate(d))
    setSelectionStart(null)
  }

  const goNextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(fmtDate(d))
    setSelectionStart(null)
  }

  const goToday = () => {
    setCurrentDate(fmtDate(new Date()))
    setSelectionStart(null)
  }

  const goTomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    setCurrentDate(fmtDate(d))
    setSelectionStart(null)
  }

  const selectedDateObj = new Date(currentDate)
  const selectedDayName = DAYS_CN[selectedDateObj.getDay()]

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    navGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    navBtn: {
      padding: '6px 10px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      background: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      color: '#475569',
    },
    navBtnActive: {
      padding: '6px 10px',
      border: '1px solid #3b82f6',
      borderRadius: 6,
      background: '#3b82f6',
      cursor: 'pointer',
      fontSize: 13,
      color: '#fff',
    },
    dateLabel: {
      fontSize: 16,
      fontWeight: 600,
      color: '#0f172a',
      minWidth: 180,
      textAlign: 'center',
    },
    viewToggle: {
      display: 'flex',
      gap: 4,
      background: '#f1f5f9',
      padding: 3,
      borderRadius: 8,
    },
    viewBtn: {
      padding: '5px 12px',
      border: 'none',
      borderRadius: 6,
      background: 'transparent',
      cursor: 'pointer',
      fontSize: 13,
      color: '#64748b',
    },
    viewBtnActive: {
      padding: '5px 12px',
      border: 'none',
      borderRadius: 6,
      background: '#fff',
      cursor: 'pointer',
      fontSize: 13,
      color: '#0f172a',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    },
    body: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    mainArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 0',
      position: 'relative',
    },
    gridWrap: {
      position: 'relative',
      minHeight: HOURS.length * 48,
      userSelect: 'none',
    },
    timeColumn: {
      display: 'grid',
      gridTemplateColumns: '60px 1fr',
    },
    timeCell: {
      height: 48,
      fontSize: 11,
      color: '#94a3b8',
      padding: '4px 8px',
      textAlign: 'right',
      borderTop: '1px solid #f1f5f9',
      position: 'relative',
      top: -6,
    },
    gridArea: {
      position: 'relative',
      minHeight: HOURS.length * 48,
      cursor: 'crosshair',
    },
    hourLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 48,
      borderTop: '1px solid #f1f5f9',
    },
    selectionBox: {
      position: 'absolute',
      left: 4,
      right: 4,
      background: 'rgba(59, 130, 246, 0.15)',
      border: '2px dashed rgba(59, 130, 246, 0.5)',
      borderRadius: 6,
      pointerEvents: 'none',
    },
    eventBlock: {
      position: 'absolute',
      left: 4,
      right: 4,
      borderRadius: 6,
      padding: '4px 8px',
      color: '#fff',
      fontSize: 12,
      cursor: 'grab',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
    },
    eventDelete: {
      background: 'rgba(255,255,255,0.25)',
      border: 'none',
      color: '#fff',
      borderRadius: 3,
      width: 18,
      height: 18,
      cursor: 'pointer',
      fontSize: 11,
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    sidebar: {
      width: 220,
      background: '#fff',
      borderLeft: '1px solid #e2e8f0',
      padding: 16,
      overflowY: 'auto',
      flexShrink: 0,
    },
    statsTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: '#475569',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      fontSize: 13,
      borderBottom: '1px solid #f1f5f9',
    },
    catDot: {
      width: 10,
      height: 10,
      borderRadius: 3,
      marginRight: 8,
      flexShrink: 0,
    },
    catLabel: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      color: '#334155',
      fontSize: 12,
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: 14,
      fontWeight: 600,
      color: '#0f172a',
      borderTop: '2px solid #e2e8f0',
      marginTop: 8,
    },
    weekGrid: {
      display: 'grid',
      gridTemplateColumns: `repeat(7, 1fr)`,
      flex: 1,
      overflow: 'auto',
    },
    weekColumn: {
      borderRight: '1px solid #e2e8f0',
      position: 'relative',
      minHeight: HOURS.length * 48,
    },
    weekHeader: {
      padding: '8px 4px',
      textAlign: 'center',
      fontSize: 12,
      fontWeight: 600,
      color: '#475569',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
    },
    weekHeaderToday: {
      background: '#dbeafe',
      color: '#1d4ed8',
    },
    addBtn: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: '#3b82f6',
      color: '#fff',
      border: 'none',
      fontSize: 22,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalBox: {
      background: '#fff',
      borderRadius: 12,
      padding: 24,
      width: 380,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 16,
      color: '#0f172a',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      fontSize: 14,
      marginBottom: 12,
      boxSizing: 'border-box',
      outline: 'none',
    },
    timeRow: {
      display: 'flex',
      gap: 8,
      marginBottom: 12,
    },
    timeInput: {
      flex: 1,
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      fontSize: 14,
      outline: 'none',
    },
    catRow: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    modalActions: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
    },
    cancelBtn: {
      padding: '8px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      background: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      color: '#64748b',
    },
    saveBtn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: 8,
      background: '#3b82f6',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 500,
    },
    deleteBtn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: 8,
      background: '#ef4444',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      marginRight: 'auto',
    },
    datePicker: {
      padding: '6px 10px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 13,
      color: '#475569',
    },
  }

  const catChipStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 999,
    border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
    background: active ? `${color}15` : '#fff',
    color: active ? color : '#64748b',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  })

  const todayStr = fmtDate(new Date())

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.navGroup}>
          <button style={styles.navBtn} onClick={goPrevDay}>◀</button>
          <button
            style={currentDate === todayStr ? styles.navBtnActive : styles.navBtn}
            onClick={goToday}
          >
            今天
          </button>
          <button style={styles.navBtn} onClick={goTomorrow}>明天</button>
          <button style={styles.navBtn} onClick={goNextDay}>▶</button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => { setCurrentDate(e.target.value); setSelectionStart(null) }}
            style={styles.datePicker}
          />
          <div style={styles.dateLabel}>
            {selectedDateObj.getMonth() + 1}月{selectedDateObj.getDate()}日 {selectedDayName}
          </div>
        </div>
        <div style={styles.viewToggle}>
          <button
            style={viewMode === 'day' ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setViewMode('day')}
          >
            日视图
          </button>
          <button
            style={viewMode === 'week' ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setViewMode('week')}
          >
            周视图
          </button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.mainArea}>
          {viewMode === 'day' ? (
            <div style={styles.timeColumn}>
              <div style={{ position: 'relative', minHeight: HOURS.length * 48 }}>
                {HOURS.map((h) => (
                  <div key={h} style={styles.timeCell}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div
                ref={gridRef}
                style={styles.gridArea}
                onClick={handleGridClick}
                onMouseMove={handleGridMouseMove}
                onMouseUp={handleGridMouseUp}
                onMouseLeave={handleGridMouseUp}
              >
                {HOURS.map((h) => (
                  <div key={h} style={{ ...styles.hourLine, top: (h - 7) * 48 }} />
                ))}

                {selectionStart !== null && (
                  <div
                    style={{
                      ...styles.selectionBox,
                      top: (selectionStart - 7) * 48 + 2,
                      height: 46,
                    }}
                  />
                )}

                {dayEvents.map((ev) => {
                  const top = (timeToHour(ev.startTime) - 7) * 48
                  const height = (timeToHour(ev.endTime) - timeToHour(ev.startTime)) * 48
                  return (
                    <div
                      key={ev.id}
                      style={{
                        ...styles.eventBlock,
                        top: top + 2,
                        height: height - 4,
                        background: CATEGORY_COLORS[ev.category],
                      }}
                      onMouseDown={(e) => handleEventMouseDown(e, ev)}
                      onClick={(e) => { e.stopPropagation(); openEditModal(ev) }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{ev.title}</div>
                        <div style={{ fontSize: 10, opacity: 0.85 }}>
                          {ev.startTime} - {ev.endTime}
                        </div>
                      </div>
                      <button
                        style={styles.eventDelete}
                        onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id) }}
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={styles.weekGrid}>
              {weekDates.map((dateStr) => {
                const d = new Date(dateStr)
                const isToday = dateStr === todayStr
                const dayEvs = events.filter((e) => e.date === dateStr)
                return (
                  <div key={dateStr} style={styles.weekColumn}>
                    <div style={{ ...styles.weekHeader, ...(isToday ? styles.weekHeaderToday : {}) }}>
                      {DAYS_CN[d.getDay()]} {d.getMonth() + 1}/{d.getDate()}
                    </div>
                    <div
                      style={{ position: 'relative', minHeight: HOURS.length * 48 }}
                      onClick={() => { setCurrentDate(dateStr); setViewMode('day') }}
                    >
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: (h - 7) * 48,
                            height: 48,
                            borderTop: '1px solid #f1f5f9',
                          }}
                        />
                      ))}
                      {dayEvs.map((ev) => {
                        const top = (timeToHour(ev.startTime) - 7) * 48
                        const height = (timeToHour(ev.endTime) - timeToHour(ev.startTime)) * 48
                        return (
                          <div
                            key={ev.id}
                            style={{
                              position: 'absolute',
                              left: 2,
                              right: 2,
                              top: top + 2,
                              height: height - 4,
                              background: CATEGORY_COLORS[ev.category],
                              borderRadius: 5,
                              padding: '2px 4px',
                              color: '#fff',
                              fontSize: 10,
                              overflow: 'hidden',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => { e.stopPropagation(); setCurrentDate(dateStr); setViewMode('day') }}
                            title={`${ev.title} ${ev.startTime}-${ev.endTime}`}
                          >
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ev.title}
                            </div>
                            <div style={{ opacity: 0.8, fontSize: 9 }}>
                              {ev.startTime}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={styles.sidebar}>
          <div style={styles.statsTitle}>今日统计</div>
          <div style={styles.statRow}>
            <span style={{ color: '#334155' }}>事件总数</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{stats.count}</span>
          </div>
          <div style={{ height: 12 }} />
          <div style={styles.statsTitle}>分类时长</div>
          {CATEGORIES.map((cat) => (
            <div key={cat} style={styles.statRow}>
              <span style={styles.catLabel}>
                <span style={{ ...styles.catDot, background: CATEGORY_COLORS[cat] }} />
                {cat}
              </span>
              <span style={{ fontWeight: 500, color: '#475569' }}>
                {stats.byCat[cat]}h
              </span>
            </div>
          ))}
          <div style={styles.totalRow}>
            <span>合计</span>
            <span>{stats.total}h</span>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ ...styles.statsTitle, marginBottom: 8 }}>操作提示</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
              • 点击时间块添加事件<br />
              • 拖拽事件块调整时间<br />
              • 点击事件编辑详情<br />
              • 所有数据自动保存
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'day' && (
        <button style={styles.addBtn} onClick={() => openAddModal()}>+</button>
      )}

      {showEventModal && (
        <div style={styles.modal} onClick={() => setShowEventModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              {editingEvent ? '编辑事件' : '新建事件'}
            </div>
            <input
              autoFocus
              style={styles.input}
              placeholder="事件标题"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
            />
            <div style={styles.timeRow}>
              <input
                type="time"
                style={styles.timeInput}
                value={modalStart}
                onChange={(e) => setModalStart(e.target.value)}
                step={1800}
              />
              <input
                type="time"
                style={styles.timeInput}
                value={modalEnd}
                onChange={(e) => setModalEnd(e.target.value)}
                step={1800}
              />
            </div>
            <div style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  style={catChipStyle(modalCategory === cat, CATEGORY_COLORS[cat])}
                  onClick={() => setModalCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div style={styles.modalActions}>
              {editingEvent && (
                <button
                  style={styles.deleteBtn}
                  onClick={() => { deleteEvent(editingEvent.id); setShowEventModal(false) }}
                >
                  删除
                </button>
              )}
              <button style={styles.cancelBtn} onClick={() => setShowEventModal(false)}>
                取消
              </button>
              <button style={styles.saveBtn} onClick={saveEvent}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}