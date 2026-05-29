import { useState, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'

type ChartType = 'bar' | 'line' | 'pie' | 'area'
type DataPoint = { x: string; y: number }
type DataSeries = { name: string; data: DataPoint[]; color: string }

const defaultColors = [
  '#61affe',
  '#49cc90',
  '#fca130',
  '#f93e3e',
  '#9012fe',
  '#e83e8c',
  '#17a2b8',
]

const presetDatasets = [
  {
    name: '销售数据示例',
    series: [
      {
        name: '第一季度',
        data: [
          { x: '一月', y: 120 },
          { x: '二月', y: 180 },
          { x: '三月', y: 150 },
        ],
        color: '#61affe',
      },
      {
        name: '第二季度',
        data: [
          { x: '一月', y: 90 },
          { x: '二月', y: 210 },
          { x: '三月', y: 250 },
        ],
        color: '#49cc90',
      },
    ],
  },
  {
    name: '用户增长',
    series: [
      {
        name: '新用户',
        data: [
          { x: '1月', y: 150 },
          { x: '2月', y: 230 },
          { x: '3月', y: 280 },
          { x: '4月', y: 350 },
          { x: '5月', y: 420 },
          { x: '6月', y: 510 },
        ],
        color: '#61affe',
      },
    ],
  },
]

const DataVisualizer = memo(function DataVisualizer() {
  const addNotification = useStore((s) => s.addNotification)

  const [chartType, setChartType] = useState<ChartType>('bar')
  const [series, setSeries] = useState<DataSeries[]>(presetDatasets[0].series)
  const [title, setTitle] = useState('销售数据示例')
  const [xAxisLabel, setXAxisLabel] = useState('月份')
  const [yAxisLabel, setYAxisLabel] = useState('销售额')
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [jsonInput, setJsonInput] = useState('')
  const [activeTab, setActiveTab] = useState<'chart' | 'data' | 'export'>('chart')

  const chartHeight = 300
  const chartWidth = 600
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }

  const chartBounds = useMemo(() => ({
    width: chartWidth - padding.left - padding.right,
    height: chartHeight - padding.top - padding.bottom,
  }), [])

  const allDataPoints = useMemo(() => {
    const xValues = new Set<string>()
    series.forEach(s => {
      s.data.forEach(d => xValues.add(d.x))
    })
    return Array.from(xValues).map(x => ({
      x,
      y: Math.max(...series.map(s => s.data.find(d => d.x === x)?.y || 0)),
    }))
  }, [series])

  const yMax = useMemo(() => {
    const max = Math.max(...allDataPoints.map(d => d.y))
    return Math.ceil(max * 1.1) || 100
  }, [allDataPoints])

  const xScale = useCallback((x: string) => {
    const idx = allDataPoints.findIndex(d => d.x === x)
    if (idx === -1) return 0
    return padding.left + (idx * chartBounds.width) / Math.max(allDataPoints.length - 1, 1)
  }, [allDataPoints, chartBounds.width, padding.left])

  const yScale = useCallback((y: number) => {
    return padding.top + chartBounds.height - (y / yMax) * chartBounds.height
  }, [yMax, chartBounds.height, padding.top])

  const addSeries = useCallback(() => {
    const newColor = defaultColors[series.length % defaultColors.length]
    const newSeries: DataSeries = {
      name: `系列 ${series.length + 1}`,
      color: newColor,
      data: allDataPoints.map(d => ({ x: d.x, y: Math.floor(Math.random() * 200) })),
    }
    setSeries([...series, newSeries])
    addNotification({ title: '添加成功', message: '新数据系列已添加', type: 'success' })
  }, [series, allDataPoints, addNotification])

  const removeSeries = useCallback((index: number) => {
    if (series.length <= 1) {
      addNotification({ title: '提示', message: '至少需要一个数据系列', type: 'info' })
      return
    }
    setSeries(series.filter((_, i) => i !== index))
  }, [series, addNotification])

  const updateSeriesName = useCallback((index: number, name: string) => {
    const newSeries = [...series]
    newSeries[index] = { ...newSeries[index], name }
    setSeries(newSeries)
  }, [series])

  const updateSeriesColor = useCallback((index: number, color: string) => {
    const newSeries = [...series]
    newSeries[index] = { ...newSeries[index], color }
    setSeries(newSeries)
  }, [series])

  const addDataPoint = useCallback(() => {
    const newX = `数据 ${allDataPoints.length + 1}`
    setSeries(series.map(s => ({
      ...s,
      data: [...s.data, { x: newX, y: Math.floor(Math.random() * 200) }],
    })))
  }, [series, allDataPoints.length])

  const updateDataPoint = useCallback((seriesIndex: number, dataIndex: number, field: 'x' | 'y', value: string | number) => {
    const newSeries = [...series]
    const data = [...newSeries[seriesIndex].data]
    data[dataIndex] = { ...data[dataIndex], [field]: value }
    newSeries[seriesIndex] = { ...newSeries[seriesIndex], data }
    setSeries(newSeries)
  }, [series])

  const removeDataPoint = useCallback((x: string) => {
    setSeries(series.map(s => ({
      ...s,
      data: s.data.filter(d => d.x !== x),
    })))
  }, [series])

  const loadPreset = useCallback((preset: typeof presetDatasets[0]) => {
    setTitle(preset.name)
    setSeries(preset.series)
    addNotification({ title: '加载成功', message: '示例数据已加载', type: 'success' })
  }, [addNotification])

  const loadFromJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (Array.isArray(parsed)) {
        setSeries(parsed)
        addNotification({ title: '加载成功', message: '数据已从 JSON 加载', type: 'success' })
      } else {
        addNotification({ title: '格式错误', message: 'JSON 应该是一个数组', type: 'error' })
      }
    } catch (e) {
      addNotification({ title: '解析错误', message: '无效的 JSON 格式', type: 'error' })
    }
  }, [jsonInput, addNotification])

  const exportToSvg = useCallback(() => {
    const svgElement = document.getElementById('chart-svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification({ title: '导出成功', message: 'SVG 已下载', type: 'success' })
  }, [title, addNotification])

  const exportToPng = useCallback(() => {
    const svgElement = document.getElementById('chart-svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = chartWidth * 2
      canvas.height = chartHeight * 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `${title.replace(/\s+/g, '_')}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }
        }, 'image/png')
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
    addNotification({ title: '导出成功', message: 'PNG 已下载', type: 'success' })
  }, [title, addNotification])

  const renderChart = () => {
    const barWidth = Math.max(20, (chartBounds.width / allDataPoints.length) * 0.7 / series.length)

    return (
      <svg
        id="chart-svg"
        width={chartWidth}
        height={chartHeight}
        style={{ background: 'var(--titlebar-bg)', borderRadius: '8px' }}
      >
        {showGrid && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={padding.top + chartBounds.height * (1 - ratio)}
                  x2={padding.left + chartBounds.width}
                  y2={padding.top + chartBounds.height * (1 - ratio)}
                  stroke="var(--window-border)"
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 10}
                  y={padding.top + chartBounds.height * (1 - ratio) + 4}
                  textAnchor="end"
                  fill="var(--text-secondary)"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {Math.round(yMax * ratio)}
                </text>
              </g>
            ))}
          </>
        )}

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartBounds.height}
          stroke="var(--text-secondary)"
          strokeWidth={2}
        />
        <line
          x1={padding.left}
          y1={padding.top + chartBounds.height}
          x2={padding.left + chartBounds.width}
          y2={padding.top + chartBounds.height}
          stroke="var(--text-secondary)"
          strokeWidth={2}
        />

        {allDataPoints.map((d) => (
          <text
            key={d.x}
            x={xScale(d.x)}
            y={padding.top + chartBounds.height + 20}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
          >
            {d.x}
          </text>
        ))}

        <text
          x={padding.left + chartBounds.width / 2}
          y={chartHeight - 10}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="12"
          fontWeight="500"
        >
          {xAxisLabel}
        </text>

        <text
          x={20}
          y={padding.top + chartBounds.height / 2}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="12"
          fontWeight="500"
          transform={`rotate(-90, 20, ${padding.top + chartBounds.height / 2})`}
        >
          {yAxisLabel}
        </text>

        {chartType === 'bar' &&
          series.map((s, si) =>
            s.data.map((d) => {
              const baseX = xScale(d.x) - (barWidth * series.length) / 2 + barWidth * si + barWidth / 2
              const baseY = yScale(d.y)
              const height = yScale(0) - baseY

              return (
                <rect
                  key={`${s.name}-${d.x}`}
                  x={baseX - barWidth / 2}
                  y={baseY}
                  width={barWidth - 4}
                  height={height}
                  fill={s.color}
                  rx={4}
                />
              )
            })
          )}

        {(chartType === 'line' || chartType === 'area') &&
          series.map((s) => {
            const points = s.data
              .map((d) => `${xScale(d.x)},${yScale(d.y)}`)
              .join(' ')

            return (
              <g key={s.name}>
                {chartType === 'area' && (
                  <path
                    d={`M ${xScale(s.data[0].x)},${yScale(0)} L ${points} L ${xScale(s.data[s.data.length - 1].x)},${yScale(0)} Z`}
                    fill={s.color}
                    fillOpacity={0.2}
                  />
                )}
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {s.data.map((d) => (
                  <circle
                    key={d.x}
                    cx={xScale(d.x)}
                    cy={yScale(d.y)}
                    r={5}
                    fill={s.color}
                    stroke="var(--window-bg)"
                    strokeWidth={2}
                  />
                ))}
              </g>
            )
          })}

        {chartType === 'pie' && (
          <g transform={`translate(${chartWidth / 2}, ${chartHeight / 2})`}>
            {(() => {
              const total = series.reduce((sum, s) => sum + s.data.reduce((s2, d) => s2 + d.y, 0), 0)
              let currentAngle = -Math.PI / 2
              const radius = Math.min(chartWidth, chartHeight) / 2 - 60
              let colorIdx = 0

              return series.flatMap((s) =>
                s.data.map((d) => {
                  const startAngle = currentAngle
                  const sliceAngle = (d.y / total) * Math.PI * 2
                  currentAngle += sliceAngle

                  const x1 = Math.cos(startAngle) * radius
                  const y1 = Math.sin(startAngle) * radius
                  const x2 = Math.cos(startAngle + sliceAngle) * radius
                  const y2 = Math.sin(startAngle + sliceAngle) * radius
                  const largeArc = sliceAngle > Math.PI ? 1 : 0

                  const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
                  const color = s.color || defaultColors[colorIdx++ % defaultColors.length]

                  return (
                    <g key={`${s.name}-${d.x}`}>
                      <path d={path} fill={color} stroke="var(--window-bg)" strokeWidth={2} />
                      <text
                        x={Math.cos(startAngle + sliceAngle / 2) * (radius * 0.6)}
                        y={Math.sin(startAngle + sliceAngle / 2) * (radius * 0.6)}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="11"
                        fontWeight="600"
                      >
                        {d.x}
                      </text>
                    </g>
                  )
                })
              )
            })()}
          </g>
        )}

        <text
          x={chartWidth / 2}
          y={25}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="18"
          fontWeight="600"
        >
          {title}
        </text>
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--window-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--window-border)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
          style={selectStyle}
        >
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="area">面积图</option>
          <option value="pie">饼图</option>
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="图表标题"
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {presetDatasets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(p)}
              style={secondaryButtonStyle}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--window-border)' }}>
            {(['chart', 'data', 'export'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {tab === 'chart' ? '图表' : tab === 'data' ? '数据' : '导出'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {activeTab === 'chart' && (
              <div>
                {renderChart()}
                {showLegend && chartType !== 'pie' && (
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {series.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 16, height: 16, background: s.color, borderRadius: 4 }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div style={{ width: '100%', maxWidth: 800 }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={xAxisLabel}
                    onChange={(e) => setXAxisLabel(e.target.value)}
                    placeholder="X 轴标签"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="text"
                    value={yAxisLabel}
                    onChange={(e) => setYAxisLabel(e.target.value)}
                    placeholder="Y 轴标签"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                    />
                    显示网格
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                    />
                    显示图例
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={addSeries} style={primaryButtonStyle}>+ 添加系列</button>
                  <button onClick={addDataPoint} style={secondaryButtonStyle}>+ 添加数据点</button>
                </div>

                {series.map((s, si) => (
                  <div key={si} style={{ marginBottom: '16px', border: '1px solid var(--window-border)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => updateSeriesName(si, e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="color"
                        value={s.color}
                        onChange={(e) => updateSeriesColor(si, e.target.value)}
                        style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                      <button onClick={() => removeSeries(si)} style={dangerButtonStyle}>删除</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {s.data.map((d, di) => (
                        <div key={di} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={d.x}
                            onChange={(e) => updateDataPoint(si, di, 'x', e.target.value)}
                            placeholder="标签"
                            style={inputStyle}
                          />
                          <input
                            type="number"
                            value={d.y}
                            onChange={(e) => updateDataPoint(si, di, 'y', Number(e.target.value))}
                            placeholder="数值"
                            style={inputStyle}
                          />
                          <button onClick={() => removeDataPoint(d.x)} style={dangerButtonStyle}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'export' && (
              <div style={{ width: '100%', maxWidth: 600 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '16px' }}>导出图表</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={exportToSvg} style={primaryButtonStyle}>导出 SVG</button>
                    <button onClick={exportToPng} style={primaryButtonStyle}>导出 PNG</button>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '16px' }}>JSON 数据</h3>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"name":"系列1","color":"#61affe","data":[{"x":"A","y":100}]}]'
                    style={{
                      ...inputStyle,
                      width: '100%',
                      minHeight: '200px',
                      fontFamily: 'JetBrains Mono, monospace',
                      resize: 'vertical',
                    }}
                  />
                  <button onClick={loadFromJson} style={{ ...primaryButtonStyle, marginTop: '8px' }}>从 JSON 加载</button>
                  <button
                    onClick={() => setJsonInput(JSON.stringify(series, null, 2))}
                    style={{ ...secondaryButtonStyle, marginLeft: '8px', marginTop: '8px' }}
                  >
                    复制当前 JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

const primaryButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: '600',
  cursor: 'pointer',
  fontSize: '13px',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--window-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '13px',
}

const dangerButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--error)',
  background: 'transparent',
  color: 'var(--error)',
  cursor: 'pointer',
  fontSize: '13px',
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--window-border)',
  background: 'var(--window-bg)',
  color: 'var(--text-primary)',
  fontSize: '13px',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

export default DataVisualizer
