import { useState } from 'react'
import { useStore } from '../store'

type LangPair = 'zh-en' | 'en-zh' | 'zh-ja' | 'ja-zh'

const langLabels: Record<LangPair, { from: string; to: string }> = {
  'zh-en': { from: '中文', to: '英文' },
  'en-zh': { from: '英文', to: '中文' },
  'zh-ja': { from: '中文', to: '日文' },
  'ja-zh': { from: '日文', to: '中文' },
}

const mockTranslations: Record<string, string> = {
  '你好': 'Hello',
  'hello': '你好',
  '谢谢': 'Thank you',
  'thank you': '谢谢你',
  '早上好': 'Good morning',
  'good morning': '早上好',
  '晚安': 'Good night',
  'good night': '晚安',
  '我爱你': 'I love you',
  'i love you': '我爱你',
  '今天天气真好': 'The weather is really nice today',
  'the weather is really nice today': '今天的天气真的很好',
  '请稍等': 'Please wait a moment',
  'please wait a moment': '请稍等片刻',
  '祝你生日快乐': 'Happy birthday to you',
  'happy birthday to you': '祝你生日快乐',
}

const mockJaTranslations: Record<string, string> = {
  '你好': 'こんにちは',
  'こんにちは': '你好',
  '谢谢': 'ありがとう',
  'ありがとう': '谢谢',
  '早上好': 'おはようございます',
  'おはようございます': '早上好',
  '晚安': 'おやすみなさい',
  'おやすみなさい': '晚安',
  '我爱你': '愛してる',
  '愛してる': '我爱你',
}

export default function Translator() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [langPair, setLangPair] = useState<LangPair>('zh-en')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'

  const swapLangs = () => {
    const swaps: Record<LangPair, LangPair> = {
      'zh-en': 'en-zh',
      'en-zh': 'zh-en',
      'zh-ja': 'ja-zh',
      'ja-zh': 'zh-ja',
    }
    setLangPair(swaps[langPair])
    setResult('')
  }

  const translate = () => {
    if (!input.trim()) return
    const query = input.trim().toLowerCase()
    if (langPair === 'zh-en' || langPair === 'en-zh') {
      setResult(mockTranslations[input.trim()] || mockTranslations[query] || `[模拟翻译] ${input.trim()} → (${langLabels[langPair].to})`)
    } else {
      setResult(mockJaTranslations[input.trim()] || mockJaTranslations[query] || `[模擬翻訳] ${input.trim()} → (${langLabels[langPair].to})`)
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

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].from}</span>
        <select value={langPair} onChange={(e) => { setLangPair(e.target.value as LangPair); setResult('') }}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, outline: 'none' }}>
          <option value="zh-en">中文 → 英文</option>
          <option value="en-zh">英文 → 中文</option>
          <option value="zh-ja">中文 → 日文</option>
          <option value="ja-zh">日文 → 中文</option>
        </select>
        <button onClick={swapLangs} style={{
          width: 32, height: 32, borderRadius: '50%', border: `1px solid ${borderColor}`,
          background: inputBg, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>⇄</button>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].to}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', padding: 12, gap: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={`输入${langLabels[langPair].from}文本...`}
            style={{
              flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${borderColor}`,
              background: inputBg, color: textColor, fontSize: 14, lineHeight: 1.8,
              resize: 'none', outline: 'none', fontFamily: 'system-ui, sans-serif',
            }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${borderColor}`,
            background: inputBg, fontSize: 14, lineHeight: 1.8, overflow: 'auto', position: 'relative',
          }}>
            {result ? (
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</div>
            ) : (
              <div style={{ color: isDark ? '#6b7280' : '#bbb' }}>翻译结果将显示在这里</div>
            )}
          </div>
          {result && (
            <button onClick={copyResult} style={{
              marginTop: 8, padding: '8px 16px', borderRadius: 6, border: `1px solid ${borderColor}`,
              background: copied ? (isDark ? '#1a4a1a' : '#c8e6c9') : inputBg,
              color: copied ? '#4caf50' : textColor, cursor: 'pointer', fontSize: 12,
            }}>
              {copied ? '✓ 已复制' : '📋 复制结果'}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 16px', borderTop: `1px solid ${borderColor}`, textAlign: 'center' }}>
        <button onClick={translate} style={{
          padding: '10px 40px', borderRadius: 8, border: 'none', background: accent,
          color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
        }}>翻译</button>
      </div>
    </div>
  )
}