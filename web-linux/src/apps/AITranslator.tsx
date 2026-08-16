import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

type LangCode = 'auto' | 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'it' | 'pt' | 'ar' | 'th' | 'vi'

interface LangDef {
  code: LangCode
  label: string
  native: string
  speechCode: string
  flag: string
}

const LANGUAGES: LangDef[] = [
  { code: 'auto', label: '自动检测', native: 'Auto', speechCode: '', flag: '🌐' },
  { code: 'zh', label: '中文', native: '中文', speechCode: 'zh-CN', flag: '🇨🇳' },
  { code: 'en', label: '英语', native: 'English', speechCode: 'en-US', flag: '🇺🇸' },
  { code: 'ja', label: '日语', native: '日本語', speechCode: 'ja-JP', flag: '🇯🇵' },
  { code: 'ko', label: '韩语', native: '한국어', speechCode: 'ko-KR', flag: '🇰🇷' },
  { code: 'fr', label: '法语', native: 'Français', speechCode: 'fr-FR', flag: '🇫🇷' },
  { code: 'de', label: '德语', native: 'Deutsch', speechCode: 'de-DE', flag: '🇩🇪' },
  { code: 'es', label: '西班牙语', native: 'Español', speechCode: 'es-ES', flag: '🇪🇸' },
  { code: 'ru', label: '俄语', native: 'Русский', speechCode: 'ru-RU', flag: '🇷🇺' },
  { code: 'it', label: '意大利语', native: 'Italiano', speechCode: 'it-IT', flag: '🇮🇹' },
  { code: 'pt', label: '葡萄牙语', native: 'Português', speechCode: 'pt-PT', flag: '🇵🇹' },
  { code: 'ar', label: '阿拉伯语', native: 'العربية', speechCode: 'ar-SA', flag: '🇸🇦' },
  { code: 'th', label: '泰语', native: 'ไทย', speechCode: 'th-TH', flag: '🇹🇭' },
  { code: 'vi', label: '越南语', native: 'Tiếng Việt', speechCode: 'vi-VN', flag: '🇻🇳' },
]

const PRESET_PHRASES: Record<string, { from: LangCode; to: LangCode; text: string; label: string }[]> = {
  greetings: [
    { from: 'zh', to: 'en', text: '你好', label: '你好' },
    { from: 'zh', to: 'en', text: '早上好', label: '早上好' },
    { from: 'zh', to: 'en', text: '晚安', label: '晚安' },
    { from: 'en', to: 'zh', text: 'Hello', label: 'Hello' },
    { from: 'en', to: 'zh', text: 'Good morning', label: 'Good morning' },
    { from: 'en', to: 'ja', text: 'Hello', label: 'Hello→日' },
    { from: 'ja', to: 'zh', text: 'こんにちは', label: 'こんにちは' },
    { from: 'fr', to: 'en', text: 'Bonjour', label: 'Bonjour' },
  ],
  travel: [
    { from: 'zh', to: 'en', text: '请问洗手间在哪里？', label: '洗手间在哪' },
    { from: 'zh', to: 'en', text: '我需要一张地图', label: '我要地图' },
    { from: 'en', to: 'zh', text: 'How much does this cost?', label: '多少钱' },
    { from: 'en', to: 'zh', text: 'I would like to order this', label: '我要点这个' },
    { from: 'zh', to: 'ja', text: '我不懂日语', label: '不懂日语' },
    { from: 'en', to: 'ko', text: 'Thank you very much', label: '谢谢(韩)' },
  ],
  business: [
    { from: 'zh', to: 'en', text: '很高兴见到你', label: '很高兴见到你' },
    { from: 'zh', to: 'en', text: '我们来谈谈合作吧', label: '谈合作' },
    { from: 'en', to: 'zh', text: 'Let us discuss the details', label: '讨论细节' },
    { from: 'en', to: 'zh', text: 'I look forward to our cooperation', label: '期待合作' },
  ],
  daily: [
    { from: 'zh', to: 'en', text: '今天天气怎么样？', label: '天气' },
    { from: 'zh', to: 'en', text: '我喜欢喝咖啡', label: '爱喝咖啡' },
    { from: 'en', to: 'zh', text: 'What time is it?', label: '几点了' },
    { from: 'en', to: 'zh', text: 'I am a student', label: '我是学生' },
    { from: 'zh', to: 'fr', text: '我爱你', label: '我爱你(法)' },
  ],
}

