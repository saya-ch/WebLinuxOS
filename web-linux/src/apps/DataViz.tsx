import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
type DataPoint = { label: string; value: number }

const sampleData: DataPoint[] = [
  { label: '一月', value: 45 },
  { label: '二月', value: 60 },
  { label: '三月', value: 30 },
  { label: '四月', value: 75 },
  { label: '五月', value: 55 },
  { label: '六月', value: 90 },
]

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
]

export default function DataViz() {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [data, setData] = useState<DataPoint[]>(sampleData)
  const [title, setTitle] = useState('销售业绩')
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data])

  const addDataPoint = useCallback(() => {
    setData((prev) => [...prev, { label: `数据${prev.length + 1}`, value: Math.floor(Math.random() * 100) }])
  }, [])

  const removeDataPoint = useCallback((index: number) => {
    if (data.length <= 1) return
    setData((prev) => prev.filter((_, i) => i !== index))
  }, [data.length])

  const updateDataPoint = useCallback((index: number, label: string, value: number) => {
    setData((prev) => prev.map((d, i) => i === index ? { label, value } : d))
  }, [])

  const clearAll = useCallback(() => {
    setData([])
  }, [])

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 50
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    ctx.clearRect(0, 0, width, height)

    if (data.length === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('暂无数据，请添加数据点', width / 2, height / 2)
      return
    }

    if (showGrid) {
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
        ctx.fillStyle = '#888'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'right'
        const value = Math.round(maxValue * (1 - i / 5))
        ctx.fillText(String(value), padding - 10, y + 4)
      }
    }

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20

    switch (chartType) {
      case 'bar': {
        const barWidth = chartWidth / data.length - 20
        data.forEach((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight
          const x = padding + i * (chartWidth / data.length) + 10
          const y = height - padding - barHeight
          ctx.fillStyle = colors[i % colors.length]
          ctx.fillRect(x, y, barWidth, barHeight)
          ctx.fillStyle = '#fff'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.label, x + barWidth / 2, height - padding + 20)
          ctx.fillText(String(d.value), x + barWidth / 2, y - 5)
        })
        break
      }
      case 'line': {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.beginPath()
        data.forEach((d, i) => {
          const x = padding + (i / (data.length - 1)) * chartWidth
          const y = height - padding - (d.value / maxValue) * chartHeight
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        data.forEach((d, i) => {
          const x = padding + (i / (data.length - 1)) * chartWidth
          const y = height - padding - (d.value / maxValue) * chartHeight
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = colors[i % colors.length]
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.fillStyle = '#fff'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.label, x, height - padding + 20)
        })
        break
      }
      case 'area': {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.beginPath()

        data.forEach((d, i) => {
          const x = padding + (i / (data.length - 1)) * chartWidth
          const y = height - padding - (d.value / maxValue) * chartHeight
          if (i === 0) {
            ctx.moveTo(x, height - padding)
            ctx.lineTo(x, y)
          } else ctx.lineTo(x, y)
        })

        ctx.lineTo(padding + chartWidth, height - padding)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        data.forEach((d, i) => {
          const x = padding + (i / (data.length - 1)) * chartWidth
          ctx.fillStyle = '#fff'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(d.label, x, height - padding + 20)
        })
        break
      }
      case 'pie':
      case 'doughnut': {
        const total = data.reduce((sum, d) => sum + d.value, 0)
        let startAngle = -Math.PI / 2
        const innerRadius = chartType === 'doughnut' ? radius * 0.5 : 0

        data.forEach((d, i) => {
          const sliceAngle = (d.value / total) * Math.PI * 2
          const endAngle = startAngle + sliceAngle

          ctx.fillStyle = colors[i % colors.length]
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.arc(centerX, centerY, radius, startAngle, endAngle)
          ctx.closePath()
          ctx.fill()

          if (chartType === 'doughnut') {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalCompositeOperation = 'source-over'
          }

          const midAngle = startAngle + sliceAngle / 2
          const labelX = centerX + Math.cos(midAngle) * (radius * 0.7)
          const labelY = centerY + Math.sin(midAngle) * (radius * 0.7)
          ctx.fillStyle = '#fff'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const percentage = Math.round((d.value / total) * 100)
          ctx.fillText(`${percentage}%`, labelX, labelY)

          startAngle = endAngle
        })
        break
      }
    }
  }, [data, chartType, maxValue, showGrid])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  return (
    <div className="app-container" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="图表标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ fontSize: '18px', fontWeight: 'bold', background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '4px 0' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={addDataPoint}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', cursor: 'pointer' }}
          >
            + 添加数据
          </button>
          <button
            onClick={clearAll}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#ff6b6b', cursor: 'pointer' }}
          >
            清空
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', flex: 1, overflow: 'hidden' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', overflow: 'auto' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{ width: '100%', height: 'auto', maxHeight: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'auto' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>图表类型</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(['bar', 'line', 'area', 'pie', 'doughnut'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: chartType === type ? '2px solid #0066cc' : '1px solid #444',
                    background: chartType === type ? '#0066cc' : '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                  }}
                >
                  {type === 'bar' ? '柱状图' : type === 'line' ? '折线图' : type === 'area' ? '面积图' : type === 'pie' ? '饼图' : '环形图'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>设置</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                显示网格
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />
                显示图例
              </label>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>数据点</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px', background: '#2a2a2a', borderRadius: '6px', border: '1px solid #444' }}>
                  <input
                    type="text"
                    placeholder="标签"
                    value={d.label}
                    onChange={(e) => updateDataPoint(i, e.target.value, d.value)}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '12px' }}
                  />
                  <input
                    type="number"
                    placeholder="数值"
                    value={d.value}
                    onChange={(e) => updateDataPoint(i, d.label, Number(e.target.value) || 0)}
                    style={{ width: '80px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => removeDataPoint(i)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showLegend && (
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>图例</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {data.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#2a2a2a', borderRadius: '4px', border: '1px solid #444' }}>
                    <div style={{ width: '12px', height: '12px', background: colors[i % colors.length], borderRadius: '2px' }} />
                    <span style={{ color: '#fff', fontSize: '12px' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
