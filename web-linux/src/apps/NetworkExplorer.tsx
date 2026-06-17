import { useState } from 'react'

interface Endpoint {
  id: string
  name: string
  description: string
  url: string
  params?: { key: string; label: string; default?: string; placeholder?: string }[]
  method: 'GET' | 'POST'
  category: string
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'github-user',
    name: 'GitHub 用户信息',
    description: '获取 GitHub 公开用户信息（用户名、仓库数、关注等）',
    url: 'https://api.github.com/users/{username}',
    method: 'GET',
    category: '开发',
    params: [{ key: 'username', label: '用户名', default: 'torvalds', placeholder: 'GitHub 用户名' }],
  },
  {
    id: 'ip-lookup',
    name: 'IP 地理位置',
    description: '基于 IP 地址获取地理位置、ISP、时区信息',
    url: 'https://ipapi.co/{ip}/json/',
    method: 'GET',
    category: '网络',
    params: [{ key: 'ip', label: 'IP 地址', default: '8.8.8.8', placeholder: '例如: 8.8.8.8' }],
  },
  {
    id: 'crypto-price',
    name: '加密货币行情',
    description: '获取主要加密货币的实时价格（Coindesk BPI）',
    url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
    method: 'GET',
    category: '数据',
    params: [],
  },
  {
    id: 'random-user',
    name: '随机用户生成',
    description: '生成一个随机的虚拟用户档案（RandomUser.me）',
    url: 'https://randomuser.me/api/',
    method: 'GET',
    category: '数据',
    params: [],
  },
  {
    id: 'country',
    name: '国家信息',
    description: '通过名称查询国家的详细信息（REST Countries）',
    url: 'https://restcountries.com/v3.1/name/{name}',
    method: 'GET',
    category: '地理',
    params: [{ key: 'name', label: '国家英文名', default: 'China', placeholder: '例如: Japan' }],
  },
  {
    id: 'advice',
    name: '随机建议',
    description: '获取一条随机的生活小建议（Advice Slip）',
    url: 'https://api.adviceslip.com/advice',
    method: 'GET',
    category: '趣味',
    params: [],
  },
  {
    id: 'cat-fact',
    name: '猫咪小知识',
    description: '随机获取一条关于猫的趣味小知识',
    url: 'https://cat-fact.herokuapp.com/facts/random',
    method: 'GET',
    category: '趣味',
    params: [],
  },
  {
    id: 'dog-image',
    name: '随机狗狗图片',
    description: '获取一张随机品种的狗狗图片链接',
    url: 'https://dog.ceo/api/breeds/image/random',
    method: 'GET',
    category: '趣味',
    params: [],
  },
  {
    id: 'joke',
    name: '程序员笑话',
    description: '随机的程序员相关笑话（JokeAPI）',
    url: 'https://v2.jokeapi.dev/joke/Programming?safe-mode',
    method: 'GET',
    category: '趣味',
    params: [],
  },
  {
    id: 'age',
    name: '年龄预测',
    description: '基于名字预测年龄（Agify.io）',
    url: 'https://api.agify.io/?name={name}',
    method: 'GET',
    category: '数据',
    params: [{ key: 'name', label: '英文名', default: 'michael', placeholder: '例如: michael' }],
  },
  {
    id: 'gender',
    name: '性别预测',
    description: '基于名字预测性别（Genderize.io）',
    url: 'https://api.genderize.io/?name={name}',
    method: 'GET',
    category: '数据',
    params: [{ key: 'name', label: '英文名', default: 'anna', placeholder: '例如: anna' }],
  },
  {
    id: 'bored',
    name: '活动推荐',
    description: '无聊时做什么？这里给你一个随机建议（Bored API）',
    url: 'https://www.boredapi.com/api/activity/',
    method: 'GET',
    category: '生活',
    params: [],
  },
  {
    id: 'numbers',
    name: '数字趣闻',
    description: '关于指定数字的有趣事实（Numbers API）',
    url: 'http://numbersapi.com/{number}',
    method: 'GET',
    category: '趣味',
    params: [{ key: 'number', label: '数字', default: '42', placeholder: '例如: 7' }],
  },
  {
    id: 'space-news',
    name: '即将发射',
    description: '查看即将到来的太空发射任务（Launch Library 2）',
    url: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5',
    method: 'GET',
    category: '新闻',
    params: [],
  },
  {
    id: 'hacker-news',
    name: 'Hacker News 头条',
    description: '查看 Hacker News 最新的头条新闻',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty',
    method: 'GET',
    category: '新闻',
    params: [],
  },
]

