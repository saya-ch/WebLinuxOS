import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Globe, Search, Play, Save, Trash2, Copy, Check, ChevronRight,
  BookOpen, Zap, Database, Code2, Star, RefreshCw, AlertCircle,
  Download, Clock, Layers, Terminal, FileJson
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

interface ApiCategory {
  id: string
  name: string
  icon: React.ReactNode
  endpoints: ApiEndpoint[]
}

interface ApiEndpoint {
  id: string
  name: string
  description: string
  baseUrl: string
  path: string
  method: 'GET' | 'POST'
  params: ApiParam[]
  demoValue?: string
  responseType: 'json' | 'text' | 'image'
}

interface ApiParam {
  name: string
  description: string
  required: boolean
  type: 'string' | 'number' | 'boolean'
  defaultValue?: string
}

const CATEGORIES: ApiCategory[] = [
  {
    id: 'weather',
    name: '天气与地理',
    icon: <Globe size={18} />,
    endpoints: [
      {
        id: 'meteo-forecast',
        name: '天气预报 (Open-Meteo)',
        description: '免费、无需Key的全球天气预报，支持未来7天+历史数据',
        baseUrl: API_CONFIG.openMeteo.baseUrl,
        path: '/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto',
        method: 'GET',
        params: [
          { name: 'lat', description: '纬度 (-90 ~ 90)', required: true, type: 'number', defaultValue: '39.9042' },
          { name: 'lon', description: '经度 (-180 ~ 180)', required: true, type: 'number', defaultValue: '116.4074' }
        ],
        demoValue: 'lat=39.9042&lon=116.4074',
        responseType: 'json'
      },
      {
        id: 'geocoding',
        name: '城市名转坐标 (Open-Meteo)',
        description: '根据城市名查询经纬度、时区、人口等信息，支持模糊匹配',
        baseUrl: API_CONFIG.openMeteoGeocoding.baseUrl,
        path: '/search?name={city}&count=5&language=zh&format=json',
        method: 'GET',
        params: [
          { name: 'city', description: '城市名 (支持中英文)', required: true, type: 'string', defaultValue: '北京' }
        ],
        demoValue: 'city=北京',
        responseType: 'json'
      },
      {
        id: 'ip-info',
        name: 'IP地址信息查询 (ipapi.co)',
        description: '查询当前或指定IP的地理位置、ISP、时区、ASN等详细信息',
        baseUrl: 'https://ipapi.co',
        path: '/{ip}/json/',
        method: 'GET',
        params: [
          { name: 'ip', description: 'IP地址 (留空=当前IP)', required: false, type: 'string', defaultValue: '' }
        ],
        demoValue: 'ip=8.8.8.8',
        responseType: 'json'
      }
    ]
  },
  {
    id: 'knowledge',
    name: '知识与百科',
    icon: <BookOpen size={18} />,
    endpoints: [
      {
        id: 'wiki-summary',
        name: '维基百科摘要',
        description: '根据词条名获取维基百科摘要、主图、页面链接',
        baseUrl: API_CONFIG.wikipedia.baseUrl,
        path: '/page/summary/{title}',
        method: 'GET',
        params: [
          { name: 'title', description: '英文维基词条名', required: true, type: 'string', defaultValue: 'Artificial_intelligence' }
        ],
        demoValue: 'title=React_(software)',
        responseType: 'json'
      },
      {
        id: 'wiki-zh-summary',
        name: '中文维基百科摘要',
        description: '中文维基百科词条摘要查询',
        baseUrl: API_CONFIG.wikipedia.zhBaseUrl,
        path: '/page/summary/{title}',
        method: 'GET',
        params: [
          { name: 'title', description: '中文维基词条名', required: true, type: 'string', defaultValue: '人工智能' }
        ],
        demoValue: 'title=机器学习',
        responseType: 'json'
      },
      {
        id: 'dictionary',
        name: '英语词典 (Free Dictionary API)',
        description: '查询英文单词的定义、发音、同义词、例句（完全免费，无Key）',
        baseUrl: API_CONFIG.dictionaryApi.baseUrl,
        path: '/entries/en/{word}',
        method: 'GET',
        params: [
          { name: 'word', description: '英文单词', required: true, type: 'string', defaultValue: 'serendipity' }
        ],
        demoValue: 'word=beautiful',
        responseType: 'json'
      },
      {
        id: 'numbers-api',
        name: '数字趣闻 (Numbers API)',
        description: '关于日期、年份、数字的有趣事实和数学属性',
        baseUrl: API_CONFIG.numbersApi.baseUrl,
        path: '/{number}/{type}?json',
        method: 'GET',
        params: [
          { name: 'number', description: '数字 (日期格式: month/day)', required: true, type: 'string', defaultValue: '42' },
          { name: 'type', description: '类型: trivia/math/date/year', required: false, type: 'string', defaultValue: 'trivia' }
        ],
        demoValue: 'number=7/4&type=date',
        responseType: 'json'
      }
    ]
  },
  {
    id: 'dev',
    name: '开发工具',
    icon: <Code2 size={18} />,
    endpoints: [
      {
        id: 'github-user',
        name: 'GitHub 用户查询',
        description: '查询 GitHub 用户的公开资料：仓库数、粉丝、创建日期等',
        baseUrl: API_CONFIG.githubApi.baseUrl,
        path: '/users/{username}',
        method: 'GET',
        params: [
          { name: 'username', description: 'GitHub 用户名', required: true, type: 'string', defaultValue: 'torvalds' }
        ],
        demoValue: 'username=facebook',
        responseType: 'json'
      },
      {
        id: 'github-search',
        name: 'GitHub 仓库搜索',
        description: '按关键词、语言、Stars 数搜索 GitHub 开源仓库',
        baseUrl: API_CONFIG.githubApi.baseUrl,
        path: '/search/repositories?q={query}&sort=stars&order=desc&per_page=10',
        method: 'GET',
        params: [
          { name: 'query', description: '搜索词 (可用 language:javascript stars:>1000)', required: true, type: 'string', defaultValue: 'react stars:>50000' }
        ],
        demoValue: 'query=machine+learning language:python',
        responseType: 'json'
      },
      {
        id: 'httpbin-get',
        name: 'HTTP 请求回显 (httpbin.org)',
        description: '测试 HTTP 请求：返回请求头、IP、参数、UA 等（调试 API 客户端神器）',
        baseUrl: API_CONFIG.httpBin.baseUrl,
        path: '/{method}',
        method: 'GET',
        params: [
          { name: 'method', description: 'HTTP 方法: get/post/put/delete/headers/ip', required: true, type: 'string', defaultValue: 'get' }
        ],
        demoValue: 'method=headers',
        responseType: 'json'
      },
      {
        id: 'json-placeholder',
        name: 'JSON 占位数据 (JSONPlaceholder)',
        description: '前端开发测试用的假数据 API：用户、帖子、评论、待办、相册',
        baseUrl: API_CONFIG.jsonPlaceholder.baseUrl,
        path: '/{resource}/{id}',
        method: 'GET',
        params: [
          { name: 'resource', description: '资源: users/posts/comments/todos/albums/photos', required: true, type: 'string', defaultValue: 'users' },
          { name: 'id', description: '记录ID (留空=全量)', required: false, type: 'string', defaultValue: '1' }
        ],
        demoValue: 'resource=todos&id=',
        responseType: 'json'
      }
    ]
  },
  {
    id: 'lifestyle',
    name: '生活与娱乐',
    icon: <Star size={18} />,
    endpoints: [
      {
        id: 'quotable-random',
        name: '每日箴言 (Quotable)',
        description: '高质量英语名言金句生成器，支持按标签、作者筛选',
        baseUrl: API_CONFIG.quotable.baseUrl,
        path: '/random?tags={tags}&maxLength=200',
        method: 'GET',
        params: [
          { name: 'tags', description: '标签（逗号分隔）：famous-quotes|wisdom|life|love|success', required: false, type: 'string', defaultValue: 'wisdom' }
        ],
        demoValue: 'tags=love,life',
        responseType: 'json'
      },
      {
        id: 'joke-v2',
        name: '编程笑话 (JokeAPI v2)',
        description: '分类笑话生成器：编程、暗黑、双关语、蠢事、圣诞等主题',
        baseUrl: API_CONFIG.jokeApi.baseUrl,
        path: '/joke/{category}?safe-mode&type=twopart',
        method: 'GET',
        params: [
          { name: 'category', description: '分类: Programming/Miscellaneous/Dark/Pun/Spooky/Christmas/Any', required: true, type: 'string', defaultValue: 'Programming' }
        ],
        demoValue: 'category=Pun',
        responseType: 'json'
      },
      {
        id: 'bored-activity',
        name: '无聊活动推荐 (Bored API)',
        description: '根据人数、类型、价格、可访问性生成随机活动建议',
        baseUrl: 'https://www.boredapi.com/api',
        path: '/activity?participants={n}&type={type}',
        method: 'GET',
        params: [
          { name: 'n', description: '参与人数 1-8', required: false, type: 'number', defaultValue: '1' },
          { name: 'type', description: '类型: education/recreational/social/diy/charity/cooking/relaxation/music/busywork', required: false, type: 'string', defaultValue: 'recreational' }
        ],
        demoValue: 'n=2&type=social',
        responseType: 'json'
      },
      {
        id: 'cat-fact',
        name: '猫咪冷知识',
        description: '一条随机猫咪知识，数据来自维基百科和猫奴贡献',
        baseUrl: API_CONFIG.catFact.baseUrl,
        path: '/fact?max_length=140',
        method: 'GET',
        params: [],
        demoValue: '',
        responseType: 'json'
      }
    ]
  },
  {
    id: 'finance',
    name: '金融与数据',
    icon: <Database size={18} />,
    endpoints: [
      {
        id: 'frankfurter-latest',
        name: '欧元区汇率 (Frankfurter)',
        description: '基于欧洲央行公开数据的汇率查询，完全免费无Key',
        baseUrl: API_CONFIG.frankfurter.baseUrl.replace('/v1', ''),
        path: '/latest?from={from}&to={to}',
        method: 'GET',
        params: [
          { name: 'from', description: '源货币: USD/EUR/CNY/GBP/JPY/HKD...', required: false, type: 'string', defaultValue: 'USD' },
          { name: 'to', description: '目标货币（逗号分隔多币种）', required: false, type: 'string', defaultValue: 'CNY,EUR,JPY,GBP' }
        ],
        demoValue: 'from=EUR&to=USD,CNY',
        responseType: 'json'
      },
      {
        id: 'coingecko-simple',
        name: '加密货币报价 (CoinGecko)',
        description: '获取比特币、以太坊等数千种加密货币的实时美元/人民币报价',
        baseUrl: API_CONFIG.coinGecko.baseUrl,
        path: '/simple/price?ids={ids}&vs_currencies=usd,cny&include_24hr_change=true&include_market_cap=true',
        method: 'GET',
        params: [
          { name: 'ids', description: '币种ID（逗号分隔）：bitcoin,ethereum,solana,dogecoin,cardano,ripple', required: true, type: 'string', defaultValue: 'bitcoin,ethereum' }
        ],
        demoValue: 'ids=bitcoin,ethereum,solana,dogecoin',
        responseType: 'json'
      },
      {
        id: 'rest-countries',
        name: '国家信息百科 (REST Countries)',
        description: '查询全球250+国家和地区的详细信息：首都、人口、语言、货币、国旗、地图',
        baseUrl: API_CONFIG.restCountries.baseUrl,
        path: '/name/{country}?fullText={full}&fields=name,capital,population,flags,languages,currencies,maps,region,subregion,area',
        method: 'GET',
        params: [
          { name: 'country', description: '国家名（英文）', required: true, type: 'string', defaultValue: 'Japan' },
          { name: 'full', description: '精确匹配: true/false', required: false, type: 'string', defaultValue: 'true' }
        ],
        demoValue: 'country=China&full=true',
        responseType: 'json'
      }
    ]
  },
  {
    id: 'space',
    name: '科学与太空',
    icon: <Zap size={18} />,
    endpoints: [
      {
        id: 'nasa-apod',
        name: 'NASA 每日天文图 (APOD)',
        description: 'NASA Astronomy Picture of the Day，每天一张震撼宇宙图 + 专业天文学家解说',
        baseUrl: API_CONFIG.nasa.baseUrl,
        path: '/apod?api_key={api_key}&date={date}&thumbs=true',
        method: 'GET',
        params: [
          { name: 'api_key', description: 'NASA API Key (可选，默认DEMO_KEY有速率限制)', required: false, type: 'string', defaultValue: 'DEMO_KEY' },
          { name: 'date', description: '日期 YYYY-MM-DD (留空=今日)', required: false, type: 'string', defaultValue: '' }
        ],
        demoValue: 'api_key=DEMO_KEY&date=',
        responseType: 'json'
      },
      {
        id: 'space-news',
        name: '太空航天新闻 (Spaceflight News API)',
        description: '全球航天领域最新资讯：SpaceX、NASA、蓝色起源、ESA 等官方媒体聚合',
        baseUrl: API_CONFIG.spaceflightNews.baseUrl,
        path: '/articles?_limit={limit}&_sort=published_at:desc',
        method: 'GET',
        params: [
          { name: 'limit', description: '返回条数 1-50', required: false, type: 'number', defaultValue: '5' }
        ],
        demoValue: 'limit=10',
        responseType: 'json'
      },
      {
        id: 'pokemon',
        name: '宝可梦数据库 (PokéAPI)',
        description: '查询 1000+ 宝可梦的属性、能力、进化链、栖息地等全部数据',
        baseUrl: API_CONFIG.pokemon.baseUrl,
        path: '/pokemon/{name}',
        method: 'GET',
        params: [
          { name: 'name', description: '宝可梦英文名/id（例: pikachu, charizard, mewtwo, 151）', required: true, type: 'string', defaultValue: 'pikachu' }
        ],
        demoValue: 'name=charizard',
        responseType: 'json'
      },
      {
        id: 'starwars',
        name: '星球大战百科 (SWAPI)',
        description: '星球大战全宇宙数据API：人物、星球、星舰、载具、电影、种族',
        baseUrl: API_CONFIG.starWars.baseUrl,
        path: '/{resource}/{id}',
        method: 'GET',
        params: [
          { name: 'resource', description: '资源: people/planets/starships/vehicles/films/species', required: true, type: 'string', defaultValue: 'people' },
          { name: 'id', description: 'ID编号 1-... (留空=列表)', required: false, type: 'string', defaultValue: '1' }
        ],
        demoValue: 'resource=planets&id=3',
        responseType: 'json'
      }
    ]
  }
]

