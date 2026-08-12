import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Download,
  RefreshCw,
  Calendar,
  User,
  Hash,
  FileCode,
  ChevronRight,
  X,
  Tag,
  Activity,
  Network,
  Code2,
  Mail,
} from 'lucide-react'

/* ───────────────────────── 类型定义 ───────────────────────── */

interface GitFile {
  path: string
  status: 'added' | 'modified' | 'deleted'
  additions: number
  deletions: number
}

interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  email: string
  date: string
  timestamp: number
  branch: string
  type: 'normal' | 'merge' | 'tag'
  parentHashes: string[]
  files: GitFile[]
  tags?: string[]
}

interface GitBranch {
  name: string
  color: string
  headHash: string
  isProtected: boolean
}

interface GitTag {
  name: string
  commitHash: string
  message?: string
}

interface SimulatedRepo {
  name: string
  description: string
  commits: GitCommit[]
  branches: GitBranch[]
  tags: GitTag[]
  currentBranch: string
  totalFiles: number
  totalLines: number
}

/* ───────────────────────── 数据 ───────────────────────── */

const NEON_COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00e5',
  green: '#00ff88',
  orange: '#ff8800',
  yellow: '#ffee00',
  purple: '#aa55ff',
  pink: '#ff3399',
  blue: '#3388ff',
  red: '#ff3344',
  teal: '#00ccaa',
}

const BRANCH_COLOR_PALETTE = [
  NEON_COLORS.cyan,
  NEON_COLORS.magenta,
  NEON_COLORS.green,
  NEON_COLORS.orange,
  NEON_COLORS.purple,
  NEON_COLORS.pink,
  NEON_COLORS.yellow,
  NEON_COLORS.blue,
  NEON_COLORS.teal,
  NEON_COLORS.red,
]

const COMMIT_MESSAGES = [
  'feat: 实现用户认证模块',
  'fix: 修复表单验证错误',
  'docs: 更新 API 文档',
  'refactor: 优化状态管理逻辑',
  'style: 统一代码风格',
  'perf: 提升页面加载速度',
  'test: 添加单元测试覆盖',
  'chore: 升级依赖版本',
  'feat: 添加仪表盘组件',
  'fix: 修复移动端适配问题',
  'feat: 实现数据导出功能',
  'refactor: 拆分大型组件',
  'feat: 添加通知系统',
  'fix: 修复内存泄漏',
  'docs: 补充 README 说明',
  'feat: 实现实时聊天功能',
  'perf: 优化数据库查询',
  'feat: 添加主题切换',
  'fix: 修复 SVG 渲染问题',
  'feat: 实现国际化支持',
]

const AUTHORS = [
  { name: 'Alice Chen', email: 'alice@example.com' },
  { name: 'Bob Martinez', email: 'bob@example.com' },
  { name: 'Carol Wang', email: 'carol@example.com' },
  { name: 'David Kim', email: 'david@example.com' },
  { name: 'Eva Müller', email: 'eva@example.com' },
]

const FILE_POOL: { path: string; type: GitFile['status'] }[] = [
  { path: 'src/components/Auth.tsx', type: 'added' },
  { path: 'src/utils/validate.ts', type: 'modified' },
  { path: 'src/hooks/useAuth.ts', type: 'added' },
  { path: 'src/pages/Dashboard.tsx', type: 'modified' },
  { path: 'src/api/users.ts', type: 'modified' },
  { path: 'src/types/index.ts', type: 'added' },
  { path: 'src/components/Modal.tsx', type: 'deleted' },
  { path: 'src/styles/theme.css', type: 'modified' },
  { path: 'src/store/auth.ts', type: 'added' },
  { path: 'src/lib/request.ts', type: 'modified' },
  { path: 'src/App.tsx', type: 'modified' },
  { path: 'src/index.ts', type: 'modified' },
  { path: 'src/config/env.ts', type: 'added' },
  { path: 'src/components/Button.tsx', type: 'modified' },
  { path: 'public/index.html', type: 'modified' },
  { path: 'package.json', type: 'modified' },
  { path: 'tsconfig.json', type: 'modified' },
  { path: 'vite.config.ts', type: 'modified' },
  { path: 'README.md', type: 'modified' },
  { path: '.gitignore', type: 'added' },
]

