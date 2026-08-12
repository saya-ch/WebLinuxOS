import { useState, useCallback, useEffect, useRef } from 'react'
import {
  LanguagesIcon, CopyIcon, CheckIcon, Volume2Icon,
  StarIcon, SparklesIcon, GlobeIcon, BookmarkIcon
} from '../icons'
import { History as HistoryIcon } from 'lucide-react'

const LANGUAGES = [
  { code: 'auto', name: '自动检测' },
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁体）' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesia' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'sv', name: 'Svenska' },
]

// Simple heuristic language auto-detection for scripts that MyMemory can't detect
function autoDetectLanguage(text: string): string {
  if (!text) return 'en'
  // CJK (Chinese/Japanese/Korean)
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) {
    // Check for hiragana/katakana -> Japanese
    if (/[\u3040-\u30ff]/.test(text)) return 'ja'
    return 'zh-CN'
  }
  // Hangul -> Korean
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  // Cyrillic -> Russian
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'
  // Arabic
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'
  // Devanagari -> Hindi
  if (/[\u0900-\u097f]/.test(text)) return 'hi'
  // Thai
  if (/[\u0e00-\u0e7f]/.test(text)) return 'th'
  return 'en'
}

interface HistoryItem {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  timestamp: number
}

interface FavoriteItem {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  createdAt: number
}

