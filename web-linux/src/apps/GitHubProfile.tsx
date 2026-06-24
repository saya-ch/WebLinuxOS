import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  html_url: string
  name?: string
  company?: string
  blog?: string
  location?: string
  bio?: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description?: string
  fork: boolean
  private: boolean
  stargazers_count: number
  watchers_count: number
  language?: string
  forks_count: number
  open_issues_count: number
  size: number
  default_branch: string
  updated_at: string
  pushed_at: string
  topics?: string[]
  license?: { spdx_id?: string; name?: string }
  archived: boolean
  disabled: boolean
}

interface GitHubEvent {
  id: string
  type: string
  created_at: string
  repo: { id: number; name: string; url: string }
  payload: {
    ref?: string
    ref_type?: string
    commits?: Array<{ sha: string; message: string; url: string }>
    action?: string
    number?: number
    pull_request?: { title: string; html_url: string }
  }
}

type SortKey = 'updated' | 'stars' | 'forks' | 'name'
type FilterKey = 'all' | 'sources' | 'forks' | 'archived'

// ==================== 颜色 ====================
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00B4AB',
  Lua: '#000080',
}

function langColor(lang?: string): string {
  if (!lang) return '#8b949e'
  return LANGUAGE_COLORS[lang] ?? '#8b949e'
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec} 秒前`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)} 天前`
  if (sec < 86400 * 365) return `${Math.floor(sec / (86400 * 30))} 月前`
  return `${Math.floor(sec / (86400 * 365))} 年前`
}

function eventLabel(ev: GitHubEvent): string {
  switch (ev.type) {
    case 'PushEvent':
      return `推送了 ${ev.payload.commits?.length ?? 0} 个提交到`
    case 'CreateEvent':
      return ev.payload.ref_type === 'branch' ? '创建了分支' : '创建了仓库'
    case 'DeleteEvent':
      return '删除了分支'
    case 'WatchEvent':
      return 'star 了'
    case 'ForkEvent':
      return 'fork 了'
    case 'PullRequestEvent':
      return ev.payload.action === 'opened' ? '提交了 PR 到' : `${ev.payload.action} 了 PR 在`
    case 'IssuesEvent':
      return `${ev.payload.action} 了 issue 在`
    case 'ReleaseEvent':
      return '发布了版本在'
    case 'PublicEvent':
      return '将仓库设为公开'
    default:
      return ev.type
  }
}

