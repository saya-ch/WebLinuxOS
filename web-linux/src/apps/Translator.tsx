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

export default function Translator() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [langPair, setLangPair] = useState<LangPair>('zh|en')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setResult('')
    setInput('')
  }

  const translateWithMyMemory = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    const langCode = `${fromLang}|${toLang}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langCode}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('翻译请求失败')
    }

    const data = await response.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    } else {
      throw new Error(data.responseDetails || '翻译失败')
    }
  }

  const translate = async () => {
    if (!input.trim()) return

    setTranslating(true)
    setError(null)

    try {
      const { fromCode, toCode } = langLabels[langPair]
      const fromLang = fromCode.split('-')[0]
      const toLang = toCode.split('-')[0]

      const translatedText = await translateWithMyMemory(input.trim(), fromLang, toLang)
      setResult(translatedText)
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].from}</span>
        <select
          value={langPair}
          onChange={(e) => { setLangPair(e.target.value as LangPair); setResult(''); setInput('') }}
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
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`输入${langLabels[langPair].from}文本...`}
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
              <>
                <span>⏳</span>
                <span>翻译中...</span>
              </>
            ) : (
              <>
                <span>🌐</span>
                <span>翻译 (Ctrl+Enter)</span>
              </>
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
            <button
              onClick={copyResult}
              style={{
                marginTop: 8,
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
        </div>
      </div>
    </div>
  )
}
