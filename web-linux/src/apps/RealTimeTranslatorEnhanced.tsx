import { useState, useCallback, useEffect } from 'react'
import { useStore } from '../store'
import { Volume2, Copy, RotateCcw, History, Globe, ArrowRight } from 'lucide-react'

interface TranslationHistory {
  sourceText: string
  targetText: string
  sourceLang: string
  targetLang: string
  timestamp: Date
}

interface Language {
  code: string
  name: string
  flag: string
}

const LANGUAGES: Language[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: '英语', flag: '🇺🇸' },
  { code: 'ja', name: '日语', flag: '🇯🇵' },
  { code: 'ko', name: '韩语', flag: '🇰🇷' },
  { code: 'fr', name: '法语', flag: '🇫🇷' },
  { code: 'de', name: '德语', flag: '🇩🇪' },
  { code: 'es', name: '西班牙语', flag: '🇪🇸' },
  { code: 'ru', name: '俄语', flag: '🇷🇺' },
  { code: 'pt', name: '葡萄牙语', flag: '🇵🇹' },
  { code: 'it', name: '意大利语', flag: '🇮🇹' },
  { code: 'ar', name: '阿拉伯语', flag: '🇸🇦' },
  { code: 'th', name: '泰语', flag: '🇹🇭' },
  { code: 'vi', name: '越南语', flag: '🇻🇳' },
  { code: 'id', name: '印尼语', flag: '🇮🇩' },
  { code: 'ms', name: '马来语', flag: '🇲🇾' },
]

const STORAGE_KEY = 'weblinux-translation-history'

