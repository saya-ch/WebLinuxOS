import { useState, useRef } from 'react'
import { BarChart3, PieChart, TrendingUp, Download, Copy, Check, RefreshCw } from 'lucide-react'

interface DataPoint {
  label: string
  value: number
  color?: string
}

const defaultData: DataPoint[] = [
  { label: '一月', value: 65, color: '#8b7cf0' },
  { label: '二月', value: 59, color: '#a59dfa' },
  { label: '三月', value: 80, color: '#8b7cf0' },
  { label: '四月', value: 81, color: '#a59dfa' },
  { label: '五月', value: 56, color: '#8b7cf0' },
  { label: '六月', value: 55, color: '#a59dfa' },
]

const colors = [
  '#8b7cf0', '#a59dfa', '#6c5ce7', '#a29bfe',
  '#00d084', '#00b894', '#fdcb6e', '#f39c12',
  '#e74c3c', '#c0392b', '#3498db', '#2980b9'
]

export default function DataViz() {
  const [data, setData] = useState<DataPoint[]>(defaultData)
  const [inputText, setInputText] = useState('')
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [copied, setCopied] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  const parseData = (text: string): DataPoint[] => {
    const lines = text.trim().split('\n').filter(Boolean)
    return lines.map((line, i) => {
      const parts = line.split(/[,\t\s]+/)
      const label = parts[0] || `项目 ${i + 1}`
      const value = parseFloat(parts[1]) || 0
      return { label, value, color: colors[i % colors.length] }
    }).filter(d => d.value > 0)
  }

  const handleInputChange = (text: string) => {
    setInputText(text)
    if (text.trim()) {
      const parsed = parseData(text)
      if (parsed.length > 0) setData(parsed)
    }
  }

  const randomizeData = () => {
    const newData = data.map(d => ({
      ...d,
      value: Math.floor(Math.random() * 100) + 10
    }))
    setData(newData)
    setAnimationKey(prev => prev + 1)
  }

  const exportSVG = () => {
    if (!svgRef.current) return
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAsJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maxValue = Math.max(...data.map(d => d.value), 100)

  const renderBarChart = () => (
    <svg ref={svgRef} width="100%" height="300" viewBox="0 0 500 300" key={animationKey}>
      {data.map((d, i) => {
        const barWidth = 40
        const spacing = (500 - barWidth * data.length) / (data.length + 1)
        const x = spacing + i * (barWidth + spacing)
        const height = (d.value / maxValue) * 220
        const y = 260 - height
        
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill={d.color}
              rx="4"
              className="chart-bar"
              style={{
                animation: 'growUp 0.6s ease-out forwards',
                transformOrigin: `${x + barWidth/2}px 260px`
              }}
            >
              <animate
                attributeName="height"
                from="0"
                to={height}
                dur="0.6s"
                fill="freeze"
              />
              <animate
                attributeName="y"
                from="260"
                to={y}
                dur="0.6s"
                fill="freeze"
              />
            </rect>
            <text
              x={x + barWidth/2}
              y="280"
              textAnchor="middle"
              fill="var(--text-primary, #e8e8ff)"
              fontSize="12"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {d.label}
            </text>
            <text
              x={x + barWidth/2}
              y={y - 8}
              textAnchor="middle"
              fill={d.color}
              fontSize="14"
              fontWeight="600"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {d.value}
            </text>
          </g>
        )
      })}
    </svg>
  )

  const renderPieChart = () => {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    let currentAngle = -90
    
    return (
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 300 300" key={animationKey}>
        <g transform="translate(150, 150)">
          {data.map((d, i) => {
            const angle = (d.value / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle = endAngle
            
            const start = polarToCartesian(0, 0, 100, startAngle)
            const end = polarToCartesian(0, 0, 100, endAngle)
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const path = `M 0 0 L ${start.x} ${start.y} A 100 100 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
            
            return (
              <g key={i}>
                <path
                  d={path}
                  fill={d.color}
                  className="chart-slice"
                  style={{ animation: 'fadeIn 0.4s ease-out forwards', opacity: 0 }}
                />
                {angle > 15 && (
                  <text
                    x={(start.x + end.x) / 4}
                    y={(start.y + end.y) / 4}
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                  >
                    {Math.round((d.value / total) * 100)}%
                  </text>
                )}
              </g>
            )
          })}
          <circle cx="0" cy="0" r="50" fill="var(--window-bg, #12121c)" />
        </g>
        <g transform="translate(280, 20)">
          {data.map((d, i) => (
            <g key={i} transform={`translate(0, ${i * 20})`}>
              <rect x="0" y="5" width="12" height="12" fill={d.color} rx="2" />
              <text
                x="18"
                y="16"
                fill="var(--text-primary, #e8e8ff)"
                fontSize="11"
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {d.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    )
  }

  const renderLineChart = () => {
    const points = data.map((d, i) => {
      const x = 50 + (i * (400 / (data.length - 1)))
      const y = 250 - (d.value / maxValue) * 200
      return { x, y, ...d }
    })
    
    const linePath = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ')
    
    const areaPath = `${linePath} L ${points[points.length-1].x} 270 L ${points[0].x} 270 Z`

    return (
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 500 300" key={animationKey}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className="chart-area"
        />
        
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-line"
        />
        
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="var(--window-bg, #12121c)"
              stroke={p.color}
              strokeWidth="3"
              className="chart-point"
            />
            <text
              x={p.x}
              y="280"
              textAnchor="middle"
              fill="var(--text-primary, #e8e8ff)"
              fontSize="12"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {p.label}
            </text>
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fill="var(--text-primary, #e8e8ff)"
              fontSize="12"
              fontWeight="600"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {p.value}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color, #333)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { type: 'bar' as const, icon: BarChart3, label: '柱状图' },
            { type: 'pie' as const, icon: PieChart, label: '饼图' },
            { type: 'line' as const, icon: TrendingUp, label: '折线图' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              style={{
                padding: '8px 12px',
                background: chartType === type ? 'var(--accent)' : 'var(--bg-secondary, #252525)',
                color: chartType === type ? 'white' : 'var(--text-primary, #e8e8ff)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={randomizeData}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-secondary, #252525)',
              color: 'var(--text-primary, #e8e8ff)',
              border: '1px solid var(--border-color, #333)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <RefreshCw size={16} />
            随机数据
          </button>
          <button
            onClick={exportSVG}
            style={{
              padding: '8px 12px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Download size={16} />
            导出SVG
          </button>
          <button
            onClick={copyAsJSON}
            style={{
              padding: '8px 12px',
              background: copied ? 'var(--success)' : 'var(--bg-secondary, #252525)',
              color: 'white',
              border: '1px solid var(--border-color, #333)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制JSON'}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #1a1a28)' }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'pie' && renderPieChart()}
            {chartType === 'line' && renderLineChart()}
          </div>
        </div>
        
        <div style={{ 
          width: '300px', 
          borderLeft: '1px solid var(--border-color, #333)', 
          background: 'var(--bg-secondary, #252525)',
          padding: '16px',
          overflow: 'auto'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '13px', 
              fontWeight: '600',
              color: 'var(--text-primary, #e8e8ff)',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              数据输入 (每行: 标签, 数值)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="一月, 65
二月, 59
三月, 80
四月, 81
五月, 56
六月, 55"
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                background: 'var(--bg-primary, #1a1a28)',
                border: '1px solid var(--border-color, #333)',
                borderRadius: '8px',
                color: 'var(--text-primary, #e8e8ff)',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
          
          <div>
            <div style={{ 
              marginBottom: '12px',
              fontSize: '13px', 
              fontWeight: '600',
              color: 'var(--text-primary, #e8e8ff)',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              数据预览
            </div>
            <div style={{ 
              background: 'var(--bg-primary, #1a1a28)', 
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--border-color, #333)'
            }}>
              {data.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderBottom: i < data.length - 1 ? '1px solid var(--border-color, #333)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: d.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ 
                    flex: 1, 
                    fontSize: '12px',
                    color: 'var(--text-primary, #e8e8ff)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}>
                    {d.label}
                  </span>
                  <span style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--accent)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .chart-bar, .chart-slice, .chart-point, .chart-line, .chart-area {
          transition: all 0.2s ease;
        }
        
        .chart-bar:hover, .chart-slice:hover, .chart-point:hover {
          filter: brightness(1.1);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  )
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}
