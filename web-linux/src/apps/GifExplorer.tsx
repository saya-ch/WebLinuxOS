import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useStore } from '../store'

const GIPHY_API_KEY = 'dc6zaTOxFJmzC'
const PIXABAY_API_KEY = '47316-4a8c459dca494ab9a62fce2a'
const BASE_URL = 'https://api.giphy.com/v1/gifs'
const PIXABAY_BASE = 'https://pixabay.com/api'

const CATEGORIES = [
  { id: 'trending', label: '🔥 热门', query: '', type: 'trending' as const },
  { id: 'reactions', label: '😂 反应', query: 'reaction', type: 'search' as const },
  { id: 'animals', label: '🐾 动物', query: 'animals', type: 'search' as const },
  { id: 'sports', label: '⚽ 运动', query: 'sports', type: 'search' as const },
  { id: 'gaming', label: '🎮 游戏', query: 'gaming', type: 'search' as const },
  { id: 'anime', label: '🎨 动漫', query: 'anime', type: 'search' as const },
  { id: 'memes', label: '😂 表情包', query: 'memes', type: 'search' as const },
  { id: 'nature', label: '🌿 自然', query: 'nature', type: 'search' as const },
  { id: 'love', label: '💕 爱情', query: 'love', type: 'search' as const },
  { id: 'dance', label: '💃 舞蹈', query: 'dance', type: 'search' as const },
]

const STORAGE_KEY = 'weblinuxos-gifexplorer-favorites'
const FAVORITES_LIMIT = 200

interface GifImage {
  id: string
  title: string
  username: string
  images: {
    original: { url: string; width: string; height: string; size: string }
    fixed_width: { url: string; width: string; height: string }
    downsized_medium: { url: string; width: string; height: string }
    fixed_width_downsampled: { url: string; width: string; height: string }
  }
  user?: {
    username: string
    display_name: string
    avatar_url: string
  }
  source: string
  content_rating: string
}

interface GifResponse {
  data: GifImage[]
  pagination: { total_count: number; count: number; offset: number }
}

interface FavoriteGif {
  id: string
  title: string
  originalUrl: string
  thumbnailUrl: string
  savedAt: number
}

const containerStyle: React.CSSProperties = {
  padding: '16px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  flexShrink: 0,
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const searchBoxStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
}

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  transition: 'all 0.2s ease',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

const searchBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
}

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  overflowX: 'auto',
  paddingBottom: '4px',
  flexShrink: 0,
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  background: active ? 'var(--accent)' : 'var(--glass-bg)',
  color: active ? '#fff' : 'var(--text-secondary)',
  border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backdropFilter: active ? 'none' : 'blur(12px)',
  WebkitBackdropFilter: active ? 'none' : 'blur(12px)',
})

const gridContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: '4px',
}

const masonryStyle: React.CSSProperties = {
  columnCount: 'auto',
  columnWidth: '200px',
  columnGap: '12px',
}

const gifCardStyle: React.CSSProperties = {
  breakInside: 'avoid',
  marginBottom: '12px',
  borderRadius: '14px',
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  display: 'block',
}

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px',
  color: 'var(--text-secondary)',
  fontSize: '14px',
  gap: '10px',
}

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '60px 20px',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  gap: '12px',
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 99999,
  padding: '20px',
  animation: 'fadeIn 0.2s ease',
}

const modalContentStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(28, 28, 46, 0.95) 0%, rgba(22, 22, 38, 0.98) 100%)',
  border: '1px solid var(--glass-border)',
  borderRadius: '18px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(139, 124, 240, 0.2)',
  animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
}

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 18px',
  borderBottom: '1px solid var(--glass-border)',
  gap: '12px',
}

const modalTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
}

const modalBodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'auto',
  padding: '16px',
  minHeight: '200px',
}

const modalGifStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '65vh',
  borderRadius: '10px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
  objectFit: 'contain',
}

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  padding: '14px 18px',
  borderTop: '1px solid var(--glass-border)',
  flexWrap: 'wrap',
}