const STORAGE_KEYS = {
  HISTORY: 'weblinux-translator-history',
  FAVORITES: 'weblinux-translator-favorites',
  SETTINGS: 'weblinux-translator-settings',
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

const MAX_TEXT_LENGTH = 5000
const MAX_HISTORY = 50
const MAX_FAVORITES = 100

const QuickTranslate = () => {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('zh-CN')
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadFromStorage(STORAGE_KEYS.HISTORY, []))
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => loadFromStorage(STORAGE_KEYS.FAVORITES, []))
  const [showHistory, setShowHistory] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 保存历史记录
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORY, history)
  }, [history])

  // 保存收藏
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FAVORITES, favorites)
  }, [favorites])

  // 翻译缓存键
  const getCacheKey = useCallback((text: string, from: string, to: string) => {
    return `${text}_${from}_${to}`
  }, [])

  // 执行翻译
  const translate = useCallback(async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText('')
      return
    }

    // 自动检测源语言（MyMemory 不支持 auto，使用本地启发式检测）
    let fromLang = from
    if (from === 'auto') {
      fromLang = autoDetectLanguage(text)
      // 同步更新 sourceLang 状态，让 UI 显示实际检测到的语言
      setSourceLang(fromLang)
    }

    const cacheKey = getCacheKey(text, fromLang, to)
    
    if (translationCache[cacheKey]) {
      setTranslatedText(translationCache[cacheKey])
      return
    }

    setIsTranslating(true)
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${to}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.responseData?.translatedText) {
        const translated = data.responseData.translatedText
        setTranslatedText(translated)
        setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }))
        
        // 添加到历史记录
        setHistory(prev => {
          const item: HistoryItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            source: text,
            target: translated,
            sourceLang: fromLang,
            targetLang: to,
            timestamp: Date.now(),
          }
          return [item, ...prev.filter(h => h.source !== text)].slice(0, MAX_HISTORY)
        })
      } else if (data.errorCode || data.message) {
        setTranslatedText(`翻译服务暂时不可用 (${data.errorCode || 'ERR'})，请稍后重试`)
      } else {
        setTranslatedText('翻译失败，请重试')
      }
    } catch (err) {
      console.error('Translation error:', err)
      setTranslatedText('网络错误，请检查连接后重试')
    } finally {
      setIsTranslating(false)
    }
  }, [translationCache, getCacheKey])

  // 自动翻译（带防抖）
  useEffect(() => {
    if (!autoTranslate) return
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (sourceText.trim() && sourceText.length > 1) {
      debounceRef.current = setTimeout(() => {
        translate(sourceText, sourceLang, targetLang)
      }, 500)
    } else {
      setTranslatedText('')
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [sourceText, sourceLang, targetLang, autoTranslate, translate])

  // 手动翻译
  const handleTranslate = useCallback(() => {
    translate(sourceText, sourceLang, targetLang)
  }, [sourceText, sourceLang, targetLang, translate])

  // 复制翻译结果
  const copyToClipboard = useCallback(async () => {
    if (translatedText) {
      try {
        await navigator.clipboard.writeText(translatedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = translatedText
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }, [translatedText])

  // 交换语言
  const swapLanguages = useCallback(() => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang === 'auto' ? 'en' : sourceLang)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }, [sourceLang, targetLang, sourceText, translatedText])

  // 添加到收藏
  const addToFavorites = useCallback(() => {
    if (!sourceText || !translatedText) return
    
    setFavorites(prev => {
      const exists = prev.some(f => f.source === sourceText && f.target === translatedText)
      if (exists) return prev
      
      const item: FavoriteItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: sourceText,
        target: translatedText,
        sourceLang,
        targetLang,
        createdAt: Date.now(),
      }
      return [item, ...prev].slice(0, MAX_FAVORITES)
    })
  }, [sourceText, translatedText, sourceLang, targetLang])

  // 从历史记录恢复
  const restoreFromHistory = useCallback((item: HistoryItem) => {
    setSourceText(item.source)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setTranslatedText(item.target)
  }, [])

  // 从收藏恢复
  const restoreFromFavorite = useCallback((item: FavoriteItem) => {
    setSourceText(item.source)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setTranslatedText(item.target)
  }, [])

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // 清空收藏
  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  // 朗读文本
  const speakText = useCallback((text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // 清空输入
  const clearAll = useCallback(() => {
    setSourceText('')
    setTranslatedText('')
  }, [])

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid var(--window-border)',
      background: 'var(--taskbar-bg)',
      backdropFilter: 'blur(10px)',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '16px',
      fontWeight: 600,
    },
    headerActions: {
      display: 'flex',
      gap: '8px',
    },
    actionBtn: {
      padding: '8px 14px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s',
    },
    mainContent: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
    },
    translator: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      padding: '16px',
      gap: '12px',
      overflow: 'auto',
    },
    languageRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    langSelect: {
      flex: 1,
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      cursor: 'pointer',
      outline: 'none',
    },
    swapBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'var(--accent-bg)',
      color: 'var(--accent)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    textAreas: {
      display: 'flex',
      gap: '12px',
      flex: 1,
      minHeight: '200px',
    },
    textArea: {
      flex: 1,
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      resize: 'none',
      outline: 'none',
      fontFamily: 'inherit',
      lineHeight: 1.6,
    },
    textAreaWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    textAreaHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '11px',
      color: 'var(--text-secondary)',
    },
    textAreaActions: {
      display: 'flex',
      gap: '6px',
    },
    miniBtn: {
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      border: '1px solid var(--window-border)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    translateBtn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
    },
    loadingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: 'var(--text-secondary)',
      fontSize: '12px',
    },
    sidePanel: {
      width: '280px',
      borderLeft: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    sidePanelHeader: {
      padding: '16px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px',
      fontWeight: 600,
    },
    historyList: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px',
    },
    historyItem: {
      padding: '10px 12px',
      borderRadius: '8px',
      marginBottom: '6px',
      cursor: 'pointer',
      transition: 'background 0.15s',
      fontSize: '12px',
    },
    historySource: {
      color: 'var(--text-primary)',
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    historyTarget: {
      color: 'var(--text-secondary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: '1px solid var(--window-border)',
    },
    tab: {
      flex: 1,
      padding: '10px',
      background: 'transparent',
      border: 'none',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s',
    },
    activeTab: {
      color: 'var(--accent)',
      borderBottom: '2px solid var(--accent)',
    },
    settings: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: 'var(--text-secondary)',
    },
    switchToggle: {
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      border: 'none',
      background: autoTranslate ? 'var(--accent)' : 'var(--window-border)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
    },
    switchKnob: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: '#fff',
      position: 'absolute',
      top: '2px',
      left: autoTranslate ? '18px' : '2px',
      transition: 'left 0.2s',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <LanguagesIcon size={20} style={{ color: 'var(--accent)' }} />
          <span>实时翻译</span>
        </div>
        <div style={styles.headerActions}>
          <label style={styles.settings}>
            <span>自动翻译</span>
            <button
              style={styles.switchToggle}
              onClick={() => setAutoTranslate(!autoTranslate)}
            >
              <div style={styles.switchKnob} />
            </button>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={styles.mainContent}>
          <div style={styles.translator}>
            <div style={styles.languageRow}>
              <select
                style={styles.langSelect}
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
              <button
                style={styles.swapBtn}
                onClick={swapLanguages}
                title="交换语言"
              >
                <GlobeIcon size={16} />
              </button>
              <select
                style={styles.langSelect}
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.textAreas}>
              <div style={styles.textAreaWrapper}>
                <div style={styles.textAreaHeader}>
                  <span>原文</span>
                  <span>{sourceText.length}/{MAX_TEXT_LENGTH}</span>
                </div>
                <textarea
                  style={styles.textArea}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                  placeholder="输入要翻译的文本..."
                />
                <div style={styles.textAreaActions}>
                  <button style={styles.miniBtn} onClick={() => speakText(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)} title="朗读">
                    <Volume2Icon size={14} />
                  </button>
                  <button style={styles.miniBtn} onClick={clearAll} title="清空">
                    <SparklesIcon size={14} />
                  </button>
                </div>
              </div>

              <div style={{ ...styles.textAreaWrapper, borderLeft: '1px solid var(--window-border)', paddingLeft: '12px' }}>
                <div style={styles.textAreaHeader}>
                  <span>翻译</span>
                  <button style={{ ...styles.miniBtn, width: 'auto', padding: '0 8px' }} onClick={copyToClipboard} title="复制">
                    {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span style={{ marginLeft: '4px', fontSize: '11px' }}>{copied ? '已复制' : '复制'}</span>
                  </button>
                </div>
                <textarea
                  style={{ ...styles.textArea, cursor: 'default' }}
                  value={isTranslating ? '翻译中...' : translatedText}
                  readOnly
                  placeholder="翻译结果将显示在这里..."
                />
                <div style={styles.textAreaActions}>
                  <button style={styles.miniBtn} onClick={() => speakText(translatedText, targetLang)} title="朗读">
                    <Volume2Icon size={14} />
                  </button>
                  <button style={styles.miniBtn} onClick={addToFavorites} title="收藏">
                    <StarIcon size={14} />
                  </button>
                </div>
              </div>
            </div>

            <button
              style={{
                ...styles.translateBtn,
                opacity: isTranslating ? 0.7 : 1,
                cursor: isTranslating ? 'progress' : 'pointer',
              }}
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />翻译中...</>
              ) : (
                <><LanguagesIcon size={16} />翻译</>
              )}
            </button>
          </div>
        </div>

        <div style={styles.sidePanel}>
          <div style={styles.tabsContainer}>
            <button
              style={{
                ...styles.tab,
                ...(showHistory ? styles.activeTab : {}),
              }}
              onClick={() => {
                setShowHistory(true)
                setShowFavorites(false)
              }}
            >
              <HistoryIcon size={14} />
              历史
            </button>
            <button
              style={{
                ...styles.tab,
                ...(showFavorites ? styles.activeTab : {}),
              }}
              onClick={() => {
                setShowHistory(false)
                setShowFavorites(true)
              }}
            >
              <BookmarkIcon size={14} />
              收藏
            </button>
          </div>

          {showHistory && (
            <>
              <div style={styles.sidePanelHeader}>
                <span>历史记录 ({history.length})</span>
                {history.length > 0 && (
                  <button
                    style={{ ...styles.miniBtn, width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                    onClick={clearHistory}
                  >
                    清空
                  </button>
                )}
              </div>
              <div style={styles.historyList}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: '12px' }}>
                    暂无历史记录
                  </div>
                ) : (
                  history.map(item => (
                    <div
                      key={item.id}
                      style={{
                        ...styles.historyItem,
                        background: 'rgba(255,255,255,0.03)',
                      }}
                      onClick={() => restoreFromHistory(item)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    >
                      <div style={styles.historySource}>{item.source}</div>
                      <div style={styles.historyTarget}>{item.target}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {showFavorites && (
            <>
              <div style={styles.sidePanelHeader}>
                <span>收藏 ({favorites.length})</span>
                {favorites.length > 0 && (
                  <button
                    style={{ ...styles.miniBtn, width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                    onClick={clearFavorites}
                  >
                    清空
                  </button>
                )}
              </div>
              <div style={styles.historyList}>
                {favorites.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px', fontSize: '12px' }}>
                    暂无收藏
                  </div>
                ) : (
                  favorites.map(item => (
                    <div
                      key={item.id}
                      style={{
                        ...styles.historyItem,
                        background: 'rgba(139, 92, 246, 0.1)',
                      }}
                      onClick={() => restoreFromFavorite(item)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)')}
                    >
                      <div style={styles.historySource}>{item.source}</div>
                      <div style={styles.historyTarget}>{item.target}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickTranslate
