import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { CameraIcon, ExternalLinkIcon, DownloadIcon, TrashIcon } from '../icons'

/**
 * WebSnapshot — 网页快照分析工具
 *
 * 基于 microlink.io 免费 API 抓取任意网页的截图与元数据。
 *  - 输入 URL 即可获得：截图、标题、描述、favicon、OG image、作者、语言、发布日期
 *  - 三种设备视口：桌面 / 平板 / 手机
 *  - 对比模式：并排查看两个快照
 *  - 收藏 / 历史 / 下载截图
 *  - 全部数据持久化到 localStorage
 *
 * microlink.io 免费层：每分钟 50 请求、每天 50 请求（足够个人使用），支持 CORS。
 */

type Device = 'desktop' | 'tablet' | 'mobile'

interface Snapshot {
  id: string
  url: string
  title: string
  description: string
  image: string | null
  logo: string | null
  screenshot: string | null
  author: string | null
  publisher: string | null
  lang: string | null
  date: string | null
  device: Device
  createdAt: number
  favorite?: boolean
  error?: string
}

const STORAGE_KEY = 'weblinux-websnapshot-history'

const DEVICE_VIEWPORT: Record<Device, { width: number; height: number; label: string }> = {
  desktop: { width: 1440, height: 900, label: '桌面' },
  tablet: { width: 768, height: 1024, label: '平板' },
  mobile: { width: 375, height: 812, label: '手机' },
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function loadHistory(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveHistory(history: Snapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)))
  } catch {
    /* ignore */
  }
}

async function fetchSnapshot(url: string, device: Device): Promise<Snapshot> {
  const viewport = DEVICE_VIEWPORT[device]
  const apiUrl = new URL('https://api.microlink.io/')
  apiUrl.searchParams.set('url', url)
  apiUrl.searchParams.set('screenshot', 'true')
  apiUrl.searchParams.set('meta', 'true')
  apiUrl.searchParams.set('viewport', `${viewport.width}x${viewport.height}`)
  apiUrl.searchParams.set('wait', '1')
  apiUrl.searchParams.set('adblock', 'true')

  const response = await fetch(apiUrl.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'microlink 返回失败状态')
  }
  const d = json.data
  return {
    id: uid(),
    url: d.url || url,
    title: d.title || url,
    description: d.description || '',
    image: d.image?.url || (typeof d.image === 'string' ? d.image : null),
    logo: d.logo?.url || (typeof d.logo === 'string' ? d.logo : null),
    screenshot: d.screenshot?.url || null,
    author: d.author || null,
    publisher: d.publisher || null,
    lang: d.lang || null,
    date: d.date || null,
    device,
    createdAt: Date.now(),
  }
}

