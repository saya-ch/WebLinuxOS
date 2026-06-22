import { useState, useCallback, memo } from 'react'
import { useStore } from '../store'

interface APIExample {
  id: string
  name: string
  description: string
  category: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  responseExample: string
  explanation: string
}

function APIPlaybook() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const addNotification = useStore((s) => s.addNotification)

  const apiExamples: APIExample[] = [
    {
      id: 'weather',
      name: 'Open-Meteo 天气API',
      description: '免费无需API密钥的天气预报接口',
      category: '生活服务',
      endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true',
      method: 'GET',
      responseExample: `{
  "latitude": 52.52,
  "longitude": 13.41,
  "current_weather": {
    "temperature": 11.5,
    "windspeed": 18.3,
    "weathercode": 3,
    "time": "2024-01-15T14:00"
  }
}`,
      explanation: 'Open-Meteo 提供免费的天气数据API，支持全球任意地点的天气预报。无需注册，直接调用。'
    },
    {
      id: 'exchange',
      name: 'Frankfurter 汇率API',
      description: '欧洲央行实时汇率数据',
      category: '金融',
      endpoint: 'https://api.frankfurter.app/latest?from=USD&to=CNY',
      method: 'GET',
      responseExample: `{
  "amount": 1,
  "base": "USD",
  "date": "2024-01-15",
  "rates": {
    "CNY": 7.1985
  }
}`,
      explanation: 'Frankfurter.app 提供免费的欧元汇率转换API，数据来源于欧洲央行，支持30+种货币。'
    },
    {
      id: 'ipinfo',
      name: 'IP 地理定位API',
      description: '获取IP地址的地理位置信息',
      category: '网络',
      endpoint: 'https://ipapi.co/json/',
      method: 'GET',
      responseExample: `{
  "ip": "8.8.8.8",
  "city": "Mountain View",
  "region": "California",
  "country": "US",
  "latitude": 37.4056,
  "longitude": -122.0775,
  "timezone": "America/Los_Angeles"
}`,
      explanation: 'ipapi.co 提供IP地理位置查询API，免费限额每日1000次请求，返回IP的详细地理信息。'
    },
    {
      id: 'hackernews',
      name: 'Hacker News API',
      description: '通过Algolia搜索Hacker News',
      category: '新闻',
      endpoint: 'https://hn.algolia.com/api/v1/search?query=react&tags=story',
      method: 'GET',
      responseExample: `{
  "hits": [
    {
      "title": "React 19 is now available",
      "url": "https://react.dev/blog",
      "author": "reactteam",
      "points": 1542,
      "num_comments": 489
    }
  ]
}`,
      explanation: 'HN Algolia API 提供Hacker News的搜索接口，可以搜索故事、评论等，支持多种过滤条件。'
    },
    {
      id: 'randomuser',
      name: 'RandomUser 生成测试用户',
      description: '生成随机用户数据用于测试',
      category: '开发工具',
      endpoint: 'https://randomuser.me/api/',
      method: 'GET',
      responseExample: `{
  "results": [{
    "name": { "first": "Emma", "last": "Wilson" },
    "email": "emma.wilson@example.com",
    "phone": "+1-555-0123",
    "location": {
      "city": "Boston",
      "country": "United States"
    },
    "picture": { "thumbnail": "https://..." }
  }]
}`,
      explanation: 'RandomUser API 生成随机用户数据，包含姓名、邮箱、电话、地址等信息，非常适合开发测试。'
    },
    {
      id: 'dogceo',
      name: 'Dog CEO 随机狗狗图片',
      description: '获取随机狗狗图片',
      category: '娱乐',
      endpoint: 'https://dog.ceo/api/breeds/image/random',
      method: 'GET',
      responseExample: `{
  "status": "success",
  "message": "https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg"
}`,
      explanation: 'Dog CEO API 提供随机狗狗图片，支持按品种分类，适合做占位图或娱乐功能。'
    },
    {
      id: 'boredapi',
      name: 'Bored API 随机活动建议',
      description: '不知道做什么？让API帮你选',
      category: '娱乐',
      endpoint: 'https://www.boredapi.com/api/activity',
      method: 'GET',
      responseExample: `{
  "activity": "Learn a new magic trick",
  "type": "education",
  "participants": 1,
  "price": 0,
  "link": "",
  "key": "5845678",
  "accessibility": 0
}`,
      explanation: 'Bored API 提供随机活动建议，当你无聊时可以获取各种有趣的活动推荐。'
    },
    {
      id: 'numbers',
      name: 'Numbers API 数字趣闻',
      description: '获取关于数字的有趣事实',
      category: '教育',
      endpoint: 'http://numbersapi.com/random/math',
      method: 'GET',
      responseExample: `42 is the number of days the Batman movie was filmed.

42 is the number of protests that have occurred since the murder of George Floyd.`,
      explanation: 'Numbers API 提供关于数字的有趣事实，支持数学、日期、年份等多种类型的查询。'
    },
    {
      id: 'quote',
      name: 'Quotable 随机名言API',
      description: '获取随机名言警句',
      category: '文化',
      endpoint: 'https://api.quotable.io/random',
      method: 'GET',
      responseExample: `{
  "content": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs",
  "tags": ["inspirational", "work"],
  "dateAdded": "2024-01-01"
}`,
      explanation: 'Quotable API 提供名人名言数据，包含作者、标签等信息，适合做启动画面或励志功能。'
    },
    {
      id: 'uuid',
      name: 'UUID v4 生成器',
      description: '生成符合RFC 4122标准的UUID',
      category: '开发工具',
      endpoint: 'https://www.uuidtools.com/api/generate/v4/count/1',
      method: 'GET',
      responseExample: `["f47ac10b-58cc-4372-a567-0e02b2c3d479"]`,
      explanation: 'UUID v4 是最常用的唯一标识符生成标准，这个API可以批量生成。'
    },
    {
      id: 'covid',
      name: 'COVID-19 数据API',
      description: '获取全球疫情统计数据',
      category: '健康',
      endpoint: 'https://disease.sh/v3/covid-19/all',
      method: 'GET',
      responseExample: `{
  "updated": 1705332000000,
  "cases": 700815536,
  "deaths": 7015499,
  "recovered": 670621241,
  "todayCases": 19253
}`,
      explanation: 'disease.sh 提供全球COVID-19疫情数据，包括累计确诊、死亡、康复等统计数据。'
    },
    {
      id: 'spacex',
      name: 'SpaceX API',
      description: 'SpaceX火箭发射数据',
      category: '科技',
      endpoint: 'https://api.spacexdata.com/v5/launches/latest',
      method: 'GET',
      responseExample: `{
  "id": "5eb87cdeffd86e000604b330",
  "name": "Starlink Group 6-27",
  "date_utc": "2023-08-08T02:22:00.000Z",
  "success": true,
  "rocket": "Falcon 9",
  "launchpad": "SLC-4E"
}`,
      explanation: 'SpaceX API 提供完整的火箭发射数据，包括历史发射、未来计划、火箭信息等。'
    }
  ]

  const categories = [...new Set(apiExamples.map(api => api.category))]

  const handleTestApi = useCallback(async (api: APIExample) => {
    setLoading(true)
    setResponse('')
    try {
      const res = await fetch(api.endpoint)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
      addNotification({ title: '请求成功', message: `${api.method} ${api.name}`, type: 'success', duration: 2000 })
    } catch (e) {
      setResponse(`请求失败: ${e instanceof Error ? e.message : '未知错误'}`)
      addNotification({ title: '请求失败', message: String(e), type: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const selectedApiData = apiExamples.find(api => api.id === selectedApi)

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      gap: '16px',
      padding: '16px',
      background: 'var(--window-bg)'
    }}>
      {/* 左侧：API分类列表 */}
      <div style={{
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '8px', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            API 演练场
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            实战展示常用公开API的调用方法与返回示例
          </div>
        </div>

        {categories.map(cat => (
          <div key={cat}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {cat}
            </div>
            {apiExamples.filter(api => api.category === cat).map(api => (
              <button
                key={api.id}
                onClick={() => setSelectedApi(api.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: selectedApi === api.id ? 'var(--accent-bg)' : 'transparent',
                  border: selectedApi === api.id ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  marginBottom: '4px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{api.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{api.description}</div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 右侧：API详情与测试 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
        {selectedApiData ? (
          <>
            {/* API信息卡片 */}
            <div style={{
              padding: '16px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  background: selectedApiData.method === 'GET' ? 'var(--success-bg)' : 
                              selectedApiData.method === 'POST' ? 'var(--info-bg)' : 'var(--warning-bg)',
                  color: selectedApiData.method === 'GET' ? 'var(--success)' : 
                         selectedApiData.method === 'POST' ? 'var(--info)' : 'var(--warning)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {selectedApiData.method}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedApiData.name}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedApiData.explanation}
              </div>
            </div>

            {/* 端点信息 */}
            <div style={{
              padding: '12px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                请求端点
              </div>
              <code style={{
                display: 'block',
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--accent)',
                wordBreak: 'break-all',
                fontFamily: 'monospace'
              }}>
                {selectedApiData.endpoint}
              </code>
            </div>

            {/* 测试按钮 */}
            <button
              onClick={() => handleTestApi(selectedApiData)}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? 'var(--glass-bg)' : 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{animation: 'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10"/></svg>
                  请求中...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  发送请求
                </>
              )}
            </button>

            {/* 返回示例 */}
            <div style={{
              padding: '12px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              flex: 1,
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  返回示例
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedApiData.responseExample)
                    addNotification({ title: '已复制', message: '响应示例已复制到剪贴板', type: 'success', duration: 2000 })
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--window-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  复制
                </button>
              </div>
              <pre style={{
                padding: '12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                overflow: 'auto',
                fontFamily: 'monospace',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedApiData.responseExample}
              </pre>
            </div>

            {/* 实时响应 */}
            {response && (
              <div style={{
                padding: '12px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                flex: 1,
                overflow: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--success)' }}>
                    实时响应
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(response)
                      addNotification({ title: '已复制', message: '响应已复制到剪贴板', type: 'success', duration: 2000 })
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--window-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    复制
                  </button>
                </div>
                <pre style={{
                  padding: '12px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {response}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" style={{marginBottom: '12px', opacity: 0.5}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <div style={{ fontSize: '14px' }}>请从左侧选择一个API示例</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>了解常用公开API的使用方法</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default memo(APIPlaybook)
