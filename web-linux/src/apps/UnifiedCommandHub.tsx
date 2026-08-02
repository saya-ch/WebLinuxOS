import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Zap, Globe, Code, BookOpen, Newspaper, TrendingUp, CloudSun, DollarSign, Calculator, Clock, Send, Sparkles, History, ChevronRight, Loader2 } from 'lucide-react'

type ResultType = 'weather' | 'news' | 'quote' | 'exchange' | 'country' | 'wikipedia' | 'calculation' | 'definition'

interface QueryResult {
  type: ResultType
  title: string
  content: string
  data?: unknown
  timestamp: Date
}

interface HistoryItem {
  query: string
  result: QueryResult
}

const API_CONFIG = {
  weather: 'https://wttr.in/{city}?format=j1',
  news: 'https://api.chucknorris.io/jokes/random',
  exchange: 'https://api.frankfurter.app/latest?from={from}&to={to}',
  quote: 'https://zenquotes.io/api/random',
  country: 'https://restcountries.com/v3.1/name/{name}?fields=name,capital,population,flags,currencies,languages,region,area,timezones',
  wikipedia: 'https://en.wikipedia.org/api/rest_v1/page/summary/{title}',
  definition: 'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'
}

// 安全汇率计算缓存
const rateCache = new Map<string, { rate: number; time: number }>()

function detectQueryType(query: string): { type: string; params: Record<string, string> } {
  const q = query.toLowerCase().trim()

  // 天气查询：weather [城市] / 天气 [城市]
  if (q.match(/^(weather|天气|wttr)\s+/) || q.endsWith('天气')) {
    const city = q.replace(/^(weather|天气|wttr)\s+/, '').replace(/天气$/, '').trim()
    return { type: 'weather', params: { city: city || 'Beijing' } }
  }

  // 汇率：exchange 100 USD to CNY / 汇率 100 USD CNY
  const exchangeMatch = q.match(/^(exchange|汇率|convert)\s+(\d*\.?\d*)\s*([a-z]{3})\s*(?:to|->)?\s*([a-z]{3})?/i)
  if (exchangeMatch) {
    const [, , amount, from, to] = exchangeMatch
    return {
      type: 'exchange',
      params: {
        amount: amount || '1',
        from: (from || 'USD').toUpperCase(),
        to: (to || 'CNY').toUpperCase()
      }
    }
  }

  // 名言/语录
  if (q.match(/^(quote|名言|语录|joke|笑话|chuck|chuck norris)$/)) {
    return { type: q.includes('joke') || q.includes('chuck') ? 'joke' : 'quote', params: {} }
  }

  // 国家信息：country [国家名] / 国家 [国家名]
  if (q.match(/^(country|国家)\s+/)) {
    const name = q.replace(/^(country|国家)\s+/, '').trim()
    return { type: 'country', params: { name } }
  }

  // 维基百科：wiki [关键词] / wikipedia [关键词] / 维基 [关键词]
  if (q.match(/^(wiki|wikipedia|维基)\s+/)) {
    const title = q.replace(/^(wiki|wikipedia|维基)\s+/, '').trim()
    return { type: 'wikipedia', params: { title } }
  }

  // 词典定义：define [词] / 定义 [词] / dict [词]
  if (q.match(/^(define|definition|dict|定义|词典)\s+/) || q.includes('是什么意思') || q.includes('什么意思')) {
    let word = q.replace(/^(define|definition|dict|定义|词典)\s+/, '').replace(/(是什么意思|什么意思)$/, '').trim()
    return { type: 'definition', params: { word } }
  }

  // 计算器表达式检测
  if (/^[\d\s+\-*/().^%√πe]+$/.test(query) && /[\d]/.test(query)) {
    return { type: 'calculation', params: { expression: query } }
  }

  // 默认：维基百科搜索
  return { type: 'wikipedia', params: { title: query } }
}