export default function RealTimeTranslatorEnhanced() {
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [sourceLang, setSourceLang] = useState('zh')
  const [targetLang, setTargetLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(true)

  const addNotification = useStore((s) => s.addNotification)

  // 从 localStorage 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setHistory(parsed.map((item: TranslationHistory) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      }
    } catch {
      // 忽略错误
    }
  }, [])

  // 保存历史记录到 localStorage
  const saveHistory = useCallback((newHistory: TranslationHistory[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 50)))
    } catch {
      // 忽略错误
    }
  }, [])

  // 使用 MyMemory 翻译 API（免费，无需密钥）
  const translateText = useCallback(async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTargetText('')
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      // 使用 MyMemory 翻译 API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.responseStatus === 200 && data.responseData) {
        const translated = data.responseData.translatedText
        setTargetText(translated)

        // 保存到历史记录
        const newEntry: TranslationHistory = {
          sourceText: text,
          targetText: translated,
          sourceLang: from,
          targetLang: to,
          timestamp: new Date()
        }
        const newHistory = [newEntry, ...history.filter(h =>
          h.sourceText !== text || h.targetLang !== to
        )].slice(0, 50)
        setHistory(newHistory)
        saveHistory(newHistory)
      } else {
        throw new Error(data.responseDetails || '翻译失败')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '翻译服务暂时不可用'
      setError(errorMsg)
      addNotification({
        title: '翻译失败',
        message: errorMsg,
        type: 'error'
      })
    } finally {
      setIsTranslating(false)
    }
  }, [history, saveHistory, addNotification])

  // 自动翻译（延迟执行）
  useEffect(() => {
    if (!autoTranslate || !sourceText.trim()) return

    const timer = setTimeout(() => {
      translateText(sourceText, sourceLang, targetLang)
    }, 800)

    return () => clearTimeout(timer)
  }, [sourceText, sourceLang, targetLang, autoTranslate, translateText])

  // 手动翻译
  const handleManualTranslate = useCallback(() => {
    translateText(sourceText, sourceLang, targetLang)
  }, [sourceText, sourceLang, targetLang, translateText])

  // 交换语言
  const swapLanguages = useCallback(() => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(targetText)
    setTargetText(sourceText)
  }, [targetLang, sourceLang, targetText, sourceText])

  // 清空
  const handleClear = useCallback(() => {
    setSourceText('')
    setTargetText('')
    setError(null)
  }, [])

  // 复制翻译结果
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        title: '复制成功',
        message: '已复制到剪贴板',
        type: 'success',
        duration: 2000
      })
    } catch {
      addNotification({
        title: '复制失败',
        message: '无法复制到剪贴板',
        type: 'error'
      })
    }
  }, [addNotification])

  // 从历史记录选择
  const handleSelectHistory = useCallback((item: TranslationHistory) => {
    setSourceText(item.sourceText)
    setTargetText(item.targetText)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setShowHistory(false)
  }, [])

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
    addNotification({
      title: '历史记录',
      message: '历史记录已清空',
      type: 'info',
      duration: 2000
    })
  }, [saveHistory, addNotification])

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e8e8f4',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={24} style={{ color: '#8b5cf6' }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '18px' }}>实时翻译</div>
            <div style={{ fontSize: '12px', color: '#a0a0c8' }}>
              支持 15+ 语言 · 免费API
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            style={{
              padding: '8px 12px',
              background: autoTranslate ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${autoTranslate ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: autoTranslate ? '#22c55e' : '#a0a0c8',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            {autoTranslate ? '✓ 自动' : '手动'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 12px',
              background: showHistory ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showHistory ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: showHistory ? '#8b5cf6' : '#a0a0c8',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            <History size={14} style={{ marginRight: '4px' }} />
            历史
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(139, 92, 246, 0.05)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6' }}>
              翻译历史 ({history.length})
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                清空
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#a0a0c8',
              fontSize: '13px',
              padding: '20px'
            }}>
              暂无翻译历史
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectHistory(item)}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#a0a0c8',
                    marginBottom: '4px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span>{LANGUAGES.find(l => l.code === item.sourceLang)?.flag}</span>
                    <ArrowRight size={10} />
                    <span>{LANGUAGES.find(l => l.code === item.targetLang)?.flag}</span>
                    <span style={{ marginLeft: '8px', fontSize: '10px' }}>
                      {item.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e8e8f4' }}>
                    {item.sourceText.slice(0, 50)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Language Selection */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px',
            color: '#e8e8f4',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>

        <button
          onClick={swapLanguages}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RotateCcw size={16} />
        </button>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '10px',
            color: '#e8e8f4',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Translation Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        padding: '16px 20px',
        overflow: 'auto'
      }}>
        {/* Source */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#a0a0c8',
            fontWeight: '600'
          }}>
            {LANGUAGES.find(l => l.code === sourceLang)?.flag} 源语言
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="输入要翻译的文本..."
            style={{
              flex: 1,
              minHeight: '150px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#e8e8f4',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.6',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClear}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#a0a0c8',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              清空
            </button>
            <button
              onClick={() => handleCopy(sourceText)}
              disabled={!sourceText}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: sourceText ? '#a0a0c8' : '#666',
                cursor: sourceText ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Copy size={12} />
              复制
            </button>
          </div>
        </div>

        {/* Target */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#a0a0c8',
            fontWeight: '600'
          }}>
            {LANGUAGES.find(l => l.code === targetLang)?.flag} 目标语言
          </div>
          <div style={{
            flex: 1,
            minHeight: '150px',
            padding: '12px',
            background: 'rgba(34, 197, 94, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            color: '#e8e8f4',
            fontSize: '14px',
            lineHeight: '1.6',
            overflow: 'auto',
            position: 'relative'
          }}>
            {isTranslating ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#8b5cf6'
              }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>⚙️</span>
                正在翻译...
              </div>
            ) : error ? (
              <div style={{ color: '#ef4444' }}>
                ⚠️ {error}
              </div>
            ) : targetText ? (
              targetText
            ) : (
              <div style={{ color: '#a0a0c8', fontStyle: 'italic' }}>
                等待翻译结果...
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleCopy(targetText)}
              disabled={!targetText}
              style={{
                padding: '6px 12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                color: targetText ? '#22c55e' : '#666',
                cursor: targetText ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Copy size={12} />
              复制
            </button>
            {targetText && (
              <button
                onClick={() => {
                  // 使用Web Speech API朗读（如果浏览器支持）
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(targetText)
                    utterance.lang = targetLang
                    speechSynthesis.speak(utterance)
                  } else {
                    addNotification({
                      title: '提示',
                      message: '您的浏览器不支持语音朗读',
                      type: 'warning'
                    })
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  color: '#22c55e',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Volume2 size={12} />
                朗读
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Translate Button */}
      {!autoTranslate && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button
            onClick={handleManualTranslate}
            disabled={!sourceText.trim() || isTranslating}
            style={{
              width: '100%',
              padding: '12px',
              background: sourceText.trim() && !isTranslating
                ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
                : 'rgba(139, 92, 246, 0.2)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: sourceText.trim() && !isTranslating ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: sourceText.trim() && !isTranslating ? 1 : 0.5
            }}
          >
            {isTranslating ? '翻译中...' : '立即翻译'}
          </button>
        </div>
      )}

      {/* API Info */}
      <div style={{
        padding: '8px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11px',
        color: '#a0a0c8',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        使用 MyMemory 翻译 API · 免费 · 无需密钥 · 最多1000字符/次
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