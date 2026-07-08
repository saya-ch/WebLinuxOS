import { useState, useEffect, useCallback } from 'react'
import {
  Search, Globe, BookOpen, MapPin, Users, Languages,
  Sparkles, ChevronRight, Loader2, RefreshCw,
  Clock, TrendingUp, Zap, Heart
} from 'lucide-react'

interface CountryInfo {
  name: { common: string; official: string }
  cca2: string
  flags: { svg: string; png: string }
  capital: string[]
  region: string
  subregion: string
  population: number
  area: number
  languages: Record<string, string>
  currencies: Record<string, { name: string; symbol: string }>
  timezones: string[]
  borders: string[]
}

const sampleCountries = [
  { code: 'CN', name: '中国' },
  { code: 'US', name: '美国' },
  { code: 'JP', name: '日本' },
  { code: 'GB', name: '英国' },
  { code: 'FR', name: '法国' },
  { code: 'DE', name: '德国' },
  { code: 'BR', name: '巴西' },
  { code: 'AU', name: '澳大利亚' },
  { code: 'CA', name: '加拿大' },
  { code: 'IN', name: '印度' },
]

const funFacts = [
  { fact: '蜂蜜永不变质。考古学家在埃及金字塔中发现了3000年前的蜂蜜，仍然可以食用。', category: '食物' },
  { fact: '章鱼有三颗心脏和蓝色的血液。', category: '动物' },
  { fact: '地球上的蚂蚁总重量与人类的总重量大致相等。', category: '动物' },
  { fact: '金星上的一天比一年还长。', category: '太空' },
  { fact: '人类DNA有50%与香蕉相同。', category: '科学' },
  { fact: '企鹅有膝盖，只是藏在羽毛下面。', category: '动物' },
  { fact: '水獭睡觉时会手牵手，以防被水流冲散。', category: '动物' },
  { fact: '世界上最长的地名有163个字母。', category: '地理' },
  { fact: '牛有四个胃。', category: '动物' },
  { fact: '闪电的温度比太阳表面还高。', category: '科学' },
]

const motivationalQuotes = [
  { text: '生活中最重要的事情不是我们身在何处，而是我们正朝着什么方向前进。', author: '奥利弗·温德尔·霍姆斯' },
  { text: '不要等待机会，而要创造机会。', author: '萧伯纳' },
  { text: '人生最大的荣耀不在于从不跌倒，而在于每次跌倒后都能爬起来。', author: '纳尔逊·曼德拉' },
  { text: '你的时间有限，不要浪费在重复别人的生活上。', author: '史蒂夫·乔布斯' },
  { text: '梦想不会逃跑，逃跑的永远是你自己。', author: '稻盛和夫' },
  { text: '世界上唯一阻止你实现梦想的，就是你自己。', author: 'J.K.罗琳' },
  { text: '成功不是终点，失败也并非末日，最重要的是继续前进的勇气。', author: '丘吉尔' },
  { text: '千里之行，始于足下。', author: '老子' },
]

type TabType = 'countries' | 'facts' | 'quotes' | 'encyclopedia'

