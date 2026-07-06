import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useStore } from '../store'
import {
  MessageCircle,
  Languages,
  CloudSun,
  Newspaper,
  Lightbulb,
  Code2,
  Send,
  RefreshCw,
  Copy,
  Search,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Clock,
  Trash2,
  Check,
  ArrowRight,
  Zap,
  Bot,
  User,
} from 'lucide-react'

// ==================== 类型定义 ====================
type TabType = 'chat' | 'translate' | 'weather' | 'news' | 'quote' | 'code'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface WeatherData {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  city: string
  country: string
}

interface NewsItem {
  objectID: string
  title: string
  url: string
  author: string
  points: number
  num_comments: number
  created_at_i: number
}

interface QuoteData {
  content: string
  author: string
}

interface CodeTemplate {
  name: string
  description: string
  code: string
  language: string
}

// ==================== 常量配置 ====================
const CHAT_HISTORY_KEY = 'weblinux-smart-ai-chat'

const DEFAULT_CITIES = [
  { name: '北京', country: '中国', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737 },
  { name: '深圳', country: '中国', latitude: 22.5431, longitude: 114.0579 },
  { name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503 },
  { name: '纽约', country: '美国', latitude: 40.7128, longitude: -74.006 },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278 },
  { name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522 },
  { name: '悉尼', country: '澳大利亚', latitude: -33.8688, longitude: 151.2093 },
]

const LANGUAGE_OPTIONS = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en-US', name: '英语' },
  { code: 'ja-JP', name: '日语' },
  { code: 'ko-KR', name: '韩语' },
  { code: 'fr-FR', name: '法语' },
  { code: 'de-DE', name: '德语' },
  { code: 'es-ES', name: '西班牙语' },
  { code: 'ru-RU', name: '俄语' },
]

// 智能聊天回复模板
const CHAT_RESPONSES: Record<string, string[]> = {
  greeting: [
    '你好！我是 SmartAIHub 智能助手 🤖\n\n我可以帮你：\n• 💬 智能聊天问答\n• 🌐 多语言翻译\n• 🌤️ 天气查询\n• 📰 新闻资讯\n• 💡 每日名言\n• 💻 代码助手\n\n有什么需要帮助的吗？',
    '嗨！欢迎来到 SmartAIHub！✨\n\n我是你的全能AI助手，集成了多种实用功能。试试切换侧边栏的不同模块吧！',
    '你好呀！很高兴见到你 👋\n\n我是 SmartAIHub，一个集成了多种AI能力的智能中心。让我来帮你提高效率吧！',
  ],
  help: [
    'SmartAIHub 功能指南 📖\n\n【💬 智能聊天】\n和我聊天，问我任何问题，我会尽力回答！\n\n【🌐 实时翻译】\n支持8种语言互译，使用 MyMemory API\n\n【🌤️ 天气查询】\n全球城市天气，使用 Open-Meteo API\n\n【📰 新闻速递】\nHacker News 热门技术新闻\n\n【💡 每日名言】\n随机励志名言，激发灵感\n\n【💻 代码助手】\n常用代码模板和编程帮助\n\n点击左侧菜单切换功能模块～',
  ],
  weather: [
    '想了解天气吗？🌤️\n\n点击左侧「天气查询」模块，你可以：\n• 搜索全球城市天气\n• 查看实时温度、湿度、风速\n• 获取天气描述和穿衣建议\n\n数据来自 Open-Meteo，完全免费！',
  ],
  translate: [
    '需要翻译吗？🌐\n\n切换到「实时翻译」模块，支持：\n• 中文、英语、日语、韩语、法语、德语、西班牙语、俄语\n• 8种语言互译\n• 使用 MyMemory 翻译 API\n\n快去试试吧！',
  ],
  news: [
    '想看新闻？📰\n\n「新闻速递」模块为你带来：\n• Hacker News 热门技术新闻\n• 实时更新的科技资讯\n• 按热度排序的文章列表\n\n点击左侧「新闻速递」查看～',
  ],
  code: [
    '需要编程帮助？💻\n\n「代码助手」模块提供：\n• 常用代码模板\n• JavaScript/Python/CSS 等\n• 一键复制代码\n• 代码解释说明\n\n快去左侧菜单打开「代码助手」吧！',
  ],
  quote: [
    '需要一些灵感？💡\n\n「每日名言」模块：\n• 随机励志名言\n• 来自名人的智慧\n• 每日更新的惊喜\n\n点击左侧「每日名言」获取能量～',
  ],
  thanks: [
    '不客气！能帮到你我很开心 😊\n\n还有其他需要帮助的吗？',
    '很高兴能帮到你！✨\n\n随时可以问我其他问题～',
    '这是我应该做的！💪\n\n还有什么我能为你做的吗？',
  ],
  joke: [
    '好的，来一个程序员笑话 😄\n\n为什么程序员总是分不清万圣节和圣诞节？\n因为 Oct 31 = Dec 25 🎃🎄',
    '来个有趣的：\n\n一个程序员走进酒吧，点了一杯啤酒。\n然后又点了一杯... 再点了一杯...\n最后他说："我这是在干啥？我根本不喝酒！"\n原来他陷入了无限循环 🔄',
    '程序员的幽默：\n\nQ: 为什么程序员喜欢黑暗模式？\nA: 因为 light 会吸引 bugs 🐛',
  ],
  time: [
    `现在是 ${new Date().toLocaleString('zh-CN')} ⏰\n\n时间过得真快，要珍惜每一刻哦！`,
  ],
  default: [
    '这是个好问题！让我想想... 🤔\n\n作为 SmartAIHub 智能助手，我可以帮你：\n• 聊天对话\n• 多语言翻译\n• 天气查询\n• 新闻阅读\n• 每日名言\n• 代码模板\n\n你想试试哪个功能？',
    '嗯，这个问题很有趣！\n\n虽然我是一个基于规则的智能助手，但我集成了很多实用的API功能。你可以：\n\n1. 🌐 翻译文字 - 支持8种语言\n2. 🌤️ 查天气 - 全球城市数据\n3. 📰 看新闻 - 技术资讯速递\n4. 💡 读名言 - 每日灵感\n5. 💻 写代码 - 常用模板\n\n试试左侧的功能模块吧！',
    '我理解你的意思～\n\nSmartAIHub 是一个多功能AI中心。虽然我不能像大语言模型那样进行复杂推理，但我提供了很多实用工具：\n\n• 真实API集成（天气/翻译/新闻/名言）\n• 智能对话系统\n• 代码模板库\n• 玻璃拟态精美界面\n\n有什么具体想做的吗？',
  ],
}

