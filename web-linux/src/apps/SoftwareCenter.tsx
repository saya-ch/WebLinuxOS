import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'

interface AppExtra {
  id: string
  rating: number
  size: string
  sizeNum: number
  installed: boolean
  installing: boolean
  installProgress: number
  version: string
  updateAvailable: boolean
  description: string
  changelog: string
  permissions: string[]
  screenshots: string[]
}

const categories = [
  { id: 'all', name: '全部' },
  { id: 'system', name: '系统' },
  { id: 'office', name: '办公' },
  { id: 'internet', name: '网络' },
  { id: 'multimedia', name: '多媒体' },
  { id: 'utilities', name: '工具' },
  { id: 'development', name: '开发' },
  { id: 'games', name: '游戏' },
]

const CATEGORY_NAMES: Record<string, string> = {
  system: '系统', office: '办公', internet: '网络', multimedia: '多媒体',
  utilities: '工具', development: '开发', games: '游戏',
}

const DESCRIPTIONS: Record<string, string> = {
  system: '强大的系统管理工具，帮助您高效管理计算机资源和配置。',
  office: '专业的办公应用，提升您的工作效率和文档处理能力。',
  internet: '便捷的网络工具，让您畅享互联网带来的便利。',
  multimedia: '丰富的多媒体应用，满足您的音视频创作和欣赏需求。',
  utilities: '实用的工具集，简化日常操作和系统维护。',
  development: '专业的开发工具，助力您的编程和项目开发。',
  games: '经典休闲游戏，在工作之余放松身心。',
}

const PERMISSIONS_POOL = [
  '文件系统访问', '网络连接', '系统通知', '剪贴板读取',
  '屏幕截图', '音频输入/输出', '打印机访问', 'USB 设备',
  '蓝牙', '位置信息', '摄像头', '麦克风',
]

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateAppExtras(): AppExtra[] {
  return appRegistry.map((app, idx) => {
    const r1 = seededRandom(idx * 17 + 3)
    const r2 = seededRandom(idx * 31 + 7)
    const r3 = seededRandom(idx * 43 + 11)
    const r4 = seededRandom(idx * 59 + 13)
    const rating = Math.round((2.5 + r1 * 2.5) * 10) / 10
    const sizeNum = Math.round(5 + r2 * 495)
    const size = sizeNum >= 1000 ? `${(sizeNum / 1000).toFixed(1)} GB` : `${sizeNum} MB`
    const installed = r3 > 0.5
    const updateAvailable = installed && r4 > 0.7
    const permCount = 2 + Math.floor(r4 * 4)
    const perms = PERMISSIONS_POOL.slice(0, permCount)
    const desc = DESCRIPTIONS[app.category] || '功能齐全的应用程序。'
    const changelog = `v${(1 + Math.floor(r1 * 3))}.${Math.floor(r2 * 10)}.${Math.floor(r3 * 10)}\n- 性能优化和错误修复\n- 改进用户界面\n- 新增功能模块`
    const screenshots = [
      `hsl(${Math.floor(r1 * 360)}, 40%, 25%)`,
      `hsl(${Math.floor(r2 * 360)}, 40%, 25%)`,
      `hsl(${Math.floor(r3 * 360)}, 40%, 25%)`,
    ]
    return {
      id: app.id,
      rating,
      size,
      sizeNum,
      installed,
      installing: false,
      installProgress: 0,
      version: `${1 + Math.floor(r1 * 3)}.${Math.floor(r2 * 10)}.${Math.floor(r3 * 10)}`,
      updateAvailable,
      description: desc,
      changelog,
      permissions: perms,
      screenshots,
    }
  })
}

type SortMode = 'name' | 'rating' | 'size'
type TabMode = 'browse' | 'installed' | 'updates'

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ fontSize: 12, letterSpacing: 1 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span style={{ marginLeft: 4, color: '#a6adc8', fontSize: 11 }}>{rating}</span>
    </span>
  )
}

