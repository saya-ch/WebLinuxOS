import { useState, useCallback } from 'react'

interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  html_url: string
  public_repos: number
  followers: number
  following: number
  location: string | null
  company: string | null
  blog: string | null
  created_at: string
  type: string
  starred_url?: string
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  default_branch: string
  fork: boolean
}

interface NpmPackage {
  name: string
  'dist-tags': { latest?: string; [k: string]: string | undefined }
  description?: string
  license?: string
  author?: { name: string } | string
  maintainers?: { name: string; email?: string }[]
  versions?: Record<string, { dist?: { tarball?: string } }>
  time?: { created?: string; modified?: string }
  homepage?: string
  repository?: { url?: string; type?: string } | string
}

interface ServiceStatus {
  name: string
  url: string
  ok: boolean | null
  elapsed: number | null
  error?: string
}

const SERVICES_TO_CHECK: { name: string; url: string }[] = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'npm registry', url: 'https://registry.npmjs.org' },
  { name: 'npmjs.com', url: 'https://www.npmjs.com' },
  { name: 'Cloudflare Pages', url: 'https://pages.cloudflare.com' },
  { name: 'GitHub API', url: 'https://api.github.com' },
  { name: 'Google DNS (DoH)', url: 'https://dns.google/resolve?name=example.com' },
  { name: 'OpenStreetMap', url: 'https://nominatim.openstreetmap.org' },
  { name: 'jsDelivr CDN', url: 'https://cdn.jsdelivr.net' },
]

const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // ignore
  }
  return false
}

