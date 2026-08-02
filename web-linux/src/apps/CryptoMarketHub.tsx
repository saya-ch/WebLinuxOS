import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, Search, Star, StarOff, DollarSign, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Sparkles, Globe, Eye, Loader2, PieChart, Activity } from 'lucide-react'

interface CoinData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency?: number
  circulating_supply: number
  total_supply?: number
  high_24h: number
  low_24h: number
  ath: number
  atl: number
  last_updated: string
  sparkline_in_7d?: { price: number[] }
}

const CACHE_KEY = 'cryptohub-cache-v1'
const FAV_KEY = 'cryptohub-favorites-v1'
const HOLDINGS_KEY = 'cryptohub-holdings-v1'
const CACHE_TTL = 60 * 1000 // 1分钟缓存

const VS_CURRENCY = 'usd'

// CoinGecko 公开免费 API（无需密钥，有速率限制）
const API_BASE = 'https://api.coingecko.com/api/v3'

function formatNumber(n: number, maxDecimals = 2): string {
  if (!isFinite(n)) return '--'
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(maxDecimals) + 'T'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(maxDecimals) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(maxDecimals) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(maxDecimals) + 'K'
  if (Math.abs(n) < 1 && n !== 0) {
    const decimals = Math.min(6, -Math.floor(Math.log10(Math.abs(n))) + 2)
    return n.toFixed(decimals)
  }
  return n.toFixed(maxDecimals)
}