/* ───────────────────────── 工具函数 ───────────────────────── */

function generateHash(length = 40): string {
  const chars = '0123456789abcdef'
  let hash = ''
  for (let i = 0; i < length; i++) {
    hash += chars[Math.floor(Math.random() * 16)]
  }
  return hash
}

function generateMockRepo(): SimulatedRepo {
  const now = Date.now()
  const commits: GitCommit[] = []
  const branches: GitBranch[] = [
    { name: 'main', color: BRANCH_COLOR_PALETTE[0], headHash: '', isProtected: true },
    { name: 'develop', color: BRANCH_COLOR_PALETTE[2], headHash: '', isProtected: false },
    { name: 'feature/auth', color: BRANCH_COLOR_PALETTE[1], headHash: '', isProtected: false },
    { name: 'feature/dashboard', color: BRANCH_COLOR_PALETTE[3], headHash: '', isProtected: false },
    { name: 'hotfix/login', color: BRANCH_COLOR_PALETTE[4], headHash: '', isProtected: false },
  ]

  const mainCommits = 8
  const developCommits = 6
  const authCommits = 4
  const dashboardCommits = 5
  const hotfixCommits = 2

  const messagePool = [...COMMIT_MESSAGES]
  let msgIdx = 0

  const makeCommit = (branch: string, daysAgo: number, parents: string[]): GitCommit => {
    const hash = generateHash()
    const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)]
    const fileCount = 1 + Math.floor(Math.random() * 4)
    const files: GitFile[] = []
    const usedPaths = new Set<string>()
    for (let i = 0; i < fileCount; i++) {
      let file: { path: string; type: GitFile['status'] }
      do {
        file = FILE_POOL[Math.floor(Math.random() * FILE_POOL.length)]
      } while (usedPaths.has(file.path))
      usedPaths.add(file.path)
      const additions = Math.floor(Math.random() * 50) + 1
      const deletions = file.type === 'deleted' ? additions : Math.floor(Math.random() * 20)
      files.push({ path: file.path, status: file.type, additions, deletions })
    }
    const isMerge = parents.length > 1
    const msg = messagePool[msgIdx % messagePool.length]
    msgIdx++
    return {
      hash,
      shortHash: hash.slice(0, 7),
      message: isMerge ? `Merge branch '${branch}'` : msg,
      author: author.name,
      email: author.email,
      date: new Date(now - daysAgo * 86400000).toISOString(),
      timestamp: now - daysAgo * 86400000,
      branch,
      type: isMerge ? 'merge' : 'normal',
      parentHashes: parents,
      files,
    }
  }

  const mainChain: string[] = []
  for (let i = 0; i < mainCommits; i++) {
    const parents = i === 0 ? [] : [mainChain[mainChain.length - 1]]
    const commit = makeCommit('main', mainCommits - i, parents)
    mainChain.push(commit.hash)
    commits.push(commit)
  }
  branches[0].headHash = mainChain[mainChain.length - 1]

  const developBaseIdx = 2
  const developChain: string[] = [mainChain[developBaseIdx]]
  for (let i = 0; i < developCommits; i++) {
    const parentHash = i === 0 ? mainChain[developBaseIdx] : developChain[developChain.length - 1]
    const commit = makeCommit('develop', mainCommits + developCommits - i, [parentHash])
    developChain.push(commit.hash)
    commits.push(commit)
  }
  branches[1].headHash = developChain[developChain.length - 1]

  const authBaseIdx = 3
  const authChain: string[] = []
  for (let i = 0; i < authCommits; i++) {
    const parentHash = i === 0 ? mainChain[authBaseIdx] : authChain[authChain.length - 1]
    const commit = makeCommit('feature/auth', mainCommits + authCommits - i, [parentHash])
    authChain.push(commit.hash)
    commits.push(commit)
  }
  branches[2].headHash = authChain[authChain.length - 1]

  const dashboardBaseIdx = 4
  const dashboardChain: string[] = []
  for (let i = 0; i < dashboardCommits; i++) {
    const parentHash = i === 0 ? mainChain[dashboardBaseIdx] : dashboardChain[dashboardChain.length - 1]
    const commit = makeCommit('feature/dashboard', mainCommits + dashboardCommits - i, [parentHash])
    dashboardChain.push(commit.hash)
    commits.push(commit)
  }
  branches[3].headHash = dashboardChain[dashboardChain.length - 1]

  const hotfixBaseIdx = 6
  const hotfixChain: string[] = []
  for (let i = 0; i < hotfixCommits; i++) {
    const parentHash = i === 0 ? mainChain[hotfixBaseIdx] : hotfixChain[hotfixChain.length - 1]
    const commit = makeCommit('hotfix/login', mainCommits + hotfixCommits - i, [parentHash])
    hotfixChain.push(commit.hash)
    commits.push(commit)
  }
  branches[4].headHash = hotfixChain[hotfixChain.length - 1]

  const mergeCommit = makeCommit('main', 1, [mainChain[mainChain.length - 1], authChain[authChain.length - 1]])
  mergeCommit.message = "Merge branch 'feature/auth' into main"
  mergeCommit.type = 'merge'
  mergeCommit.tags = ['v2.0.0']
  commits.push(mergeCommit)

  const tags: GitTag[] = [
    { name: 'v1.0.0', commitHash: mainChain[3], message: '首个稳定版本' },
    { name: 'v1.5.0', commitHash: mainChain[6], message: '性能优化版本' },
    { name: 'v2.0.0', commitHash: mergeCommit.hash, message: '认证模块发布' },
  ]

  const totalFiles = new Set<string>()
  let totalLines = 0
  commits.forEach(c => {
    c.files.forEach(f => {
      totalFiles.add(f.path)
      totalLines += f.additions + f.deletions
    })
  })

  return {
    name: 'web-linux-os',
    description: 'Web 版 Linux 操作系统 - 可视化桌面环境',
    commits: commits.sort((a, b) => b.timestamp - a.timestamp),
    branches,
    tags,
    currentBranch: 'main',
    totalFiles: totalFiles.size,
    totalLines,
  }
}