// 代码模板库
const CODE_TEMPLATES: CodeTemplate[] = [
  {
    name: 'JavaScript 防抖函数',
    description: '限制函数执行频率，常用于搜索输入',
    language: 'javascript',
    code: `function debounce(func, wait) {
  let timeout = null
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// 使用示例
const search = debounce((query) => {
  console.log('搜索:', query)
}, 300)`,
  },
  {
    name: 'JavaScript 节流函数',
    description: '规定时间内只执行一次，常用于滚动事件',
    language: 'javascript',
    code: `function throttle(func, limit) {
  let inThrottle = false
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// 使用示例
const handleScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY)
}, 100)`,
  },
  {
    name: 'Python 快速排序',
    description: '经典的快速排序算法实现',
    language: 'python',
    code: `def quicksort(arr):
    """快速排序算法"""
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))  # [1, 1, 2, 3, 6, 8, 10]`,
  },
  {
    name: 'CSS Flexbox 居中布局',
    description: '使用Flexbox实现水平垂直居中',
    language: 'css',
    code: `.container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  min-height: 100vh;
}

/* 或者使用 Grid */
.container-grid {
  display: grid;
  place-items: center;     /* 简写方式 */
  min-height: 100vh;
}`,
  },
  {
    name: 'React 自定义 Hook: useLocalStorage',
    description: '轻松实现 localStorage 状态持久化',
    language: 'javascript',
    code: `import { useState } from 'react'

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// 使用示例
// const [name, setName] = useLocalStorage('name', 'Guest')`,
  },
  {
    name: 'JavaScript 深拷贝',
    description: '实现对象的深度复制',
    language: 'javascript',
    code: `function deepClone(obj, hash = new WeakMap()) {
  // 处理基本类型和 null
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  // 处理循环引用
  if (hash.has(obj)) {
    return hash.get(obj)
  }
  
  // 处理 Date
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  // 处理 Array
  if (Array.isArray(obj)) {
    const clone = obj.map(item => deepClone(item, hash))
    hash.set(obj, clone)
    return clone
  }
  
  // 处理普通对象
  const clone = {}
  hash.set(obj, clone)
  
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], hash)
  }
  
  return clone
}`,
  },
  {
    name: 'Python 列表推导式技巧',
    description: 'Pythonic 的列表操作方式',
    language: 'python',
    code: `# 基本列表推导
squares = [x**2 for x in range(10)]

# 带条件的列表推导
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# 字典推导
square_dict = {x: x**2 for x in range(5)}

# 集合推导
unique_lengths = {len(word) for word in ['hello', 'world', 'hi']}

# 生成器表达式
sum_of_squares = sum(x**2 for x in range(100))

# 嵌套列表推导
matrix = [[i*j for j in range(3)] for i in range(3)]`,
  },
  {
    name: 'CSS 渐变文字效果',
    description: '实现漂亮的渐变文字',
    language: 'css',
    code: `.gradient-text {
  background: linear-gradient(
    90deg,
    #667eea 0%,
    #764ba2 50%,
    #f093fb 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  /* 可选：添加动画 */
  animation: gradient-shift 3s ease infinite;
  background-size: 200% auto;
}

@keyframes gradient-shift {
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
}`,
  },
]

// 备用名言库
const FALLBACK_QUOTES: QuoteData[] = [
  { content: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
  { content: '成功不是最终的，失败不是致命的，重要的是继续前进的勇气。', author: '丘吉尔' },
  { content: '你的时间有限，不要浪费时间活在别人的生活里。', author: '史蒂夫·乔布斯' },
  { content: '创新就是把一千件事情说不。', author: '史蒂夫·乔布斯' },
  { content: '最好的准备就是今天就开始行动。', author: '佚名' },
  { content: '困难是用来克服的，不是用来逃避的。', author: '佚名' },
  { content: '未来属于那些相信梦想之美的人。', author: '埃莉诺·罗斯福' },
  { content: '生活的最大荣耀不在于永不跌倒，而在于每次跌倒后都能爬起来。', author: '孔子' },
  { content: '不要等待机会，而要创造机会。', author: '萧伯纳' },
  { content: '伟大的事情都是由一系列小事汇聚而成的。', author: '梵高' },
  { content: '如果你不出去走走，你就会以为这就是全世界。', author: '佚名' },
  { content: '知识就是力量。', author: '弗朗西斯·培根' },
  { content: '千里之行，始于足下。', author: '老子' },
  { content: '己所不欲，勿施于人。', author: '孔子' },
  { content: '学而不思则罔，思而不学则殆。', author: '孔子' },
]

// ==================== 工具函数 ====================

// 天气代码转图标和描述
function getWeatherInfo(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: '☀️', description: '晴朗' }
  if (code <= 2) return { icon: '⛅', description: '局部多云' }
  if (code === 3) return { icon: '☁️', description: '阴天' }
  if (code <= 48) return { icon: '🌫️', description: '有雾' }
  if (code <= 57) return { icon: '🌦️', description: '毛毛雨' }
  if (code <= 67) return { icon: '🌧️', description: '小雨' }
  if (code <= 77) return { icon: '❄️', description: '雪' }
  if (code <= 82) return { icon: '🌧️', description: '阵雨' }
  if (code <= 86) return { icon: '❄️', description: '阵雪' }
  if (code <= 99) return { icon: '⛈️', description: '雷暴' }
  return { icon: '☁️', description: '未知' }
}

