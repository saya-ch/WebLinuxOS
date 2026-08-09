import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: Array<{ label: string; command: string }>
}

interface AIDesktopAssistantProps {
  onClose?: () => void
}

const AIDesktopAssistant: React.FC<AIDesktopAssistantProps> = ({ onClose }) => {
  const { apps, openApp, setWallpaper, setTheme } = useStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: '你好！我是 WebLinuxOS AI 桌面助手。我可以帮你：\n\n• 打开应用：试试"打开终端"、"启动代码编辑器"\n• 系统操作："切换壁纸"、"暗色模式"、"全屏"\n• 查询信息："天气"、"股票"、"翻译"\n• 创意功能："讲笑话"、"生成UUID"、"颜色转换"\n\n试试输入你的需求吧！',
      timestamp: new Date(),
      actions: [
        { label: '打开终端', command: 'open terminal' },
        { label: '查看天气', command: 'weather' },
        { label: '切换主题', command: 'toggle theme' },
      ],
    },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const addMessage = useCallback((type: Message['type'], content: string, actions?: Message['actions']) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      actions,
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  const findAppByName = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return apps.find(app => 
      app.name.toLowerCase().includes(lowerQuery) ||
      app.id.toLowerCase().includes(lowerQuery) ||
      (app.description && app.description.toLowerCase().includes(lowerQuery))
    )
  }, [apps])

  const generateSuggestions = useCallback((text: string) => {
    const lower = text.toLowerCase()
    const suggestions: string[] = []

    if (lower.includes('打开') || lower.includes('启动') || lower.includes('open')) {
      const matchedApps = apps.slice(0, 5)
      matchedApps.forEach(app => {
        suggestions.push(`打开${app.name}`)
      })
    }

    if (lower.includes('天气') || lower.includes('weather')) {
      suggestions.push('天气 北京', '天气 上海', '天气 广州')
    }

    if (lower.includes('翻译') || lower.includes('translate')) {
      suggestions.push('翻译 hello world', '翻译 你好世界')
    }

    if (lower.includes('颜色') || lower.includes('color')) {
      suggestions.push('颜色转换 #FF5733', '随机颜色')
    }

    if (lower.includes('笑话') || lower.includes('joke')) {
      suggestions.push('讲编程笑话', '讲冷笑话')
    }

    setSuggestions(suggestions.slice(0, 4))
  }, [apps])

  const getSystemInfo = useCallback(() => {
    const info = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || '未知',
      screen: `${screen.width}x${screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
    return info
  }, [])

  const processCommand = useCallback(async (text: string): Promise<string> => {
    const lower = text.toLowerCase().trim()

    // 打开应用
    if (/^(打开|启动|open|launch|运行).*/.test(lower) || lower.startsWith('open ')) {
      const appName = text.replace(/^(打开|启动|open|launch|运行)\s*/i, '').trim()
      const app = findAppByName(appName)
      if (app) {
        openApp(app.id)
        return `已打开 ${app.name}`
      }
      return `未找到名为 "${appName}" 的应用。可用应用包括：${apps.slice(0, 10).map(a => a.name).join('、')}...`
    }

    // 系统操作
    if (lower.includes('全屏') || lower.includes('fullscreen')) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
        return '已请求全屏模式。如果浏览器未响应，请按 F11 键手动切换。'
      }
      return '你的浏览器不支持全屏 API，请按 F11 键手动切换。'
    }

    if (lower.includes('暗色') || lower.includes('深色') || lower.includes('dark')) {
      setTheme('dark')
      return '已切换到暗色主题'
    }

    if (lower.includes('亮色') || lower.includes('浅色') || lower.includes('light')) {
      setTheme('light')
      return '已切换到亮色主题'
    }

    if (lower.includes('壁纸') && (lower.includes('随机') || lower.includes('更换'))) {
      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      ]
      setWallpaper(gradients[Math.floor(Math.random() * gradients.length)])
      return '已更换壁纸'
    }

    // 天气查询
    if (lower.startsWith('天气') || lower.startsWith('weather')) {
      const city = text.replace(/^(天气|weather)\s*/i, '').trim() || '北京'
      try {
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%h+%w`)
        const data = await response.text()
        return `${city}天气：${data}`
      } catch {
        return '天气查询失败，请稍后重试'
      }
    }

    // 翻译
    if (lower.startsWith('翻译') || lower.startsWith('translate')) {
      const rest = text.replace(/^(翻译|translate)\s*/i, '').trim()
      const parts = rest.split(/\s+/)
      if (parts.length >= 3) {
        const from = parts[0]
        const to = parts[1]
        const sourceText = parts.slice(2).join(' ')
        try {
          const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(sourceText)}`)
          const data = await response.json()
          if (data && data[0]) {
            const translated = data[0].map((item: [string]) => item[0]).join('')
            return `${sourceText} → ${translated}`
          }
        } catch {
          return '翻译服务暂不可用'
        }
      }
      return '翻译用法：翻译 源语言 目标语言 文本\n例如：翻译 en zh Hello World'
    }

    // 讲笑话
    if (lower.includes('笑话') || lower.includes('joke') || lower.includes('搞笑')) {
      try {
        const response = await fetch('https://v2.jokeapi.dev/joke/Programming?safe-mode')
        const data = await response.json()
        if (data.type === 'single') {
          return data.joke
        }
        return `${data.setup}\n\n${data.delivery}`
      } catch {
        const jokes = [
          '为什么程序员喜欢暗模式？因为 bug 都怕光！',
          '世界上只有10种人：懂二进制的和不懂二进制的。',
          'SQL 查询走进酒吧，看见两张桌子，问："我能加入你们吗？"',
        ]
        return jokes[Math.floor(Math.random() * jokes.length)]
      }
    }

    // 颜色转换
    if (lower.startsWith('颜色') || lower.startsWith('color')) {
      const colorCode = text.replace(/^(颜色|color)\s*/i, '').trim()
      if (colorCode && /^[0-9a-fA-F]{6}$/.test(colorCode.replace('#', ''))) {
        const hex = colorCode.replace('#', '').toUpperCase()
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `颜色转换结果：\nHEX: #${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${(r * 0.299 + g * 0.587 + b * 0.114) > 128 ? 0 : 240}, 70%, ${Math.round((r + g + b) / 3 / 255 * 100)}%)`
      }
      const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
      return `随机颜色：#${randomHex}\n预览: ████████████████`
    }

    // UUID生成
    if (lower.includes('uuid') || lower.includes('唯一标识')) {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      return `生成的UUID：${uuid}`
    }

    // 系统信息
    if (lower.includes('系统信息') || lower.includes('system info') || lower.includes('关于系统')) {
      const info = getSystemInfo()
      return `系统信息：\n平台: ${info.platform}\nCPU核心: ${info.hardwareConcurrency}\n屏幕: ${info.screen}\n时区: ${info.timeZone}\n语言: ${info.language}\n在线状态: ${info.online ? '在线' : '离线'}`
    }

    // 帮助
    if (lower === 'help' || lower === '帮助' || lower === '?') {
      return `可用命令列表：

【系统操作】
• 打开/启动 <应用名> - 打开指定应用
• 全屏 - 切换全屏模式
• 暗色/亮色模式 - 切换主题
• 随机壁纸 - 更换随机壁纸

【信息查询】
• 天气 <城市> - 查询天气
• 翻译 <源语言> <目标语言> <文本> - 翻译文本
• 讲笑话 - 获取随机笑话
• 股票 <代码> - 查询股票行情

【工具功能】
• 颜色 <HEX> - 颜色格式转换
• UUID - 生成UUID
• 系统信息 - 显示系统信息

【创意功能】
• 每日一言 - 获取励志名言
• 黑客新闻 - 获取Hacker News热门

更多功能正在开发中...`
    }

    // 每日一言
    if (lower.includes('名言') || lower.includes('quote') || lower.includes('励志')) {
      try {
        const response = await fetch('https://api.quotable.io/random')
        const data = await response.json()
        return `"${data.content}"\n\n— ${data.author}`
      } catch {
        try {
          const r = await fetch('https://zenquotes.io/api/random')
          const d = await r.json()
          if (Array.isArray(d) && d.length > 0) {
            return `"${d[0].q}"\n\n— ${d[0].a}`
          }
        } catch {}
        return '今日名言：保持好奇心，继续学习！'
      }
    }

    // 黑客新闻
    if (lower.includes('黑客') || lower.includes('hacker') || lower.includes('hn')) {
      try {
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
        const ids = await response.json()
        const top5 = await Promise.all(
          ids.slice(0, 5).map(async (id: number) => {
            const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            return r.json()
          })
        )
        return `Hacker News 热门:\n\n${top5.map((item: any, i: number) => `${i + 1}. ${item.title} (Score: ${item.score})`).join('\n')}`
      } catch {
        return '无法获取 Hacker News，请稍后重试'
      }
    }

    // 股票查询
    if (lower.startsWith('股票') || lower.startsWith('stock')) {
      const symbol = text.replace(/^(股票|stock)\s*/i, '').trim().toUpperCase()
      if (!symbol) {
        return '股票查询用法：股票 <代码>\n例如：股票 AAPL'
      }
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`)
        const data = await response.json()
        const meta = data?.chart?.result?.[0]?.meta
        if (meta) {
          const price = meta.regularMarketPrice
          const prev = meta.chartPreviousClose
          const change = price - prev
          const changePct = (change / prev * 100).toFixed(2)
          return `${meta.symbol} 股票：\n价格: $${price.toFixed(2)}\n涨跌: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct}%)`
        }
        return `无法获取 ${symbol} 的数据`
      } catch {
        return '股票数据获取失败，可能是API限制'
      }
    }

    // 默认回复
    const defaultResponses = [
      `我理解你说的"${text}"。你可以试试输入"帮助"查看所有可用功能。`,
      `这是一个有趣的需求！目前我可以帮你打开应用、查询天气、翻译文本、生成UUID等。输入"帮助"了解更多。`,
      `感谢你的提问！如果你想打开应用，输入"打开"+应用名；如果想查询天气，输入"天气"+城市名。`,
    ]
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }, [apps, findAppByName, openApp, setTheme, setWallpaper, getSystemInfo])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    addMessage('user', userMessage)
    setInput('')
    setSuggestions([])
    setIsProcessing(true)

    try {
      const response = await processCommand(userMessage)
      const actions: Message['actions'] = []

      if (response.includes('已打开')) {
        actions.push({ label: '查看该应用', command: 'view' })
      }
      if (response.includes('天气')) {
        actions.push({ label: '查询其他城市', command: 'weather' })
      }

      addMessage('assistant', response, actions)
    } catch (error) {
      addMessage('assistant', `抱歉，处理你的请求时出现了错误：${(error as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [input, isProcessing, processCommand, addMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#e0e0e8',
      fontFamily: "'Noto Sans SC', 'Space Grotesk', sans-serif",
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>AI 桌面助手</div>
            <div style={{ fontSize: '12px', color: '#888' }}>WebLinuxOS 智能助理</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMessages([{
              id: 'welcome',
              type: 'assistant',
              content: '对话已重置！我是 WebLinuxOS AI 桌面助手。试试输入"帮助"查看所有功能。',
              timestamp: new Date(),
            }])}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#e0e0e8',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            重置对话
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#e0e0e8',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              gap: '12px',
              maxWidth: '85%',
              alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              {message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div style={{
              background: message.type === 'user'
                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              padding: '12px 16px',
              borderRadius: '16px',
              borderTopRightRadius: message.type === 'user' ? '4px' : '16px',
              borderTopLeftRadius: message.type !== 'user' ? '4px' : '16px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontSize: '14px',
            }}>
              <div>{message.content}</div>
              {message.actions && message.actions.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {message.actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(action.command)
                        inputRef.current?.focus()
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(102, 126, 234, 0.3)',
                        border: '1px solid rgba(102, 126, 234, 0.5)',
                        borderRadius: '8px',
                        color: '#e0e0e8',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{
                fontSize: '11px',
                color: '#666',
                marginTop: '8px',
              }}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}>
              🤖
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 16px',
              borderRadius: '16px',
              display: 'flex',
              gap: '4px',
            }}>
              <span style={{ width: '8px', height: '8px', background: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite' }} />
              <span style={{ width: '8px', height: '8px', background: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.2s' }} />
              <span style={{ width: '8px', height: '8px', background: '#667eea', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 建议 */}
      {suggestions.length > 0 && (
        <div style={{
          padding: '8px 20px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              generateSuggestions(e.target.value)
            }}
            onKeyDown={handleKeyPress}
            placeholder="输入你的需求，例如：打开终端、天气北京、翻译 hello world..."
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#e0e0e8',
              resize: 'none',
              fontSize: '14px',
              minHeight: '44px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            style={{
              padding: '12px 24px',
              background: input.trim() && !isProcessing
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            发送
          </button>
        </div>
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '8px',
          textAlign: 'center',
        }}>
          按 Enter 发送 · 输入"帮助"查看所有功能
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default AIDesktopAssistant
