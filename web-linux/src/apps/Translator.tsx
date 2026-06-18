import { useState } from 'react'
import { useStore } from '../store'

type LangPair = 'zh|en' | 'en|zh' | 'zh|ja' | 'ja|zh' | 'zh|ko' | 'ko|zh' | 'en|ja' | 'ja|en' | 'en|fr' | 'fr|en' | 'en|de' | 'de|en'

const langLabels: Record<LangPair, { from: string; to: string; fromCode: string; toCode: string }> = {
  'zh|en': { from: '中文', to: '英文', fromCode: 'zh-CN', toCode: 'en-US' },
  'en|zh': { from: '英文', to: '中文', fromCode: 'en-US', toCode: 'zh-CN' },
  'zh|ja': { from: '中文', to: '日文', fromCode: 'zh-CN', toCode: 'ja-JP' },
  'ja|zh': { from: '日文', to: '中文', fromCode: 'ja-JP', toCode: 'zh-CN' },
  'zh|ko': { from: '中文', to: '韩文', fromCode: 'zh-CN', toCode: 'ko-KR' },
  'ko|zh': { from: '韩文', to: '中文', fromCode: 'ko-KR', toCode: 'zh-CN' },
  'en|ja': { from: '英文', to: '日文', fromCode: 'en-US', toCode: 'ja-JP' },
  'ja|en': { from: '日文', to: '英文', fromCode: 'ja-JP', toCode: 'en-US' },
  'en|fr': { from: '英文', to: '法文', fromCode: 'en-US', toCode: 'fr-FR' },
  'fr|en': { from: '法文', to: '英文', fromCode: 'fr-FR', toCode: 'en-US' },
  'en|de': { from: '英文', to: '德文', fromCode: 'en-US', toCode: 'de-DE' },
  'de|en': { from: '德文', to: '英文', fromCode: 'de-DE', toCode: 'en-US' },
}

const langPairOptions = [
  { value: 'zh|en', label: '中文 → 英文' },
  { value: 'en|zh', label: '英文 → 中文' },
  { value: 'zh|ja', label: '中文 → 日文' },
  { value: 'ja|zh', label: '日文 → 中文' },
  { value: 'zh|ko', label: '中文 → 韩文' },
  { value: 'ko|zh', label: '韩文 → 中文' },
  { value: 'en|ja', label: '英文 → 日文' },
  { value: 'ja|en', label: '日文 → 英文' },
  { value: 'en|fr', label: '英文 → 法文' },
  { value: 'fr|en', label: '法文 → 英文' },
  { value: 'en|de', label: '英文 → 德文' },
  { value: 'de|en', label: '德文 → 英文' },
]

const commonPhrases: Record<string, string[]> = {
  'zh|en': ['你好', '谢谢', '对不起', '再见', '早上好', '晚安', '我爱你'],
  'en|zh': ['Hello', 'Thank you', 'Sorry', 'Goodbye', 'Good morning', 'Good night', 'I love you'],
  'zh|ja': ['你好', '谢谢', '对不起', '再见', '早上好', '晚安', '我爱你'],
  'ja|zh': ['こんにちは', 'ありがとう', 'ごめんなさい', 'さようなら', 'おはよう', 'おやすみ', '愛してる'],
}

interface HistoryItem {
  source: string
  result: string
  from: string
  to: string
  timestamp: number
}

const MAX_HISTORY = 10

function mockTranslate(text: string, from: string, to: string): string {
  const prefix = `[本地翻译 ${from}→${to}] `
  if (!text.trim()) return ''
  if (to === 'zh-CN') {
    return prefix + text + '（模拟中文翻译）'
  }
  return prefix + text + ' (simulated translation)'
}

