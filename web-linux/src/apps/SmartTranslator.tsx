import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowRightLeft, Copy, Check, Volume2, Star, Trash2, Loader2, RotateCcw, Globe } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranslationResult {
  translatedText: string
  match: number
}

interface HistoryEntry {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  timestamp: number
}

// ─── Language Config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'auto', name: '自动检测', flag: '🔍' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
]

const QUICK_PAIRS: Array<[string, string, string]> = [
  ['en', 'zh', 'EN→ZH'],
  ['zh', 'en', 'ZH→EN'],
  ['en', 'ja', 'EN→JA'],
  ['en', 'ko', 'EN→KO'],
  ['en', 'fr', 'EN→FR'],
  ['en', 'de', 'EN→DE'],
]

const HISTORY_KEY = 'smart-translator-history'

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmartTranslator() {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('zh')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const saveHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const translate = useCallback(async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText('')
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const langPair = from === 'auto' ? `auto|${to}` : `${from}|${to}`
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`

      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`API error: ${resp.status}`)

      const data = await resp.json()
      if (data.responseStatus === 200 && data.responseData) {
        const result = data.responseData.translatedText
        setTranslatedText(result)

        // Save to history
        saveHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: text.slice(0, 200),
          target: result.slice(0, 200),
          sourceLang: from,
          targetLang: to,
          timestamp: Date.now(),
        })
      } else {
        throw new Error(data.responseDetails || 'Translation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed')
      setTranslatedText('')
    } finally {
      setIsTranslating(false)
    }
  }, [saveHistory])

  // Debounced translation
  const debouncedTranslate = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      translate(text, sourceLang, targetLang)
    }, 600)
  }, [sourceLang, targetLang, translate])

  useEffect(() => {
    debouncedTranslate(sourceText)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [sourceText, debouncedTranslate])

  const handleSwapLanguages = useCallback(() => {
    if (sourceLang === 'auto') return
    const newSource = targetLang
    const newTarget = sourceLang
    setSourceLang(newSource)
    setTargetLang(newTarget)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }, [sourceLang, targetLang, sourceText, translatedText])

  const handleCopy = useCallback(async () => {
    if (!translatedText) return
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }, [translatedText])

  const handleSpeak = useCallback((text: string, lang: string) => {
    if (!text || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'auto' ? '' : lang
    window.speechSynthesis.speak(utterance)
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }, [])

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code
  const getLangFlag = (code: string) => LANGUAGES.find(l => l.code === code)?.flag || '🌐'

  // ── Styles ──
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1b26',
    color: '#a9b1d6',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 13,
    overflow: 'hidden',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#c0caf5',
    fontSize: 15,
    lineHeight: 1.7,
    resize: 'none',
    fontFamily: 'inherit',
    padding: 0,
  }

  const selectStyle: React.CSSProperties = {
    background: '#24283b',
    border: '1px solid #3b4261',
    borderRadius: 8,
    color: '#c0caf5',
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <div style={containerStyle}>
      <style>{`
        .st-select:focus { border-color: #7aa2f7 !important; box-shadow: 0 0 0 2px rgba(122,162,247,0.2); }
        .st-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .st-history-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid #292e42',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} style={{ color: '#7aa2f7' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>SmartTranslator</span>
          <span style={{ fontSize: 11, color: '#565f89' }}>Real-time Translation</span>
        </div>
        <button
          className="st-btn"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '4px 10px',
            background: showHistory ? '#7aa2f7' : '#24283b',
            border: '1px solid #3b4261',
            borderRadius: 6,
            color: showHistory ? '#1a1b26' : '#a9b1d6',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          History ({history.length})
        </button>
      </div>

      {/* Quick Language Pairs */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 16px',
        borderBottom: '1px solid #292e42',
        overflowX: 'auto',
      }}>
        {QUICK_PAIRS.map(([from, to, label]) => (
          <button
            key={label}
            className="st-btn"
            onClick={() => { setSourceLang(from); setTargetLang(to) }}
            style={{
              padding: '3px 10px',
              background: sourceLang === from && targetLang === to ? '#7aa2f722' : '#24283b',
              border: `1px solid ${sourceLang === from && targetLang === to ? '#7aa2f7' : '#3b4261'}`,
              borderRadius: 14,
              color: sourceLang === from && targetLang === to ? '#7aa2f7' : '#a9b1d6',
              cursor: 'pointer',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Language Selectors */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: 8,
      }}>
        <select
          className="st-select"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          style={{ ...selectStyle, flex: 1 }}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>

        <button
          className="st-btn"
          onClick={handleSwapLanguages}
          disabled={sourceLang === 'auto'}
          style={{
            padding: 6,
            background: '#24283b',
            border: '1px solid #3b4261',
            borderRadius: 8,
            color: sourceLang === 'auto' ? '#3b4261' : '#7aa2f7',
            cursor: sourceLang === 'auto' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowRightLeft size={14} />
        </button>

        <select
          className="st-select"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          style={{ ...selectStyle, flex: 1 }}
        >
          {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </div>

      {/* Translation Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showHistory ? (
          /* History Panel */
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#565f89' }}>翻译历史 (最近 50 条)</span>
              {history.length > 0 && (
                <button
                  className="st-btn"
                  onClick={handleClearHistory}
                  style={{
                    padding: '2px 8px',
                    background: 'transparent',
                    border: '1px solid #f7768e44',
                    borderRadius: 4,
                    color: '#f7768e',
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Trash2 size={10} /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#565f89', padding: 40, fontSize: 12 }}>
                暂无翻译历史
              </div>
            ) : (
              history.map(entry => (
                <div
                  key={entry.id}
                  className="st-history-item"
                  onClick={() => {
                    setSourceText(entry.source)
                    setSourceLang(entry.sourceLang)
                    setTargetLang(entry.targetLang)
                    setShowHistory(false)
                  }}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #292e42',
                    cursor: 'pointer',
                    borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: '#565f89' }}>
                    <span>{getLangFlag(entry.sourceLang)} → {getLangFlag(entry.targetLang)}</span>
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#c0caf5', marginBottom: 2 }}>{entry.source}</div>
                  <div style={{ fontSize: 12, color: '#9ece6a' }}>{entry.target}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Source */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #292e42',
              padding: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#565f89' }}>
                  {getLangFlag(sourceLang)} {getLangName(sourceLang)}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="st-btn"
                    onClick={() => handleSpeak(sourceText, sourceLang)}
                    style={{
                      padding: 3,
                      background: 'transparent',
                      border: 'none',
                      color: '#565f89',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    title="朗读"
                  >
                    <Volume2 size={13} />
                  </button>
                  <button
                    className="st-btn"
                    onClick={() => { setSourceText(''); setTranslatedText('') }}
                    style={{
                      padding: 3,
                      background: 'transparent',
                      border: 'none',
                      color: '#565f89',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    title="清空"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="输入要翻译的文本..."
                style={textareaStyle}
              />
              <div style={{ fontSize: 11, color: '#3b4261', marginTop: 4 }}>
                {sourceText.length} / 5000
              </div>
            </div>

            {/* Target */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#565f89' }}>
                  {getLangFlag(targetLang)} {getLangName(targetLang)}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="st-btn"
                    onClick={handleCopy}
                    style={{
                      padding: 3,
                      background: 'transparent',
                      border: 'none',
                      color: copied ? '#9ece6a' : '#565f89',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    title="复制"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    className="st-btn"
                    onClick={() => handleSpeak(translatedText, targetLang)}
                    style={{
                      padding: 3,
                      background: 'transparent',
                      border: 'none',
                      color: '#565f89',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                    title="朗读"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
              </div>
              <div style={{
                flex: 1,
                fontSize: 15,
                lineHeight: 1.7,
                color: '#c0caf5',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {isTranslating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7aa2f7' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>翻译中...</span>
                  </div>
                ) : error ? (
                  <div style={{ color: '#f7768e', fontSize: 12 }}>{error}</div>
                ) : translatedText || (
                  <span style={{ color: '#3b4261' }}>翻译结果将在此显示...</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
