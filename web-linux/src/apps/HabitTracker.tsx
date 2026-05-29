import { useState, useCallback, memo } from 'react'
import { useStore } from '../store'

interface Habit {
  id: string
  name: string
  color: string
  completedDates: string[]
  streak: number
  created: number
}

const colors = [
  '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#d946ef'
]

const HabitTracker = memo(function HabitTracker() {
  const addNotification = useStore((s) => s.addNotification)
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('weblinux-habits')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const saveHabits = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits)
    localStorage.setItem('weblinux-habits', JSON.stringify(newHabits))
  }, [])

  const addHabit = useCallback(() => {
    if (!newHabitName.trim()) return
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: selectedColor,
      completedDates: [],
      streak: 0,
      created: Date.now()
    }
    saveHabits([...habits, newHabit])
    setNewHabitName('')
    addNotification({ title: '习惯已添加', message: newHabit.name, type: 'success' })
  }, [newHabitName, selectedColor, habits, saveHabits, addNotification])

  const deleteHabit = useCallback((id: string) => {
    if (confirm('确定要删除这个习惯吗？')) {
      const habit = habits.find(h => h.id === id)
      saveHabits(habits.filter(h => h.id !== id))
      addNotification({ title: '习惯已删除', message: habit?.name || '', type: 'info' })
    }
  }, [habits, saveHabits, addNotification])

  const toggleHabit = useCallback((id: string) => {
    const newHabits = habits.map(habit => {
      if (habit.id !== id) return habit
      
      const isCompleted = habit.completedDates.includes(today)
      let newDates: string[]
      let newStreak = habit.streak
      
      if (isCompleted) {
        newDates = habit.completedDates.filter(d => d !== today)
        newStreak = calculateStreak(newDates)
      } else {
        newDates = [...habit.completedDates, today]
        newStreak = calculateStreak(newDates)
      }
      
      return {
        ...habit,
        completedDates: newDates,
        streak: newStreak
      }
    })
    saveHabits(newHabits)
  }, [habits, today, saveHabits])

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0
    
    const sortedDates = [...dates].sort().reverse()
    let streak = 0
    let currentDate = new Date()
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(currentDate)
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      if (sortedDates.includes(checkDateStr)) {
        streak++
      } else if (i === 0) {
        const yesterday = new Date(currentDate)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        if (sortedDates.includes(yesterdayStr)) {
          streak++
          currentDate = yesterday
        } else {
          break
        }
      } else {
        break
      }
    }
    return streak
  }

  const startEdit = useCallback((habit: Habit) => {
    setEditingId(habit.id)
    setEditingName(habit.name)
  }, [])

  const saveEdit = useCallback((id: string) => {
    if (!editingName.trim()) return
    const newHabits = habits.map(habit => 
      habit.id === id ? { ...habit, name: editingName.trim() } : habit
    )
    saveHabits(newHabits)
    setEditingId(null)
    setEditingName('')
  }, [habits, editingName, saveHabits])

  const getCalendarDays = () => {
    const days = []
    for (let i = 41; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const calendarDays = getCalendarDays()

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--titlebar-bg)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600 }}>
          🎯 习惯追踪
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="添加新习惯..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--window-border)',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {colors.slice(0, 6).map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: selectedColor === color ? '2px solid white' : 'none',
                  background: color,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: selectedColor === color ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none'
                }}
              />
            ))}
          </div>
          <button
            onClick={addHabit}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            添加
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '16px' 
      }}>
        {habits.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌟</div>
            <h3 style={{ margin: '0 0 8px 0' }}>还没有习惯</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              添加一些习惯开始你的自我提升之旅吧！
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {habits.map(habit => (
              <div
                key={habit.id}
                style={{
                  background: 'var(--titlebar-bg)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--window-border)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: `3px solid ${habit.color}`,
                        background: habit.completedDates.includes(today) ? habit.color : 'transparent',
                        color: habit.completedDates.includes(today) ? 'white' : habit.color,
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {habit.completedDates.includes(today) ? '✓' : ''}
                    </button>
                    <div>
                      {editingId === habit.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => saveEdit(habit.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(habit.id)}
                          autoFocus
                          style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--window-border)',
                            background: 'var(--window-bg)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <h3 
                          style={{ 
                            margin: 0, 
                            fontSize: '16px',
                            cursor: 'pointer'
                          }}
                          onClick={() => startEdit(habit)}
                        >
                          {habit.name}
                        </h3>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginTop: '4px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>🔥 {habit.streak} 天连续</span>
                        <span>📊 {habit.completedDates.length} 次完成</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--error)',
                      background: 'transparent',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    删除
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {calendarDays.map(date => {
                    const completed = habit.completedDates.includes(date)
                    const isToday = date === today
                    return (
                      <div
                        key={date}
                        title={`${date}${completed ? ' - 已完成' : ''}`}
                        onClick={() => {
                          const newDates = completed 
                            ? habit.completedDates.filter(d => d !== date)
                            : [...habit.completedDates, date]
                          saveHabits(habits.map(h => 
                            h.id === habit.id 
                              ? { ...h, completedDates: newDates, streak: calculateStreak(newDates) }
                              : h
                          ))
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: completed ? habit.color : 'rgba(255,255,255,0.05)',
                          border: isToday ? `2px solid ${habit.color}` : '1px solid var(--window-border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: completed ? 1 : 0.4
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid var(--window-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <span>过去 6 周的习惯记录</span>
        <span>共 {habits.length} 个习惯</span>
      </div>
    </div>
  )
})

export default HabitTracker
