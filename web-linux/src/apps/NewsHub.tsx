import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import {
  Newspaper, TrendingUp, Clock, ExternalLink,
  RefreshCw, Search, Bookmark,
  BookmarkCheck, Filter, Loader2, Sparkles
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  author?: string;
  points?: number;
  comments?: number;
  source: 'hackernews' | 'devto' | 'reddit';
  time: number;
  category?: string;
}

interface SourceConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  color: string;
}

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'tech', name: '科技' },
  { id: 'programming', name: '编程' },
  { id: 'design', name: '设计' },
  { id: 'business', name: '商业' },
];

export default function NewsHub() {
  const theme = useStore((s) => s.theme);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('weblinux-news-bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [sources, setSources] = useState<SourceConfig[]>([
    { id: 'hackernews', name: 'Hacker News', icon: 'HN', enabled: true, color: '#ff6600' },
    { id: 'devto', name: 'Dev.to', icon: 'DEV', enabled: true, color: '#0a0a0a' },
    { id: 'reddit', name: 'Reddit', icon: 'R', enabled: true, color: '#ff4500' },
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem('weblinux-news-bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const fetchHackerNews = useCallback(async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30'
      );
      const data = await response.json();
      return data.hits.map((hit: any) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        author: hit.author,
        points: hit.points,
        comments: hit.num_comments,
        source: 'hackernews' as const,
        time: hit.created_at_i * 1000,
        category: 'tech',
      }));
    } catch (e) {
      console.error('HN fetch error:', e);
      return [];
    }
  }, []);

  const fetchDevTo = useCallback(async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://dev.to/api/articles?per_page=30&top=7'
      );
      const data = await response.json();
      return data.map((article: any) => ({
        id: `dev-${article.id}`,
        title: article.title,
        url: article.url,
        author: article.user?.name,
        points: article.positive_reactions_count,
        comments: article.comments_count,
        source: 'devto' as const,
        time: new Date(article.published_at).getTime(),
        category: article.tags?.includes('javascript') || article.tags?.includes('programming')
          ? 'programming'
          : 'tech',
      }));
    } catch (e) {
      console.error('Dev.to fetch error:', e);
      return [];
    }
  }, []);

  const fetchReddit = useCallback(async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://www.reddit.com/r/programming+webdev+technology/hot.json?limit=30'
      );
      const data = await response.json();
      return data.data.children.map((child: any) => ({
        id: `reddit-${child.data.id}`,
        title: child.data.title,
        url: child.data.url,
        author: child.data.author,
        points: child.data.score,
        comments: child.data.num_comments,
        source: 'reddit' as const,
        time: child.data.created_utc * 1000,
        category: child.data.subreddit === 'programming' || child.data.subreddit === 'webdev'
          ? 'programming'
          : 'tech',
      }));
    } catch (e) {
      console.error('Reddit fetch error:', e);
      return [];
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const promises: Promise<NewsItem[]>[] = [];

      if (sources.find(s => s.id === 'hackernews')?.enabled) {
        promises.push(fetchHackerNews());
      }
      if (sources.find(s => s.id === 'devto')?.enabled) {
        promises.push(fetchDevTo());
      }
      if (sources.find(s => s.id === 'reddit')?.enabled) {
        promises.push(fetchReddit());
      }

      const results = await Promise.all(promises);
      let allNews = results.flat();

      if (sortBy === 'hot') {
        allNews.sort((a, b) => (b.points || 0) - (a.points || 0));
      } else if (sortBy === 'new') {
        allNews.sort((a, b) => b.time - a.time);
      } else {
        allNews.sort((a, b) => (b.points || 0) - (a.points || 0));
      }

      setNews(allNews);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError('加载新闻失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [sources, sortBy, fetchHackerNews, fetchDevTo, fetchReddit]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const filteredNews = news.filter(item => {
    if (showBookmarks && !bookmarks.has(item.id)) return false;
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getSourceInfo = (source: string) => {
    return sources.find(s => s.id === source) || { name: source, color: '#666', icon: '?' };
  };

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme === 'light' ? '#f8f9fa' : '#0f0f1a',
        color: theme === 'light' ? '#1a1a2e' : '#e0e0e8',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
          background: theme === 'light' ? '#fff' : '#1a1a2e',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Newspaper size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              NewsHub 新闻聚合
            </h2>
            <p style={{ fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', margin: 0 }}>
              聚合 Hacker News · Dev.to · Reddit 热门资讯
            </p>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={fetchNews}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
              background: 'transparent',
              color: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            刷新
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: '200px',
            position: 'relative',
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme === 'light' ? '#adb5bd' : '#666',
            }} />
            <input
              type="text"
              placeholder="搜索新闻..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
                background: theme === 'light' ? '#fff' : '#252536',
                color: 'inherit',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: theme === 'light' ? '#f1f3f5' : '#252536',
            borderRadius: '8px',
          }}>
            {(['hot', 'new', 'top'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: sortBy === sort
                    ? (theme === 'light' ? '#fff' : '#3a3a5c')
                    : 'transparent',
                  color: sortBy === sort
                    ? (theme === 'light' ? '#7c6cf0' : '#a29bfe')
                    : 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: sortBy === sort ? 500 : 400,
                }}
              >
                {sort === 'hot' ? '🔥 热门' : sort === 'new' ? '🆕 最新' : '⭐ 顶级'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
              background: showBookmarks
                ? (theme === 'light' ? '#fff3bf' : '#6c5ce730')
                : 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showBookmarks ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            收藏 ({bookmarks.size})
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
              background: showFilters
                ? (theme === 'light' ? '#e3fafc' : '#6c5ce730')
                : 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Filter size={14} />
            筛选
          </button>
        </div>

        {showFilters && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: theme === 'light' ? '#f8f9fa' : '#252536',
            borderRadius: '8px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>资讯来源</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sources.map(source => (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: `1px solid ${source.enabled ? source.color : (theme === 'light' ? '#dee2e6' : '#3a3a5c')}`,
                    background: source.enabled
                      ? `${source.color}20`
                      : 'transparent',
                    color: source.enabled ? source.color : 'inherit',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: source.color,
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {source.icon}
                  </span>
                  {source.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '8px 20px',
        borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeCategory === cat.id
                ? 'linear-gradient(135deg, #7c6cf0, #00d6c1)'
                : 'transparent',
              color: activeCategory === cat.id ? '#fff' : 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeCategory === cat.id ? 500 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {loading && news.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '12px',
            color: theme === 'light' ? '#868e96' : '#888',
          }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <span>正在加载新闻...</span>
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '12px',
            color: '#e74c3c',
          }}>
            <span>{error}</span>
            <button
              onClick={fetchNews}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#7c6cf0',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              重新加载
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '12px',
            color: theme === 'light' ? '#868e96' : '#888',
          }}>
            <Sparkles size={32} />
            <span>
              {showBookmarks ? '还没有收藏的新闻' : '没有找到相关新闻'}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNews.map((item, index) => {
              const sourceInfo = getSourceInfo(item.source);
              const isBookmarked = bookmarks.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => window.open(item.url, '_blank')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
                    background: theme === 'light' ? '#fff' : '#1a1a2e',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7c6cf0';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme === 'light' ? '#e9ecef' : '#2a2a3e';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${sourceInfo.color}15`,
                    color: sourceInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {sourceInfo.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      marginBottom: '6px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {index < 3 && <TrendingUp size={14} style={{ color: '#ff6b6b', verticalAlign: '-2px', marginRight: '4px' }} />}
                      {item.title}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '11px',
                      color: theme === 'light' ? '#868e96' : '#888',
                    }}>
                      <span>{sourceInfo.name}</span>
                      {item.author && <span>by {item.author}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} />
                        {formatTime(item.time)}
                      </span>
                      {item.points !== undefined && (
                        <span>⭐ {formatNumber(item.points)}</span>
                      )}
                      {item.comments !== undefined && (
                        <span>💬 {formatNumber(item.comments)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => toggleBookmark(item.id, e)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: isBookmarked ? '#f59e0b' : 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    >
                      {isBookmarked ? <BookmarkCheck size={16} fill="currentColor" /> : <Bookmark size={16} />}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '8px 20px',
        borderTop: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
        background: theme === 'light' ? '#fff' : '#1a1a2e',
        fontSize: '11px',
        color: theme === 'light' ? '#868e96' : '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>共 {filteredNews.length} 条新闻</span>
        <span>数据来源: Hacker News API · Dev.to API · Reddit API</span>
      </div>
    </div>
  );
}
