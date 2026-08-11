import React, { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/apiService'
import type { ArxivPaper, S2Paper } from '../services/apiService'
import { ResearchIcon, ArxivIcon, CitationIcon, DailyPaperIcon, ExternalLinkIcon, DownloadIcon, StarIcon } from '../icons'

type TabType = 'search' | 'daily' | 'citations' | 'recommendations'
type SourceType = 'arxiv' | 'semanticscholar' | 'both'

interface ResearchAssistantProps {
  onClose?: () => void
}

const ARXIV_CATEGORIES = [
  { id: 'cs.AI', name: '人工智能 (cs.AI)' },
  { id: 'cs.LG', name: '机器学习 (cs.LG)' },
  { id: 'cs.CL', name: '计算语言 (cs.CL)' },
  { id: 'cs.CV', name: '计算机视觉 (cs.CV)' },
  { id: 'cs.NE', name: '神经网络 (cs.NE)' },
  { id: 'stat.ML', name: '统计机器学习 (stat.ML)' },
  { id: 'cs.DC', name: '分布式计算 (cs.DC)' },
  { id: 'cs.CR', name: '密码学 (cs.CR)' },
  { id: 'quant-ph', name: '量子物理 (quant-ph)' },
  { id: 'astro-ph', name: '天体物理 (astro-ph)' },
  { id: 'cond-mat', name: '凝聚态物理 (cond-mat)' },
  { id: 'bio', name: '生物学 (bio)' },
]

const ResearchAssistant: React.FC<ResearchAssistantProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [source, setSource] = useState<SourceType>('both')
  const [results, setResults] = useState<(ArxivPaper | S2Paper)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState<ArxivPaper | S2Paper | null>(null)
  const [citations, setCitations] = useState<S2Paper[]>([])
  const [recommendations, setRecommendations] = useState<S2Paper[]>([])
  const [dailyCategory, setDailyCategory] = useState('cs.AI')
  const [dailyPapers, setDailyPapers] = useState<ArxivPaper[]>([])
  const [dailyLoading, setDailyLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('research_favorites')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('research_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // 保存收藏
  useEffect(() => {
    localStorage.setItem('research_favorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  // 保存搜索历史
  useEffect(() => {
    localStorage.setItem('research_history', JSON.stringify(searchHistory.slice(0, 20)))
  }, [searchHistory])

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    // 添加到搜索历史
    setSearchHistory(prev => [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 20))

    try {
      let allResults: (ArxivPaper | S2Paper)[] = []

      if (source === 'arxiv' || source === 'both') {
        const arxivResults = await apiService.searchArxiv(searchQuery, 15)
        if (arxivResults) {
          allResults = [...allResults, ...arxivResults]
        }
      }

      if (source === 'semanticscholar' || source === 'both') {
        const s2Results = await apiService.searchSemanticScholar(searchQuery, 15)
        if (s2Results) {
          allResults = [...allResults, ...s2Results]
        }
      }

      // 按引用数排序（如果有引用数的话）
      allResults.sort((a, b) => {
        const citesA = 'citationCount' in a ? a.citationCount : 0
        const citesB = 'citationCount' in b ? b.citationCount : 0
        return citesB - citesA
      })

      setResults(allResults)

      if (allResults.length === 0) {
        setError('未找到相关论文，请尝试其他关键词')
      }
    } catch (err) {
      setError('搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, source])

  const loadDailyPapers = useCallback(async () => {
    setDailyLoading(true)
    setError('')
    try {
      const papers = await apiService.fetchDailyPapers(dailyCategory)
      setDailyPapers(papers || [])
      if (!papers || papers.length === 0) {
        setError('无法获取论文列表，请稍后重试')
      }
    } catch {
      setError('加载每日论文失败')
    } finally {
      setDailyLoading(false)
    }
  }, [dailyCategory])

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyPapers()
    }
  }, [activeTab, loadDailyPapers])

  const handleSelectPaper = async (paper: ArxivPaper | S2Paper) => {
    setSelectedPaper(paper)
    setCitations([])
    setRecommendations([])

    // 如果是 Semantic Scholar 论文，获取引用和推荐
    if ('citationCount' in paper && paper.source === 'Semantic Scholar') {
      try {
        const [cites, recs] = await Promise.all([
          apiService.getPaperCitations(paper.id, 10),
          apiService.getRecommendedPapers(paper.id, 5)
        ])
        setCitations(cites || [])
        setRecommendations(recs || [])
      } catch {
        // 忽略错误
      }
    }
  }

  const toggleFavorite = (paperId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(paperId)) {
        next.delete(paperId)
      } else {
        next.add(paperId)
      }
      return next
    })
  }

  const isArxivPaper = (paper: ArxivPaper | S2Paper): paper is ArxivPaper => {
  return 'categories' in paper
}

const getPaperSummary = (paper: ArxivPaper | S2Paper): string => {
  if ('summary' in paper) return paper.summary
  if ('abstract' in paper) return paper.abstract
  return ''
}

const getPaperDate = (paper: ArxivPaper | S2Paper): string => {
  if ('published' in paper && paper.published) return paper.published
  if ('publishedDate' in paper && paper.publishedDate) return paper.publishedDate
  return ''
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr.substring(0, 10)
    }
  }

  const PaperCard: React.FC<{ paper: ArxivPaper | S2Paper; compact?: boolean }> = ({ paper, compact }) => {
    const isArxiv = isArxivPaper(paper)
    const isFav = favorites.has(paper.id)
    const authors = isArxiv ? paper.authors : (paper.authors || [])

    return (
      <div
        className="research-paper-card"
        onClick={() => handleSelectPaper(paper)}
        style={{
          padding: compact ? '8px 12px' : '14px 16px',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          transition: 'background 0.2s',
          background: selectedPaper?.id === paper.id ? 'var(--accent-light)' : 'transparent'
        }}
        onMouseOver={(e) => {
          if (selectedPaper?.id !== paper.id) {
            (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg, rgba(128,128,128,0.08))'
          }
        }}
        onMouseOut={(e) => {
          if (selectedPaper?.id !== paper.id) {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: compact ? '12px' : '14px',
              fontWeight: 600,
              lineHeight: 1.4,
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {paper.title}
            </div>
            
            {!compact && getPaperSummary(paper) && (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: '8px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {getPaperSummary(paper)}
              </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
              {authors.length > 0 && (
                <span style={{ fontStyle: 'italic' }}>
                  {authors.slice(0, 3).join(', ')}
                  {authors.length > 3 ? ` 等 ${authors.length} 位作者` : ''}
                </span>
              )}
              
              {'citationCount' in paper && paper.citationCount > 0 && (
                <span style={{ 
                  background: 'rgba(59,130,246,0.15)', 
                  color: '#3b82f6', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: 500
                }}>
                  {paper.citationCount} 引用
                </span>
              )}
              
              {isArxiv && paper.categories && paper.categories.length > 0 && (
                <span style={{ 
                  background: 'rgba(16,185,129,0.15)', 
                  color: '#10b981', 
                  padding: '2px 6px', 
                  borderRadius: '4px'
                }}>
                  {paper.categories[0]}
                </span>
              )}
              
              {!isArxiv && 'venue' in paper && paper.venue && (
                <span style={{ 
                  background: 'rgba(168,85,247,0.15)', 
                  color: '#a855f7', 
                  padding: '2px 6px', 
                  borderRadius: '4px'
                }}>
                  {paper.venue}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(paper.id) }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: isFav ? '#f59e0b' : 'var(--text-secondary)',
                  opacity: 0.7
                }}
                title={isFav ? '取消收藏' : '收藏论文'}
              >
                <StarIcon size={14} />
              </button>
              <a
                href={isArxiv ? paper.url : paper.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none'
                }}
                title="在新窗口打开"
              >
                <ExternalLinkIcon size={14} />
              </a>
              {isArxiv && paper.pdfUrl && (
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none'
                  }}
                  title="下载PDF"
                >
                  <DownloadIcon size={14} />
                </a>
              )}
            </div>
            
            {paper.source && (
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                background: paper.source === 'arXiv' || paper.source === 'arXiv Daily' ? 'rgba(234,67,53,0.1)' : 'rgba(68,136,238,0.1)',
                color: paper.source === 'arXiv' || paper.source === 'arXiv Daily' ? '#ea4335' : '#4488ee',
                borderRadius: '3px',
                fontWeight: 500
              }}>
                {paper.source}
              </span>
            )}
          </div>
        </div>
        
        {getPaperDate(paper) && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {formatDate(getPaperDate(paper))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* 头部 */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <ResearchIcon size={24} />
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>AI 研究助手</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>arXiv + Semantic Scholar 学术论文搜索</div>
        </div>
      </div>

      {/* 标签页 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-tertiary)'
      }}>
        {[
          { id: 'search', label: '论文搜索', icon: <ResearchIcon size={14} /> },
          { id: 'daily', label: '每日精选', icon: <DailyPaperIcon size={14} /> },
          { id: 'citations', label: '引用分析', icon: <CitationIcon size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType)
              if (tab.id === 'citations' && selectedPaper) {
                handleSelectPaper(selectedPaper)
              }
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'search' && (
          <div>
            {/* 搜索栏 */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="输入研究关键词，如：transformer, LLM, neural network..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={performSearch}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {loading ? '搜索中...' : '搜索'}
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center' }}>数据源：</span>
                {([
                  { value: 'both', label: '全部' },
                  { value: 'arxiv', label: 'arXiv' },
                  { value: 'semanticscholar', label: 'Semantic Scholar' },
                ] as { value: SourceType; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSource(opt.value)}
                    style={{
                      padding: '4px 12px',
                      background: source === opt.value ? '#667eea' : 'var(--bg-tertiary)',
                      color: source === opt.value ? 'white' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              {searchHistory.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>历史：</span>
                  {searchHistory.slice(0, 5).map(q => (
                    <button
                      key={q}
                      onClick={() => { setSearchQuery(q); }}
                      style={{
                        padding: '2px 8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div style={{ 
                margin: '16px', 
                padding: '12px 16px', 
                background: 'rgba(239,68,68,0.1)', 
                color: '#ef4444',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            {/* 加载状态 */}
            {loading && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '3px solid var(--border)',
                  borderTopColor: '#667eea',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite'
                }} />
                正在搜索论文...
              </div>
            )}

            {/* 搜索结果 */}
            {!loading && results.length > 0 && (
              <div>
                <div style={{ 
                  padding: '12px 16px', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)'
                }}>
                  找到 {results.length} 篇论文
                </div>
                {results.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            )}

            {/* 空状态 */}
            {!loading && !error && results.length === 0 && (
              <div style={{ 
                padding: '60px 20px', 
                textAlign: 'center', 
                color: 'var(--text-secondary)'
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5
                }}>
                  <ResearchIcon size={32} />
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  开始您的研究探索
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
                  输入关键词搜索 arXiv 和 Semantic Scholar 上的学术论文，
                  查看引用关系和相关推荐
                </div>
                <div style={{ 
                  marginTop: '24px', 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {['transformer', 'large language model', 'diffusion model', 'reinforcement learning'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setSearchQuery(suggestion); }}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'daily' && (
          <div>
            {/* 分类选择 */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>选择学科分类</div>
              <select
                value={dailyCategory}
                onChange={(e) => setDailyCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}
              >
                {ARXIV_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <button
                onClick={loadDailyPapers}
                disabled={dailyLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: dailyLoading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: dailyLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {dailyLoading ? '加载中...' : '刷新论文列表'}
              </button>
            </div>

            {/* 每日论文列表 */}
            {dailyLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '3px solid var(--border)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite'
                }} />
                加载最新论文...
              </div>
            ) : dailyPapers.length > 0 ? (
              <div>
                <div style={{ 
                  padding: '12px 16px', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)'
                }}>
                  arXiv {ARXIV_CATEGORIES.find(c => c.id === dailyCategory)?.name} 最新论文
                </div>
                {dailyPapers.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                暂无论文数据
              </div>
            )}
          </div>
        )}

        {activeTab === 'citations' && (
          <div>
            {selectedPaper ? (
              <div>
                {/* 选中的论文信息 */}
                <div style={{ 
                  padding: '16px', 
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    当前论文
                  </div>
                  <PaperCard paper={selectedPaper} compact />
                </div>

                {/* 引用论文列表 */}
                {citations.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 16px', 
                      fontSize: '13px', 
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-tertiary)'
                    }}>
                      📊 引用论文 ({citations.length})
                    </div>
                    {citations.map(paper => (
                      <PaperCard key={paper.id} paper={paper} compact />
                    ))}
                  </div>
                )}

                {/* 推荐相关论文 */}
                {recommendations.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '12px 16px', 
                      fontSize: '13px', 
                      fontWeight: 500,
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg-tertiary)',
                      marginTop: '8px'
                    }}>
                      💡 相关推荐 ({recommendations.length})
                    </div>
                    {recommendations.map(paper => (
                      <PaperCard key={paper.id} paper={paper} compact />
                    ))}
                  </div>
                )}

                {citations.length === 0 && recommendations.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      margin: '0 auto 16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.5
                    }}>
                      <CitationIcon size={24} />
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      点击论文可查看引用关系和相关推荐
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5
                }}>
                  <CitationIcon size={32} />
                </div>
                <div style={{ fontSize: '14px' }}>
                  请先在"论文搜索"中选择一篇论文
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div style={{ 
        padding: '8px 16px', 
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>收藏: {favorites.size}</span>
          <span>|</span>
          <span>历史: {searchHistory.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArxivIcon size={12} />
          <span>数据来源: arXiv.org & Semantic Scholar</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .research-paper-card {
          transition: background 0.2s ease;
        }
        .research-paper-card:hover {
          background: var(--hover-bg, rgba(128,128,128,0.08)) !important;
        }
      `}</style>
    </div>
  )
}

export default ResearchAssistant
