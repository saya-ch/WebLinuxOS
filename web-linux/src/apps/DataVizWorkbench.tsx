import { useState, useCallback, useRef } from 'react'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'radar'
  title: string
  data: ChartData[]
  xLabel?: string
  yLabel?: string
  animated: boolean
  showLegend: boolean
  showValues: boolean
}

const DEFAULT_DATASETS: Record<string, ChartData[]> = {
  sales: [
    { label: '一月', value: 4200 },
    { label: '二月', value: 3800 },
    { label: '三月', value: 5100 },
    { label: '四月', value: 4700 },
    { label: '五月', value: 6200 },
    { label: '六月', value: 5800 },
    { label: '七月', value: 7100 },
    { label: '八月', value: 6500 },
  ],
  traffic: [
    { label: '直接访问', value: 335 },
    { label: '搜索引擎', value: 480 },
    { label: '社交媒体', value: 284 },
    { label: '外部链接', value: 150 },
    { label: '邮件推广', value: 210 },
  ],
  performance: [
    { label: '加载时间', value: 1.2 },
    { label: '首屏渲染', value: 0.8 },
    { label: '交互响应', value: 0.3 },
    { label: '动画流畅', value: 0.95 },
    { label: '内存占用', value: 0.67 },
  ],
  programming: [
    { label: 'JavaScript', value: 64.96 },
    { label: 'Python', value: 48.07 },
    { label: 'TypeScript', value: 38.87 },
    { label: 'Java', value: 35.35 },
    { label: 'C++', value: 22.42 },
    { label: 'Rust', value: 12.37 },
    { label: 'Go', value: 13.24 },
  ],
}

const CHART_COLORS = [
  '#7c6cf0', '#00d6c1', '#f43f5e', '#f59e0b', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#10b981', '#6366f1', '#f97316',
]

