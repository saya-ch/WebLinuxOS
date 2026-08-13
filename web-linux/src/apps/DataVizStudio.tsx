import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  BarChart3, LineChart, PieChart, TrendingUp, Database, Upload,
  Download, Play, Settings, Plus, Trash2, Copy,
  Lightbulb, RefreshCw, Palette, LayoutGrid, Table, Layers,
  Sliders, Info, Image as ImageIcon, FileJson, FileSpreadsheet,
  BarChart2, Grid3X3, Gauge, Maximize2, Minimize2, Eye, EyeOff,
  ChevronDown, Type, DollarSign, Percent, Hash
} from 'lucide-react'

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'progress' | 'heatmap'
type FormatType = 'none' | 'currency' | 'percent' | 'decimal'
type ThemeMode = 'dark' | 'light'

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
  formatType: FormatType
  formatDecimals: number
  formatCurrency: string
}

const PALETTES: Record<string, string[]> = {
  corporate: ['#2563eb', '#0ea5e9', '#06b6d4', '#0891b2', '#0e7490'],
  sunset: ['#f59e0b', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6'],
  nature: ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b'],
  ocean: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1'],
  berry: ['#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#d946ef'],
  mono: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  vibrant: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
  pastel: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
}

const PALETTE_NAMES: Record<string, string> = {
  corporate: '商务', sunset: '日落', nature: '自然', ocean: '海洋',
  berry: '浆果', mono: '黑白', vibrant: '活力', pastel: '柔和'
}

const SAMPLE_DATASETS: Record<string, { name: string; description: string; data: DataPoint[] }> = {
  sales: {
    name: '季度销售数据',
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
    name: '城市人口分布',
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
    name: '网站24小时流量',
    description: '工作日 24 小时 PV/UV/跳出率数据',
    data: Array.from({ length: 24 }, (_, h) => ({
      时间: `${String(h).padStart(2, '0')}:00`,
      PV: Math.round(500 + Math.sin((h - 8) * Math.PI / 12) * 3500 + Math.random() * 400 + (h >= 9 && h <= 20 ? 2000 : 0)),
      UV: Math.round(150 + Math.sin((h - 8) * Math.PI / 12) * 1000 + Math.random() * 120 + (h >= 9 && h <= 20 ? 600 : 0)),
      跳出率: +(40 + Math.sin(h / 4) * 18 + Math.random() * 10).toFixed(1)
    }))
  },
  budget: {
    name: '月度预算分配',
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
  },
  progress: {
    name: '项目进度跟踪',
    description: '各阶段完成进度百分比',
    data: [
      { 阶段: '需求分析', 进度: 100, 计划: 100 },
      { 阶段: '设计开发', 进度: 85, 计划: 80 },
      { 阶段: '编码实现', 进度: 62, 计划: 65 },
      { 阶段: '测试联调', 进度: 40, 计划: 50 },
      { 阶段: '部署上线', 进度: 15, 计划: 20 },
      { 阶段: '运维监控', 进度: 5, 计划: 10 },
    ]
  },
  heatmap: {
    name: '一周活跃度热力图',
    description: '一周内每小时活跃度矩阵',
    data: (() => {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const result: DataPoint[] = []
      days.forEach((d, di) => {
        for (let h = 0; h < 24; h++) {
          let base = Math.sin((h - 8) * Math.PI / 12) * 50 + 50
          if (h < 6 || h > 22) base *= 0.2
          if (di >= 5) base *= 0.6
          const val = Math.max(0, Math.round(base + Math.random() * 20))
          result.push({ 日期: d, 小时: `${String(h).padStart(2, '0')}:00`, 活跃度: val })
        }
      })
      return result
    })()
  }
}

const CHART_TYPES: { id: ChartType; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'bar', name: '柱状图', icon: <BarChart3 size={18} />, desc: '比较类别间数值' },
  { id: 'line', name: '折线图', icon: <LineChart size={18} />, desc: '趋势变化分析' },
  { id: 'area', name: '面积图', icon: <TrendingUp size={18} />, desc: '总量+构成趋势' },
  { id: 'pie', name: '饼图', icon: <PieChart size={18} />, desc: '占比关系分析' },
  { id: 'doughnut', name: '环形图', icon: <PieChart size={18} />, desc: '环形占比（更现代）' },
  { id: 'scatter', name: '散点图', icon: <LayoutGrid size={18} />, desc: '两个变量相关性' },
  { id: 'radar', name: '雷达图', icon: <Layers size={18} />, desc: '多维度综合对比' },
  { id: 'progress', name: '进度条', icon: <Gauge size={18} />, desc: '目标完成进度' },
  { id: 'heatmap', name: '热力图', icon: <Grid3X3 size={18} />, desc: '二维矩阵热度' },
]

const FORMAT_TYPES: { id: FormatType; label: string; icon: React.ReactNode }[] = [
  { id: 'none', label: '无格式', icon: <Hash size={13} /> },
  { id: 'currency', label: '货币', icon: <DollarSign size={13} /> },
  { id: 'percent', label: '百分比', icon: <Percent size={13} /> },
  { id: 'decimal', label: '小数', icon: <Type size={13} /> },
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩', HKD: 'HK$'
}

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
  stacked: false,
  formatType: 'none',
  formatDecimals: 1,
  formatCurrency: 'CNY',
})

