import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'

// ==================== 类型定义 ====================
interface OpenLibraryDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  subject?: string[]
  isbn?: string[]
  edition_count?: number
  language?: string[]
  publisher?: string[]
  ratings_average?: number
  ratings_count?: number
  number_of_pages_median?: number
}

interface OpenLibraryResponse {
  numFound: number
  start: number
  docs: OpenLibraryDoc[]
}

interface BookshelfItem {
  id: string
  title: string
  authors: string[]
  year?: number
  cover?: string
  status: 'want' | 'reading' | 'done'
  rating?: number
  note?: string
  addedAt: number
}

type ShelfStatus = BookshelfItem['status']

// ==================== 常量 ====================
const STORAGE_KEY = 'weblinux-reading-list'
const SUBJECTS = [
  '小说',
  '计算机',
  '科学',
  '历史',
  '哲学',
  '心理学',
  '经济学',
  '艺术',
  '诗歌',
  '传记',
]

// ==================== 工具函数 ====================
function coverUrl(coverId?: number, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
  if (!coverId) return undefined
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
}

function statusLabel(s: ShelfStatus): string {
  return { want: '想读', reading: '在读', done: '已读' }[s]
}

function statusColor(s: ShelfStatus): string {
  return { want: '#7c6ff7', reading: '#f7a76f', done: '#6fcf97' }[s]
}

function loadShelf(): BookshelfItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveShelf(items: BookshelfItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 忽略
  }
}

