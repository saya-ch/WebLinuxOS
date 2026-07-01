import { useState, useCallback, useRef, useEffect } from 'react'

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'doughnut' | 'radar' | 'scatter'

interface DataPoint {
  label: string
  value: number
}

interface ChartConfig {
  title: string
  type: ChartType
  data: DataPoint[]
  colors: string[]
  showLegend: boolean
  showValues: boolean
  animate: boolean
}

const DEFAULT_COLORS = [
  '#8b7cf0', '#00c878', '#ffb400', '#ff5050', '#4ec9b0',
  '#569cd6', '#c586c0', '#f44747', '#6a9955', '#dcdcaa',
]

const SAMPLE_DATASETS: Record<string, { name: string; data: DataPoint[] }> = {
  sales: {
    name: '月度销售数据',
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 190 },
      { label: '3月', value: 150 },
      { label: '4月', value: 220 },
      { label: '5月', value: 280 },
      { label: '6月', value: 240 },
      { label: '7月', value: 310 },
      { label: '8月', value: 290 },
    ],
  },
  browser: {
    name: '浏览器市场份额',
    data: [
      { label: 'Chrome', value: 65 },
      { label: 'Safari', value: 18 },
      { label: 'Edge', value: 8 },
      { label: 'Firefox', value: 5 },
      { label: '其他', value: 4 },
    ],
  },
  traffic: {
    name: '网站访问量趋势',
    data: [
      { label: '周一', value: 1200 },
      { label: '周二', value: 1500 },
      { label: '周三', value: 1800 },
      { label: '周四', value: 1600 },
      { label: '周五', value: 2000 },
      { label: '周六', value: 800 },
      { label: '周日', value: 600 },
    ],
  },
  skills: {
    name: '技能雷达图',
    data: [
      { label: 'JavaScript', value: 85 },
      { label: 'Python', value: 70 },
      { label: 'React', value: 90 },
      { label: 'Node.js', value: 75 },
      { label: 'TypeScript', value: 80 },
      { label: 'CSS', value: 88 },
    ],
  },
}

function drawChart(canvas: HTMLCanvasElement, config: ChartConfig): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, width, height)

  const padding = { top: 50, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (config.data.length === 0) {
    ctx.fillStyle = '#606080'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', width / 2, height / 2)
    return
  }

  if (config.title) {
    ctx.fillStyle = '#e6e6f0'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(config.title, width / 2, 28)
  }

  const maxValue = Math.max(...config.data.map(d => d.value))

  switch (config.type) {
    case 'bar':
      drawBarChart(ctx, config, padding, chartWidth, chartHeight, maxValue)
      break
    case 'line':
      drawLineChart(ctx, config, padding, chartWidth, chartHeight, maxValue)
      break
    case 'area':
      drawAreaChart(ctx, config, padding, chartWidth, chartHeight, maxValue)
      break
    case 'pie':
      drawPieChart(ctx, config, width, height)
      break
    case 'doughnut':
      drawDoughnutChart(ctx, config, width, height)
      break
    case 'radar':
      drawRadarChart(ctx, config, width, height)
      break
    case 'scatter':
      drawScatterChart(ctx, config, padding, chartWidth, chartHeight, maxValue)
      break
  }
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  padding: { top: number; right: number; bottom: number; left: number },
  chartWidth: number,
  chartHeight: number,
  maxValue: number
): void {
  const barCount = config.data.length
  const barGroupWidth = chartWidth / barCount
  const barWidth = barGroupWidth * 0.6
  const gap = barGroupWidth * 0.2

  ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    const value = Math.round(maxValue - (maxValue / 5) * i)
    ctx.fillStyle = '#8080a0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(value), padding.left - 8, y + 4)
  }

  config.data.forEach((d, i) => {
    const x = padding.left + i * barGroupWidth + gap / 2
    const barHeight = (d.value / maxValue) * chartHeight
    const y = padding.top + chartHeight - barHeight

    const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartHeight)
    gradient.addColorStop(0, config.colors[i % config.colors.length])
    gradient.addColorStop(1, config.colors[i % config.colors.length] + '60')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, 4)
    ctx.fill()

    if (config.showValues) {
      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(d.value), x + barWidth / 2, y - 6)
    }

    ctx.fillStyle = '#a0a0c0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.label, x + barWidth / 2, padding.top + chartHeight + 18)
  })
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  padding: { top: number; right: number; bottom: number; left: number },
  chartWidth: number,
  chartHeight: number,
  maxValue: number
): void {
  const pointCount = config.data.length
  const stepX = chartWidth / (pointCount - 1)

  ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    const value = Math.round(maxValue - (maxValue / 5) * i)
    ctx.fillStyle = '#8080a0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(value), padding.left - 8, y + 4)
  }

  ctx.strokeStyle = config.colors[0]
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  config.data.forEach((d, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  config.data.forEach((d, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight

    ctx.fillStyle = config.colors[0]
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, 2.5, 0, Math.PI * 2)
    ctx.fill()

    if (config.showValues) {
      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(d.value), x, y - 12)
    }

    ctx.fillStyle = '#a0a0c0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.label, x, padding.top + chartHeight + 18)
  })
}