function formatValue(v: number, cfg: ChartConfig): string {
  if (isNaN(v)) return String(v)
  const dec = cfg.formatDecimals
  switch (cfg.formatType) {
    case 'currency': {
      const sym = CURRENCY_SYMBOLS[cfg.formatCurrency] || '¥'
      return `${sym}${v.toLocaleString('zh-CN', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
    }
    case 'percent': return `${(v * 100).toFixed(dec)}%`
    case 'decimal': return v.toFixed(dec)
    default: return v.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
  }
}

function curveTo(pts: readonly (readonly [number, number])[], p: readonly [number, number], i: number): string {
  if (i === 0) return `L${p[0]},${p[1]}`
  const prev = pts[i - 1]
  const cx1 = prev[0] + (p[0] - prev[0]) / 2
  return `C${cx1},${prev[1]} ${cx1},${p[1]} ${p[0]},${p[1]}`
}

interface ThemeColors {
  bg: string
  panel: string
  text: string
  textSecondary: string
  border: string
  accent: string
  chartBg: string
  chartText: string
  gridLine: string
  axisLine: string
}

const THEMES: Record<ThemeMode, ThemeColors> = {
  dark: {
    bg: 'linear-gradient(135deg, #0a0f1f 0%, #0f1628 50%, #0f1a30 100%)',
    panel: 'rgba(14,165,233,0.06)',
    text: '#e8eaf0',
    textSecondary: '#7a85a0',
    border: 'rgba(56,189,248,0.18)',
    accent: '#0ea5e9',
    chartBg: '#ffffff',
    chartText: '#1f2937',
    gridLine: '#94a3b8',
    axisLine: '#94a3b8',
  },
  light: {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    panel: 'rgba(14,165,233,0.04)',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(14,165,233,0.15)',
    accent: '#0ea5e9',
    chartBg: '#ffffff',
    chartText: '#1f2937',
    gridLine: '#94a3b8',
    axisLine: '#94a3b8',
  },
}

interface TooltipState {
  x: number
  y: number
  content: string
  visible: boolean
}

export default function DataVizStudio() {
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    const c1 = DEFAULT_CHART()
    c1.title = '产品季度销售趋势'
    c1.xField = 'quarter'
    c1.yFields = ['产品A', '产品B', '产品C']
    c1.type = 'bar'
    const c2 = DEFAULT_CHART()
    c2.title = '网站24小时PV/UV'
    c2.type = 'area'
    c2.data = SAMPLE_DATASETS.traffic.data
    c2.xField = '时间'
    c2.yFields = ['PV', 'UV']
    c2.palette = 'ocean'
    const c3 = DEFAULT_CHART()
    c3.title = '项目阶段进度'
    c3.type = 'progress'
    c3.data = SAMPLE_DATASETS.progress.data
    c3.xField = '阶段'
    c3.yFields = ['进度', '计划']
    c3.palette = 'vibrant'
    const c4 = DEFAULT_CHART()
    c4.title = '一周活跃度热力图'
    c4.type = 'heatmap'
    c4.data = SAMPLE_DATASETS.heatmap.data
    c4.xField = '小时'
    c4.yFields = ['活跃度']
    c4.palette = 'sunset'
    return [c1, c2, c3, c4]
  })
  const [activeId, setActiveId] = useState<string>(charts[0].id)
  const [tab, setTab] = useState<'charts' | 'data' | 'insights'>('charts')
  const [rawText, setRawText] = useState(JSON.stringify(SAMPLE_DATASETS.sales.data, null, 2))
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [fullscreen, setFullscreen] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, content: '', visible: false })
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const active = charts.find(c => c.id === activeId) || charts[0]
  const fields = useMemo(() => active && active.data.length ? Object.keys(active.data[0]) : [], [active])
  const paletteColors = PALETTES[active.palette] || PALETTES.corporate
  const tc = THEMES[theme]

  const updateActive = useCallback((patch: Partial<ChartConfig>) => {
    setCharts(cs => cs.map(c => c.id === active.id ? { ...c, ...patch } : c))
  }, [active.id])

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

  const loadDataset = (key: string) => {
    const ds = SAMPLE_DATASETS[key]
    if (!ds) return
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
    } catch {
      alert('JSON 解析失败：请检查格式')
    }
  }

  const importFile = (f: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const txt = String(reader.result)
      if (f.name.endsWith('.json')) {
        setRawText(txt)
        try {
          const parsed = JSON.parse(txt)
          if (Array.isArray(parsed)) updateActive({ data: parsed })
        } catch {
          alert('JSON 解析失败')
        }
      } else if (f.name.endsWith('.csv') || f.name.endsWith('.tsv')) {
        const sep = f.name.endsWith('.tsv') ? '\t' : ','
        const lines = txt.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) return alert('至少需要表头+1行数据')
        const headers = lines[0].split(sep).map(h => h.trim())
        const rows = lines.slice(1).map(line => {
          const cells = line.split(sep)
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
    if (!active.data.length) return
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

  const exportPNG = () => {
    const svgEl = document.querySelector(`[data-chart-id="${active.id}"]`) as HTMLElement | null
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const rect = svgEl.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
      canvas.toBlob(blob => {
        if (!blob) return
        const dlUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = dlUrl
        a.download = `dataviz-${active.title}.png`
        a.click()
        URL.revokeObjectURL(dlUrl)
      })
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const exportSVG = () => {
    const svgEl = document.querySelector(`[data-chart-id="${active.id}"]`) as HTMLElement | null
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dataviz-${active.title}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copySVG = () => {
    const svgEl = document.querySelector(`[data-chart-id="${active.id}"]`) as HTMLElement | null
    if (!svgEl) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    navigator.clipboard?.writeText(svgStr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  useEffect(() => {
    if (!active.xField && fields.length >= 2) {
      updateActive({
        xField: fields[0],
        yFields: fields.slice(1, Math.min(3, fields.length))
      })
    }
  }, [fields.length])

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
    const n = nums.length
    const xs = Array.from({ length: n }, (_, i) => i)
    const xMean = xs.reduce((a, b) => a + b, 0) / n
    const num = xs.reduce((s, x, i) => s + (x - xMean) * (nums[i] - mean), 0)
    const den = xs.reduce((s, x) => s + Math.pow(x - xMean, 2), 0)
    const slope = den ? +(num / den).toFixed(4) : 0
    const trendText = slope > 0.5 ? '明显上升趋势' : slope > 0.05 ? '缓慢上升' : slope < -0.5 ? '明显下降趋势' : slope < -0.05 ? '缓慢下降' : '基本平稳'
    return {
      total: +total.toFixed(2), mean: +mean.toFixed(2), min, max, median, std,
      count: nums.length, cv: +(std / (mean || 1) * 100).toFixed(1),
      slope, trendText, maxIdx: nums.indexOf(max), minIdx: nums.indexOf(min)
    }
  }, [active.yFields, active.data])

  const showTooltip = (e: React.MouseEvent, content: string) => {
    const rect = chartContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 10,
      content,
      visible: true
    })
  }

  const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }))

  const renderChart = () => {
    const W = 720, H = 420
    const PAD = { top: 48, right: 24, bottom: 56, left: 56 }
    const iw = W - PAD.left - PAD.right
    const ih = H - PAD.top - PAD.bottom
    const data = active.data
    const yf = active.yFields

    if (!data.length || !active.xField || !yf.length) {
      return (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
          <Info size={18} style={{ marginRight: 8 }} />
          请选择 X 轴字段和至少一个 Y 轴数据列
        </div>
      )
    }

    const xs = data.map(d => String(d[active.xField]))
    const numRows = data.length

    const commonTitle = active.title
    const titleColor = tc.chartText
    const legendColor = '#4b5563'
    const gridColor = tc.gridLine
    const axisColor = tc.axisLine

    // ============ Progress Bars ============
    if (active.type === 'progress') {
      const vals = data.map(d => Number(d[yf[0]]) || 0)
      const maxV = Math.max(...vals, 100)
      const barH = Math.min(32, (ih - (numRows - 1) * 12) / numRows)
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
          {data.map((_d, i) => {
            const v = vals[i]
            const pct = Math.min(100, (v / maxV) * 100)
            const y = PAD.top + 12 + i * (barH + 12)
            const labelX = PAD.left
            const barX = labelX + 110
            const barMaxW = iw - 110
            const fillW = (pct / 100) * barMaxW
            const col = paletteColors[i % paletteColors.length]
            const displayVal = formatValue(v, active)
            return (
              <g key={i}
                onMouseMove={(e) => showTooltip(e, `${xs[i]}: ${displayVal} (${pct.toFixed(1)}%)`)}
                onMouseLeave={hideTooltip}>
                <text x={labelX} y={y + barH / 2 + 4} fontSize="12" fill={titleColor} fontWeight={500}>{xs[i]}</text>
                <rect x={barX} y={y} width={barMaxW} height={barH} rx={barH / 2} fill="#e5e7eb" opacity={0.5} />
                <rect x={barX} y={y} width={Math.max(2, fillW)} height={barH} rx={barH / 2} fill={col}
                  style={{
                    animation: active.animation ? 'dvbar 0.8s ease-out forwards' : undefined,
                    transformOrigin: `${barX}px ${y + barH / 2}px`,
                    transform: active.animation ? undefined : 'none'
                  }}>
                  <title>{xs[i]}: {displayVal}</title>
                </rect>
                <text x={barX + fillW + 6} y={y + barH / 2 + 4} fontSize="11" fill={titleColor} fontWeight={600}>{displayVal}</text>
              </g>
            )
          })}
          {active.showLegend && (
            <g transform={`translate(${PAD.left}, ${H - 16})`}>
              <text fontSize="10.5" fill={legendColor}>共 {numRows} 项 · 最大值 {formatValue(maxV, active)}</text>
            </g>
          )}
        </svg>
      )
    }

    // ============ Heatmap ============
    if (active.type === 'heatmap') {
      const xField = active.xField
      const yField = yf[0]
      const xVals = [...new Set(data.map(d => String(d[xField])))].sort()
      const yFields2 = fields.filter(f => f !== xField && f !== yField)
      let yCategories: string[] = []
      let yFieldName = yFields2[0] || ''
      if (yFieldName) {
        yCategories = [...new Set(data.map(d => String(d[yFieldName])))].sort()
      } else {
        yCategories = ['']
      }
      const cellW = Math.max(8, Math.min(40, (iw / xVals.length) - 2))
      const cellH = Math.max(8, Math.min(40, (ih / Math.max(yCategories.length, 1)) - 2))
      const maxVal = Math.max(...data.map(d => Number(d[yField]) || 0), 1)
      const legendW = 180
      const mapW = iw - legendW - 10
      const cellW2 = Math.max(8, (mapW / xVals.length) - 2)

      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
          {yCategories.length > 1 ? (
            <>
              {yCategories.map((cat, yi) => (
                <text key={`y-${cat}`} x={PAD.left - 8} y={PAD.top + yi * (cellH + 2) + cellH / 2 + 4}
                  fontSize="10" fill={titleColor} textAnchor="end">{cat}</text>
              ))}
              {xVals.map((xv, xi) => {
                const col = xi % xVals.length
                return (
                  <text key={`x-${xv}`} x={PAD.left + col * (cellW2 + 2) + cellW2 / 2}
                    y={H - PAD.bottom + 14}
                    fontSize="9" fill={titleColor} textAnchor="middle"
                    transform={`rotate(-35, ${PAD.left + col * (cellW2 + 2) + cellW2 / 2}, ${H - PAD.bottom + 14})`}>
                    {xv}
                  </text>
                )
              })}
              {data.map((d, i) => {
                const xv = String(d[xField])
                const cat = String(d[yFieldName])
                const xi = xVals.indexOf(xv)
                const yi = yCategories.indexOf(cat)
                if (xi < 0 || yi < 0) return null
                const raw = Number(d[yField]) || 0
                const intensity = raw / maxVal
                const baseCol = paletteColors[0]
                const r = parseInt(baseCol.slice(1, 3), 16)
                const g = parseInt(baseCol.slice(3, 5), 16)
                const b = parseInt(baseCol.slice(5, 7), 16)
                const fill = `rgba(${r},${g},${b},${0.1 + intensity * 0.9})`
                const x = PAD.left + xi * (cellW2 + 2)
                const y = PAD.top + yi * (cellH + 2)
                return (
                  <rect key={i} x={x} y={y} width={cellW2} height={cellH} rx={2}
                    fill={intensity > 0.5 ? baseCol : fill}
                    stroke={intensity > 0.7 ? '#fff' : 'transparent'} strokeWidth={0.5}
                    style={{ animation: active.animation ? 'dvfade 0.5s ease-out' : undefined }}
                    onMouseMove={(e) => showTooltip(e, `${cat} · ${xv}: ${formatValue(raw, active)}`)}
                    onMouseLeave={hideTooltip}>
                    <title>{cat} · {xv}: {formatValue(raw, active)}</title>
                  </rect>
                )
              })}
              <g transform={`translate(${W - legendW - 10}, ${PAD.top})`}>
                <text fontSize="10" fill={titleColor} textAnchor="middle">低值</text>
                <defs>
                  <linearGradient id="heat-legend" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor={paletteColors[0]} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={paletteColors[0]} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <rect x={0} y={12} width={12} height={ih - 30} fill="url(#heat-legend)" rx={3} />
                <text x={30} y={22} fontSize="10" fill={titleColor}>{formatValue(maxVal, active)}</text>
                <text x={30} y={ih - 18} fontSize="10" fill={titleColor}>0</text>
              </g>
            </>
          ) : (
            <>
              {data.map((d, i) => {
                const xv = String(d[xField])
                const xi = xVals.indexOf(xv)
                const raw = Number(d[yField]) || 0
                const intensity = raw / maxVal
                const baseCol = paletteColors[Math.floor(intensity * (paletteColors.length - 1))]
                const x = PAD.left + xi * (cellW + 2)
                const y = PAD.top + 12
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={cellW} height={ih - 30} rx={3}
                      fill={baseCol} opacity={0.3 + intensity * 0.7}
                      style={{ animation: active.animation ? 'dvfade 0.5s ease-out' : undefined }}
                      onMouseMove={(e) => showTooltip(e, `${xv}: ${formatValue(raw, active)}`)}
                      onMouseLeave={hideTooltip}>
                      <title>{xv}: {formatValue(raw, active)}</title>
                    </rect>
                    <text x={x + cellW / 2} y={y + ih - 18} fontSize="9" fill={titleColor} textAnchor="middle">{xv}</text>
                  </g>
                )
              })}
            </>
          )}
        </svg>
      )
    }

    // ============ Pie / Doughnut ============
    if (active.type === 'pie' || active.type === 'doughnut') {
      const field = yf[0]
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
        const d = active.type === 'doughnut'
          ? `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${rInner},${rInner} 0 ${large} 0 ${xi0},${yi0} Z`
          : `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`
        return { d, col, pct, label: xs[i], value: v, cx, cy, R, a0, a1 }
      })
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <style>{`@keyframes dvfade{from{opacity:0}to{opacity:1}}@keyframes dvbar{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
          {segs.map((s, i) => (
            <path key={i} d={s.d} fill={s.col} opacity={0.92} stroke="#fff" strokeWidth={1.5}
              style={{ animation: active.animation ? 'dvfade 0.5s ease-out' : undefined, animationDelay: `${i * 30}ms` }}
              onMouseMove={(e) => showTooltip(e, `${s.label}: ${formatValue(s.value, active)} (${s.pct}%)`)}
              onMouseLeave={hideTooltip}>
              <title>{s.label}: {formatValue(s.value, active)} ({s.pct}%)</title>
            </path>
          ))}
          {active.type === 'doughnut' && (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight="800" fill={titleColor}>{Math.round(nums.reduce((a, b) => a + b, 0))}</text>
              <text x={cx} y={cy + 18} textAnchor="middle" fontSize={12} fill="#6b7280">{field}</text>
            </>
          )}
          {active.showLegend && (
            <g transform={`translate(${PAD.left}, ${H - 24})`}>
              {segs.map((s, i) => {
                const perCol = Math.ceil(segs.length / 3)
                const col = Math.floor(i / perCol)
                const row = i % perCol
                return (
                  <g key={i} transform={`translate(${col * 180}, ${row * 16})`}>
                    <rect width="10" height="10" rx={2} fill={s.col} />
                    <text x={16} y={10} fontSize="11" fill={legendColor}>{s.label} · {s.pct}%</text>
                  </g>
                )
              })}
            </g>
          )}
        </svg>
      )
    }

    // ============ Radar ============
    if (active.type === 'radar') {
      const dims = yf
      if (dims.length < 3) return <div style={{ padding: 24, fontSize: 13, color: '#64748b' }}>雷达图需要至少 3 个 Y 轴字段</div>
      const cx = W / 2, cy = H / 2
      const R = Math.min(iw, ih) / 2 - 30
      const axes = dims.length
      const normalized = dims.map(dim => {
        const nums = data.map(d => Number(d[dim]) || 0)
        const mx = Math.max(...nums, 1)
        return nums.map(v => v / mx)
      })
      const points = (r: number) => Array.from({ length: axes }, (_, a) => {
        const ang = a * Math.PI * 2 / axes - Math.PI / 2
        return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)]
      })
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
          {[0.25, 0.5, 0.75, 1].map(r => (
            <polygon key={r} points={points(r * R).map(p => p.join(',')).join(' ')}
              fill="none" stroke="#e5e7eb" strokeWidth={1} />
          ))}
          {Array.from({ length: axes }, (_, a) => {
            const ang = a * Math.PI * 2 / axes - Math.PI / 2
            return <line key={a} x1={cx} y1={cy} x2={cx + R * Math.cos(ang)} y2={cy + R * Math.sin(ang)} stroke="#e5e7eb" />
          })}
          {Array.from({ length: numRows }, (_, i) => {
            const d = normalized.map(norm => norm[i])
            const poly = d.map((v, a) => {
              const ang = a * Math.PI * 2 / axes - Math.PI / 2
              return [cx + v * R * Math.cos(ang), cy + v * R * Math.sin(ang)].join(',')
            }).join(' ')
            const col = paletteColors[i % paletteColors.length]
            return (
              <g key={i}>
                <polygon points={poly} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={2}
                  style={{ animation: active.animation ? 'dvfade 0.6s ease-out' : undefined }}
                  onMouseMove={(e) => showTooltip(e, `${xs[i]}: ${yf.map((f, _fi) => `${f}=${formatValue(Number(data[i][f]) || 0, active)}`).join(', ')}`)}
                  onMouseLeave={hideTooltip} />
              </g>
            )
          })}
          {dims.map((dim, a) => {
            const ang = a * Math.PI * 2 / axes - Math.PI / 2
            const lx = cx + (R + 16) * Math.cos(ang)
            const ly = cy + (R + 16) * Math.sin(ang)
            return <text key={a} x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill={titleColor} fontWeight={600}>{dim}</text>
          })}
          {active.showLegend && (
            <g transform={`translate(${PAD.left}, 12)`}>
              {xs.map((lb, i) => (
                <g key={i} transform={`translate(${(i % 4) * 160}, ${Math.floor(i / 4) * 14})`}>
                  <rect width="8" height="8" y="3" rx="2" fill={paletteColors[i % paletteColors.length]} />
                  <text x={14} y={11} fontSize="10.5" fill={legendColor}>{lb}</text>
                </g>
              ))}
            </g>
          )}
        </svg>
      )
    }

    // ============ Scatter ============
    if (active.type === 'scatter') {
      const [fx, fy] = yf
      if (!fy) return <div style={{ padding: 24, fontSize: 13, color: '#64748b' }}>散点图需要选择 2 个 Y 轴字段（分别为 X、Y 方向）</div>
      const nx = data.map(d => Number(d[fx]) || 0)
      const ny = data.map(d => Number(d[fy]) || 0)
      const [minX, maxX] = [Math.min(...nx), Math.max(...nx)]
      const [minY, maxY] = [Math.min(...ny), Math.max(...ny)]
      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1
      const sx = (v: number) => PAD.left + ((v - minX) / rangeX) * iw
      const sy = (v: number) => PAD.top + ih - ((v - minY) / rangeY) * ih
      return (
        <svg data-chart-id={active.id} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit' }}>
          <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
          {active.showGrid && (
            <g opacity={0.25}>
              {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <g key={r}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + r * ih} y2={PAD.top + r * ih} stroke={gridColor} strokeDasharray="3,3" />
                  <line x1={PAD.left + r * iw} x2={PAD.left + r * iw} y1={PAD.top} y2={H - PAD.bottom} stroke={gridColor} strokeDasharray="3,3" />
                </g>
              ))}
            </g>
          )}
          {data.map((_d, i) => (
            <circle key={i} cx={sx(nx[i])} cy={sy(ny[i])} r={6}
              fill={paletteColors[i % paletteColors.length]} fillOpacity={0.75} stroke="#fff" strokeWidth={1.5}
              style={{ animation: active.animation ? 'dvpop 0.4s ease-out' : undefined, animationDelay: `${i * 10}ms` }}
              onMouseMove={(e) => showTooltip(e, `${xs[i]}: ${fx}=${formatValue(nx[i], active)}, ${fy}=${formatValue(ny[i], active)}`)}
              onMouseLeave={hideTooltip}>
              <title>{xs[i]}: {fx}={nx[i]}, {fy}={ny[i]}</title>
            </circle>
          ))}
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke={axisColor} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke={axisColor} />
          <text x={W / 2} y={H - 20} textAnchor="middle" fontSize="12" fill={titleColor} fontWeight={600}>{fx}</text>
          <text x={14} y={H / 2} textAnchor="middle" fontSize="12" fill={titleColor} fontWeight={600}
            transform={`rotate(-90, 14, ${H / 2})`}>{fy}</text>
          <text x={PAD.left} y={H - PAD.bottom + 18} fontSize="10" fill={legendColor}>{formatValue(minX, active)}</text>
          <text x={W - PAD.right} y={H - PAD.bottom + 18} fontSize="10" fill={legendColor} textAnchor="end">{formatValue(maxX, active)}</text>
          <text x={PAD.left - 8} y={PAD.top + 4} fontSize="10" fill={legendColor} textAnchor="end">{formatValue(maxY, active)}</text>
          <text x={PAD.left - 8} y={H - PAD.bottom + 4} fontSize="10" fill={legendColor} textAnchor="end">{formatValue(minY, active)}</text>
        </svg>
      )
    }

    // ============ Bar / Line / Area ============
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
        <text x={W / 2} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>{commonTitle}</text>
        {active.showGrid && (
          <g opacity={0.2}>
            {[0, 0.25, 0.5, 0.75, 1].map(r => {
              const y = PAD.top + ih * (1 - r)
              const val = Math.round(yMax * r)
              return (
                <g key={r}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke={gridColor} strokeDasharray="3,3" />
                  <text x={PAD.left - 6} y={y + 3} fontSize="10" fill={legendColor} textAnchor="end">{formatValue(val, active)}</text>
                </g>
              )
            })}
          </g>
        )}

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
                <path d={`M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p, idx) => (active.smooth ? curveTo(pts, p, idx + 1) : `L${p[0]},${p[1]}`)).join(' ')}
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
                    style={{ animation: active.animation ? 'dvfade 0.4s ease-out' : undefined, animationDelay: `${(i * nSeries + si) * 15}ms`, transformOrigin: `${x + w / 2}px ${y + h}px` }}
                    onMouseMove={(e) => showTooltip(e, `${xs[i]} · ${yf[si]}: ${formatValue(v, active)}`)}
                    onMouseLeave={hideTooltip}>
                    <title>{yf[si]}: {formatValue(v, active)}</title>
                  </rect>
                })}
              </g>
            )
          } else {
            const groupW = barW * 0.8
            const eachW = Math.max(2, groupW / nSeries - 2)
            return (
              <g key={i}>
                {vals.map((v, si) => {
                  const col = paletteColors[si % paletteColors.length]
                  const h = (v / yMax) * ih
                  const x = barX + i * barW + barW * 0.1 + si * (eachW + 2)
                  const y = PAD.top + ih - h
                  return <rect key={si} x={x} y={y} width={eachW} height={h} fill={col} rx={2}
                    style={{ animation: active.animation ? 'dvfade 0.4s ease-out' : undefined, animationDelay: `${(i * nSeries + si) * 15}ms` }}
                    onMouseMove={(e) => showTooltip(e, `${xs[i]} · ${yf[si]}: ${formatValue(v, active)}`)}
                    onMouseLeave={hideTooltip}>
                    <title>{yf[si]}: {formatValue(v, active)}</title>
                  </rect>
                })}
              </g>
            )
          }
        })}

        {(active.type === 'line' || active.type === 'area') && yf.map((f, si) =>
          data.map((d, i) => {
            const n = Number(d[f]) || 0
            const x = barX + i * barW + barW / 2
            const y = PAD.top + ih - (n / yMax) * ih
            return <circle key={`${f}-${i}`} cx={x} cy={y} r={3.5}
              fill={paletteColors[si % paletteColors.length]} stroke="#fff" strokeWidth={1.5}
              onMouseMove={(e) => showTooltip(e, `${xs[i]} · ${f}: ${formatValue(n, active)}`)}
              onMouseLeave={hideTooltip}>
              <title>{xs[i]} · {f}: {formatValue(n, active)}</title>
            </circle>
          })
        )}

        {xs.map((lb, i) => (
          <text key={i} x={barX + i * barW + barW / 2} y={H - PAD.bottom + 18}
            fontSize="11" fill={legendColor} textAnchor="middle"
            transform={xs.length > 8 ? `rotate(-25, ${barX + i * barW + barW / 2}, ${H - PAD.bottom + 18})` : undefined}
            style={xs.length > 8 ? { fontSize: 10 } : undefined}>
            {(lb.length > 10 ? lb.slice(0, 10) + '…' : lb)}
          </text>
        ))}

        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke={axisColor} />
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke={axisColor} />

        {active.showLegend && (
          <g transform={`translate(${PAD.left + 10}, 12)`}>
            {yf.map((f, i) => (
              <g key={f} transform={`translate(${i * 140}, 0)`}>
                <rect width="10" height="10" rx="2" fill={paletteColors[i % paletteColors.length]} />
                <text x={16} y={10} fontSize="11" fill={'#334155'} fontWeight={500}>{f}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    )
  }

  const SIDEBAR_WIDTH = 260

  const sidebarStyle: React.CSSProperties = {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    borderRight: `1px solid ${tc.border}`,
    background: theme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)',
    overflowY: 'auto'
  }

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: tc.bg,
      color: tc.text,
      ...(fullscreen ? { position: 'fixed', inset: 0, zIndex: 9999 } : {})
    } as React.CSSProperties}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${tc.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: tc.panel
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)'
          }}>
            <BarChart3 size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              DataViz Studio · 数据可视化工坊
              <Lightbulb size={16} style={{ color: '#fbbf24' }} />
            </div>
            <div style={{ fontSize: 12, color: tc.textSecondary }}>
              9 种图表 · CSV/JSON 导入导出 · PNG/SVG 导出 · 智能数据洞察 · 深浅色主题
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 12, background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: tc.text, border: `1px solid ${tc.border}`, cursor: 'pointer' }}>
              {theme === 'dark' ? <Eye size={13} /> : <EyeOff size={13} />}
              {theme === 'dark' ? '浅色' : '深色'}
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 12, background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: tc.text, border: `1px solid ${tc.border}`, cursor: 'pointer' }}>
              <Upload size={13} /> 导入
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.tsv,.json" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} />
            <div style={{ position: 'relative' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 12, background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: tc.text, border: `1px solid ${tc.border}`, cursor: 'pointer' }}>
                <Download size={13} /> 导出 <ChevronDown size={11} />
              </button>
              <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 200, borderRadius: 8, padding: 4, zIndex: 50, background: theme === 'dark' ? '#141a2e' : '#ffffff', border: `1px solid ${tc.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.display = 'block' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}>
                {[
                  { fn: exportPNG, label: '导出为 PNG', icon: <ImageIcon size={13} /> },
                  { fn: exportSVG, label: '导出为 SVG', icon: <PieChart size={13} /> },
                  { fn: () => exportData('json'), label: '导出 JSON', icon: <FileJson size={13} /> },
                  { fn: () => exportData('csv'), label: '导出 CSV', icon: <FileSpreadsheet size={13} /> },
                  { fn: copySVG, label: copied ? '✓ SVG 已复制' : '复制 SVG 代码', icon: <Copy size={13} /> },
                ].map((it, i) => (
                  <button key={i} onClick={it.fn}
                    style={{ width: '100%', padding: '8px 12px', fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#c0c8e0' : '#334155', borderRadius: 4 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    {it.icon} {it.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setFullscreen(!fullscreen)}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 6, fontSize: 12, background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: tc.text, border: `1px solid ${tc.border}`, cursor: 'pointer' }}>
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        padding: '8px 20px', borderBottom: `1px solid ${tc.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 8, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }}>
          {([
            { k: 'charts', label: '图表工坊', icon: <BarChart3 size={13} /> },
            { k: 'data', label: '数据面板', icon: <Database size={13} /> },
            { k: 'insights', label: '智能洞察', icon: <Lightbulb size={13} /> },
          ] as const).map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                background: tab === t.k ? (theme === 'dark' ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.12)') : 'transparent',
                color: tab === t.k ? (theme === 'dark' ? '#7dd3fc' : '#0369a1') : tc.textSecondary,
                fontWeight: tab === t.k ? 600 : 400,
                border: 'none', cursor: 'pointer'
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tc.textSecondary }}>
          <span>共 {active.data.length} 行 · {fields.length} 列</span>
          <span>·</span>
          <span>已建 {charts.length} 个图表</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left sidebar */}
        <div style={sidebarStyle}>
          {/* Chart list */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
                <Sliders size={13} /> 我的图表
              </div>
              <button onClick={addChart}
                style={{
                  padding: 4, borderRadius: 4,
                  background: theme === 'dark' ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.12)',
                  color: theme === 'dark' ? '#38bdf8' : '#0284c7',
                  border: 'none', cursor: 'pointer'
                }}>
                <Plus size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {charts.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 6, fontSize: 12, textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: c.id === active.id
                      ? (theme === 'dark' ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.1)')
                      : 'transparent',
                    color: c.id === active.id ? (theme === 'dark' ? '#e0f2fe' : '#0c4a6e') : tc.textSecondary,
                    border: c.id === active.id ? `1px solid ${theme === 'dark' ? 'rgba(14,165,233,0.3)' : 'rgba(14,165,233,0.25)'}` : '1px solid transparent',
                    cursor: 'pointer', width: '100%'
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ color: c.id === active.id ? (theme === 'dark' ? '#38bdf8' : '#0284c7') : '#5b6a8c', flexShrink: 0 }}>
                      {CHART_TYPES.find(ct => ct.id === c.type)?.icon}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '未命名'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart type selector */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
              <BarChart2 size={13} /> 图表类型
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {CHART_TYPES.map(ct => (
                <button key={ct.id} onClick={() => updateActive({ type: ct.id })}
                  title={ct.desc}
                  style={{
                    padding: 8, borderRadius: 6, fontSize: 11,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
                    background: active.type === ct.id
                      ? (theme === 'dark' ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.12)')
                      : (theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'),
                    color: active.type === ct.id ? (theme === 'dark' ? '#7dd3fc' : '#0369a1') : tc.textSecondary,
                    border: active.type === ct.id
                      ? `1px solid ${theme === 'dark' ? 'rgba(14,165,233,0.35)' : 'rgba(14,165,233,0.3)'}`
                      : `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    cursor: 'pointer'
                  }}>
                  <span style={{ color: active.type === ct.id ? (theme === 'dark' ? '#38bdf8' : '#0284c7') : '#5b6a8c' }}>{ct.icon}</span>
                  <span style={{ marginTop: 4, fontWeight: 600 }}>{ct.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title and fields */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
              <Settings size={13} /> 标题与字段
            </div>
            <input value={active.title} onChange={e => updateActive({ title: e.target.value })}
              placeholder="图表标题"
              style={{
                width: '100%', marginBottom: 8, padding: '6px 10px', borderRadius: 6, fontSize: 12,
                outline: 'none', boxSizing: 'border-box',
                background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.15)'}`,
                color: tc.text
              }} />
            <label style={{ fontSize: 10.5, display: 'block', marginBottom: 4, color: tc.textSecondary }}>X 轴 / 分类字段</label>
            <select value={active.xField} onChange={e => updateActive({ xField: e.target.value })}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 12, marginBottom: 8,
                outline: 'none', boxSizing: 'border-box',
                background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.15)'}`,
                color: tc.text
              }}>
              {fields.map(f => <option key={f} value={f} style={{ background: theme === 'dark' ? '#1e293b' : '#fff' }}>{f}</option>)}
            </select>
            <label style={{ fontSize: 10.5, display: 'block', marginBottom: 4, color: tc.textSecondary }}>
              Y 轴 / 数值字段 {active.type === 'scatter' ? '（选2个）' : '（可多选）'}
            </label>
            <div style={{
              maxHeight: 112, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
              padding: 6, borderRadius: 6,
              background: theme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.1)' : 'rgba(14,165,233,0.1)'}`
            }}>
              {fields.filter(f => f !== active.xField).map(f => {
                const checked = active.yFields.includes(f)
                return (
                  <label key={f}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5,
                      padding: '2px 4px', borderRadius: 4, cursor: 'pointer',
                      color: checked ? (theme === 'dark' ? '#cbd5e1' : '#334155') : tc.textSecondary,
                      background: checked ? (theme === 'dark' ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.06)') : 'transparent'
                    }}>
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

          {/* Palette selector */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
              <Palette size={13} /> 配色方案
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Object.entries(PALETTES).map(([k, cols]) => (
                <button key={k} onClick={() => updateActive({ palette: k })}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 6, borderRadius: 6,
                    border: active.palette === k
                      ? `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.5)' : 'rgba(14,165,233,0.5)'}`
                      : `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    background: active.palette === k
                      ? (theme === 'dark' ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.08)')
                      : (theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'),
                    cursor: 'pointer'
                  }}>
                  <div style={{ height: 16, width: '100%', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                    {cols.slice(0, 5).map((c, i) => <div key={i} style={{ background: c, width: '20%' }} />)}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4, color: active.palette === k ? (theme === 'dark' ? '#7dd3fc' : '#0369a1') : tc.textSecondary }}>
                    {PALETTE_NAMES[k]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format options */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
              <Type size={13} /> 数据格式
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {FORMAT_TYPES.map(ft => (
                <button key={ft.id} onClick={() => updateActive({ formatType: ft.id })}
                  style={{
                    flex: 1, padding: '4px 6px', borderRadius: 5, fontSize: 10.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: active.formatType === ft.id
                      ? (theme === 'dark' ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.1)')
                      : (theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'),
                    color: active.formatType === ft.id ? (theme === 'dark' ? '#7dd3fc' : '#0369a1') : tc.textSecondary,
                    border: active.formatType === ft.id
                      ? `1px solid ${theme === 'dark' ? 'rgba(14,165,233,0.3)' : 'rgba(14,165,233,0.25)'}`
                      : `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    cursor: 'pointer'
                  }}>
                  {ft.icon} {ft.label}
                </button>
              ))}
            </div>
            {active.formatType !== 'none' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: tc.textSecondary }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  小数位:
                  <input type="number" min={0} max={4} value={active.formatDecimals}
                    onChange={e => updateActive({ formatDecimals: Math.max(0, Math.min(4, Number(e.target.value) || 0)) })}
                    style={{
                      width: 40, padding: '3px 6px', borderRadius: 4, fontSize: 11,
                      background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.15)'}`,
                      color: tc.text
                    }} />
                </label>
                {active.formatType === 'currency' && (
                  <select value={active.formatCurrency} onChange={e => updateActive({ formatCurrency: e.target.value })}
                    style={{
                      flex: 1, padding: '3px 6px', borderRadius: 4, fontSize: 11,
                      background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.15)'}`,
                      color: tc.text
                    }}>
                    {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c} style={{ background: theme === 'dark' ? '#1e293b' : '#fff' }}>{c} ({CURRENCY_SYMBOLS[c]})</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Display toggles */}
          <div style={{ padding: 12, borderBottom: `1px solid ${tc.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme === 'dark' ? '#aab4cf' : '#475569' }}>
              <Settings size={13} /> 显示选项
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                { k: 'showLegend', label: '显示图例' },
                { k: 'showGrid', label: '显示网格' },
                { k: 'smooth', label: '平滑曲线' },
                { k: 'animation', label: '启用动画' },
                { k: 'stacked', label: '堆叠柱状图' },
              ] as const).map(t => (
                <label key={t.k}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                    color: tc.text,
                    background: theme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)'
                  }}>
                  <span>{t.label}</span>
                  <input type="checkbox" checked={(active as any)[t.k]}
                    onChange={e => updateActive({ [t.k]: e.target.checked } as Partial<ChartConfig>)} />
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button onClick={cloneActive}
              style={{
                padding: '6px 8px', borderRadius: 6, fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: theme === 'dark' ? 'rgba(56,189,248,0.12)' : 'rgba(14,165,233,0.1)',
                color: theme === 'dark' ? '#7dd3fc' : '#0369a1',
                border: 'none', cursor: 'pointer'
              }}>
              <Copy size={12} /> 复制
            </button>
            <button onClick={removeActive} disabled={charts.length <= 1}
              style={{
                padding: '6px 8px', borderRadius: 6, fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: theme === 'dark' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                color: theme === 'dark' ? '#f87171' : '#dc2626',
                border: 'none', cursor: 'pointer', opacity: charts.length <= 1 ? 0.4 : 1
              }}>
              <Trash2 size={12} /> 删除
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Charts tab */}
          {tab === 'charts' && (
            <div style={{
              flex: 1, overflow: 'auto', padding: 24,
              background: theme === 'dark' ? 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
              <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                <div ref={chartContainerRef} style={{ aspectRatio: '720/420', position: 'relative' }}>
                  {renderChart()}
                  {tooltip.visible && (
                    <div style={{
                      position: 'absolute', left: tooltip.x, top: tooltip.y,
                      background: 'rgba(15,23,42,0.92)', color: '#f1f5f9',
                      padding: '6px 10px', borderRadius: 6, fontSize: 11,
                      pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 100,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      transform: 'translateY(-100%)'
                    }}>
                      {tooltip.content}
                    </div>
                  )}
                </div>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: '#e2e8f0' }}>
                    {[
                      { label: '总计', v: stats.total, icon: 'Σ', color: '#2563eb' },
                      { label: '均值', v: stats.mean, icon: 'μ', color: '#0891b2' },
                      { label: '中位数', v: stats.median, icon: 'M̃', color: '#059669' },
                      { label: '最高/最低', v: `${stats.max} / ${stats.min}`, icon: '↕', color: '#d97706' },
                      { label: '标准差 (CV)', v: `${stats.std} (${stats.cv}%)`, icon: 'σ', color: '#7c3aed' },
                      { label: '趋势', v: stats.trendText.slice(2), icon: stats.trendText.split(' ')[0], color: '#dc2626' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#fff', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#64748b', fontSize: 10 }}>
                          <span style={{ color: s.color, fontWeight: 700 }}>{s.icon}</span> {s.label}
                        </div>
                        <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 700, wordBreak: 'break-all' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data tab */}
          {tab === 'data' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                padding: '12px 20px', borderBottom: `1px solid ${tc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                background: tc.panel
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: tc.textSecondary }}>示例数据：</span>
                  {Object.keys(SAMPLE_DATASETS).map(k => (
                    <button key={k} onClick={() => loadDataset(k)}
                      style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 11,
                        background: theme === 'dark' ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.08)',
                        color: theme === 'dark' ? '#7dd3fc' : '#0369a1',
                        border: `1px solid ${theme === 'dark' ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.15)'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}>
                      <RefreshCw size={10} />{SAMPLE_DATASETS[k].name}
                    </button>
                  ))}
                </div>
                <button onClick={applyTextData}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 60,
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}>
                  <Play size={11} /> 应用
                </button>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: theme === 'dark' ? '#1a2238' : '#e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 60, display: 'flex', alignItems: 'center', gap: 8, background: theme === 'dark' ? 'rgba(56,189,248,0.1)' : 'rgba(14,165,233,0.08)', color: theme === 'dark' ? '#7dd3fc' : '#0369a1' }}>
                    <Settings size={12} /> JSON 编辑器
                  </div>
                  <textarea value={rawText} onChange={e => setRawText(e.target.value)} spellCheck={false}
                    style={{ flex: 1, width: '100%', resize: 'none', outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, padding: 16, lineHeight: 1.6, background: theme === 'dark' ? '#0a0f1f' : '#f8fafc', color: theme === 'dark' ? '#93c5fd' : '#1e293b', border: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 60, display: 'flex', alignItems: 'center', gap: 8, background: theme === 'dark' ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.08)', color: theme === 'dark' ? '#6ee7b7' : '#047857' }}>
                    <Table size={12} /> 数据预览 ({active.data.length}行×{fields.length}列)
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', background: theme === 'dark' ? '#0a0f1f' : '#fff' }}>
                    <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', background: theme === 'dark' ? '#111a30' : '#f1f5f9', color: '#64748b', borderBottom: '1px solid #1e293b' }}>#</th>
                          {fields.map(f => (
                            <th key={f} style={{ padding: '8px', textAlign: 'left', background: theme === 'dark' ? '#111a30' : '#f1f5f9', color: f === active.xField ? '#38bdf8' : active.yFields.includes(f) ? '#34d399' : '#64748b', borderBottom: '1px solid #1e293b', fontWeight: 60 }}>
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {active.data.slice(0, 50).map((row, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}` }}>
                            <td style={{ padding: '4px 8px', color: '#475569' }}>{i + 1}</td>
                            {fields.map(f => (
                              <td key={f} style={{ padding: '4px 8px', color: typeof row[f] === 'number' ? (theme === 'dark' ? '#fbbf24' : '#d97706') : (theme === 'dark' ? '#cbd5e1' : '#334155'), fontFamily: typeof row[f] === 'number' ? 'monospace' : 'inherit' }}>
                                {String(row[f])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights tab */}
          {tab === 'insights' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {stats ? (
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{
                    padding: 20, borderRadius: 12, border: `1px solid ${theme === 'dark' ? 'rgba(56,189,248,0.25)' : 'rgba(14,165,233,0.25)'}`,
                    background: theme === 'dark' ? 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))' : 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08))'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                        <Lightbulb size={22} style={{ color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: theme === 'dark' ? '#fde68a' : '#92400e' }}>
                          AI 智能洞察 · 字段「{active.yFields[0]}」
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: tc.text }}>
                          <p>• 整体{stats.trendText}，趋势斜率为 <span style={{ color: '#3b82f6', fontFamily: 'monospace' }}>{stats.slope}</span></p>
                          <p>• 数据离散 CV = {stats.cv}%：{stats.cv < 10 ? '非常稳定' : stats.cv < 25 ? '波动可接受' : stats.cv < 50 ? '波动较大' : '离散度极高'}</p>
                          <p>• 最大值「{active.data[stats.maxIdx]?.[active.xField]}」= {stats.max}，最小值「{active.data[stats.minIdx]?.[active.xField]}」= {stats.min}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: '样本数', v: stats.count, color: '#38bdf8' },
                      { label: '总和', v: stats.total.toLocaleString(), color: '#22c55e' },
                      { label: '平均值', v: stats.mean.toLocaleString(), color: '#a78bfa' },
                      { label: '中位数', v: stats.median, color: '#f59e0b' },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: 16, borderRadius: 12, border: `1px solid ${tc.border}`, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: tc.textSecondary }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: tc.textSecondary }}>
                  请先选择一个数值字段以获得洞察
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}