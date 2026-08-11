import { useState, useMemo, useCallback } from 'react'

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter'

interface DataPoint {
  label: string
  value: number
  category?: string
}

interface TabConfig {
  id: 'data' | 'config' | 'preview'
  label: string
}

const TABS: TabConfig[] = [
  { id: 'data', label: '数据' },
  { id: 'config', label: '配置' },
  { id: 'preview', label: '预览' },
]

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'bar', label: '柱状图', icon: '📊' },
  { value: 'line', label: '折线图', icon: '📈' },
  { value: 'pie', label: '饼图', icon: '🥧' },
  { value: 'area', label: '面积图', icon: '📉' },
  { value: 'radar', label: '雷达图', icon: '🕸️' },
  { value: 'scatter', label: '散点图', icon: '⚫' },
]

const PRESET_DATASETS: Record<string, { name: string; data: DataPoint[] }> = {
  sales: {
    name: '月度销售数据',
    data: [
      { label: '1月', value: 4200 },
      { label: '2月', value: 3800 },
      { label: '3月', value: 5100 },
      { label: '4月', value: 4600 },
      { label: '5月', value: 5800 },
      { label: '6月', value: 6200 },
      { label: '7月', value: 5400 },
      { label: '8月', value: 7100 },
    ],
  },
  traffic: {
    name: '网站流量来源',
    data: [
      { label: '直接访问', value: 35 },
      { label: '搜索引擎', value: 28 },
      { label: '社交媒体', value: 20 },
      { label: '外部链接', value: 12 },
      { label: '邮件营销', value: 5 },
    ],
  },
  programming: {
    name: '编程语言排行',
    data: [
      { label: 'JavaScript', value: 64.96 },
      { label: 'Python', value: 48.07 },
      { label: 'TypeScript', value: 38.87 },
      { label: 'Java', value: 35.35 },
      { label: 'C++', value: 22.42 },
      { label: 'Rust', value: 13.23 },
      { label: 'Go', value: 12.95 },
    ],
  },
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

export default function DataVizWorkbench() {
  const [activeTab, setActiveTab] = useState<'data' | 'config' | 'preview'>('data')
  const [data, setData] = useState<DataPoint[]>(PRESET_DATASETS.sales.data)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [title, setTitle] = useState('数据可视化图表')
  const [xLabel, setXLabel] = useState('类别')
  const [yLabel, setYLabel] = useState('数值')
  const [showGrid, setShowGrid] = useState(true)
  const [animate, setAnimate] = useState(true)
  const [csvInput, setCsvInput] = useState('')
  const [error, setError] = useState('')

  const addDataPoint = useCallback(() => {
    setData(prev => [...prev, { label: `项目 ${prev.length + 1}`, value: 0 }])
  }, [])

  const updateDataPoint = useCallback((index: number, field: 'label' | 'value', value: string) => {
    setData(prev => prev.map((d, i) => {
      if (i !== index) return d
      return { ...d, [field]: field === 'value' ? Number(value) || 0 : value }
    }))
  }, [])

  const removeDataPoint = useCallback((index: number) => {
    setData(prev => prev.filter((_, i) => i !== index))
  }, [])

  const loadPreset = useCallback((key: string) => {
    setData(PRESET_DATASETS[key].data)
    setError('')
  }, [])

  const parseCSV = useCallback(() => {
    try {
      const lines = csvInput.trim().split('\n')
      if (lines.length < 2) {
        setError('CSV 格式错误：至少需要两行（表头+数据）')
        return
      }
      const parsed: DataPoint[] = []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',')
        if (parts.length >= 2) {
          const label = parts[0].trim()
          const value = parseFloat(parts[1].trim())
          if (label && !isNaN(value)) {
            parsed.push({ label, value })
          }
        }
      }
      if (parsed.length === 0) {
        setError('未能解析任何有效数据')
        return
      }
      setData(parsed)
      setError('')
      setActiveTab('preview')
    } catch {
      setError('CSV 解析失败')
    }
  }, [csvInput])

  const exportSVG = useCallback(() => {
    const svgEl = document.getElementById('dataviz-svg')
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgEl)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'chart'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [title])

  const exportJSON = useCallback(() => {
    const json = JSON.stringify({ title, chartType, data }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'chart'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [title, chartType, data])

  const stats = useMemo(() => {
    if (data.length === 0) return null
    const values = data.map(d => d.value)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    return { count: data.length, sum, avg, max, min }
  }, [data])

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.title}>
          <span style={styles.titleIcon}>📊</span>
          <h1 style={styles.titleText}>DataViz Workbench</h1>
          <span style={styles.subtitle}>数据可视化工作台</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn} onClick={exportSVG}>导出 SVG</button>
          <button style={styles.exportBtn} onClick={exportJSON}>导出 JSON</button>
        </div>
      </header>

      <div style={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.body}>
        {activeTab === 'data' && (
          <DataPanel
            data={data}
            csvInput={csvInput}
            setCsvInput={setCsvInput}
            addDataPoint={addDataPoint}
            updateDataPoint={updateDataPoint}
            removeDataPoint={removeDataPoint}
            loadPreset={loadPreset}
            parseCSV={parseCSV}
            error={error}
            stats={stats}
          />
        )}
        {activeTab === 'config' && (
          <ConfigPanel
            chartType={chartType}
            setChartType={setChartType}
            title={title}
            setTitle={setTitle}
            xLabel={xLabel}
            setXLabel={setXLabel}
            yLabel={yLabel}
            setYLabel={setYLabel}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            animate={animate}
            setAnimate={setAnimate}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewPanel
            data={data}
            chartType={chartType}
            title={title}
            xLabel={xLabel}
            yLabel={yLabel}
            showGrid={showGrid}
            animate={animate}
          />
        )}
      </div>
    </div>
  )
}

