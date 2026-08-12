import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  Languages,
  Volume2,
  VolumeX,
  Copy,
  Check,
  History,
  Star,
  ArrowRightLeft,
  Sparkles,
  Loader2,
  Trash2,
  Search,
  X,
  Bookmark,
} from 'lucide-react'

interface Language {
  code: string
  name: string
  nativeName: string
}

interface HistoryItem {
  id: string
  source: string
  target: string
  fromLang: string
  toLang: string
  timestamp: number
}

interface FavoritePhrase {
  id: string
  text: string
  translation: string
  fromLang: string
  toLang: string
  label: string
}

const LANGUAGES: Language[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: '自动检测' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: '英语' },
  { code: 'ja', name: 'Japanese', nativeName: '日语' },
  { code: 'ko', name: 'Korean', nativeName: '韩语' },
  { code: 'fr', name: 'French', nativeName: '法语' },
  { code: 'de', name: 'German', nativeName: '德语' },
  { code: 'es', name: 'Spanish', nativeName: '西班牙语' },
  { code: 'it', name: 'Italian', nativeName: '意大利语' },
  { code: 'pt', name: 'Portuguese', nativeName: '葡萄牙语' },
  { code: 'ru', name: 'Russian', nativeName: '俄语' },
  { code: 'ar', name: 'Arabic', nativeName: '阿拉伯语' },
  { code: 'hi', name: 'Hindi', nativeName: '印地语' },
  { code: 'th', name: 'Thai', nativeName: '泰语' },
  { code: 'vi', name: 'Vietnamese', nativeName: '越南语' },
  { code: 'id', name: 'Indonesian', nativeName: '印尼语' },
  { code: 'tr', name: 'Turkish', nativeName: '土耳其语' },
  { code: 'nl', name: 'Dutch', nativeName: '荷兰语' },
  { code: 'sv', name: 'Swedish', nativeName: '瑞典语' },
  { code: 'no', name: 'Norwegian', nativeName: '挪威语' },
  { code: 'fi', name: 'Finnish', nativeName: '芬兰语' },
  { code: 'pl', name: 'Polish', nativeName: '波兰语' },
  { code: 'cs', name: 'Czech', nativeName: '捷克语' },
  { code: 'sk', name: 'Slovak', nativeName: '斯洛伐克语' },
  { code: 'hu', name: 'Hungarian', nativeName: '匈牙利语' },
  { code: 'ro', name: 'Romanian', nativeName: '罗马尼亚语' },
  { code: 'bg', name: 'Bulgarian', nativeName: '保加利亚语' },
  { code: 'el', name: 'Greek', nativeName: '希腊语' },
  { code: 'he', name: 'Hebrew', nativeName: '希伯来语' },
  { code: 'la', name: 'Latin', nativeName: '拉丁语' },
  { code: 'uk', name: 'Ukrainian', nativeName: '乌克兰语' },
  { code: 'ca', name: 'Catalan', nativeName: '加泰罗尼亚语' },
  { code: 'da', name: 'Danish', nativeName: '丹麦语' },
  { code: 'et', name: 'Estonian', nativeName: '爱沙尼亚语' },
  { code: 'is', name: 'Icelandic', nativeName: '冰岛语' },
  { code: 'lt', name: 'Lithuanian', nativeName: '立陶宛语' },
  { code: 'lv', name: 'Latvian', nativeName: '拉脱维亚语' },
  { code: 'sl', name: 'Slovenian', nativeName: '斯洛文尼亚语' },
  { code: 'sr', name: 'Serbian', nativeName: '塞尔维亚语' },
  { code: 'hr', name: 'Croatian', nativeName: '克罗地亚语' },
  { code: 'ka', name: 'Georgian', nativeName: '格鲁吉亚语' },
  { code: 'hy', name: 'Armenian', nativeName: '亚美尼亚语' },
  { code: 'az', name: 'Azerbaijani', nativeName: '阿塞拜疆语' },
  { code: 'fa', name: 'Persian', nativeName: '波斯语' },
  { code: 'ur', name: 'Urdu', nativeName: '乌尔都语' },
  { code: 'bn', name: 'Bengali', nativeName: '孟加拉语' },
  { code: 'ta', name: 'Tamil', nativeName: '泰米尔语' },
  { code: 'te', name: 'Telugu', nativeName: '泰卢固语' },
  { code: 'mr', name: 'Marathi', nativeName: '马拉地语' },
  { code: 'gu', name: 'Gujarati', nativeName: '古吉拉特语' },
  { code: 'pa', name: 'Punjabi', nativeName: '旁遮普语' },
  { code: 'ml', name: 'Malayalam', nativeName: '马拉雅拉姆语' },
  { code: 'kn', name: 'Kannada', nativeName: '卡纳达语' },
  { code: 'sw', name: 'Swahili', nativeName: '斯瓦希里语' },
  { code: 'am', name: 'Amharic', nativeName: '阿姆哈拉语' },
  { code: 'yo', name: 'Yoruba', nativeName: '约鲁巴语' },
  { code: 'ig', name: 'Igbo', nativeName: '伊博语' },
  { code: 'zu', name: 'Zulu', nativeName: '祖鲁语' },
  { code: 'af', name: 'Afrikaans', nativeName: '南非语' },
  { code: 'tl', name: 'Tagalog', nativeName: '塔加洛语' },
  { code: 'ms', name: 'Malay', nativeName: '马来语' },
  { code: 'tl', name: 'Tagalog', nativeName: '塔加洛语' },
]