export default function Translator() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [langPair, setLangPair] = useState<LangPair>('zh|en')
  const [autoDetect, setAutoDetect] = useState<boolean>(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [speaking, setSpeaking] = useState(false)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'

  const swapLangs = () => {
    const pairs: LangPair[] = ['zh|en', 'en|zh', 'zh|ja', 'ja|zh', 'zh|ko', 'ko|zh', 'en|ja', 'ja|en', 'en|fr', 'fr|en', 'en|de', 'de|en']
    const currentIdx = pairs.indexOf(langPair)
    if (currentIdx % 2 === 0 && currentIdx + 1 < pairs.length) {
      setLangPair(pairs[currentIdx + 1])
    } else if (currentIdx % 2 === 1) {
      setLangPair(pairs[currentIdx - 1])
    }
    if (result) {
      setInput(result)
      setResult('')
    }
  }

  const pushHistory = (item: HistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(
        p => !(p.source === item.source && p.from === item.from && p.to === item.to)
      )
      const next = [item, ...filtered]
      if (next.length > MAX_HISTORY) next.length = MAX_HISTORY
      return next
    })
  }

  const translateWithMyMemory = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`翻译请求失败 (HTTP ${response.status})`)
    }
    const data = await response.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return String(data.responseData.translatedText)
    }
    if (data.responseDetails) {
      throw new Error(String(data.responseDetails))
    }
    throw new Error('翻译失败，返回数据格式异常')
  }

  const translate = async () => {
    if (!input.trim()) return
    setTranslating(true)
    setError(null)
    setUsedFallback(false)
    setResult('')

    try {
      const { fromCode, toCode } = langLabels[langPair]
      const fromLang = autoDetect ? 'autodetect' : fromCode.split('-')[0]
      const toLang = toCode.split('-')[0]
      let translatedText = ''
      try {
        translatedText = await translateWithMyMemory(input.trim(), fromLang, toLang)
      } catch (apiErr) {
        setUsedFallback(true)
        translatedText = mockTranslate(input.trim(), fromCode, toCode)
        setError(`MyMemory API 调用失败，已使用本地翻译：${apiErr instanceof Error ? apiErr.message : String(apiErr)}`)
      }
      setResult(translatedText)
      pushHistory({
        source: input.trim(),
        result: translatedText,
        from: autoDetect ? '自动检测' : fromCode,
        to: toCode,
        timestamp: Date.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译失败，请重试')
      setResult('')
    } finally {
      setTranslating(false)
    }
  }

  const copyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        setCopied(false)
      }
      document.body.removeChild(ta)
    }
  }

  const speakResult = () => {
    if (!result) return
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setError('当前浏览器不支持语音朗读')
        return
      }
      if (speaking) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
        return
      }
      const utter = new SpeechSynthesisUtterance(result)
      const { toCode } = langLabels[langPair]
      utter.lang = toCode
      utter.rate = 1
      utter.pitch = 1
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
      setSpeaking(true)
    } catch (err) {
      setError('语音朗读失败：' + (err instanceof Error ? err.message : String(err)))
      setSpeaking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      translate()
    }
  }

  const insertPhrase = (phrase: string) => {
    setInput(prev => prev + phrase)
  }

  const applyHistoryItem = (item: HistoryItem) => {
    setInput(item.source)
    setResult(item.result)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const displayFromLabel = () => {
    if (autoDetect) return '自动检测'
    return langLabels[langPair].from
  }

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{displayFromLabel()}</span>
        <select
          value={langPair}
          onChange={(e) => { setLangPair(e.target.value as LangPair); setResult('') }}
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: `1px solid ${borderColor}`,
            background: inputBg,
            color: textColor,
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {langPairOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={swapLangs}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `1px solid ${borderColor}`,
            background: inputBg,
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title="交换语言"
        >
          ⇄
        </button>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].to}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>自动检测源语言</span>
        </label>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`输入${langLabels[langPair].from}文本... (Ctrl+Enter 翻译)`}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${borderColor}`,
              background: inputBg,
              color: textColor,
              fontSize: 14,
              lineHeight: 1.8,
              resize: 'none',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
            }}
          />
          <button
            onClick={translate}
            disabled={!input.trim() || translating}
            style={{
              marginTop: 8,
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              background: translating ? '#666' : accent,
              color: '#fff',
              cursor: input.trim() && !translating ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {translating ? (
              <><span>⏳</span><span>翻译中...</span></>
            ) : (
              <><span>🌐</span><span>翻译 (Ctrl+Enter)</span></>
            )}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div style={{
              marginBottom: 8,
              padding: '8px 12px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: 6,
              color: '#f66',
              fontSize: 12
            }}>
              ⚠️ {error}
            </div>
          )}
          {usedFallback && !error && (
            <div style={{
              marginBottom: 8,
              padding: '6px 12px',
              background: 'rgba(255, 193, 7, 0.15)',
              border: '1px solid rgba(255, 193, 7, 0.4)',
              borderRadius: 6,
              color: isDark ? '#ffd54f' : '#b26a00',
              fontSize: 12
            }}>
              💡 在线 API 不可用，已使用本地模拟翻译
            </div>
          )}
          <div style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            background: inputBg,
            fontSize: 14,
            lineHeight: 1.8,
            overflow: 'auto',
            position: 'relative',
          }}>
            {result ? (
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</div>
            ) : (
              <div style={{ color: isDark ? '#6b7280' : '#bbb' }}>翻译结果将显示在这里</div>
            )}
          </div>
          {result && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={copyResult}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${borderColor}`,
                  background: copied ? (isDark ? '#1a4a1a' : '#c8e6c9') : inputBg,
                  color: copied ? '#4caf50' : textColor,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {copied ? '✓ 已复制' : '📋 复制结果'}
              </button>
              <button
                onClick={speakResult}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1px solid ${borderColor}`,
                  background: speaking ? accent : inputBg,
                  color: speaking ? '#fff' : textColor,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {speaking ? '⏹ 停止朗读' : '🔊 朗读结果'}
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: isDark ? '#666' : '#999', marginBottom: 6 }}>
            常用短语：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {commonPhrases[langPair]?.map((phrase, i) => (
              <button
                key={i}
                onClick={() => insertPhrase(phrase)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? '#aaa' : '#666',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {phrase}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: 11, color: isDark ? '#666' : '#999', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>翻译历史（最多 {MAX_HISTORY} 条）</span>
                <button
                  onClick={() => setHistory([])}
                  style={{
                    border: 'none', background: 'transparent',
                    color: isDark ? '#888' : '#666', cursor: 'pointer', fontSize: 11,
                  }}
                >
                  清空
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto' }}>
                {history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => applyHistoryItem(item)}
                    title={`点击重新使用：${item.source}`}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: `1px solid ${borderColor}`,
                      background: inputBg,
                      color: textColor,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: isDark ? '#aaa' : '#888', fontSize: 11 }}>
                        {item.from} → {item.to}
                      </span>
                      <span style={{ color: isDark ? '#555' : '#aaa', fontSize: 10 }}>{formatTime(item.timestamp)}</span>
                    </div>
                    <div style={{ color: textColor, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.source}
                    </div>
                    <div style={{ color: isDark ? '#bbb' : '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                      ↳ {item.result}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
