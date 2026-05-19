import { useState } from 'react'

interface Package {
  name: string
  version: string
  size: string
  description: string
  category: string
  installed: boolean
  dependencies: string[]
}

const initialPackages: Package[] = [
  { name: 'bash', version: '5.2.21', size: '1.2 MB', description: 'GNU Bourne Again SHell', category: 'Shells', installed: true, dependencies: [] },
  { name: 'coreutils', version: '9.4', size: '15.3 MB', description: 'GNU core utilities', category: 'System', installed: true, dependencies: [] },
  { name: 'grep', version: '3.11', size: '0.8 MB', description: 'GNU grep, egrep and fgrep', category: 'Utilities', installed: true, dependencies: [] },
  { name: 'sed', version: '4.9', size: '0.6 MB', description: 'GNU sed stream editor', category: 'Utilities', installed: true, dependencies: [] },
  { name: 'awk', version: '1.3.1', size: '1.1 MB', description: 'Pattern scanning and processing language', category: 'Utilities', installed: true, dependencies: [] },
  { name: 'vim', version: '9.1', size: '3.5 MB', description: 'Vi IMproved - enhanced vi editor', category: 'Editors', installed: true, dependencies: ['ncurses'] },
  { name: 'git', version: '2.45.0', size: '8.2 MB', description: 'Distributed version control system', category: 'Development', installed: true, dependencies: ['curl', 'openssl'] },
  { name: 'curl', version: '8.7.1', size: '2.1 MB', description: 'Command line URL data transfer', category: 'Network', installed: true, dependencies: ['openssl'] },
  { name: 'wget', version: '1.24.5', size: '1.8 MB', description: 'Retrieves files from the web', category: 'Network', installed: false, dependencies: ['openssl'] },
  { name: 'openssl', version: '3.3.0', size: '4.5 MB', description: 'Secure Sockets Layer toolkit', category: 'Security', installed: true, dependencies: [] },
  { name: 'python3', version: '3.12.3', size: '28.5 MB', description: 'Interactive high-level object-oriented language', category: 'Development', installed: true, dependencies: ['libffi', 'openssl'] },
  { name: 'nodejs', version: '22.2.0', size: '45.1 MB', description: 'Evented I/O for V8 javascript', category: 'Development', installed: false, dependencies: ['openssl'] },
  { name: 'nginx', version: '1.26.0', size: '1.9 MB', description: 'HTTP and reverse proxy server', category: 'Web', installed: false, dependencies: ['openssl'] },
  { name: 'postgresql', version: '16.3', size: '42.0 MB', description: 'Object-relational SQL database', category: 'Database', installed: false, dependencies: ['libffi'] },
  { name: 'redis', version: '7.2.4', size: '3.8 MB', description: 'In-memory data structure store', category: 'Database', installed: false, dependencies: [] },
  { name: 'docker', version: '26.1.0', size: '55.3 MB', description: 'Container virtualization tool', category: 'Virtualization', installed: false, dependencies: [] },
  { name: 'htop', version: '3.3.0', size: '0.5 MB', description: 'Interactive process viewer', category: 'Monitoring', installed: true, dependencies: ['ncurses'] },
  { name: 'ncurses', version: '6.5', size: '1.8 MB', description: 'Terminal UI library', category: 'Libraries', installed: true, dependencies: [] },
  { name: 'libffi', version: '3.4.6', size: '0.3 MB', description: 'Foreign Function Interface library', category: 'Libraries', installed: true, dependencies: [] },
  { name: 'firefox', version: '126.0', size: '85.2 MB', description: 'Mozilla Firefox web browser', category: 'Web', installed: false, dependencies: [] },
  { name: 'vlc', version: '3.0.20', size: '32.1 MB', description: 'Multimedia player and streamer', category: 'Multimedia', installed: false, dependencies: [] },
  { name: 'gimp', version: '2.10.38', size: '58.7 MB', description: 'GNU Image Manipulation Program', category: 'Graphics', installed: false, dependencies: [] },
  { name: 'rsync', version: '3.2.7', size: '0.9 MB', description: 'Fast, versatile, remote file-copying tool', category: 'Network', installed: true, dependencies: [] },
  { name: 'tmux', version: '3.4', size: '0.7 MB', description: 'Terminal multiplexer', category: 'Utilities', installed: false, dependencies: ['ncurses'] },
  { name: 'ffmpeg', version: '7.0', size: '18.6 MB', description: 'Tools for transcoding multimedia files', category: 'Multimedia', installed: false, dependencies: [] },
]

