import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useStore } from '../store'

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'radar' | 'scatter'
type DataPoint = { label: string; value: number; color?: string }
type DataSet = { id: string; name: string; data: DataPoint[]; createdAt: number }

const sampleData1: DataPoint[] = [
  { label: '一月', value: 45 },
  { label: '二月', value: 60 },
  { label: '三月', value: 30 },
  { label: '四月', value: 75 },
  { label: '五月', value: 55 },
  { label: '六月', value: 90 },
]

const sampleData2: DataPoint[] = [
  { label: '产品A', value: 120 },
  { label: '产品B', value: 85 },
  { label: '产品C', value: 150 },
  { label: '产品D', value: 60 },
]

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'
]

export default function AdvancedDataViz() {
  const addNotification = useStore((s) => s.addNotification)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [currentDataSetId, setCurrentDataSetId] = useState('default1')
  const [dataSets, setDataSets] = useState<DataSet[]>([
    { id: 'default1', name: '月度销售', data: sampleData1, createdAt: Date.now() },
    { id: 'default2', name: '产品销量', data: sampleData2, createdAt: Date.now() },
  ])
  const [title, setTitle] = useState('数据可视化')
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [chartTheme, setChartTheme] = useState<'dark' | 'light'>('dark')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json'>('png')

  const currentDataSet = useMemo(() => 
    dataSets.find(ds => ds.id === currentDataSetId) || dataSets[0], 
    [dataSets, currentDataSetId]
  )

  const data = currentDataSet?.data || []

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data])
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  const addDataPoint = useCallback(() => {
    setDataSets(prev => prev.map(ds => 
      ds.id === currentDataSetId 
        ? { ...ds, data: [...ds.data, { label: `数据${ds.data.length + 1}`, value: Math.floor(Math.random() * 100) }] }
        : ds
    ))
  }, [currentDataSetId])

  const removeDataPoint = useCallback((index: number) => {
    if (data.length <= 1) return
    setDataSets(prev => prev.map(ds => 
      ds.id === currentDataSetId 
        ? { ...ds, data: ds.data.filter((_, i) => i !== index) }
        : ds
    ))
  }, [data.length, currentDataSetId])

  const updateDataPoint = useCallback((index: number, label: string, value: number) => {
    setDataSets(prev => prev.map(ds => 
      ds.id === currentDataSetId 
        ? { ...ds, data: ds.data.map((d, i) => i === index ? { label, value } : d) }
        : ds
    ))
  }, [currentDataSetId])

  const createNewDataSet = useCallback(() => {
    const newDataSet: DataSet = {
      id: `dataset-${Date.now()}`,
      name: `数据集 ${dataSets.length + 1}`,
      data: [{ label: '数据1', value: 50 }, { label: '数据2', value: 75 }],
      createdAt: Date.now()
    }
    setDataSets(prev => [...prev, newDataSet])
    setCurrentDataSetId(newDataSet.id)
  }, [dataSets.length])

  const deleteCurrentDataSet = useCallback(() => {
    if (dataSets.length <= 1) {
      addNotification({ title: '无法删除', message: '至少需要保留一个数据集', type: 'error' })
      return
    }
    const newDataSets = dataSets.filter(ds => ds.id !== currentDataSetId)
    setDataSets(newDataSets)
    setCurrentDataSetId(newDataSets[0].id)
  }, [dataSets, currentDataSetId, addNotification])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(currentDataSet, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      downloadBlob(blob, `${title}.json`)
    } else if (exportFormat === 'png') {
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${title}.png`)
      })
    }
    addNotification({ title: '导出成功', message: `图表已导出为 ${exportFormat.toUpperCase()}`, type: 'success' })
  }, [canvasRef, exportFormat, title, currentDataSet, addNotification])

  const loadSampleData = useCallback(() => {
    const newData: DataPoint[] = Array.from({ length: 6 }, (_, i) => ({
      label: ['一月', '二月', '三月', '四月', '五月', '六月'][i],
      value: Math.floor(Math.random() * 100) + 20
    }))
    setDataSets(prev => prev.map(ds => 
      ds.id === currentDataSetId ? { ...ds, data: newData } : ds
    ))
  }, [currentDataSetId])

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
    const bgColor = chartTheme === 'dark' ? '#1a1a1a' : '#f5f5f5'
    const textColor = chartTheme === 'dark' ? '#fff' : '#333'
    const gridColor = chartTheme === 'dark' ? '#444' : '#ddd'

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    if (data.length === 0) {
      ctx.fillStyle = textColor
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('暂无数据，请添加数据点', width / 2, height / 2)
      return
    }

    if (showGrid && ['bar', 'line', 'area', 'scatter'].includes(chartType)) {
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
        ctx.fillStyle = textColor
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
          ctx.fillStyle = d.color || colors[i % colors.length]
          ctx.fillRect(x, y, barWidth, barHeight)
          
          if (showLabels) {
            ctx.fillStyle = textColor
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(d.label, x + barWidth / 2, height - padding + 20)
            ctx.fillText(String(d.value), x + barWidth / 2, y - 5)
          }
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
          ctx.fillStyle = d.color || colors[i % colors.length]
          ctx.beginPath()
          ctx.arc(x, y, 6, 0, Math.PI * 2)
          ctx.fill()

          if (showLabels) {
            ctx.fillStyle = textColor
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(d.label, x, height - padding + 20)
          }
        })
        break
      }
      case 'scatter': {
        data.forEach((d, i) => {
          const x = padding + (i / (data.length - 1)) * chartWidth
          const y = height - padding - (d.value / maxValue) * chartHeight
          ctx.fillStyle = d.color || colors[i % colors.length]
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, Math.PI * 2)
          ctx.fill()
          
          if (showLabels) {
            ctx.fillStyle = textColor
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(d.label, x, y - 15)
          }
        })
        break
      }
      case 'radar': {
        const angleStep = (Math.PI * 2) / data.length
        data.forEach((d, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = centerX + Math.cos(angle) * (d.value / maxValue) * radius
          const y = centerY + Math.sin(angle) * (d.value / maxValue) * radius
          
          if (i === 0) {
            ctx.beginPath()
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
        ctx.fill()
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.stroke()

        data.forEach((d, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          
          ctx.fillStyle = textColor
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(d.label, x, y)
        })
        break
      }
      case 'area': {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
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

        if (showLabels) {
          data.forEach((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth
            ctx.fillStyle = textColor
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(d.label, x, height - padding + 20)
          })
        }
        break
      }
      case 'pie':
      case 'doughnut': {
        const total = totalValue
        let startAngle = -Math.PI / 2
        const innerRadius = chartType === 'doughnut' ? radius * 0.5 : 0

        data.forEach((d, i) => {
          const sliceAngle = (d.value / total) * Math.PI * 2
          const endAngle = startAngle + sliceAngle

          ctx.fillStyle = d.color || colors[i % colors.length]
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

          if (showLabels) {
            const midAngle = startAngle + sliceAngle / 2
            const labelX = centerX + Math.cos(midAngle) * (radius * 0.7)
            const labelY = centerY + Math.sin(midAngle) * (radius * 0.7)
            ctx.fillStyle = '#fff'
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const percentage = Math.round((d.value / total) * 100)
            ctx.fillText(`${percentage}%`, labelX, labelY)
          }

          startAngle = endAngle
        })
        break
      }
    }

    ctx.fillStyle = textColor
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, width / 2, 25)
  }, [data, chartType, maxValue, totalValue, showGrid, showLabels, chartTheme, title])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  return (
    <div className="app-container" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="图表标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: '18px', fontWeight: 'bold', background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '4px 0' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={addDataPoint}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', cursor: 'pointer' }}
          >
            + 添加数据
          </button>
          <button
            onClick={createNewDataSet}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', cursor: 'pointer' }}
          >
            + 新建数据集
          </button>
          <button
            onClick={exportChart}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #444', background: '#0066cc', color: '#fff', cursor: 'pointer' }}
          >
            导出
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '20px', overflow: 'auto' }}>
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              style={{ width: '100%', height: 'auto', maxHeight: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>数据统计</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#ccc', fontSize: '13px' }}>
                <div>数据点数量: {data.length}</div>
                <div>总和: {totalValue}</div>
                <div>最大值: {maxValue}</div>
                <div>平均值: {(totalValue / data.length).toFixed(1)}</div>
              </div>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>快速操作</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={loadSampleData}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  加载示例数据
                </button>
                <button
                  onClick={deleteCurrentDataSet}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px' }}
                >
                  删除当前数据集
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'auto' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>数据集</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dataSets.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setCurrentDataSetId(ds.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: currentDataSetId === ds.id ? '2px solid #0066cc' : '1px solid #444',
                    background: currentDataSetId === ds.id ? '#0066cc' : '#333',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left'
                  }}
                >
                  {ds.name} ({ds.data.length} 点)
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>图表类型</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(['bar', 'line', 'area', 'pie', 'doughnut', 'radar', 'scatter'] as ChartType[]).map((type) => (
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
                  {type === 'bar' ? '柱状图' : 
                   type === 'line' ? '折线图' : 
                   type === 'area' ? '面积图' : 
                   type === 'pie' ? '饼图' : 
                   type === 'doughnut' ? '环形图' : 
                   type === 'radar' ? '雷达图' : '散点图'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>图表设置</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                显示网格
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />
                显示图例
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                显示标签
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ color: '#fff', fontSize: '13px' }}>主题:</label>
                <select value={chartTheme} onChange={(e) => setChartTheme(e.target.value as any)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #444', fontSize: '12px' }}>
                  <option value="dark">深色</option>
                  <option value="light">浅色</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label style={{ color: '#fff', fontSize: '13px' }}>导出:</label>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} style={{ padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #444', fontSize: '12px' }}>
                  <option value="png">PNG 图片</option>
                  <option value="json">JSON 数据</option>
                </select>
              </div>
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
                    <div style={{ width: '12px', height: '12px', background: d.color || colors[i % colors.length], borderRadius: '2px' }} />
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
