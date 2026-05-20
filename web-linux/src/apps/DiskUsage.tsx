import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface DirStats {
  name: string
  path: string
  fileCount: number
  folderCount: number
  totalSize: number
  color: string
  children: DirStats[]
}

const dirColors = ['#89b4fa', '#a6e3a1', '#f9e2af', '#fab387', '#f38ba8', '#cba6f7', '#94e2d5', '#89dceb', '#f5c2e7', '#b4befe', '#74c7ec', '#eba0ac']

function computeDirStats(node: FileNode, path: string, colorIdx: { v: number }): DirStats {
  const currentPath = path === '/' ? `/${node.name}` : `${path}/${node.name}`
  if (node.type === 'file') {
    const size = node.content ? new Blob([node.content]).size : 0
    return { name: node.name, path: currentPath, fileCount: 1, folderCount: 0, totalSize: size, color: dirColors[colorIdx.v++ % dirColors.length], children: [] }
  }
  const children: DirStats[] = (node.children || []).map((c) => computeDirStats(c, currentPath, colorIdx))
  const fileCount = children.reduce((s, c) => s + c.fileCount, 0)
  const folderCount = children.reduce((s, c) => s + c.folderCount, 0) + 1
  const totalSize = children.reduce((s, c) => s + c.totalSize, 0)
  const color = dirColors[colorIdx.v++ % dirColors.length]
  return { name: node.name, path: currentPath, fileCount, folderCount, totalSize, color, children }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}

function formatSizeGB(bytes: number): string {
  return `${(bytes / 1073741824).toFixed(1)} GB`
}