function safeCalculate(expr: string): string {
  try {
    // 安全的表达式预处理
    const sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/π/g, 'Math.PI')
      .replace(/e(?![a-zA-Z])/g, 'Math.E')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/√(\d)/g, 'Math.sqrt($1)')

    // 只允许安全字符
    if (!/^[\d\s+\-*/().,%\w\s]+$/.test(sanitized)) {
      throw new Error('表达式包含非法字符')
    }

    // 使用 Function 构造器，但在独立作用域内
    // eslint-disable-next-line no-new-func
    const fn = new Function(`
      "use strict";
      const Math = {
        PI: ${Math.PI},
        E: ${Math.E},
        sqrt: Math.sqrt,
        abs: Math.abs,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log,
        log2: Math.log2,
        log10: Math.log10,
        pow: Math.pow,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        max: Math.max,
        min: Math.min,
      };
      return (${sanitized});
    `)
    const result = fn()
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('计算结果无效')
    }
    return Number(result.toPrecision(12)).toString()
  } catch (e) {
    return `计算错误: ${e instanceof Error ? e.message : '未知错误'}`
  }
}

const typeIcons: Record<string, React.ReactNode> = {
  weather: <CloudSun size={18} />,
  news: <Newspaper size={18} />,
  quote: <Sparkles size={18} />,
  joke: <Sparkles size={18} />,
  exchange: <DollarSign size={18} />,
  country: <Globe size={18} />,
  wikipedia: <BookOpen size={18} />,
  definition: <BookOpen size={18} />,
  calculation: <Calculator size={18} />
}

const typeLabels: Record<string, string> = {
  weather: '天气',
  news: '新闻',
  quote: '名言',
  joke: '笑话',
  exchange: '汇率',
  country: '国家',
  wikipedia: '维基百科',
  definition: '词典',
  calculation: '计算'
}