// ==================== 主组件 ====================
const ReadingList = () => {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [results, setResults] = useState<OpenLibraryDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numFound, setNumFound] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [shelf, setShelf] = useState<BookshelfItem[]>([])
  const [activeTab, setActiveTab] = useState<'search' | ShelfStatus>('search')
  const [filterStatus, setFilterStatus] = useState<ShelfStatus | 'all'>('all')
  const [detail, setDetail] = useState<BookshelfItem | null>(null)

  const addNotification = useStore((s) => s.addNotification)

  useEffect(() => {
    setShelf(loadShelf())
  }, [])

  // 搜索（Open Library Search API，免认证）
  const search = useCallback(
    async (q: string, subj: string, p: number) => {
      if (!q.trim() && !subj) {
        setResults([])
        setNumFound(0)
        setTotalPages(1)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          limit: '20',
          page: String(p),
        })
        if (q.trim()) params.set('q', q.trim())
        else params.set('q', subj)
        if (subj) params.set('subject', subj)

        const url = `https://openlibrary.org/search.json?${params.toString()}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: OpenLibraryResponse = await res.json()
        setResults(data.docs)
        setNumFound(data.numFound)
        setTotalPages(Math.max(1, Math.ceil(data.numFound / 20)))
      } catch (err) {
        const msg = err instanceof Error ? err.message : '请求失败'
        setError(`搜索失败：${msg}`)
        setResults([])
        setNumFound(0)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    setPage(1)
  }, [query, subject])

  useEffect(() => {
    if (activeTab === 'search') {
      search(query, subject, page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearch = useCallback(() => {
    setPage(1)
    search(query, subject, 1)
  }, [query, subject, search])

  // 加入书架
  const addToShelf = useCallback(
    (doc: OpenLibraryDoc, status: ShelfStatus = 'want') => {
      const id = doc.key
      setShelf((prev) => {
        if (prev.some((b) => b.id === id)) {
          addNotification({ title: '书架', message: '已在书架中', type: 'info', duration: 2000 })
          return prev
        }
        const item: BookshelfItem = {
          id,
          title: doc.title,
          authors: doc.author_name ?? [],
          year: doc.first_publish_year,
          cover: coverUrl(doc.cover_i, 'S'),
          status,
          addedAt: Date.now(),
        }
        const next = [item, ...prev]
        saveShelf(next)
        addNotification({ title: '书架', message: `已加入「${statusLabel(status)}」`, type: 'success', duration: 1800 })
        return next
      })
    },
    [addNotification]
  )

  // 更新书架项
  const updateShelfItem = useCallback(
    (id: string, patch: Partial<BookshelfItem>) => {
      setShelf((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
        saveShelf(next)
        if (detail && detail.id === id) {
          setDetail({ ...detail, ...patch })
        }
        return next
      })
    },
    [detail]
  )

  // 从书架移除
  const removeFromShelf = useCallback(
    (id: string) => {
      setShelf((prev) => {
        const next = prev.filter((b) => b.id !== id)
        saveShelf(next)
        addNotification({ title: '书架', message: '已移除', type: 'info', duration: 1800 })
        return next
      })
      setDetail(null)
    },
    [addNotification]
  )

  // 统计
  const stats = useMemo(() => {
    return {
      want: shelf.filter((b) => b.status === 'want').length,
      reading: shelf.filter((b) => b.status === 'reading').length,
      done: shelf.filter((b) => b.status === 'done').length,
      total: shelf.length,
    }
  }, [shelf])

  // 当前书架视图
  const filteredShelf = useMemo(() => {
    if (filterStatus === 'all') return shelf
    return shelf.filter((b) => b.status === filterStatus)
  }, [shelf, filterStatus])

  return (
    <div
      style={{
        height: '100%',
        background: 'linear-gradient(180deg, #fafaf7 0%, #f0ece4 100%)',
        color: '#2c2416',
        overflow: 'auto',
      }}
    >
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
              阅读清单
            </h1>
            <div style={{ fontSize: 12, color: '#8a7e6b', marginTop: 4 }}>
              搜索 2000 万+ 公开图书 · 由 Open Library 提供
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#5a4e3b', flexWrap: 'wrap' }}>
            <span>想读 <b style={{ color: statusColor('want') }}>{stats.want}</b></span>
            <span>在读 <b style={{ color: statusColor('reading') }}>{stats.reading}</b></span>
            <span>已读 <b style={{ color: statusColor('done') }}>{stats.done}</b></span>
            <span>共 <b>{stats.total}</b></span>
          </div>
        </div>

        {/* 标签页 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '2px solid #d8cfbf', paddingBottom: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['search', `🔍 搜索`],
              ['want', `想读 (${stats.want})`],
              ['reading', `在读 (${stats.reading})`],
              ['done', `已读 (${stats.done})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              style={{
                padding: '6px 14px',
                background: activeTab === k ? '#5a4e3b' : 'transparent',
                color: activeTab === k ? '#fff' : '#5a4e3b',
                border: 'none',
                borderRadius: 6,
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

        {/* 搜索面板 */}
        {activeTab === 'search' && (
          <>
            <div
              style={{
                background: '#fff',
                border: '1px solid #e3dccd',
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  placeholder="书名 / 作者 / ISBN..."
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: '10px 14px',
                    background: '#fafaf7',
                    border: '1px solid #d8cfbf',
                    borderRadius: 6,
                    color: '#2c2416',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSearch}
                  style={{
                    padding: '10px 20px',
                    background: '#5a4e3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  搜索
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#8a7e6b', marginRight: 4, alignSelf: 'center' }}>主题：</span>
                <button
                  onClick={() => {
                    setSubject('')
                    setQuery('')
                  }}
                  style={chipStyle(subject === '')}
                >
                  全部
                </button>
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSubject(s)
                      setQuery('')
                    }}
                    style={chipStyle(subject === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#b91c1c',
                  marginBottom: 16,
                }}
              >
                ⚠ {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#8a7e6b', fontSize: 13 }}>搜索中…</div>
            ) : results.length === 0 && !error ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  color: '#a89c89',
                  fontSize: 13,
                  background: '#fff',
                  border: '1px dashed #d8cfbf',
                  borderRadius: 8,
                }}
              >
                输入关键词搜索百万本公开图书。
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#8a7e6b', marginBottom: 10 }}>
                  找到 <b style={{ color: '#5a4e3b' }}>{numFound.toLocaleString()}</b> 本结果，第 {page} / {totalPages} 页
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  {results.map((doc) => (
                    <BookCard
                      key={doc.key}
                      doc={doc}
                      onAdd={(status) => addToShelf(doc, status)}
                      inShelf={shelf.some((b) => b.id === doc.key)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={pagerBtnStyle(page === 1)}
                    >
                      ← 上一页
                    </button>
                    <span
                      style={{
                        padding: '8px 14px',
                        fontSize: 12,
                        color: '#5a4e3b',
                        background: '#fff',
                        border: '1px solid #d8cfbf',
                        borderRadius: 6,
                        alignSelf: 'center',
                      }}
                    >
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      style={pagerBtnStyle(page >= totalPages)}
                    >
                      下一页 →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* 书架视图 */}
        {activeTab !== 'search' && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(
                [
                  ['all', `全部 (${stats.total})`],
                  ['want', `想读 (${stats.want})`],
                  ['reading', `在读 (${stats.reading})`],
                  ['done', `已读 (${stats.done})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilterStatus(k)}
                  style={chipStyle(filterStatus === k)}
                >
                  {label}
                </button>
              ))}
            </div>
            {filteredShelf.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  color: '#a89c89',
                  fontSize: 13,
                  background: '#fff',
                  border: '1px dashed #d8cfbf',
                  borderRadius: 8,
                }}
              >
                书架空空如也。切到「搜索」标签去找几本好书吧。
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {filteredShelf.map((b) => (
                  <ShelfCard key={b.id} item={b} onOpen={() => setDetail(b)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* 详情弹层 */}
        {detail && (
          <div
            onClick={() => setDetail(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fafaf7',
                borderRadius: 12,
                padding: 24,
                maxWidth: 520,
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {detail.cover ? (
                  <img
                    src={detail.cover}
                    alt={detail.title}
                    style={{ width: 96, height: 144, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 96,
                      height: 144,
                      background: '#e3dccd',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a89c89',
                      fontSize: 24,
                    }}
                  >
                    📖
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{detail.title}</h2>
                  <div style={{ fontSize: 12, color: '#8a7e6b', marginTop: 4 }}>
                    {detail.authors.length > 0 ? detail.authors.join('、') : '佚名'} · {detail.year || '?'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#a89c89' }}>
                    添加于 {new Date(detail.addedAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8a7e6b', marginBottom: 6 }}>阅读状态</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['want', 'reading', 'done'] as ShelfStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateShelfItem(detail.id, { status: s })}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: detail.status === s ? statusColor(s) : '#fff',
                        color: detail.status === s ? '#fff' : '#5a4e3b',
                        border: '1px solid ' + (detail.status === s ? statusColor(s) : '#d8cfbf'),
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8a7e6b', marginBottom: 6 }}>评分</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateShelfItem(detail.id, { rating: detail.rating === n ? undefined : n })}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 22,
                        cursor: 'pointer',
                        color: detail.rating !== undefined && n <= detail.rating ? '#f59e0b' : '#d8cfbf',
                        padding: 0,
                      }}
                      title={`${n} 星`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#8a7e6b', marginBottom: 6 }}>笔记</div>
                <textarea
                  value={detail.note ?? ''}
                  onChange={(e) => updateShelfItem(detail.id, { note: e.target.value })}
                  placeholder="记录一下阅读心得..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 8,
                    background: '#fff',
                    border: '1px solid #d8cfbf',
                    borderRadius: 6,
                    color: '#2c2416',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                <button
                  onClick={() => removeFromShelf(detail.id)}
                  style={{
                    padding: '8px 14px',
                    background: 'transparent',
                    color: '#b91c1c',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  移除
                </button>
                <a
                  href={`https://openlibrary.org${detail.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 14px',
                    background: '#5a4e3b',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  在 Open Library 查看 ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 底部说明 */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#a89c89',
            marginTop: 20,
            padding: 12,
          }}
        >
          数据来源：Open Library（开放图书馆，开放数据，公共领域）。所有书评与笔记仅保存在你的浏览器中。
        </div>
      </div>
    </div>
  )
}

// ==================== 卡片组件 ====================
const BookCard = ({
  doc,
  onAdd,
  inShelf,
}: {
  doc: OpenLibraryDoc
  onAdd: (status: ShelfStatus) => void
  inShelf: boolean
}) => {
  const cover = coverUrl(doc.cover_i, 'M')
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e3dccd',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(90,78,59,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '2 / 3',
          background: '#e3dccd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a89c89',
          fontSize: 32,
          overflow: 'hidden',
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt={doc.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          '📖'
        )}
      </div>
      <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            color: '#2c2416',
            marginBottom: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {doc.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#8a7e6b',
            marginBottom: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {doc.author_name?.[0] ?? '佚名'} · {doc.first_publish_year ?? '?'}
        </div>
        <button
          onClick={() => onAdd(inShelf ? 'want' : 'want')}
          disabled={inShelf}
          style={{
            marginTop: 'auto',
            padding: '5px 8px',
            background: inShelf ? '#e3dccd' : '#5a4e3b',
            color: inShelf ? '#8a7e6b' : '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 11,
            cursor: inShelf ? 'default' : 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          {inShelf ? '已在书架' : '加入想读'}
        </button>
      </div>
    </div>
  )
}

const ShelfCard = ({ item, onOpen }: { item: BookshelfItem; onOpen: () => void }) => {
  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        border: '1px solid #e3dccd',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        gap: 10,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#fafaf7'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fff'
      }}
    >
      {item.cover ? (
        <img
          src={item.cover.replace('-S.', '-M.')}
          alt={item.title}
          style={{ width: 60, height: 90, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 60,
            height: 90,
            background: '#e3dccd',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a89c89',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          📖
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: '#8a7e6b', marginBottom: 4 }}>
          {item.authors.slice(0, 2).join('、')}
          {item.year ? ` · ${item.year}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              background: statusColor(item.status),
              color: '#fff',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {statusLabel(item.status)}
          </span>
          {item.rating !== undefined && (
            <span style={{ fontSize: 11, color: '#f59e0b' }}>{'★'.repeat(item.rating)}</span>
          )}
        </div>
        {item.note && (
          <div
            style={{
              fontSize: 11,
              color: '#5a4e3b',
              marginTop: 6,
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            “{item.note}”
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== 样式 ====================
function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    background: active ? '#5a4e3b' : '#fff',
    color: active ? '#fff' : '#5a4e3b',
    border: '1px solid ' + (active ? '#5a4e3b' : '#d8cfbf'),
    borderRadius: 14,
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
  }
}

function pagerBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: disabled ? '#fafaf7' : '#5a4e3b',
    color: disabled ? '#a89c89' : '#fff',
    border: '1px solid ' + (disabled ? '#e3dccd' : '#5a4e3b'),
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  }
}

export default ReadingList