// 智能回复生成
function generateChatResponse(message: string): string {
  const lowerMsg = message.toLowerCase()
  
  // 问候语
  if (lowerMsg.match(/^(你好|嗨|hi|hello|hey|您好|哈喽)/)) {
    return randomPick(CHAT_RESPONSES.greeting)
  }
  
  // 帮助
  if (lowerMsg.includes('帮助') || lowerMsg.includes('功能') || lowerMsg.includes('help') || lowerMsg.includes('什么用')) {
    return randomPick(CHAT_RESPONSES.help)
  }
  
  // 天气
  if (lowerMsg.includes('天气') || lowerMsg.includes('weather')) {
    return randomPick(CHAT_RESPONSES.weather)
  }
  
  // 翻译
  if (lowerMsg.includes('翻译') || lowerMsg.includes('translate')) {
    return randomPick(CHAT_RESPONSES.translate)
  }
  
  // 新闻
  if (lowerMsg.includes('新闻') || lowerMsg.includes('news')) {
    return randomPick(CHAT_RESPONSES.news)
  }
  
  // 代码
  if (lowerMsg.includes('代码') || lowerMsg.includes('编程') || lowerMsg.includes('code') || lowerMsg.includes('程序')) {
    return randomPick(CHAT_RESPONSES.code)
  }
  
  // 名言
  if (lowerMsg.includes('名言') || lowerMsg.includes('quote') || lowerMsg.includes('灵感') || lowerMsg.includes('励志')) {
    return randomPick(CHAT_RESPONSES.quote)
  }
  
  // 感谢
  if (lowerMsg.match(/(谢谢|感谢|thanks|thank you|thx)/)) {
    return randomPick(CHAT_RESPONSES.thanks)
  }
  
  // 笑话
  if (lowerMsg.includes('笑话') || lowerMsg.includes('joke') || lowerMsg.includes('搞笑') || lowerMsg.includes('幽默')) {
    return randomPick(CHAT_RESPONSES.joke)
  }
  
  // 时间
  if (lowerMsg.includes('时间') || lowerMsg.includes('几点') || lowerMsg.includes('time')) {
    return CHAT_RESPONSES.time[0]
  }
  
  // 默认回复
  return randomPick(CHAT_RESPONSES.default)
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 格式化时间
function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000 - timestamp)
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}天前`
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

// ==================== 主组件 ====================
const SmartAIHub = memo(function SmartAIHub() {
  const { theme, setTheme } = useStore()
  const isDark = theme === 'dark'
  
  // 导航状态
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // 聊天状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // 忽略读取错误
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: CHAT_RESPONSES.greeting[0],
        timestamp: Date.now(),
      },
    ]
  })
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // 翻译状态
  const [translateFrom, setTranslateFrom] = useState('zh-CN')
  const [translateTo, setTranslateTo] = useState('en-US')
  const [translateInput, setTranslateInput] = useState('')
  const [translateResult, setTranslateResult] = useState('')
  const [translateLoading, setTranslateLoading] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [translateCopied, setTranslateCopied] = useState(false)
  
  // 天气状态
  const [weatherCity, setWeatherCity] = useState('北京')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [showCityList, setShowCityList] = useState(false)
  
  // 新闻状态
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)
  
  // 名言状态
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteCopied, setQuoteCopied] = useState(false)
  
  // 代码助手状态
  const [codeSearchQuery, setCodeSearchQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState<CodeTemplate | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  
  // 保存聊天记录
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages.slice(-50)))
    } catch {
      // 忽略保存错误
    }
  }, [chatMessages])
  
  // 聊天自动滚动
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // 初始加载
  useEffect(() => {
    fetchWeather()
    fetchNews()
    fetchQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // ==================== 聊天功能 ====================
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || chatLoading) return
    
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now(),
    }
    
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    
    // 模拟AI思考延迟
    setTimeout(() => {
      const response = generateChatResponse(userMsg.content)
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setChatMessages(prev => [...prev, assistantMsg])
      setChatLoading(false)
    }, 600 + Math.random() * 800)
  }, [chatInput, chatLoading])
  
  const clearChatHistory = useCallback(() => {
    setChatMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: CHAT_RESPONSES.greeting[Math.floor(Math.random() * CHAT_RESPONSES.greeting.length)],
        timestamp: Date.now(),
      },
    ])
  }, [])
  
  // ==================== 翻译功能 ====================
  const doTranslate = useCallback(async () => {
    if (!translateInput.trim()) {
      setTranslateResult('')
      return
    }
    
    setTranslateLoading(true)
    setTranslateError(null)
    
    try {
      const fromCode = translateFrom.split('-')[0]
      const toCode = translateTo.split('-')[0]
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateInput)}&langpair=${fromCode}|${toCode}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('翻译请求失败')
      
      const data = await response.json()
      if (data.responseStatus === 200 && data.responseData) {
        setTranslateResult(data.responseData.translatedText)
      } else {
        throw new Error(data.responseDetails || '翻译失败')
      }
    } catch {
      setTranslateError('翻译服务暂时不可用，请稍后重试')
      setTranslateResult('')
    } finally {
      setTranslateLoading(false)
    }
  }, [translateInput, translateFrom, translateTo])
  
  const swapLanguages = useCallback(() => {
    const temp = translateFrom
    setTranslateFrom(translateTo)
    setTranslateTo(temp)
    if (translateResult) {
      setTranslateInput(translateResult)
      setTranslateResult('')
    }
  }, [translateFrom, translateTo, translateResult])
  
  const copyTranslateResult = useCallback(() => {
    if (!translateResult) return
    navigator.clipboard?.writeText(translateResult)
    setTranslateCopied(true)
    setTimeout(() => setTranslateCopied(false), 2000)
  }, [translateResult])
  
  // ==================== 天气功能 ====================
  const fetchWeather = useCallback(async (cityName?: string) => {
    const city = cityName || weatherCity
    const cityInfo = DEFAULT_CITIES.find(c => c.name === city)
    if (!cityInfo) {
      setWeatherError('未找到该城市')
      return
    }
    
    setWeatherLoading(true)
    setWeatherError(null)
    
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.latitude}&longitude=${cityInfo.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('天气请求失败')
      
      const data = await response.json()
      if (data.current) {
        setWeatherData({
          temperature: data.current.temperature_2m,
          apparentTemperature: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          weatherCode: data.current.weather_code,
          city: cityInfo.name,
          country: cityInfo.country,
        })
        if (cityName) setWeatherCity(cityName)
      }
    } catch {
      setWeatherError('天气数据获取失败，请稍后重试')
    } finally {
      setWeatherLoading(false)
    }
  }, [weatherCity])
  
  const filteredCities = DEFAULT_CITIES.filter(c =>
    c.name.includes(citySearchQuery) || c.country.includes(citySearchQuery)
  )
  
  // ==================== 新闻功能 ====================
  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setNewsError(null)
    
    try {
      const url = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20'
      const response = await fetch(url)
      if (!response.ok) throw new Error('新闻请求失败')
      
      const data = await response.json()
      setNewsItems(data.hits || [])
    } catch {
      setNewsError('新闻获取失败，请稍后重试')
    } finally {
      setNewsLoading(false)
    }
  }, [])
  
  // ==================== 名言功能 ====================
  const fetchQuote = useCallback(async () => {
    setQuoteLoading(true)
    
    try {
      const response = await fetch('https://api.quotable.io/random')
      if (response.ok) {
        const data = await response.json()
        setQuoteData({ content: data.content, author: data.author })
      } else {
        throw new Error('名言API失败')
      }
    } catch {
      setQuoteData(randomPick(FALLBACK_QUOTES))
    } finally {
      setQuoteLoading(false)
    }
  }, [])
  
  const copyQuote = useCallback(() => {
    if (!quoteData) return
    navigator.clipboard?.writeText(`"${quoteData.content}" —— ${quoteData.author}`)
    setQuoteCopied(true)
    setTimeout(() => setQuoteCopied(false), 2000)
  }, [quoteData])
  
  // ==================== 代码助手功能 ====================
  const filteredCodeTemplates = CODE_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
    t.language.toLowerCase().includes(codeSearchQuery.toLowerCase())
  )
  
  const copyCode = useCallback(() => {
    if (!selectedCode) return
    navigator.clipboard?.writeText(selectedCode.code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }, [selectedCode])
  
  // ==================== 样式变量 ====================
  const styles = {
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 50%, #f5f7fa 100%)',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    } as React.CSSProperties,
    
    sidebar: {
      width: sidebarOpen ? 220 : 60,
      minWidth: sidebarOpen ? 220 : 60,
      height: '100%',
      background: isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: isDark
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 10,
    } as React.CSSProperties,
    
    sidebarHeader: {
      padding: '16px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: isDark
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(0, 0, 0, 0.06)',
    } as React.CSSProperties,
    
    logo: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    } as React.CSSProperties,
    
    navItem: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      margin: '4px 8px',
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: active
        ? isDark
          ? 'rgba(102, 126, 234, 0.25)'
          : 'rgba(102, 126, 234, 0.15)'
        : 'transparent',
      color: active
        ? '#667eea'
        : isDark
          ? 'rgba(255, 255, 255, 0.75)'
          : 'rgba(0, 0, 0, 0.7)',
      fontWeight: active ? 600 : 400,
      fontSize: 14,
    }) as React.CSSProperties,
    
    mainContent: {
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    } as React.CSSProperties,
    
    header: {
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: isDark
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: isDark
        ? '1px solid rgba(255, 255, 255, 0.06)'
        : '1px solid rgba(0, 0, 0, 0.05)',
    } as React.CSSProperties,
    
    contentArea: {
      flex: 1,
      overflow: 'auto',
      padding: 24,
    } as React.CSSProperties,
    
    glassCard: {
      background: isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: isDark
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(255, 255, 255, 0.8)',
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.3)'
        : '0 8px 32px rgba(0, 0, 0, 0.08)',
    } as React.CSSProperties,
    
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 10,
      border: isDark
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.1)',
      background: isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(255, 255, 255, 0.9)',
      color: isDark ? '#fff' : '#000',
      fontSize: 14,
      outline: 'none',
      transition: 'all 0.2s ease',
    } as React.CSSProperties,
    
    button: {
      padding: '10px 20px',
      borderRadius: 10,
      border: 'none',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,
    
    buttonSecondary: {
      padding: '8px 16px',
      borderRadius: 8,
      border: isDark
        ? '1px solid rgba(255, 255, 255, 0.15)'
        : '1px solid rgba(0, 0, 0, 0.1)',
      background: 'transparent',
      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    } as React.CSSProperties,
  }
  
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: '智能聊天', icon: <MessageCircle size={20} /> },
    { id: 'translate', label: '实时翻译', icon: <Languages size={20} /> },
    { id: 'weather', label: '天气查询', icon: <CloudSun size={20} /> },
    { id: 'news', label: '新闻速递', icon: <Newspaper size={20} /> },
    { id: 'quote', label: '每日名言', icon: <Lightbulb size={20} /> },
    { id: 'code', label: '代码助手', icon: <Code2 size={20} /> },
  ]

  const activeIconMap: Record<TabType, React.ReactNode> = {
    chat: <MessageCircle size={16} color="#fff" />,
    translate: <Languages size={16} color="#fff" />,
    weather: <CloudSun size={16} color="#fff" />,
    news: <Newspaper size={16} color="#fff" />,
    quote: <Lightbulb size={16} color="#fff" />,
    code: <Code2 size={16} color="#fff" />,
  }
  
  // ==================== 渲染 ====================
  return (
    <div style={styles.container}>
      {/* 侧边栏 */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <Sparkles size={20} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: isDark ? '#fff' : '#1a1a2e',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                SmartAIHub
              </div>
              <div style={{
                fontSize: 11,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
              }}>
                智能AI中心
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              transition: 'all 0.2s',
            }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
        
        <div style={{ flex: 1, paddingTop: 8, overflowY: 'auto' }}>
          {navItems.map(item => (
            <div
              key={item.id}
              style={styles.navItem(activeTab === item.id)}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={e => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)'
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {item.icon}
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          ))}
        </div>
        
        {/* 主题切换 */}
        <div style={{
          padding: '12px 8px',
          borderTop: isDark
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
        }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
              margin: '0 8px',
              transition: 'all 0.2s',
            }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.04)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && <span style={{ fontSize: 14 }}>{isDark ? '浅色模式' : '深色模式'}</span>}
          </div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div style={styles.mainContent}>
        {/* 顶部标题栏 */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {activeIconMap[activeTab]}
            </div>
            <div>
              <div style={{
                fontSize: 17,
                fontWeight: 600,
                color: isDark ? '#fff' : '#1a1a2e',
              }}>
                {navItems.find(n => n.id === activeTab)?.label}
              </div>
              <div style={{
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              }}>
                SmartAIHub · 智能AI中心
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} style={{ opacity: 0.6 }} color={isDark ? '#fff' : '#000'} />
            <span style={{
              fontSize: 12,
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            }}>
              v1.0 · API驱动
            </span>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div style={styles.contentArea}>
          {/* ===== 智能聊天模块 ===== */}
          {activeTab === 'chat' && (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {/* 消息列表 */}
              <div style={{
                ...styles.glassCard,
                flex: 1,
                padding: 20,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      animation: 'fadeSlideIn 0.3s ease',
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Bot size={18} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                      color: msg.role === 'user'
                        ? '#fff'
                        : isDark ? '#e0e0e0' : '#333',
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <User size={18} color={isDark ? '#fff' : '#333'} />
                      </div>
                    )}
                  </div>
                ))}
                
                {chatLoading && (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    alignSelf: 'flex-start',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Bot size={18} color="#fff" />
                    </div>
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '16px 16px 16px 4px',
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#667eea',
                            animation: `typingBounce 1.4s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* 操作栏 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 4px',
              }}>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 12,
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                }}>
                  <Clock size={14} />
                  <span>{chatMessages.length} 条消息</span>
                </div>
                <button
                  onClick={clearChatHistory}
                  style={{
                    ...styles.buttonSecondary,
                    padding: '6px 12px',
                    fontSize: 12,
                  }}
                >
                  <Trash2 size={14} />
                  清空对话
                </button>
              </div>
              
              {/* 输入框 */}
              <div style={{
                display: 'flex',
                gap: 10,
              }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  placeholder="输入消息，和 AI 助手聊天..."
                  style={{
                    ...styles.input,
                    flex: 1,
                    padding: '12px 18px',
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    ...styles.button,
                    padding: '12px 24px',
                    opacity: !chatInput.trim() || chatLoading ? 0.5 : 1,
                    cursor: !chatInput.trim() || chatLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={16} />
                  发送
                </button>
              </div>
            </div>
          )}
          
          {/* ===== 实时翻译模块 ===== */}
          {activeTab === 'translate' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxWidth: 900,
              margin: '0 auto',
            }}>
              {/* 语言选择 */}
              <div style={styles.glassCard}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                }}>
                  <select
                    value={translateFrom}
                    onChange={e => setTranslateFrom(e.target.value)}
                    style={{
                      ...styles.input,
                      width: 'auto',
                      padding: '8px 12px',
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : '#fff',
                      color: isDark ? '#fff' : '#333',
                    }}
                  >
                    {LANGUAGE_OPTIONS.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={swapLanguages}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      margin: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <ArrowRight size={16} />
                  </button>
                  
                  <select
                    value={translateTo}
                    onChange={e => setTranslateTo(e.target.value)}
                    style={{
                      ...styles.input,
                      width: 'auto',
                      padding: '8px 12px',
                      background: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : '#fff',
                      color: isDark ? '#fff' : '#333',
                    }}
                  >
                    {LANGUAGE_OPTIONS.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  
                  <div style={{ flex: 1 }} />
                  
                  <button
                    onClick={doTranslate}
                    disabled={!translateInput.trim() || translateLoading}
                    style={{
                      ...styles.button,
                      opacity: !translateInput.trim() || translateLoading ? 0.5 : 1,
                      cursor: !translateInput.trim() || translateLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {translateLoading ? (
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Languages size={16} />
                    )}
                    翻译
                  </button>
                </div>
                
                {/* 翻译区域 */}
                <div style={{ display: 'flex', minHeight: 280 }}>
                  {/* 输入区 */}
                  <div style={{
                    flex: 1,
                    padding: 16,
                    borderRight: isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <textarea
                      value={translateInput}
                      onChange={e => setTranslateInput(e.target.value)}
                      placeholder="输入要翻译的文本..."
                      style={{
                        flex: 1,
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: isDark ? '#e0e0e0' : '#333',
                        fontSize: 15,
                        lineHeight: 1.6,
                        resize: 'none',
                        fontFamily: 'inherit',
                      }}
                      rows={8}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                      fontSize: 12,
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    }}>
                      <span>{translateInput.length} 字符</span>
                      {translateInput && (
                        <button
                          onClick={() => setTranslateInput('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          清空
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 结果区 */}
                  <div style={{
                    flex: 1,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      flex: 1,
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: isDark ? '#e0e0e0' : '#333',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {translateLoading ? (
                        <div style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                          翻译中...
                        </div>
                      ) : translateError ? (
                        <div style={{ color: '#ef4444' }}>{translateError}</div>
                      ) : translateResult ? (
                        translateResult
                      ) : (
                        <div style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                          翻译结果将显示在这里
                        </div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                    }}>
                      <span style={{
                        fontSize: 12,
                        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      }}>
                        {translateResult.length} 字符
                      </span>
                      {translateResult && (
                        <button
                          onClick={copyTranslateResult}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {translateCopied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                          {translateCopied ? '已复制' : '复制'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 提示信息 */}
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}>
                翻译服务由 MyMemory 提供 · 支持 8 种语言互译
              </div>
            </div>
          )}
          
          {/* ===== 天气查询模块 ===== */}
          {activeTab === 'weather' && (
            <div style={{
              maxWidth: 700,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}>
              {/* 搜索框 */}
              <div style={{
                position: 'relative',
              }}>
                <div style={{
                  ...styles.glassCard,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Search size={18} style={{ opacity: 0.5 }} color={isDark ? '#fff' : '#000'} />
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={e => {
                      setCitySearchQuery(e.target.value)
                      setShowCityList(true)
                    }}
                    onFocus={() => setShowCityList(true)}
                    placeholder="搜索城市..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: isDark ? '#fff' : '#333',
                      fontSize: 15,
                    }}
                  />
                  <button
                    onClick={() => {
                      setWeatherLoading(false)
                      setWeatherError(null)
                      fetchWeather()
                    }}
                    style={{
                      ...styles.buttonSecondary,
                      padding: '6px 14px',
                    }}
                  >
                    <RefreshCw size={14} />
                    刷新
                  </button>
                </div>
                
                {/* 城市下拉列表 */}
                {showCityList && filteredCities.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 8,
                    ...styles.glassCard,
                    maxHeight: 240,
                    overflowY: 'auto',
                    zIndex: 20,
                  }}>
                    {filteredCities.map(city => (
                      <div
                        key={city.name}
                        onClick={() => {
                          setCitySearchQuery('')
                          setShowCityList(false)
                          fetchWeather(city.name)
                        }}
                        style={{
                          padding: '12px 18px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: isDark ? '#e0e0e0' : '#333',
                          transition: 'background 0.2s',
                          borderBottom: isDark
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(0, 0, 0, 0.03)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.03)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{city.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.6 }}>{city.country}</div>
                        </div>
                        <ChevronRight size={16} style={{ opacity: 0.4 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 天气信息卡片 */}
              {weatherLoading ? (
                <div style={{
                  ...styles.glassCard,
                  padding: 48,
                  textAlign: 'center',
                }}>
                  <RefreshCw
                    size={32}
                    style={{
                      animation: 'spin 1s linear infinite',
                      marginBottom: 12,
                      opacity: 0.5,
                    }}
                    color={isDark ? '#fff' : '#000'}
                  />
                  <div style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                    正在获取天气数据...
                  </div>
                </div>
              ) : weatherError ? (
                <div style={{
                  ...styles.glassCard,
                  padding: 48,
                  textAlign: 'center',
                  color: '#ef4444',
                }}>
                  {weatherError}
                </div>
              ) : weatherData ? (
                <div style={styles.glassCard}>
                  {/* 主天气信息 */}
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    borderBottom: isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                  }}>
                    <div style={{
                      fontSize: 13,
                      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                      marginBottom: 8,
                    }}>
                      {weatherData.city} · {weatherData.country}
                    </div>
                    <div style={{
                      fontSize: 72,
                      lineHeight: 1,
                      marginBottom: 12,
                    }}>
                      {getWeatherInfo(weatherData.weatherCode).icon}
                    </div>
                    <div style={{
                      fontSize: 56,
                      fontWeight: 200,
                      color: isDark ? '#fff' : '#1a1a2e',
                      lineHeight: 1,
                      marginBottom: 8,
                    }}>
                      {Math.round(weatherData.temperature)}°C
                    </div>
                    <div style={{
                      fontSize: 18,
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    }}>
                      {getWeatherInfo(weatherData.weatherCode).description}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      marginTop: 8,
                    }}>
                      体感温度 {Math.round(weatherData.apparentTemperature)}°C
                    </div>
                  </div>
                  
                  {/* 详细数据 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                  }}>
                    {[
                      { label: '湿度', value: `${weatherData.humidity}%`, icon: '💧' },
                      { label: '风速', value: `${weatherData.windSpeed} km/h`, icon: '💨' },
                      { label: '风向', value: `${weatherData.windDirection}°`, icon: '🧭' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '20px 16px',
                          textAlign: 'center',
                          background: isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 500,
                          color: isDark ? '#fff' : '#1a1a2e',
                        }}>
                          {item.value}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                          marginTop: 4,
                        }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              
              {/* 快捷城市 */}
              <div style={styles.glassCard}>
                <div style={{
                  padding: '14px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                  borderBottom: isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                }}>
                  热门城市
                </div>
                <div style={{
                  padding: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  {DEFAULT_CITIES.map(city => (
                    <button
                      key={city.name}
                      onClick={() => fetchWeather(city.name)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 20,
                        border: isDark
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                        background: weatherData?.city === city.name
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'transparent',
                        color: weatherData?.city === city.name
                          ? '#fff'
                          : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        cursor: 'pointer',
                        fontSize: 13,
                        transition: 'all 0.2s',
                      }}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}>
                天气数据由 Open-Meteo 提供
              </div>
            </div>
          )}
          
          {/* ===== 新闻速递模块 ===== */}
          {activeTab === 'news' && (
            <div style={{
              maxWidth: 800,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 4px',
              }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#1a1a2e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Newspaper size={22} style={{ color: '#667eea' }} />
                  Hacker News 热门
                </div>
                <button
                  onClick={fetchNews}
                  disabled={newsLoading}
                  style={{
                    ...styles.buttonSecondary,
                    opacity: newsLoading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw size={14} style={{
                    animation: newsLoading ? 'spin 1s linear infinite' : 'none',
                  }} />
                  刷新
                </button>
              </div>
              
              <div style={styles.glassCard}>
                {newsLoading ? (
                  <div style={{ padding: 64, textAlign: 'center' }}>
                    <RefreshCw
                      size={28}
                      style={{ animation: 'spin 1s linear infinite', marginBottom: 12, opacity: 0.5 }}
                      color={isDark ? '#fff' : '#000'}
                    />
                    <div style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
                      正在加载新闻...
                    </div>
                  </div>
                ) : newsError ? (
                  <div style={{ padding: 64, textAlign: 'center', color: '#ef4444' }}>
                    {newsError}
                  </div>
                ) : (
                  <div>
                    {newsItems.map((item, idx) => (
                      <a
                        key={item.objectID}
                        href={item.url || `https://news.ycombinator.com/item?id=${item.objectID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '16px 20px',
                          textDecoration: 'none',
                          color: 'inherit',
                          borderBottom: idx < newsItems.length - 1
                            ? isDark
                              ? '1px solid rgba(255, 255, 255, 0.05)'
                              : '1px solid rgba(0, 0, 0, 0.04)'
                            : 'none',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.02)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 500,
                              color: isDark ? '#e0e0e0' : '#1a1a2e',
                              marginBottom: 6,
                              lineHeight: 1.4,
                            }}>
                              {item.title}
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: 16,
                              fontSize: 12,
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                              flexWrap: 'wrap',
                            }}>
                              <span>👤 {item.author}</span>
                              <span>▲ {item.points || 0} points</span>
                              <span>💬 {item.num_comments || 0} 评论</span>
                              <span>⏰ {formatTimeAgo(item.created_at_i)}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}>
                新闻数据由 Hacker News Algolia API 提供
              </div>
            </div>
          )}
          
          {/* ===== 每日名言模块 ===== */}
          {activeTab === 'quote' && (
            <div style={{
              maxWidth: 700,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: isDark ? '#fff' : '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}>
                <Lightbulb size={22} style={{ color: '#fbbf24' }} />
                每日名言 · 点亮灵感
              </div>
              
              {quoteLoading ? (
                <div style={{
                  ...styles.glassCard,
                  padding: 64,
                  textAlign: 'center',
                }}>
                  <RefreshCw
                    size={32}
                    style={{ animation: 'spin 1s linear infinite', marginBottom: 16, opacity: 0.5 }}
                    color={isDark ? '#fff' : '#000'}
                  />
                  <div style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
                    正在获取名言...
                  </div>
                </div>
              ) : quoteData ? (
                <div style={{
                  ...styles.glassCard,
                  padding: '48px 40px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* 装饰性引号 */}
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    left: 20,
                    fontSize: 120,
                    fontFamily: 'Georgia, serif',
                    color: '#667eea',
                    opacity: 0.1,
                    lineHeight: 1,
                  }}>
                    "
                  </div>
                  
                  <div style={{
                    fontSize: 22,
                    lineHeight: 1.7,
                    color: isDark ? '#e0e0e0' : '#1a1a2e',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    marginBottom: 24,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {quoteData.content}
                  </div>
                  
                  <div style={{
                    fontSize: 16,
                    color: '#667eea',
                    fontWeight: 500,
                  }}>
                    —— {quoteData.author}
                  </div>
                </div>
              ) : null}
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
              }}>
                <button
                  onClick={fetchQuote}
                  disabled={quoteLoading}
                  style={{
                    ...styles.button,
                    opacity: quoteLoading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw size={16} style={{
                    animation: quoteLoading ? 'spin 1s linear infinite' : 'none',
                  }} />
                  换一条
                </button>
                <button
                  onClick={copyQuote}
                  disabled={!quoteData}
                  style={{
                    ...styles.buttonSecondary,
                    opacity: !quoteData ? 0.5 : 1,
                  }}
                >
                  {quoteCopied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                  {quoteCopied ? '已复制' : '复制名言'}
                </button>
              </div>
              
              {/* 备用名言预览 */}
              <div style={styles.glassCard}>
                <div style={{
                  padding: '14px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                  borderBottom: isDark
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                }}>
                  更多名言精选
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'grid',
                    gap: 12,
                  }}>
                    {FALLBACK_QUOTES.slice(0, 5).map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 10,
                          background: isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)',
                          borderLeft: '3px solid #667eea',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setQuoteData(q)}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(102, 126, 234, 0.1)'
                            : 'rgba(102, 126, 234, 0.08)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255, 255, 255, 0.03)'
                            : 'rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <div style={{
                          fontSize: 14,
                          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                          marginBottom: 4,
                          lineHeight: 1.5,
                        }}>
                          "{q.content}"
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: '#667eea',
                        }}>
                          —— {q.author}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}>
                名言数据由 Quotable API 提供
              </div>
            </div>
          )}
          
          {/* ===== 代码助手模块 ===== */}
          {activeTab === 'code' && (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {/* 搜索栏 */}
              <div style={{
                ...styles.glassCard,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Search size={18} style={{ opacity: 0.5 }} color={isDark ? '#fff' : '#000'} />
                <input
                  type="text"
                  value={codeSearchQuery}
                  onChange={e => setCodeSearchQuery(e.target.value)}
                  placeholder="搜索代码模板..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: isDark ? '#fff' : '#333',
                    fontSize: 14,
                  }}
                />
                <span style={{
                  fontSize: 12,
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                }}>
                  {filteredCodeTemplates.length} 个模板
                </span>
              </div>
              
              <div style={{
                flex: 1,
                display: 'flex',
                gap: 16,
                overflow: 'hidden',
              }}>
                {/* 模板列表 */}
                <div style={{
                  width: 280,
                  flexShrink: 0,
                  ...styles.glassCard,
                  overflowY: 'auto',
                }}>
                  <div style={{
                    padding: '14px 16px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                    borderBottom: isDark
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                    position: 'sticky',
                    top: 0,
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1,
                  }}>
                    代码模板库
                  </div>
                  <div>
                    {filteredCodeTemplates.map((tpl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedCode(tpl)}
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          borderBottom: isDark
                            ? '1px solid rgba(255, 255, 255, 0.04)'
                            : '1px solid rgba(0, 0, 0, 0.03)',
                          background: selectedCode?.name === tpl.name
                            ? isDark
                              ? 'rgba(102, 126, 234, 0.15)'
                              : 'rgba(102, 126, 234, 0.1)'
                            : 'transparent',
                          borderLeft: selectedCode?.name === tpl.name
                            ? '3px solid #667eea'
                            : '3px solid transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          if (selectedCode?.name !== tpl.name) {
                            e.currentTarget.style.background = isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.02)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (selectedCode?.name !== tpl.name) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isDark ? '#e0e0e0' : '#1a1a2e',
                          marginBottom: 4,
                        }}>
                          {tpl.name}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {tpl.description}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: isDark
                              ? 'rgba(102, 126, 234, 0.3)'
                              : 'rgba(102, 126, 234, 0.15)',
                            color: '#667eea',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            fontWeight: 500,
                          }}>
                            {tpl.language}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 代码详情 */}
                <div style={{
                  flex: 1,
                  ...styles.glassCard,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  {selectedCode ? (
                    <>
                      <div style={{
                        padding: '16px 20px',
                        borderBottom: isDark
                          ? '1px solid rgba(255, 255, 255, 0.08)'
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: isDark ? '#fff' : '#1a1a2e',
                          }}>
                            {selectedCode.name}
                          </div>
                          <div style={{
                            fontSize: 13,
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                            marginTop: 2,
                          }}>
                            {selectedCode.description}
                          </div>
                        </div>
                        <button
                          onClick={copyCode}
                          style={{
                            ...styles.button,
                            padding: '8px 16px',
                            fontSize: 13,
                          }}
                        >
                          {codeCopied ? (
                            <><Check size={14} /> 已复制</>
                          ) : (
                            <><Copy size={14} /> 复制代码</>
                          )}
                        </button>
                      </div>
                      <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: 20,
                        background: isDark
                          ? 'rgba(0, 0, 0, 0.3)'
                          : '#f8f9fa',
                        fontFamily: "'SF Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: isDark ? '#e0e0e0' : '#333',
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {selectedCode.code}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                      gap: 12,
                    }}>
                      <Code2 size={48} style={{ opacity: 0.3 }} />
                      <div>选择一个代码模板查看详情</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                fontSize: 12,
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              }}>
                内置 {CODE_TEMPLATES.length} 个常用代码模板 · 持续更新中
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 全局样式 */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* 滚动条样式 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'};
        }
        
        select option {
          background: ${isDark ? '#1a1a2e' : '#fff'};
          color: ${isDark ? '#fff' : '#333'};
        }
      `}</style>
    </div>
  )
})

export default SmartAIHub