export default function UnifiedCommandHub() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const saved = localStorage.getItem('unified-command-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch { /* ignore */ }
    }
  }, [])

  const executeQuery = useCallback(async () => {
    if (!query.trim()) return
    const q = query.trim()
    setLoading(true)
    setError(null)

    const detected = detectQueryType(q)
    console.log('[UnifiedCommandHub] Detected:', detected)

    try {
      let resultData: QueryResult

      switch (detected.type) {
        case 'weather': {
          const city = detected.params.city || 'Beijing'
          const url = API_CONFIG.weather.replace('{city}', encodeURIComponent(city))
          const resp = await fetch(url)
          if (!resp.ok) throw new Error('天气查询失败')
          const data = await resp.json()
          const cur = data.current_condition?.[0]
          const today = data.weather?.[0]
          resultData = {
            type: 'weather',
            title: `${city} 天气`,
            content: `当前温度: ${cur?.temp_C ?? '--'}°C (体感 ${cur?.FeelsLikeC ?? '--'}°C)\n` +
              `天气: ${cur?.weatherDesc?.[0]?.value ?? '--'}\n` +
              `湿度: ${cur?.humidity ?? '--'}% | 风速: ${cur?.windspeedKmph ?? '--'} km/h\n` +
              `气压: ${cur?.pressure ?? '--'} hPa | 能见度: ${cur?.visibility ?? '--'} km\n` +
              `今日最高/最低: ${today?.maxtempC ?? '--'}°C / ${today?.mintempC ?? '--'}°C`,
            data,
            timestamp: new Date()
          }
          break
        }

        case 'joke':
        case 'quote': {
          if (detected.type === 'joke') {
            const resp = await fetch(API_CONFIG.news)
            if (!resp.ok) throw new Error('获取失败')
            const data = await resp.json()
            resultData = {
              type: 'quote',
              title: 'Chuck Norris 笑话',
              content: data.value || 'No joke found',
              data,
              timestamp: new Date()
            }
          } else {
            try {
              const resp = await fetch(API_CONFIG.quote)
              if (!resp.ok) throw new Error()
              const data = await resp.json()
              resultData = {
                type: 'quote',
                title: '今日名言',
                content: `"${data[0]?.q || 'Life is what happens when you are busy making other plans.'}"\n\n— ${data[0]?.a || 'John Lennon'}`,
                data,
                timestamp: new Date()
              }
            } catch {
              resultData = {
                type: 'quote',
                title: '今日名言',
                content: '"The only way to do great work is to love what you do."\n\n— Steve Jobs',
                timestamp: new Date()
              }
            }
          }
          break
        }

        case 'exchange': {
          const { amount, from, to } = detected.params
          const cacheKey = `${from}_${to}`
          const cached = rateCache.get(cacheKey)
          let rate: number

          if (cached && Date.now() - cached.time < 3600000) {
            rate = cached.rate
          } else {
            const url = API_CONFIG.exchange.replace('{from}', from).replace('{to}', to)
            const resp = await fetch(url)
            if (!resp.ok) throw new Error('汇率查询失败')
            const data = await resp.json()
            rate = data.rates?.[to] || 1
            rateCache.set(cacheKey, { rate, time: Date.now() })
          }
          const amt = parseFloat(amount) || 1
          const converted = amt * rate
          resultData = {
            type: 'exchange',
            title: '汇率转换',
            content: `${amt.toLocaleString()} ${from} = ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}\n\n汇率: 1 ${from} = ${rate.toFixed(6)} ${to}\n(数据更新于 1 小时内)`,
            data: { amount: amt, from, to, rate, converted },
            timestamp: new Date()
          }
          break
        }

        case 'country': {
          const name = detected.params.name
          const resp = await fetch(API_CONFIG.country.replace('{name}', encodeURIComponent(name)))
          if (!resp.ok) throw new Error('未找到该国家')
          const data = await resp.json()
          const c = data[0]
          const currencies = c.currencies ? Object.values(c.currencies).map((cu: any) => `${cu.name} (${cu.symbol || ''})`).join(', ') : '--'
          const languages = c.languages ? Object.values(c.languages).join(', ') : '--'
          resultData = {
            type: 'country',
            title: `${c.name.common} (${c.name.official})`,
            content: `首都: ${c.capital?.[0] || '--'}\n` +
              `地区: ${c.region || '--'}\n` +
              `人口: ${(c.population || 0).toLocaleString()}\n` +
              `面积: ${(c.area || 0).toLocaleString()} km²\n` +
              `货币: ${currencies}\n` +
              `语言: ${languages}\n` +
              `时区: ${c.timezones?.[0] || '--'}`,
            data: c,
            timestamp: new Date()
          }
          break
        }

        case 'wikipedia': {
          const title = detected.params.title
          const resp = await fetch(API_CONFIG.wikipedia.replace('{title}', encodeURIComponent(title)))
          if (!resp.ok) throw new Error('未找到相关条目')
          const data = await resp.json()
          resultData = {
            type: 'wikipedia',
            title: data.title || title,
            content: `${data.extract || data.description || '暂无摘要信息'}\n\n阅读更多: ${data.content_urls?.desktop?.page || ''}`,
            data,
            timestamp: new Date()
          }
          break
        }

        case 'definition': {
          const word = detected.params.word
          const resp = await fetch(API_CONFIG.definition.replace('{word}', encodeURIComponent(word)))
          if (!resp.ok) throw new Error('未找到该单词定义')
          const data = await resp.json()
          const entry = data[0]
          const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''
          const defs = entry.meanings?.slice(0, 3).map((m: any) => {
            const def = m.definitions?.[0]
            return `[${m.partOfSpeech}] ${def?.definition || ''}${def?.example ? '\n例: "' + def.example + '"' : ''}`
          }).join('\n\n') || ''
          resultData = {
            type: 'definition',
            title: `${entry.word} ${phonetic}`,
            content: defs || '暂无定义',
            data: entry,
            timestamp: new Date()
          }
          break
        }

        case 'calculation': {
          const expr = detected.params.expression
          const calcResult = safeCalculate(expr)
          resultData = {
            type: 'calculation',
            title: '计算结果',
            content: `${expr} = ${calcResult}`,
            timestamp: new Date()
          }
          break
        }

        default:
          throw new Error('未知的查询类型')
      }

      setResult(resultData)
      const newHistory = [{ query: q, result: resultData }, ...history.slice(0, 19)]
      setHistory(newHistory)
      localStorage.setItem('unified-command-history', JSON.stringify(newHistory))
    } catch (e) {
      const msg = e instanceof Error ? e.message : '查询失败'
      setError(msg)
      setResult({
        type: 'news',
        title: '查询出错',
        content: `错误: ${msg}\n\n请尝试其他关键词，例如:\n• weather Shanghai\n• exchange 100 USD CNY\n• country Japan\n• wiki Linux\n• define computer\n• 3 + 5 * 2`,
        timestamp: new Date()
      })
    } finally {
      setLoading(false)
    }
  }, [query, history])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      executeQuery()
    }
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setQuery(item.query)
    setResult(item.result)
  }

  const exampleQueries = [
    { label: '上海天气', query: 'weather Shanghai' },
    { label: '汇率换算', query: 'exchange 100 USD CNY' },
    { label: '查日本', query: 'country Japan' },
    { label: 'Linux维基', query: 'wiki Linux' },
    { label: '计算', query: '256 * 1024' },
    { label: '今日名言', query: 'quote' }
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      background: 'linear-gradient(135deg, rgba(20,25,50,0.8) 0%, rgba(30,40,80,0.6) 100%)',
      color: '#e8eaf0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Zap size={24} style={{ color: '#ffd700' }} />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.02em' }}>
            全能命令中心
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#8a8fa8', lineHeight: 1.5 }}>
          一站式信息查询：天气 · 汇率 · 国家 · 维基 · 词典 · 计算 · 名言。输入自然语言即可。
        </p>
      </div>

      {/* 输入区 */}
      <div style={{
        position: 'relative',
        marginBottom: 16,
        display: 'flex',
        gap: 10
      }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: 14,
            color: '#6c7399',
            zIndex: 1
          }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如: weather Shanghai, exchange 100 USD CNY, country Japan, wiki React..."
            style={{
              width: '100%',
              padding: '14px 48px 14px 42px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(100,180,255,0.5)'
              e.target.style.background = 'rgba(255,255,255,0.09)'
              e.target.style.boxShadow = '0 0 0 3px rgba(100,180,255,0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.12)'
              e.target.style.background = 'rgba(255,255,255,0.06)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
        <button
          onClick={executeQuery}
          disabled={loading || !query.trim()}
          style={{
            padding: '0 22px',
            background: loading ? 'rgba(100,120,200,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {loading ? '查询中...' : '执行'}
        </button>
      </div>

      {/* 快捷示例 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
      }}>
        {exampleQueries.map(ex => (
          <button
            key={ex.label}
            onClick={() => { setQuery(ex.query); setTimeout(() => executeQuery(), 50) }}
            style={{
              padding: '6px 12px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 20,
              color: '#a5b4fc',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
          >
            <ChevronRight size={12} />
            {ex.label}
          </button>
        ))}
      </div>

      {/* 主内容区：左侧结果，右侧历史 */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 16,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* 结果区 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 20,
          overflow: 'auto'
        }}>
          {!result && !loading && (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c7399',
              textAlign: 'center'
            }}>
              <Code size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
              <div style={{ fontSize: 15, marginBottom: 6 }}>输入命令或关键词开始查询</div>
              <div style={{ fontSize: 12, lineHeight: 1.8, maxWidth: 400 }}>
                支持的命令前缀: weather [城市] · exchange [金额] [源] [目标] · country [国家] · wiki [关键词] · define [单词] · quote · 数学表达式
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: '#a5b4fc'
            }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>正在查询...</span>
            </div>
          )}

          {result && !loading && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 12,
                marginBottom: 16,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: error ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                  color: error ? '#fca5a5' : '#a5b4fc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {typeIcons[result.type] || <Globe size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                    {result.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c7399', marginTop: 2 }}>
                    {typeLabels[result.type] || '查询结果'} · {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <Clock size={14} style={{ color: '#4b5277' }} />
              </div>

              <pre style={{
                margin: 0,
                padding: 16,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
                color: error ? '#fca5a5' : '#cbd5e1',
                fontSize: 13.5,
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }}>
                {result.content}
              </pre>
            </div>
          )}
        </div>

        {/* 历史记录 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 14,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <History size={15} style={{ color: '#6c7399' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#b9bdce' }}>历史记录</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              color: '#6c7399'
            }}>
              {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div style={{
              fontSize: 12,
              color: '#5a6083',
              textAlign: 'center',
              padding: '20px 0'
            }}>
              <TrendingUp size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
              <br />
              暂无查询记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => loadHistoryItem(item)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    color: '#cfd3e4',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4
                  }}>
                    <span style={{
                      color: '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {typeIcons[item.result.type] || <Globe size={13} />}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.query}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#6c7399',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingLeft: 20
                  }}>
                    {item.result.title}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
