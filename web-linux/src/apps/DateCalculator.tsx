import { useState, useMemo } from 'react'
import { Calendar, Clock, Calculator, ArrowRight, AlertCircle } from 'lucide-react'

interface DateDiffResult {
  years: number
  months: number
  days: number
  totalDays: number
  totalHours: number
  totalMinutes: number
}

const DateCalculator: React.FC = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('00:00')
  const [addDays, setAddDays] = useState('')
  const [addMonths, setAddMonths] = useState('')
  const [addYears, setAddYears] = useState('')
  const [resultDate, setResultDate] = useState<string>('')

  const dateDiff: DateDiffResult | null = useMemo(() => {
    if (!startDate || !endDate) return null

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const totalHours = Math.floor(diffTime / (1000 * 60 * 60))
    const totalMinutes = Math.floor(diffTime / (1000 * 60))

    const startYear = start.getFullYear()
    const startMonth = start.getMonth()
    const startDay = start.getDate()
    const endYear = end.getFullYear()
    const endMonth = end.getMonth()
    const endDay = end.getDate()

    let years = endYear - startYear
    let months = endMonth - startMonth
    let days = endDay - startDay

    if (days < 0) {
      months--
      const prevMonth = new Date(endYear, endMonth, 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    return { years, months, days, totalDays, totalHours, totalMinutes }
  }, [startDate, endDate, startTime, endTime])

  const calculateResultDate = () => {
    if (!startDate) {
      setResultDate('')
      return
    }

    const date = new Date(startDate)
    const days = parseInt(addDays) || 0
    const months = parseInt(addMonths) || 0
    const years = parseInt(addYears) || 0

    date.setDate(date.getDate() + days)
    date.setMonth(date.getMonth() + months)
    date.setFullYear(date.getFullYear() + years)

    setResultDate(date.toISOString().split('T')[0])
  }

  const clearAll = () => {
    setStartDate('')
    setEndDate('')
    setStartTime('00:00')
    setEndTime('00:00')
    setAddDays('')
    setAddMonths('')
    setAddYears('')
    setResultDate('')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '24px',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      color: '#e4e4e7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Calculator size={28} style={{ color: '#818cf8' }} />
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>日期计算器</h1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        flex: 1
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={20} style={{ color: '#f472b6' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>日期差计算</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e4e4e7',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e4e4e7',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginTop: '8px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <ArrowRight size={24} style={{ color: '#818cf8' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e4e4e7',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e4e4e7',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginTop: '8px'
                }}
              />
            </div>
          </div>

          {dateDiff && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(129, 140, 248, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(129, 140, 248, 0.3)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#818cf8' }}>
                计算结果
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#a1a1aa' }}>年</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#f472b6' }}>{dateDiff.years}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#a1a1aa' }}>月</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#f472b6' }}>{dateDiff.months}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#a1a1aa' }}>日</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#f472b6' }}>{dateDiff.days}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#a1a1aa' }}>总天数</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#86efac' }}>{dateDiff.totalDays}</div>
                </div>
                <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#a1a1aa' }}>总小时数</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#fcd34d' }}>{dateDiff.totalHours}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={20} style={{ color: '#86efac' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>日期加减</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                基准日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e4e4e7',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setStartDate(today)}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'rgba(129, 140, 248, 0.3)',
                  color: '#818cf8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                使用今天
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                  年
                </label>
                <input
                  type="number"
                  value={addYears}
                  onChange={(e) => setAddYears(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#e4e4e7',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                  月
                </label>
                <input
                  type="number"
                  value={addMonths}
                  onChange={(e) => setAddMonths(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#e4e4e7',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: '#a1a1aa' }}>
                  日
                </label>
                <input
                  type="number"
                  value={addDays}
                  onChange={(e) => setAddDays(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#e4e4e7',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              onClick={calculateResultDate}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'transform 0.2s, opacity 0.2s'
              }}
            >
              计算结果日期
            </button>

            {resultDate && (
              <div style={{
                padding: '16px',
                background: 'rgba(134, 239, 172, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(134, 239, 172, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>计算结果</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#86efac' }}>
                  {resultDate}
                </div>
                <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '8px' }}>
                  {new Date(resultDate).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertCircle size={16} style={{ color: '#fcd34d' }} />
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#fcd34d' }}>快捷工具</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => {
              setStartDate(today)
              const future = new Date()
              future.setDate(future.getDate() + 7)
              setEndDate(future.toISOString().split('T')[0])
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e4e4e7',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            最近一周
          </button>
          <button
            onClick={() => {
              setStartDate(today)
              const future = new Date()
              future.setDate(future.getDate() + 30)
              setEndDate(future.toISOString().split('T')[0])
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e4e4e7',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            最近一个月
          </button>
          <button
            onClick={() => {
              setStartDate(today)
              const future = new Date()
              future.setFullYear(future.getFullYear() + 1)
              setEndDate(future.toISOString().split('T')[0])
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#e4e4e7',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            一年后
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            清空
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateCalculator
