import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import {
  Search, Terminal, Calculator, Globe, Clock, Zap, Command,
  Sparkles, FileText, ArrowRight, X, Ruler, Calendar, Palette,
  Hash, Key, Shield, Smile, Monitor, Image, Trash2, History
} from 'lucide-react'

interface SmartCommandCenterProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'app' | 'action' | 'calc' | 'web' | 'command' | 'convert' | 'time' | 'color' | 'encode' | 'uuid' | 'password' | 'hash' | 'emoji' | 'system'
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

interface EmojiData {
  emoji: string
  name: string
  keywords: string[]
}

const EMOJI_LIST: EmojiData[] = [
  { emoji: '😀', name: 'grinning', keywords: ['smile', 'happy', 'face', 'grin', '开心', '笑'] },
  { emoji: '😂', name: 'joy', keywords: ['laugh', 'tear', 'happy', '笑', '开心', '笑哭'] },
  { emoji: '🥰', name: 'smiling face with hearts', keywords: ['love', 'heart', 'like', '爱', '喜欢'] },
  { emoji: '😍', name: 'heart eyes', keywords: ['love', 'heart', 'like', '爱', '喜欢'] },
  { emoji: '🤔', name: 'thinking', keywords: ['think', 'wonder', 'hmm', '思考', '想'] },
  { emoji: '😎', name: 'cool', keywords: ['cool', 'sunglasses', 'swag', '酷', '帅'] },
  { emoji: '😭', name: 'crying', keywords: ['cry', 'sad', 'tear', '哭', '难过'] },
  { emoji: '😡', name: 'angry', keywords: ['angry', 'mad', 'furious', '生气', '愤怒'] },
  { emoji: '🥺', name: 'pleading', keywords: ['cute', 'plead', 'beg', '可怜', '求'] },
  { emoji: '😴', name: 'sleeping', keywords: ['sleep', 'tired', 'zzz', '睡', '困'] },
  { emoji: '🤗', name: 'hugging', keywords: ['hug', 'welcome', 'embrace', '拥抱'] },
  { emoji: '😇', name: 'angel', keywords: ['angel', 'innocent', 'halo', '天使'] },
  { emoji: '🤯', name: 'exploding head', keywords: ['mind blown', 'shocked', 'surprised', '震惊', '爆炸'] },
  { emoji: '😱', name: 'scream', keywords: ['shock', 'scream', 'scared', '害怕', '尖叫'] },
  { emoji: '🤩', name: 'star struck', keywords: ['star', 'awesome', 'amazing', '星星', '棒'] },
  { emoji: '❤️', name: 'red heart', keywords: ['heart', 'love', 'like', '心', '爱', '红心'] },
  { emoji: '💔', name: 'broken heart', keywords: ['heart', 'break', 'sad', '心碎'] },
  { emoji: '💯', name: 'hundred points', keywords: ['hundred', 'perfect', 'score', '满分', '一百'] },
  { emoji: '✨', name: 'sparkles', keywords: ['sparkle', 'star', 'shine', '闪光', '星星'] },
  { emoji: '🔥', name: 'fire', keywords: ['fire', 'hot', 'lit', '火', '热', '燃'] },
  { emoji: '⭐', name: 'star', keywords: ['star', 'starry', '星星'] },
  { emoji: '🌟', name: 'glowing star', keywords: ['star', 'glow', 'shine', '星星'] },
  { emoji: '💪', name: 'muscle', keywords: ['strong', 'muscle', 'power', '强壮', '加油'] },
  { emoji: '👍', name: 'thumbs up', keywords: ['like', 'good', 'approve', '赞', '好', '棒'] },
  { emoji: '👎', name: 'thumbs down', keywords: ['dislike', 'bad', 'disapprove', '踩', '不好'] },
  { emoji: '👏', name: 'clap', keywords: ['applause', 'clap', 'congrats', '鼓掌', '恭喜'] },
  { emoji: '🙌', name: 'raising hands', keywords: ['celebrate', 'praise', 'hooray', '欢呼', '庆祝'] },
  { emoji: '🤝', name: 'handshake', keywords: ['agreement', 'deal', 'shake', '握手', '合作'] },
  { emoji: '🙏', name: 'pray', keywords: ['pray', 'please', 'thank', '祈祷', '谢谢', '拜托'] },
  { emoji: '💀', name: 'skull', keywords: ['skull', 'death', 'dead', '骷髅', '死'] },
  { emoji: '🎉', name: 'party popper', keywords: ['party', 'celebrate', 'birthday', '派对', '庆祝'] },
  { emoji: '🎊', name: 'confetti ball', keywords: ['celebrate', 'confetti', 'party', '庆祝'] },
  { emoji: '🏆', name: 'trophy', keywords: ['trophy', 'win', 'champion', '奖杯', '冠军'] },
  { emoji: '💡', name: 'light bulb', keywords: ['idea', 'light', 'bulb', '想法', '灵感', '灯泡'] },
  { emoji: '📌', name: 'pin', keywords: ['pin', 'important', 'mark', '钉', '重要'] },
  { emoji: '✅', name: 'check mark', keywords: ['check', 'done', 'ok', '对', '完成', '正确'] },
  { emoji: '❌', name: 'cross mark', keywords: ['cross', 'no', 'wrong', '错', '不对'] },
  { emoji: '⚠️', name: 'warning', keywords: ['warn', 'caution', 'alert', '警告', '注意'] },
  { emoji: '🚀', name: 'rocket', keywords: ['rocket', 'launch', 'space', '火箭', '发射'] },
  { emoji: '💻', name: 'laptop', keywords: ['computer', 'laptop', 'tech', '电脑', '笔记本'] },
  { emoji: '📱', name: 'phone', keywords: ['phone', 'mobile', 'cell', '手机'] },
  { emoji: '🐶', name: 'dog', keywords: ['dog', 'puppy', 'pet', '狗', '宠物'] },
  { emoji: '🐱', name: 'cat', keywords: ['cat', 'kitten', 'pet', '猫', '宠物'] },
  { emoji: '🌸', name: 'cherry blossom', keywords: ['flower', 'blossom', 'spring', '花', '樱花', '春天'] },
  { emoji: '🌙', name: 'moon', keywords: ['moon', 'night', 'sleep', '月亮', '夜晚'] },
  { emoji: '☀️', name: 'sun', keywords: ['sun', 'day', 'bright', '太阳', '白天'] },
  { emoji: '🌈', name: 'rainbow', keywords: ['rainbow', 'color', 'pride', '彩虹'] },
  { emoji: '🍕', name: 'pizza', keywords: ['pizza', 'food', 'eat', '披萨', '食物'] },
  { emoji: '🍔', name: 'burger', keywords: ['burger', 'food', 'eat', '汉堡', '食物'] },
  { emoji: '☕', name: 'coffee', keywords: ['coffee', 'drink', 'cafe', '咖啡'] },
  { emoji: '🍺', name: 'beer', keywords: ['beer', 'drink', 'alcohol', '啤酒'] },
  { emoji: '🎵', name: 'music note', keywords: ['music', 'song', 'note', '音乐', '歌'] },
  { emoji: '🎮', name: 'game controller', keywords: ['game', 'play', 'controller', '游戏'] },
  { emoji: '📚', name: 'books', keywords: ['book', 'read', 'study', '书', '阅读', '学习'] },
  { emoji: '✈️', name: 'airplane', keywords: ['plane', 'fly', 'travel', '飞机', '旅行'] },
  { emoji: '🏠', name: 'house', keywords: ['house', 'home', 'building', '家', '房子'] },
  { emoji: '🚗', name: 'car', keywords: ['car', 'vehicle', 'drive', '汽车', '车'] },
  { emoji: '⏰', name: 'alarm clock', keywords: ['clock', 'alarm', 'time', '闹钟', '时间'] },
  { emoji: '🔔', name: 'bell', keywords: ['bell', 'ring', 'notify', '铃', '通知'] },
  { emoji: '🔒', name: 'lock', keywords: ['lock', 'secure', 'private', '锁', '安全'] },
  { emoji: '🔑', name: 'key', keywords: ['key', 'password', 'access', '钥匙', '密码'] },
  { emoji: '⚡', name: 'zap', keywords: ['lightning', 'power', 'fast', '闪电', '快', '能量'] },
  { emoji: '💧', name: 'droplet', keywords: ['water', 'drop', 'liquid', '水', '水滴'] },
  { emoji: '🌍', name: 'earth', keywords: ['earth', 'world', 'globe', '地球', '世界'] },
]