const actionBtnStyle = (active?: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  background: active ? 'var(--accent)' : 'var(--glass-bg)',
  color: active ? '#fff' : 'var(--text-primary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
})

const closeBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: 0,
}

const favBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  flexShrink: 0,
}

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '16px',
  gap: '8px',
  flexShrink: 0,
}

const GIF_SIZE = 24

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`)
  return (await res.json()) as T
}

function loadFavorites(): FavoriteGif[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function saveFavorites(favs: FavoriteGif[]) {
  try {
    const trimmed = favs.slice(0, FAVORITES_LIMIT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage might be full
  }
}

const GifCard = memo(function GifCard({
  gif,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: {
  gif: GifImage
  onSelect: (g: GifImage) => void
  isFavorite: boolean
  onToggleFavorite: (g: GifImage) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const thumbnail = gif.images.fixed_width_downsampled?.url
    || gif.images.downsized_medium?.url
    || gif.images.fixed_width?.url
    || gif.images.original.url

  const handleClick = useCallback(() => onSelect(gif), [gif, onSelect])
  const handleFavClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(gif)
  }, [gif, onToggleFavorite])

  return (
    <div
      style={gifCardStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 30px var(--accent-glow)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {!loaded && !error && (
        <div style={{
          width: '100%',
          height: '120px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--accent)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}
      {error && (
        <div style={{
          width: '100%',
          height: '120px',
          background: 'rgba(255,77,95,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--error)',
          fontSize: '12px',
        }}>加载失败</div>
      )}
      <img
        src={thumbnail}
        alt={gif.title || 'GIF'}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <button
        onClick={handleFavClick}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isFavorite ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: isFavorite ? '#fff' : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
        title={isFavorite ? '取消收藏' : '收藏'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  )
})

export default function GifExplorer() {
  const addNotification = useStore((s) => s.addNotification)

  const [activeTab, setActiveTab] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [gifs, setGifs] = useState<GifImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGif, setSelectedGif] = useState<GifImage | null>(null)
  const [favorites, setFavorites] = useState<FavoriteGif[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const isFavorite = useCallback((id: string) => {
    return favorites.some((f) => f.id === id)
  }, [favorites])

  const toggleFavorite = useCallback((gif: GifImage) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === gif.id)
      let next: FavoriteGif[]
      if (exists) {
        next = prev.filter((f) => f.id !== gif.id)
        addNotification({
          title: '已取消收藏',
          message: `"${gif.title || 'GIF'}" 已从收藏中移除`,
          type: 'info',
          duration: 2000,
        })
      } else {
        next = [
          {
            id: gif.id,
            title: gif.title,
            originalUrl: gif.images.original.url,
            thumbnailUrl: gif.images.fixed_width?.url || gif.images.original.url,
            savedAt: Date.now(),
          },
          ...prev,
        ].slice(0, FAVORITES_LIMIT)
        addNotification({
          title: '收藏成功',
          message: `"${gif.title || 'GIF'}" 已加入收藏`,
          type: 'success',
          duration: 2000,
        })
      }
      saveFavorites(next)
      return next
    })
  }, [addNotification])

  const fetchPixabayGifs = useCallback(async (query: string, offset: number, signal: AbortSignal): Promise<GifImage[]> => {
    const searchQuery = query || 'funny gif'
    const url = `${PIXABAY_BASE}/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchQuery)}&image_type=animation&per_page=24&page=${Math.floor(offset / 24) + 1}`

    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Pixabay请求失败: HTTP ${res.status}`)
    const data = await res.json()

    if (!data.hits || !Array.isArray(data.hits)) {
      throw new Error('Pixabay未返回结果')
    }

    return data.hits.map((item: { id: number; tags: string; user: string; webformatURL: string; imageWidth: number; imageHeight: number; }) => ({
      id: `pixabay-${item.id}`,
      title: item.tags || 'Pixabay GIF',
      username: item.user || 'pixabay',
      images: {
        original: { url: item.webformatURL, width: String(item.imageWidth), height: String(item.imageHeight), size: '0' },
        fixed_width: { url: item.webformatURL, width: String(item.imageWidth), height: String(item.imageHeight) },
        downsized_medium: { url: item.webformatURL, width: String(item.imageWidth), height: String(item.imageHeight) },
        fixed_width_downsampled: { url: item.webformatURL, width: String(item.imageWidth), height: String(item.imageHeight) },
      },
      user: {
        username: item.user || 'pixabay',
        display_name: item.user || 'Pixabay User',
        avatar_url: '',
      },
      source: 'pixabay',
      content_rating: 'g',
    }))
  }, [])

  const fetchGifs = useCallback(async (tabId: string, query: string, offset: number) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const category = CATEGORIES.find((c) => c.id === tabId)
      let url: string

      if (category?.type === 'trending') {
        url = `${BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=24&offset=${offset}`
      } else if (query.trim()) {
        url = `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=24&offset=${offset}&rating=pg-13`
      } else if (category?.query) {
        url = `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(category.query)}&limit=24&offset=${offset}&rating=pg-13`
      } else {
        url = `${BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=24&offset=${offset}`
      }

      const data = await fetchJSON<GifResponse>(url, controller.signal)
      setGifs((prev) => (offset === 0 ? data.data : [...prev, ...data.data]))
      setTotalCount(data.pagination.total_count)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // 尝试使用Pixabay备用API
      try {
        const category = CATEGORIES.find((c) => c.id === tabId)
        const fallbackQuery = query.trim() || category?.query || 'funny gif'
        const pixabayGifs = await fetchPixabayGifs(fallbackQuery, offset, controller.signal)
        if (pixabayGifs.length > 0) {
          setGifs((prev) => (offset === 0 ? pixabayGifs : [...prev, ...pixabayGifs]))
          setTotalCount(500)
          setError(null)
          addNotification({
            title: '已切换备用源',
            message: 'Giphy不可用，正在使用Pixabay作为备用源',
            type: 'info',
            duration: 3000,
          })
          return
        }
      } catch (fallbackErr) {
        if ((fallbackErr as Error).name === 'AbortError') return
      }
      const message = (err as Error).message || '未知错误'
      setError(`加载失败：${message}`)
      addNotification({
        title: '加载失败',
        message: '无法获取 GIF 数据，请检查网络连接',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification, fetchPixabayGifs])

  useEffect(() => {
    if (showFavorites) return
    setPage(0)
    fetchGifs(activeTab, searchQuery, 0)
  }, [activeTab, searchQuery, showFavorites, fetchGifs])

  const handleSearch = useCallback(() => {
    setShowFavorites(false)
    setSearchQuery(searchInput)
    setPage(0)
  }, [searchInput])

  const handleTabChange = useCallback((tabId: string) => {
    setShowFavorites(false)
    setActiveTab(tabId)
    setSearchInput('')
    setSearchQuery('')
  }, [])

  const handleLoadMore = useCallback(() => {
    if (loading) return
    const nextOffset = (page + 1) * 24
    setPage(page + 1)
    fetchGifs(activeTab, searchQuery, nextOffset)
  }, [loading, page, activeTab, searchQuery, fetchGifs])

  const displayGifs = showFavorites
    ? favorites.map((f) => ({
        id: f.id,
        title: f.title,
        username: '',
        images: {
          original: { url: f.originalUrl, width: '480', height: '270', size: '0' },
          fixed_width: { url: f.thumbnailUrl, width: '480', height: '270' },
          downsized_medium: { url: f.thumbnailUrl, width: '480', height: '270' },
          fixed_width_downsampled: { url: f.thumbnailUrl, width: '480', height: '270' },
        },
        source: '',
        content_rating: 'g',
      } as GifImage))
    : gifs

  const handleShare = useCallback(async (gif: GifImage) => {
    const shareUrl = gif.images.original.url
    const shareTitle = gif.title || 'Check out this GIF'
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        addNotification({
          title: '链接已复制',
          message: 'GIF 链接已复制到剪贴板',
          type: 'success',
          duration: 2000,
        })
      }
    } catch {
      // 用户取消分享，忽略
    }
  }, [addNotification])

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      addNotification({
        title: '链接已复制',
        message: 'GIF 链接已复制到剪贴板',
        type: 'success',
        duration: 2000,
      })
    } catch {
      addNotification({
        title: '复制失败',
        message: '请手动复制链接',
        type: 'error',
        duration: 2000,
      })
    }
  }, [addNotification])

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <div style={titleStyle}>
            <span style={{ fontSize: `${GIF_SIZE}px` }}>🎬</span>
            <span>GIF 探索器</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              style={favBadgeStyle}
              onClick={() => setShowFavorites(!showFavorites)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-subtle)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-bg)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span>{showFavorites ? '🔥' : '★'}</span>
              <span>{showFavorites ? `全部(${favorites.length})` : `收藏(${favorites.length})`}</span>
            </div>
          </div>
        </div>

        <div style={searchBoxStyle}>
          <input
            type="text"
            placeholder="搜索 GIF..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={searchInputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={searchBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 14px var(--accent-glow)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            🔍 搜索
          </button>
        </div>

        {!showFavorites && (
          <div style={tabsContainerStyle}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                style={tabStyle(activeTab === cat.id)}
                onMouseEnter={(e) => {
                  if (activeTab !== cat.id) {
                    e.currentTarget.style.background = 'var(--accent-subtle)'
                    e.currentTarget.style.color = 'var(--accent)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== cat.id) {
                    e.currentTarget.style.background = 'var(--glass-bg)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={gridContainerStyle}>
        {loading && displayGifs.length === 0 && (
          <div style={loadingStyle}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--accent)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span>加载中...</span>
          </div>
        )}

        {error && displayGifs.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>😕</div>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{error}</div>
            <div style={{ fontSize: '13px' }}>请尝试切换分类或重试搜索</div>
          </div>
        )}

        {!loading && !error && displayGifs.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
              {showFavorites ? '📭' : '🔍'}
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
              {showFavorites ? '还没有收藏的 GIF' : '未找到相关 GIF'}
            </div>
            <div style={{ fontSize: '13px' }}>
              {showFavorites ? '点击 GIF 卡片上的 ☆ 按钮收藏' : '试试其他关键词或分类吧'}
            </div>
          </div>
        )}

        {displayGifs.length > 0 && (
          <div style={masonryStyle}>
            {displayGifs.map((gif) => (
              <GifCard
                key={gif.id}
                gif={gif}
                onSelect={setSelectedGif}
                isFavorite={isFavorite(gif.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {!showFavorites && displayGifs.length > 0 && !loading && (
          <div style={paginationStyle}>
            {displayGifs.length < totalCount && (
              <button
                onClick={handleLoadMore}
                style={{
                  ...actionBtnStyle(false),
                  padding: '10px 24px',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--glass-bg)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
              >
                {loading ? '加载中...' : '加载更多 GIF'}
              </button>
            )}
          </div>
        )}
      </div>

      {selectedGif && (
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedGif(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedGif(null)}
          role="dialog"
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div style={modalTitleStyle}>{selectedGif.title || 'GIF 详情'}</div>
              <button
                onClick={() => setSelectedGif(null)}
                style={closeBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--glass-bg)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
              >
                ✕
              </button>
            </div>
            <div style={modalBodyStyle}>
              <img
                src={selectedGif.images.original.url}
                alt={selectedGif.title}
                style={modalGifStyle}
              />
            </div>
            <div style={modalActionsStyle}>
              <button
                onClick={() => toggleFavorite(selectedGif)}
                style={actionBtnStyle(isFavorite(selectedGif.id))}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {isFavorite(selectedGif.id) ? '★ 已收藏' : '☆ 收藏'}
              </button>
              <button
                onClick={() => handleShare(selectedGif)}
                style={actionBtnStyle(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                🔗 分享
              </button>
              <button
                onClick={() => handleCopyLink(selectedGif.images.original.url)}
                style={actionBtnStyle(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                📋 复制链接
              </button>
              <a
                href={selectedGif.images.original.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...actionBtnStyle(false),
                  textDecoration: 'none',
                }}
              >
                🔎 原图
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}