export default function PackageManager() {
  const [packages, setPackages] = useState<Package[]>(initialPackages)
  const [search, setSearch] = useState('')
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [tab, setTab] = useState<'all' | 'installed'>('all')
  const [statusMsg, setStatusMsg] = useState('')

  const filtered = packages.filter((pkg) => {
    if (tab === 'installed' && !pkg.installed) return false
    if (search && !pkg.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const doInstall = (name: string) => {
    setStatusMsg(`正在安装 ${name}...`)
    setTimeout(() => {
      setPackages((prev) => prev.map((p) => p.name === name ? { ...p, installed: true } : p))
      setStatusMsg(`${name} 安装成功`)
    }, 800)
  }

  const doUninstall = (name: string) => {
    setStatusMsg(`正在卸载 ${name}...`)
    setTimeout(() => {
      setPackages((prev) => prev.map((p) => p.name === name ? { ...p, installed: false } : p))
      setStatusMsg(`${name} 已卸载`)
    }, 600)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d1117', color: '#c9d1d9' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #21262d', minWidth: 0 }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #21262d', display: 'flex', gap: '8px' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索软件包..."
            style={{
              flex: 1, padding: '6px 10px', background: '#161b22', border: '1px solid #30363d',
              borderRadius: '6px', color: '#c9d1d9', fontSize: '12px', outline: 'none',
            }}
          />
          <button
            onClick={() => setTab('all')}
            style={{
              padding: '6px 12px', background: tab === 'all' ? '#1f6feb' : '#21262d',
              border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px',
            }}
          >
            全部
          </button>
          <button
            onClick={() => setTab('installed')}
            style={{
              padding: '6px 12px', background: tab === 'installed' ? '#1f6feb' : '#21262d',
              border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px',
            }}
          >
            已安装
          </button>
        </div>
        {statusMsg && (
          <div style={{ padding: '6px 12px', background: '#161b22', color: '#58a6ff', fontSize: '12px', borderBottom: '1px solid #21262d' }}>
            {statusMsg}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((pkg) => (
            <div
              key={pkg.name}
              onClick={() => setSelectedPkg(pkg)}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer',
                borderBottom: '1px solid #21262d', background: selectedPkg?.name === pkg.name ? '#161b22' : 'transparent',
                fontSize: '12px',
              }}
            >
              <span style={{ flex: 1, fontWeight: 600, color: '#58a6ff' }}>{pkg.name}</span>
              <span style={{ width: '80px', color: '#8b949e' }}>{pkg.version}</span>
              <span style={{ width: '60px', color: '#8b949e' }}>{pkg.size}</span>
              <span style={{
                width: '60px', textAlign: 'right',
                color: pkg.installed ? '#3fb950' : '#8b949e',
              }}>
                {pkg.installed ? '已安装' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedPkg && (
        <div style={{ width: '280px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#58a6ff', fontSize: '16px' }}>{selectedPkg.name}</h3>
          <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.6 }}>
            <div>版本: {selectedPkg.version}</div>
            <div>大小: {selectedPkg.size}</div>
            <div>分类: {selectedPkg.category}</div>
            <div>状态: <span style={{ color: selectedPkg.installed ? '#3fb950' : '#f85149' }}>{selectedPkg.installed ? '已安装' : '未安装'}</span></div>
            <div style={{ marginTop: '8px' }}>{selectedPkg.description}</div>
            {selectedPkg.dependencies.length > 0 && (
              <div style={{ marginTop: '8px' }}>依赖: {selectedPkg.dependencies.join(', ')}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {selectedPkg.installed ? (
              <button
                onClick={() => doUninstall(selectedPkg.name)}
                style={{
                  padding: '8px 16px', background: '#da3633', color: '#fff', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                }}
              >
                卸载
              </button>
            ) : (
              <button
                onClick={() => doInstall(selectedPkg.name)}
                style={{
                  padding: '8px 16px', background: '#238636', color: '#fff', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                }}
              >
                安装
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}