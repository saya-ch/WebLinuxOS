import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  GitBranch,
  GitCommit,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  created_at: string
  updated_at: string
  head_branch: string
  head_sha: string
  html_url: string
  run_number: number
  event: string
  actor: {
    login: string
    avatar_url: string
  }
}

interface PagesDeployment {
  url: string
  status: string
  created_at: string
  updated_at: string
  environment: string
  id: number
}

interface RepoInfo {
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  language: string
  updated_at: string
  pushed_at: string
}

// ─── API Configuration ────────────────────────────────────────────────────────

const GITHUB_API = 'https://api.github.com'
const OWNER = 'saya-ch'
const REPO = 'WebLinuxOS'
const CACHE_KEY = 'deploy-monitor-cache'
const CACHE_TTL = 60_000 // 1 minute

function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}-${key}`)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return data as T
  } catch {
    return null
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${CACHE_KEY}-${key}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // Storage full, ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeployMonitor() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([])
  const [pagesDeployment, setPagesDeployment] = useState<PagesDeployment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch repo info
      const repoCache = getCachedData<RepoInfo>('repo')
      if (repoCache && !force) {
        setRepoInfo(repoCache)
      } else {
        const repoResp = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}`)
        if (repoResp.ok) {
          const data = await repoResp.json()
          setRepoInfo(data)
          setCachedData('repo', data)
        }
      }

      // Fetch workflow runs
      const wfCache = getCachedData<WorkflowRun[]>('workflows')
      if (wfCache && !force) {
        setWorkflowRuns(wfCache)
      } else {
        const wfResp = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/actions/runs?per_page=15`)
        if (wfResp.ok) {
          const data = await wfResp.json()
          setWorkflowRuns(data.workflow_runs || [])
          setCachedData('workflows', data.workflow_runs || [])
        }
      }

      // Fetch Pages deployment
      const pgCache = getCachedData<PagesDeployment>('pages')
      if (pgCache && !force) {
        setPagesDeployment(pgCache)
      } else {
        const pgResp = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/pages`)
        if (pgResp.ok) {
          const data = await pgResp.json()
          setPagesDeployment(data)
          setCachedData('pages', data)
        } else if (pgResp.status === 404) {
          setPagesDeployment(null)
        }
      }

      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => fetchData(), 120_000)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchData])

  // ── Computed ──
  const latestRun = workflowRuns[0]
  const recentRuns = workflowRuns.slice(0, 10)

  const stats = useMemo(() => {
    const total = workflowRuns.length
    const success = workflowRuns.filter(r => r.conclusion === 'success').length
    const failure = workflowRuns.filter(r => r.conclusion === 'failure').length
    const pending = workflowRuns.filter(r => r.status === 'in_progress' || r.status === 'queued').length
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0'
    return { total, success, failure, pending, rate }
  }, [workflowRuns])

  // ── Styles ──
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  }

  const getStatusIcon = (conclusion: string | null, status: string) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
    }
    if (conclusion === 'success') return <CheckCircle size={16} style={{ color: '#10b981' }} />
    if (conclusion === 'failure') return <XCircle size={16} style={{ color: '#ef4444' }} />
    return <Clock size={16} style={{ color: '#6b7280' }} />
  }

  const getStatusColor = (conclusion: string | null, status: string) => {
    if (status === 'in_progress' || status === 'queued') return '#f59e0b'
    if (conclusion === 'success') return '#10b981'
    if (conclusion === 'failure') return '#ef4444'
    return '#6b7280'
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} 小时前`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay} 天前`
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      fontSize: 13,
      overflow: 'auto',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .dm-card:hover { border-color: rgba(136,136,136,0.3) !important; }
        .dm-link { color: #58a6ff; text-decoration: none; }
        .dm-link:hover { text-decoration: underline; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #238636, #2ea043)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            <GitBranch size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Deploy Monitor</div>
            <div style={{ fontSize: 11, color: '#8b949e' }}>{OWNER}/{REPO}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: '#8b949e',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: '#238636' }}
            />
            Auto
          </label>
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: '#21262d',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#c9d1d9',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 12,
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 16, flex: 1 }}>
        {error && (
          <div style={{
            ...cardStyle,
            borderColor: '#f8514933',
            background: '#f8514912',
            color: '#f85149',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}>
          {[
            { label: '部署状态', value: pagesDeployment?.status || 'unknown', color: pagesDeployment?.status === 'built' ? '#10b981' : '#f59e0b' },
            { label: '成功率', value: `${stats.rate}%`, color: '#58a6ff' },
            { label: '成功', value: String(stats.success), color: '#10b981' },
            { label: '失败', value: String(stats.failure), color: '#f85149' },
            { label: '进行中', value: String(stats.pending), color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} style={{
              ...cardStyle,
              textAlign: 'center',
              padding: '12px 8px',
            }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Pages URL + Repo Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Pages */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>GitHub Pages</div>
            {pagesDeployment ? (
              <div>
                <a
                  href={pagesDeployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dm-link"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, marginBottom: 6 }}
                >
                  {pagesDeployment.url} <ExternalLink size={12} />
                </a>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#8b949e' }}>
                  <span>环境: {pagesDeployment.environment}</span>
                  <span>更新: {formatTime(pagesDeployment.updated_at)}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#8b949e', fontSize: 12 }}>No pages deployment found</div>
            )}
          </div>

          {/* Repo */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>仓库信息</div>
            {repoInfo ? (
              <div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#f0883e' }}>★ {repoInfo.stargazers_count}</span>
                  <span style={{ color: '#8b949e' }}>⑂ {repoInfo.forks_count}</span>
                  <span style={{ color: '#8b949e' }}>◉ {repoInfo.open_issues_count} issues</span>
                </div>
                <div style={{ fontSize: 11, color: '#8b949e' }}>
                  分支: {repoInfo.default_branch} | 语言: {repoInfo.language || 'N/A'}
                </div>
              </div>
            ) : (
              <div style={{ color: '#8b949e', fontSize: 12 }}>Loading...</div>
            )}
          </div>
        </div>

        {/* Latest Run Highlight */}
        {latestRun && (
          <div style={{
            ...cardStyle,
            border: `1px solid ${getStatusColor(latestRun.conclusion, latestRun.status)}33`,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {getStatusIcon(latestRun.conclusion, latestRun.status)}
                <span style={{ fontWeight: 600, fontSize: 14 }}>Latest: {latestRun.name}</span>
                <span style={{
                  padding: '1px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  background: getStatusColor(latestRun.conclusion, latestRun.status) + '22',
                  color: getStatusColor(latestRun.conclusion, latestRun.status),
                  border: `1px solid ${getStatusColor(latestRun.conclusion, latestRun.status)}44`,
                }}>
                  {latestRun.conclusion || latestRun.status}
                </span>
              </div>
              <a
                href={latestRun.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="dm-link"
                style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                View <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#8b949e' }}>
              <span><GitCommit size={10} style={{ display: 'inline', marginRight: 2 }} />{latestRun.head_sha.slice(0, 7)}</span>
              <span>分支: {latestRun.head_branch}</span>
              <span>触发: {latestRun.event}</span>
              <span>运行 # {latestRun.run_number}</span>
              <span>{formatTime(latestRun.created_at)}</span>
            </div>
          </div>
        )}

        {/* Workflow Runs History */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b949e' }}>Workflow Runs</div>
            <span style={{ fontSize: 11, color: '#484f58' }}>最近 10 次</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="dm-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 120px 100px 80px',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  border: '1px solid transparent',
                  transition: 'border-color 0.15s',
                }}
              >
                {getStatusIcon(run.conclusion, run.status)}
                <div>
                  <div style={{ fontWeight: 500 }}>{run.name}</div>
                  <div style={{ fontSize: 11, color: '#484f58' }}>
                    #{run.run_number} · {run.head_sha.slice(0, 7)}
                  </div>
                </div>
                <div style={{ color: '#8b949e', fontSize: 11 }}>{run.head_branch}</div>
                <div style={{ color: '#8b949e', fontSize: 11 }}>{formatTime(run.created_at)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <a
                    href={run.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dm-link"
                    style={{ fontSize: 11 }}
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 11,
          color: '#484f58',
        }}>
          Last refresh: {lastRefresh.toLocaleTimeString()} · Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  )
}