// ==================== 主组件 ====================
const GitHubProfile = () => {
  const [input, setInput] = useState('')
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [events, setEvents] = useState<GitHubEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>('updated')
  const [filterBy, setFilterBy] = useState<FilterKey>('all')
  const [tab, setTab] = useState<'repos' | 'activity'>('repos')
  const [activeLang, setActiveLang] = useState<string | null>(null)

  const addNotification = useStore((s) => s.addNotification)

  const fetchProfile = useCallback(
    async (login: string) => {
      const name = login.trim()
      if (!name) return
      setLoading(true)
      setError(null)
      setUser(null)
      setRepos([])
      setEvents([])
      try {
        const headers: HeadersInit = { Accept: 'application/vnd.github+json' }
        const [uRes, rRes, eRes] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(name)}`, { headers }),
          fetch(
            `https://api.github.com/users/${encodeURIComponent(name)}/repos?per_page=100&sort=updated`,
            { headers }
          ),
          fetch(`https://api.github.com/users/${encodeURIComponent(name)}/events/public?per_page=30`, {
            headers,
          }),
        ])

        if (uRes.status === 404) {
          setError(`用户 "${name}" 不存在`)
          return
        }
        if (uRes.status === 403) {
          setError('请求频率超限（GitHub 限制每小时 60 次匿名请求）。请稍后重试。')
          return
        }
        if (!uRes.ok) throw new Error(`HTTP ${uRes.status}`)

        const u: GitHubUser = await uRes.json()
        setUser(u)

        if (rRes.ok) {
          const r: GitHubRepo[] = await rRes.json()
          setRepos(r)
        }
        if (eRes.ok) {
          const e: GitHubEvent[] = await eRes.json()
          setEvents(e)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '请求失败'
        setError(`获取失败：${msg}`)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 加载后端真实上次访问
  useEffect(() => {
    try {
      const last = localStorage.getItem('weblinux-gh-last-user')
      if (last) {
        setInput(last)
        fetchProfile(last)
      }
    } catch {
      // 忽略
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(() => {
    const name = input.trim()
    if (!name) return
    try {
      localStorage.setItem('weblinux-gh-last-user', name)
    } catch {
      // 忽略
    }
    fetchProfile(name)
  }, [input, fetchProfile])

  // 复制资料
  const copyProfile = useCallback(async () => {
    if (!user) return
    const text = `${user.name || user.login} (${user.login})\n` +
      `${user.bio || ''}\n` +
      `Repos: ${user.public_repos} · Followers: ${user.followers} · Following: ${user.following}\n` +
      `${user.html_url}`
    try {
      await navigator.clipboard.writeText(text)
      addNotification({ title: '已复制', message: '用户资料已复制到剪贴板', type: 'success', duration: 1800 })
    } catch {
      addNotification({ title: '复制失败', message: '浏览器拒绝访问剪贴板', type: 'error', duration: 2000 })
    }
  }, [user, addNotification])

  // 排序 + 过滤
  const filteredRepos = useMemo(() => {
    let list = repos
    if (filterBy === 'sources') list = list.filter((r) => !r.fork)
    else if (filterBy === 'forks') list = list.filter((r) => r.fork)
    else if (filterBy === 'archived') list = list.filter((r) => r.archived)

    if (activeLang) list = list.filter((r) => r.language === activeLang)

    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stargazers_count - a.stargazers_count
        case 'forks':
          return b.forks_count - a.forks_count
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
    return sorted
  }, [repos, sortBy, filterBy, activeLang])

  // 语言聚合
  const languageStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of repos) {
      if (r.language) map.set(r.language, (map.get(r.language) ?? 0) + 1)
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0)
    return Array.from(map.entries())
      .map(([lang, count]) => ({ lang, count, percent: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [repos])

  return (
    <div
      style={{
        height: '100%',
        background: '#0d1117',
        color: '#c9d1d9',
        overflow: 'auto',
      }}
    >
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {/* 搜索栏 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            placeholder="输入 GitHub 用户名..."
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 6,
              color: '#c9d1d9',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#238636',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '加载中…' : '查看'}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(248,81,73,0.1)',
              border: '1px solid rgba(248,81,73,0.4)',
              padding: 14,
              borderRadius: 8,
              fontSize: 13,
              color: '#ff7b72',
              marginBottom: 16,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {loading && !user && (
          <div style={{ textAlign: 'center', padding: 80, color: '#8b949e', fontSize: 14 }}>
            正在拉取 GitHub 数据…
          </div>
        )}

        {user && (
          <>
            {/* 个人信息卡 */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 10,
                padding: 20,
                marginBottom: 16,
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  border: '1px solid #30363d',
                }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f0f6fc' }}>
                    {user.name || user.login}
                  </h1>
                  <span style={{ fontSize: 16, color: '#8b949e' }}>@{user.login}</span>
                  {user.html_url && (
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        padding: '3px 8px',
                        background: '#21262d',
                        border: '1px solid #30363d',
                        borderRadius: 4,
                        color: '#c9d1d9',
                        textDecoration: 'none',
                      }}
                    >
                      在 GitHub 查看 ↗
                    </a>
                  )}
                </div>
                {user.bio && <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#c9d1d9' }}>{user.bio}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#8b949e', marginTop: 10 }}>
                  {user.company && <span>🏢 {user.company}</span>}
                  {user.location && <span>📍 {user.location}</span>}
                  {user.blog && (
                    <span>
                      🔗{' '}
                      <a
                        href={user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#58a6ff', textDecoration: 'none' }}
                      >
                        {user.blog}
                      </a>
                    </span>
                  )}
                  <span>📅 加入于 {formatDate(user.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignSelf: 'flex-start' }}>
                <Stat label="仓库" value={user.public_repos} />
                <Stat label="关注者" value={user.followers} />
                <Stat label="正在关注" value={user.following} />
              </div>
            </div>

            {/* 语言分布 */}
            {languageStats.length > 0 && (
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc' }}>语言分布</div>
                  {activeLang && (
                    <button
                      onClick={() => setActiveLang(null)}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        background: 'transparent',
                        color: '#58a6ff',
                        border: '1px solid #30363d',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      清除筛选 ({activeLang})
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 12,
                    background: '#21262d',
                  }}
                >
                  {languageStats.map(({ lang, percent }) => (
                    <div
                      key={lang}
                      title={`${lang}: ${percent.toFixed(1)}%`}
                      style={{ width: percent + '%', background: langColor(lang) }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {languageStats.slice(0, 12).map(({ lang, percent }) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(activeLang === lang ? null : lang)}
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        background: activeLang === lang ? langColor(lang) : '#21262d',
                        color: activeLang === lang ? '#fff' : '#c9d1d9',
                        border: '1px solid ' + (activeLang === lang ? langColor(lang) : '#30363d'),
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: langColor(lang),
                          display: 'inline-block',
                        }}
                      />
                      {lang} <span style={{ opacity: 0.6 }}>{percent.toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 标签页 */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #30363d', marginBottom: 16, flexWrap: 'wrap' }}>
              {(
                [
                  ['repos', `📁 仓库 (${filteredRepos.length})`],
                  ['activity', `📡 活动`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: tab === k ? '#f0f6fc' : '#8b949e',
                    border: 'none',
                    borderBottom: '2px solid ' + (tab === k ? '#f78166' : 'transparent'),
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'repos' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#8b949e' }}>排序：</span>
                  {(
                    [
                      ['updated', '最近更新'],
                      ['stars', 'Star 数'],
                      ['forks', 'Fork 数'],
                      ['name', '名称'],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setSortBy(k)}
                      style={filterBtnStyle(sortBy === k)}
                    >
                      {label}
                    </button>
                  ))}
                  <span style={{ width: 16 }} />
                  <span style={{ fontSize: 12, color: '#8b949e' }}>类型：</span>
                  {(
                    [
                      ['all', '全部'],
                      ['sources', '仅源代码'],
                      ['forks', '仅 Fork'],
                      ['archived', '已归档'],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setFilterBy(k)}
                      style={filterBtnStyle(filterBy === k)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredRepos.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 60,
                      color: '#8b949e',
                      fontSize: 13,
                      background: '#161b22',
                      border: '1px dashed #30363d',
                      borderRadius: 8,
                    }}
                  >
                    没有匹配的仓库
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredRepos.map((repo) => (
                      <RepoCard key={repo.id} repo={repo} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'activity' && (
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 30, color: '#8b949e', fontSize: 13 }}>
                    暂无公开活动
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {events.map((ev) => (
                      <li
                        key={ev.id}
                        style={{
                          padding: '10px 0',
                          borderBottom: '1px solid #21262d',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#58a6ff',
                            marginTop: 8,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13 }}>
                            {eventLabel(ev)}{' '}
                            <a
                              href={`https://github.com/${ev.repo.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }}
                            >
                              {ev.repo.name}
                            </a>
                          </div>
                          {ev.type === 'PushEvent' && ev.payload.commits && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#8b949e',
                                marginTop: 4,
                                fontFamily: 'monospace',
                                background: '#0d1117',
                                padding: 6,
                                borderRadius: 4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ev.payload.commits[0].message.split('\n')[0]}
                            </div>
                          )}
                          {ev.type === 'PullRequestEvent' && ev.payload.pull_request && (
                            <div
                              style={{
                                fontSize: 12,
                                color: '#c9d1d9',
                                marginTop: 4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              “{ev.payload.pull_request.title}”
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#6e7681', whiteSpace: 'nowrap' }}>
                          {relTime(ev.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <button
                onClick={copyProfile}
                style={{
                  padding: '8px 16px',
                  background: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                复制用户摘要
              </button>
            </div>
          </>
        )}

        {!loading && !user && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: '#8b949e',
              fontSize: 13,
              background: '#161b22',
              border: '1px dashed #30363d',
              borderRadius: 8,
            }}
          >
            输入任意 GitHub 用户名查看其公开资料、仓库与最近活动。
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#6e7681',
            marginTop: 20,
            padding: 12,
          }}
        >
          数据来源：GitHub 公开 REST API（匿名访问限制：60 次/小时/IP）。
        </div>
      </div>
    </div>
  )
}

// ==================== 组件 ====================
const Stat = ({ label, value }: { label: string; value: number }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc' }}>{formatNum(value)}</div>
    <div style={{ fontSize: 11, color: '#8b949e' }}>{label}</div>
  </div>
)

const RepoCard = ({ repo }: { repo: GitHubRepo }) => (
  <div
    style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 8,
      padding: 16,
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#58a6ff'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#30363d'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#58a6ff',
          textDecoration: 'none',
        }}
      >
        {repo.name}
      </a>
      {repo.private ? (
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            background: 'rgba(248,81,73,0.15)',
            color: '#ff7b72',
            border: '1px solid rgba(248,81,73,0.3)',
            borderRadius: 12,
          }}
        >
          Private
        </span>
      ) : (
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            background: 'rgba(56,139,253,0.15)',
            color: '#79c0ff',
            border: '1px solid rgba(56,139,253,0.3)',
            borderRadius: 12,
          }}
        >
          Public
        </span>
      )}
      {repo.fork && (
        <span style={{ fontSize: 10, color: '#8b949e', padding: '1px 6px', border: '1px solid #30363d', borderRadius: 12 }}>
          Fork
        </span>
      )}
      {repo.archived && (
        <span
          style={{
            fontSize: 10,
            color: '#d29922',
            padding: '1px 6px',
            border: '1px solid rgba(210,153,34,0.3)',
            borderRadius: 12,
          }}
        >
          Archived
        </span>
      )}
    </div>
    {repo.description && (
      <div style={{ fontSize: 13, color: '#c9d1d9', marginBottom: 10, lineHeight: 1.5 }}>{repo.description}</div>
    )}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#8b949e', alignItems: 'center' }}>
      {repo.language && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: langColor(repo.language),
              display: 'inline-block',
            }}
          />
          {repo.language}
        </span>
      )}
      <span>⭐ {formatNum(repo.stargazers_count)}</span>
      <span>🍴 {formatNum(repo.forks_count)}</span>
      <span>更新于 {relTime(repo.updated_at)}</span>
      {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && <span>{repo.license.spdx_id}</span>}
    </div>
  </div>
)

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    background: active ? '#21262d' : 'transparent',
    color: active ? '#f0f6fc' : '#8b949e',
    border: '1px solid ' + (active ? '#58a6ff' : '#30363d'),
    borderRadius: 12,
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

export default GitHubProfile