export default function SoftwareCenter() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [detailApp, setDetailApp] = useState<string | null>(null)
  const [tab, setTab] = useState<TabMode>('browse')
  const [sortMode, setSortMode] = useState<SortMode>('name')
  const [appExtras, setAppExtras] = useState<AppExtra[]>(() => generateAppExtras())
  const openApp = useStore((s) => s.openApp)

  const filtered = useMemo(() => {
    let apps = appRegistry.map((app) => {
      const extra = appExtras.find((e) => e.id === app.id)
      return { app, extra }
    })

    if (tab === 'installed') {
      apps = apps.filter(({ extra }) => extra?.installed)
    } else if (tab === 'updates') {
      apps = apps.filter(({ extra }) => extra?.updateAvailable)
    }

    if (tab === 'browse' && category !== 'all') {
      apps = apps.filter(({ app }) => app.category === category)
    }

    if (search) {
      apps = apps.filter(({ app }) => app.name.toLowerCase().includes(search.toLowerCase()))
    }

    apps.sort((a, b) => {
      if (sortMode === 'name') return a.app.name.localeCompare(b.app.name, 'zh')
      if (sortMode === 'rating') return (b.extra?.rating || 0) - (a.extra?.rating || 0)
      return (b.extra?.sizeNum || 0) - (a.extra?.sizeNum || 0)
    })

    return apps
  }, [appExtras, category, search, sortMode, tab])

  const featuredApps = useMemo(() => {
    const catIds = ['system', 'office', 'internet', 'multimedia', 'development', 'games']
    return catIds.map((cat) => {
      const catApps = appRegistry.filter((a) => a.category === cat)
      const featured = catApps[Math.floor(seededRandom(cat.charCodeAt(0)) * catApps.length)]
      const extra = appExtras.find((e) => e.id === featured?.id)
      return { cat, app: featured, extra }
    }).filter((f) => f.app)
  }, [appExtras])

  const detail = detailApp ? { app: appRegistry.find((a) => a.id === detailApp)!, extra: appExtras.find((e) => e.id === detailApp)! } : null

  const startInstall = (appId: string) => {
    setAppExtras((prev) => prev.map((e) => e.id === appId ? { ...e, installing: true, installProgress: 0 } : e))
  }

  const startUninstall = (appId: string) => {
    setAppExtras((prev) => prev.map((e) => e.id === appId ? { ...e, installing: true, installProgress: 0 } : e))
  }

  useEffect(() => {
    const installing = appExtras.filter((e) => e.installing)
    if (installing.length === 0) return
    const timer = setInterval(() => {
      setAppExtras((prev) => prev.map((e) => {
        if (!e.installing) return e
        const next = e.installProgress + (5 + Math.random() * 15)
        if (next >= 100) {
          return { ...e, installing: false, installProgress: 100, installed: !e.installed, updateAvailable: false }
        }
        return { ...e, installProgress: next }
      }))
    }, 200)
    return () => clearInterval(timer)
  }, [appExtras])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索应用..."
          style={{
            flex: 1, padding: '8px 12px', background: '#313244', border: '1px solid #45475a',
            borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none',
          }}
        />
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} style={{ background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', padding: '8px 10px', fontSize: '12px', outline: 'none' }}>
          <option value="name">按名称</option>
          <option value="rating">按评分</option>
          <option value="size">按大小</option>
        </select>
      </div>

      <div style={{ display: 'flex', padding: '8px 16px', gap: '6px', borderBottom: '1px solid #313244' }}>
        {(['browse', 'installed', 'updates'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: '16px', cursor: 'pointer',
              background: tab === t ? '#89b4fa' : '#313244',
              color: tab === t ? '#1e1e2e' : '#a6adc8', fontSize: '12px', whiteSpace: 'nowrap',
            }}
          >
            {t === 'browse' ? '浏览' : t === 'installed' ? '已安装' : '更新'}
            {t === 'updates' && <span style={{ marginLeft: 4, background: '#f38ba8', color: '#1e1e2e', borderRadius: 8, padding: '1px 6px', fontSize: 10 }}>{appExtras.filter((e) => e.updateAvailable).length}</span>}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div style={{ display: 'flex', padding: '6px 16px', gap: '6px', borderBottom: '1px solid #313244', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '5px 12px', border: 'none', borderRadius: '12px', cursor: 'pointer',
                background: category === cat.id ? '#89b4fa' : '#313244',
                color: category === cat.id ? '#1e1e2e' : '#a6adc8', fontSize: '11px', whiteSpace: 'nowrap',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === 'browse' && category === 'all' && !search && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#89b4fa' }}>分类推荐</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {featuredApps.map(({ cat, app, extra }) => (
                <div
                  key={cat}
                  onClick={() => app && setDetailApp(app.id)}
                  style={{
                    background: 'linear-gradient(135deg, #313244, #45475a)', borderRadius: 10, padding: 14,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid #585b70',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{app?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#89b4fa', marginBottom: 2 }}>{CATEGORY_NAMES[cat] || cat}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{app?.name}</div>
                    {extra && <StarRating rating={extra.rating} />}
                  </div>
                  <div style={{ fontSize: 11, color: '#a6adc8' }}>{extra?.size}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {filtered.map(({ app, extra }) => (
            <div
              key={app.id}
              onClick={() => setDetailApp(app.id)}
              style={{
                background: '#313244', borderRadius: 8, padding: 14, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                border: '1px solid #45475a', transition: 'background 0.15s', position: 'relative',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#313244')}
            >
              {extra?.installed && (
                <div style={{ position: 'absolute', top: 6, right: 6, background: '#a6e3a1', color: '#1e1e2e', fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>已安装</div>
              )}
              {extra?.updateAvailable && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: '#f9e2af', color: '#1e1e2e', fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>可更新</div>
              )}
              <span style={{ fontSize: 32 }}>{app.icon}</span>
              <div style={{ fontWeight: 600, fontSize: 13, textAlign: 'center' }}>{app.name}</div>
              {extra && <StarRating rating={extra.rating} />}
              <div style={{ fontSize: 11, color: '#6c7086' }}>{extra?.size}</div>
              {extra?.installing ? (
                <div style={{ width: '100%', height: 4, background: '#45475a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${extra.installProgress}%`, height: '100%', background: '#89b4fa', borderRadius: 2, transition: 'width 0.2s' }} />
                </div>
              ) : extra?.installed ? (
                <button
                  onClick={(e) => { e.stopPropagation(); openApp(app.id) }}
                  style={{ marginTop: 2, padding: '5px 16px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                >
                  打开
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); startInstall(app.id) }}
                  style={{ marginTop: 2, padding: '5px 16px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                >
                  安装
                </button>
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6c7086' }}>没有找到匹配的应用</div>
        )}
      </div>

      {detail && (
        <div
          onClick={() => setDetailApp(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e', borderRadius: 12, padding: 24, width: 440, maxHeight: '90%', overflow: 'auto',
              border: '1px solid #45475a',
            }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 48 }}>{detail.app.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', color: '#cdd6f4' }}>{detail.app.name}</h3>
                <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 4 }}>
                  {CATEGORY_NAMES[detail.app.category]} | v{detail.extra.version} | {detail.extra.size}
                </div>
                <StarRating rating={detail.extra.rating} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#89b4fa', marginBottom: 6 }}>截图预览</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {detail.extra.screenshots.map((color, i) => (
                  <div key={i} style={{ flex: 1, height: 80, background: color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#a6adc8' }}>
                    截图 {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#89b4fa', marginBottom: 6 }}>应用描述</div>
              <p style={{ fontSize: 13, color: '#bac2de', lineHeight: 1.7, margin: 0 }}>{detail.extra.description}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#89b4fa', marginBottom: 6 }}>更新日志</div>
              <div style={{ fontSize: 12, color: '#a6adc8', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: '#313244', padding: 10, borderRadius: 6 }}>{detail.extra.changelog}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#89b4fa', marginBottom: 6 }}>权限列表</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {detail.extra.permissions.map((p) => (
                  <span key={p} style={{ background: '#313244', padding: '3px 8px', borderRadius: 4, fontSize: 11, color: '#a6adc8' }}>{p}</span>
                ))}
              </div>
            </div>

            {detail.extra.installing && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: '100%', height: 6, background: '#45475a', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${detail.extra.installProgress}%`, height: '100%', background: '#89b4fa', borderRadius: 3, transition: 'width 0.2s' }} />
                </div>
                <div style={{ fontSize: 11, color: '#a6adc8', textAlign: 'center', marginTop: 4 }}>
                  {detail.extra.installProgress < 100 ? `安装中 ${Math.round(detail.extra.installProgress)}%` : '安装完成'}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {detail.extra.installed && !detail.extra.installing && (
                <>
                  <button
                    onClick={() => { openApp(detail.app.id); setDetailApp(null) }}
                    style={{ padding: '8px 20px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    打开
                  </button>
                  <button
                    onClick={() => startUninstall(detail.app.id)}
                    style={{ padding: '8px 20px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    卸载
                  </button>
                </>
              )}
              {!detail.extra.installed && !detail.extra.installing && (
                <button
                  onClick={() => startInstall(detail.app.id)}
                  style={{ padding: '8px 20px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  安装
                </button>
              )}
              <button
                onClick={() => setDetailApp(null)}
                style={{ padding: '8px 20px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