function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  padding: { top: number; right: number; bottom: number; left: number },
  chartWidth: number,
  chartHeight: number,
  maxValue: number
): void {
  const pointCount = config.data.length
  const stepX = chartWidth / (pointCount - 1)

  ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    const value = Math.round(maxValue - (maxValue / 5) * i)
    ctx.fillStyle = '#8080a0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(value), padding.left - 8, y + 4)
  }

  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
  gradient.addColorStop(0, config.colors[0] + '60')
  gradient.addColorStop(1, config.colors[0] + '10')

  ctx.fillStyle = gradient
  ctx.beginPath()
  config.data.forEach((d, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
  ctx.lineTo(padding.left, padding.top + chartHeight)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = config.colors[0]
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  config.data.forEach((d, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  config.data.forEach((d, i) => {
    const x = padding.left + i * stepX
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight

    ctx.fillStyle = config.colors[0]
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()

    if (config.showValues) {
      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(d.value), x, y - 12)
    }

    ctx.fillStyle = '#a0a0c0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.label, x, padding.top + chartHeight + 18)
  })
}

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  width: number,
  height: number
): void {
  const centerX = width / 2
  const centerY = height / 2 + 10
  const radius = Math.min(width, height) / 2 - 70

  const total = config.data.reduce((sum, d) => sum + d.value, 0)
  let startAngle = -Math.PI / 2

  config.data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2

    ctx.fillStyle = config.colors[i % config.colors.length]
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
    ctx.closePath()
    ctx.fill()

    if (config.showValues) {
      const midAngle = startAngle + sliceAngle / 2
      const textX = centerX + Math.cos(midAngle) * radius * 0.7
      const textY = centerY + Math.sin(midAngle) * radius * 0.7
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const percentage = ((d.value / total) * 100).toFixed(1) + '%'
      ctx.fillText(percentage, textX, textY)
    }

    startAngle += sliceAngle
  })

  if (config.showLegend) {
    const legendX = 20
    let legendY = height - config.data.length * 20 - 10
    config.data.forEach((d, i) => {
      ctx.fillStyle = config.colors[i % config.colors.length]
      ctx.fillRect(legendX, legendY, 12, 12)

      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`${d.label} (${d.value})`, legendX + 18, legendY)

      legendY += 20
    })
  }
}

function drawDoughnutChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  width: number,
  height: number
): void {
  const centerX = width / 2
  const centerY = height / 2 + 10
  const outerRadius = Math.min(width, height) / 2 - 70
  const innerRadius = outerRadius * 0.6

  const total = config.data.reduce((sum, d) => sum + d.value, 0)
  let startAngle = -Math.PI / 2

  config.data.forEach((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2

    ctx.fillStyle = config.colors[i % config.colors.length]
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle)
    ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true)
    ctx.closePath()
    ctx.fill()

    startAngle += sliceAngle
  })

  ctx.fillStyle = '#e6e6f0'
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(total), centerX, centerY - 5)
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = '#a0a0c0'
  ctx.fillText('总计', centerX, centerY + 14)

  if (config.showLegend) {
    const legendX = 20
    let legendY = height - config.data.length * 20 - 10
    config.data.forEach((d, i) => {
      ctx.fillStyle = config.colors[i % config.colors.length]
      ctx.fillRect(legendX, legendY, 12, 12)

      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const percentage = ((d.value / total) * 100).toFixed(1) + '%'
      ctx.fillText(`${d.label} ${percentage}`, legendX + 18, legendY)

      legendY += 20
    })
  }
}

function drawRadarChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  width: number,
  height: number
): void {
  const centerX = width / 2
  const centerY = height / 2 + 10
  const radius = Math.min(width, height) / 2 - 90
  const sides = config.data.length
  const angleStep = (Math.PI * 2) / sides

  for (let level = 5; level >= 1; level--) {
    const levelRadius = (radius / 5) * level
    ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + i * angleStep
      const x = centerX + Math.cos(angle) * levelRadius
      const y = centerY + Math.sin(angle) * levelRadius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + i * angleStep
    ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
    ctx.stroke()

    const labelX = centerX + Math.cos(angle) * (radius + 25)
    const labelY = centerY + Math.sin(angle) * (radius + 25)
    ctx.fillStyle = '#a0a0c0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(config.data[i].label, labelX, labelY)
  }

  ctx.fillStyle = config.colors[0] + '40'
  ctx.strokeStyle = config.colors[0]
  ctx.lineWidth = 2
  ctx.beginPath()
  config.data.forEach((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    const valueRadius = (d.value / 100) * radius
    const x = centerX + Math.cos(angle) * valueRadius
    const y = centerY + Math.sin(angle) * valueRadius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  config.data.forEach((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep
    const valueRadius = (d.value / 100) * radius
    const x = centerX + Math.cos(angle) * valueRadius
    const y = centerY + Math.sin(angle) * valueRadius

    ctx.fillStyle = config.colors[0]
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

function drawScatterChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  padding: { top: number; right: number; bottom: number; left: number },
  chartWidth: number,
  chartHeight: number,
  maxValue: number
): void {
  const pointCount = config.data.length

  ctx.strokeStyle = 'rgba(120, 120, 160, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    const value = Math.round(maxValue - (maxValue / 5) * i)
    ctx.fillStyle = '#8080a0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(value), padding.left - 8, y + 4)
  }

  config.data.forEach((d, i) => {
    const x = padding.left + (i / (pointCount - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12)
    gradient.addColorStop(0, config.colors[i % config.colors.length])
    gradient.addColorStop(1, config.colors[i % config.colors.length] + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = config.colors[i % config.colors.length]
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()

    if (config.showValues) {
      ctx.fillStyle = '#e6e6f0'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(d.value), x, y - 14)
    }

    ctx.fillStyle = '#a0a0c0'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.label, x, padding.top + chartHeight + 18)
  })
}

function parseCSV(text: string): DataPoint[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  const data: DataPoint[] = []

  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''))
    if (parts.length >= 2) {
      const value = parseFloat(parts[1])
      if (!isNaN(value)) {
        data.push({ label: parts[0], value })
      }
    }
  }

  return data
}