function formatPrice(n: number): string {
  if (!isFinite(n)) return '$--'
  if (n < 0.0001) return '$' + n.toFixed(8)
  if (n < 0.01) return '$' + n.toFixed(6)
  if (n < 1) return '$' + n.toFixed(4)
  if (n < 100) return '$' + n.toFixed(2)
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function useMiniSparkline(data: number[], width = 100, height = 36, color = '#22c55e') {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const isUp = data[data.length - 1] >= data[0]
  const finalColor = isUp ? '#22c55e' : '#ef4444'
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color === 'auto' ? finalColor : color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

type Tab = 'all' | 'favorites' | 'portfolio' | 'gainers' | 'losers'

interface Holding {
  coinId: string
  amount: number
  avgPrice?: number
}

export default function CryptoMarketHub() {
  const [coins, setCoins] = useState<CoinData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')) } catch { return new Set() }
  })
  const [holdings, setHoldings] = useState<Record<string, Holding>>(() => {
    try { return JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '{}') } catch { return {} }
  })
  const [refreshInterval, setRefreshInterval] = useState(60) // 秒
  const [holdingModal, setHoldingModal] = useState<{ open: boolean; coinId: string; name: string; amount: string; avgPrice: string }>({ open: false, coinId: '', name: '', amount: '', avgPrice: '' })
  const lastFetchRef = useRef(0)

  const saveFavorites = (next: Set<string>) => {
    setFavorites(next)
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
  }
  const toggleFavorite = (id: string) => {
    saveFavorites(new Set(favorites.has(id) ? [...favorites].filter(x => x !== id) : [...favorites, id]))
  }

  const saveHoldings = (next: Record<string, Holding>) => {
    setHoldings(next)
    try { localStorage.setItem(HOLDINGS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const openHoldingModal = (coin: CoinData) => {
    const existing = holdings[coin.id]
    setHoldingModal({
      open: true,
      coinId: coin.id,
      name: coin.name,
      amount: existing?.amount.toString() || '',
      avgPrice: existing?.avgPrice?.toString() || ''
    })
  }

  const saveHolding = () => {
    const amount = parseFloat(holdingModal.amount)
    const avgPrice = holdingModal.avgPrice ? parseFloat(holdingModal.avgPrice) : undefined
    if (!isFinite(amount) || amount < 0) {
      alert('请输入有效的数量')
      return
    }
    const next = { ...holdings }
    if (amount === 0) {
      delete next[holdingModal.coinId]
    } else {
      next[holdingModal.coinId] = { coinId: holdingModal.coinId, amount, avgPrice }
    }
    saveHoldings(next)
    setHoldingModal(h => ({ ...h, open: false }))
  }

  const fetchMarkets = useCallback(async (force = false) => {
    setError(null)
    const now = Date.now()
    if (!force && now - lastFetchRef.current < CACHE_TTL && coins.length > 0) {
      return
    }
    // 读缓存
    if (!force) {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const cached = JSON.parse(raw)
          if (now - cached.time < CACHE_TTL && cached.data?.length > 0) {
            setCoins(cached.data)
            lastFetchRef.current = cached.time
            return
          }
        }
      } catch { /* ignore */ }
    }
    setLoading(true)
    try {
      const url = `${API_BASE}/coins/markets?vs_currency=${VS_CURRENCY}&order=market_cap_desc&per_page=80&page=1&sparkline=true&price_change_percentage=24h,7d`
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (!resp.ok) {
        if (resp.status === 429) throw new Error('API 速率限制，请稍后重试')
        throw new Error(`请求失败 (${resp.status})`)
      }
      const data: CoinData[] = await resp.json()
      if (!data || !Array.isArray(data)) throw new Error('数据格式异常')
      setCoins(data)
      lastFetchRef.current = Date.now()
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }))
      } catch { /* ignore */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取行情失败')
    } finally {
      setLoading(false)
    }
  }, [coins.length])

  useEffect(() => {
    fetchMarkets()
    const timer = setInterval(() => fetchMarkets(), refreshInterval * 1000)
    return () => clearInterval(timer)
  }, [fetchMarkets, refreshInterval])

  const displayCoins = useMemo(() => {
    let list = coins
    if (tab === 'favorites') list = list.filter(c => favorites.has(c.id))
    if (tab === 'portfolio') list = list.filter(c => holdings[c.id])
    if (tab === 'gainers') list = [...list].filter(c => c.price_change_percentage_24h > 0).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 20)
    if (tab === 'losers') list = [...list].filter(c => c.price_change_percentage_24h < 0).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 20)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      )
    }
    return list
  }, [coins, tab, favorites, holdings, search])

  const portfolioStats = useMemo(() => {
    let totalValue = 0
    let totalCost = 0
    let totalChange24hUsd = 0
    for (const coin of coins) {
      const h = holdings[coin.id]
      if (!h) continue
      const value = coin.current_price * h.amount
      totalValue += value
      if (h.avgPrice) totalCost += h.avgPrice * h.amount
      const change24h = coin.price_change_percentage_24h || 0
      totalChange24hUsd += value * (change24h / 100)
    }
    const pnl = totalCost > 0 ? totalValue - totalCost : 0
    const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0
    const changePercent24h = totalValue > 0 ? (totalChange24hUsd / (totalValue - totalChange24hUsd)) * 100 : 0
    return { totalValue, totalCost, pnl, pnlPercent, changePercent24h, totalChange24hUsd }
  }, [coins, holdings])

  const globalMarket = useMemo(() => {
    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0)
    const totalVol = coins.reduce((s, c) => s + (c.total_volume || 0), 0)
    const gainers = coins.filter(c => c.price_change_percentage_24h > 0).length
    const losers = coins.filter(c => c.price_change_percentage_24h < 0).length
    return { totalMcap, totalVol, gainers, losers, total: coins.length }
  }, [coins])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '全部', icon: <Globe size={14} /> },
    { id: 'gainers', label: '涨幅榜', icon: <TrendingUp size={14} /> },
    { id: 'losers', label: '跌幅榜', icon: <TrendingDown size={14} /> },
    { id: 'favorites', label: `自选 (${favorites.size})`, icon: <Star size={14} /> },
    { id: 'portfolio', label: '持仓', icon: <PieChart size={14} /> }
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0a0f1c 0%, #101833 100%)',
      color: '#e6e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 顶部栏 */}
      <div style={{
        padding: '14px 20px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <DollarSign size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              CryptoMarketHub
              <button onClick={() => fetchMarkets(true)} disabled={loading} style={{
                padding: '3px 8px', fontSize: 11, background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80',
                borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
                刷新
              </button>
              <select value={refreshInterval} onChange={e => setRefreshInterval(parseInt(e.target.value))} style={{
                fontSize: 11, padding: '3px 6px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#a0a8c8',
                borderRadius: 6, outline: 'none'
              }}>
                <option value={30}>30秒</option>
                <option value={60}>1分钟</option>
                <option value={300}>5分钟</option>
                <option value={0}>手动</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: '#6e7694', marginTop: 2 }}>
              数据来源: CoinGecko 公开 API · 已加载 {coins.length} 币种 ·
              <span style={{ color: coins.length > 0 ? '#4ade80' : '#ef4444' }}>
                {error ? ' ' + error : ' OK'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#8a90ab',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <BarChart3 size={12} />
              全市场: ${formatNumber(globalMarket.totalMcap)}
            </span>
          </div>
        </div>

        {/* 搜索 + Tab */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#5a6083' }} />
            <input
              type="text"
              placeholder="搜索币种 (BTC, Ethereum, 等)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 30px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#e6e8f0', fontSize: 12.5,
                outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px',
                background: tab === t.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                border: `1px solid ${tab === t.id ? 'rgba(99,102,241,0.35)' : 'transparent'}`,
                borderRadius: 8, color: tab === t.id ? '#a5b4fc' : '#7b82a4',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}
                onMouseOver={e => { if (tab !== t.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                onMouseOut={e => { if (tab !== t.id) { e.currentTarget.style.background = 'transparent' } }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 行情概览条 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: tab === 'portfolio' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
        gap: 10,
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        {tab === 'portfolio' && (
          <>
            <StatCard
              title="持仓总价值"
              value={formatPrice(portfolioStats.totalValue)}
              sub={`≈ ${formatNumber(portfolioStats.totalValue / 7.2, 2)} CNY`}
              icon={<Eye size={14} />}
              accent="#3b82f6"
            />
            <StatCard
              title="总盈亏"
              value={`${portfolioStats.pnl >= 0 ? '+' : ''}${formatPrice(portfolioStats.pnl)}`}
              sub={`${portfolioStats.pnlPercent >= 0 ? '+' : ''}${portfolioStats.pnlPercent.toFixed(2)}%`}
              icon={<Activity size={14} />}
              accent={portfolioStats.pnl >= 0 ? '#22c55e' : '#ef4444'}
            />
            <StatCard
              title="24h 浮动盈亏"
              value={`${portfolioStats.totalChange24hUsd >= 0 ? '+' : ''}${formatPrice(portfolioStats.totalChange24hUsd)}`}
              sub={`${portfolioStats.changePercent24h >= 0 ? '+' : ''}${portfolioStats.changePercent24h.toFixed(2)}%`}
              icon={<Sparkles size={14} />}
              accent={portfolioStats.changePercent24h >= 0 ? '#22c55e' : '#ef4444'}
            />
            <StatCard
              title="投入成本"
              value={formatPrice(portfolioStats.totalCost)}
              sub={portfolioStats.totalCost > 0 ? `${Object.keys(holdings).length} 个币种` : '点击添加持仓'}
              icon={<BarChart3 size={14} />}
              accent="#8b5cf6"
            />
          </>
        )}
        {tab !== 'portfolio' && (
          <>
            <StatCard
              title="上涨 / 下跌"
              value={`${globalMarket.gainers} / ${globalMarket.losers}`}
              sub={`共 ${globalMarket.total} 个币种`}
              icon={<TrendingUp size={14} />}
              accent="#f59e0b"
            />
            <StatCard
              title="全市场 24h 成交额"
              value={`$${formatNumber(globalMarket.totalVol)}`}
              sub="Top 80 统计"
              icon={<DollarSign size={14} />}
              accent="#22c55e"
            />
            <StatCard
              title="全市场总市值"
              value={`$${formatNumber(globalMarket.totalMcap)}`}
              sub="实时估算"
              icon={<Globe size={14} />}
              accent="#3b82f6"
            />
          </>
        )}
      </div>

      {/* 列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && coins.length === 0 && (
          <div style={{
            padding: '80px 20px', textAlign: 'center', color: '#7b82a4'
          }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: 12 }} />
            <div style={{ fontSize: 13 }}>正在加载行情数据...</div>
            <div style={{ fontSize: 11, color: '#5a6083', marginTop: 4 }}>CoinGecko 免费 API，请求频率受限请耐心等待</div>
          </div>
        )}

        {error && coins.length === 0 && (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: '#ef4444'
          }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>加载失败: {error}</div>
            <button onClick={() => fetchMarkets(true)} style={{
              padding: '6px 16px', marginTop: 8,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
            }}>重试</button>
          </div>
        )}

        {displayCoins.length === 0 && !loading && (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: '#6e7694'
          }}>
            {tab === 'favorites' ? (
              <>
                <StarOff size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>还没有收藏币种</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>点击列表中的星标添加自选</div>
              </>
            ) : tab === 'portfolio' ? (
              <>
                <PieChart size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>还没有持仓</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>切换到「全部」tab，点击最右侧按钮添加持仓</div>
              </>
            ) : search ? (
              <>
                <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>未找到 "{search}"</div>
              </>
            ) : null}
          </div>
        )}

        {/* 表头 */}
        {displayCoins.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 48px 1.5fr 1fr 1fr 1fr 110px 80px',
            gap: 12,
            padding: '8px 20px',
            fontSize: 10.5,
            color: '#5a6083',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            position: 'sticky',
            top: 0,
            background: 'inherit',
            zIndex: 2
          }}>
            <div></div>
            <div>#</div>
            <div>币种</div>
            <div style={{ textAlign: 'right' }}>价格</div>
            <div style={{ textAlign: 'right' }}>24h%</div>
            <div style={{ textAlign: 'right' }}>市值 / 交易量</div>
            <div style={{ textAlign: 'center' }}>7日走势</div>
            <div style={{ textAlign: 'right' }}>操作</div>
          </div>
        )}

        {displayCoins.map((coin, i) => {
          const change24h = coin.price_change_percentage_24h ?? 0
          const isUp = change24h >= 0
          const holding = holdings[coin.id]
          return (
            <div
              key={coin.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 48px 1.5fr 1fr 1fr 1fr 110px 80px',
                gap: 12,
                padding: '11px 20px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                cursor: 'default',
                transition: 'background 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* 收藏 */}
              <div>
                <button onClick={() => toggleFavorite(coin.id)} style={{
                  background: 'transparent', border: 'none',
                  color: favorites.has(coin.id) ? '#fbbf24' : '#47506d',
                  cursor: 'pointer', padding: 2
                }}>
                  {favorites.has(coin.id) ? <Star size={14} fill="#fbbf24" /> : <Star size={14} />}
                </button>
              </div>

              <div style={{ fontSize: 11.5, color: '#5a6083', fontWeight: 600 }}>
                {coin.market_cap_rank || (i + 1)}
              </div>

              {/* 币种 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <img
                  src={coin.image}
                  alt={coin.symbol}
                  width={26} height={26}
                  style={{ borderRadius: '50%', background: '#1a2140', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f2fa', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {coin.name}
                    {holding && (
                      <span style={{
                        fontSize: 9.5,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: 'rgba(139,92,246,0.15)',
                        color: '#c4b5fd'
                      }}>
                        持仓 {holding.amount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a6083', textTransform: 'uppercase', fontWeight: 600 }}>
                    {coin.symbol}
                  </div>
                </div>
              </div>

              {/* 价格 */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: '#f0f2fa' }}>
                  {formatPrice(coin.current_price)}
                </div>
                <div style={{ fontSize: 10, color: '#5a6083', marginTop: 2 }}>
                  24h H/L: {formatPrice(coin.high_24h)} / {formatPrice(coin.low_24h)}
                </div>
              </div>

              {/* 24h % */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontSize: 13, fontWeight: 700,
                  color: isUp ? '#22c55e' : '#ef4444',
                  fontFamily: 'ui-monospace, monospace'
                }}>
                  {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {isUp ? '+' : ''}{change24h.toFixed(2)}%
                </div>
              </div>

              {/* 市值/交易量 */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b9bdce', fontFamily: 'ui-monospace, monospace' }}>
                  MCap ${formatNumber(coin.market_cap)}
                </div>
                <div style={{ fontSize: 10.5, color: '#5a6083', marginTop: 2 }}>
                  Vol ${formatNumber(coin.total_volume)}
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {useMiniSparkline(
                  coin.sparkline_in_7d?.price || [],
                  100, 28, 'auto'
                ) || (
                  <span style={{ color: '#3e435f', fontSize: 10 }}>N/A</span>
                )}
              </div>

              {/* 操作 */}
              <div style={{ textAlign: 'right' }}>
                <button onClick={() => openHoldingModal(coin)} style={{
                  padding: '5px 9px',
                  background: holding ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)',
                  border: `1px solid ${holding ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.25)'}`,
                  color: holding ? '#4ade80' : '#818cf8',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'inherit'
                }}>
                  {holding ? '编辑' : '添加持仓'}
                </button>
              </div>
            </div>
          )
        })}

        {displayCoins.length > 0 && (
          <div style={{ padding: '14px 20px 20px', textAlign: 'center', color: '#5a6083', fontSize: 10.5 }}>
            <Clock size={10} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            数据最后更新: {coins[0]?.last_updated ? new Date(coins[0].last_updated).toLocaleString() : 'N/A'}
            {' · '} CoinGecko Free API · 无需密钥 · 速率限制每分钟约10-30次
          </div>
        )}
      </div>

      {/* 持仓编辑 Modal */}
      {holdingModal.open && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100
        }} onClick={() => setHoldingModal(h => ({ ...h, open: false }))}>
          <div style={{
            width: 340,
            background: '#111936',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              编辑持仓 · {holdingModal.name}
            </div>
            <div style={{ fontSize: 12, color: '#6e7694', marginBottom: 16 }}>
              输入您持有的数量和平均成本 (可选)
            </div>

            <label style={{ display: 'block', fontSize: 11.5, color: '#8a90ab', marginBottom: 6, fontWeight: 600 }}>
              持有数量
            </label>
            <input type="number" step="any" value={holdingModal.amount}
              onChange={e => setHoldingModal(h => ({ ...h, amount: e.target.value }))}
              placeholder="例如: 0.5"
              style={{
                width: '100%', marginBottom: 12,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff', fontSize: 13,
                outline: 'none', fontFamily: 'inherit'
              }} />

            <label style={{ display: 'block', fontSize: 11.5, color: '#8a90ab', marginBottom: 6, fontWeight: 600 }}>
              平均买入价格 USD (可选，用于盈亏计算)
            </label>
            <input type="number" step="any" value={holdingModal.avgPrice}
              onChange={e => setHoldingModal(h => ({ ...h, avgPrice: e.target.value }))}
              placeholder="例如: 30000"
              style={{
                width: '100%', marginBottom: 16,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#fff', fontSize: 13,
                outline: 'none', fontFamily: 'inherit'
              }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setHoldingModal(h => ({ ...h, open: false }))} style={{
                flex: 1, padding: '8px 0',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#8a90ab', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>取消</button>
              <button onClick={saveHolding} style={{
                flex: 1, padding: '8px 0',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: '#fff', borderRadius: 8,
                cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit'
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.35); }
      `}</style>
    </div>
  )
}

function StatCard({ title, value, sub, icon, accent }: {
  title: string; value: string; sub?: string; icon: React.ReactNode; accent: string
}) {
  return (
    <div style={{
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}18`,
      borderRadius: 12,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${accent}18`,
        color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: '#6e7694', marginBottom: 2, fontWeight: 600, letterSpacing: '0.02em' }}>
          {title}
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700,
          color: '#f0f2fa',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          lineHeight: 1.2
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10.5, color: '#5a6083', marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