const COMMAND_HISTORY_KEY = 'smart-command-history'
const MAX_HISTORY = 20

const SmartCommandCenter = memo(function SmartCommandCenter({ isOpen, onClose }: SmartCommandCenterProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const apps = useStore((s) => s.apps)
  const openApp = useStore((s) => s.openApp)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const setWallpaper = useStore((s) => s.setWallpaper)
  const clearWindows = useStore((s) => s.clearWindows)
  const addNotification = useStore((s) => s.addNotification)

  const quickActions = useMemo(() => [
    { id: 'terminal', title: '打开终端', subtitle: 'Ctrl+T', icon: <Terminal size={18} />, action: () => openApp('terminal') },
    { id: 'files', title: '文件管理器', subtitle: 'Ctrl+E', icon: <FileText size={18} />, action: () => openApp('files') },
    { id: 'calculator', title: '计算器', subtitle: 'Ctrl+Shift+C', icon: <Calculator size={18} />, action: () => openApp('calculator') },
    { id: 'browser', title: '浏览器', subtitle: 'Ctrl+B', icon: <Globe size={18} />, action: () => openApp('browser') },
    { id: 'weather', title: '天气', subtitle: '查看天气信息', icon: <Sparkles size={18} />, action: () => openApp('weather') },
    { id: 'clock', title: '时钟', subtitle: '查看时间和闹钟', icon: <Clock size={18} />, action: () => openApp('clock') },
  ], [openApp])

  const calcExpression = useCallback((expr: string): string | null => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%\s^]/g, '')
      if (!sanitized.trim()) return null
      
      let expression = sanitized.replace(/\^/g, '**')
      
      const evaluateFn = new Function('"use strict"; return (' + expression + ')')
      const result = evaluateFn()
      
      if (typeof result !== 'number' || !isFinite(result)) return null
      
      if (Number.isInteger(result)) return result.toString()
      return result.toFixed(6).replace(/\.?0+$/, '')
    } catch {
      return null
    }
  }, [])

  const addToHistory = useCallback((cmd: string) => {
    if (!cmd.trim()) return
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== cmd)
      const next = [cmd, ...filtered].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(COMMAND_HISTORY_KEY)
      if (raw) {
        setCommandHistory(JSON.parse(raw))
      }
    } catch {}
  }, [])

  const convertUnit = useCallback((input: string): string | null => {
    const match = input.match(/^([\d.]+)\s*([a-zA-Z°℃℉]+)\s*(?:to|in|->)\s*([a-zA-Z°℃℉]+)$/i)
    if (!match) return null

    const value = parseFloat(match[1])
    const from = match[2].toLowerCase()
    const to = match[3].toLowerCase()

    const lengthUnits: Record<string, number> = {
      'm': 1, 'meter': 1, 'meters': 1, '米': 1,
      'km': 1000, 'kilometer': 1000, 'kilometers': 1000, '千米': 1000, '公里': 1000,
      'cm': 0.01, 'centimeter': 0.01, 'centimeters': 0.01, '厘米': 0.01,
      'mm': 0.001, 'millimeter': 0.001, 'millimeters': 0.001, '毫米': 0.001,
      'mi': 1609.344, 'mile': 1609.344, 'miles': 1609.344, '英里': 1609.344,
      'yd': 0.9144, 'yard': 0.9144, 'yards': 0.9144, '码': 0.9144,
      'ft': 0.3048, 'foot': 0.3048, 'feet': 0.3048, '英尺': 0.3048,
      'in': 0.0254, 'inch': 0.0254, 'inches': 0.0254, '英寸': 0.0254,
    }

    const weightUnits: Record<string, number> = {
      'kg': 1, 'kilogram': 1, 'kilograms': 1, '千克': 1, '公斤': 1,
      'g': 0.001, 'gram': 0.001, 'grams': 0.001, '克': 0.001,
      'mg': 0.000001, 'milligram': 0.000001, 'milligrams': 0.000001, '毫克': 0.000001,
      'lb': 0.453592, 'pound': 0.453592, 'pounds': 0.453592, '磅': 0.453592,
      'oz': 0.0283495, 'ounce': 0.0283495, 'ounces': 0.0283495, '盎司': 0.0283495,
      't': 1000, 'ton': 1000, 'tons': 1000, '吨': 1000,
    }

    const volumeUnits: Record<string, number> = {
      'l': 1, 'liter': 1, 'liters': 1, '升': 1,
      'ml': 0.001, 'milliliter': 0.001, 'milliliters': 0.001, '毫升': 0.001,
      'gal': 3.78541, 'gallon': 3.78541, 'gallons': 3.78541, '加仑': 3.78541,
      'qt': 0.946353, 'quart': 0.946353, 'quarts': 0.946353, '夸脱': 0.946353,
      'pt': 0.473176, 'pint': 0.473176, 'pints': 0.473176, '品脱': 0.473176,
      'cup': 0.236588, 'cups': 0.236588, '杯': 0.236588,
    }

    const tempUnits = ['c', 'f', 'k', '°c', '°f', '°k', 'celsius', 'fahrenheit', 'kelvin', '摄氏度', '华氏度']

    const isTemp = (u: string) => tempUnits.some(t => u === t || u === t.replace('°', ''))
    const normTemp = (u: string) => {
      const clean = u.replace('°', '')
      if (clean === 'c' || clean === 'celsius' || clean === '摄氏度') return 'c'
      if (clean === 'f' || clean === 'fahrenheit' || clean === '华氏度') return 'f'
      if (clean === 'k' || clean === 'kelvin') return 'k'
      return clean
    }

    if (isTemp(from) && isTemp(to)) {
      const f = normTemp(from)
      const t = normTemp(to)
      let celsius: number
      if (f === 'c') celsius = value
      else if (f === 'f') celsius = (value - 32) * 5 / 9
      else celsius = value - 273.15

      let result: number
      if (t === 'c') result = celsius
      else if (t === 'f') result = celsius * 9 / 5 + 32
      else result = celsius + 273.15

      return `${result.toFixed(2)}°${t.toUpperCase()}`
    }

    if (lengthUnits[from] && lengthUnits[to]) {
      const result = value * lengthUnits[from] / lengthUnits[to]
      return `${result.toFixed(6).replace(/\.?0+$/, '')} ${to}`
    }

    if (weightUnits[from] && weightUnits[to]) {
      const result = value * weightUnits[from] / weightUnits[to]
      return `${result.toFixed(6).replace(/\.?0+$/, '')} ${to}`
    }

    if (volumeUnits[from] && volumeUnits[to]) {
      const result = value * volumeUnits[from] / volumeUnits[to]
      return `${result.toFixed(6).replace(/\.?0+$/, '')} ${to}`
    }

    return null
  }, [])

  const calculateTime = useCallback((input: string): string | null => {
    const q = input.toLowerCase().trim()

    const tsMatch = q.match(/^timestamp\s+(\d+)$/)
    if (tsMatch) {
      const ts = parseInt(tsMatch[1])
      let date: Date
      if (tsMatch[1].length <= 10) {
        date = new Date(ts * 1000)
      } else {
        date = new Date(ts)
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'short'
      })
    }

    const nowMatch = q.match(/^(now|今天|today|时间|time)$/)
    if (nowMatch) {
      return new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'short'
      })
    }

    const addMatch = q.match(/^(today|今天|now|现在)\s*([+-])\s*(\d+)\s*(day|days|天|hour|hours|小时|h|minute|minutes|分钟|min|week|weeks|周|month|months|月|year|years|年)$/)
    if (addMatch) {
      const date = new Date()
      const sign = addMatch[2] === '+' ? 1 : -1
      const num = parseInt(addMatch[3])
      const unit = addMatch[4]

      if (unit.startsWith('day') || unit === '天') date.setDate(date.getDate() + sign * num)
      else if (unit.startsWith('hour') || unit === '小时' || unit === 'h') date.setHours(date.getHours() + sign * num)
      else if (unit.startsWith('minute') || unit === '分钟' || unit === 'min') date.setMinutes(date.getMinutes() + sign * num)
      else if (unit.startsWith('week') || unit === '周') date.setDate(date.getDate() + sign * num * 7)
      else if (unit.startsWith('month') || unit === '月') date.setMonth(date.getMonth() + sign * num)
      else if (unit.startsWith('year') || unit === '年') date.setFullYear(date.getFullYear() + sign * num)

      return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'short'
      })
    }

    return null
  }, [])

  const convertColor = useCallback((input: string): string | null => {
    const q = input.toLowerCase().trim()

    const hexToRgbMatch = q.match(/^(#[0-9a-f]{6}|#[0-9a-f]{3})\s*(?:to|in|->)\s*rgb$/)
    if (hexToRgbMatch) {
      let hex = hexToRgbMatch[1].replace('#', '')
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgb(${r}, ${g}, ${b})`
    }

    const rgbToHexMatch = q.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*(?:to|in|->)\s*hex$/)
    if (rgbToHexMatch) {
      const r = parseInt(rgbToHexMatch[1])
      const g = parseInt(rgbToHexMatch[2])
      const b = parseInt(rgbToHexMatch[3])
      if (r > 255 || g > 255 || b > 255) return null
      const toHex = (n: number) => n.toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    const hexToHslMatch = q.match(/^(#[0-9a-f]{6}|#[0-9a-f]{3})\s*(?:to|in|->)\s*hsl$/)
    if (hexToHslMatch) {
      let hex = hexToHslMatch[1].replace('#', '')
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0
      const l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    }

    return null
  }, [])

  const base64Encode = useCallback((str: string): string => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    } catch {
      return ''
    }
  }, [])

  const base64Decode = useCallback((str: string): string => {
    try {
      return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    } catch {
      return ''
    }
  }, [])

  const generateUUID = useCallback((count: number = 1): string[] => {
    const uuids: string[] = []
    for (let i = 0; i < Math.min(count, 10); i++) {
      if (crypto.randomUUID) {
        uuids.push(crypto.randomUUID())
      } else {
        uuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        }))
      }
    }
    return uuids
  }, [])

  const generatePassword = useCallback((length: number = 16): string => {
    const len = Math.max(4, Math.min(length, 128))
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    let password = ''
    if (crypto.getRandomValues) {
      const array = new Uint32Array(len)
      crypto.getRandomValues(array)
      for (let i = 0; i < len; i++) {
        password += charset[array[i] % charset.length]
      }
    } else {
      for (let i = 0; i < len; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
      }
    }
    return password
  }, [])

  const calculateHash = useCallback(async (algo: string, text: string): Promise<string> => {
    const algoLower = algo.toLowerCase()
    if (algoLower !== 'md5' && algoLower !== 'sha1' && algoLower !== 'sha256' && algoLower !== 'sha512') {
      return ''
    }
    try {
      const msgBuffer = new TextEncoder().encode(text)
      const hashBuffer = await crypto.subtle.digest(algoLower === 'md5' ? 'SHA-256' : algoLower.toUpperCase().replace('SHA', 'SHA-'), msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      if (algoLower === 'md5') {
        return simpleMD5(text)
      }
      return ''
    }
  }, [])

  const simpleMD5 = (string: string): string => {
    function rotateLeft(value: number, shift: number): number {
      return (value << shift) | (value >>> (32 - shift))
    }
    function addUnsigned(x: number, y: number): number {
      const x8 = x & 0x80000000
      const y8 = y & 0x80000000
      const x4 = x & 0x40000000
      const y4 = y & 0x40000000
      const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF)
      if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8
      if (x4 | y4) {
        if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8
        else return result ^ 0x40000000 ^ x8 ^ y8
      }
      return result ^ x8 ^ y8
    }
    function F(x: number, y: number, z: number): number { return (x & y) | ((~x) & z) }
    function G(x: number, y: number, z: number): number { return (x & z) | (y & (~z)) }
    function H(x: number, y: number, z: number): number { return x ^ y ^ z }
    function I(x: number, y: number, z: number): number { return y ^ (x | (~z)) }
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
      return addUnsigned(rotateLeft(a, s), b)
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
      return addUnsigned(rotateLeft(a, s), b)
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
      return addUnsigned(rotateLeft(a, s), b)
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
      return addUnsigned(rotateLeft(a, s), b)
    }
    function convertToWordArray(str: string): number[] {
      let wordCount
      const messageLength = str.length
      const numberOfWords = ((messageLength + 8) - ((messageLength + 8) % 64)) / 64 + 1
      const wordArray = new Array(numberOfWords * 16 - 1).fill(0)
      wordCount = messageLength >> 2
      let i
      for (i = 0; i < wordCount; i++) {
        wordArray[i] = str.charCodeAt(i * 4) + (str.charCodeAt(i * 4 + 1) << 8) + (str.charCodeAt(i * 4 + 2) << 16) + (str.charCodeAt(i * 4 + 3) << 24)
      }
      const bytePosition = (messageLength % 4) * 8
      const bitMask = 0xFF << bytePosition
      wordArray[i] = (wordArray[i] | (0x80 << bytePosition)) & ~bitMask | (str.charCodeAt(i * 4) & (bitMask >> 8))
      wordArray[numberOfWords * 16 - 2] = messageLength << 3
      wordArray[numberOfWords * 16 - 1] = messageLength >>> 29
      return wordArray
    }
    function wordToHex(value: number): string {
      let hex = ''
      for (let i = 0; i <= 3; i++) {
        hex += ('0' + ((value >>> (i * 8)) & 0xFF).toString(16)).slice(-2)
      }
      return hex
    }

    const x = convertToWordArray(string)
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476
    for (let k = 0; k < x.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d
      a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478)
      d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756)
      c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB)
      b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE)
      a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF)
      d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A)
      c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613)
      b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501)
      a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8)
      d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF)
      c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
      b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
      a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122)
      d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193)
      c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E)
      b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821)
      a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562)
      d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340)
      c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51)
      b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA)
      a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D)
      d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
      c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
      b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8)
      a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6)
      d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6)
      c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87)
      b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED)
      a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
      d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8)
      c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9)
      b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)
      a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942)
      d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681)
      c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
      b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
      a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44)
      d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9)
      c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60)
      b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
      a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
      d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA)
      c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085)
      b = HH(b, c, d, a, x[k + 6], 23, 0x04881D05)
      a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039)
      d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
      c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
      b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665)
      a = II(a, b, c, d, x[k + 0], 6, 0xF4292244)
      d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97)
      c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
      b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039)
      a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3)
      d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92)
      c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
      b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1)
      a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F)
      d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
      c = II(c, d, a, b, x[k + 6], 15, 0xA3014314)
      b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1)
      a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82)
      d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235)
      c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB)
      b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391)
      a = addUnsigned(a, AA)
      b = addUnsigned(b, BB)
      c = addUnsigned(c, CC)
      d = addUnsigned(d, DD)
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
  }

  const searchEmojis = useCallback((query: string): EmojiData[] => {
    const q = query.toLowerCase().replace(/^:/, '').trim()
    if (!q) return []
    return EMOJI_LIST.filter(emoji =>
      emoji.name.toLowerCase().includes(q) ||
      emoji.keywords.some(k => k.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard?.writeText(text)
    addNotification({
      title: '已复制',
      message: '内容已复制到剪贴板',
      type: 'success',
      duration: 2000,
    })
  }, [addNotification])

  const searchResults = useMemo((): SearchResult[] => {
    const q = query.trim()
    const qLower = q.toLowerCase()
    
    if (!q) {
      const historyResults = commandHistory.slice(0, 5).map((cmd, i) => ({
        id: `history-${i}`,
        type: 'action' as const,
        title: cmd,
        subtitle: '历史命令',
        icon: <History size={18} />,
        action: () => setQuery(cmd),
      }))
      return [...historyResults, ...quickActions.map(a => ({
        id: a.id,
        type: 'action' as const,
        title: a.title,
        subtitle: a.subtitle,
        icon: a.icon,
        action: a.action,
      }))]
    }

    const toolResults: SearchResult[] = []

    const unitResult = convertUnit(q)
    if (unitResult) {
      toolResults.push({
        id: 'unit-convert',
        type: 'convert',
        title: unitResult,
        subtitle: '单位转换 · 按 Enter 复制',
        icon: <Ruler size={18} />,
        action: () => {
          copyToClipboard(unitResult)
          addToHistory(q)
          onClose()
        },
      })
    }

    const timeResult = calculateTime(q)
    if (timeResult) {
      toolResults.push({
        id: 'time-calc',
        type: 'time',
        title: timeResult,
        subtitle: '时间/日期 · 按 Enter 复制',
        icon: <Calendar size={18} />,
        action: () => {
          copyToClipboard(timeResult)
          addToHistory(q)
          onClose()
        },
      })
    }

    const colorResult = convertColor(q)
    if (colorResult) {
      toolResults.push({
        id: 'color-convert',
        type: 'color',
        title: colorResult,
        subtitle: '颜色转换 · 按 Enter 复制',
        icon: <Palette size={18} />,
        action: () => {
          copyToClipboard(colorResult)
          addToHistory(q)
          onClose()
        },
      })
    }

    const base64EncodeMatch = qLower.match(/^base64\s+encode\s+(.+)$/)
    if (base64EncodeMatch) {
      const encoded = base64Encode(base64EncodeMatch[1])
      if (encoded) {
        toolResults.push({
          id: 'base64-encode',
          type: 'encode',
          title: encoded,
          subtitle: 'Base64 编码 · 按 Enter 复制',
          icon: <Hash size={18} />,
          action: () => {
            copyToClipboard(encoded)
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    const base64DecodeMatch = qLower.match(/^base64\s+decode\s+(.+)$/)
    if (base64DecodeMatch) {
      const decoded = base64Decode(base64DecodeMatch[1])
      if (decoded) {
        toolResults.push({
          id: 'base64-decode',
          type: 'encode',
          title: decoded,
          subtitle: 'Base64 解码 · 按 Enter 复制',
          icon: <Hash size={18} />,
          action: () => {
            copyToClipboard(decoded)
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    const uuidMatch = qLower.match(/^uuid\s*(\d*)$/)
    if (uuidMatch) {
      const count = uuidMatch[1] ? parseInt(uuidMatch[1]) : 1
      const uuids = generateUUID(count)
      if (uuids.length > 0) {
        toolResults.push({
          id: 'uuid-gen',
          type: 'uuid',
          title: count > 1 ? `生成 ${count} 个 UUID` : uuids[0],
          subtitle: count > 1 ? '按 Enter 复制第一个 UUID' : 'UUID · 按 Enter 复制',
          icon: <Key size={18} />,
          action: () => {
            copyToClipboard(uuids.join('\n'))
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    const passwordMatch = qLower.match(/^password\s*(\d*)$/)
    if (passwordMatch) {
      const length = passwordMatch[1] ? parseInt(passwordMatch[1]) : 16
      const pwd = generatePassword(length)
      if (pwd) {
        toolResults.push({
          id: 'password-gen',
          type: 'password',
          title: pwd,
          subtitle: `密码 (${length}位) · 按 Enter 复制`,
          icon: <Shield size={18} />,
          action: () => {
            copyToClipboard(pwd)
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    const hashMatch = qLower.match(/^(md5|sha1|sha256|sha512)\s+(.+)$/)
    if (hashMatch) {
      const algo = hashMatch[1].toUpperCase()
      const text = hashMatch[2]
      let hashValue = ''
      if (algo === 'MD5') {
        hashValue = simpleMD5(text)
      }
      if (hashValue || algo !== 'MD5') {
        toolResults.push({
          id: `hash-${algo}`,
          type: 'hash',
          title: hashValue || '计算中...',
          subtitle: `${algo} 哈希 · 按 Enter 复制`,
          icon: <Hash size={18} />,
          action: async () => {
            const result = await calculateHash(algo, text)
            const finalResult = result || hashValue
            if (finalResult) {
              copyToClipboard(finalResult)
            }
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    if (q.startsWith(':')) {
      const emojis = searchEmojis(q)
      emojis.forEach((emoji, i) => {
        toolResults.push({
          id: `emoji-${i}`,
          type: 'emoji',
          title: `${emoji.emoji}  ${emoji.name}`,
          subtitle: '表情符号 · 按 Enter 复制',
          icon: <Smile size={18} />,
          action: () => {
            copyToClipboard(emoji.emoji)
            addToHistory(q)
            onClose()
          },
        })
      })
    }

    const systemCommands: SearchResult[] = []
    const themeToggleKeywords = ['切换主题', 'theme', 'dark', 'light', '深色', '浅色', '暗黑', '明亮']
    if (themeToggleKeywords.some(k => qLower.includes(k))) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark'
      systemCommands.push({
        id: 'toggle-theme',
        type: 'system',
        title: `切换到${nextTheme === 'dark' ? '深色' : '浅色'}主题`,
        subtitle: '系统操作',
        icon: <Monitor size={18} />,
        action: () => {
          setTheme(nextTheme)
          addNotification({
            title: '主题已切换',
            message: `已切换到${nextTheme === 'dark' ? '深色' : '浅色'}主题`,
            type: 'success',
            duration: 2000,
          })
          addToHistory(q)
          onClose()
        },
      })
    }

    const wallpaperKeywords = ['切换壁纸', 'wallpaper', '壁纸', '背景']
    if (wallpaperKeywords.some(k => qLower.includes(k))) {
      const gradientWallpapers = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      ]
      const randomWallpaper = gradientWallpapers[Math.floor(Math.random() * gradientWallpapers.length)]
      systemCommands.push({
        id: 'change-wallpaper',
        type: 'system',
        title: '随机切换壁纸',
        subtitle: '系统操作',
        icon: <Image size={18} />,
        action: () => {
          setWallpaper(randomWallpaper)
          addNotification({
            title: '壁纸已更新',
            message: '壁纸已随机切换',
            type: 'success',
            duration: 2000,
          })
          addToHistory(q)
          onClose()
        },
      })
    }

    const clearWindowsKeywords = ['清空窗口', '关闭所有窗口', 'clear windows', 'close all', '关闭窗口']
    if (clearWindowsKeywords.some(k => qLower.includes(k))) {
      systemCommands.push({
        id: 'clear-windows',
        type: 'system',
        title: '清空所有窗口',
        subtitle: '系统操作',
        icon: <Trash2 size={18} />,
        action: () => {
          clearWindows()
          addNotification({
            title: '窗口已清空',
            message: '所有窗口已关闭',
            type: 'success',
            duration: 2000,
          })
          addToHistory(q)
          onClose()
        },
      })
    }

    if (/^[0-9+\-*/().%\s^]+$/.test(q) && toolResults.length === 0) {
      const result = calcExpression(q)
      if (result !== null) {
        toolResults.push({
          id: 'calc-result',
          type: 'calc',
          title: `= ${result}`,
          subtitle: '按 Enter 复制结果',
          icon: <Calculator size={18} />,
          action: () => {
            copyToClipboard(result)
            addToHistory(q)
            onClose()
          },
        })
      }
    }

    const appResults: SearchResult[] = apps
      .filter(app => 
        app.name.toLowerCase().includes(qLower) ||
        app.id.toLowerCase().includes(qLower) ||
        app.category?.toLowerCase().includes(qLower)
      )
      .slice(0, 8)
      .map(app => ({
        id: app.id,
        type: 'app' as const,
        title: app.name,
        subtitle: app.category || '应用',
        icon: app.icon || <Zap size={18} />,
        action: () => {
          openApp(app.id)
          addToHistory(q)
          onClose()
        },
      }))

    const commandResults: SearchResult[] = []
    
    if (q.startsWith('>')) {
      commandResults.push({
        id: 'cmd-terminal',
        type: 'command' as const,
        title: `在终端中运行: ${q.slice(1)}`,
        subtitle: '打开终端并执行命令',
        icon: <Terminal size={18} />,
        action: () => {
          openApp('terminal')
          addToHistory(q)
          onClose()
        },
      })
    }

    if (q.startsWith('?') || q.startsWith('/')) {
      commandResults.push({
        id: 'search-web',
        type: 'web' as const,
        title: `搜索: ${q.slice(1)}`,
        subtitle: '在浏览器中搜索',
        icon: <Globe size={18} />,
        action: () => {
          openApp('browser')
          addToHistory(q)
          onClose()
        },
      })
    }

    const webResults: SearchResult[] = []
    if (qLower.length > 2 && !q.startsWith('>') && !q.startsWith('?') && !q.startsWith('/') && toolResults.length === 0 && systemCommands.length === 0) {
      webResults.push({
        id: 'web-search',
        type: 'web' as const,
        title: `在网络中搜索 "${q}"`,
        subtitle: '使用默认搜索引擎',
        icon: <Globe size={18} />,
        action: () => {
          openApp('browser')
          addToHistory(q)
          onClose()
        },
      })
    }

    return [...toolResults, ...systemCommands, ...appResults, ...commandResults, ...webResults]
  }, [query, apps, quickActions, calcExpression, openApp, onClose, commandHistory, theme, setTheme, setWallpaper, clearWindows, addNotification, copyToClipboard, addToHistory, convertUnit, calculateTime, convertColor, base64Encode, base64Decode, generateUUID, generatePassword, calculateHash, searchEmojis])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        if (commandHistory.length > 0 && historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setQuery(commandHistory[newIndex])
        } else {
          setHistoryIndex(-1)
          setQuery('')
        }
      } else {
        setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setQuery(commandHistory[newIndex])
        }
      } else {
        setSelectedIndex(i => Math.max(i - 1, 0))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = searchResults[selectedIndex]
      if (result) {
        result.action()
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (searchResults.length > 0) {
        const firstResult = searchResults[0]
        if (firstResult.type === 'app' || firstResult.type === 'action') {
          setQuery(firstResult.title)
        }
      }
    }
  }, [searchResults, selectedIndex, onClose, commandHistory, historyIndex])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setHistoryIndex(-1)
      loadHistory()
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, loadHistory])

  useEffect(() => {
    if (!isOpen) return

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (searchResults.length > 0 && resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, searchResults.length])

  if (!isOpen) return null

  const getModeLabel = (): string => {
    const qLower = query.toLowerCase().trim()
    if (query.startsWith('>')) return '命令'
    if (query.startsWith('?') || query.startsWith('/')) return '搜索'
    if (query.startsWith(':')) return '表情'
    if (/^base64\s+/.test(qLower)) return 'Base64'
    if (/^uuid\b/.test(qLower)) return 'UUID'
    if (/^password\b/.test(qLower)) return '密码'
    if (/^(md5|sha1|sha256|sha512)\s+/.test(qLower)) return '哈希'
    if (convertUnit(query)) return '转换'
    if (calculateTime(query)) return '时间'
    if (convertColor(query)) return '颜色'
    if (/^[0-9+\-*/().%\s^]+$/.test(query) && query.length > 1) return '计算'
    if (['切换主题', 'theme', 'dark', 'light', '深色', '浅色'].some(k => qLower.includes(k))) return '系统'
    if (['切换壁纸', 'wallpaper', '壁纸', '背景'].some(k => qLower.includes(k))) return '系统'
    if (['清空窗口', '关闭所有窗口', 'clear windows', 'close all'].some(k => qLower.includes(k))) return '系统'
    return '应用'
  }

  return (
    <div 
      className="smart-command-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '15vh',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        className="smart-command-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'rgba(18, 18, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(155, 138, 240, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(155, 138, 240, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Command size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索应用、计算、命令..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 500,
          }}>
            {getModeLabel()}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <X size={18} />
          </button>
        </div>

        <div 
          ref={resultsRef}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {searchResults.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}>
              <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div>没有找到结果</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                尝试输入应用名称或数学表达式
              </div>
            </div>
          ) : (
            searchResults.map((result, index) => (
              <div
                key={result.id}
                data-index={index}
                onClick={result.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: index === selectedIndex 
                    ? 'rgba(155, 138, 240, 0.18)' 
                    : 'transparent',
                  marginBottom: '2px',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: result.type === 'calc' 
                    ? 'rgba(16, 185, 129, 0.15)'
                    : result.type === 'web'
                    ? 'rgba(64, 169, 255, 0.15)'
                    : result.type === 'command'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : result.type === 'convert'
                    ? 'rgba(236, 72, 153, 0.15)'
                    : result.type === 'time'
                    ? 'rgba(139, 92, 246, 0.15)'
                    : result.type === 'color'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : result.type === 'encode'
                    ? 'rgba(251, 146, 60, 0.15)'
                    : result.type === 'uuid'
                    ? 'rgba(20, 184, 166, 0.15)'
                    : result.type === 'password'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : result.type === 'hash'
                    ? 'rgba(168, 85, 247, 0.15)'
                    : result.type === 'emoji'
                    ? 'rgba(251, 191, 36, 0.15)'
                    : result.type === 'system'
                    ? 'rgba(107, 114, 128, 0.15)'
                    : 'rgba(155, 138, 240, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: result.type === 'calc'
                    ? '#10b981'
                    : result.type === 'web'
                    ? '#40a9ff'
                    : result.type === 'command'
                    ? '#f59e0b'
                    : result.type === 'convert'
                    ? '#ec4899'
                    : result.type === 'time'
                    ? '#8b5cf6'
                    : result.type === 'color'
                    ? '#ef4444'
                    : result.type === 'encode'
                    ? '#fb923c'
                    : result.type === 'uuid'
                    ? '#14b8a6'
                    : result.type === 'password'
                    ? '#22c55e'
                    : result.type === 'hash'
                    ? '#a855f7'
                    : result.type === 'emoji'
                    ? '#fbbf24'
                    : result.type === 'system'
                    ? '#6b7280'
                    : '#9b8af0',
                  flexShrink: 0,
                }}>
                  {result.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '2px',
                  }}>
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {result.subtitle}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <ArrowRight size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>↑↓</kbd> 导航</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Enter</kbd> 执行</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Tab</kbd> 补全</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Ctrl+↑</kbd> 历史</span>
            <span><kbd style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}>Esc</kbd> 关闭</span>
          </div>
          <span style={{ opacity: 0.7 }}>
            {searchResults.length} 个结果
          </span>
        </div>
      </div>
    </div>
  )
})

export default SmartCommandCenter