const STORAGE_KEYS = {
  history: 'quick-translate-history',
  favorites: 'quick-translate-favorites',
  recent: 'quick-translate-recent-langs',
}

const MAX_HISTORY = 50
const MAX_FAVORITES = 100

const QUICK_PHRASES: Record<string, string[]> = {
  zh: ['你好', '谢谢', '再见', '请', '对不起', '早上好', '晚安', '我爱你', '多少钱？', '在哪里？'],
  en: ['Hello', 'Thank you', 'Goodbye', 'Please', 'Sorry', 'Good morning', 'Good night', 'I love you', 'How much?', 'Where is?'],
  ja: ['こんにちは', 'ありがとう', 'さようなら', 'お願いします', 'ごめんなさい', 'おはようございます', 'おやすみなさい', '愛してる', 'いくらですか？', 'どこですか？'],
  ko: ['안녕하세요', '감사합니다', '안녕히 가세요', '부탁합니다', '미안합니다', '좋은 아침', '잘 자요', '사랑해요', '얼마예요?', '어디예요?'],
  fr: ['Bonjour', 'Merci', 'Au revoir', 'S\'il vous plaît', 'Désolé', 'Bonjour', 'Bonne nuit', 'Je t\'aime', 'Combien ?', 'Où ?'],
  de: ['Hallo', 'Danke', 'Auf Wiedersehen', 'Bitte', 'Entschuldigung', 'Guten Morgen', 'Gute Nacht', 'Ich liebe dich', 'Wie viel?', 'Wo ist?'],
  es: ['Hola', 'Gracias', 'Adiós', 'Por favor', 'Lo siento', 'Buenos días', 'Buenas noches', 'Te amo', '¿Cuánto?', '¿Dónde?'],
  ru: ['Привет', 'Спасибо', 'До свидания', 'Пожалуйста', 'Извините', 'Доброе утро', 'Спокойной ночи', 'Я люблю тебя', 'Сколько?', 'Где?'],
}