interface HistoryItem {
  id: string
  source: string
  result: string
  from: LangCode
  to: LangCode
  fromLabel: string
  toLabel: string
  timestamp: number
}

interface FavoriteItem {
  id: string
  source: string
  result: string
  from: LangCode
  to: LangCode
  timestamp: number
}

const MAX_HISTORY = 50
const HISTORY_KEY = 'ai-translator-history'
const FAVORITES_KEY = 'ai-translator-favorites'

function getLangLabel(code: LangCode): string {
  return LANGUAGES.find(l => l.code === code)?.label || code
}

function getLangDef(code: LangCode): LangDef {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0]
}

export default function AITranslator() {
  const { resolvedTheme } = useStore()
  const isDark = resolvedTheme === 'dark'

  const [srcLang, setSrcLang] = useState<LangCode>('auto')
  const [tgtLang, setTgtLang] = useState<LangCode>('en')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history')
  const [showPresets, setShowPresets] = useState(false)
  const [presetCategory, setPresetCategory] = useState<keyof typeof PRESET_PHRASES>('greetings')
  const [detectedLang, setDetectedLang] = useState<LangCode | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const outputRef = useRef<HTMLDivElement>(null)
  const speakTimerRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
      const favs = localStorage.getItem(FAVORITES_KEY)
      if (favs) setFavorites(JSON.parse(favs))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
    } catch {}
  }, [history])

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  const translate = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)
    setError(null)
    setOutput('')

    const fromLabel = srcLang === 'auto' ? '自动检测' : getLangLabel(srcLang)
    const toLabel = getLangLabel(tgtLang)

    const systemPrompt = `You are a professional translator. Translate the user's text from ${fromLabel} to ${toLabel}. Only output the translated text, no explanations, no quotes, no additional comments. Ensure natural, fluent translation that sounds native in the target language.`

    const fullPrompt = `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${text}\n<|im_end|>\n<|im_start|>assistant\n`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
      const seed = Math.floor(Math.random() * 1000000)
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${seed}&temperature=0.3`

      const response = await fetch(url, {
        headers: { Accept: 'text/plain' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const resultText = (await response.text()).trim()

      if (resultText) {
        setOutput(resultText)
        addToHistory(text, resultText, fromLabel, toLabel)
        return
      }
      throw new Error('空响应')
    } catch (err) {
      clearTimeout(timeoutId)
      if ((err as Error).name === 'AbortError') {
        setError('翻译请求超时，正在尝试备用方案...')
      }
      // 尝试备用翻译
      try {
        const resultText = await fallbackTranslate(text, srcLang, tgtLang, controller.signal)
        if (resultText) {
          setOutput(resultText)
          setError(null)
          addToHistory(text, resultText, fromLabel, toLabel)
        } else {
          setError('翻译失败：无法连接到翻译服务，请稍后重试')
        }
      } catch (fallbackErr) {
        if ((fallbackErr as Error).name !== 'AbortError') {
          setError(`翻译失败：${fallbackErr instanceof Error ? fallbackErr.message : '网络错误'}`)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, srcLang, tgtLang, detectedLang])

  const addToHistory = (source: string, result: string, fromLabel: string, toLabel: string) => {
    if (srcLang === 'auto') {
      const detected = detectLanguage(source)
      setDetectedLang(detected)
    }

    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      source,
      result,
      from: srcLang === 'auto' ? (detectedLang || 'auto') : srcLang,
      to: tgtLang,
      fromLabel,
      toLabel,
      timestamp: Date.now(),
    }
    setHistory(prev => {
      const filtered = prev.filter(
        p => !(p.source === item.source && p.to === item.to)
      )
      return [item, ...filtered].slice(0, MAX_HISTORY)
    })
  }

  const fallbackTranslate = async (text: string, from: LangCode, to: LangCode, signal: AbortSignal): Promise<string | null> => {
    try {
      const langPair = `${from === 'auto' ? 'auto' : from}-${to}`
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`

      const response = await fetch(url, { signal })
      if (!response.ok) return null

      const data = await response.json()
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText
      }
      return null
    } catch {
      return null
    }
  }

  const detectLanguage = (text: string): LangCode => {
    if (!text) return 'en'
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'
    if (/[\u3040-\u30ff\u3400-\u4dbf]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th'
    const hasCyrillic = /[\u0400-\u04ff]/.test(text)
    if (hasCyrillic) return 'ru'
    const hasAccents = /[àâäéèêëîïôöùûüÿçæœÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇÆŒ]/.test(text)
    if (hasAccents) {
      const frMarkers = /\b(le|la|les|bonjour|merci|oui|non|est|dans|pour|avec|mais|tout|cette)\b/i
      const deMarkers = /\b(der|die|und|ich|nicht|ein|eine|nicht|auch|wird|haben|aus|wird)\b/i
      const esMarkers = /\b(el|la|los|las|hola|gracias|sí|no|es|con|para|pero|todo|esta)\b/i
      const itMarkers = /\b(il|lo|gli|le|ciao|grazie|sì|no|è|con|per|anche|non|tutto)\b/i
      const ptMarkers = /\b(o|os|as|um|obrigado|obrigada|sim|não|é|com|para|mas|tudo|este)\b/i
      if (frMarkers.test(text)) return 'fr'
      if (deMarkers.test(text)) return 'de'
      if (esMarkers.test(text)) return 'es'
      if (itMarkers.test(text)) return 'it'
      if (ptMarkers.test(text)) return 'pt'
      return 'fr'
    }
    return 'en'
  }

  const swapLanguages = () => {
    if (srcLang === 'auto') return
    const newSrc = tgtLang
    const newTgt = srcLang
    setSrcLang(newSrc)
    setTgtLang(newTgt)
    if (output) {
      setInput(output)
      setOutput('')
    }
  }

  const copyResult = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = output
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
      document.body.removeChild(ta)
    }
  }

  const speakText = (text: string, langCode: string) => {
    if (!text) return
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setError('当前浏览器不支持语音合成')
        return
      }
      if (speaking) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
        return
      }
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = langCode || 'en-US'
      utter.rate = 0.95
      utter.pitch = 1
      const voices = window.speechSynthesis.getVoices()
      const matchVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
      if (matchVoice) utter.voice = matchVoice
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
      setSpeaking(true)
    } catch (err) {
      setError('语音朗读失败')
      setSpeaking(false)
    }
  }

  const speakSource = () => {
    const code = srcLang === 'auto' ? (detectedLang || 'en') : srcLang
    speakText(input, getLangDef(code).speechCode)
  }

  const speakOutput = () => {
    speakText(output, getLangDef(tgtLang).speechCode)
  }

  const toggleFavorite = () => {
    if (!output) return
    const existing = favorites.find(
      f => f.source === input.trim() && f.result === output
    )
    if (existing) {
      setFavorites(prev => prev.filter(f => f.id !== existing.id))
    } else {
      const item: FavoriteItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        source: input.trim(),
        result: output,
        from: srcLang === 'auto' ? (detectedLang || 'auto') : srcLang,
        to: tgtLang,
        timestamp: Date.now(),
      }
      setFavorites(prev => [item, ...prev])
    }
  }

  const isFavorited = output
    ? favorites.some(f => f.source === input.trim() && f.result === output)
    : false

  const applyHistoryItem = (item: HistoryItem) => {
    setInput(item.source)
    setOutput(item.result)
    setSrcLang(item.from === 'auto' ? 'auto' : item.from)
    setTgtLang(item.to)
  }

  const applyFavorite = (item: FavoriteItem) => {
    setInput(item.source)
    setOutput(item.result)
    setSrcLang(item.from === 'auto' ? 'auto' : item.from)
    setTgtLang(item.to)
  }

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const deleteFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  const clearHistory = () => setHistory([])
  const clearFavorites = () => setFavorites([])

  const insertPreset = (text: string, from: LangCode, to: LangCode) => {
    setInput(text)
    if (from !== 'auto') setSrcLang(from)
    setTgtLang(to)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      translate()
    }
  }

  useEffect(() => {
    return () => {
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getMonth() + 1)}/${pad(d.getDay())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const historyGroupedByDate = (() => {
    const groups: Record<string, HistoryItem[]> = {}
    for (const item of history) {
      const d = new Date(item.timestamp)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  })()

  const styles = createStyles(isDark)

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* 标题栏 */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>🌍</div>
            <div>
              <div style={styles.title}>AI 翻译官</div>
              <div style={styles.subtitle}>
                <span style={styles.badge}>Pollinations AI</span>
                <span style={styles.subtitleText}> · 免费多语言互译</span>
              </div>
            </div>
          </div>
          <button
            style={styles.presetBtn}
            onClick={() => setShowPresets(v => !v)}
            className="preset-toggle"
          >
            ✨ 常用短语
          </button>
        </div>

        {/* 语言选择器 */}
        <div style={styles.langBar}>
          <div style={styles.langSelector}>
            <span style={styles.langFlag}>{getLangDef(srcLang).flag}</span>
            <select
              value={srcLang}
              onChange={e => { setSrcLang(e.target.value as LangCode); setOutput('') }}
              style={styles.langSelect}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            disabled={srcLang === 'auto'}
            style={{
              ...styles.swapBtn,
              opacity: srcLang === 'auto' ? 0.4 : 1,
              cursor: srcLang === 'auto' ? 'not-allowed' : 'pointer',
            }}
            title="交换语言"
          >
            ⇄
          </button>

          <div style={styles.langSelector}>
            <span style={styles.langFlag}>{getLangDef(tgtLang).flag}</span>
            <select
              value={tgtLang}
              onChange={e => { setTgtLang(e.target.value as LangCode); setOutput('') }}
              style={styles.langSelect}
            >
              {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {srcLang === 'auto' && detectedLang && (
            <div style={styles.detectedBadge}>
              检测为：{getLangDef(detectedLang).flag} {getLangLabel(detectedLang)}
            </div>
          )}
        </div>

        {/* 常用短语面板 */}
        {showPresets && (
          <div style={styles.presetPanel}>
            <div style={styles.presetCategories}>
              {Object.entries(PRESET_PHRASES).map(([key]) => (
                <button
                  key={key}
                  onClick={() => setPresetCategory(key as keyof typeof PRESET_PHRASES)}
                  style={{
                    ...styles.categoryBtn,
                    ...(presetCategory === key ? styles.categoryBtnActive : {}),
                  }}
                >
                  {key === 'greetings' ? '👋 问候' : key === 'travel' ? '✈️ 旅行' : key === 'business' ? '💼 商务' : '📅 日常'}
                </button>
              ))}
            </div>
            <div style={styles.presetList}>
              {PRESET_PHRASES[presetCategory].map((p, i) => (
                <button
                  key={i}
                  onClick={() => insertPreset(p.text, p.from, p.to)}
                  style={styles.presetItem}
                  title={`${getLangLabel(p.from)} → ${getLangLabel(p.to)}`}
                >
                  <span style={styles.presetItemText}>{p.label}</span>
                  <span style={styles.presetItemArrow}>→</span>
                  <span style={styles.presetItemText}>{getLangLabel(p.to)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 翻译区 */}
        <div style={styles.translationArea}>
          {/* 源语言 */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>
                {getLangDef(srcLang).flag} {srcLang === 'auto' ? '自动检测' : getLangLabel(srcLang)}
              </span>
              <div style={styles.panelActions}>
                <span style={styles.charCount}>{input.length} 字</span>
                <button
                  style={styles.iconBtn}
                  onClick={speakSource}
                  disabled={!input}
                  title="朗读源文本"
                >
                  🔊
                </button>
                {input && (
                  <button
                    style={styles.iconBtn}
                    onClick={() => { setInput(''); setOutput(''); setDetectedLang(null) }}
                    title="清空"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入要翻译的文本... (Enter 翻译，Shift+Enter 换行)"
              style={styles.textarea}
            />
          </div>

          {/* 目标语言 */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>
                {getLangDef(tgtLang).flag} {getLangLabel(tgtLang)}
              </span>
              <div style={styles.panelActions}>
                {output && (
                  <>
                    <button
                      style={styles.iconBtn}
                      onClick={copyResult}
                      title="复制"
                    >
                      {copied ? '✓' : '📋'}
                    </button>
                    <button
                      style={styles.iconBtn}
                      onClick={speakOutput}
                      title="朗读"
                    >
                      🔊
                    </button>
                    <button
                      style={{
                        ...styles.iconBtn,
                        ...(isFavorited ? styles.iconBtnActive : {}),
                      }}
                      onClick={toggleFavorite}
                      title={isFavorited ? '取消收藏' : '收藏'}
                    >
                      {isFavorited ? '⭐' : '☆'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div
              ref={outputRef}
              style={{
                ...styles.output,
                ...(loading ? styles.outputLoading : {}),
              }}
              onClick={() => { if (!loading && !output) translate() }}
            >
              {loading ? (
                <div style={styles.loading}>
                  <div style={styles.spinner} />
                  <span>AI 翻译中...</span>
                </div>
              ) : output ? (
                <div style={styles.outputText}>{output}</div>
              ) : (
                <div style={styles.outputPlaceholder}>
                  <div style={styles.outputIcon}>🌐</div>
                  <div>翻译结果将显示在这里</div>
                  <div style={styles.outputHint}>点击或按 Enter 开始翻译</div>
                </div>
              )}
            </div>
            {error && (
              <div style={styles.errorBar}>
                ⚠️ {error}
                <button style={styles.errorClose} onClick={() => setError(null)}>✕</button>
              </div>
            )}
          </div>
        </div>

        {/* 翻译按钮 */}
        <div style={styles.actionBar}>
          <button
            onClick={translate}
            disabled={loading || !input.trim()}
            style={{
              ...styles.translateBtn,
              ...((loading || !input.trim()) ? styles.translateBtnDisabled : {}),
            }}
          >
            {loading ? (
              <>
                <div style={styles.btnSpinner} />
                <span>翻译中...</span>
              </>
            ) : (
              <>
                <span style={styles.btnIcon}>🌐</span>
                <span>开始翻译</span>
              </>
            )}
          </button>
        </div>

        {/* 历史/收藏 */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTabs}>
            <button
              style={{
                ...styles.sidebarTab,
                ...(activeTab === 'history' ? styles.sidebarTabActive : {}),
              }}
              onClick={() => setActiveTab('history')}
            >
              📜 历史 ({history.length})
            </button>
            <button
              style={{
                ...styles.sidebarTab,
                ...(activeTab === 'favorites' ? styles.sidebarTabActive : {}),
              }}
              onClick={() => setActiveTab('favorites')}
            >
              ⭐ 收藏 ({favorites.length})
            </button>
          </div>

          <div style={styles.sidebarContent}>
            {activeTab === 'history' ? (
              history.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📜</div>
                  <div>暂无翻译历史</div>
                </div>
              ) : (
                <div style={styles.listWrapper}>
                  {Object.entries(historyGroupedByDate).map(([date, items]) => (
                    <div key={date} style={styles.dateGroup}>
                      <div style={styles.dateLabel}>{date}</div>
                      {items.map(item => (
                        <div key={item.id} style={styles.listItem}>
                          <div
                            style={styles.listItemContent}
                            onClick={() => applyHistoryItem(item)}
                          >
                            <div style={styles.listItemMeta}>
                              <span>{item.fromLabel} → {item.toLabel}</span>
                              <span style={styles.listItemTime}>{formatTime(item.timestamp)}</span>
                            </div>
                            <div style={styles.listItemSource}>{item.source}</div>
                            <div style={styles.listItemResult}>{item.result}</div>
                          </div>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => deleteHistoryItem(item.id)}
                            title="删除"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button style={styles.clearBtn} onClick={clearHistory}>
                    清空历史
                  </button>
                </div>
              )
            ) : (
              favorites.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⭐</div>
                  <div>暂无收藏</div>
                  <div style={styles.emptyHint}>翻译后点击 ☆ 收藏</div>
                </div>
              ) : (
                <div style={styles.listWrapper}>
                  {favorites.map(item => (
                    <div key={item.id} style={styles.listItem}>
                      <div
                        style={styles.listItemContent}
                        onClick={() => applyFavorite(item)}
                      >
                        <div style={styles.listItemMeta}>
                          <span>{getLangLabel(item.from)} → {getLangLabel(item.to)}</span>
                          <span style={styles.listItemTime}>{formatTime(item.timestamp)}</span>
                        </div>
                        <div style={styles.listItemSource}>{item.source}</div>
                        <div style={styles.listItemResult}>{item.result}</div>
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => deleteFavorite(item.id)}
                        title="取消收藏"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button style={styles.clearBtn} onClick={clearFavorites}>
                    清空收藏
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function createStyles(isDark: boolean) {
  const bg = isDark
    ? 'linear-gradient(155deg, #0a0a1e 0%, #12122a 40%, #1a1a3a 100%)'
    : 'linear-gradient(155deg, #f0f2f8 0%, #e8ecf4 40%, #dde3f0 100%)'

  const glassBg = isDark
    ? 'rgba(255, 255, 255, 0.04)'
    : 'rgba(255, 255, 255, 0.65)'

  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.08)'

  const textPrimary = isDark ? '#f0f0ff' : '#1c1c1e'
  const textSecondary = isDark ? '#9090c0' : '#6b6b76'
  const textTertiary = isDark ? '#5a5a7a' : '#8e8e93'

  const surfaceBg = isDark ? 'rgba(18, 18, 35, 0.85)' : 'rgba(255, 255, 255, 0.75)'
  const accent = isDark ? '#9b8af0' : '#5b4cd8'
  const accentGradient = isDark
    ? 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 50%, #b8a8ff 100%)'
    : 'linear-gradient(135deg, #5b4cd8 0%, #7c6cf0 100%)'

  return {
    root: {
      height: '100%',
      width: '100%',
      background: bg,
      color: textPrimary,
      fontFamily: 'inherit',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '16px',
      gap: '14px',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 8px',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    logo: {
      width: 42,
      height: 42,
      borderRadius: '14px',
      background: accentGradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      boxShadow: isDark
        ? '0 6px 20px rgba(124, 108, 240, 0.4)'
        : '0 4px 14px rgba(91, 76, 216, 0.25)',
    },
    title: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '2px',
    },
    badge: {
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 10,
      background: isDark ? 'rgba(155, 138, 240, 0.2)' : 'rgba(91, 76, 216, 0.12)',
      color: accent,
      letterSpacing: '0.02em',
    },
    subtitleText: {
      fontSize: 11,
      color: textSecondary,
    },
    presetBtn: {
      padding: '8px 16px',
      borderRadius: 12,
      border: `1px solid ${glassBorder}`,
      background: glassBg,
      color: textPrimary,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.2s',
    },
    langBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      borderRadius: 16,
      background: glassBg,
      border: `1px solid ${glassBorder}`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    },
    langSelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      borderRadius: 12,
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${glassBorder}`,
      transition: 'all 0.2s',
    },
    langFlag: {
      fontSize: 18,
      lineHeight: 1,
    },
    langSelect: {
      background: 'transparent',
      border: 'none',
      color: textPrimary,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none' as const,
      paddingRight: '4px',
    },
    swapBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      border: `1px solid ${glassBorder}`,
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      color: textPrimary,
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flexShrink: 0,
    },
    detectedBadge: {
      marginLeft: 'auto',
      padding: '4px 10px',
      borderRadius: 8,
      background: isDark ? 'rgba(124, 108, 240, 0.18)' : 'rgba(91, 76, 216, 0.1)',
      color: accent,
      fontSize: 11,
      fontWeight: 500,
    },
    presetPanel: {
      padding: '12px 14px',
      borderRadius: 16,
      background: glassBg,
      border: `1px solid ${glassBorder}`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    },
    presetCategories: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap' as const,
    },
    categoryBtn: {
      padding: '6px 14px',
      borderRadius: 10,
      border: `1px solid ${glassBorder}`,
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      color: textSecondary,
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    categoryBtnActive: {
      background: accentGradient,
      color: '#fff',
      borderColor: 'transparent',
      fontWeight: 600,
    },
    presetList: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
    },
    presetItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: 10,
      border: `1px solid ${glassBorder}`,
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
      color: textPrimary,
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all 0.18s',
    },
    presetItemText: {
      fontWeight: 500,
    },
    presetItemArrow: {
      color: textTertiary,
      fontSize: 10,
    },
    translationArea: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px',
      flex: 1,
      minHeight: 0,
    },
    panel: {
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: 18,
      background: surfaceBg,
      border: `1px solid ${glassBorder}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      overflow: 'hidden',
      minHeight: 0,
    },
    panelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: `1px solid ${glassBorder}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)',
    },
    panelTitle: {
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    panelActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    charCount: {
      fontSize: 10,
      color: textTertiary,
      marginRight: '6px',
    },
    iconBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      border: 'none',
      background: 'transparent',
      color: textSecondary,
      fontSize: 13,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.18s',
    },
    iconBtnActive: {
      background: isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 159, 10, 0.15)',
      color: '#ff9f0a',
    },
    textarea: {
      flex: 1,
      padding: '14px 16px',
      border: 'none',
      background: 'transparent',
      color: textPrimary,
      fontSize: 14,
      lineHeight: 1.8,
      resize: 'none' as const,
      outline: 'none',
      fontFamily: 'inherit',
      letterSpacing: '0.01em',
    },
    output: {
      flex: 1,
      padding: '14px 16px',
      overflow: 'auto',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    outputLoading: {
      cursor: 'wait',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: accent,
      fontSize: 13,
      fontWeight: 500,
    },
    spinner: {
      width: 18,
      height: 18,
      border: `2px solid ${isDark ? 'rgba(155,138,240,0.25)' : 'rgba(91,76,216,0.2)'}`,
      borderTopColor: accent,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    outputText: {
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      fontSize: 14,
      lineHeight: 1.8,
      color: textPrimary,
    },
    outputPlaceholder: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 120,
      color: textTertiary,
      fontSize: 13,
      gap: '6px',
    },
    outputIcon: {
      fontSize: 32,
      opacity: 0.4,
      marginBottom: '4px',
    },
    outputHint: {
      fontSize: 11,
      color: textTertiary,
    },
    errorBar: {
      margin: '8px 14px 14px',
      padding: '8px 12px',
      borderRadius: 10,
      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.08)',
      border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)'}`,
      color: isDark ? '#fca5a5' : '#dc2626',
      fontSize: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    errorClose: {
      background: 'transparent',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: 12,
      padding: '0 4px',
    },
    actionBar: {
      display: 'flex',
      justifyContent: 'center',
      padding: '2px 0',
    },
    translateBtn: {
      padding: '14px 48px',
      borderRadius: 14,
      border: 'none',
      background: accentGradient,
      color: '#fff',
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: isDark
        ? '0 8px 28px rgba(124, 108, 240, 0.4)'
        : '0 6px 20px rgba(91, 76, 216, 0.3)',
      transition: 'all 0.2s',
      letterSpacing: '0.02em',
    },
    translateBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    btnIcon: {
      fontSize: 18,
    },
    btnSpinner: {
      width: 16,
      height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: 16,
      background: glassBg,
      border: `1px solid ${glassBorder}`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      maxHeight: 200,
      flexShrink: 0,
    },
    sidebarTabs: {
      display: 'flex',
      padding: '6px',
      gap: '4px',
      borderBottom: `1px solid ${glassBorder}`,
    },
    sidebarTab: {
      flex: 1,
      padding: '8px 12px',
      borderRadius: 10,
      border: 'none',
      background: 'transparent',
      color: textTertiary,
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    sidebarTabActive: {
      background: isDark ? 'rgba(155,138,240,0.15)' : 'rgba(91,76,216,0.1)',
      color: accent,
      fontWeight: 600,
    },
    sidebarContent: {
      flex: 1,
      overflow: 'auto',
      padding: '8px',
    },
    listWrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    dateGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    dateLabel: {
      fontSize: 10,
      color: textTertiary,
      padding: '4px 6px 2px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    listItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '6px',
      padding: '8px 10px',
      borderRadius: 10,
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
      border: `1px solid ${glassBorder}`,
      transition: 'all 0.18s',
    },
    listItemContent: {
      flex: 1,
      cursor: 'pointer',
      overflow: 'hidden',
    },
    listItemMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 10,
      color: textTertiary,
      marginBottom: '3px',
    },
    listItemTime: {
      fontSize: 10,
    },
    listItemSource: {
      fontSize: 12,
      color: textPrimary,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    listItemResult: {
      fontSize: 11,
      color: textSecondary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginTop: '2px',
    },
    deleteBtn: {
      background: 'transparent',
      border: 'none',
      color: textTertiary,
      cursor: 'pointer',
      fontSize: 11,
      padding: '4px',
      borderRadius: 6,
      transition: 'all 0.15s',
      flexShrink: 0,
      marginTop: '2px',
    },
    clearBtn: {
      padding: '6px 12px',
      borderRadius: 8,
      border: `1px solid ${glassBorder}`,
      background: 'transparent',
      color: textTertiary,
      fontSize: 11,
      cursor: 'pointer',
      marginTop: '4px',
      alignSelf: 'center',
      transition: 'all 0.18s',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: textTertiary,
      fontSize: 13,
      gap: '6px',
    },
    emptyIcon: {
      fontSize: 28,
      opacity: 0.5,
    },
    emptyHint: {
      fontSize: 11,
      color: textTertiary,
      marginTop: '2px',
    },
  }
}