interface DataPanelProps {
  data: DataPoint[]
  csvInput: string
  setCsvInput: (v: string) => void
  addDataPoint: () => void
  updateDataPoint: (i: number, field: 'label' | 'value', v: string) => void
  removeDataPoint: (i: number) => void
  loadPreset: (key: string) => void
  parseCSV: () => void
  error: string
  stats: { count: number; sum: number; avg: number; max: number; min: number } | null
}

function DataPanel(props: DataPanelProps) {
  const [mode, setMode] = useState<'manual' | 'csv' | 'preset'>('manual')

  return (
    <div style={styles.panel}>
      <div style={styles.modeSwitch}>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'manual' ? styles.modeActive : {}) }}
          onClick={() => setMode('manual')}
        >手动编辑</button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'csv' ? styles.modeActive : {}) }}
          onClick={() => setMode('csv')}
        >CSV 导入</button>
        <button
          style={{ ...styles.modeBtn, ...(mode === 'preset' ? styles.modeActive : {}) }}
          onClick={() => setMode('preset')}
        >预设数据</button>
      </div>

      {mode === 'manual' && (
        <div style={styles.manualSection}>
          <div style={styles.dataHeader}>
            <span>数据点 ({props.data.length})</span>
            <button style={styles.addBtn} onClick={props.addDataPoint}>+ 添加</button>
          </div>
          <div style={styles.dataTable}>
            <div style={styles.dataRowHeader}>
              <span style={styles.colIdx}>#</span>
              <span style={styles.colLabel}>标签</span>
              <span style={styles.colValue}>数值</span>
              <span style={styles.colAction}></span>
            </div>
            {props.data.map((d, i) => (
              <div key={i} style={styles.dataRow}>
                <span style={styles.colIdx}>{i + 1}</span>
                <input
                  style={styles.input}
                  value={d.label}
                  onChange={(e) => props.updateDataPoint(i, 'label', e.target.value)}
                  placeholder="标签"
                />
                <input
                  style={{ ...styles.input, ...styles.numInput }}
                  type="number"
                  value={d.value}
                  onChange={(e) => props.updateDataPoint(i, 'value', e.target.value)}
                />
                <button style={styles.delBtn} onClick={() => props.removeDataPoint(i)}>×</button>
              </div>
            ))}
          </div>
          {props.stats && (
            <div style={styles.statsBar}>
              <StatChip label="数量" value={props.stats.count} />
              <StatChip label="总和" value={props.stats.sum.toFixed(1)} />
              <StatChip label="平均" value={props.stats.avg.toFixed(1)} />
              <StatChip label="最大" value={props.stats.max.toFixed(1)} />
              <StatChip label="最小" value={props.stats.min.toFixed(1)} />
            </div>
          )}
        </div>
      )}

      {mode === 'csv' && (
        <div style={styles.csvSection}>
          <p style={styles.hint}>粘贴 CSV 数据（格式：标签,数值）</p>
          <textarea
            style={styles.csvTextarea}
            value={props.csvInput}
            onChange={(e) => props.setCsvInput(e.target.value)}
            placeholder="标签1,100&#10;标签2,200&#10;标签3,150"
            spellCheck={false}
          />
          {props.error && <div style={styles.errorMsg}>{props.error}</div>}
          <button style={styles.parseBtn} onClick={props.parseCSV}>解析并导入</button>
        </div>
      )}

      {mode === 'preset' && (
        <div style={styles.presetSection}>
          <p style={styles.hint}>选择一个预设数据集</p>
          <div style={styles.presetGrid}>
            {Object.entries(PRESET_DATASETS).map(([key, ds]) => (
              <button key={key} style={styles.presetCard} onClick={() => props.loadPreset(key)}>
                <div style={styles.presetName}>{ds.name}</div>
                <div style={styles.presetCount}>{ds.data.length} 个数据点</div>
                <div style={styles.presetPreview}>
                  {ds.data.slice(0, 3).map((d, i) => (
                    <span key={i} style={styles.presetTag}>{d.label}: {d.value}</span>
                  ))}
                  {ds.data.length > 3 && <span style={styles.presetMore}>...</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.statChip}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
    </div>
  )
}

interface ConfigPanelProps {
  chartType: ChartType
  setChartType: (v: ChartType) => void
  title: string
  setTitle: (v: string) => void
  xLabel: string
  setXLabel: (v: string) => void
  yLabel: string
  setYLabel: (v: string) => void
  showGrid: boolean
  setShowGrid: (v: boolean) => void
  animate: boolean
  setAnimate: (v: boolean) => void
}

function ConfigPanel(props: ConfigPanelProps) {
  return (
    <div style={styles.configPanel}>
      <Section title="图表类型">
        <div style={styles.chartTypeGrid}>
          {CHART_TYPES.map(ct => (
            <button
              key={ct.value}
              style={{ ...styles.chartTypeCard, ...(props.chartType === ct.value ? styles.chartTypeActive : {}) }}
              onClick={() => props.setChartType(ct.value)}
            >
              <span style={styles.chartTypeIcon}>{ct.icon}</span>
              <span>{ct.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="标题与标签">
        <div style={styles.configRow}>
          <label style={styles.configLabel}>图表标题</label>
          <input
            style={styles.configInput}
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder="输入图表标题"
          />
        </div>
        <div style={styles.configRow}>
          <label style={styles.configLabel}>X 轴标签</label>
          <input
            style={styles.configInput}
            value={props.xLabel}
            onChange={(e) => props.setXLabel(e.target.value)}
            placeholder="X 轴标签"
          />
        </div>
        <div style={styles.configRow}>
          <label style={styles.configLabel}>Y 轴标签</label>
          <input
            style={styles.configInput}
            value={props.yLabel}
            onChange={(e) => props.setYLabel(e.target.value)}
            placeholder="Y 轴标签"
          />
        </div>
      </Section>

      <Section title="显示选项">
        <div style={styles.toggleRow}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={props.showGrid}
              onChange={(e) => props.setShowGrid(e.target.checked)}
            />
            <span>显示网格</span>
          </label>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={props.animate}
              onChange={(e) => props.setAnimate(e.target.checked)}
            />
            <span>启用动画</span>
          </label>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.configSection}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

interface PreviewPanelProps {
  data: DataPoint[]
  chartType: ChartType
  title: string
  xLabel: string
  yLabel: string
  showGrid: boolean
  animate: boolean
}

function PreviewPanel(props: PreviewPanelProps) {
  const { data, chartType, title, xLabel, yLabel, showGrid, animate } = props

  if (data.length === 0) {
    return (
      <div style={styles.emptyState}>
        <span style={styles.emptyIcon}>📊</span>
        <p>暂无数据，请先在「数据」标签页添加数据</p>
      </div>
    )
  }

  return (
    <div style={styles.previewContainer}>
      <svg
        id="dataviz-svg"
        viewBox="0 0 800 500"
        style={styles.svgContainer}
        xmlns="http://www.w3.org/2000/svg"
      >
        <ChartRenderer
          data={data}
          chartType={chartType}
          title={title}
          xLabel={xLabel}
          yLabel={yLabel}
          showGrid={showGrid}
          animate={animate}
        />
      </svg>
      <Legend data={data} />
    </div>
  )
}

interface ChartRendererProps {
  data: DataPoint[]
  chartType: ChartType
  title: string
  xLabel: string
  yLabel: string
  showGrid: boolean
  animate: boolean
}

function ChartRenderer(props: ChartRendererProps) {
  const { data, chartType, title, xLabel, yLabel, showGrid } = props

  const padding = { top: 60, right: 40, bottom: 80, left: 80 }
  const width = 800
  const height = 500
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map(d => d.value)) * 1.1
  const minVal = 0

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0
  const barWidth = Math.min(60, (chartWidth / data.length) * 0.7)

  const getX = (i: number) => padding.left + (data.length > 1 ? i * xStep : chartWidth / 2)
  const getY = (v: number) => padding.top + chartHeight - ((v - minVal) / (maxVal - minVal)) * chartHeight

  return (
    <g>
      <text x={width / 2} y={30} style={styles.svgTitle} textAnchor="middle">{title}</text>

      {showGrid && Array.from({ length: 6 }, (_, i) => {
        const y = padding.top + (chartHeight / 5) * i
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="rgba(99, 102, 241, 0.1)"
            strokeDasharray="4 4"
          />
        )
      })}

      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="rgba(99, 102, 241, 0.3)" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(99, 102, 241, 0.3)" />

      {chartType === 'bar' && (
        <g>
          {data.map((d, i) => {
            const x = getX(i) - barWidth / 2
            const y = getY(d.value)
            const h = height - padding.bottom - y
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill={COLORS[i % COLORS.length]}
                  opacity={0.9}
                  rx={4}
                >
                  <title>{`${d.label}: ${d.value}`}</title>
                </rect>
                <text x={getX(i)} y={y - 5} style={styles.svgValue} textAnchor="middle">{d.value.toFixed(0)}</text>
              </g>
            )
          })}
        </g>
      )}

      {chartType === 'line' && (
        <g>
          <polyline
            points={data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
          />
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.value)} r={6} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth="2" />
              <text x={getX(i)} y={getY(d.value) - 12} style={styles.svgValue} textAnchor="middle">{d.value.toFixed(0)}</text>
            </g>
          ))}
        </g>
      )}

      {chartType === 'area' && (
        <g>
          <path
            d={`M ${data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' L ')} L ${getX(data.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`}
            fill="url(#areaGradient)"
            opacity={0.3}
          />
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
          />
          {data.map((d, i) => (
            <circle key={i} cx={getX(i)} cy={getY(d.value)} r={5} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth="2" />
          ))}
        </g>
      )}

      {chartType === 'pie' && (
        <g>
          {(() => {
            const total = data.reduce((s, d) => s + d.value, 0)
            let startAngle = -Math.PI / 2
            const cx = width / 2
            const cy = height / 2 - 20
            const radius = Math.min(chartWidth, chartHeight) / 2 - 10
            return data.map((d, i) => {
              const angle = (d.value / total) * Math.PI * 2
              const endAngle = startAngle + angle
              const largeArc = angle > Math.PI ? 1 : 0
              const x1 = cx + radius * Math.cos(startAngle)
              const y1 = cy + radius * Math.sin(startAngle)
              const x2 = cx + radius * Math.cos(endAngle)
              const y2 = cy + radius * Math.sin(endAngle)
              const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
              startAngle = endAngle
              return (
                <path key={i} d={path} fill={COLORS[i % COLORS.length]} opacity={0.85}>
                  <title>{`${d.label}: ${d.value} (${((d.value / total) * 100).toFixed(1)}%)`}</title>
                </path>
              )
            })
          })()}
        </g>
      )}

      {chartType === 'radar' && (
        <g>
          {(() => {
            const cx = width / 2
            const cy = height / 2
            const radius = Math.min(chartWidth, chartHeight) / 2 - 40
            const angles = data.map((_, i) => (Math.PI * 2 * i) / data.length - Math.PI / 2)
            return (
              <>
                {[0.25, 0.5, 0.75, 1].map((scale, si) => (
                  <polygon
                    key={si}
                    points={angles.map(a => `${cx + radius * scale * Math.cos(a)},${cy + radius * scale * Math.sin(a)}`).join(' ')}
                    fill="none"
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="1"
                  />
                ))}
                {angles.map((a, i) => (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + radius * Math.cos(a)}
                    y2={cy + radius * Math.sin(a)}
                    stroke="rgba(99, 102, 241, 0.15)"
                    strokeWidth="1"
                  />
                ))}
                <polygon
                  points={data.map((d, i) => {
                    const r = (d.value / maxVal) * radius
                    return `${cx + r * Math.cos(angles[i])},${cy + r * Math.sin(angles[i])}`
                  }).join(' ')}
                  fill="#6366f1"
                  opacity={0.3}
                  stroke="#6366f1"
                  strokeWidth="2"
                />
                {data.map((d, i) => {
                  const r = (d.value / maxVal) * radius
                  return (
                    <circle
                      key={i}
                      cx={cx + r * Math.cos(angles[i])}
                      cy={cy + r * Math.sin(angles[i])}
                      r={5}
                      fill={COLORS[i % COLORS.length]}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )
                })}
                {data.map((d, i) => {
                  const r = radius + 15
                  return (
                    <text
                      key={i}
                      x={cx + r * Math.cos(angles[i])}
                      y={cy + r * Math.sin(angles[i])}
                      style={styles.svgLabel}
                      textAnchor="middle"
                    >
                      {d.label}
                    </text>
                  )
                })}
              </>
            )
          })()}
        </g>
      )}

      {chartType === 'scatter' && (
        <g>
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={8}
              fill={COLORS[i % COLORS.length]}
              opacity={0.8}
              stroke="#fff"
              strokeWidth="2"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          ))}
        </g>
      )}

      {chartType !== 'pie' && chartType !== 'radar' && (
        <>
          {data.map((d, i) => (
            <text
              key={`label-${i}`}
              x={getX(i)}
              y={height - padding.bottom + 20}
              style={styles.svgLabel}
              textAnchor="middle"
            >
              {d.label}
            </text>
          ))}
          <text x={padding.left - 60} y={padding.top + chartHeight / 2} style={styles.svgAxisLabel} textAnchor="middle" transform={`rotate(-90, ${padding.left - 60}, ${padding.top + chartHeight / 2})`}>
            {yLabel}
          </text>
          <text x={width / 2} y={height - 20} style={styles.svgAxisLabel} textAnchor="middle">
            {xLabel}
          </text>
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = minVal + (maxVal - minVal) * pct
            return (
              <text
                key={i}
                x={padding.left - 10}
                y={getY(val)}
                style={styles.svgValue}
                textAnchor="end"
              >
                {val.toFixed(0)}
              </text>
            )
          })}
        </>
      )}
    </g>
  )
}