export default function QuickTranslate() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [fromLang, setFromLang] = useState('auto')
  const [toLang, setToLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [favorites, setFavorites] = useState<FavoritePhrase[]>([])
  const [activeTab, setActiveTab] = useState<'translate' | 'history' | 'favorites'>('translate')
  const [, setAutoDetect] = useState(true)
  const [sourceLangSearch, setSourceLangSearch] = useState('')
  const [targetLangSearch, setTargetLangSearch] = useState('')
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showTargetDropdown, setShowTargetDropdown] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [detectedLang, setDetectedLang] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history)
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.favorites)
      if (savedHistory) setHistory(JSON.parse(savedHistory))
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history))
    } catch {
      // ignore
    }
  }, [history])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites])

  const filteredSourceLanguages = useMemo(() => {
    const list = LANGUAGES.filter((l) => l.code !== 'auto')
    if (!sourceLangSearch) return list
    const query = sourceLangSearch.toLowerCase()
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.nativeName.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
    )
  }, [sourceLangSearch])

  const filteredTargetLanguages = useMemo(() => {
    const list = LANGUAGES
    if (!targetLangSearch) return list
    const query = targetLangSearch.toLowerCase()
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.nativeName.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
    )
  }, [targetLangSearch])

  const doTranslate = useCallback(async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText('')
      setError(null)
      setDetectedLang(null)
      return
    }

    setIsTranslating(true)
    setError(null)

    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const langPair = from === 'auto' ? `auto|${to}` : `${from}|${to}`
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
        { signal: controller.signal }
      )

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      const translated = data?.responseData?.translatedText ?? ''
      const detected = data?.matches?.[0]?.source ?? null

      setTranslatedText(translated)
      if (from === 'auto' && detected) {
        setDetectedLang(detected)
      }

      const langNames = LANGUAGES
      const fromName = from === 'auto'
        ? `auto → ${langNames.find((l) => l.code === detected)?.nativeName || detected || ''}`
        : langNames.find((l) => l.code === from)?.nativeName || from
      const toName = langNames.find((l) => l.code === to)?.nativeName || to

      const historyItem: HistoryItem = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: text,
        target: translated,
        fromLang: fromName,
        toLang: toName,
        timestamp: Date.now(),
      }

      setHistory((prev) => [historyItem, ...prev].slice(0, MAX_HISTORY))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      const errorMsg = err instanceof Error ? err.message : '翻译失败，请重试'
      setError(errorMsg)
      setTranslatedText('')
    } finally {
      setIsTranslating(false)
    }
  }, [])

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSourceChange = useCallback(
    (value: string) => {
      setSourceText(value)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        doTranslate(value, fromLang, toLang)
      }, 400)
    },
    [doTranslate, fromLang, toLang]
  )

  const handleTranslateClick = useCallback(() => {
    doTranslate(sourceText, fromLang, toLang)
  }, [doTranslate, sourceText, fromLang, toLang])

  const swapLanguages = useCallback(() => {
    if (fromLang === 'auto') return
    const prevFrom = fromLang
    const prevTo = toLang
    setFromLang(prevTo)
    setToLang(prevFrom)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }, [fromLang, toLang, sourceText, translatedText])

  const copyToClipboard = useCallback(async () => {
    if (!translatedText) return
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = translatedText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [translatedText])

  const speakText = useCallback((text: string, langCode: string) => {
    if (!text) return

    if (!('speechSynthesis' in window)) {
      showToast('您的浏览器不支持语音合成')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langCode
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    const voices = window.speechSynthesis.getVoices()
    const matchedVoice = voices.find((v) => v.lang.startsWith(langCode))
    if (matchedVoice) {
      utterance.voice = matchedVoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [showToast])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const addToFavorites = useCallback(() => {
    if (!sourceText || !translatedText) return
    const fav: FavoritePhrase = {
      id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: sourceText,
      translation: translatedText,
      fromLang,
      toLang,
      label: `${sourceText.slice(0, 20)}${sourceText.length > 20 ? '...' : ''}`,
    }
    setFavorites((prev) => [fav, ...prev].slice(0, MAX_FAVORITES))
    showToast('已添加到收藏')
  }, [sourceText, translatedText, fromLang, toLang, showToast])

  const removeFromFavorites = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id))
    showToast('已从收藏中删除')
  }, [showToast])

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const clearAllHistory = useCallback(() => {
    setHistory([])
    showToast('历史记录已清空')
  }, [showToast])

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setSourceText(item.source)
    setTranslatedText(item.target)
    setActiveTab('translate')
  }, [])

  const loadFromFavorite = useCallback((fav: FavoritePhrase) => {
    setSourceText(fav.text)
    setTranslatedText(fav.translation)
    setFromLang(fav.fromLang === 'auto' ? 'auto' : fav.fromLang)
    setToLang(fav.toLang)
    setActiveTab('translate')
  }, [])

  const loadQuickPhrase = useCallback((phrase: string) => {
    setSourceText(phrase)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      doTranslate(phrase, fromLang, toLang)
    }, 300)
  }, [doTranslate, fromLang, toLang])

  const sourceCharCount = sourceText.length
  const translatedCharCount = translatedText.length
  const sourceWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(145deg, #06061a 0%, #0d0d25 40%, #161040 100%)',
      color: '#e8e8ff',
      fontFamily: 'inherit',
      overflow: 'hidden',
    }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'rgba(10, 10, 28, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          }}>
            <Languages size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>快速翻译</div>
            <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.6)' }}>MyMemory API · 100+ 语言互译</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { key: 'translate', label: '翻译' },
            { key: 'history', label: `历史 (${history.length})` },
            { key: 'favorites', label: `收藏 (${favorites.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'translate' | 'history' | 'favorites')}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeTab === tab.key ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'rgba(200, 200, 255, 0.6)',
                border: activeTab === tab.key ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'translate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
            {/* 语言选择器 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: 14,
              background: 'rgba(20, 20, 45, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
            }}>
              {/* 源语言 */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  onClick={() => {
                    setShowSourceDropdown(!showSourceDropdown)
                    setShowTargetDropdown(false)
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    background: 'rgba(10, 10, 25, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13 }}>
                      {fromLang === 'auto' ? '🌐 自动检测' : (LANGUAGES.find((l) => l.code === fromLang)?.nativeName || fromLang)}
                    </span>
                  </div>
                </div>
                {showSourceDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 15, 35, 0.98)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 10,
                    padding: 8,
                    zIndex: 100,
                    maxHeight: 280,
                    overflow: 'auto',
                    backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      marginBottom: 6,
                      borderRadius: 6,
                      background: 'rgba(10, 10, 25, 0.6)',
                    }}>
                      <Search size={14} style={{ color: 'rgba(200, 200, 255, 0.5)' }} />
                      <input
                        value={sourceLangSearch}
                        onChange={(e) => setSourceLangSearch(e.target.value)}
                        placeholder="搜索语言..."
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          color: '#e8e8ff',
                          outline: 'none',
                          fontSize: 12,
                        }}
                      />
                    </div>
                    {filteredSourceLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setFromLang(lang.code)
                          setShowSourceDropdown(false)
                          setAutoDetect(lang.code === 'auto')
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: fromLang === lang.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = fromLang === lang.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent')}
                      >
                        <span>{lang.nativeName}</span>
                        <span style={{ color: 'rgba(200, 200, 255, 0.4)', fontSize: 10 }}>{lang.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 交换按钮 */}
              <button
                onClick={swapLanguages}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#93c5fd',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(180deg)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
                title="交换语言"
              >
                <ArrowRightLeft size={18} />
              </button>

              {/* 目标语言 */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  onClick={() => {
                    setShowTargetDropdown(!showTargetDropdown)
                    setShowSourceDropdown(false)
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    background: 'rgba(10, 10, 25, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13 }}>
                    {LANGUAGES.find((l) => l.code === toLang)?.nativeName || toLang}
                  </span>
                </div>
                {showTargetDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 15, 35, 0.98)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 10,
                    padding: 8,
                    zIndex: 100,
                    maxHeight: 280,
                    overflow: 'auto',
                    backdropFilter: 'blur(20px)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      marginBottom: 6,
                      borderRadius: 6,
                      background: 'rgba(10, 10, 25, 0.6)',
                    }}>
                      <Search size={14} style={{ color: 'rgba(200, 200, 255, 0.5)' }} />
                      <input
                        value={targetLangSearch}
                        onChange={(e) => setTargetLangSearch(e.target.value)}
                        placeholder="搜索语言..."
                        style={{
                          flex: 1,
                          border: 'none',
                          background: 'transparent',
                          color: '#e8e8ff',
                          outline: 'none',
                          fontSize: 12,
                        }}
                      />
                    </div>
                    {filteredTargetLanguages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setToLang(lang.code)
                          setShowTargetDropdown(false)
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: toLang === lang.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = toLang === lang.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent')}
                      >
                        <span>{lang.nativeName}</span>
                        <span style={{ color: 'rgba(200, 200, 255, 0.4)', fontSize: 10 }}>{lang.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 翻译面板 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
              {/* 源文本 */}
              <div style={{
                background: 'rgba(20, 20, 45, 0.5)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)' }}>
                      {fromLang === 'auto'
                        ? (detectedLang ? `检测到: ${LANGUAGES.find((l) => l.code === detectedLang)?.nativeName || detectedLang}` : '源文本')
                        : LANGUAGES.find((l) => l.code === fromLang)?.nativeName || '源文本'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {sourceText && (
                      <button
                        onClick={() => {
                          setSourceText('')
                          setTranslatedText('')
                          setError(null)
                          setDetectedLang(null)
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(200, 200, 255, 0.6)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => speakText(sourceText, fromLang === 'auto' ? (detectedLang || 'en') : fromLang)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: speaking ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: speaking ? '#93c5fd' : 'rgba(200, 200, 255, 0.6)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="朗读"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={sourceText}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  placeholder="输入要翻译的文本..."
                  style={{
                    flex: 1,
                    minHeight: 120,
                    border: 'none',
                    background: 'transparent',
                    color: '#e8e8ff',
                    fontSize: 14,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                  }}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.4)' }}>
                    {sourceCharCount} 字符 · {sourceWordCount} 词
                  </div>
                  <button
                    onClick={handleTranslateClick}
                    disabled={!sourceText.trim() || isTranslating}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: !sourceText.trim() || isTranslating
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      color: '#fff',
                      cursor: !sourceText.trim() || isTranslating ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isTranslating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {isTranslating ? '翻译中' : '翻译'}
                  </button>
                </div>
              </div>

              {/* 译文 */}
              <div style={{
                background: 'rgba(20, 20, 45, 0.5)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)' }}>
                    {LANGUAGES.find((l) => l.code === toLang)?.nativeName || '译文'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={copyToClipboard}
                      disabled={!translatedText}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: copied ? '#22c55e' : (translatedText ? 'rgba(200, 200, 255, 0.6)' : 'rgba(200, 200, 255, 0.3)'),
                        cursor: translatedText ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="复制"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => speakText(translatedText, toLang)}
                      disabled={!translatedText}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: translatedText ? 'rgba(200, 200, 255, 0.6)' : 'rgba(200, 200, 255, 0.3)',
                        cursor: translatedText ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="朗读译文"
                    >
                      <Volume2 size={14} />
                    </button>
                    <button
                      onClick={addToFavorites}
                      disabled={!translatedText}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: translatedText ? 'rgba(200, 200, 255, 0.6)' : 'rgba(200, 200, 255, 0.3)',
                        cursor: translatedText ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="收藏"
                    >
                      <Star size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
                  flex: 1,
                  minHeight: 120,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#e8e8ff',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflow: 'auto',
                }}>
                  {error ? (
                    <span style={{ color: '#ef4444', fontSize: 13 }}>
                      ⚠ {error}
                    </span>
                  ) : isTranslating && !translatedText ? (
                    <span style={{ color: 'rgba(200, 200, 255, 0.4)' }}>
                      <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                      翻译中...
                    </span>
                  ) : translatedText ? (
                    translatedText
                  ) : (
                    <span style={{ color: 'rgba(200, 200, 255, 0.3)' }}>
                      译文将在此处显示...
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}>
                  <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.4)' }}>
                    {translatedCharCount} 字符
                  </div>
                  {speaking && (
                    <button
                      onClick={stopSpeaking}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <VolumeX size={12} />
                      停止朗读
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 常用短语 */}
            {QUICK_PHRASES[toLang] && (
              <div style={{
                padding: 16,
                borderRadius: 14,
                background: 'rgba(20, 20, 45, 0.4)',
                border: '1px solid rgba(59, 130, 246, 0.1)',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.5)', marginBottom: 10 }}>
                  ✨ 常用短语 · 点击快速翻译
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(QUICK_PHRASES[toLang] || []).map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => loadQuickPhrase(phrase)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        color: 'rgba(200, 200, 255, 0.9)',
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)'
                      }}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(20, 20, 45, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(200, 200, 255, 0.7)' }}>
                <History size={16} />
                翻译历史 ({history.length})
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={13} />
                  清空
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 60,
                gap: 12,
                opacity: 0.4,
              }}>
                <History size={40} />
                <div style={{ fontSize: 14 }}>暂无翻译历史</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(20, 20, 45, 0.4)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => loadFromHistory(item)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.1)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          color: '#e8e8ff',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.source}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'rgba(200, 200, 255, 0.5)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.target}
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: 'rgba(200, 200, 255, 0.3)',
                          marginTop: 6,
                        }}>
                          {item.fromLang} → {item.toLang} · {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromHistory(item.id)
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: 'rgba(200, 200, 255, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(20, 20, 45, 0.5)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(200, 200, 255, 0.7)' }}>
                <Bookmark size={16} />
                收藏短语 ({favorites.length})
              </div>
            </div>

            {favorites.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 60,
                gap: 12,
                opacity: 0.4,
              }}>
                <Star size={40} />
                <div style={{ fontSize: 14 }}>暂无收藏的短语</div>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.5)' }}>
                  翻译后点击星形图标收藏
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: 'rgba(20, 20, 45, 0.4)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.1)')}
                  >
                    <div style={{
                      fontSize: 13,
                      color: '#e8e8ff',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {fav.text}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(200, 200, 255, 0.5)',
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {fav.translation}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(200, 200, 255, 0.3)' }}>
                        {fav.fromLang} → {fav.toLang}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => loadFromFavorite(fav)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: 'none',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="加载"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => speakText(fav.translation, fav.toLang)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'rgba(200, 200, 255, 0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="朗读"
                        >
                          <Volume2 size={13} />
                        </button>
                        <button
                          onClick={() => removeFromFavorites(fav.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'rgba(200, 200, 255, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="删除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(20, 20, 45, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#e8e8ff',
          fontSize: 13,
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}