function DonutChart({ data, width, height }: { data: { name: string; value: number; color: string }[]; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const cx = width / 2
    const cy = height / 2
    const outerR = Math.min(cx, cy) - 10
    const innerR = outerR * 0.6
    const total = data.reduce((s, d) => s + d.value, 0)
    if (total === 0) return

    ctx.clearRect(0, 0, width, height)
    let startAngle = -Math.PI / 2

    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle
      const isHovered = hovered === i
      const r = isHovered ? outerR + 4 : outerR

      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = isHovered ? d.color : d.color + 'cc'
      ctx.fill()

      if (isHovered) {
        ctx.shadowColor = d.color
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      }

      startAngle = endAngle
    })

    ctx.fillStyle = '#1e1e2e'
    ctx.beginPath()
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#cdd6f4'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatSize(total), cx, cy - 8)
    ctx.fillStyle = '#a6adc8'
    ctx.font = '11px sans-serif'
    ctx.fillText('总大小', cx, cy + 10)
  }, [data, width, height, hovered])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = width / 2
    const cy = height / 2
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const outerR = Math.min(cx, cy) - 10
    const innerR = outerR * 0.6

    if (dist < innerR || dist > outerR + 6) {
      setHovered(null)
      return
    }

    let angle = Math.atan2(dy, dx) + Math.PI / 2
    if (angle < 0) angle += Math.PI * 2
    const total = data.reduce((s, d) => s + d.value, 0)
    let cumAngle = 0
    for (let i = 0; i < data.length; i++) {
      cumAngle += (data[i].value / total) * Math.PI * 2
      if (angle < cumAngle) {
        setHovered(i)
        return
      }
    }
    setHovered(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width, height, cursor: 'pointer' }} onMouseMove={handleMouseMove} onMouseLeave={() => setHovered(null)} />
      {hovered !== null && data[hovered] && (
        <div style={{
          position: 'absolute', top: 4, right: 4, background: '#313244', borderRadius: '6px',
          padding: '6px 10px', fontSize: '11px', pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: data[hovered].color }} />
            <span style={{ fontWeight: 600 }}>{data[hovered].name}</span>
          </div>
          <div style={{ color: '#a6adc8' }}>{formatSize(data[hovered].value)}</div>
          <div style={{ color: '#a6adc8' }}>{((data[hovered].value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  )
}

interface TreemapItem {
  x: number
  y: number
  w: number
  h: number
  name: string
  value: number
  color: string
  path: string
}

function layoutTreemap(items: { name: string; value: number; color: string; path: string }[], x: number, y: number, w: number, h: number): TreemapItem[] {
  if (items.length === 0) return []
  if (items.length === 1) return [{ ...items[0], x, y, w, h }]
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total === 0) return []
  const sorted = [...items].sort((a, b) => b.value - a.value)
  let sum = 0
  let splitIdx = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    sum += sorted[i].value
    if (sum >= total / 2) {
      splitIdx = i + 1
      break
    }
  }
  if (splitIdx === 0) splitIdx = 1
  const firstHalf = sorted.slice(0, splitIdx)
  const secondHalf = sorted.slice(splitIdx)
  const firstTotal = firstHalf.reduce((s, i) => s + i.value, 0)
  const ratio = firstTotal / total
  if (w >= h) {
    const splitW = w * ratio
    return [
      ...layoutTreemap(firstHalf, x, y, splitW, h),
      ...layoutTreemap(secondHalf, x + splitW, y, w - splitW, h),
    ]
  } else {
    const splitH = h * ratio
    return [
      ...layoutTreemap(firstHalf, x, y, w, splitH),
      ...layoutTreemap(secondHalf, x, y + splitH, w, h - splitH),
    ]
  }
}

function Treemap({ items, width, height }: { items: { name: string; value: number; color: string; path: string }[]; width: number; height: number }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const rects = useMemo(() => layoutTreemap(items, 0, 0, width, height), [items, width, height])

  return (
    <div style={{ position: 'relative', width, height }}>
      {rects.map((r) => {
        const isHovered = hovered === r.path
        return (
          <div
            key={r.path}
            onMouseEnter={() => setHovered(r.path)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: 'absolute',
              left: r.x + 1,
              top: r.y + 1,
              width: r.w - 2,
              height: r.h - 2,
              background: isHovered ? r.color : r.color + '99',
              borderRadius: '3px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'background 0.15s',
              padding: '2px',
            }}
          >
            {r.w > 40 && r.h > 20 && (
              <span style={{ fontSize: r.w > 80 ? '11px' : '9px', fontWeight: 600, color: '#1e1e2e', textAlign: 'center', lineHeight: 1.2 }}>
                {r.name}
              </span>
            )}
            {r.w > 60 && r.h > 35 && (
              <span style={{ fontSize: '9px', color: '#1e1e2ecc', marginTop: '2px' }}>
                {formatSize(r.value)}
              </span>
            )}
          </div>
        )
      })}
      {hovered && (() => {
        const r = rects.find((rect) => rect.path === hovered)
        if (!r) return null
        return (
          <div style={{
            position: 'absolute', bottom: 4, left: 4, background: '#313244', borderRadius: '6px',
            padding: '6px 10px', fontSize: '11px', pointerEvents: 'none', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontWeight: 600, color: r.color }}>{r.name}</div>
            <div style={{ color: '#a6adc8' }}>{r.path}</div>
            <div style={{ color: '#cdd6f4' }}>{formatSize(r.value)}</div>
          </div>
        )
      })()}
    </div>
  )
}

function TreeNode({ entry, depth, formatSizeFn }: { entry: DirStats; depth: number; formatSizeFn: (n: number) => string }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = entry.children.length > 0

  return (
    <div>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
          paddingLeft: `${16 + depth * 20}px`, cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: '4px', fontSize: '12px',
        }}
      >
        {hasChildren ? <span style={{ fontSize: '10px' }}>{expanded ? '▼' : '▶'}</span> : <span style={{ width: '10px' }} />}
        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: entry.color, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{entry.name}</span>
        <span style={{ color: '#6c7086', fontSize: '10px' }}>{entry.fileCount} 文件</span>
        <span style={{ color: '#a6adc8', fontSize: '11px', marginLeft: '8px' }}>{formatSizeFn(entry.totalSize)}</span>
      </div>
      {expanded && hasChildren && entry.children.map((child) => (
        <TreeNode key={child.path} entry={child} depth={depth + 1} formatSizeFn={formatSizeFn} />
      ))}
    </div>
  )
}