const DevOpsTools = () => {
  const [tab, setTab] = useState<'github' | 'status' | 'npm' | 'encode'>('github')

  // ============ GitHub ============
  const [ghUser, setGhUser] = useState('torvalds')
  const [ghUserInfo, setGhUserInfo] = useState<GitHubUser | null>(null)
  const [ghRepos, setGhRepos] = useState<GitHubRepo[] | null>(null)
  const [ghLoading, setGhLoading] = useState(false)
  const [ghError, setGhError] = useState<string | null>(null)

  // ============ 健康检查 ============
  const [statusResults, setStatusResults] = useState<ServiceStatus[]>([])
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // ============ npm ============
  const [npmPkg, setNpmPkg] = useState('react')
  const [npmInfo, setNpmInfo] = useState<NpmPackage | null>(null)
  const [npmLoading, setNpmLoading] = useState(false)
  const [npmError, setNpmError] = useState<string | null>(null)

  // ============ 编码工具 ============
  const [encInput, setEncInput] = useState('Hello, DevOps!')
  const [encError, setEncError] = useState<string | null>(null)

  // ---------- GitHub ----------
  const doGitHubLookup = useCallback(async () => {
    const username = ghUser.trim()
    if (!username) {
      setGhError('请输入 GitHub 用户名')
      return
    }
    setGhLoading(true)
    setGhError(null)
    setGhUserInfo(null)
    setGhRepos(null)
    try {
      const [userRes, repoRes] = await Promise.allSettled([
        fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
        fetch(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`
        ),
      ])

      if (userRes.status !== 'fulfilled' || !userRes.value.ok) {
        const status = userRes.status === 'fulfilled' ? userRes.value.status : 0
        throw new Error(
          status === 404 ? '用户不存在' : status ? `HTTP ${status}` : '网络请求失败'
        )
      }
      const userData: GitHubUser = await userRes.value.json()
      setGhUserInfo(userData)

      let repos: GitHubRepo[] = []
      if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
        repos = await repoRes.value.json()
      }
      const sorted = [...repos]
        .filter((r) => !r.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
      setGhRepos(sorted)
    } catch (e) {
      console.error('GitHub lookup error:', e)
      setGhError(e instanceof Error ? e.message : '查询失败，请检查网络')
    } finally {
      setGhLoading(false)
    }
  }, [ghUser])

  // ---------- 健康检查 ----------
  const doHealthCheck = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(null)
    setStatusResults([])

    const initial: ServiceStatus[] = SERVICES_TO_CHECK.map((s) => ({
      name: s.name,
      url: s.url,
      ok: null,
      elapsed: null,
    }))
    setStatusResults(initial)

    const running: ServiceStatus[] = [...initial]
    try {
      await Promise.all(
        SERVICES_TO_CHECK.map(async (svc, idx) => {
          const start = performance.now()
          try {
            await fetch(svc.url, {
              mode: 'no-cors',
              method: 'GET',
              cache: 'no-store',
            })
            const elapsed = Math.round(performance.now() - start)
            running[idx] = { ...running[idx], ok: true, elapsed }
            setStatusResults([...running])
          } catch (e) {
            const elapsed = Math.round(performance.now() - start)
            running[idx] = {
              ...running[idx], ok: false, elapsed, error: '连接失败或超时' }
            setStatusResults([...running])
          }
        })
      )
    } catch (e) {
      setStatusError('健康检查发生异常')
    } finally {
      setStatusLoading(false)
    }
  }, [])

  // ---------- npm 查询 ----------
  const doNpmLookup = useCallback(async () => {
    const pkg = npmPkg.trim()
    if (!pkg) {
      setNpmError('请输入 npm 包名')
      return
    }
    setNpmLoading(true)
    setNpmError(null)
    setNpmInfo(null)
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('包不存在')
        throw new Error(`HTTP ${res.status}`)
      }
      const data: NpmPackage = await res.json()
      setNpmInfo(data)
    } catch (e) {
      console.error('npm lookup error:', e)
      setNpmError(e instanceof Error ? e.message : '查询失败，请检查网络')
    } finally {
      setNpmLoading(false)
    }
  }, [npmPkg])

  // ---------- 编码工具函数 ----------
  const toBase64 = useCallback((s: string) => {
    try {
      return btoa(unescape(encodeURIComponent(s)))
    } catch {
      return ''
    }
  }, [])

  const fromBase64 = useCallback((s: string) => {
    try {
      return decodeURIComponent(escape(atob(s)))
    } catch {
      return ''
    }
  }, [])

  const toHex = useCallback((s: string) => {
    try {
      const bytes = new TextEncoder().encode(s)
      let out = ''
      for (let i = 0; i < bytes.length; i++) {
        out += bytes[i].toString(16).padStart(2, '0')
      }
      return out
    } catch {
      return ''
    }
  }, [])

  const fromHex = useCallback((s: string) => {
    try {
      const cleaned = s.replace(/\s+/g, '')
      if (cleaned.length % 2 !== 0) throw new Error('hex 长度必须为偶数')
      if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new Error('包含非 hex 字符')
      const bytes = new Uint8Array(cleaned.length / 2)
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16)
      }
      return new TextDecoder().decode(bytes)
    } catch {
      return ''
    }
  }, [])

  // ---------- 渲染 ----------
  return (
    <div
      style={{
        height: '100%',
        background: 'linear-gradient(135deg, #18181b 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#f4f4f5',
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          🛠️ DevOps 工具箱
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          GitHub Profile · 服务健康检查 · npm 包信息 · 编码转换工具
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 16,
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: 12,
          }}
        >
          {(
            [
                ['github', '🐙 GitHub Profile'],
                ['status', '🩺 服务健康'],
                ['npm', '📦 npm 包'],
                ['encode', '🔐 编码工具'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  padding: '8px 14px',
                  background: tab === k ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)',
                  color: tab === k ? '#e9d5ff' : '#f4f4f5',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {label}
              </button>
            ))}
        </div>

        {/* GitHub */}
        {tab === 'github' && (
          <>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.55)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    GitHub 用户名
                  </label>
                  <input
                    value={ghUser}
                    onChange={(e) => setGhUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doGitHubLookup()}
                    placeholder="torvalds"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  onClick={doGitHubLookup}
                  disabled={ghLoading}
                  style={{
                    padding: '10px 20px',
                    background: ghLoading ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.3)',
                    color: '#f5d0fe',
                    border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: ghLoading ? 'wait' : 'pointer',
                  }}
                >
                  {ghLoading ? '查询中...' : '🔍 查询'}
                </button>
              </div>
            </div>

            {ghError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#fca5a5',
                  marginBottom: 16,
                }}
              >
                ⚠️ {ghError}
              </div>
            )}

            {ghLoading && !ghUserInfo && (
              <div
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#e9d5ff',
                  textAlign: 'center',
                }}
              >
                正在获取数据...
              </div>
            )}

            {ghUserInfo && (
              <>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <img
                      src={ghUserInfo.avatar_url}
                      alt={ghUserInfo.login}
                      style={{ width: 96, height: 96, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.4)' }}
                    />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {ghUserInfo.name || ghUserInfo.login}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                        @{ghUserInfo.login} · {ghUserInfo.type}
                      </div>
                      {ghUserInfo.bio && (
                        <div style={{ fontSize: 13, color: '#d4d4d8', marginBottom: 12 }}>{ghUserInfo.bio}</div>
                      )}
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                        <span>📦 {ghUserInfo.public_repos} 公开仓库</span>
                        <span>👥 {ghUserInfo.followers} 关注者</span>
                        <span>🚶 {ghUserInfo.following} 正在关注</span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {ghUserInfo.location && <span>📍 {ghUserInfo.location}</span>}
                        {ghUserInfo.company && <span>🏢 {ghUserInfo.company}</span>}
                        {ghUserInfo.blog && (
                          <a href={ghUserInfo.blog.startsWith('http') ? ghUserInfo.blog : `https://${ghUserInfo.blog}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: '#a78bfa', textDecoration: 'none' }}>
                            🔗 {ghUserInfo.blog}
                          </a>
                        )}
                        <span>📅 创建于 {new Date(ghUserInfo.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <a
                          href={ghUserInfo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: 'rgba(168,85,247,0.25)',
                            color: '#e9d5ff',
                            border: '1px solid rgba(168,85,247,0.4)',
                            borderRadius: 6,
                            fontSize: 12,
                            textDecoration: 'none',
                          }}
                        >
                          🔗 打开 GitHub 主页
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {ghRepos && ghRepos.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#fff' }}>
                      ⭐ Top 10 仓库（按 Stars 排序）
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ghRepos.map((repo) => (
                        <div
                          key={repo.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 8,
                            gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e9d5ff', marginBottom: 4 }}>
                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#e9d5ff', textDecoration: 'none' }}
                              >
                                {repo.name}
                              </a>
                            </div>
                            {repo.description && (
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, wordBreak: 'break-word' }}>
                                {repo.description}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                              {repo.language && <span>🔤 {repo.language}</span>}
                              <span>⭐ {repo.stargazers_count}</span>
                              <span>🍴 {repo.forks_count}</span>
                              <span>🕒 更新于 {new Date(repo.updated_at).toLocaleDateString('zh-CN')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ghRepos && ghRepos.length === 0 && !ghLoading && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.6)',
                      textAlign: 'center',
                    }}
                  >
                    该用户没有公开仓库
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Status Check */}
        {tab === 'status' && (
          <>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  通过 <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>fetch (no-cors)</code> 检查常见公开服务连通性
                </div>
                <button
                  onClick={doHealthCheck}
                  disabled={statusLoading}
                  style={{
                    padding: '10px 20px',
                    background: statusLoading ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.35)',
                    color: '#dcfce7',
                    border: '1px solid rgba(34,197,94,0.4)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: statusLoading ? 'wait' : 'pointer',
                  }}
                >
                  {statusLoading ? '检查中...' : '🔄 开始检查'}
                </button>
              </div>
            </div>

            {statusError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#fca5a5',
                  marginBottom: 16,
                }}
              >
                ⚠️ {statusError}
              </div>
            )}

            {statusResults.length > 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {statusResults.map((s) => (
                    <div
                      key={s.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 8,
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background:
                              s.ok === null
                                ? '#facc15'
                                : s.ok
                                ? '#4ade80'
                                : '#f87171',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginTop: 2 }}>
                            {s.url}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {s.ok === null ? (
                          <span style={{ fontSize: 12, color: '#facc15' }}>检查中...</span>
                        ) : s.ok ? (
                          <>
                            <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>✅ 可达</div>
                            {s.elapsed !== null && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                {s.elapsed} ms
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>❌ 失败</div>
                            {s.elapsed !== null && (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                {s.elapsed} ms
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!statusLoading && statusResults.length === 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 24,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                点击上方按钮开始检查服务健康状态
              </div>
            )}
          </>
        )}

        {/* npm */}
        {tab === 'npm' && (
          <>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.55)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    npm 包名
                  </label>
                  <input
                    value={npmPkg}
                    onChange={(e) => setNpmPkg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doNpmLookup()}
                    placeholder="react"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  onClick={doNpmLookup}
                  disabled={npmLoading}
                  style={{
                    padding: '10px 20px',
                    background: npmLoading ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.3)',
                    color: '#fed7aa',
                    border: '1px solid rgba(251,146,60,0.4)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: npmLoading ? 'wait' : 'pointer',
                  }}
                >
                  {npmLoading ? '查询中...' : '📦 查询'}
                </button>
              </div>
            </div>

            {npmError && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#fca5a5',
                  marginBottom: 16,
                }}
              >
                ⚠️ {npmError}
              </div>
            )}

            {npmLoading && !npmInfo && (
              <div
                style={{
                  background: 'rgba(251,146,60,0.08)',
                  border: '1px solid rgba(251,146,60,0.2)',
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#fed7aa',
                  textAlign: 'center',
                }}
              >
                正在获取包信息...
              </div>
            )}

            {npmInfo && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  {npmInfo.name}
                </div>
                {npmInfo['dist-tags']?.latest && (
                  <div style={{ fontSize: 12, color: '#fb923c', marginBottom: 12 }}>
                    latest: v{npmInfo['dist-tags'].latest}
                  </div>
                )}
                {npmInfo.description && (
                  <div style={{ fontSize: 13, color: '#d4d4d8', marginBottom: 16 }}>
                    {npmInfo.description}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {npmInfo.license && (
                    <InfoRow label="许可证" value={typeof npmInfo.license === 'string' ? npmInfo.license : 'N/A'} />
                  )}
                  {npmInfo.author && (
                    <InfoRow
                      label="作者"
                      value={typeof npmInfo.author === 'string' ? npmInfo.author : npmInfo.author?.name || 'N/A'}
                    />
                  )}
                  {npmInfo.maintainers && npmInfo.maintainers.length > 0 && (
                    <InfoRow
                      label="维护者"
                      value={npmInfo.maintainers.slice(0, 3).map((m) => m.name).join(', ')}
                    />
                  )}
                  {npmInfo.time?.created && (
                    <InfoRow label="创建时间" value={new Date(npmInfo.time.created).toLocaleDateString('zh-CN')} />
                  )}
                  {npmInfo.time?.modified && (
                    <InfoRow label="最后更新" value={new Date(npmInfo.time.modified).toLocaleDateString('zh-CN')} />
                  )}
                </div>

                {(() => {
                  const latest = npmInfo['dist-tags']?.latest
                  const tarball = latest ? npmInfo.versions?.[latest]?.dist?.tarball : undefined
                  const homepage = typeof npmInfo.homepage
                    ? npmInfo.homepage
                    : typeof npmInfo.repository === 'string'
                    ? npmInfo.repository
                    : npmInfo.repository?.url
                  return (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      {tarball && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 10,
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.7)',
                            wordBreak: 'break-all',
                          }}
                        >
                          <span style={{ fontWeight: 600, flexShrink: 0 }}>📦 tarball:</span>
                          <code
                            style={{
                              flex: 1,
                              background: 'rgba(0,0,0,0.3)',
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              color: '#d4d4d8',
                              fontFamily: 'monospace',
                            }}
                          >
                            {tarball}
                          </code>
                          <button
                            onClick={async () => {
                              const ok = await copyText(tarball)
                              if (!ok) setEncError('复制失败（可能由于浏览器权限）')
                            }}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(168,85,247,0.2)',
                              color: '#e9d5ff',
                              border: '1px solid rgba(168,85,247,0.3)',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            复制
                          </button>
                        </div>
                      )}
                      {homepage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>
                          <span style={{ fontWeight: 600, flexShrink: 0 }}>🔗 主页:</span>
                          <a
                            href={homepage.startsWith('http') ? homepage : `https://${homepage}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#a78bfa', textDecoration: 'none', fontFamily: 'monospace' }}
                          >
                            {homepage}
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}

        {/* Encode tools */}
        {tab === 'encode' && (
          <>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.55)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                输入文本
              </label>
              <textarea
                value={encInput}
                onChange={(e) => setEncInput(e.target.value)}
                placeholder="输入要编码/解码的文本..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: 100,
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
              {encError && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#fca5a5',
                  }}
                >
                  ⚠️ {encError}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              <EncodeCard title="Base64 编码" value={toBase64(encInput)} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
              <EncodeCard title="Base64 解码" value={fromBase64(encInput)} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
              <EncodeCard title="URL 编码" value={encodeURIComponent(encInput)} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
              <EncodeCard title="URL 解码" value={(() => { try { return decodeURIComponent(encInput) } catch { return '(解码失败: 输入可能不是合法的 URL 编码)' } })()} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
              <EncodeCard title="Hex (16 进制)" value={toHex(encInput)} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
              <EncodeCard title="Hex 解码" value={(() => { const r = fromHex(encInput); return r || '(解码失败: 输入可能不是合法的 hex 字符串)' })()} onCopy={async (v) => {
                const ok = await copyText(v)
                if (!ok) setEncError('复制失败')
              }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: '10px 12px',
    }}
  >
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#fff', wordBreak: 'break-word' }}>{value}</div>
  </div>
)

const EncodeCard = ({
  title,
  value,
  onCopy,
}: {
  title: string
  value: string
  onCopy: (v: string) => void
}) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 14,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e9d5ff' }}>{title}</div>
      <button
        onClick={() => onCopy(value)}
        style={{
          padding: '4px 10px',
          background: 'rgba(168,85,247,0.2)',
          color: '#e9d5ff',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 6,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        复制
      </button>
    </div>
    <pre
      style={{
      margin: 0,
      fontSize: 12,
      fontFamily: 'monospace',
      color: '#d4d4d8',
      background: 'rgba(0,0,0,0.3)',
      padding: '10px 12px',
      borderRadius: 8,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      minHeight: 40,
      overflowX: 'auto',
    }}
    >
      {value || '(空)'}
    </pre>
  </div>
)

export default DevOpsTools
