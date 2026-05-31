import { useState } from 'react'

type FieldType = 'minute' | 'hour' | 'day' | 'month' | 'weekday'

interface Preset {
  name: string
  cron: string
  description: string
}

const presets: Preset[] = [
  { name: '每分钟', cron: '* * * * *', description: '每分钟执行一次' },
  { name: '每小时', cron: '0 * * * *', description: '每小时的第0分钟执行' },
  { name: '每天', cron: '0 0 * * *', description: '每天的0点0分执行' },
  { name: '每天上午9点', cron: '0 9 * * *', description: '每天上午9点执行' },
  { name: '每周一', cron: '0 0 * * 1', description: '每周一0点0分执行' },
  { name: '每月1号', cron: '0 0 1 * *', description: '每月1号0点0分执行' },
  { name: '工作日9点', cron: '0 9 * * 1-5', description: '周一到周五上午9点执行' },
  { name: '每隔15分钟', cron: '*/15 * * * *', description: '每15分钟执行一次' },
  { name: '每2小时', cron: '0 */2 * * *', description: '每2小时执行一次' },
  { name: '每月最后一天', cron: '0 0 L * *', description: '每月最后一天0点执行' },
]

const fieldConfig = {
  minute: { name: '分钟', min: 0, max: 59, description: '0-59' },
  hour: { name: '小时', min: 0, max: 23, description: '0-23' },
  day: { name: '日期', min: 1, max: 31, description: '1-31' },
  month: { name: '月份', min: 1, max: 12, description: '1-12' },
  weekday: { name: '星期', min: 0, max: 7, description: '0-7 (0或7=周日)' },
}

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                   '七月', '八月', '九月', '十月', '十一月', '十二月']

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

export default function CronTools() {
  const [cron, setCron] = useState('0 * * * *')
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  const parseCron = (expr: string): Record<FieldType, string> => {
    const parts = expr.trim().split(/\s+/)
    return {
      minute: parts[0] || '*',
      hour: parts[1] || '*',
      day: parts[2] || '*',
      month: parts[3] || '*',
      weekday: parts[4] || '*',
    }
  }

  const [fields, setFields] = useState(parseCron(cron))

  const validateField = (field: FieldType, value: string): boolean => {
    if (value === '*' || value === 'L') return true
    
    const config = fieldConfig[field]
    const parts = value.split(',')
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n))
        if (isNaN(start) || isNaN(end) || start < config.min || end > config.max || start > end) {
          return false
        }
      } else if (part.includes('/')) {
        const [range, step] = part.split('/')
        if (range !== '*' && isNaN(parseInt(range))) return false
        if (isNaN(parseInt(step)) || parseInt(step) <= 0) return false
      } else {
        const num = parseInt(part)
        if (isNaN(num) || num < config.min || num > config.max) {
          return false
        }
      }
    }
    return true
  }

  const updateCron = (newFields: Record<FieldType, string>) => {
    const newCron = `${newFields.minute} ${newFields.hour} ${newFields.day} ${newFields.month} ${newFields.weekday}`
    setCron(newCron)
    setFields(newFields)
    setError('')
  }

  const handleFieldChange = (field: FieldType, value: string) => {
    const newFields = { ...fields, [field]: value }
    updateCron(newFields)
  }

  const handlePreset = (preset: Preset) => {
    const newFields = parseCron(preset.cron)
    updateCron(newFields)
  }

  const copyCron = async () => {
    try {
      await navigator.clipboard.writeText(cron)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      setError('复制失败')
    }
  }

  const explainCron = (): string => {
    const f = fields
    let explanation = ''

    // 分钟
    if (f.minute === '*') {
      explanation += '每分钟 '
    } else if (f.minute.startsWith('*/')) {
      explanation += `每隔 ${f.minute.slice(2)} 分钟 `
    } else {
      explanation += `第 ${f.minute} 分钟 `
    }

    // 小时
    if (f.hour === '*') {
      explanation += '每小时 '
    } else if (f.hour.startsWith('*/')) {
      explanation += `每隔 ${f.hour.slice(2)} 小时 `
    } else {
      explanation += `第 ${f.hour} 时 `
    }

    // 日期和月份
    if (f.day === '*' && f.month === '*') {
      explanation += '每天 '
    } else if (f.day === 'L') {
      explanation += '每月最后一天 '
    } else {
      if (f.month !== '*') {
        const months = f.month.split(',').map(m => parseInt(m)).map(m => monthNames[m - 1])
        explanation += months.join(',') + ' '
      }
      if (f.day !== '*') {
        if (f.day.startsWith('*/')) {
          explanation += `每隔 ${f.day.slice(2)} 天 `
        } else {
          explanation += `第 ${f.day} 天 `
        }
      }
    }

    // 星期
    if (f.weekday !== '*') {
      const days = f.weekday.split(',').map(d => {
        const num = parseInt(d)
        return weekdayNames[num === 7 ? 0 : num]
      })
      explanation += days.join(',')
    }

    return explanation.trim()
  }

  const calculateNextRuns = (): Date[] => {
    const runs: Date[] = []
    const now = new Date()
    let current = new Date(now)
    
    // 简单的模拟计算，生成接下来的5次运行时间
    for (let i = 0; i < 5; i++) {
      current = new Date(current.getTime() + 3600000) // 每小时
      if (i === 0) current = new Date(now.getTime() + 60000) // 第一个1分钟后
      runs.push(current)
    }
    
    return runs
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '22px' }}>⏰ Cron 表达式生成器</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            快速生成和解释 Cron 调度表达式
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#f87171',
          fontSize: '13px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Presets */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '14px' }}>快速预设</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePreset(preset)}
              title={preset.description}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Cron Expression Display */}
      <div style={{ 
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <input
          value={cron}
          onChange={(e) => {
            setCron(e.target.value)
            setFields(parseCron(e.target.value))
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
            fontSize: '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
        <button
          onClick={copyCron}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: copySuccess ? '#4ade80' : '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}
        >
          {copySuccess ? '✓ 已复制' : '复制'}
        </button>
      </div>

      {/* Explanation */}
      <div style={{ 
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#4ade80', fontSize: '14px' }}>📝 表达式解释</h3>
        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '15px', lineHeight: '1.6' }}>
          {explainCron()}
        </p>
      </div>

      {/* Field Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '14px' }}>字段编辑</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {(Object.entries(fieldConfig) as [FieldType, typeof fieldConfig.minute][]).map(([key, config]) => (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>
                  {config.name}
                </label>
                <span style={{ color: '#64748b', fontSize: '11px' }}>{config.description}</span>
              </div>
              <input
                value={fields[key]}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: validateField(key, fields[key]) ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.5)',
                  color: '#e2e8f0',
                  fontFamily: '"Fira Code", "Monaco", "Ubuntu Mono", monospace',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Next Runs (simplified) */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '14px' }}>下次运行</h3>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px'
          }}>
            {calculateNextRuns().map((date, index) => (
              <div key={index} style={{ 
                padding: '8px 0',
                borderBottom: index < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: '#e2e8f0',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{index + 1}.</span>
                <span>{date.toLocaleString('zh-CN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
