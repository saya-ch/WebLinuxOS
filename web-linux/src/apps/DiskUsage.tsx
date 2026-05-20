import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface DirStat {
  name: string
  size: number
  fileCount: number
  children: DirStat[]
}

const COLORS = ['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7', '#94e2d5', '#fab387', '#89dceb']

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const computeDirStats = (nodes: FileNode[]): DirStat[] => {
  return nodes.filter((n) => n.type === 'folder').map((folder) => {
    let totalSize = 0
    let fileCount = 0
    const walk = (n: FileNode) => {
      if (n.type === 'file') {
        totalSize += (n.content?.length || 0)
        fileCount++
      }
      if (n.children) n.children.forEach(walk)
    }
    walk(folder)
    return {
      name: folder.name,
      size: totalSize,
      fileCount,
      children: computeDirStats(folder.children || []),
    }
  })
}

const TOTAL_DISK = 256 * 1024 * 1024 * 1024

const drawPieChart = (
  ctx: CanvasRenderingContext2D,
  stats: DirStat[],
  width: number,
  height: number,
  hoverIndex: number
) => {
  ctx.clearRect(0, 0, width, height)
  const total = stats.reduce((sum, s) => sum + s.size, 0)
  if (total === 0) {
    ctx.fillStyle = '#313244'
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1e1e2e'
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 20 - Math.min(width, height) * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6c7086'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('无数据', width / 2, height / 2)
    return
  }

  const cx = width / 2
  const cy = height / 2
  const outerR = Math.min(cx, cy) - 20
  const innerR = outerR * 0.6
  let startAngle = -Math.PI / 2

  stats.forEach((stat, i) => {
    const sliceAngle = (stat.size / total) * Math.PI * 2
    const isHover = i === hoverIndex
    const offset = isHover ? 6 : 0
    const midAngle = startAngle + sliceAngle / 2
    const ox = Math.cos(midAngle) * offset
    const oy = Math.sin(midAngle) * offset

    ctx.beginPath()
    ctx.arc(cx + ox, cy + oy, outerR, startAngle, startAngle + sliceAngle)
    ctx.arc(cx + ox, cy + oy, innerR, startAngle + sliceAngle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    if (isHover) {
      ctx.shadowColor = COLORS[i % COLORS.length]
      ctx.shadowBlur = 12
    }
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    if (sliceAngle > 0.3) {
      const labelR = (outerR + innerR) / 2
      const labelX = cx + ox + Math.cos(midAngle) * labelR
      const labelY = cy + oy + Math.sin(midAngle) * labelR
      ctx.fillStyle = '#1e1e2e'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(stat.name, labelX, labelY)
    }

    startAngle += sliceAngle
  })

  ctx.fillStyle = '#cdd6f4'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(formatSize(total), cx, cy - 8)
  ctx.fillStyle = '#a6adc8'
  ctx.font = '10px sans-serif'
  ctx.fillText('已使用', cx, cy + 10)
}

export default function DiskUsage() {
  const files = useStore((s) => s.files)
  const [hoverIndex, setHoverIndex] = useState(-1)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [hoverDetail, setHoverDetail] = useState<DirStat | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState<DirStat[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const computed = computeDirStats(files)
    setStats(computed)
    const rootExpanded = new Set(computed.map((s) => s.name))
    setExpandedDirs(rootExpanded)
  }, [files])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    drawPieChart(ctx, stats, rect.width, rect.height, hoverIndex)
  }, [stats, hoverIndex])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const outerR = Math.min(cx, cy) - 20
    const innerR = outerR * 0.6
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < innerR || dist > outerR) {
      setHoverIndex(-1)
      setHoverDetail(null)
      return
    }

    let angle = Math.atan2(dy, dx) + Math.PI / 2
    if (angle < 0) angle += Math.PI * 2

    const total = stats.reduce((sum, s) => sum + s.size, 0)
    if (total === 0) return

    let cumAngle = 0
    for (let i = 0; i < stats.length; i++) {
      const sliceAngle = (stats[i].size / total) * Math.PI * 2
      if (angle >= cumAngle && angle < cumAngle + sliceAngle) {
        setHoverIndex(i)
        setHoverDetail(stats[i])
        return
      }
      cumAngle += sliceAngle
    }
    setHoverIndex(-1)
    setHoverDetail(null)
  }, [stats])

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverIndex(-1)
    setHoverDetail(null)
  }, [])

  const startScan = useCallback(() => {
    setScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setScanning(false)
          const computed = computeDirStats(files)
          setStats(computed)
          return 100
        }
        return prev + Math.random() * 8
      })
    }, 60)
  }, [files])

  const totalUsed = stats.reduce((sum, s) => sum + s.size, 0)
  const usedPercent = TOTAL_DISK > 0 ? ((totalUsed / TOTAL_DISK) * 100) : 0
  const available = TOTAL_DISK - totalUsed

  const toggleDir = (name: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const TreeNode = ({ stat, depth, colorIndex }: { stat: DirStat; depth: number; colorIndex: number }) => {
    const hasChildren = stat.children.length > 0
    const expanded = expandedDirs.has(stat.name)
    const color = COLORS[colorIndex % COLORS.length]

    return (
      <div>
        <div
          onMouseEnter={() => setHoverDetail(stat)}
          onMouseLeave={() => setHoverDetail(null)}
          onClick={() => hasChildren && toggleDir(stat.name)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
            paddingLeft: `${16 + depth * 20}px`, cursor: hasChildren ? 'pointer' : 'default',
            borderRadius: '4px', fontSize: '12px',
            background: hoverDetail?.name === stat.name ? '#313244' : 'transparent',
            transition: 'background 0.15s',
          }}
        >
          {hasChildren ? (
            <span style={{ fontSize: '10px', color: '#a6adc8', width: '10px' }}>{expanded ? '▼' : '▶'}</span>
          ) : (
            <span style={{ width: '10px' }} />
          )}
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{stat.name}</span>
          <span style={{ color: '#6c7086', fontSize: '10px', marginRight: '8px' }}>{stat.fileCount} 文件</span>
          <span style={{ color: '#89b4fa', fontSize: '11px' }}>{formatSize(stat.size)}</span>
        </div>
        {expanded && hasChildren && stat.children.map((child, i) => (
          <TreeNode key={child.name} stat={child} depth={depth + 1} colorIndex={colorIndex + i + 1} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>磁盘概览</div>
          <button
            onClick={startScan}
            disabled={scanning}
            style={{
              padding: '6px 14px', background: scanning ? '#45475a' : '#89b4fa', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: scanning ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontWeight: 600,
            }}
          >
            {scanning ? `扫描中 ${Math.min(100, Math.floor(scanProgress))}%` : '重新扫描'}
          </button>
        </div>

        {scanning && (
          <div style={{ background: '#313244', borderRadius: '6px', height: '6px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{
              width: `${Math.min(100, scanProgress)}%`, height: '100%',
              background: 'linear-gradient(90deg, #89b4fa, #a6e3a1)', transition: 'width 0.2s ease',
            }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>总容量</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#89b4fa' }}>{formatSize(TOTAL_DISK)}</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>已使用</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#a6e3a1' }}>{formatSize(totalUsed)}</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>可用</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f38ba8' }}>{formatSize(available)}</div>
          </div>
        </div>
        <div style={{ background: '#313244', borderRadius: '6px', height: '20px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${usedPercent}%`, height: '100%', background: 'linear-gradient(90deg, #a6e3a1, #f9e2af, #fab387, #f38ba8)', transition: 'width 0.5s ease' }} />
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#cdd6f4', fontWeight: 600 }}>
            {usedPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '220px', padding: '12px', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>使用分布</div>
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            style={{ width: '100%', height: '196px', cursor: 'pointer' }}
          />
          {hoverDetail && (
            <div style={{ marginTop: '8px', background: '#313244', borderRadius: '6px', padding: '10px', fontSize: '11px' }}>
              <div style={{ fontWeight: 600, color: '#cdd6f4', marginBottom: '4px' }}>{hoverDetail.name}</div>
              <div style={{ color: '#a6adc8' }}>大小: <span style={{ color: '#89b4fa' }}>{formatSize(hoverDetail.size)}</span></div>
              <div style={{ color: '#a6adc8' }}>文件: <span style={{ color: '#cdd6f4' }}>{hoverDetail.fileCount}</span></div>
              <div style={{ color: '#a6adc8' }}>占比: <span style={{ color: '#a6e3a1' }}>{totalUsed > 0 ? ((hoverDetail.size / totalUsed) * 100).toFixed(1) : 0}%</span></div>
            </div>
          )}
          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            {stats.map((s, i) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '2px 0' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ color: '#a6adc8', flex: 1 }}>{s.name}</span>
                <span style={{ color: '#6c7086' }}>{formatSize(s.size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #313244' }}>
            目录树状图
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {stats.map((stat, i) => (
              <TreeNode key={stat.name} stat={stat} depth={0} colorIndex={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