export default function NetworkExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [selected, setSelected] = useState<Endpoint>(ENDPOINTS[0])
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    ENDPOINTS[0].params?.forEach(p => { init[p.key] = p.default || '' })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'json' | 'pretty'>('json')
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('network-lab-fav') || '[]')
    } catch { return [] }
  })

  const categories = ['全部', ...Array.from(new Set(ENDPOINTS.map(e => e.category)))]
  const visibleEndpoints = selectedCategory === '全部' ? ENDPOINTS : ENDPOINTS.filter(e => e.category === selectedCategory)

  const buildUrl = () => {
    let url = selected.url
    selected.params?.forEach(p => {
      const v = encodeURIComponent(paramValues[p.key] || p.default || '')
      url = url.replace(new RegExp(`\\{${p.key}\\}`, 'g'), v)
    })
    return url
  }

  const selectEndpoint = (endpoint: Endpoint) => {
    setSelected(endpoint)
    const init: Record<string, string> = {}
    endpoint.params?.forEach(p => { init[p.key] = p.default || '' })
    setParamValues(init)
    setResult('')
    setError('')
  }

  const run = async () => {
    setLoading(true)
    setError('')
    setResult('')
    const url = buildUrl()
    try {
      const response = await fetch(url)
      const contentType = response.headers.get('content-type') || ''
      let body: string
      if (contentType.includes('application/json') || url.endsWith('.json')) {
        const json = await response.json()
        body = JSON.stringify(json, null, 2)
      } else {
        body = await response.text()
      }
      if (!response.ok) {
        setError(`HTTP ${response.status} ${response.statusText || ''}`)
      }
      setResult(body)
    } catch (err) {
      setError(`请求失败: ${err instanceof Error ? err.message : String(err)}。可能由于 CORS 限制或网络问题。`)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      localStorage.setItem('network-lab-fav', JSON.stringify(next))
      return next
    })
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  const prettySummary = (text: string): string => {
    try {
      const obj = JSON.parse(text)
      const lines: string[] = []
      const walk = (o: any, depth = 0) => {
        const pad = '  '.repeat(depth)
        if (Array.isArray(o)) {
          lines.push(`${pad}[${o.length} items]`)
          o.slice(0, 5).forEach((item, i) => {
            lines.push(`${pad}  ${i}:`)
            if (typeof item === 'object' && item !== null) walk(item, depth + 2)
            else lines.push(`${pad}    ${String(item)}`)
          })
          if (o.length > 5) lines.push(`${pad}  ... ${o.length - 5} 更多`)
        } else if (o && typeof o === 'object') {
          Object.entries(o).forEach(([k, v]) => {
            if (v && typeof v === 'object') {
              lines.push(`${pad}${k}:`)
              walk(v, depth + 1)
            } else {
              lines.push(`${pad}${k}: ${String(v)}`)
            }
          })
        } else {
          lines.push(`${pad}${String(o)}`)
        }
      }
      walk(obj)
      return lines.join('\n')
    } catch {
      return text
    }
  }

  return (
    <div style={{
      display: 'flex', height: '100%', background: 'var(--bg-surface)', color: 'var(--text)',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', fontSize: 13,
    }}>
      {/* 左侧: API 列表 */}
      <div style={{
        width: 280, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', background: 'var(--bg-alt)',
      }}>
        <div style={{
          padding: '12px 14px', borderBottom: '1px solid var(--border)',
          fontWeight: 600, fontSize: 14,
        }}>
          网络探索 · {ENDPOINTS.length} 个 API
        </div>
        <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              style={{
                fontSize: 11, padding: '4px 8px', borderRadius: 4, border: 'none',
                background: selectedCategory === c ? 'var(--accent)' : 'var(--bg-hover)',
                color: selectedCategory === c ? '#fff' : 'var(--text)',
                cursor: 'pointer',
              }}
            >{c}</button>
          ))}
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {visibleEndpoints.map(ep => {
            const isSelected = ep.id === selected.id
            const isFav = favorites.includes(ep.id)
            return (
              <div
                key={ep.id}
                onClick={() => selectEndpoint(ep)}
                style={{
                  padding: '10px 14px',
                  borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                  background: isSelected ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ep.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{ep.category}</div>
                </div>
                {isFav && <span style={{ fontSize: 13, color: '#f5a623' }}>★</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 右侧: 请求/响应区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4 }}>{selected.description}</div>
            </div>
            <button
              onClick={() => toggleFavorite(selected.id)}
              style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: favorites.includes(selected.id) ? '#f5a623' : 'var(--text-subtle)',
              }}
              title={favorites.includes(selected.id) ? '取消收藏' : '收藏'}
            >★</button>
          </div>

          {selected.params && selected.params.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selected.params.map(p => (
                <div key={p.key} style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4 }}>
                    {p.label}
                  </label>
                  <input
                    type="text"
                    value={paramValues[p.key] || ''}
                    placeholder={p.placeholder}
                    onChange={e => setParamValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '6px 10px', fontSize: 13,
                      background: 'var(--bg-surface)', color: 'var(--text)',
                      border: '1px solid var(--border)', borderRadius: 4, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 12, background: 'var(--bg-alt)', padding: '8px 12px',
            borderRadius: 4, fontSize: 12, fontFamily: 'monospace',
            wordBreak: 'break-all', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{selected.method}</span>
            <span style={{ flex: 1 }}>{buildUrl()}</span>
            <button onClick={() => copy(buildUrl())}
              style={{
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-subtle)',
                fontSize: 11, padding: '2px 8px', borderRadius: 3, cursor: 'pointer',
              }}
            >复制</button>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={run}
              disabled={loading}
              style={{
                padding: '8px 20px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 4, cursor: loading ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 500,
              }}
            >
              {loading ? '请求中...' : '▶ 发送请求'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', alignSelf: 'center' }}>
              提示: 某些 API 会因浏览器 CORS 限制无法访问
            </span>
          </div>
        </div>

        {/* 响应区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px 18px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8, borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => setActiveTab('json')}
                style={{
                  padding: '6px 12px', background: activeTab === 'json' ? 'var(--bg-hover)' : 'transparent',
                  border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12,
                  borderBottom: activeTab === 'json' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >原始 JSON</button>
              <button onClick={() => setActiveTab('pretty')}
                style={{
                  padding: '6px 12px', background: activeTab === 'pretty' ? 'var(--bg-hover)' : 'transparent',
                  border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12,
                  borderBottom: activeTab === 'pretty' ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >摘要视图</button>
            </div>
            {result && (
              <button
                onClick={() => copy(result)}
                style={{
                  fontSize: 11, padding: '4px 10px', background: 'transparent',
                  border: '1px solid var(--border)', color: 'var(--text-subtle)',
                  cursor: 'pointer', borderRadius: 3,
                }}
              >复制响应</button>
            )}
          </div>
          {error && (
            <div style={{
              padding: '8px 12px', background: 'rgba(220, 50, 50, 0.15)',
              color: '#e74c3c', fontSize: 12, borderRadius: 4, marginBottom: 8,
              border: '1px solid rgba(220, 50, 50, 0.3)',
            }}>{error}</div>
          )}
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
              正在请求中...
            </div>
          )}
          {result && !loading && (
            <pre style={{
              flex: 1, margin: 0, padding: 12, background: 'var(--bg-alt)',
              fontSize: 12, fontFamily: 'monospace',
              borderRadius: 4, border: '1px solid var(--border)',
              overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              lineHeight: 1.5,
            }}>{activeTab === 'json' ? result : prettySummary(result)}</pre>
          )}
          {!result && !loading && !error && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-subtle)', fontSize: 13,
            }}>
              点击 "发送请求" 查看 API 响应
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
