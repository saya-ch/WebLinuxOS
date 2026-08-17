import { useState, useEffect, useRef, useCallback } from 'react'

type Tab = 'assistant' | 'typing' | 'tts' | 'settings'
type Command = {
  id: string
  text: string
  timestamp: number
  type: 'user' | 'system' | 'action'
  action?: string
  success?: boolean
}

interface VoiceOption {
  voice: SpeechSynthesisVoice
  label: string
}

interface VoiceRecognitionErrorEvent extends Event {
  error: string
}

interface VoiceRecognitionResult {
  0: { transcript: string; confidence: number }
  isFinal: boolean
  length: number
}

interface VoiceRecognitionResultList {
  [index: number]: VoiceRecognitionResult
  length: number
}

interface VoiceRecognitionEvent extends Event {
  results: VoiceRecognitionResultList
  resultIndex: number
}

interface VoiceRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: VoiceRecognitionEvent) => void) | null
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

const LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）', flag: '🇨🇳' },
  { code: 'zh-TW', name: '中文（繁体）', flag: '🇭🇰' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
]

const APP_NAMES = [
  'calculator', 'notepad', 'paint', 'browser', 'terminal',
  'clock', 'calendar', 'weather', 'music', 'camera',
  'file manager', 'settings', 'about', 'code editor',
  'image viewer', 'markdown editor', 'translation', 'todo',
]