const GLASS: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--window-border)',
}

const CARD: React.CSSProperties = {
  ...GLASS,
  borderRadius: 12,
  padding: 14,
  transition: 'all 0.2s ease',
}

const CODE_BLOCK: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  borderRadius: 8,
  padding: '8px 12px',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12,
  color: '#a5d6ff',
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'auto',
  whiteSpace: 'pre',
  lineHeight: 1.6,
}

/* ───────────────────────── 主组件 ───────────────────────── */

export default function GitVisualizer() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [repo, setRepo] = useState<SimulatedRepo>(() => generateMockRepo())
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null)
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null)
  const [activeBranchFilter, setActiveBranchFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const regenerate = useCallback(() => {
    setRepo(generateMockRepo())
    setSelectedCommit(null)
  }, [])

  const filteredCommits = useMemo(() => {
    let commits = [...repo.commits]
    if (activeBranchFilter) {
      commits = commits.filter(c => c.branch === activeBranchFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      commits = commits.filter(
        c =>
          c.message.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.hash.toLowerCase().includes(q) ||
          c.shortHash.toLowerCase().includes(q)
      )
    }
    return commits.sort((a, b) => b.timestamp - a.timestamp)
  }, [repo.commits, activeBranchFilter, searchQuery])

  const stats = useMemo(() => {
    const totalCommits = repo.commits.length
    const totalBranches = repo.branches.length
    const totalTags = repo.tags.length
    const authors = new Set(repo.commits.map(c => c.author)).size
    return { totalCommits, totalBranches, totalTags, authors }
  }, [repo])

  const exportSVG = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const blob = new Blob(['<?xml version="1.0"?>\n' + source], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${repo.name}-commit-graph.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [repo.name])

  const exportPNG = useCallback(() => {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svgRef.current)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      const rect = svgRef.current!.getBoundingClientRect()
      canvas.width = rect.width * scale
      canvas.height = rect.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = isDark ? '#0a0a1a' : '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `${repo.name}-commit-graph.png`
        a.click()
        URL.revokeObjectURL(pngUrl)
      })
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [repo.name, isDark])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(135deg, #0a0a1a 0%, #0f0c29 50%, #1a1a3e 100%)'
          : 'linear-gradient(135deg, #e8f4fd 0%, #f0f0ff 100%)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes gv-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gv-glow { 0%,100% { filter: drop-shadow(0 0 4px currentColor); } 50% { filter: drop-shadow(0 0 12px currentColor); } }
        @keyframes gv-pulse-ring { 0% { r: 16; opacity: 0.6; } 100% { r: 28; opacity: 0; } }
        @keyframes gv-dash-flow { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
        .gv-fade-in { animation: gv-fade-in 0.35s ease-out; }
        .gv-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .gv-scroll::-webkit-scrollbar-track { background: transparent; }
        .gv-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .gv-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .gv-glow { animation: gv-glow 2s ease-in-out infinite; }
        .gv-flow-line { stroke-dasharray: 6 4; animation: gv-dash-flow 1.5s linear infinite; }
        .gv-commit-node { cursor: pointer; transition: all 0.2s ease; }
        .gv-commit-node:hover .gv-node-ring { opacity: 0.4; }
        .gv-branch-line { transition: stroke-width 0.2s ease; }
      `}</style>

      <Header isDark={isDark} repo={repo} stats={stats} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid var(--window-border)',
          }}
        >
          <Toolbar
            isDark={isDark}
            repo={repo}
            activeBranchFilter={activeBranchFilter}
            setActiveBranchFilter={setActiveBranchFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            regenerate={regenerate}
            exportSVG={exportSVG}
            exportPNG={exportPNG}
          />

          <div ref={svgContainerRef} style={{ flex: 1, overflow: 'auto', padding: '16px' }} className="gv-scroll">
            <CommitGraph
              ref={svgRef}
              repo={repo}
              isDark={isDark}
              commits={filteredCommits}
              selectedCommit={selectedCommit}
              hoveredCommit={hoveredCommit}
              onSelectCommit={setSelectedCommit}
              onHoverCommit={setHoveredCommit}
            />
          </div>

          <BranchTimeline repo={repo} isDark={isDark} />
        </div>

        <DetailsPanel
          repo={repo}
          isDark={isDark}
          selectedCommit={selectedCommit}
          onClose={() => setSelectedCommit(null)}
        />
      </div>
    </div>
  )
}

/* ───────────────────────── Header ───────────────────────── */

function Header({
  isDark,
  repo,
  stats,
}: {
  isDark: boolean
  repo: SimulatedRepo
  stats: { totalCommits: number; totalBranches: number; totalTags: number; authors: number }
}) {
  return (
    <div
      style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--window-border)',
        background: isDark ? 'rgba(10,10,26,0.8)' : 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #00f0ff 0%, #aa55ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(0,240,255,0.4), 0 0 48px rgba(170,85,255,0.2)',
        }}
      >
        <Network size={22} color="white" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{repo.name}</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              background: isDark ? 'rgba(0,240,255,0.12)' : 'rgba(0,100,255,0.08)',
              border: `1px solid ${isDark ? 'rgba(0,240,255,0.3)' : 'rgba(0,100,255,0.2)'}`,
              color: isDark ? '#00f0ff' : '#0066cc',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <GitBranch size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {repo.currentBranch}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
          {repo.description}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatBadge icon={<GitCommit size={12} />} label="Commits" value={stats.totalCommits} color={NEON_COLORS.cyan} isDark={isDark} />
        <StatBadge icon={<GitBranch size={12} />} label="Branches" value={stats.totalBranches} color={NEON_COLORS.green} isDark={isDark} />
        <StatBadge icon={<Tag size={12} />} label="Tags" value={stats.totalTags} color={NEON_COLORS.orange} isDark={isDark} />
        <StatBadge icon={<User size={12} />} label="Authors" value={stats.authors} color={NEON_COLORS.magenta} isDark={isDark} />
      </div>
    </div>
  )
}

function StatBadge({
  icon,
  label,
  value,
  color,
  isDark,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  isDark: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 10,
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
      </div>
    </div>
  )
}

/* ───────────────────────── Toolbar ───────────────────────── */

function Toolbar({
  isDark,
  repo,
  activeBranchFilter,
  setActiveBranchFilter,
  searchQuery,
  setSearchQuery,
  regenerate,
  exportSVG,
  exportPNG,
}: {
  isDark: boolean
  repo: SimulatedRepo
  activeBranchFilter: string | null
  setActiveBranchFilter: (b: string | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  regenerate: () => void
  exportSVG: () => void
  exportPNG: () => void
}) {
  const accent = NEON_COLORS.cyan
  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--window-border)',
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveBranchFilter(null)}
          style={{
            padding: '5px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeBranchFilter === null ? `linear-gradient(135deg, ${accent}22, ${NEON_COLORS.magenta}22)` : 'transparent',
            color: activeBranchFilter === null ? accent : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: activeBranchFilter === null ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          全部
        </button>
        {repo.branches.map((b) => {
          const active = activeBranchFilter === b.name
          return (
            <button
              key={b.name}
              onClick={() => setActiveBranchFilter(active ? null : b.name)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: `1px solid ${active ? b.color : 'transparent'}`,
                background: active ? `${b.color}22` : 'transparent',
                color: active ? b.color : 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              <GitBranch size={11} />
              {b.name}
            </button>
          )
        })}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 160,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 10,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <Code2 size={14} style={{ color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索提交信息、作者或哈希..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <ToolbarButton icon={<RefreshCw size={13} />} label="重新生成" onClick={regenerate} isDark={isDark} />
        <ToolbarButton icon={<Download size={13} />} label="SVG" onClick={exportSVG} isDark={isDark} accent={NEON_COLORS.cyan} />
        <ToolbarButton icon={<Download size={13} />} label="PNG" onClick={exportPNG} isDark={isDark} accent={NEON_COLORS.magenta} />
      </div>
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isDark,
  accent,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isDark: boolean
  accent?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${accent ? `${accent}55` : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        background: accent
          ? isDark
            ? `${accent}15`
            : `${accent}10`
          : isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.03)',
        color: accent || 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        if (accent) e.currentTarget.style.boxShadow = `0 0 12px ${accent}55`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ───────────────────────── 提交图 ───────────────────────── */

interface CommitGraphProps {
  repo: SimulatedRepo
  isDark: boolean
  commits: GitCommit[]
  selectedCommit: GitCommit | null
  hoveredCommit: string | null
  onSelectCommit: (c: GitCommit) => void
  onHoverCommit: (hash: string | null) => void
}

const CommitGraph = React.forwardRef<SVGSVGElement, CommitGraphProps>(
  ({ repo, isDark, commits, selectedCommit, hoveredCommit, onSelectCommit, onHoverCommit }, ref) => {
    const COMMIT_SPACING_X = 56
    const NODE_RADIUS = 10
    const ROW_HEIGHT = 50
    const MARGIN = { top: 30, right: 40, bottom: 30, left: 20 }

    const branchLanes = useMemo(() => {
      const laneMap = new Map<string, number>()
      repo.branches.forEach((b, i) => {
        laneMap.set(b.name, i)
      })
      return laneMap
    }, [repo.branches])

    const commitLayout = useMemo(() => {
      return commits.map((commit, idx) => {
        const laneIdx = branchLanes.get(commit.branch) ?? 0
        return {
          commit,
          x: MARGIN.left + idx * COMMIT_SPACING_X + COMMIT_SPACING_X,
          y: MARGIN.top + laneIdx * ROW_HEIGHT + ROW_HEIGHT / 2,
          lane: laneIdx,
        }
      })
    }, [commits, branchLanes])

    const layoutMap = useMemo(() => {
      const m = new Map<string, { x: number; y: number; lane: number }>()
      commitLayout.forEach(({ commit, x, y, lane }) => {
        m.set(commit.hash, { x, y, lane })
      })
      return m
    }, [commitLayout])

    const edges = useMemo(() => {
      const result: { from: { x: number; y: number; lane: number }; to: { x: number; y: number; lane: number }; color: string; isMerge: boolean }[] = []
      commitLayout.forEach(({ commit }) => {
        const from = layoutMap.get(commit.hash)
        if (!from) return
        commit.parentHashes.forEach((parentHash) => {
          const to = layoutMap.get(parentHash)
          if (!to) return
          const branch = repo.branches.find(b => b.name === commit.branch)
          const color = commit.type === 'merge'
            ? NEON_COLORS.magenta
            : branch?.color || NEON_COLORS.cyan
          const isMerge = commit.type === 'merge'
          result.push({ from, to, color, isMerge })
        })
      })
      return result
    }, [commitLayout, layoutMap, repo.branches])

    const svgWidth = MARGIN.left + commits.length * COMMIT_SPACING_X + MARGIN.right + 40
    const svgHeight = MARGIN.top + repo.branches.length * ROW_HEIGHT + MARGIN.bottom + 20

    return (
      <svg
        ref={ref}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          display: 'block',
          background: isDark ? 'rgba(10,10,26,0.4)' : 'rgba(255,255,255,0.5)',
          borderRadius: 12,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <defs>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-magenta" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={NEON_COLORS.cyan} stopOpacity="0.8" />
            <stop offset="100%" stopColor={NEON_COLORS.magenta} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {repo.branches.map((branch, idx) => {
          const y = MARGIN.top + idx * ROW_HEIGHT + ROW_HEIGHT / 2
          return (
            <g key={branch.name}>
              <line
                x1={MARGIN.left - 10}
                y1={y}
                x2={svgWidth - MARGIN.right}
                y2={y}
                stroke={branch.color}
                strokeWidth={hoveredCommit ? 1 : 1.5}
                strokeDasharray="4 6"
                opacity={0.25}
                className="gv-branch-line"
              />
              <text
                x={MARGIN.left - 14}
                y={y - 14}
                textAnchor="end"
                fill={branch.color}
                fontSize="11"
                fontWeight="700"
                fontFamily='"JetBrains Mono", monospace'
                style={{ filter: `drop-shadow(0 0 4px ${branch.color}66)` }}
              >
                {branch.name}
              </text>
            </g>
          )
        })}

        {edges.map((edge, i) => {
          const cp1x = edge.from.x
          const cp1y = edge.from.y
          const cp2x = edge.to.x
          const cp2y = edge.to.y
          const pathD = edge.from.y === edge.to.y
            ? `M ${edge.from.x} ${edge.from.y} L ${edge.to.x} ${edge.to.y}`
            : `M ${edge.from.x} ${edge.from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${edge.to.x} ${edge.to.y}`
          return (
            <path
              key={i}
              d={pathD}
              stroke={edge.color}
              strokeWidth={edge.isMerge ? 2.5 : 2}
              fill="none"
              opacity={edge.isMerge ? 0.9 : 0.55}
              filter={edge.isMerge ? 'url(#glow-magenta)' : undefined}
              className="gv-flow-line"
              style={{ transition: 'opacity 0.2s ease' }}
            />
          )
        })}

        {commitLayout.map(({ commit, x, y }) => {
          const branch = repo.branches.find(b => b.name === commit.branch)
          const color = commit.type === 'merge' ? NEON_COLORS.magenta : (branch?.color || NEON_COLORS.cyan)
          const isSelected = selectedCommit?.hash === commit.hash
          const isHovered = hoveredCommit === commit.hash
          const hasTag = commit.tags && commit.tags.length > 0
          const isMerge = commit.type === 'merge'
          return (
            <g
              key={commit.hash}
              className="gv-commit-node"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectCommit(commit)}
              onMouseEnter={() => onHoverCommit(commit.hash)}
              onMouseLeave={() => onHoverCommit(null)}
            >
              {(isSelected || isHovered) && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 10}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.3}
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                >
                  {isHovered && !isSelected && (
                    <animate attributeName="r" values={`${NODE_RADIUS + 6};${NODE_RADIUS + 14};${NODE_RADIUS + 6}`} dur="1.2s" repeatCount="indefinite" />
                  )}
                </circle>
              )}

              <circle
                cx={x}
                cy={y}
                r={NODE_RADIUS + 4}
                fill={isDark ? 'rgba(10,10,26,0.9)' : 'rgba(255,255,255,0.95)'}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
                style={{
                  filter: isSelected || isHovered ? `drop-shadow(0 0 8px ${color})` : 'none',
                  transition: 'all 0.2s ease',
                }}
              />

              {isMerge ? (
                <GitMerge x={x - 7} y={y - 7} size={14} color={color} />
              ) : hasTag ? (
                <Tag x={x - 6} y={y - 6} size={12} color={color} />
              ) : (
                <circle cx={x} cy={y} r={5} fill={color} opacity={0.9} />
              )}

              <text
                x={x}
                y={y + 28}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="9"
                fontFamily='"JetBrains Mono", monospace'
                opacity={isHovered || isSelected ? 1 : 0.7}
                fontWeight={isSelected ? 700 : 400}
              >
                {commit.shortHash}
              </text>

              {(isHovered || isSelected) && (
                <g>
                  <rect
                    x={x - 80}
                    y={y - 48}
                    width={160}
                    height={28}
                    rx={6}
                    fill={isDark ? 'rgba(10,10,26,0.95)' : 'rgba(255,255,255,0.98)'}
                    stroke={color}
                    strokeWidth={1}
                    style={{ filter: `drop-shadow(0 2px 8px ${color}44)` }}
                  />
                  <text
                    x={x}
                    y={y - 30}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {commit.message.length > 28 ? commit.message.slice(0, 28) + '…' : commit.message}
                  </text>
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize="8"
                  >
                    {commit.author} · {new Date(commit.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    )
  }
)
CommitGraph.displayName = 'CommitGraph'

/* ───────────────────────── 分支时间线 ───────────────────────── */

function BranchTimeline({ repo, isDark }: { repo: SimulatedRepo; isDark: boolean }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--window-border)',
        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
        display: 'flex',
        gap: 12,
        flexShrink: 0,
        overflowX: 'auto',
      }}
      className="gv-scroll"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
        <Activity size={12} /> 分支时间线
      </div>
      {repo.branches.map((branch) => {
        const branchCommits = repo.commits.filter(c => c.branch === branch.name)
        const commitCount = branchCommits.length
        const lastCommit = branchCommits[0]
        return (
          <div
            key={branch.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${branch.color}44`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: branch.color,
                boxShadow: `0 0 6px ${branch.color}`,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: branch.color }}>{branch.name}</span>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono", monospace' }}>
                {commitCount} commits
                {lastCommit && ` · ${lastCommit.shortHash}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── 详情面板 ───────────────────────── */

function DetailsPanel({
  repo,
  isDark,
  selectedCommit,
  onClose,
}: {
  repo: SimulatedRepo
  isDark: boolean
  selectedCommit: GitCommit | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (selectedCommit) setExpanded(false)
  }, [selectedCommit])

  if (!selectedCommit) {
    return (
      <div
        style={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--window-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitCommit size={16} style={{ color: NEON_COLORS.cyan }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>提交详情</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>点击提交节点查看详情</div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }} className="gv-scroll">
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              textAlign: 'center',
            }}
          >
            <GitCommit size={32} style={{ margin: '0 auto 12px', color: 'var(--text-secondary)', opacity: 0.5 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              在提交图中点击一个提交节点
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              查看提交信息、作者、<br />修改文件和差异统计
            </div>
          </div>

          <div style={{ ...CARD, padding: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              仓库概览
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow icon={<GitCommit size={11} />} label="总提交" value={repo.commits.length.toString()} color={NEON_COLORS.cyan} isDark={isDark} />
              <InfoRow icon={<GitBranch size={11} />} label="分支数" value={repo.branches.length.toString()} color={NEON_COLORS.green} isDark={isDark} />
              <InfoRow icon={<Tag size={11} />} label="标签数" value={repo.tags.length.toString()} color={NEON_COLORS.orange} isDark={isDark} />
              <InfoRow icon={<FileCode size={11} />} label="文件数" value={repo.totalFiles.toString()} color={NEON_COLORS.purple} isDark={isDark} />
              <InfoRow icon={<Activity size={11} />} label="变更行" value={repo.totalLines.toLocaleString()} color={NEON_COLORS.magenta} isDark={isDark} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const branch = repo.branches.find(b => b.name === selectedCommit.branch)
  const color = selectedCommit.type === 'merge' ? NEON_COLORS.magenta : (branch?.color || NEON_COLORS.cyan)
  const totalAdditions = selectedCommit.files.reduce((sum, f) => sum + f.additions, 0)
  const totalDeletions = selectedCommit.files.reduce((sum, f) => sum + f.deletions, 0)

  return (
    <div
      ref={panelRef}
      style={{
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
      }}
      className="gv-fade-in"
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${color}44`,
          background: isDark ? `${color}10` : `${color}08`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 12px ${color}44`,
          }}
        >
          {selectedCommit.type === 'merge' ? (
            <GitMerge size={16} color={color} />
          ) : selectedCommit.tags ? (
            <Tag size={16} color={color} />
          ) : (
            <GitCommit size={16} color={color} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCommit.message}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono", monospace' }}>
            {selectedCommit.shortHash} ({selectedCommit.hash.length} chars)
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }} className="gv-scroll">
        <div style={{ ...CARD, padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GitCommit size={11} /> 提交信息
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoRow icon={<Hash size={11} />} label="哈希" value={selectedCommit.hash.slice(0, 16) + '…'} color={color} mono isDark={isDark} />
            <InfoRow icon={<User size={11} />} label="作者" value={selectedCommit.author} color={color} isDark={isDark} />
            <InfoRow icon={<Mail size={11} />} label="邮箱" value={selectedCommit.email} color={color} mono isDark={isDark} />
            <InfoRow icon={<Calendar size={11} />} label="日期" value={new Date(selectedCommit.date).toLocaleString('zh-CN')} color={color} isDark={isDark} />
            <InfoRow icon={<GitBranch size={11} />} label="分支" value={selectedCommit.branch} color={color} isDark={isDark} />
            {selectedCommit.tags && selectedCommit.tags.length > 0 && (
              <InfoRow icon={<Tag size={11} />} label="标签" value={selectedCommit.tags.join(', ')} color={NEON_COLORS.orange} isDark={isDark} />
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCode size={11} /> 变更统计
          </h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                background: isDark ? 'rgba(0,255,136,0.1)' : 'rgba(0,200,100,0.08)',
                border: `1px solid ${NEON_COLORS.green}33`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: NEON_COLORS.green }}>+{totalAdditions}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>新增行</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                background: isDark ? 'rgba(255,51,68,0.1)' : 'rgba(220,50,60,0.08)',
                border: `1px solid ${NEON_COLORS.red}33`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: NEON_COLORS.red }}>-{totalDeletions}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>删除行</div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            {expanded ? '收起' : '展开'}文件列表 ({selectedCommit.files.length})
            <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
          </button>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selectedCommit.files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background:
                        f.status === 'added' ? NEON_COLORS.green : f.status === 'deleted' ? NEON_COLORS.red : NEON_COLORS.orange,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.path}
                  </span>
                  <span style={{ color: NEON_COLORS.green, fontSize: 10, fontWeight: 600 }}>+{f.additions}</span>
                  <span style={{ color: NEON_COLORS.red, fontSize: 10, fontWeight: 600 }}>-{f.deletions}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            父提交
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedCommit.parentHashes.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>初始提交（无父提交）</div>
            ) : (
              selectedCommit.parentHashes.map((ph, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: color,
                  }}
                >
                  {ph.slice(0, 7)}…
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            操作提示
          </h4>
          <pre style={{ ...CODE_BLOCK, margin: 0, padding: '10px 12px', fontSize: 11 }}>
            <code>
              <span style={{ color: '#f97583' }}>git</span> <span style={{ color: '#89ddff' }}>show</span>{' '}
              <span style={{ color: '#ffb86c' }}>{selectedCommit.shortHash}</span>
              {'\n'}
              <span style={{ color: '#f97583' }}>git</span> <span style={{ color: '#89ddff' }}>diff</span>{' '}
              <span style={{ color: '#ffb86c' }}>{selectedCommit.parentHashes[0]?.slice(0, 7) || 'EMPTY'}</span>{' '}
              <span style={{ color: '#ffb86c' }}>{selectedCommit.shortHash}</span>
              {'\n'}
              <span style={{ color: '#f97583' }}>git</span> <span style={{ color: '#89ddff' }}>log</span> --oneline -1{'\n'}
              <span style={{ color: '#f97583' }}>git</span> <span style={{ color: '#89ddff' }}>cherry-pick</span>{' '}
              <span style={{ color: '#ffb86c' }}>{selectedCommit.shortHash}</span>
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  color,
  mono,
  isDark,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  mono?: boolean
  isDark: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 6,
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
      }}
    >
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 48 }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          color: 'var(--text-primary)',
          fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {value}
      </span>
    </div>
  )
}