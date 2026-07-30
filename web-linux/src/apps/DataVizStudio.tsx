import { useState, useMemo, useRef, useEffect } from 'react'
import {
  BarChart3, LineChart, PieChart, TrendingUp, Database, Upload,
  Download, Play, Settings, Plus, Trash2, Copy,
  Lightbulb, RefreshCw, Palette, LayoutGrid, Table, Layers,
  Sliders, Share2, Info
} from 'lucide-react'

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'heatmap'

interface DataPoint {
  [key: string]: string | number
}

interface ChartConfig {
  id: string
  title: string
  type: ChartType
  xField: string
  yFields: string[]
  data: DataPoint[]
  palette: string
  showLegend: boolean
  showGrid: boolean
  smooth: boolean
  animation: boolean
  stacked: boolean
}

const PALETTES = {
  corporate: ['#2563eb', '#0ea5e9', '#06b6d4', '#0891b2', '#0e7490'],
  sunset: ['#f59e0b', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6'],
  nature: ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b'],
  ocean: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1'],
  berry: ['#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#d946ef'],
  mono: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
}

const SAMPLE_DATASETS = {
  sales: {
    name: '季度销售数据 (示例)',
    description: '2023-2024 年产品线季度营收（万元）',
    data: [
      { quarter: '2023 Q1', 产品A: 128, 产品B: 92, 产品C: 65, 合计: 285 },
      { quarter: '2023 Q2', 产品A: 156, 产品B: 110, 产品C: 78, 合计: 344 },
      { quarter: '2023 Q3', 产品A: 142, 产品B: 135, 产品C: 92, 合计: 369 },
      { quarter: '2023 Q4', 产品A: 198, 产品B: 168, 产品C: 110, 合计: 476 },
      { quarter: '2024 Q1', 产品A: 225, 产品B: 182, 产品C: 135, 合计: 542 },
      { quarter: '2024 Q2', 产品A: 268, 产品B: 210, 产品C: 158, 合计: 636 },
    ]
  },
  population: {
    name: '城市人口分布 (示例)',
    description: '一线及新一线城市常住人口（万人）',
    data: [
      { 城市: '重庆', 常住人口: 3212, 户籍人口: 3405, 城镇化率: 71 },
      { 城市: '上海', 常住人口: 2475, 户籍人口: 1467, 城镇化率: 94 },
      { 城市: '北京', 常住人口: 2189, 户籍人口: 1413, 城镇化率: 88 },
      { 城市: '成都', 常住人口: 2119, 户籍人口: 1557, 城镇化率: 79 },
      { 城市: '广州', 常住人口: 1873, 户籍人口: 1011, 城镇化率: 86 },
      { 城市: '深圳', 常住人口: 1756, 户籍人口: 556, 城镇化率: 100 },
      { 城市: '武汉', 常住人口: 1373, 户籍人口: 947, 城镇化率: 84 },
      { 城市: '杭州', 常住人口: 1237, 户籍人口: 848, 城镇化率: 83 },
    ]
  },
  traffic: {
    name: '网站 24 小时流量 (示例)',
    description: '工作日 24 小时 PV/UV/跳出率数据',
    data: Array.from({ length: 24 }, (_, h) => ({
      时间: `${String(h).padStart(2, '0')}:00`,
      PV: Math.round(500 + Math.sin((h - 8) * Math.PI / 12) * 3500 + Math.random() * 400 + (h >= 9 && h <= 20 ? 2000 : 0)),
      UV: Math.round(150 + Math.sin((h - 8) * Math.PI / 12) * 1000 + Math.random() * 120 + (h >= 9 && h <= 20 ? 600 : 0)),
      跳出率: +(40 + Math.sin(h / 4) * 18 + Math.random() * 10).toFixed(1)
    }))
  },
  budget: {
    name: '月度预算分配 (示例)',
    description: '各部门月度预算占比',
    data: [
      { 部门: '研发部', 金额: 85, 占比: 34 },
      { 部门: '市场部', 金额: 42, 占比: 17 },
      { 部门: '销售部', 金额: 38, 占比: 15 },
      { 部门: '运营部', 金额: 32, 占比: 13 },
      { 部门: '行政部', 金额: 22, 占比: 9 },
      { 部门: '人力资源', 金额: 18, 占比: 7 },
      { 部门: '财务', 金额: 12, 占比: 5 },
    ]
  }
}

const CHART_TYPES: { id: ChartType; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'bar', name: '柱状图', icon: <BarChart3 size={18} />, desc: '比较类别间数值' },
  { id: 'line', name: '折线图', icon: <LineChart size={18} />, desc: '趋势变化分析' },
  { id: 'area', name: '面积图', icon: <TrendingUp size={18} />, desc: '总量 + 构成趋势' },
  { id: 'pie', name: '饼图', icon: <PieChart size={18} />, desc: '占比关系分析' },
  { id: 'doughnut', name: '环形图', icon: <PieChart size={18} />, desc: '环形占比（更现代）' },
  { id: 'scatter', name: '散点图', icon: <LayoutGrid size={18} />, desc: '两个变量相关性' },
  { id: 'radar', name: '雷达图', icon: <Layers size={18} />, desc: '多维度综合对比' },
  { id: 'heatmap', name: '热力图', icon: <Palette size={18} />, desc: '二维矩阵热度' },
]

const uid = () => Math.random().toString(36).slice(2, 9)
const DEFAULT_CHART = (): ChartConfig => ({
  id: uid(),
  title: '新建图表',
  type: 'bar',
  xField: '',
  yFields: [],
  data: SAMPLE_DATASETS.sales.data,
  palette: 'corporate',
  showLegend: true,
  showGrid: true,
  smooth: true,
  animation: true,
  stacked: false
})