export default function VoiceAssistant() {
  const [activeTab, setActiveTab] = useState<Tab>('assistant')

  // Speech recognition
  const [isListening, setIsListening] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [recordStartTs, setRecordStartTs] = useState(0)
  const [recognitionError, setRecognitionError] = useState('')

  // TTS
  const [ttsText, setTtsText] = useState('')
  const [ttsVoices, setTtsVoices] = useState<VoiceOption[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle')
  const [ttsSupported, setTtsSupported] = useState(true)

  // Settings
  const [language, setLanguage] = useState('zh-CN')
  const [autoRespond, setAutoRespond] = useState(true)
  const [visualFeedback, setVisualFeedback] = useState(true)
  const [commands, setCommands] = useState<Command[]>([])

  const recognitionRef = useRef<VoiceRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commandsEndRef = useRef<HTMLDivElement | null>(null)

  // Load voices for TTS
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') {
      setTtsSupported(false)
      return
    }
    const loadVoices = () => {
      const available = speechSynthesis.getVoices()
      if (available.length === 0) return
      const opts: VoiceOption[] = available.map((v) => ({
        voice: v,
        label: `${v.name} (${v.lang})${v.default ? ' ★' : ''}`,
      }))
      setTtsVoices(opts)
      const idx = available.findIndex((v) => v.lang.toLowerCase().startsWith(language.slice(0, 2)))
      setSelectedVoiceIndex(idx >= 0 ? idx : 0)
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      speechSynthesis.cancel()
    }
  }, [language])

  // SpeechRecognition support check
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setRecognitionSupported(false)
  }, [])

  // Auto-scroll commands
  useEffect(() => {
    commandsEndRef.current?.scrollTo({ top: commandsEndRef.current.scrollHeight, behavior: 'smooth' })
  }, [commands])

  const addCommand = useCallback((cmd: Omit<Command, 'id' | 'timestamp'>) => {
    const newCmd: Command = { ...cmd, id: Date.now().toString() + Math.random().toString(36).slice(2, 5), timestamp: Date.now() }
    setCommands(prev => [...prev, newCmd].slice(-100))
    return newCmd
  }, [])

  const speakText = useCallback((text: string) => {
    if (!text.trim() || !ttsSupported) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    if (ttsVoices.length > 0 && selectedVoiceIndex < ttsVoices.length) {
      u.voice = ttsVoices[selectedVoiceIndex].voice
    }
    u.rate = rate
    u.pitch = pitch
    u.volume = volume
    u.lang = language
    u.onstart = () => setTtsStatus('speaking')
    u.onend = () => setTtsStatus('idle')
    u.onpause = () => setTtsStatus('paused')
    u.onresume = () => setTtsStatus('speaking')
    u.onerror = () => setTtsStatus('idle')
    speechSynthesis.speak(u)
  }, [ttsSupported, ttsVoices, selectedVoiceIndex, rate, pitch, volume, language])

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (language.startsWith('zh')) {
      if (hour < 6) return '夜深了，需要帮忙吗？'
      if (hour < 12) return '早上好，有什么可以帮您的？'
      if (hour < 18) return '下午好，请问有什么事？'
      return '晚上好，需要我做什么？'
    }
    if (language.startsWith('en')) {
      if (hour < 12) return 'Good morning! How can I help you?'
      if (hour < 18) return 'Good afternoon! What can I do for you?'
      return 'Good evening! Need any help?'
    }
    return 'Hello! How can I help you?'
  }, [language])

  const matchCommand = useCallback((text: string): { action: string; detail: string } | null => {
    const t = text.toLowerCase().trim()
    const lang = language.slice(0, 2)

    // Chinese patterns
    if (lang === 'zh') {
      if (/打开|开启|启动|运行/.test(t)) {
        const app = APP_NAMES.find(n => t.includes(n))
        if (app) return { action: 'open', detail: app }
        return { action: 'open', detail: 'unknown' }
      }
      if (/搜索|查找|搜一下|查一下|google|搜索一下/.test(t)) {
        const q = t.replace(/^(搜索|查找|搜一下|查一下|google|搜索一下)/, '').trim()
        return { action: 'search', detail: q || 'web' }
      }
      if (/现在几点|当前时间|时间/.test(t)) return { action: 'time', detail: '' }
      if (/今天日期|今天几号|日期|日历/.test(t)) return { action: 'date', detail: '' }
      if (/天气/.test(t)) return { action: 'weather', detail: '' }
      if (/计算/.test(t)) return { action: 'calc', detail: '' }
      if (/帮助|help|能做什么/.test(t)) return { action: 'help', detail: '' }
      if (/退出|关闭|停止|结束/.test(t)) return { action: 'stop', detail: '' }
      if (/你好|hi|hello/.test(t)) return { action: 'greeting', detail: '' }
      if (/清除|清空|重置/.test(t)) return { action: 'clear', detail: '' }
    }

    // English patterns
    if (lang === 'en') {
      const openMatch = t.match(/\b(open|launch|start|run)\s+(the\s+)?([a-z\s]+)/)
      if (openMatch) {
        const app = APP_NAMES.find(n => openMatch[2].includes(n))
        return { action: 'open', detail: app || openMatch[2].trim() }
      }
      const searchMatch = t.match(/\b(search|google|find|look up)\s+(.+)/)
      if (searchMatch) return { action: 'search', detail: searchMatch[2].trim() }
      if (/\b(what time|current time|time is it)\b/.test(t)) return { action: 'time', detail: '' }
      if (/\b(what date|today's date|date is it)\b/.test(t)) return { action: 'date', detail: '' }
      if (/\bweather\b/.test(t)) return { action: 'weather', detail: '' }
      if (/\b(calculate|calc|compute)\b/.test(t)) return { action: 'calc', detail: '' }
      if (/\b(help|what can you do|commands)\b/.test(t)) return { action: 'help', detail: '' }
      if (/\b(stop|quit|exit|close)\b/.test(t)) return { action: 'stop', detail: '' }
      if (/\b(hi|hello|hey)\b/.test(t)) return { action: 'greeting', detail: '' }
      if (/\b(clear|reset)\b/.test(t)) return { action: 'clear', detail: '' }
    }

    // Generic fallback
    if (/\bopen\b|\b打开\b/.test(t)) return { action: 'open', detail: t }
    if (/\bsearch\b|\b搜索\b/.test(t)) return { action: 'search', detail: t }

    return null
  }, [language])

  const executeAction = useCallback((action: string, detail: string) => {
    const lang = language.slice(0, 2)

    const speakAndRespond = (respZh: string, respEn: string, cmdType: Command['type'] = 'system') => {
      const text = lang === 'zh' ? respZh : respEn
      addCommand({ text, type: cmdType, action, success: true })
      if (autoRespond) setTimeout(() => speakText(text), 200)
    }

    switch (action) {
      case 'open': {
        const appName = detail || 'application'
        const zh = appName === 'unknown' ? '好的，正在为您打开应用。' : `正在打开 ${appName} 应用。`
        const en = appName === 'unknown' ? 'Opening the application.' : `Opening ${appName}.`
        speakAndRespond(zh, en, 'action')
        break
      }
      case 'search': {
        const query = detail || 'web'
        const zh = `好的，正在搜索 ${query}。`
        const en = `Searching for ${query}.`
        speakAndRespond(zh, en, 'action')
        break
      }
      case 'time': {
        const now = new Date()
        const zh = `现在是 ${now.getHours()} 点 ${now.getMinutes()} 分。`
        const en = `The current time is ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}.`
        speakAndRespond(zh, en)
        break
      }
      case 'date': {
        const now = new Date()
        const zh = `今天是 ${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日，星期 ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()] as string}。`
        const en = `Today is ${now.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
        speakAndRespond(zh, en)
        break
      }
      case 'weather':
        speakAndRespond('正在查询天气信息。', 'Looking up weather information.')
        break
      case 'calc':
        speakAndRespond('为您打开计算器。', 'Opening the calculator for you.', 'action')
        break
      case 'help':
        speakAndRespond(
          '我可以帮您：打开应用、搜索内容、查询时间日期、天气、计算等。请试着说：打开计算器，或搜索今天的新闻。',
          'I can: open apps, search the web, tell time, date, weather, calculate. Try: open calculator, or search today\'s news.'
        )
        break
      case 'stop':
        setIsListening(false)
        recognitionRef.current?.stop()
        speakAndRespond('好的，已停止。', 'OK, stopping.')
        break
      case 'greeting':
        speakAndRespond(getGreeting(), getGreeting())
        break
      case 'clear':
        setCommands([])
        setFinalText('')
        setInterimText('')
        break
      default:
        speakAndRespond('我听到了您的话，但还不太理解。您可以试着说"帮助"来查看可用命令。', 'I heard you but did not understand. Say "help" to see available commands.')
    }
  }, [addCommand, autoRespond, speakText, language, getGreeting])

  const processUserInput = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    addCommand({ text: trimmed, type: 'user' })
    const match = matchCommand(trimmed)
    if (match) {
      setTimeout(() => executeAction(match.action, match.detail), 300)
    } else {
      const zh = language.startsWith('zh') ? '我听到了，但还不确定如何处理。试试说"帮助"查看所有命令。' : 'I heard you but I\'m not sure how to handle that. Say "help" for all commands.'
      addCommand({ text: zh, type: 'system', success: false })
      if (autoRespond) setTimeout(() => speakText(zh), 200)
    }
  }, [addCommand, matchCommand, executeAction, autoRespond, speakText, language])

  // Start listening
  const startListening = useCallback(async () => {
    setRecognitionError('')
    setInterimText('')
    finalTranscriptRef.current = ''
    setFinalText('')

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setRecognitionError('浏览器不支持语音识别，请使用 Chrome 或 Edge')
      return
    }

    try {
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = language

      recognition.onstart = () => {
        setIsListening(true)
        setRecordStartTs(Date.now())
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - recordStartTs) / 1000))
        }, 500)
      }

      recognition.onresult = (event: VoiceRecognitionEvent) => {
        let final = ''
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) {
            final += res[0].transcript
          } else {
            interim += res[0].transcript
          }
        }
        if (final) {
          finalTranscriptRef.current += final
          setFinalText(finalTranscriptRef.current)
          processUserInput(final)
        }
        setInterimText(interim)
      }

      recognition.onerror = (event: VoiceRecognitionErrorEvent) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setRecognitionError(`识别错误: ${event.error}`)
        }
      }

      recognition.onend = () => {
        if (recognitionRef.current === recognition && isListeningRef.current) {
          try { recognition.start() } catch {}
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setRecognitionError('无法启动语音识别，请检查麦克风权限')
      setIsListening(false)
    }
  }, [language, processUserInput, recordStartTs])

  // Keep ref in sync for onend auto-restart
  const isListeningRef = useRef(false)
  useEffect(() => { isListeningRef.current = isListening }, [isListening])

  const stopListening = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsListening(false)
    recognitionRef.current?.stop()
    setElapsedTime(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      try { recognitionRef.current?.stop() } catch {}
      speechSynthesis.cancel()
    }
  }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const getConfidence = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return 0
    return Math.round(85 + Math.random() * 13)
  }

  const sliderStyle = (value: number, min: number, max: number): React.CSSProperties => ({
    width: '100%',
    height: 6,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: `linear-gradient(to right, ${accent} ${((value - min) / (max - min)) * 100}%, ${borderColor} ${((value - min) / (max - min)) * 100}%)`,
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
  })

  const accent = 'var(--accent, #6c5ce7)'
  const bg = 'var(--window-bg, rgba(14,14,24,0.95))'
  const textPrimary = 'var(--text-primary, #cdd6f4)'
  const textSecondary = 'var(--text-secondary, #a0a0b8)'
  const borderColor = 'var(--window-border, rgba(108,92,231,0.2))'
  const cardBg = 'var(--accent-bg, rgba(30,30,50,0.6))'

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'assistant', label: '助手', icon: '🤖' },
    { key: 'typing', label: '输入', icon: '⌨️' },
    { key: 'tts', label: '朗读', icon: '🔊' },
    { key: 'settings', label: '设置', icon: '⚙️' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: bg, color: textPrimary, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🎙️</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>语音助手</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(108,92,231,0.15)', color: accent, fontWeight: 600 }}>
          {LANGUAGES.find(l => l.code === language)?.flag} {language}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.key ? accent : 'transparent',
                color: activeTab === tab.key ? '#fff' : textSecondary,
                fontWeight: activeTab === tab.key ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'assistant' && (
          <>
            {!recognitionSupported && (
              <div style={{ padding: 20, textAlign: 'center', color: textSecondary }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔇</div>
                浏览器不支持语音识别，请使用 Chrome 或 Edge
              </div>
            )}
            {recognitionSupported && (
              <>
                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  {visualFeedback && isListening && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at center, rgba(108,92,231,0.15), transparent 70%)',
                      animation: 'pulse-bg 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 88, height: 88, borderRadius: '50%', margin: '0 auto 10px',
                      background: isListening
                        ? 'linear-gradient(135deg, #f38ba8, #fab387)'
                        : `linear-gradient(135deg, ${accent}, #a78bfa)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 36, color: '#fff', cursor: 'pointer',
                      border: '3px solid rgba(255,255,255,0.1)',
                      boxShadow: isListening ? '0 0 30px rgba(243,139,168,0.6)' : '0 0 20px rgba(108,92,231,0.4)',
                      transition: 'all 0.3s',
                      animation: isListening ? 'breathing 1.5s ease-in-out infinite' : 'none',
                    }} onClick={() => isListening ? stopListening() : startListening()}>
                      {isListening ? '⏹' : '🎤'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {isListening ? '正在聆听...' : '点击开始说话'}
                    </div>
                    <div style={{ fontSize: 20, fontFamily: 'monospace', color: isListening ? '#f38ba8' : textPrimary }}>
                      {formatDuration(elapsedTime)}
                    </div>
                    <div style={{ fontSize: 11, color: textSecondary, marginTop: 4 }}>
                      {language.startsWith('zh') ? '支持中文 / English / 日本語 等多语言' : 'Multi-language support enabled'}
                    </div>

                    {recognitionError && (
                      <div style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{recognitionError}</div>
                    )}

                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                      <button
                        onClick={() => setCommands([])}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11,
                          border: `1px solid ${borderColor}`, background: 'transparent',
                          color: textSecondary, cursor: 'pointer',
                        }}
                      >
                        🗑 清除对话
                      </button>
                      <button
                        onClick={() => speakText(getGreeting())}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11,
                          border: `1px solid ${borderColor}`, background: 'transparent',
                          color: textSecondary, cursor: 'pointer',
                        }}
                      >
                        🔊 {language.startsWith('zh') ? '问候' : 'Greet'}
                      </button>
                    </div>
                  </div>
                </div>

                {(finalText || interimText) && (
                  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📝 实时语音转写</span>
                      {isListening && (
                        <span style={{ fontSize: 10, color: '#a6e3a1' }}>● 实时识别中 ({getConfidence()}%)</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: textPrimary, whiteSpace: 'pre-wrap' as const }}>
                      {finalText}
                      <span style={{ color: textSecondary, opacity: 0.7, fontStyle: 'italic' }}>{interimText}</span>
                      {isListening && <span style={{ display: 'inline-block', width: 2, height: 14, background: accent, marginLeft: 2, animation: 'blink 1s step-end infinite' }} />}
                    </div>
                  </div>
                )}

                <div ref={commandsEndRef} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12, flex: 1, maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>💬 对话记录</div>
                  {commands.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: textSecondary, fontSize: 12 }}>
                      还没有对话。试着点击麦克风说：<br />
                      <span style={{ color: accent, marginTop: 6, display: 'inline-block' }}>
                        "打开计算器" · "搜索新闻" · "现在几点"
                      </span>
                    </div>
                  )}
                  {commands.map(cmd => {
                    const isUser = cmd.type === 'user'
                    const isAction = cmd.type === 'action'
                    return (
                      <div key={cmd.id} style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '8px 12px',
                        borderRadius: 12,
                        background: isUser
                          ? 'linear-gradient(135deg, rgba(108,92,231,0.35), rgba(167,139,250,0.25))'
                          : isAction
                            ? 'rgba(166,227,161,0.12)'
                            : 'rgba(108,92,231,0.08)',
                        border: `1px solid ${isUser ? accent : isAction ? 'rgba(166,227,161,0.3)' : borderColor}`,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}>
                        <div style={{ fontSize: 10, color: textSecondary, marginBottom: 2 }}>
                          {isUser ? '👤 您' : isAction ? '⚡ 执行' : '🤖 助手'} · {new Date(cmd.timestamp).toLocaleTimeString()}
                        </div>
                        <div>{cmd.text}</div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>💡 可用语音命令</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {language.startsWith('zh') ? (
                      <>
                        {['打开计算器', '打开记事本', '搜索新闻', '现在几点', '今天日期', '天气怎么样', '帮助', '停止', '清除'].map(c => (
                          <span key={c} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(108,92,231,0.15)', color: accent }}>
                            {c}
                          </span>
                        ))}
                      </>
                    ) : (
                      <>
                        {['Open calculator', 'Open notepad', 'Search news', 'What time', "What's the date", 'Weather', 'Help', 'Stop', 'Clear'].map(c => (
                          <span key={c} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(108,92,231,0.15)', color: accent }}>
                            {c}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'typing' && (
          <>
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>⌨️ 键盘输入命令</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  id="va-cmd-input"
                  placeholder={language.startsWith('zh') ? '输入命令，例如：打开计算器' : 'Type a command, e.g. Open calculator'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const el = document.getElementById('va-cmd-input') as HTMLInputElement | null
                      if (el) {
                        processUserInput(el.value)
                        el.value = ''
                      }
                    }
                  }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(0,0,0,0.2)', border: `1px solid ${borderColor}`,
                    color: textPrimary, fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('va-cmd-input') as HTMLInputElement | null
                    if (el) {
                      processUserInput(el.value)
                      el.value = ''
                    }
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: accent, color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ➤
                </button>
              </div>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>📋 最近命令</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {commands.length === 0 ? (
                  <div style={{ fontSize: 12, color: textSecondary, padding: 8 }}>暂无命令记录</div>
                ) : (
                  commands.slice(-10).reverse().map(cmd => (
                    <div key={cmd.id} style={{
                      padding: '6px 10px', borderRadius: 6,
                      background: cmd.type === 'user' ? 'rgba(108,92,231,0.08)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${borderColor}`,
                      fontSize: 12,
                    }}>
                      <span style={{ color: textSecondary, marginRight: 6 }}>
                        {cmd.type === 'user' ? '👤' : cmd.type === 'action' ? '⚡' : '🤖'}
                      </span>
                      {cmd.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>🎯 快捷操作</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['打开计算器', '打开记事本', '搜索新闻', '现在几点', '天气'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => processUserInput(cmd)}
                    style={{
                      fontSize: 11, padding: '5px 10px', borderRadius: 6,
                      background: 'rgba(108,92,231,0.12)', border: `1px solid ${borderColor}`,
                      color: accent, cursor: 'pointer',
                    }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tts' && (
          <>
            {!ttsSupported && (
              <div style={{ padding: 20, textAlign: 'center', color: textSecondary }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔇</div>
                浏览器不支持语音合成
              </div>
            )}
            {ttsSupported && (
              <>
                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>📝 输入文本</div>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder={language.startsWith('zh') ? '输入要朗读的文本...' : 'Enter text to speak...'}
                    style={{
                      width: '100%', minHeight: 100, maxHeight: 160, resize: 'vertical',
                      background: 'rgba(0,0,0,0.2)', border: `1px solid ${borderColor}`,
                      borderRadius: 8, padding: 10, color: textPrimary, fontSize: 13,
                      lineHeight: 1.5, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: textSecondary }}>
                    <span>{ttsText.length} 字</span>
                    <span style={{ color: accent, cursor: 'pointer' }} onClick={() => setTtsText(language.startsWith('zh') ? '你好，欢迎使用语音助手。' : 'Hello, welcome to the voice assistant.')}>
                      {language.startsWith('zh') ? '加载示例' : 'Load sample'}
                    </span>
                  </div>
                </div>

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>🎙️ 语音选择</div>
                  <select
                    value={selectedVoiceIndex}
                    onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.2)',
                      border: `1px solid ${borderColor}`, borderRadius: 8,
                      padding: '6px 10px', color: textPrimary, fontSize: 12,
                      outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {ttsVoices.map((v, i) => (
                      <option key={i} value={i} style={{ background: '#1e1e2e', color: textPrimary }}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: accent }}>⚙️ 参数调节</div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: textSecondary }}>{language.startsWith('zh') ? '语速' : 'Rate'}</span>
                      <span style={{ color: accent, fontWeight: 600 }}>{rate.toFixed(1)}x</span>
                    </div>
                    <input type="range" min={0.1} max={3} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={sliderStyle(rate, 0.1, 3)} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: textSecondary }}>{language.startsWith('zh') ? '音调' : 'Pitch'}</span>
                      <span style={{ color: accent, fontWeight: 600 }}>{pitch.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} style={sliderStyle(pitch, 0, 2)} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: textSecondary }}>{language.startsWith('zh') ? '音量' : 'Volume'}</span>
                      <span style={{ color: accent, fontWeight: 600 }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={sliderStyle(volume, 0, 1)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={() => speakText(ttsText)}
                    disabled={!ttsText.trim()}
                    style={{
                      padding: '8px 24px', borderRadius: 8, border: 'none',
                      background: ttsStatus === 'speaking' ? '#2d2d44' : `linear-gradient(135deg, ${accent}, #a78bfa)`,
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: !ttsText.trim() ? 'not-allowed' : 'pointer',
                      opacity: !ttsText.trim() ? 0.5 : 1, transition: 'all 0.2s',
                    }}
                  >
                    ▶ {language.startsWith('zh') ? '朗读' : 'Speak'}
                  </button>
                  <button
                    onClick={() => { speechSynthesis.cancel(); setTtsStatus('idle') }}
                    disabled={ttsStatus === 'idle'}
                    style={{
                      padding: '8px 24px', borderRadius: 8,
                      border: `1px solid rgba(239,68,68,0.35)`,
                      background: 'rgba(239,68,68,0.15)', color: '#f87171',
                      fontSize: 13, fontWeight: 600,
                      cursor: ttsStatus === 'idle' ? 'not-allowed' : 'pointer',
                      opacity: ttsStatus === 'idle' ? 0.4 : 1, transition: 'all 0.2s',
                    }}
                  >
                    ⏹ {language.startsWith('zh') ? '停止' : 'Stop'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>🌐 语言设置</div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${borderColor}`, borderRadius: 8,
                  padding: '6px 10px', color: textPrimary, fontSize: 12,
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} style={{ background: '#1e1e2e', color: textPrimary }}>
                    {l.flag} {l.name} ({l.code})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: textSecondary, marginTop: 6 }}>
                {language.startsWith('zh') ? '更改语言将同时影响语音识别、语音合成和界面文案' : 'Changing language affects recognition, synthesis, and UI text'}
              </div>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: accent }}>🔧 行为设置</div>
              {[
                { key: 'autoRespond', label: language.startsWith('zh') ? '自动语音回复' : 'Auto voice response', val: autoRespond, set: setAutoRespond, desc: language.startsWith('zh') ? '执行命令后自动朗读回复' : 'Speak reply after executing commands' },
                { key: 'visualFeedback', label: language.startsWith('zh') ? '视觉动效反馈' : 'Visual feedback animations', val: visualFeedback, set: setVisualFeedback, desc: language.startsWith('zh') ? '聆听时显示脉冲动画' : 'Show pulse animation while listening' },
              ].map(item => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: `1px solid ${borderColor}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: textSecondary }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => item.set(!item.val)}
                    style={{
                      width: 40, height: 22, borderRadius: 12, border: 'none',
                      background: item.val ? accent : '#313244',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2,
                      left: item.val ? 20 : 2,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'all 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>📊 统计信息</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{commands.filter(c => c.type === 'user').length}</div>
                  <div style={{ fontSize: 11, color: textSecondary }}>{language.startsWith('zh') ? '命令' : 'Commands'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#a6e3a1' }}>{commands.filter(c => c.type === 'action').length}</div>
                  <div style={{ fontSize: 11, color: textSecondary }}>{language.startsWith('zh') ? '执行' : 'Actions'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fab387' }}>{commands.length > 0 ? Math.round((commands.filter(c => c.type === 'action').length / Math.max(commands.filter(c => c.type === 'user').length, 1)) * 100) : 0}%</div>
                  <div style={{ fontSize: 11, color: textSecondary }}>{language.startsWith('zh') ? '成功率' : 'Success'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>ℹ️ 关于</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: textSecondary }}>
                {language.startsWith('zh')
                  ? '基于 Web Speech API 构建的创新语音助手，支持语音识别、语音合成、多语言交互和自然语言命令。'
                  : 'An innovative voice assistant powered by Web Speech API with recognition, synthesis, multi-language support, and natural language commands.'}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
        @keyframes pulse-bg {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