export default function DiskUsage() {
  const files = useStore((s) => s.files)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const colorIdx = useRef({ v: 0 })
  const dirStats = useMemo(() => {
    colorIdx.current.v = 0
    return files.map((f) => computeDirStats(f, '', colorIdx.current))
  }, [files])

  const totalUsed = dirStats.reduce((s, d) => s + d.totalSize, 0)
  const totalFiles = dirStats.reduce((s, d) => s + d.fileCount, 0)
  const totalCapacity = Math.max(1073741824, totalUsed * 4)
  const available = totalCapacity - totalUsed

  const chartData = useMemo(() => {
    const items: { name: string; value: number; color: string; path: string }[] = []
    const collectTop = (stats: DirStats[]) => {
      for (const s of stats) {
        if (s.totalSize > 0) {
          items.push({ name: s.name, value: s.totalSize, color: s.color, path: s.path })
        }
        if (s.children.length > 0 && items.length < 20) {
          collectTop(s.children)
        }
      }
    }
    collectTop(dirStats)
    return items.slice(0, 12)
  }, [dirStats])

  const allFiles = useMemo(() => {
    const result: { name: string; path: string; size: number }[] = []
    const collect = (stats: DirStats[]) => {
      for (const s of stats) {
        if (s.fileCount > 0 && s.children.length === 0) {
          result.push({ name: s.name, path: s.path, size: s.totalSize })
        }
        collect(s.children)
      }
    }
    collect(dirStats)
    return result.sort((a, b) => b.size - a.size).slice(0, 10)
  }, [dirStats])

  const handleScan = useCallback(() => {
    setScanning(true)
    setScanProgress(0)
    setScanComplete(false)
    if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    scanTimerRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          if (scanTimerRef.current) clearInterval(scanTimerRef.current)
          setScanning(false)
          setScanComplete(true)
          return 100
        }
        return prev + Math.random() * 8 + 2
      })
    }, 80)
  }, [])

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    }
  }, [])

  const usagePercent = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>磁盘概览</div>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              padding: '6px 14px', background: scanning ? '#45475a' : '#89b4fa', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: scanning ? 'not-allowed' : 'pointer',
              fontSize: '12px', fontWeight: 600,
            }}
          >
            {scanning ? `扫描中 ${Math.min(100, Math.round(scanProgress))}%` : scanComplete ? '重新扫描' : '扫描磁盘'}
          </button>
        </div>

        {scanning && (
          <div style={{ background: '#313244', borderRadius: '4px', height: '4px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, scanProgress)}%`, height: '100%',
              background: 'linear-gradient(90deg, #89b4fa, #a6e3a1)',
              transition: 'width 0.1s',
            }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>总容量</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#89b4fa' }}>{formatSizeGB(totalCapacity)}</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>已使用</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#a6e3a1' }}>{formatSize(totalUsed)}</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>可用</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f38ba8' }}>{formatSize(available)}</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>文件数</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#cba6f7' }}>{totalFiles}</div>
          </div>
        </div>
        <div style={{ background: '#313244', borderRadius: '6px', height: '20px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${usagePercent}%`, height: '100%', background: 'linear-gradient(90deg, #a6e3a1, #f9e2af, #fab387, #f38ba8)', transition: 'width 0.3s' }} />
          <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: '#1e1e2e' }}>
            {usagePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '240px', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #313244' }}>
            使用分布
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {chartData.map((d) => (
              <div key={d.path} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ color: '#a6adc8', flexShrink: 0 }}>{formatSize(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid #313244' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#a6adc8' }}>环形图</div>
              <DonutChart data={chartData} width={200} height={200} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#a6adc8' }}>矩形树图</div>
              <Treemap items={chartData} width={280} height={200} />
            </div>
          </div>

          <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #313244' }}>
            目录树
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
            {dirStats.map((entry) => (
              <TreeNode key={entry.path} entry={entry} depth={0} formatSizeFn={formatSize} />
            ))}
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid #313244', fontSize: '13px', fontWeight: 600 }}>
            大文件列表
          </div>
          <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '4px 12px' }}>
            {allFiles.length > 0 ? allFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px', borderBottom: '1px solid #313244' }}>
                <span style={{ color: '#a6adc8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{f.path}</span>
                <span style={{ color: '#89b4fa', flexShrink: 0 }}>{formatSize(f.size)}</span>
              </div>
            )) : (
              <div style={{ padding: '8px', textAlign: 'center', color: '#6c7086', fontSize: '11px' }}>暂无文件数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