function WebSnapshot() {
  const [urlInput, setUrlInput] = useState('')
  const [device, setDevice] = useState<Device>('desktop')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Snapshot[]>(() => loadHistory())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const activeSnapshot = useMemo(
    () => history.find((s) => s.id === activeId) || null,
    [history, activeId],
  )

  const compareSnapshots = useMemo(
    () => compareIds.map((id) => history.find((s) => s.id === id)).filter(Boolean) as Snapshot[],
    [compareIds, history],
  )

  const filteredHistory = useMemo(() => {
    return history.filter((s) => {
      if (filterFavorite && !s.favorite) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = (s.url + ' ' + s.title + ' ' + (s.description || '')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [history, filterFavorite, search])

  const handleCapture = useCallback(async () => {
    const url = normalizeUrl(urlInput)
    if (!url) {
      setToast({ msg: '请输入 URL', type: 'error' })
      return
    }
    if (loading) return

    setLoading(true)
    setError('')
    try {
      const snapshot = await fetchSnapshot(url, device)
      setHistory((prev) => [snapshot, ...prev].slice(0, 100))
      setActiveId(snapshot.id)
      setToast({ msg: '快照已生成', type: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`抓取失败：${msg}。可能原因：URL 无效、目标站点限制访问、或 microlink.io 速率限制。`)
      setToast({ msg: '抓取失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [urlInput, device, loading])

  const handleDelete = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((s) => s.id !== id))
      if (activeId === id) setActiveId(null)
      setCompareIds((prev) => prev.filter((x) => x !== id))
      setToast({ msg: '已删除', type: 'info' })
    },
    [activeId],
  )

  const toggleFavorite = useCallback((id: string) => {
    setHistory((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
    )
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }, [])

  const downloadImage = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)
      setToast({ msg: '已下载', type: 'success' })
    } catch {
      // 跨域时回退到新窗口打开
      window.open(url, '_blank')
      setToast({ msg: '已在新窗口打开（无法直接下载）', type: 'info' })
    }
  }, [])

  const exportAll = useCallback(() => {
    const data = JSON.stringify(history, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `websnapshot-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast({ msg: '已导出全部历史', type: 'success' })
  }, [history])

  return (
    <div style={styles.container}>
      {/* 顶部输入栏 */}
      <div style={styles.topBar}>
        <div style={styles.inputGroup}>
          <CameraIcon size={18} />
          <input
            style={styles.urlInput}
            placeholder="输入网页 URL，例如 example.com 或 https://github.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCapture()
            }}
            disabled={loading}
          />
        </div>
        <div style={styles.deviceSwitch}>
          {(Object.keys(DEVICE_VIEWPORT) as Device[]).map((d) => (
            <button
              key={d}
              style={{
                ...styles.deviceBtn,
                ...(device === d ? styles.deviceBtnActive : {}),
              }}
              onClick={() => setDevice(d)}
              title={`${DEVICE_VIEWPORT[d].label} ${DEVICE_VIEWPORT[d].width}×${DEVICE_VIEWPORT[d].height}`}
            >
              {DEVICE_VIEWPORT[d].label}
            </button>
          ))}
        </div>
        <button
          style={{ ...styles.captureBtn, ...(loading ? styles.disabledBtn : {}) }}
          onClick={handleCapture}
          disabled={loading}
        >
          {loading ? '抓取中...' : '抓取快照'}
        </button>
      </div>

      {error && <div style={styles.errorBar}>{error}</div>}

      {/* 主区域：左侧历史列表 + 右侧详情/对比 */}
      <div style={styles.body}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <input
              style={styles.searchInput}
              placeholder="搜索历史..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              style={{
                ...styles.favBtn,
                ...(filterFavorite ? styles.favBtnActive : {}),
              }}
              onClick={() => setFilterFavorite((v) => !v)}
              title="只看收藏"
            >
              ★
            </button>
          </div>

          <div style={styles.convList}>
            {filteredHistory.length === 0 && (
              <div style={styles.emptySidebar}>暂无快照，输入 URL 开始抓取</div>
            )}
            {filteredHistory.map((s) => (
              <div
                key={s.id}
                style={{
                  ...styles.snapItem,
                  ...(s.id === activeId ? styles.snapItemActive : {}),
                }}
                onClick={() => setActiveId(s.id)}
              >
                <div style={styles.snapThumb}>
                  {s.screenshot ? (
                    <img src={s.screenshot} alt="" style={styles.thumbImg} loading="lazy" />
                  ) : (
                    <div style={styles.thumbPlaceholder}>无图</div>
                  )}
                  <span style={styles.deviceTag}>{DEVICE_VIEWPORT[s.device].label}</span>
                </div>
                <div style={styles.snapInfo}>
                  <div style={styles.snapTitle}>{s.title}</div>
                  <div style={styles.snapUrl}>{s.url}</div>
                  <div style={styles.snapMeta}>
                    {s.favorite && <span style={styles.star}>★</span>}
                    <span>{new Date(s.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  </div>
                </div>
                <div style={styles.snapActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    style={styles.miniBtn}
                    onClick={() => toggleFavorite(s.id)}
                    title={s.favorite ? '取消收藏' : '收藏'}
                  >
                    {s.favorite ? '★' : '☆'}
                  </button>
                  <button
                    style={{
                      ...styles.miniBtn,
                      ...(compareIds.includes(s.id) ? styles.miniBtnActive : {}),
                    }}
                    onClick={() => toggleCompare(s.id)}
                    title="加入对比（最多 2 个）"
                    disabled={!s.screenshot}
                  >
                    对比
                  </button>
                  <button
                    style={{ ...styles.miniBtn, color: '#ef4444' }}
                    onClick={() => handleDelete(s.id)}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.sidebarFooter}>
            <button style={styles.footerBtn} onClick={exportAll} disabled={history.length === 0}>
              导出全部 JSON
            </button>
            <button
              style={styles.footerBtn}
              onClick={() => {
                if (confirm('确定清空所有历史？')) {
                  setHistory([])
                  setActiveId(null)
                  setCompareIds([])
                  setToast({ msg: '已清空', type: 'info' })
                }
              }}
              disabled={history.length === 0}
            >
              清空
            </button>
          </div>
        </div>

        <div style={styles.main}>
          {/* 对比模式优先显示 */}
          {compareSnapshots.length === 2 ? (
            <div style={styles.compareView}>
              <div style={styles.compareHeader}>
                <h3 style={styles.compareTitle}>对比视图</h3>
                <button style={styles.secondaryBtn} onClick={() => setCompareIds([])}>
                  退出对比
                </button>
              </div>
              <div style={styles.compareGrid}>
                {compareSnapshots.map((s) => (
                  <div key={s.id} style={styles.compareItem}>
                    <div style={styles.compareItemHeader}>
                      <span style={styles.deviceBadge}>{DEVICE_VIEWPORT[s.device].label}</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.compareLink}
                      >
                        <ExternalLinkIcon size={12} /> {s.title}
                      </a>
                    </div>
                    {s.screenshot ? (
                      <img src={s.screenshot} alt={s.title} style={styles.compareImg} />
                    ) : (
                      <div style={styles.noImage}>无截图</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeSnapshot ? (
            <div style={styles.detailView}>
              <div style={styles.detailHeader}>
                <div style={styles.detailTitleArea}>
                  <div style={styles.titleRow}>
                    {activeSnapshot.logo && (
                      <img
                        src={activeSnapshot.logo}
                        alt=""
                        style={styles.favicon}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    <h2 style={styles.detailTitle}>{activeSnapshot.title}</h2>
                  </div>
                  <a
                    href={activeSnapshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.detailUrl}
                  >
                    <ExternalLinkIcon size={12} /> {activeSnapshot.url}
                  </a>
                </div>
                <div style={styles.detailActions}>
                  {activeSnapshot.screenshot && (
                    <button
                      style={styles.iconBtn}
                      onClick={() =>
                        downloadImage(
                          activeSnapshot.screenshot!,
                          `${activeSnapshot.title.slice(0, 30)}-${activeSnapshot.device}.png`,
                        )
                      }
                      title="下载截图"
                    >
                      <DownloadIcon size={14} /> 下载
                    </button>
                  )}
                  <button
                    style={styles.iconBtn}
                    onClick={() => toggleFavorite(activeSnapshot.id)}
                  >
                    {activeSnapshot.favorite ? '★ 已收藏' : '☆ 收藏'}
                  </button>
                  <button
                    style={{ ...styles.iconBtn, color: '#ef4444' }}
                    onClick={() => handleDelete(activeSnapshot.id)}
                  >
                    <TrashIcon size={14} /> 删除
                  </button>
                </div>
              </div>

              <div style={styles.screenshotArea}>
                {activeSnapshot.screenshot ? (
                  <img
                    src={activeSnapshot.screenshot}
                    alt={activeSnapshot.title}
                    style={styles.screenshotImg}
                  />
                ) : (
                  <div style={styles.noImage}>
                    <CameraIcon size={48} />
                    <p>该快照无截图</p>
                  </div>
                )}
              </div>

              <div style={styles.metaGrid}>
                <MetaItem label="设备" value={DEVICE_VIEWPORT[activeSnapshot.device].label} />
                <MetaItem label="语言" value={activeSnapshot.lang} />
                <MetaItem label="作者" value={activeSnapshot.author} />
                <MetaItem label="发布者" value={activeSnapshot.publisher} />
                <MetaItem
                  label="发布日期"
                  value={
                    activeSnapshot.date
                      ? new Date(activeSnapshot.date).toLocaleDateString('zh-CN')
                      : null
                  }
                />
                <MetaItem
                  label="抓取时间"
                  value={new Date(activeSnapshot.createdAt).toLocaleString('zh-CN', { hour12: false })}
                />
              </div>

              {activeSnapshot.description && (
                <div style={styles.metaSection}>
                  <div style={styles.sectionLabel}>页面描述</div>
                  <p style={styles.description}>{activeSnapshot.description}</p>
                </div>
              )}

              {activeSnapshot.image && (
                <div style={styles.metaSection}>
                  <div style={styles.sectionLabel}>OG 图片</div>
                  <img
                    src={activeSnapshot.image}
                    alt="OG"
                    style={styles.ogImage}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyMain}>
              <CameraIcon size={64} />
              <h2 style={styles.emptyTitle}>WebSnapshot 网页快照分析</h2>
              <p style={styles.emptyDesc}>
                输入任意网页 URL，获取网页截图、标题、描述、favicon、OG 图片等元数据。
              </p>
              <p style={styles.hint}>
                支持桌面 / 平板 / 手机三种视口，收藏与对比模式，全部本地持久化。
              </p>
              <p style={styles.hint}>
                数据源：microlink.io 免费 API（每分钟 50 次请求）。
              </p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === 'success' ? styles.toastSuccess : {}),
            ...(toast.type === 'error' ? styles.toastError : {}),
            ...(toast.type === 'info' ? styles.toastInfo : {}),
          }}
        >
          {toast.msg}
        </div>
      )}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} />
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={styles.metaItem}>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value || '—'}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
  },
  urlInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  deviceSwitch: {
    display: 'flex',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    overflow: 'hidden',
  },
  deviceBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
  },
  deviceBtnActive: {
    background: '#334155',
    color: '#f1f5f9',
  },
  captureBtn: {
    padding: '8px 18px',
    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorBar: {
    padding: '8px 14px',
    background: 'rgba(239,68,68,0.1)',
    borderBottom: '1px solid #ef4444',
    color: '#fca5a5',
    fontSize: 12,
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: 300,
    minWidth: 300,
    background: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 8,
    display: 'flex',
    gap: 6,
    borderBottom: '1px solid #334155',
  },
  searchInput: {
    flex: 1,
    padding: '5px 8px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#e2e8f0',
    fontSize: 12,
    outline: 'none',
  },
  favBtn: {
    width: 28,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
  },
  favBtnActive: {
    color: '#fbbf24',
    borderColor: '#fbbf24',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: 6,
  },
  emptySidebar: {
    padding: 24,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
  },
  snapItem: {
    display: 'flex',
    gap: 8,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  snapItemActive: {
    background: '#334155',
    borderColor: '#475569',
  },
  snapThumb: {
    position: 'relative',
    width: 64,
    height: 48,
    borderRadius: 4,
    overflow: 'hidden',
    background: '#0f172a',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    fontSize: 10,
  },
  deviceTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    padding: '1px 4px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 9,
    borderRadius: 2,
  },
  snapInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  snapTitle: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  snapUrl: {
    color: '#64748b',
    fontSize: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  snapMeta: {
    display: 'flex',
    gap: 6,
    color: '#64748b',
    fontSize: 10,
    alignItems: 'center',
  },
  star: {
    color: '#fbbf24',
  },
  snapActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  miniBtn: {
    padding: '2px 6px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 3,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 10,
  },
  miniBtnActive: {
    background: '#3b82f6',
    color: '#fff',
    borderColor: '#3b82f6',
  },
  sidebarFooter: {
    padding: 6,
    borderTop: '1px solid #334155',
    display: 'flex',
    gap: 4,
  },
  footerBtn: {
    flex: 1,
    padding: '5px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 11,
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
  },
  emptyMain: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748b',
    gap: 8,
  },
  emptyTitle: {
    color: '#f1f5f9',
    margin: '8px 0 4px',
  },
  emptyDesc: {
    color: '#94a3b8',
    maxWidth: 500,
    margin: 0,
  },
  hint: {
    color: '#475569',
    fontSize: 12,
    margin: 0,
  },
  detailView: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  detailTitleArea: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  favicon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    flexShrink: 0,
  },
  detailTitle: {
    fontSize: 20,
    color: '#f1f5f9',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  detailUrl: {
    color: '#60a5fa',
    fontSize: 12,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  detailActions: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
  },
  screenshotArea: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    textAlign: 'center',
  },
  screenshotImg: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    margin: '0 auto',
  },
  noImage: {
    padding: 40,
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    padding: 10,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: '#e2e8f0',
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metaSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    padding: 12,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.6,
    margin: 0,
  },
  ogImage: {
    maxWidth: '100%',
    borderRadius: 6,
    border: '1px solid #334155',
  },
  compareView: {
    maxWidth: 1400,
    margin: '0 auto',
  },
  compareHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compareTitle: {
    color: '#f1f5f9',
    margin: 0,
    fontSize: 16,
  },
  secondaryBtn: {
    padding: '6px 14px',
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 12,
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  compareItem: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  compareItemHeader: {
    padding: 8,
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  deviceBadge: {
    padding: '2px 6px',
    background: '#3b82f6',
    color: '#fff',
    borderRadius: 3,
    fontSize: 11,
    flexShrink: 0,
  },
  compareLink: {
    color: '#60a5fa',
    fontSize: 12,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  compareImg: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  toastSuccess: {
    background: 'linear-gradient(135deg,#10b981,#059669)',
  },
  toastError: {
    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
  },
  toastInfo: {
    background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  },
}

export default memo(WebSnapshot)
