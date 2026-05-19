import { useState } from 'react'

interface DiskEntry {
  name: string
  size: number
  color: string
  type: 'directory' | 'file'
  children?: DiskEntry[]
}

const diskData: DiskEntry[] = [
  { name: '/', size: 256, color: '#45475a', type: 'directory', children: [
    { name: 'home', size: 120, color: '#89b4fa', type: 'directory', children: [
      { name: 'user', size: 100, color: '#89dceb', type: 'directory', children: [
        { name: '文档', size: 45, color: '#a6e3a1', type: 'directory' },
        { name: '下载', size: 25, color: '#fab387', type: 'directory' },
        { name: '图片', size: 15, color: '#f9e2af', type: 'directory' },
        { name: '音乐', size: 10, color: '#cba6f7', type: 'directory' },
        { name: '视频', size: 5, color: '#f38ba8', type: 'directory' },
      ]},
      { name: 'guest', size: 20, color: '#94e2d5', type: 'directory' },
    ]},
    { name: 'usr', size: 80, color: '#f5c2e7', type: 'directory' },
    { name: 'var', size: 30, color: '#b4befe', type: 'directory', children: [
      { name: 'log', size: 20, color: '#74c7ec', type: 'directory' },
      { name: 'cache', size: 10, color: '#eba0ac', type: 'directory' },
    ]},
    { name: 'etc', size: 15, color: '#f2cdcd', type: 'directory' },
    { name: 'tmp', size: 5, color: '#a6adc8', type: 'directory' },
    { name: 'boot', size: 6, color: '#bac2de', type: 'directory' },
  ]},
]

export default function DiskUsage() {
  const formatSize = (gb: number) => gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>磁盘概览</div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>总容量</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#89b4fa' }}>256 GB</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>已使用</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#a6e3a1' }}>256 GB</div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>可用</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f38ba8' }}>0 GB</div>
          </div>
        </div>
        <div style={{ background: '#313244', borderRadius: '6px', height: '20px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #a6e3a1, #f9e2af, #fab387, #f38ba8)' }} />
        </div>
      </div>

      <div style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #313244' }}>
        磁盘使用树状图
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {diskData.map((entry) => (
          <TreeNode key={entry.name} entry={entry} depth={0} formatSize={formatSize} />
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #313244', fontSize: '14px', fontWeight: 600 }}>
        大文件列表
      </div>
      <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px 16px' }}>
        {[
          { name: '/home/user/视频/movie.mp4', size: 4.2 },
          { name: '/home/user/下载/archive.tar.gz', size: 3.1 },
          { name: '/usr/lib/python3.12/site-packages', size: 2.8 },
          { name: '/var/log/syslog', size: 1.5 },
          { name: '/home/user/音乐/album.zip', size: 1.2 },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: '1px solid #313244' }}>
            <span style={{ color: '#a6adc8' }}>{f.name}</span>
            <span style={{ color: '#89b4fa' }}>{formatSize(f.size)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TreeNode({ entry, depth, formatSize }: { entry: DiskEntry; depth: number; formatSize: (n: number) => string }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = entry.children && entry.children.length > 0

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
        <span style={{ color: '#a6adc8', fontSize: '11px' }}>{formatSize(entry.size)}</span>
      </div>
      {expanded && hasChildren && entry.children!.map((child) => (
        <TreeNode key={child.name} entry={child} depth={depth + 1} formatSize={formatSize} />
      ))}
    </div>
  )
}