interface SavedRequest {
  id: string
  name: string
  categoryId: string
  endpointId: string
  paramValues: Record<string, string>
  createdAt: number
}

interface HistoryItem {
  id: string
  endpointName: string
  url: string
  status: number
  duration: number
  timestamp: number
  success: boolean
}

const SAVED_KEY = 'openapi-hub-saved-v1'
const HISTORY_KEY = 'openapi-hub-history-v1'

export default function OpenAPIHub() {
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id)
  const [activeEndpoint, setActiveEndpoint] = useState<ApiEndpoint | null>(CATEGORIES[0].endpoints[0])
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [saved, setSaved] = useState<SavedRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
  })
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'response' | 'headers' | 'request'>('response')
  const [headers, setHeaders] = useState<Record<string, string> | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'builder' | 'saved' | 'history'>('builder')

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES
    const q = search.toLowerCase()
    return CATEGORIES.map(cat => ({
      ...cat,
      endpoints: cat.endpoints.filter(ep =>
        ep.name.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
      )
    })).filter(cat => cat.endpoints.length > 0)
  }, [search])

  useEffect(() => {
    if (activeEndpoint) {
      const defaults: Record<string, string> = {}
      activeEndpoint.params.forEach(p => {
        defaults[p.name] = p.defaultValue ?? ''
      })
      setParamValues(defaults)
    }
  }, [activeEndpoint])

  const buildUrl = useCallback((ep: ApiEndpoint, values: Record<string, string>): string => {
    let url = ep.baseUrl + ep.path
    Object.entries(values).forEach(([k, v]) => {
      const encoded = encodeURIComponent(v)
      if (url.includes(`{${k}}`)) {
        url = url.replace(`{${k}}`, encoded || '')
      } else {
        const sep = url.includes('?') ? '&' : '?'
        url += `${sep}${encodeURIComponent(k)}=${encoded}`
      }
    })
    // 清理残留的 {param} 占位符（对于非必填且未填的）
    url = url.replace(/\{[^}]+\}/g, '')
    return url
  }, [])

  const executeRequest = useCallback(async () => {
    if (!activeEndpoint) return
    setLoading(true)
    setError(null)
    setResponse(null)
    setHeaders(null)
    setStatusCode(null)

    const url = buildUrl(activeEndpoint, paramValues)
    const start = performance.now()

    try {
      const res = await fetchWithTimeout(url, { method: activeEndpoint.method }, 20000)
      const dur = Math.round(performance.now() - start)
      setDuration(dur)
      setStatusCode(res.status)

      const hdrs: Record<string, string> = {}
      res.headers.forEach((v, k) => { hdrs[k] = v })
      setHeaders(hdrs)

      let text = ''
      try {
        const json = await res.json()
        text = JSON.stringify(json, null, 2)
      } catch {
        text = await res.text()
      }
      setResponse(text)

      const item: HistoryItem = {
        id: Math.random().toString(36).slice(2),
        endpointName: activeEndpoint.name,
        url,
        status: res.status,
        duration: dur,
        timestamp: Date.now(),
        success: res.ok
      }
      const newHist = [item, ...history].slice(0, 40)
      setHistory(newHist)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHist))
    } catch (e) {
      const dur = Math.round(performance.now() - start)
      setDuration(dur)
      setError(handleApiError(e, activeEndpoint.name))
    } finally {
      setLoading(false)
    }
  }, [activeEndpoint, paramValues, buildUrl, history])

  const loadDemoValues = useCallback(() => {
    if (!activeEndpoint?.demoValue) return
    const values: Record<string, string> = {}
    activeEndpoint.demoValue.split('&').forEach(pair => {
      const [k, v] = pair.split('=')
      if (k) values[k] = v ?? ''
    })
    // 合并默认值（demo里没覆盖的）
    activeEndpoint.params.forEach(p => {
      if (values[p.name] === undefined) values[p.name] = p.defaultValue ?? ''
    })
    setParamValues(values)
  }, [activeEndpoint])

  const saveRequest = useCallback(() => {
    if (!activeEndpoint) return
    const name = prompt('保存为（名称）：', activeEndpoint.name)
    if (!name) return
    const item: SavedRequest = {
      id: Math.random().toString(36).slice(2),
      name,
      categoryId: activeCategoryId,
      endpointId: activeEndpoint.id,
      paramValues: { ...paramValues },
      createdAt: Date.now()
    }
    const next = [item, ...saved]
    setSaved(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }, [activeEndpoint, activeCategoryId, paramValues, saved])

  const deleteSaved = useCallback((id: string) => {
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }, [saved])

  const loadSaved = useCallback((item: SavedRequest) => {
    setActiveCategoryId(item.categoryId)
    const cat = CATEGORIES.find(c => c.id === item.categoryId)
    const ep = cat?.endpoints.find(e => e.id === item.endpointId)
    if (ep) {
      setActiveEndpoint(ep)
      setParamValues({ ...item.paramValues })
    }
    setView('builder')
  }, [])

  const copyResponse = useCallback(() => {
    if (!response) return
    navigator.clipboard?.writeText(response).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [response])

  const downloadResponse = useCallback(() => {
    if (!response) return
    const blob = new Blob([response], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-response-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [response])

  const currentUrl = activeEndpoint ? buildUrl(activeEndpoint, paramValues) : ''

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0a18 0%, #12122a 50%, #0f1a2a 100%)', color: '#e8e8ff' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(124,108,240,0.2)', background: 'rgba(124,108,240,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)' }}>
              <Layers size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">OpenAPI Hub · 公开 API 探索实验室</div>
              <div className="text-xs" style={{ color: '#8888aa' }}>
                {CATEGORIES.reduce((n, c) => n + c.endpoints.length, 0)} 个合规公开端点 · 零配置零Key · 即时测试
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {(['builder', 'saved', 'history'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 text-xs transition-all"
                  style={{
                    background: view === v ? 'rgba(124,108,240,0.25)' : 'transparent',
                    color: view === v ? '#b8a8ff' : '#8888aa',
                    fontWeight: view === v ? 600 : 400
                  }}
                >
                  {v === 'builder' ? <><Play size={12} className="inline mr-1" />构建器</> :
                   v === 'saved' ? <><Save size={12} className="inline mr-1" />收藏 {saved.length}</> :
                   <><Clock size={12} className="inline mr-1" />历史 {history.length}</>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="relative">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6666aa' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索 API 名称、描述或分类…（如：weather, github, nasa, pokemon）"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(124,108,240,0.2)',
              color: '#e8e8ff'
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* LEFT: Categories + Endpoints */}
        {view === 'builder' && (
          <>
            <div className="w-64 flex-shrink-0 overflow-y-auto border-r p-3" style={{ borderColor: 'rgba(124,108,240,0.12)', background: 'rgba(0,0,0,0.15)' }}>
              {filteredCategories.map(cat => (
                <div key={cat.id} className="mb-4">
                  <button
                    onClick={() => setActiveCategoryId(cat.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all mb-1"
                    style={{
                      background: activeCategoryId === cat.id ? 'rgba(124,108,240,0.18)' : 'transparent',
                      color: activeCategoryId === cat.id ? '#b8a8ff' : '#aaaacc',
                      fontWeight: activeCategoryId === cat.id ? 600 : 500
                    }}
                  >
                    <span style={{ color: activeCategoryId === cat.id ? '#00d6c1' : '#7777aa' }}>{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                    <span className="ml-auto text-xs" style={{ color: '#555577' }}>{cat.endpoints.length}</span>
                  </button>
                  {activeCategoryId === cat.id && cat.endpoints.map(ep => (
                    <button
                      key={ep.id}
                      onClick={() => setActiveEndpoint(ep)}
                      className="w-full text-left px-4 py-2 text-xs rounded-md mb-1 transition-all flex items-center gap-2"
                      style={{
                        background: activeEndpoint?.id === ep.id ? 'rgba(0,214,193,0.1)' : 'transparent',
                        color: activeEndpoint?.id === ep.id ? '#8ff0e5' : '#8888aa',
                        borderLeft: activeEndpoint?.id === ep.id ? '2px solid #00d6c1' : '2px solid transparent'
                      }}
                    >
                      <Terminal size={11} />
                      <span className="flex-1 leading-snug">{ep.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                        background: ep.method === 'GET' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        color: ep.method === 'GET' ? '#6ee7b7' : '#fcd34d'
                      }}>{ep.method}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* MIDDLE: Request Builder */}
            <div className="flex-1 min-w-0 overflow-y-auto p-5">
              {activeEndpoint ? (
                <>
                  <div className="mb-5">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl font-bold" style={{ color: '#f0f0ff' }}>{activeEndpoint.name}</h2>
                      <div className="flex gap-2">
                        <button onClick={loadDemoValues} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
                          style={{ background: 'rgba(0,214,193,0.12)', color: '#00d6c1', border: '1px solid rgba(0,214,193,0.25)' }}>
                          <Zap size={12} /> 载入示例
                        </button>
                        <button onClick={saveRequest} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
                          style={{ background: 'rgba(124,108,240,0.12)', color: '#b8a8ff', border: '1px solid rgba(124,108,240,0.25)' }}>
                          <Star size={12} /> 收藏
                        </button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#9999bb' }}>{activeEndpoint.description}</p>
                  </div>

                  {/* URL Preview */}
                  <div className="mb-5 p-3 rounded-lg font-mono text-xs break-all" style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(124,108,240,0.15)'
                  }}>
                    <span style={{ color: '#00d6c1', fontWeight: 600 }}>{activeEndpoint.method}</span>
                    <span className="mx-2" style={{ color: '#555577' }}>·</span>
                    <span style={{ color: '#ccccee' }}>{currentUrl}</span>
                  </div>

                  {/* Params */}
                  {activeEndpoint.params.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#c0c0ee' }}>
                        <FileJson size={14} /> 请求参数
                      </h3>
                      <div className="space-y-2">
                        {activeEndpoint.params.map(p => (
                          <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="w-44 flex-shrink-0">
                              <div className="text-sm font-mono font-semibold flex items-center gap-1" style={{ color: '#b8a8ff' }}>
                                {p.name}
                                {p.required && <span style={{ color: '#ef4444' }}>*</span>}
                              </div>
                              <div className="text-[11px] mt-0.5" style={{ color: '#666688' }}>{p.description}</div>
                            </div>
                            <input
                              value={paramValues[p.name] ?? ''}
                              onChange={e => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                              placeholder={p.defaultValue || p.type}
                              className="flex-1 px-3 py-2 rounded-md text-sm outline-none font-mono transition-all"
                              style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(124,108,240,0.2)',
                                color: '#e8e8ff'
                              }}
                            />
                            <span className="text-[10px] px-2 py-1 rounded font-mono" style={{
                              background: 'rgba(124,108,240,0.08)',
                              color: '#8888bb'
                            }}>{p.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={executeRequest} disabled={loading}
                    className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg"
                    style={{
                      background: loading ? 'rgba(124,108,240,0.5)' : 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
                      color: '#fff',
                      boxShadow: loading ? 'none' : '0 0 25px rgba(124,108,240,0.35)'
                    }}>
                    {loading ? (
                      <><RefreshCw size={16} className="animate-spin" /> 正在请求…</>
                    ) : (
                      <><Play size={16} /> 发送请求 · {activeEndpoint.method}</>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 rounded-lg flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                      <div className="text-sm" style={{ color: '#fca5a5' }}>{error}</div>
                    </div>
                  )}

                  {/* Response */}
                  {response && (
                    <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(124,108,240,0.18)' }}>
                      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(124,108,240,0.06)', borderBottom: '1px solid rgba(124,108,240,0.12)' }}>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${statusCode && statusCode < 400 ? '' : ''}`} style={{
                            background: statusCode && statusCode < 400 ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                            color: statusCode && statusCode < 400 ? '#6ee7b7' : '#fca5a5'
                          }}>{statusCode}</span>
                          <span className="text-xs" style={{ color: '#8888aa' }}>{duration}ms</span>
                          {headers && <span className="text-xs" style={{ color: '#8888aa' }}>
                            {headers['content-length'] || headers['Content-Length']
                              ? `${Math.round(Number(headers['content-length'] || headers['Content-Length']) / 1024 * 10) / 10} KB`
                              : `${Math.round(response.length / 1024 * 10) / 10} KB (估算)`}
                          </span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {(['response', 'headers', 'request'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} className="text-xs px-2.5 py-1 rounded transition-all"
                              style={{
                                background: tab === t ? 'rgba(124,108,240,0.2)' : 'transparent',
                                color: tab === t ? '#b8a8ff' : '#666688'
                              }}>
                              {t === 'response' ? <><Code2 size={11} className="inline mr-1" />响应</>
                               : t === 'headers' ? '响应头' : '请求'}
                            </button>
                          ))}
                          <div className="w-px h-4 mx-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                          <button onClick={copyResponse} className="p-1.5 rounded transition-all hover:opacity-80" title="复制"
                            style={{ color: copied ? '#10b981' : '#8888aa', background: copied ? 'rgba(16,185,129,0.1)' : 'transparent' }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button onClick={downloadResponse} className="p-1.5 rounded transition-all hover:opacity-80" title="下载JSON"
                            style={{ color: '#8888aa' }}>
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                      <pre className="p-4 max-h-80 overflow-auto text-xs leading-relaxed font-mono" style={{
                        background: '#06060e',
                        color: '#b0c4de'
                      }}>
                        {tab === 'response' && response}
                        {tab === 'headers' && headers && Object.entries(headers).map(([k, v]) => `${k}: ${v}\n`).join('')}
                        {tab === 'request' && `${activeEndpoint.method} ${currentUrl}\n\n${JSON.stringify(paramValues, null, 2)}`}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-sm" style={{ color: '#666688' }}>
                  从左侧选择一个 API 端点开始
                </div>
              )}
            </div>
          </>
        )}

        {view === 'saved' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#f0f0ff' }}>
              <Save size={20} style={{ color: '#00d6c1' }} /> 已收藏的请求
            </h2>
            {saved.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#666688' }}>
                <Star size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">还没有收藏的 API 请求</p>
                <p className="text-xs mt-2">在构建器中点击「收藏」将常用参数保存于此</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {saved.map(item => (
                  <div key={item.id} className="p-4 rounded-lg flex items-center gap-4 transition-all group"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,108,240,0.15)' }}>
                      <ChevronRight size={18} style={{ color: '#b8a8ff' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#e8e8ff' }}>{item.name}</div>
                      <div className="text-xs mt-1" style={{ color: '#777799' }}>
                        {Object.entries(item.paramValues).map(([k, v]) => `${k}=${v}`).join(' · ') || '(无参数)'}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: '#555577' }}>
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => loadSaved(item)} className="px-3 py-1.5 rounded text-xs"
                        style={{ background: 'rgba(0,214,193,0.12)', color: '#00d6c1' }}>加载</button>
                      <button onClick={() => deleteSaved(item.id)} className="p-1.5 rounded hover:opacity-80"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#f0f0ff' }}>
              <Clock size={20} style={{ color: '#7c6cf0' }} /> 请求历史
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#666688' }}>
                <Terminal size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">暂无历史请求</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="p-3 rounded-lg flex items-center gap-3 text-xs"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className={`px-2 py-0.5 rounded font-semibold flex-shrink-0`} style={{
                      background: h.success ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                      color: h.success ? '#6ee7b7' : '#fca5a5'
                    }}>{h.status}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: '#c0c0ee' }}>{h.endpointName}</div>
                      <div className="font-mono truncate mt-0.5" style={{ color: '#666688' }}>{h.url}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div style={{ color: '#8888aa' }}>{h.duration}ms</div>
                      <div style={{ color: '#555577' }}>{new Date(h.timestamp).toLocaleTimeString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