export default function KnowledgeExplorer() {
  const [activeTab, setActiveTab] = useState<TabType>('countries')
  const [searchQuery, setSearchQuery] = useState('')
  const [countries, setCountries] = useState<CountryInfo[]>([])
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [currentFact, setCurrentFact] = useState(funFacts[0])
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0])

  const fetchCountries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags,capital,region,subregion,population,area,languages,currencies,timezones,borders')
      if (!response.ok) throw new Error('获取国家数据失败')
      const data = await response.json()
      setCountries(data.sort((a: CountryInfo, b: CountryInfo) => a.name.common.localeCompare(b.name.common)))
    } catch (err) {
      setError('无法加载国家数据，请稍后重试')
      console.error('Error fetching countries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const searchCountry = useCallback(async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${code}`)
      if (!response.ok) throw new Error('获取国家详情失败')
      const data = await response.json()
      setSelectedCountry(data[0])
    } catch (err) {
      setError('无法加载国家详情')
      console.error('Error fetching country:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredCountries = countries.filter(c => 
    c.name.common.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.region.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRandomFact = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * funFacts.length)
    setCurrentFact(funFacts[randomIndex])
  }, [])

  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
    setCurrentQuote(motivationalQuotes[randomIndex])
  }, [])

  useEffect(() => {
    if (activeTab === 'countries' && countries.length === 0) {
      fetchCountries()
    }
  }, [activeTab, countries.length, fetchCountries])

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + ' 亿'
    if (num >= 10000) return (num / 10000).toFixed(2) + ' 万'
    return num.toLocaleString()
  }

  const tabs = [
    { id: 'countries' as TabType, label: '国家探索', icon: <Globe size={16} /> },
    { id: 'facts' as TabType, label: '冷知识', icon: <Sparkles size={16} /> },
    { id: 'quotes' as TabType, label: '名言警句', icon: <BookOpen size={16} /> },
    { id: 'encyclopedia' as TabType, label: '百科', icon: <Zap size={16} /> },
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Globe size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>知识探索中心</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>探索世界 · 增长见识</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 10 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedCountry(null) }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 8,
                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === 'countries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!selectedCountry ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1,
                    position: 'relative',
                  }}>
                    <Search size={16} style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                    }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索国家名称或地区..."
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 36px',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={fetchCountries}
                    disabled={loading}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                    刷新
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>热门国家：</span>
                  {sampleCountries.map(country => (
                    <button
                      key={country.code}
                      onClick={() => searchCountry(country.code)}
                      style={{
                        padding: '4px 10px',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s',
                      }}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>

                {loading && countries.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 60,
                    color: 'var(--text-secondary)',
                  }}>
                    <Loader2 size={32} className="spin" style={{ marginBottom: 12 }} />
                    <div>正在加载国家数据...</div>
                  </div>
                ) : error ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    color: 'var(--text-secondary)',
                  }}>
                    <Globe size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div>{error}</div>
                    <button
                      onClick={fetchCountries}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: 8,
                        background: 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      重新加载
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 10,
                  }}>
                    {filteredCountries.slice(0, 50).map((country) => (
                      <button
                        key={country.cca2}
                        onClick={() => setSelectedCountry(country)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <img
                          src={country.flags.svg || country.flags.png}
                          alt={country.name.common}
                          style={{ width: 28, height: 20, objectFit: 'cover', borderRadius: 3 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {country.name.common}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {country.capital?.[0] || 'N/A'}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    ))}
                  </div>
                )}

                {filteredCountries.length > 50 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                  }}>
                    显示 50 / {filteredCountries.length} 个国家，继续搜索查看更多
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button
                  onClick={() => setSelectedCountry(null)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  ← 返回列表
                </button>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
                    加载中...
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 20,
                      background: 'var(--bg-secondary)',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                    }}>
                      <img
                        src={selectedCountry.flags.svg || selectedCountry.flags.png}
                        alt={selectedCountry.name.common}
                        style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 6 }}
                      />
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedCountry.name.common}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {selectedCountry.name.official}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 10,
                    }}>
                      <div style={{
                        padding: 14,
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> 首都
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {selectedCountry.capital?.join(', ') || 'N/A'}
                        </div>
                      </div>

                      <div style={{
                        padding: 14,
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Globe size={12} /> 地区
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {selectedCountry.region} / {selectedCountry.subregion}
                        </div>
                      </div>

                      <div style={{
                        padding: 14,
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={12} /> 人口
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {formatNumber(selectedCountry.population)}
                        </div>
                      </div>

                      <div style={{
                        padding: 14,
                        background: 'var(--bg-secondary)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> 面积
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {formatNumber(selectedCountry.area)} km²
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: 14,
                      background: 'var(--bg-secondary)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Languages size={14} /> 语言
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedCountry.languages && Object.values(selectedCountry.languages).map((lang, i) => (
                          <span key={i} style={{
                            padding: '4px 10px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 12,
                            fontSize: 12,
                          }}>
                            {lang}
                          </span>
                        ))}
                        {(!selectedCountry.languages || Object.keys(selectedCountry.languages).length === 0) && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>N/A</span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      padding: 14,
                      background: 'var(--bg-secondary)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> 时区
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selectedCountry.timezones?.slice(0, 5).map((tz, i) => (
                          <span key={i} style={{
                            padding: '3px 8px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 6,
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {tz}
                          </span>
                        ))}
                        {selectedCountry.timezones && selectedCountry.timezones.length > 5 && (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                            +{selectedCountry.timezones.length - 5} 个
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'facts' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            gap: 24,
          }}>
            <div style={{
              padding: 32,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 16,
              color: 'white',
              textAlign: 'center',
              maxWidth: 500,
            }}>
              <Sparkles size={40} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
              <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
                {currentFact.fact}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                fontSize: 12,
              }}>
                {currentFact.category}
              </div>
            </div>

            <button
              onClick={getRandomFact}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={18} />
              换一个冷知识
            </button>

            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 8,
            }}>
              已收录 {funFacts.length} 条有趣的冷知识
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            gap: 24,
          }}>
            <div style={{
              padding: 32,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 16,
              color: 'white',
              textAlign: 'center',
              maxWidth: 500,
            }}>
              <BookOpen size={40} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
              <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.8, marginBottom: 16, fontStyle: 'italic' }}>
                "{currentQuote.text}"
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                — {currentQuote.author}
              </div>
            </div>

            <button
              onClick={getRandomQuote}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={18} />
              换一句名言
            </button>

            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 8,
            }}>
              已收录 {motivationalQuotes.length} 句励志名言
            </div>
          </div>
        )}

        {activeTab === 'encyclopedia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} style={{ color: '#feca57' }} />
                知识分类
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
              }}>
                {[
                  { icon: '🌍', title: '地理知识', desc: '探索世界各国地理', count: 195 },
                  { icon: '🔬', title: '科学发现', desc: '了解最新科学进展', count: 89 },
                  { icon: '📜', title: '历史人文', desc: '人类文明发展史', count: 156 },
                  { icon: '🧬', title: '生物百科', desc: '地球生命多样性', count: 234 },
                  { icon: '🏛️', title: '艺术文化', desc: '人类艺术瑰宝', count: 178 },
                  { icon: '💻', title: '科技前沿', desc: '计算机与技术', count: 145 },
                ].map((item, i) => (
                  <button
                    key={i}
                    style={{
                      padding: 12,
                      background: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                    <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6 }}>
                      {item.count} 条目
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: '#1dd1a1' }} />
                今日热门知识
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  '为什么天空是蓝色的？',
                  '蜜蜂是如何酿蜜的？',
                  '金字塔是如何建造的？',
                  '黑洞里面是什么？',
                  '为什么我们会做梦？',
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}>
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: i < 3 ? 'var(--accent)' : 'var(--border)',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13 }}>{item}</span>
                    <Heart size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