export default function DataVizStudio() {
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    const c1 = DEFAULT_CHART()
    c1.title = '产品季度销售趋势'
    c1.xField = 'quarter'
    c1.yFields = ['产品A', '产品B', '产品C']
    c1.type = 'bar'
    const c2 = DEFAULT_CHART()
    c2.title = '网站 24 小时 PV / UV'
    c2.type = 'area'
    c2.data = SAMPLE_DATASETS.traffic.data
    c2.xField = '时间'
    c2.yFields = ['PV', 'UV']
    c2.palette = 'ocean'
    return [c1, c2]
  })
  const [activeId, setActiveId] = useState<string>(charts[0].id)
  const [tab, setTab] = useState<'charts' | 'data' | 'insights'>('charts')
  const [rawText, setRawText] = useState(JSON.stringify(SAMPLE_DATASETS.sales.data, null, 2))
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const active = charts.find(c => c.id === activeId) || charts[0]
  const fields = useMemo(() => active && active.data.length ? Object.keys(active.data[0]) : [], [active])
  const paletteColors = PALETTES[active.palette as keyof typeof PALETTES] || PALETTES.corporate

  const updateActive = (patch: Partial<ChartConfig>) => {
    setCharts(cs => cs.map(c => c.id === active.id ? { ...c, ...patch } : c))
  }

  const addChart = () => {
    const nc = DEFAULT_CHART()
    setCharts(cs => [...cs, nc])
    setActiveId(nc.id)
  }
  const removeActive = () => {
    if (charts.length <= 1) return
    const idx = charts.findIndex(c => c.id === active.id)
    const next = charts[(idx + 1) % charts.length]
    setCharts(cs => cs.filter(c => c.id !== active.id))
    setActiveId(next.id)
  }
  const cloneActive = () => {
    const nc: ChartConfig = { ...JSON.parse(JSON.stringify(active)), id: uid(), title: active.title + '（副本）' }
    setCharts(cs => [...cs, nc])
    setActiveId(nc.id)
  }

  const loadDataset = (key: keyof typeof SAMPLE_DATASETS) => {
    const ds = SAMPLE_DATASETS[key]
    setRawText(JSON.stringify(ds.data, null, 2))
    updateActive({ data: ds.data, title: ds.name })
  }

  const applyTextData = () => {
    try {
      const parsed = JSON.parse(rawText)
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        updateActive({ data: parsed })
        alert(`数据已应用，共 ${parsed.length} 行`)
      } else {
        alert('数据格式错误：必须是对象数组')
      }
    } catch (e) {
      alert('JSON 解析失败：' + (e as Error).message)
    }
  }

  const importFile = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const txt = String(reader.result)
      if (f.name.endsWith('.json')) {
        setRawText(txt)
        try { applyTextData() } catch {/* noop */}
      } else if (f.name.endsWith('.csv')) {
        const lines = txt.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) return alert('CSV 至少需要表头 + 1 行数据')
        const headers = lines[0].split(',').map(h => h.trim())
        const rows = lines.slice(1).map(line => {
          const cells = line.split(',')
          const obj: Record<string, string | number> = {}
          headers.forEach((h, i) => {
            const val = (cells[i] || '').trim()
            const num = Number(val)
            obj[h] = (!isNaN(num) && val !== '' ? num : val) as string | number
          })
          return obj
        })
        setRawText(JSON.stringify(rows, null, 2))
        updateActive({ data: rows })
      }
    }
    reader.readAsText(f)
  }

  const exportData = (fmt: 'json' | 'csv') => {
    let content = '', mime = '', ext = ''
    if (fmt === 'json') {
      content = JSON.stringify(active.data, null, 2)
      mime = 'application/json'
      ext = 'json'
    } else {
      const heads = Object.keys(active.data[0] || {})
      content = heads.join(',') + '\n' + active.data.map(r => heads.map(h => String(r[h])).join(',')).join('\n')
      mime = 'text/csv'
      ext = 'csv'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dataviz-${active.title}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyChartSVG = () => {
    const svgEl = document.querySelector(`[data-chart-id="${active.id}"]`) as HTMLElement | null
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    navigator.clipboard?.writeText(svgStr).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  // Auto-select fields
  useEffect(() => {
    if (!active.xField && fields.length >= 2) {
      updateActive({
        xField: fields[0],
        yFields: fields.slice(1, 3)
      })
    }
  }, [fields.length])

  // ============== Statistics & Insights ==============
  const stats = useMemo(() => {
    const yf = active.yFields[0]
    if (!yf) return null
    const nums = active.data.map(d => Number(d[yf])).filter(n => !isNaN(n))
    if (!nums.length) return null
    const total = nums.reduce((a, b) => a + b, 0)
    const mean = total / nums.length
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    const sorted = [...nums].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const variance = nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length
    const std = +Math.sqrt(variance).toFixed(2)
    // Trend (simple linear regression slope)
    const n = nums.length
    const xs = Array.from({ length: n }, (_, i) => i)
    const xMean = xs.reduce((a, b) => a + b, 0) / n
    const num = xs.reduce((s, x, i) => s + (x - xMean) * (nums[i] - mean), 0)
    const den = xs.reduce((s, x) => s + Math.pow(x - xMean, 2), 0)
    const slope = den ? +(num / den).toFixed(4) : 0
    const trendText = slope > 0.5 ? '📈 明显上升趋势' : slope > 0.05 ? '↗ 缓慢上升' : slope < -0.5 ? '📉 明显下降趋势' : slope < -0.05 ? '↘ 缓慢下降' : '→ 基本平稳'
    return {
      total: +total.toFixed(2),
      mean: +mean.toFixed(2),
      min, max, median,
      std,
      count: nums.length,
      cv: +(std / mean * 100).toFixed(1),
      slope,
      trendText,
      maxIdx: nums.indexOf(max),
      minIdx: nums.indexOf(min)
    }
  }, [active.yFields, active.data])

  // ============== SVG Chart Renders ==============
  const renderChart = () => {
    const W = 720, H = 420
    const PAD = { top: 48, right: 24, bottom: 56, left: 56 }
    const iw = W - PAD.left - PAD.right
    const ih = H - PAD.top - PAD.bottom
    const data = active.data
    if (!data.length || !active.xField || !active.yFields.length) {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: '#666' }}>
          <Info size={18} className="mr-2" />请选择 X 轴字段和至少一个 Y 轴数据列
        </div>
      )
    }
    const xs = data.map(d => String(d[active.xField]))
    const yf = active.yFields
    const numRows = data.length

    // For pie/doughnut: use first y field
    if (active.type === 'pie' || active.type === 'doughnut') {
      const field = yf[0] || fields[1]
      const nums = data.map(d => Number(d[field]) || 0)
      const sum = Math.max(1, nums.reduce((a, b) => a + b, 0))
      const cx = W / 2, cy = H / 2
      const R = Math.min(iw, ih) / 2 - 20
      const rInner = active.type === 'doughnut' ? R * 0.55 : 0
      let accA = -Math.PI / 2
      const segs = nums.map((v, i) => {
        const a0 = accA
        const a1 = accA + (v / sum) * Math.PI * 2
        accA = a1
        const pct = (v / sum * 100).toFixed(1)
        const col = paletteColors[i % paletteColors.length]
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
        const xi0 = cx + rInner * Math.cos(a0), yi0 = cy + rInner * Math.sin(a0)
        const xi1 = cx + rInner * Math.cos(a1), yi1 = cy + rInner * Math.sin(a1)
        const large = a1 - a0 > Math.PI ? 1 : 0
        // outer arc, line to outer->inner end, inner arc reverse, line to outer start
        const d = active.type === 'doughnut'
          ? `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${rInner},${rInner} 0 ${large} 0 ${xi0},${yi0} Z`
          : `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`
        const labelA = (a0 + a1) / 2
        const lx = cx + (R * 0.68) * Math.cos(labelA)
        const ly = cy + (R * 0.68) * Math.sin(labelA)
        return { d, col, pct, lx, ly, label: xs[i], value: v }
      })
      const centerLabel = active.type === 'doughnut'
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">{active.title}</text>
          {segs.map((s, i) => (
            <path key={i} d={s.d} fill={s.col} opacity={0.92} stroke="#fff" strokeWidth={1.5}
              style={{ animation: active.animation ? 'dvfade 0.5s ease-out' : undefined, animationDelay: `${i * 30}ms` }}>
              <title>{s.label}: {s.value} ({s.pct}%)</title>
            </path>
          ))}
          {centerLabel && (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight="800" fill="#1f2937">{Math.round(nums.reduce((a, b) => a + b, 0))}</text>
              <text x={cx} y={cy + 18} textAnchor="middle" fontSize={12} fill="#6b7280">{field}</text>
            </>
          )}
          {/* Legend */}
          {active.showLegend && (
            <g transform={`translate(${PAD.left}, ${H - 24})`}>
              {segs.map((s, i) => {
                const perCol = Math.ceil(segs.length / 3)
                const col = Math.floor(i / perCol)
                const row = i % perCol
                const lx = col * 180
                const ly = row * 16
                return (
                  <g key={i} transform={`translate(${lx}, ${ly})`}>
                    <rect width="10" height="10" rx="2" fill={s.col} />
                    <text x={16} y={10} fontSize="11" fill="#4b5563">{s.label} · {s.pct}%</text>
                  </g>
                )
              })}
            </g>
          )}
        </svg>
      )
    }

    if (active.type === 'radar') {
      const n = numRows
      const dims = yf
      if (dims.length < 3) return <div className="p-6 text-sm text-gray-500">雷达图需要至少 3 个 Y 轴字段</div>
      const cx = W / 2, cy = H / 2
      const R = Math.min(iw, ih) / 2 - 30
      const axes = dims.length
      // Normalize each dim separately
      const normalized = dims.map(dim => {
        const nums = data.map(d => Number(d[dim]) || 0)
        const mx = Math.max(...nums, 1)
        return nums.map(v => v / mx)
      })
      const points = (r: number, angleOff = 0) => Array.from({ length: axes }, (_, a) => {
        const ang = angleOff + a * Math.PI * 2 / axes - Math.PI / 2
        return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]
      })
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">{active.title}</text>
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <polygon key={r} points={points(r * R).map(p => p.join(',')).join(' ')}
              fill="none" stroke="#e5e7eb" strokeWidth={1} />
          ))}
          {/* Axes */}
          {Array.from({ length: axes }, (_, a) => {
            const ang = a * Math.PI * 2 / axes - Math.PI / 2
            return <line key={a} x1={cx} y1={cy} x2={cx + R * Math.cos(ang)} y2={cy + R * Math.sin(ang)} stroke="#e5e7eb" />
          })}
          {/* Data series (one per row, each series spans dims) */}
          {Array.from({ length: n }, (_, i) => {
            const d = normalized.map(norm => norm[i])
            const poly = d.map((v, a) => {
              const ang = a * Math.PI * 2 / axes - Math.PI / 2
              return [cx + v * R * Math.cos(ang), cy + v * R * Math.sin(ang)].join(',')
            }).join(' ')
            const col = paletteColors[i % paletteColors.length]
            return (
              <g key={i}>
                <polygon points={poly} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={2}
                  style={{ animation: active.animation ? 'dvfade 0.6s ease-out' : undefined }} />
              </g>
            )
          })}
          {/* Axis labels */}
          {dims.map((dim, a) => {
            const ang = a * Math.PI * 2 / axes - Math.PI / 2
            const lx = cx + (R + 16) * Math.cos(ang)
            const ly = cy + (R + 16) * Math.sin(ang)
            return <text key={a} x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight={600}>{dim}</text>
          })}
          {active.showLegend && (
            <g transform={`translate(${PAD.left}, 12)`}>
              {xs.map((lb, i) => (
                <g key={i} transform={`translate(${(i % 4) * 160}, ${Math.floor(i / 4) * 14})`}>
                  <rect width="8" height="8" y="3" rx="2" fill={paletteColors[i % paletteColors.length]} />
                  <text x={14} y={11} fontSize="10.5" fill="#4b5563">{lb}</text>
                </g>
              ))}
            </g>
          )}
        </svg>
      )
    }

    if (active.type === 'scatter') {
      const [fx, fy] = yf
      if (!fy) return <div className="p-6 text-sm text-gray-500">散点图需要选择 2 个 Y 轴字段（分别为 X、Y 方向）</div>
      const nx = data.map(d => Number(d[fx]) || 0)
      const ny = data.map(d => Number(d[fy]) || 0)
      const [minX, maxX] = [Math.min(...nx), Math.max(...nx)]
      const [minY, maxY] = [Math.min(...ny), Math.max(...ny)]
      const sx = (v: number) => PAD.left + ((v - minX) / (maxX - minX || 1)) * iw
      const sy = (v: number) => PAD.top + ih - ((v - minY) / (maxY - minY || 1)) * ih
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">{active.title}</text>
          {/* Grid */}
          {active.showGrid && (
            <g opacity={0.25}>
              {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <g key={r}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + r * ih} y2={PAD.top + r * ih} stroke="#94a3b8" strokeDasharray="3,3" />
                  <line x1={PAD.left + r * iw} x2={PAD.left + r * iw} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeDasharray="3,3" />
                </g>
              ))}
            </g>
          )}
          {data.map((_d, i) => (
            <circle key={i} cx={sx(nx[i])} cy={sy(ny[i])} r={6}
              fill={paletteColors[i % paletteColors.length]} fillOpacity={0.75} stroke="#fff" strokeWidth={1.5}
              style={{ animation: active.animation ? 'dvpop 0.4s ease-out' : undefined, animationDelay: `${i * 10}ms` }}>
              <title>{xs[i]}: {fx}={nx[i]}, {fy}={ny[i]}</title>
            </circle>
          ))}
          {/* Axes */}
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#94a3b8" />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#94a3b8" />
          <text x={W / 2} y={H - 20} textAnchor="middle" fontSize="12" fill="#4b5563" fontWeight={600}>{fx}</text>
          <text x={14} y={H / 2} textAnchor="middle" fontSize="12" fill="#4b5563" fontWeight={600}
            transform={`rotate(-90, 14, ${H / 2})`}>{fy}</text>
          <text x={PAD.left} y={H - PAD.bottom + 18} fontSize="10" fill="#6b7280">{minX}</text>
          <text x={W - PAD.right} y={H - PAD.bottom + 18} fontSize="10" fill="#6b7280" textAnchor="end">{maxX}</text>
          <text x={PAD.left - 8} y={PAD.top + 4} fontSize="10" fill="#6b7280" textAnchor="end">{maxY}</text>
          <text x={PAD.left - 8} y={H - PAD.bottom + 4} fontSize="10" fill="#6b7280" textAnchor="end">{minY}</text>
        </svg>
      )
    }

    // Standard: bar / line / area
    const numsAll: number[] = []
    yf.forEach(f => data.forEach(d => { const n = Number(d[f]); if (!isNaN(n)) numsAll.push(n) }))
    const maxV = Math.max(...numsAll, 1)
    const yMax = maxV * 1.1
    const barX = PAD.left
    const barW = iw / numRows
    const nSeries = yf.length

    return (
      <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
        <style>{`@keyframes dvfade{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}@keyframes dvpop{from{r:0}to{r:6}}`}</style>
        <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1f2937">{active.title}</text>
        {/* Grid */}
        {active.showGrid && (
          <g opacity={0.2}>
            {[0, 0.25, 0.5, 0.75, 1].map(r => {
              const y = PAD.top + ih * (1 - r)
              const val = Math.round(yMax * r)
              return (
                <g key={r}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#94a3b8" strokeDasharray="3,3" />
                  <text x={PAD.left - 6} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{val}</text>
                </g>
              )
            })}
          </g>
        )}

        {/* Area first (background) */}
        {(active.type === 'area' || active.type === 'line') && yf.map((f, si) => {
          const pts = data.map((d, i) => {
            const n = Number(d[f]) || 0
            const x = barX + i * barW + barW / 2
            const y = PAD.top + ih - (n / yMax) * ih
            return [x, y] as const
          })
          const col = paletteColors[si % paletteColors.length]
          if (active.type === 'area') {
            const pathD = `M${pts[0][0]},${PAD.top + ih} ` +
              pts.map(p => `L${p[0]},${p[1]}`).join(' ') +
              ` L${pts[pts.length - 1][0]},${PAD.top + ih} Z`
            // Gradient
            const gid = `g-${active.id}-${si}`
            return (
              <g key={f}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={col} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={col} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <path d={pathD} fill={`url(#${gid})`}
                  style={{ animation: active.animation ? 'dvfade 0.6s ease-out' : undefined }} />
                <path d={`M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map(p => (active.smooth ? curveTo(pts, p, pts.indexOf(p)) : `L${p[0]},${p[1]}`)).join(' ')}
                  fill="none" stroke={col} strokeWidth={2.5} strokeLinecap="round" />
              </g>
            )
          } else {
            return (
              <path key={f}
                d={`M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p, i) => (active.smooth ? curveTo(pts, p, i + 1) : `L${p[0]},${p[1]}`)).join(' ')}
                fill="none" stroke={col} strokeWidth={2.5} strokeLinecap="round"
                style={{ animation: active.animation ? 'dvfade 0.6s ease-out' : undefined }} />
            )
          }
        })}

        {/* Bars */}
        {active.type === 'bar' && data.map((d, i) => {
          const vals = yf.map(f => Number(d[f]) || 0)
          if (active.stacked) {
            let acc = 0
            return (
              <g key={i}>
                {vals.map((v, si) => {
                  const col = paletteColors[si % paletteColors.length]
                  const h = (v / yMax) * ih
                  const x = barX + i * barW + barW * 0.12
                  const w = barW * 0.76
                  const y = PAD.top + ih - (acc + v) / yMax * ih
                  acc += v
                  return <rect key={si} x={x} y={y} width={w} height={h} fill={col} rx={2}
                    style={{ animation: active.animation ? 'dvfade 0.4s ease-out' : undefined, animationDelay: `${(i * nSeries + si) * 15}ms`, transformOrigin: `${x + w / 2}px ${y + h}px` }}>
                    <title>{yf[si]}: {v}</title>
                  </rect>
                })}
              </g>
            )
          } else {
            const groupW = barW * 0.8
            const eachW = groupW / nSeries - 2
            return (
              <g key={i}>
                {vals.map((v, si) => {
                  const col = paletteColors[si % paletteColors.length]
                  const h = (v / yMax) * ih
                  const x = barX + i * barW + barW * 0.1 + si * (eachW + 2)
                  const y = PAD.top + ih - h
                  return <rect key={si} x={x} y={y} width={eachW} height={h} fill={col} rx={2}
                    style={{ animation: active.animation ? 'dvfade 0.4s ease-out' : undefined, animationDelay: `${(i * nSeries + si) * 15}ms` }}>
                    <title>{yf[si]}: {v}</title>
                  </rect>
                })}
              </g>
            )
          }
        })}

        {/* Points on line/area */}
        {(active.type === 'line' || active.type === 'area') && yf.map((f, si) =>
          data.map((d, i) => {
            const n = Number(d[f]) || 0
            const x = barX + i * barW + barW / 2
            const y = PAD.top + ih - (n / yMax) * ih
            return <circle key={`${f}-${i}`} cx={x} cy={y} r={3.5}
              fill={paletteColors[si % paletteColors.length]} stroke="#fff" strokeWidth={1.5}>
              <title>{xs[i]} · {f}: {n}</title>
            </circle>
          })
        )}

        {/* X labels */}
        {xs.map((lb, i) => (
          <text key={i} x={barX + i * barW + barW / 2} y={H - PAD.bottom + 18}
            fontSize="11" fill="#64748b" textAnchor="middle"
            transform={xs.length > 8 ? `rotate(-25, ${barX + i * barW + barW / 2}, ${H - PAD.bottom + 18})` : undefined}
            style={xs.length > 8 ? { fontSize: 10 } : undefined}>
            {lb.length > 10 ? lb.slice(0, 10) + '…' : lb}
          </text>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#94a3b8" />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#94a3b8" />

        {/* Legend */}
        {active.showLegend && (
          <g transform={`translate(${PAD.left + 10}, 12)`}>
            {yf.map((f, i) => (
              <g key={f} transform={`translate(${i * 140}, 0)`}>
                <rect width="10" height="10" rx="2" fill={paletteColors[i % paletteColors.length]} />
                <text x={16} y={10} fontSize="11" fill="#334155" fontWeight={500}>{f}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    )
  }

  function curveTo(pts: readonly (readonly [number, number])[], p: readonly [number, number], i: number) {
    if (i === 0) return `L${p[0]},${p[1]}`
    const prev = pts[i - 1]
    const cx1 = prev[0] + (p[0] - prev[0]) / 2
    return `C${cx1},${prev[1]} ${cx1},${p[1]} ${p[0]},${p[1]}`
  }

  return (
    <div className="h-full w-full flex flex-col" style={{
      background: 'linear-gradient(135deg, #0a0f1f 0%, #0f1628 50%, #0f1a30 100%)',
      color: '#e8eaf0'
    }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(56,189,248,0.18)', background: 'rgba(14,165,233,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            <BarChart3 size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight flex items-center gap-2">
              DataViz Studio · 数据可视化工坊
              <Lightbulb size={16} style={{ color: '#fbbf24' }} />
            </div>
            <div className="text-xs" style={{ color: '#7a85a0' }}>
              8 种图表 · 内置 4 套示例数据 · CSV/JSON 导入导出 · SVG 矢量复制 · 智能数据洞察
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#a8b0c8', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Upload size={13} /> 导入 CSV / JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden"
            onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} />
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#a8b0c8', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Download size={13} /> 导出 ▾
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
              style={{ background: '#141a2e', border: '1px solid rgba(56,189,248,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              {[
                { fn: () => exportData('json'), label: '导出数据为 JSON', icon: <Database size={13} /> },
                { fn: () => exportData('csv'), label: '导出数据为 CSV', icon: <Table size={13} /> },
                { fn: copyChartSVG, label: copied ? '✓ SVG 已复制' : '复制图表 SVG 代码', icon: <Copy size={13} /> },
              ].map((it, i) => (
                <button key={i} onClick={it.fn} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 transition-all hover:opacity-80"
                  style={{ color: '#c0c8e0' }}>
                  {it.icon} {it.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-2 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(56,189,248,0.1)' }}>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {([
            { k: 'charts', label: '图表工坊', icon: <BarChart3 size={13} /> },
            { k: 'data', label: '数据面板', icon: <Database size={13} /> },
            { k: 'insights', label: '智能洞察', icon: <Lightbulb size={13} /> },
          ] as const).map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className="px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all"
              style={{
                background: tab === t.k ? 'rgba(14,165,233,0.18)' : 'transparent',
                color: tab === t.k ? '#7dd3fc' : '#7a85a0',
                fontWeight: tab === t.k ? 600 : 400
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: '#7a85a0' }}>
          <span>共 {active.data.length} 行 · {fields.length} 列</span>
          <span>·</span>
          <span>已建 {charts.length} 个图表</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0 flex">
        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0 border-r overflow-y-auto"
          style={{ borderColor: 'rgba(56,189,248,0.1)', background: 'rgba(0,0,0,0.15)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'rgba(56,189,248,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#aab4cf' }}>
                <Sliders size={13} /> 我的图表
              </div>
              <button onClick={addChart} className="p-1 rounded transition-all hover:opacity-80"
                style={{ color: '#38bdf8', background: 'rgba(14,165,233,0.1)' }}>
                <Plus size={13} />
              </button>
            </div>
            <div className="space-y-1">
              {charts.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className="w-full text-left px-2.5 py-2 rounded-md text-xs transition-all flex items-center justify-between"
                  style={{
                    background: c.id === active.id ? 'rgba(14,165,233,0.15)' : 'transparent',
                    color: c.id === active.id ? '#e0f2fe' : '#8a96b6',
                    border: c.id === active.id ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                  }}>
                  <span className="flex items-center gap-1.5 truncate">
                    <span style={{ color: c.id === active.id ? '#38bdf8' : '#5b6a8c' }}>
                      {CHART_TYPES.find(ct => ct.id === c.type)?.icon}
                    </span>
                    <span className="truncate">{c.title || '未命名'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* Chart type */}
            <div>
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#7a85a0' }}>
                <BarChart3 size={12} /> 图表类型
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CHART_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => updateActive({ type: ct.id })}
                    className="p-2 rounded-md text-xs flex flex-col items-start text-left transition-all"
                    style={{
                      background: active.type === ct.id ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.02)',
                      color: active.type === ct.id ? '#7dd3fc' : '#8a96b6',
                      border: active.type === ct.id ? '1px solid rgba(14,165,233,0.35)' : '1px solid rgba(255,255,255,0.06)'
                    }}
                    title={ct.desc}>
                    <span style={{ color: active.type === ct.id ? '#38bdf8' : '#5b6a8c' }}>{ct.icon}</span>
                    <span className="mt-1 font-semibold">{ct.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Fields */}
            <div>
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#7a85a0' }}>
                <Settings size={12} /> 标题与字段
              </div>
              <input value={active.title} onChange={e => updateActive({ title: e.target.value })}
                placeholder="图表标题" className="w-full mb-2 px-2.5 py-1.5 rounded-md text-xs outline-none"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(56,189,248,0.15)', color: '#e8eaf0' }} />
              <label className="text-[10.5px] block mb-1" style={{ color: '#6c7896' }}>X 轴 / 分类字段</label>
              <select value={active.xField} onChange={e => updateActive({ xField: e.target.value })}
                className="w-full px-2 py-1.5 rounded-md text-xs outline-none mb-2"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(56,189,248,0.15)', color: '#e8eaf0' }}>
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <label className="text-[10.5px] block mb-1" style={{ color: '#6c7896' }}>
                Y 轴 / 数值字段 {active.type === 'scatter' ? '（选2个）' : '（可多选）'}
              </label>
              <div className="max-h-28 overflow-y-auto space-y-1 rounded-md p-1.5" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(56,189,248,0.1)' }}>
                {fields.filter(f => f !== active.xField).map(f => {
                  const checked = active.yFields.includes(f)
                  return (
                    <label key={f} className="flex items-center gap-2 text-[11.5px] py-0.5 px-1 rounded cursor-pointer transition-all hover:opacity-80"
                      style={{ color: checked ? '#cbd5e1' : '#6c7896', background: checked ? 'rgba(14,165,233,0.08)' : 'transparent' }}>
                      <input type="checkbox" checked={checked}
                        onChange={e => {
                          if (active.type === 'scatter') {
                            updateActive({ yFields: e.target.checked ? [f, ...active.yFields].slice(0, 2) : active.yFields.filter(y => y !== f) })
                          } else {
                            updateActive({ yFields: e.target.checked ? [...active.yFields, f] : active.yFields.filter(y => y !== f) })
                          }
                        }} />
                      {f}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Palette */}
            <div>
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#7a85a0' }}>
                <Palette size={12} /> 配色方案
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(PALETTES).map(([k, cols]) => (
                  <button key={k} onClick={() => updateActive({ palette: k })}
                    className="flex flex-col items-center p-1.5 rounded-md transition-all"
                    style={{
                      border: active.palette === k ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: active.palette === k ? 'rgba(14,165,233,0.1)' : 'rgba(0,0,0,0.2)'
                    }}>
                    <div className="h-4 w-full rounded-sm flex overflow-hidden">
                      {cols.slice(0, 5).map((c, i) => <div key={i} style={{ background: c, width: '20%' }} />)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: active.palette === k ? '#7dd3fc' : '#6c7896' }}>
                      {({ corporate: '商务', sunset: '日落', nature: '自然', ocean: '海洋', berry: '浆果', mono: '黑白' } as any)[k]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div>
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#7a85a0' }}>
                <Settings size={12} /> 显示选项
              </div>
              <div className="space-y-1.5">
                {[
                  { k: 'showLegend', label: '显示图例' },
                  { k: 'showGrid', label: '显示网格' },
                  { k: 'smooth', label: '平滑曲线（折线/面积）' },
                  { k: 'animation', label: '启用动画' },
                  { k: 'stacked', label: '堆叠显示（柱状图）' },
                ].map(t => (
                  <label key={t.k} className="flex items-center justify-between text-xs py-1 px-2 rounded cursor-pointer transition-all hover:opacity-80"
                    style={{ color: '#aab4cf', background: 'rgba(0,0,0,0.15)' }}>
                    <span>{t.label}</span>
                    <input type="checkbox" checked={(active as any)[t.k]}
                      onChange={e => updateActive({ [t.k]: e.target.checked } as Partial<ChartConfig>)} />
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 grid grid-cols-2 gap-1.5">
              <button onClick={cloneActive} className="py-1.5 text-[11px] rounded-md flex items-center justify-center gap-1 transition-all hover:opacity-80"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#7dd3fc' }}>
                <Copy size={12} /> 复制
              </button>
              <button onClick={removeActive} disabled={charts.length <= 1}
                className="py-1.5 text-[11px] rounded-md flex items-center justify-center gap-1 transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                <Trash2 size={12} /> 删除
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {tab === 'charts' && (
            <div className="flex-1 overflow-auto p-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
              <div className="max-w-[900px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                <div className="aspect-[720/420]">{renderChart()}</div>
                {/* Stats strip */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-px" style={{ background: '#e2e8f0' }}>
                    {[
                      { label: '总计', v: stats.total, icon: '∑', color: '#2563eb' },
                      { label: '均值', v: stats.mean, icon: 'μ', color: '#0891b2' },
                      { label: '中位数', v: stats.median, icon: 'M̃', color: '#059669' },
                      { label: '最高/最低', v: `${stats.max} / ${stats.min}`, icon: '↕', color: '#d97706' },
                      { label: '标准差 (CV)', v: `${stats.std} (${stats.cv}%)`, icon: 'σ', color: '#7c3aed' },
                      { label: '趋势', v: stats.trendText.slice(2), icon: stats.trendText.split(' ')[0], color: '#dc2626' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white px-3 py-3">
                        <div className="flex items-center gap-1.5 mb-1" style={{ color: '#64748b', fontSize: 10 }}>
                          <span style={{ color: s.color, fontWeight: 700 }}>{s.icon}</span> {s.label}
                        </div>
                        <div style={{ color: '#0f172a', fontSize: 13, fontWeight: 700, wordBreak: 'break-all' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2"
                style={{ borderColor: 'rgba(56,189,248,0.1)', background: 'rgba(0,0,0,0.15)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{ color: '#7a85a0' }}>快速加载示例数据：</span>
                  {(Object.keys(SAMPLE_DATASETS) as (keyof typeof SAMPLE_DATASETS)[]).map(k => (
                    <button key={k} onClick={() => loadDataset(k)} className="px-3 py-1 rounded-full text-[11px] transition-all hover:opacity-80"
                      style={{ background: 'rgba(14,165,233,0.1)', color: '#7dd3fc', border: '1px solid rgba(14,165,233,0.2)' }}>
                      <RefreshCw size={10} className="inline mr-1" />
                      {SAMPLE_DATASETS[k].name.split(' (')[0]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={applyTextData} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff' }}>
                    <Play size={11} className="inline mr-1" />应用到当前图表
                  </button>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-px" style={{ background: '#1a2238' }}>
                {/* JSON editor */}
                <div className="flex flex-col overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2" style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc' }}>
                    <Settings size={12} /> JSON 编辑器
                    <span style={{ color: '#5b6a8c', fontWeight: 400 }} className="ml-auto">{rawText.length.toLocaleString()} 字符</span>
                  </div>
                  <textarea value={rawText} onChange={e => setRawText(e.target.value)} spellCheck={false}
                    className="flex-1 w-full resize-none outline-none font-mono text-[11.5px] p-4 leading-relaxed"
                    style={{
                      background: '#0a0f1f',
                      color: '#93c5fd',
                      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                      caretColor: '#38bdf8'
                    }} />
                </div>
                {/* Data table preview */}
                <div className="flex flex-col overflow-hidden">
                  <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2" style={{ background: 'rgba(5,150,105,0.1)', color: '#6ee7b7' }}>
                    <Table size={12} /> 数据预览
                    <span style={{ color: '#5b6a8c', fontWeight: 400 }} className="ml-auto">
                      {active.data.length} 行 × {fields.length} 列
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto" style={{ background: '#0a0f1f' }}>
                    <table className="w-full text-[11.5px]" style={{ borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th className="px-3 py-2 text-left" style={{ background: '#111a30', color: '#64748b', borderBottom: '1px solid #1e293b', fontWeight: 600 }}>#</th>
                          {fields.map(f => (
                            <th key={f} className="px-3 py-2 text-left" style={{ background: '#111a30', color: f === active.xField ? '#38bdf8' : (active.yFields.includes(f) ? '#34d399' : '#64748b'), borderBottom: '1px solid #1e293b', fontWeight: 600 }}>
                              {f === active.xField && <span className="mr-1">[X]</span>}
                              {active.yFields.includes(f) && <span className="mr-1">[Y]</span>}
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {active.data.slice(0, 50).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td className="px-3 py-1.5" style={{ color: '#475569' }}>{i + 1}</td>
                            {fields.map(f => (
                              <td key={f} className="px-3 py-1.5"
                                style={{
                                  color: typeof row[f] === 'number' ? '#fbbf24' : '#cbd5e1',
                                  fontFamily: typeof row[f] === 'number' ? 'ui-monospace, monospace' : 'inherit'
                                }}>
                                {String(row[f])}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {active.data.length > 50 && (
                          <tr>
                            <td colSpan={fields.length + 1} className="px-3 py-2 text-center" style={{ color: '#5b6a8c', fontSize: 11 }}>
                              ... 仅显示前 50 行，共 {active.data.length} 行
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'insights' && (
            <div className="flex-1 overflow-auto p-6">
              {stats ? (() => {
                const xs = active.data.map(r => String(r[active.xField]))
                return (
                <div className="max-w-4xl mx-auto space-y-5">
                  <div className="rounded-xl p-5 border" style={{
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))',
                    borderColor: 'rgba(56,189,248,0.25)'
                  }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                        <Lightbulb size={22} style={{ color: '#fff' }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-bold mb-1.5" style={{ color: '#fde68a' }}>
                          AI 智能洞察 · 针对字段「{active.yFields[0]}」
                        </div>
                        <div className="text-sm leading-relaxed space-y-2" style={{ color: '#cbd5e1' }}>
                          <p>• 整体{stats.trendText.split(' ').slice(1).join(' ')}，趋势斜率为 <span style={{ color: '#93c5fd', fontFamily: 'monospace' }}>{stats.slope}</span>（每步变化幅度）</p>
                          <p>• 数据离散程度 <b>CV = {stats.cv}%</b>：{stats.cv < 10 ? '非常稳定，波动很小' : stats.cv < 25 ? '波动在可接受范围' : stats.cv < 50 ? '波动较大，需关注异常点' : '离散度极高，建议按时间/分组深入分析'}</p>
                          <p>• 最大值出现在第 <b>{stats.maxIdx + 1}</b> 个数据点「<span style={{ color: '#34d399' }}>{xs[stats.maxIdx]}</span>」，值为 <b style={{ color: '#fbbf24' }}>{stats.max}</b></p>
                          <p>• 最小值出现在第 <b>{stats.minIdx + 1}</b> 个数据点「<span style={{ color: '#34d399' }}>{xs[stats.minIdx]}</span>」，值为 <b style={{ color: '#f87171' }}>{stats.min}</b></p>
                          <p>• 极差（Max/Min） = <b>{stats.max} / {stats.min} ≈ {(stats.max / Math.max(stats.min, 0.0001)).toFixed(2)} 倍</b>，峰值与谷值差异{stats.max / Math.max(stats.min, 0.0001) > 3 ? '非常显著' : '适中'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: '样本数', v: stats.count, sub: '数据点', color: '#38bdf8', icon: 'Σ' },
                      { label: '总和', v: stats.total.toLocaleString(), sub: '累计值', color: '#22c55e', icon: '+' },
                      { label: '平均值', v: stats.mean.toLocaleString(), sub: 'Mean = ' + stats.mean, color: '#a78bfa', icon: 'μ' },
                      { label: '中位数', v: stats.median, sub: '比均值' + (stats.median > stats.mean ? '高' : '低') + Math.abs(+(stats.median - stats.mean).toFixed(2)), color: '#f59e0b', icon: 'M̃' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl p-4 border" style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.06)'
                      }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs" style={{ color: '#7a85a0' }}>{s.label}</span>
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: s.color + '25', color: s.color }}>{s.icon}</span>
                        </div>
                        <div className="text-xl font-bold mb-1" style={{ color: '#f8fafc' }}>{s.v}</div>
                        <div className="text-[10.5px]" style={{ color: '#64748b' }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#f8fafc' }}>
                        <TrendingUp size={15} style={{ color: '#34d399' }} /> 极值排行 Top 5
                      </div>
                      <div className="space-y-2">
                        {[...active.data]
                          .map((d, i) => ({ v: Number(d[active.yFields[0]]), lbl: xs[i], i }))
                          .sort((a, b) => b.v - a.v)
                          .slice(0, 5)
                          .map((item, rank) => (
                            <div key={rank} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
                                style={{
                                  background: rank === 0 ? '#fbbf24' : rank === 1 ? '#9ca3af' : rank === 2 ? '#b45309' : 'rgba(255,255,255,0.06)',
                                  color: rank < 3 ? '#fff' : '#9ca3af'
                                }}>{rank + 1}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs truncate" style={{ color: '#cbd5e1' }}>{item.lbl}</span>
                                  <span className="text-xs font-mono" style={{ color: '#fbbf24' }}>{item.v}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                  <div className="h-full rounded-full"
                                    style={{
                                      width: `${(item.v / (stats.max || 1)) * 100}%`,
                                      background: `linear-gradient(90deg, ${paletteColors[0]}, ${paletteColors[1] || paletteColors[0]})`
                                    }} />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#f8fafc' }}>
                        <Share2 size={15} style={{ color: '#a78bfa' }} /> 分布分析（Z-Score 检测）
                      </div>
                      <div className="space-y-2 text-xs" style={{ color: '#cbd5e1' }}>
                        {(() => {
                          const f = active.yFields[0]
                          const vals = active.data.map(d => Number(d[f]) || 0)
                          const m = vals.reduce((a, b) => a + b, 0) / vals.length
                          const sd = Math.sqrt(vals.reduce((s, n) => s + Math.pow(n - m, 2), 0) / vals.length) || 1
                          return vals.map((v, i) => {
                            const z = +((v - m) / sd).toFixed(2)
                            const abnormal = Math.abs(z) > 2
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-24 truncate" style={{ color: '#94a3b8' }}>{xs[i]}</span>
                                <span className="font-mono w-16 text-right" style={{ color: '#fbbf24' }}>{v}</span>
                                <span className={`font-mono w-16 text-right ${abnormal ? 'font-bold' : ''}`} style={{
                                  color: z > 2 ? '#f87171' : z < -2 ? '#60a5fa' : '#64748b'
                                }}>z = {z}</span>
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                  <div className="h-full"
                                    style={{
                                      width: `${Math.min(100, Math.abs(z) * 20)}%`,
                                      marginLeft: z >= 0 ? '50%' : `${Math.max(0, 50 - Math.abs(z) * 20)}%`,
                                      background: abnormal ? (z > 0 ? '#ef4444' : '#3b82f6') : '#64748b'
                                    }} />
                                </div>
                                <span className="w-14 text-right" style={{ color: '#475569' }}>
                                  {abnormal ? (z > 0 ? '⬆偏高' : '⬇偏低') : ''}
                                </span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )})() : (
                <div className="h-full flex items-center justify-center text-sm" style={{ color: '#64748b' }}>
                  请先选择一个数值字段（Y 轴）以获得洞察建议
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