export default function DataVizStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [config, setConfig] = useState<ChartConfig>({
    title: '月度销售数据',
    type: 'bar',
    data: SAMPLE_DATASETS.sales.data,
    colors: DEFAULT_COLORS,
    showLegend: true,
    showValues: true,
    animate: true,
  })

  const [dataText, setDataText] = useState(
    SAMPLE_DATASETS.sales.data.map(d => `${d.label},${d.value}`).join('\n')
  )

  const [activeTab, setActiveTab] = useState<'chart' | 'data' | 'settings'>('chart')

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      canvasRef.current.width = rect.width
      canvasRef.current.height = rect.height
      drawChart(canvasRef.current, config)
    }
  }, [config])

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
        drawChart(canvasRef.current, config)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [config])

  const chartTypes: { type: ChartType; name: string; icon: string }[] = [
    { type: 'bar', name: '柱状图', icon: '📊' },
    { type: 'line', name: '折线图', icon: '📈' },
    { type: 'area', name: '面积图', icon: '📉' },
    { type: 'pie', name: '饼图', icon: '🥧' },
    { type: 'doughnut', name: '环形图', icon: '🍩' },
    { type: 'radar', name: '雷达图', icon: '🎯' },
    { type: 'scatter', name: '散点图', icon: '✨' },
  ]

  const handleTypeChange = useCallback((type: ChartType) => {
    setConfig(prev => ({ ...prev, type }))
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setConfig(prev => ({ ...prev, title }))
  }, [])

  const handleDataTextChange = useCallback((text: string) => {
    setDataText(text)
    const parsed = parseCSV(text)
    if (parsed.length > 0) {
      setConfig(prev => ({ ...prev, data: parsed }))
    }
  }, [])

  const loadSample = useCallback((key: string) => {
    const sample = SAMPLE_DATASETS[key]
    if (sample) {
      setConfig(prev => ({ ...prev, data: sample.data, title: sample.name }))
      setDataText(sample.data.map(d => `${d.label},${d.value}`).join('\n'))
    }
  }, [])

  const toggleLegend = useCallback(() => {
    setConfig(prev => ({ ...prev, showLegend: !prev.showLegend }))
  }, [])

  const toggleValues = useCallback(() => {
    setConfig(prev => ({ ...prev, showValues: !prev.showValues }))
  }, [])

  const exportImage = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `${config.title || 'chart'}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [config.title])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            📊 数据可视化工作室
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            轻松创建精美的数据图表
          </span>
        </div>
        <button
          onClick={exportImage}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          💾 导出图片
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 240,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-color)',
          }}>
            图表类型
          </div>
          <div style={{ padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {chartTypes.map(ct => (
              <button
                key={ct.type}
                onClick={() => handleTypeChange(ct.type)}
                style={{
                  padding: '10px 6px',
                  fontSize: 11,
                  borderRadius: 8,
                  border: config.type === ct.type
                    ? '1px solid var(--accent)'
                    : '1px solid transparent',
                  background: config.type === ct.type
                    ? 'rgba(139, 124, 240, 0.15)'
                    : 'var(--bg-tertiary)',
                  color: config.type === ct.type ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>{ct.icon}</span>
                <span>{ct.name}</span>
              </button>
            ))}
          </div>

          <div style={{
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 8,
          }}>
            示例数据
          </div>
          <div style={{ padding: '4px 8px 8px' }}>
            {Object.entries(SAMPLE_DATASETS).map(([key, sample]) => (
              <button
                key={key}
                onClick={() => loadSample(key)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 12,
                  textAlign: 'left',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                • {sample.name}
              </button>
            ))}
          </div>

          <div style={{
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 8,
          }}>
            图表选项
          </div>
          <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.showLegend}
                onChange={toggleLegend}
              />
              显示图例
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.showValues}
                onChange={toggleValues}
              />
              显示数值
            </label>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>标题:</span>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  flex: 1,
                  maxWidth: 300,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['chart', 'data', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    borderRadius: 6,
                    border: 'none',
                    background: activeTab === tab ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? 500 : 400,
                  }}
                >
                  {tab === 'chart' ? '图表' : tab === 'data' ? '数据' : '设置'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'chart' && (
            <div ref={containerRef} style={{ flex: 1, padding: 16, minHeight: 0 }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 12,
                  background: 'var(--bg-secondary)',
                }}
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
              <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                编辑数据（CSV格式：标签,值 每行一条）
              </div>
              <textarea
                value={dataText}
                onChange={(e) => handleDataTextChange(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
              <div style={{ maxWidth: 500 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
                  颜色配置
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 24,
                }}>
                  {config.colors.map((color, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: color,
                          cursor: 'pointer',
                          border: '2px solid var(--border-color)',
                        }}
                        title={color}
                      />
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
                  数据统计
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 12,
                  marginBottom: 20,
                }}>
                  <div style={{
                    padding: 14,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      数据点数
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {config.data.length}
                    </div>
                  </div>
                  <div style={{
                    padding: 14,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      最大值
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#00c878' }}>
                      {Math.max(...config.data.map(d => d.value))}
                    </div>
                  </div>
                  <div style={{
                    padding: 14,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      最小值
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ff5050' }}>
                      {Math.min(...config.data.map(d => d.value))}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 14,
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    平均值
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                    {(config.data.reduce((s, d) => s + d.value, 0) / config.data.length).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