function Legend({ data }: { data: DataPoint[] }) {
  return (
    <div style={styles.legend}>
      {data.map((d, i) => (
        <div key={i} style={styles.legendItem}>
          <span style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
          <span style={styles.legendLabel}>{d.label}</span>
          <span style={styles.legendValue}>{d.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0f0f1a',
    color: '#e2e8f0',
    fontFamily: 'inherit',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
    flexShrink: 0,
  },
  title: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  titleIcon: { fontSize: 28 },
  titleText: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 400,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  exportBtn: {
    padding: '8px 16px',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#c7d2fe',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
  tabs: {
    display: 'flex',
    padding: '0 24px',
    background: 'rgba(30, 27, 75, 0.3)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    flexShrink: 0,
  },
  tab: {
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  tabActive: {
    color: '#c7d2fe',
    borderBottomColor: '#6366f1',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
  panel: {
    maxWidth: 900,
  },
  modeSwitch: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  modeBtn: {
    padding: '10px 20px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  },
  modeActive: {
    background: 'rgba(99, 102, 241, 0.3)',
    color: '#c7d2fe',
  },
  manualSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  dataHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  addBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  dataTable: {
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dataRowHeader: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 150px 40px',
    gap: 8,
    padding: '10px 12px',
    background: 'rgba(99, 102, 241, 0.1)',
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  dataRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 150px 40px',
    gap: 8,
    padding: '8px 12px',
    alignItems: 'center',
    borderTop: '1px solid rgba(99, 102, 241, 0.1)',
  },
  colIdx: { color: '#6366f1', fontWeight: 600, fontSize: 13 },
  colLabel: { fontSize: 12 },
  colValue: { fontSize: 12 },
  colAction: { fontSize: 12 },
  input: {
    width: '100%',
    padding: '6px 10px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
  },
  numInput: { textAlign: 'right' },
  delBtn: {
    width: 28,
    height: 28,
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  },
  statsBar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  statChip: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 16px',
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
    minWidth: 80,
    textAlign: 'center',
  },
  statLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 700, color: '#c7d2fe' },
  csvSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  hint: { color: '#94a3b8', fontSize: 13, margin: 0 },
  csvTextarea: {
    width: '100%',
    minHeight: 180,
    padding: 12,
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'JetBrains Mono, monospace',
    resize: 'vertical',
    outline: 'none',
  },
  errorMsg: {
    padding: 10,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    color: '#fca5a5',
    fontSize: 13,
  },
  parseBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  presetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
  presetCard: {
    padding: 16,
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  presetName: { fontSize: 15, fontWeight: 600, color: '#c7d2fe', marginBottom: 4 },
  presetCount: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  presetPreview: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  presetTag: {
    padding: '2px 8px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 4,
    fontSize: 11,
    color: '#94a3b8',
  },
  presetMore: { fontSize: 11, color: '#64748b' },
  configPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 700,
  },
  configSection: {
    padding: 20,
    background: 'rgba(15, 15, 26, 0.6)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#c7d2fe', margin: '0 0 16px' },
  chartTypeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 8,
  },
  chartTypeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 16,
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 10,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  chartTypeActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#c7d2fe',
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  chartTypeIcon: { fontSize: 24 },
  configRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  configLabel: { fontSize: 13, color: '#94a3b8' },
  configInput: {
    padding: '10px 14px',
    background: 'rgba(15, 15, 26, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
  },
  toggleRow: {
    display: 'flex',
    gap: 20,
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#94a3b8',
    fontSize: 14,
    cursor: 'pointer',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  svgContainer: {
    width: '100%',
    maxWidth: 800,
    background: 'rgba(15, 15, 26, 0.4)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
  },
  svgTitle: {
    fontSize: 16,
    fontWeight: 600,
    fill: '#e2e8f0',
  },
  svgValue: {
    fontSize: 11,
    fill: '#94a3b8',
  },
  svgLabel: {
    fontSize: 12,
    fill: '#94a3b8',
  },
  svgAxisLabel: {
    fontSize: 12,
    fill: '#64748b',
    fontWeight: 500,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    background: 'rgba(15, 15, 26, 0.4)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 12,
    maxWidth: 800,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: { color: '#94a3b8' },
  legendValue: { color: '#c7d2fe', fontWeight: 600 },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#64748b',
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
}