export default function DataVizWorkbench() {
  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    title: '月度销售数据',
    data: DEFAULT_DATASETS.sales,
    xLabel: '月份',
    yLabel: '销售额',
    animated: true,
    showLegend: true,
    showValues: true,
  })
  const [rawInput, setRawInput] = useState(
    '一月,4200\n二月,3800\n三月,5100\n四月,4700\n五月,6200\n六月,5800'
  )
  const [width, setWidth] = useState(700)
  const [height, setHeight] = useState(400)
  const svgRef = useRef<SVGSVGElement>(null)

  const parseInput = useCallback(() => {
    try {
      const lines = rawInput.trim().split('\n')
      const data = lines
        .map(line => {
          const [label, value] = line.split(/[,;\t]/)
          const numValue = parseFloat(value)
          if (label && !isNaN(numValue)) {
            return { label: label.trim(), value: numValue }
          }
          return null
        })
        .filter((item): item is ChartData => item !== null)
      if (data.length > 0) {
        setConfig(prev => ({ ...prev, data, title: '自定义数据' }))
      }
    } catch {
      // parse error
    }
  }, [rawInput])

  const loadDataset = useCallback((key: string) => {
    if (DEFAULT_DATASETS[key]) {
      const dataset = DEFAULT_DATASETS[key]
      setConfig(prev => ({ ...prev, data: dataset }))
      setRawInput(dataset.map(d => `${d.label},${d.value}`).join('\n'))
    }
  }, [])

  const exportSVG = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chart.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportPNG = useCallback(async () => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = pngUrl
            a.download = 'chart.png'
            a.click()
            URL.revokeObjectURL(pngUrl)
          }
        })
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [width, height])

  const renderBarChart = () => {
    const { data } = config
    const padding = { top: 30, right: 20, bottom: 50, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const maxValue = Math.max(...data.map(d => d.value))
    const barWidth = (chartWidth / data.length) * 0.7
    const barGap = (chartWidth / data.length) * 0.3

    return (
      <svg ref={svgRef} width={width} height={height} className="chart-svg">
        <rect width={width} height={height} fill="#ffffff" />
        
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio)
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray={ratio === 0 ? '0' : '4,4'}
              />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          )
        })}
        
        {data.map((item, idx) => {
          const barHeight = (item.value / maxValue) * chartHeight
          const x = padding.left + idx * (chartWidth / data.length) + barGap / 2
          const y = padding.top + chartHeight - barHeight
          return (
            <g key={idx} className={config.animated ? 'bar-animate' : ''}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                rx="4"
              >
                {config.animated && (
                  <animate
                    attributeName="height"
                    from="0"
                    to={barHeight}
                    dur="0.8s"
                    fill="freeze"
                  />
                )}
              </rect>
              {config.showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {item.label}
              </text>
            </g>
          )
        })}
        
        {config.xLabel && (
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="bold"
          >
            {config.xLabel}
          </text>
        )}
        {config.yLabel && (
          <text
            transform={`rotate(-90, 15, ${height / 2})`}
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="bold"
          >
            {config.yLabel}
          </text>
        )}
      </svg>
    )
  }

  const renderLineChart = () => {
    const { data } = config
    const padding = { top: 30, right: 20, bottom: 50, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const valueRange = maxValue - minValue || 1

    const points = data.map((item, idx) => {
      const x = padding.left + (idx / (data.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight
      return { x, y, item }
    })

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

    return (
      <svg ref={svgRef} width={width} height={height} className="chart-svg">
        <rect width={width} height={height} fill="#ffffff" />
        
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio)
          const val = minValue + valueRange * ratio
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">{val.toFixed(1)}</text>
            </g>
          )
        })}
        
        {config.type === 'area' && (
          <path d={areaD} fill={CHART_COLORS[0]} opacity="0.2" />
        )}
        
        <path d={pathD} fill="none" stroke={CHART_COLORS[0]} strokeWidth="2.5" />
        
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill={CHART_COLORS[0]} stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={height - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6b7280">{p.item.label}</text>
            {config.showValues && (
              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fill="#374151">{p.item.value}</text>
            )}
          </g>
        ))}
      </svg>
    )
  }

  const renderPieChart = () => {
    const { data } = config
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - 60
    const total = data.reduce((sum, d) => sum + d.value, 0)
    
    let currentAngle = -Math.PI / 2
    const segments = data.map((item, idx) => {
      const angle = (item.value / total) * 2 * Math.PI
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      
      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)
      const largeArc = angle > Math.PI ? 1 : 0
      
      return {
        d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: CHART_COLORS[idx % CHART_COLORS.length],
        item,
      }
    })

    return (
      <svg ref={svgRef} width={width} height={height} className="chart-svg">
        <rect width={width} height={height} fill="#ffffff" />
        {segments.map((seg, idx) => (
          <path key={idx} d={seg.d} fill={seg.color} stroke="#fff" strokeWidth="2" />
        ))}
        
        {config.showLegend && (
          <g transform={`translate(${width - 150}, 20)`}>
            {segments.map((seg, idx) => (
              <g key={idx} transform={`translate(0, ${idx * 22})`}>
                <rect width="14" height="14" fill={seg.color} rx="3" />
                <text x="20" y="12" fontSize="11" fill="#374151">
                  {seg.item.label} ({((seg.item.value / total) * 100).toFixed(1)}%)
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    )
  }

  const renderChart = () => {
    switch (config.type) {
      case 'bar': return renderBarChart()
      case 'line': return renderLineChart()
      case 'area': return renderLineChart()
      case 'pie': return renderPieChart()
      default: return renderBarChart()
    }
  }

  return (
    <div className="data-viz-workbench">
      <div className="viz-header">
        <h2>📊 数据可视化工作台</h2>
        <div className="viz-controls">
          <input
            type="text"
            value={config.title}
            onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
            placeholder="图表标题"
          />
          <select value={config.type} onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as ChartConfig['type'] }))}>
            <option value="bar">柱状图</option>
            <option value="line">折线图</option>
            <option value="area">面积图</option>
            <option value="pie">饼图</option>
          </select>
        </div>
      </div>

      <div className="viz-content">
        <div className="viz-sidebar">
          <h3>📋 数据输入</h3>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="格式: 标签,数值 (每行一条)"
            className="data-input"
            spellCheck={false}
          />
          <button onClick={parseInput}>✨ 解析数据</button>
          
          <h3>📚 示例数据集</h3>
          <div className="dataset-buttons">
            <button onClick={() => loadDataset('sales')}>月度销售</button>
            <button onClick={() => loadDataset('traffic')}>流量来源</button>
            <button onClick={() => loadDataset('performance')}>性能指标</button>
            <button onClick={() => loadDataset('programming')}>编程语言</button>
          </div>
          
          <h3>⚙️ 显示设置</h3>
          <label>
            <input type="checkbox" checked={config.animated} onChange={(e) => setConfig(prev => ({ ...prev, animated: e.target.checked }))} />
            动画效果
          </label>
          <label>
            <input type="checkbox" checked={config.showValues} onChange={(e) => setConfig(prev => ({ ...prev, showValues: e.target.checked }))} />
            显示数值
          </label>
          <label>
            <input type="checkbox" checked={config.showLegend} onChange={(e) => setConfig(prev => ({ ...prev, showLegend: e.target.checked }))} />
            显示图例
          </label>
          
          <h3>📏 尺寸</h3>
          <div className="size-controls">
            <label>宽: <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={300} max={1200} /></label>
            <label>高: <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={200} max={800} /></label>
          </div>
          
          <div className="export-buttons">
            <button onClick={exportSVG}>💾 导出SVG</button>
            <button onClick={exportPNG}>📷 导出PNG</button>
          </div>
        </div>

        <div className="viz-main">
          <div className="chart-container">
            <h3>{config.title}</h3>
            {renderChart()}
          </div>
          
          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-value">{config.data.length}</div>
              <div className="stat-label">数据点</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.max(...config.data.map(d => d.value)).toLocaleString()}</div>
              <div className="stat-label">最大值</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.min(...config.data.map(d => d.value)).toLocaleString()}</div>
              <div className="stat-label">最小值</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{(config.data.reduce((s, d) => s + d.value, 0) / config.data.length).toFixed(1)}</div>
              <div className="stat-label">平均值</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
