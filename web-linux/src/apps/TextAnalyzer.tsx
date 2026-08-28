import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import {
  FileText, Hash, Type, BookOpen, BarChart3, Sparkles,
  Search, Globe, Loader2, AlertCircle, CheckCircle, Copy,
  RotateCcw, ArrowRightLeft, Brain, MessageSquare,
  Zap
} from 'lucide-react'

// ==================== 类型定义 ====================

/** 字符统计信息 */
interface CharStats {
  total: number
  chinese: number
  english: number
  digits: number
  punctuation: number
  spaces: number
}

/** 词频项 */
interface WordFreqItem {
  word: string
  count: number
  percentage: number
}

/** 句子统计信息 */
interface SentenceStats {
  sentenceCount: number
  avgSentenceLength: number
  paragraphCount: number
  readingTime: number
}

/** 文本质量评分 */
interface QualityScore {
  score: number
  level: string
  levelColor: string
  details: string[]
}

/** 词典 API 返回的音标 */
interface Phonetic {
  text?: string
  audio?: string
}

/** 词典 API 返回的释义 */
interface DictMeaning {
  partOfSpeech: string
  definitions: Array<{
    definition: string
    example?: string
  }>
}

/** 词典 API 返回数据 */
interface DictEntry {
  word: string
  phonetic?: string
  phonetics?: Phonetic[]
  meanings: DictMeaning[]
}

/** 词典查询结果 */
interface DictResult {
  word: string
  phonetic?: string
  audio?: string
  meanings: DictMeaning[]
}

/** 翻译结果 */
interface TranslationResult {
  translatedText: string
  match: number
}

/** 摘要结果 */
interface SummaryResult {
  text: string
}

/** Tab 类型 */
type TabType = 'chars' | 'words' | 'sentences' | 'quality'
type ApiTabType = 'summary' | 'dictionary' | 'translate'

// ==================== 常量配置 ====================

/** 停用词列表（精简版） */
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '们', '那', '些', '什么', '怎么', '可以', '这',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'and', 'or', 'but', 'if', 'while', 'as', 'for', 'with', 'about',
  'of', 'to', 'in', 'on', 'at', 'by', 'from', 'up', 'out', 'it',
  'that', 'this', 'these', 'those', 'which', 'what', 'who', 'whom',
  'not', 'no', 'nor', 'so', 'too', 'very', 'just', 'than', 'then'
])

// ==================== 工具函数 ====================

/** 简易中文分词：基于正则匹配连续中文字符和英文单词 */
function tokenize(text: string): string[] {
  const tokens: string[] = []
  // 匹配中文字符序列（连续2字以上）和英文单词
  const regex = /[\u4e00-\u9fa5]{2,}|[a-zA-Z']{2,}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0].toLowerCase())
  }
  return tokens
}

/** 计算文本质量评分 */
function calculateQualityScore(text: string, charStats: CharStats, sentenceStats: SentenceStats): QualityScore {
  const details: string[] = []
  let score = 60

  // 句子长度评分
  const avgLen = sentenceStats.avgSentenceLength
  if (avgLen >= 15 && avgLen <= 30) {
    score += 10
    details.push('句子长度适中，阅读体验良好')
  } else if (avgLen < 10) {
    score -= 5
    details.push('句子偏短，建议适当合并')
  } else if (avgLen > 40) {
    score -= 5
    details.push('句子偏长，建议适当拆分')
  }

  // 段落数评分
  if (sentenceStats.paragraphCount >= 2) {
    score += 8
    details.push('有合理的段落划分')
  } else if (sentenceStats.paragraphCount === 1 && charStats.total > 200) {
    score -= 5
    details.push('建议添加段落划分以提升可读性')
  }

  // 标点符号使用
  const punctRatio = charStats.punctuation / Math.max(charStats.total, 1)
  if (punctRatio >= 0.03 && punctRatio <= 0.12) {
    score += 7
    details.push('标点使用规范')
  } else if (punctRatio < 0.01 && charStats.total > 50) {
    score -= 5
    details.push('缺少标点符号，影响阅读')
  }

  // 词汇丰富度
  const tokens = tokenize(text)
  const uniqueTokens = new Set(tokens)
  const richness = tokens.length > 0 ? uniqueTokens.size / tokens.length : 0
  if (richness > 0.6) {
    score += 10
    details.push('词汇丰富度高')
  } else if (richness > 0.4) {
    score += 5
    details.push('词汇丰富度中等')
  } else if (tokens.length > 5) {
    details.push('词汇重复度较高，建议丰富用词')
  }

  // 空格比例（中英文混合时合理使用空格）
  const spaceRatio = charStats.spaces / Math.max(charStats.total, 1)
  if (charStats.chinese > 0 && charStats.english > 0) {
    if (spaceRatio > 0.02) {
      score += 5
      details.push('中英文混排间距合理')
    }
  }

  score = Math.min(100, Math.max(0, score))

  let level: string
  let levelColor: string
  if (score >= 85) { level = '优秀'; levelColor = '#22c55e' }
  else if (score >= 70) { level = '良好'; levelColor = '#3b82f6' }
  else if (score >= 50) { level = '一般'; levelColor = '#f59e0b' }
  else { level = '需改进'; levelColor = '#ef4444' }

  return { score, level, levelColor, details }
}

// ==================== 子组件 ====================

/** 标签页按钮 */
const TabButton = memo(({
  icon, label, active, onClick
}: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
      fontWeight: active ? 600 : 400,
      background: active ? 'var(--accent, #4fc3f7)' : 'transparent',
      color: active ? '#000' : 'var(--text-secondary, #999)',
      transition: 'all 0.2s'
    }}
  >
    {icon}
    {label}
  </button>
))
TabButton.displayName = 'TabButton'

/** 统计项 */
const StatItem = memo(({
  label, value, sub
}: {
  label: string; value: string | number; sub?: string
}) => (
  <div style={{
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--window-border, #333)'
  }}>
    <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #eee)' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: 'var(--text-secondary, #666)', marginTop: 2 }}>{sub}</div>}
  </div>
))
StatItem.displayName = 'StatItem'

/** 进度条 */
const ProgressBar = memo(({
  value, max, color, height = 6
}: {
  value: number; max: number; color?: string; height?: number
}) => (
  <div style={{
    width: '100%', height, borderRadius: height,
    background: 'rgba(255,255,255,0.06)', overflow: 'hidden'
  }}>
    <div style={{
      width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%',
      borderRadius: height, background: color || 'var(--accent, #4fc3f7)',
      transition: 'width 0.3s ease'
    }} />
  </div>
))
ProgressBar.displayName = 'ProgressBar'

// ==================== 主组件 ====================

export default memo(function TextAnalyzer() {
  // ---- 状态 ----
  const [text, setText] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('chars')
  const [apiTab, setApiTab] = useState<ApiTabType>('summary')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // API 状态
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const [dictWord, setDictWord] = useState('')
  const [dictResult, setDictResult] = useState<DictResult | null>(null)
  const [dictLoading, setDictLoading] = useState(false)
  const [dictError, setDictError] = useState('')

  const [transText, setTransText] = useState('')
  const [transResult, setTransResult] = useState<TranslationResult | null>(null)
  const [transLoading, setTransLoading] = useState(false)
  const [transError, setTransError] = useState('')
  const [transDirection, setTransDirection] = useState<'en-zh' | 'zh-en'>('en-zh')

  // ---- 实时分析计算 ----

  /** 字符统计 */
  const charStats = useMemo<CharStats>(() => {
    if (!text) return { total: 0, chinese: 0, english: 0, digits: 0, punctuation: 0, spaces: 0 }

    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]/g) || []).length
    const digits = (text.match(/[0-9]/g) || []).length
    const punctuation = (text.match(/[，。！？、；：""''（）【】《》…—\-,.!?;:'"()\[\]{}<>]/g) || []).length
    const spaces = (text.match(/\s/g) || []).length

    return { total: text.length, chinese, english, digits, punctuation, spaces }
  }, [text])

  /** 词频统计 */
  const wordFreqs = useMemo<WordFreqItem[]>(() => {
    const tokens = tokenize(text)
    const freqMap: Record<string, number> = {}
    tokens.forEach(t => {
      if (!STOP_WORDS.has(t) && t.length >= 2) {
        freqMap[t] = (freqMap[t] || 0) + 1
      }
    })
    const total = tokens.length || 1
    return Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count, percentage: Math.round((count / total) * 100) }))
  }, [text])

  /** 句子统计 */
  const sentenceStats = useMemo<SentenceStats>(() => {
    if (!text.trim()) return { sentenceCount: 0, avgSentenceLength: 0, paragraphCount: 0, readingTime: 0 }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    const sentences = text.split(/[。.!?！？]+/).filter(s => s.trim().length > 0)
    const sentenceCount = Math.max(sentences.length, 1)
    const avgSentenceLength = Math.round(text.length / sentenceCount)

    // 阅读时间估算：中文约 400字/分钟，英文约 200词/分钟
    const totalChars = text.length
    const readingTime = Math.max(1, Math.round(totalChars / 400))

    return { sentenceCount, avgSentenceLength, paragraphCount: paragraphs.length, readingTime }
  }, [text])

  /** 质量评分 */
  const qualityScore = useMemo<QualityScore>(() => {
    if (!text.trim()) return { score: 0, level: '无内容', levelColor: '#666', details: [] }
    return calculateQualityScore(text, charStats, sentenceStats)
  }, [text, charStats, sentenceStats])

  // ---- API 调用 ----

  /** Pollinations.ai 文本摘要 */
  const handleSummarize = useCallback(async () => {
    if (!text.trim()) return
    setSummaryLoading(true)
    setSummaryError('')
    setSummary('')

    try {
      const prompt = `请用中文对以下文本进行简洁摘要（不超过100字）：\n\n${text.slice(0, 2000)}`
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!response.ok) throw new Error('摘要请求失败，请稍后重试')
      const result: SummaryResult = await response.json()
      setSummary(result.text || '未生成摘要')
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : '摘要生成失败')
    } finally {
      setSummaryLoading(false)
    }
  }, [text])

  /** Free Dictionary API 查询单词释义 */
  const handleDictSearch = useCallback(async () => {
    const word = dictWord.trim()
    if (!word) return
    setDictLoading(true)
    setDictError('')
    setDictResult(null)

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      )
      if (!response.ok) {
        if (response.status === 404) throw new Error('未找到该单词的释义')
        throw new Error('词典查询失败')
      }
      const data: DictEntry[] = await response.json()
      const entry = data[0]
      setDictResult({
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text,
        audio: entry.phonetics?.find(p => p.audio)?.audio,
        meanings: entry.meanings.map(m => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 4).map(d => ({
            definition: d.definition,
            example: d.example
          }))
        }))
      })
    } catch (err) {
      setDictError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setDictLoading(false)
    }
  }, [dictWord])

  /** MyMemory 翻译 API */
  const handleTranslate = useCallback(async () => {
    const q = transText.trim()
    if (!q) return
    setTransLoading(true)
    setTransError('')
    setTransResult(null)

    try {
      const [from, to] = transDirection === 'en-zh' ? ['en', 'zh-CN'] : ['zh-CN', 'en']
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`
      )
      if (!response.ok) throw new Error('翻译请求失败')
      const data = await response.json()
      if (data.responseStatus === 200) {
        setTransResult({
          translatedText: data.responseData.translatedText,
          match: data.responseData.match
        })
      } else {
        throw new Error(data.responseDetails || '翻译失败')
      }
    } catch (err) {
      setTransError(err instanceof Error ? err.message : '翻译失败')
    } finally {
      setTransLoading(false)
    }
  }, [transText, transDirection])

  /** 复制文本到剪贴板 */
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch { /* 忽略剪贴板错误 */ }
  }, [])

  /** 清空输入 */
  const handleClear = useCallback(() => {
    setText('')
    setSummary('')
    setDictResult(null)
    setTransResult(null)
  }, [])

  // ---- Tab 点击自动提取选中单词查询词典 ----
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const handleSelect = () => {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim()
      if (/^[a-zA-Z]+$/.test(selected)) {
        setDictWord(selected)
      }
    }
    textarea.addEventListener('mouseup', handleSelect)
    return () => textarea.removeEventListener('mouseup', handleSelect)
  }, [])

  // ---- 渲染 ----
  const maxCharType = Math.max(charStats.chinese, charStats.english, charStats.digits, charStats.punctuation, charStats.spaces, 1)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--window-bg, #1a1a2e)', color: 'var(--text-primary, #eee)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13, overflow: 'hidden'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--window-border, #333)',
        background: 'rgba(255,255,255,0.02)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} style={{ color: 'var(--accent, #4fc3f7)' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>文本分析工具</span>
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(79,195,247,0.15)', color: 'var(--accent, #4fc3f7)'
          }}>
            实时分析
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #888)' }}>
            {charStats.total} 字符
          </span>
          <button onClick={handleClear} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            border: '1px solid var(--window-border, #444)', borderRadius: 6,
            background: 'transparent', color: 'var(--text-secondary, #999)',
            cursor: 'pointer', fontSize: 11, transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--window-border, #444)'; e.currentTarget.style.color = 'var(--text-secondary, #999)' }}
          >
            <RotateCcw size={12} />
            清空
          </button>
        </div>
      </div>

      {/* 主体区域：左输入 + 右分析 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧：文本输入 */}
        <div style={{
          flex: '1 1 50%', display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--window-border, #333)', minWidth: 0
        }}>
          <div style={{
            padding: '6px 14px', fontSize: 11, fontWeight: 600,
            color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--window-border, #333)',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
          }}>
            <Type size={12} /> 文本输入
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="在此输入或粘贴文本内容进行分析...&#10;&#10;支持中文和英文混合文本分析。选中英文单词可自动查询词典。"
            style={{
              flex: 1, width: '100%', padding: '12px 14px', border: 'none',
              background: 'transparent', color: 'var(--text-primary, #eee)',
              fontSize: 14, lineHeight: 1.7, resize: 'none', outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* 右侧：分析面板 */}
        <div style={{
          flex: '1 1 50%', display: 'flex', flexDirection: 'column',
          minWidth: 0, overflow: 'hidden'
        }}>
          {/* Tab 栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px',
            borderBottom: '1px solid var(--window-border, #333)', flexShrink: 0,
            overflowX: 'auto'
          }}>
            <TabButton
              icon={<Hash size={13} />} label="字符" active={activeTab === 'chars'}
              onClick={() => setActiveTab('chars')}
            />
            <TabButton
              icon={<BarChart3 size={13} />} label="词频" active={activeTab === 'words'}
              onClick={() => setActiveTab('words')}
            />
            <TabButton
              icon={<MessageSquare size={13} />} label="句子" active={activeTab === 'sentences'}
              onClick={() => setActiveTab('sentences')}
            />
            <TabButton
              icon={<Brain size={13} />} label="评分" active={activeTab === 'quality'}
              onClick={() => setActiveTab('quality')}
            />
          </div>

          {/* Tab 内容 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
            {!text.trim() ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', opacity: 0.4
              }}>
                <FileText size={40} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13 }}>输入文本后自动分析</div>
              </div>
            ) : (
              <>
                {/* 字符统计 Tab */}
                {activeTab === 'chars' && (
                  <div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                      marginBottom: 14
                    }}>
                      <StatItem label="总字符数" value={charStats.total} />
                      <StatItem label="中文字符" value={charStats.chinese}
                        sub={`${charStats.total > 0 ? Math.round(charStats.chinese / charStats.total * 100) : 0}%`} />
                      <StatItem label="英文字母" value={charStats.english}
                        sub={`${charStats.total > 0 ? Math.round(charStats.english / charStats.total * 100) : 0}%`} />
                      <StatItem label="数字" value={charStats.digits}
                        sub={`${charStats.total > 0 ? Math.round(charStats.digits / charStats.total * 100) : 0}%`} />
                      <StatItem label="标点符号" value={charStats.punctuation}
                        sub={`${charStats.total > 0 ? Math.round(charStats.punctuation / charStats.total * 100) : 0}%`} />
                      <StatItem label="空白字符" value={charStats.spaces}
                        sub={`${charStats.total > 0 ? Math.round(charStats.spaces / charStats.total * 100) : 0}%`} />
                    </div>

                    {/* 字符分布条形图 */}
                    <div style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--window-border, #333)'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #888)', marginBottom: 10 }}>
                        字符分布
                      </div>
                      {[
                        { label: '中文', value: charStats.chinese, color: '#4fc3f7' },
                        { label: '英文', value: charStats.english, color: '#81c784' },
                        { label: '数字', value: charStats.digits, color: '#ffb74d' },
                        { label: '标点', value: charStats.punctuation, color: '#ce93d8' },
                        { label: '空格', value: charStats.spaces, color: '#90a4ae' }
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ width: 32, fontSize: 11, color: 'var(--text-secondary, #888)', textAlign: 'right' }}>
                            {item.label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <ProgressBar value={item.value} max={maxCharType} color={item.color} />
                          </div>
                          <span style={{ width: 36, fontSize: 11, color: 'var(--text-secondary, #aaa)', textAlign: 'right' }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 词频统计 Tab */}
                {activeTab === 'words' && (
                  <div>
                    {wordFreqs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary, #888)' }}>
                        <BookOpen size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <div>输入包含词汇的文本以查看词频</div>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #888)',
                          marginBottom: 10
                        }}>
                          Top {wordFreqs.length} 高频词
                        </div>
                        {wordFreqs.map((item, idx) => (
                          <div key={item.word} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '7px 10px', marginBottom: 4, borderRadius: 6,
                            background: idx < 3 ? 'rgba(79,195,247,0.06)' : 'transparent'
                          }}>
                            <span style={{
                              width: 20, height: 20, borderRadius: 4,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700,
                              background: idx < 3 ? 'var(--accent, #4fc3f7)' : 'rgba(255,255,255,0.08)',
                              color: idx < 3 ? '#000' : 'var(--text-secondary, #888)'
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{item.word}</span>
                            <div style={{ width: 80 }}>
                              <ProgressBar
                                value={item.count}
                                max={wordFreqs[0]?.count || 1}
                                color={idx < 3 ? 'var(--accent, #4fc3f7)' : 'rgba(255,255,255,0.15)'}
                              />
                            </div>
                            <span style={{ width: 32, fontSize: 11, textAlign: 'right', color: 'var(--text-secondary, #888)' }}>
                              {item.count}
                            </span>
                            <span style={{ width: 36, fontSize: 10, textAlign: 'right', color: 'var(--text-secondary, #666)' }}>
                              {item.percentage}%
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* 句子统计 Tab */}
                {activeTab === 'sentences' && (
                  <div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                      marginBottom: 14
                    }}>
                      <StatItem
                        label="句子数"
                        value={sentenceStats.sentenceCount}
                        sub="以句号、问号、感叹号分隔"
                      />
                      <StatItem
                        label="平均句长"
                        value={`${sentenceStats.avgSentenceLength} 字符`}
                        sub={sentenceStats.avgSentenceLength > 30 ? '建议适当拆分' : '长度适中'}
                      />
                      <StatItem
                        label="段落数"
                        value={sentenceStats.paragraphCount}
                        sub="以空行分隔"
                      />
                      <StatItem
                        label="预计阅读"
                        value={`${sentenceStats.readingTime} 分钟`}
                        sub="约 400 字/分钟"
                      />
                    </div>

                    {/* 句子长度分析 */}
                    {text.trim() && (
                      <div style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--window-border, #333)'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #888)', marginBottom: 8 }}>
                          句子长度分布
                        </div>
                        {(() => {
                          const sentences = text.split(/[。.!?！？]+/).filter(s => s.trim().length > 0)
                          const maxLen = Math.max(...sentences.map(s => s.length), 1)
                          return sentences.slice(0, 10).map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                width: 18, fontSize: 10, color: 'var(--text-secondary, #666)', textAlign: 'right'
                              }}>
                                {i + 1}
                              </span>
                              <div style={{ flex: 1 }}>
                                <ProgressBar
                                  value={s.length}
                                  max={maxLen}
                                  color={
                                    s.length > 40 ? '#ef4444' :
                                    s.length > 25 ? '#f59e0b' : '#22c55e'
                                  }
                                  height={8}
                                />
                              </div>
                              <span style={{ width: 24, fontSize: 10, textAlign: 'right', color: 'var(--text-secondary, #888)' }}>
                                {s.length}
                              </span>
                            </div>
                          ))
                        })()}
                        {text.split(/[。.!?！？]+/).filter(s => s.trim().length > 0).length > 10 && (
                          <div style={{ fontSize: 10, color: 'var(--text-secondary, #666)', marginTop: 6 }}>
                            仅显示前 10 个句子
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 质量评分 Tab */}
                {activeTab === 'quality' && (
                  <div>
                    {/* 评分圆环 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 16, gap: 24
                    }}>
                      <div style={{
                        width: 100, height: 100, position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width={100} height={100} viewBox="0 0 100 100">
                          <circle cx={50} cy={50} r={42} fill="none"
                            stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                          <circle cx={50} cy={50} r={42} fill="none"
                            stroke={qualityScore.levelColor}
                            strokeWidth={8} strokeLinecap="round"
                            strokeDasharray={`${(qualityScore.score / 100) * 264} 264`}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          />
                        </svg>
                        <div style={{
                          position: 'absolute', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 700 }}>{qualityScore.score}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-secondary, #888)' }}>/ 100</div>
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: 16, fontWeight: 700, color: qualityScore.levelColor,
                          marginBottom: 4
                        }}>
                          {qualityScore.level}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #888)', lineHeight: 1.5 }}>
                          {qualityScore.score >= 85 ? '文本质量优秀，表达清晰' :
                           qualityScore.score >= 70 ? '文本质量良好' :
                           qualityScore.score >= 50 ? '文本质量一般' : '建议优化文本'}
                        </div>
                      </div>
                    </div>

                    {/* 质量评分明细 */}
                    {qualityScore.details.length > 0 && (
                      <div style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--window-border, #333)'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #888)', marginBottom: 8 }}>
                          评分详情
                        </div>
                        {qualityScore.details.map((detail, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            marginBottom: 6, fontSize: 12, lineHeight: 1.5
                          }}>
                            <CheckCircle size={13} style={{
                              color: qualityScore.levelColor, marginTop: 2, flexShrink: 0
                            }} />
                            <span style={{ color: 'var(--text-primary, #ccc)' }}>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 底部 API 集成区域 */}
      <div style={{
        borderTop: '1px solid var(--window-border, #333)',
        background: 'rgba(255,255,255,0.01)', flexShrink: 0
      }}>
        {/* API Tab 栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, padding: '6px 14px',
          borderBottom: '1px solid var(--window-border, #333)'
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #666)', marginRight: 8
          }}>
            <Sparkles size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
            API 集成
          </span>
          {([
            { key: 'summary' as const, label: '智能摘要', icon: <Zap size={12} /> },
            { key: 'dictionary' as const, label: '英语词典', icon: <BookOpen size={12} /> },
            { key: 'translate' as const, label: '翻译', icon: <Globe size={12} /> }
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setApiTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11,
                fontWeight: apiTab === tab.key ? 600 : 400,
                background: apiTab === tab.key ? 'var(--accent, #4fc3f7)' : 'transparent',
                color: apiTab === tab.key ? '#000' : 'var(--text-secondary, #888)',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* API 内容 */}
        <div style={{ padding: '8px 14px', minHeight: 80 }}>
          {/* 摘要面板 */}
          {apiTab === 'summary' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={handleSummarize}
                  disabled={!text.trim() || summaryLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px',
                    border: 'none', borderRadius: 6, cursor: !text.trim() || summaryLoading ? 'not-allowed' : 'pointer',
                    background: !text.trim() || summaryLoading ? 'rgba(255,255,255,0.05)' : 'var(--accent, #4fc3f7)',
                    color: !text.trim() || summaryLoading ? 'var(--text-secondary, #666)' : '#000',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  {summaryLoading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                  {summaryLoading ? '生成中...' : '生成摘要'}
                </button>
                {!text.trim() && (
                  <span style={{ fontSize: 10, color: 'var(--text-secondary, #666)' }}>
                    请先在左侧输入文本
                  </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--text-secondary, #555)', marginLeft: 'auto' }}>
                  Powered by Pollinations.ai
                </span>
              </div>
              {summaryError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                  borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11
                }}>
                  <AlertCircle size={12} /> {summaryError}
                </div>
              )}
              {summary && !summaryError && (
                <div style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)',
                  fontSize: 12, lineHeight: 1.6, position: 'relative'
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--accent, #4fc3f7)',
                    marginBottom: 4
                  }}>
                    AI 摘要
                  </div>
                  {summary}
                  <button
                    onClick={() => handleCopy(summary)}
                    style={{
                      position: 'absolute', top: 6, right: 6, padding: '2px 6px',
                      border: '1px solid var(--window-border, #444)', borderRadius: 4,
                      background: 'transparent', color: 'var(--text-secondary, #888)',
                      cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3
                    }}
                  >
                    <Copy size={10} /> 复制
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 词典面板 */}
          {apiTab === 'dictionary' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <input
                    value={dictWord}
                    onChange={e => setDictWord(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDictSearch()}
                    placeholder="输入英文单词查询释义（选中左侧文本中的单词自动填入）"
                    style={{
                      flex: 1, padding: '5px 10px', border: '1px solid var(--window-border, #444)',
                      borderRadius: '6px 0 0 6px', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary, #eee)', fontSize: 12, outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleDictSearch}
                    disabled={!dictWord.trim() || dictLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
                      border: '1px solid var(--window-border, #444)', borderLeft: 'none',
                      borderRadius: '0 6px 6px 0', cursor: 'pointer',
                      background: !dictWord.trim() || dictLoading ? 'rgba(255,255,255,0.03)' : 'var(--accent, #4fc3f7)',
                      color: !dictWord.trim() || dictLoading ? 'var(--text-secondary, #666)' : '#000',
                      fontSize: 12, fontWeight: 500, transition: 'all 0.2s'
                    }}
                  >
                    {dictLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    查询
                  </button>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary, #555)' }}>
                  Free Dictionary API
                </span>
              </div>
              {dictError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                  borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11
                }}>
                  <AlertCircle size={12} /> {dictError}
                </div>
              )}
              {dictResult && !dictError && (
                <div style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent, #4fc3f7)' }}>
                      {dictResult.word}
                    </span>
                    {dictResult.phonetic && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>
                        {dictResult.phonetic}
                      </span>
                    )}
                    {dictResult.audio && (
                      <button
                        onClick={() => new Audio(dictResult.audio).play()}
                        style={{
                          padding: '2px 6px', border: '1px solid var(--window-border, #444)',
                          borderRadius: 4, background: 'transparent', color: 'var(--text-secondary, #888)',
                          cursor: 'pointer', fontSize: 10
                        }}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {dictResult.meanings.map((meaning, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                        background: 'rgba(79,195,247,0.15)', color: 'var(--accent, #4fc3f7)',
                        marginRight: 6
                      }}>
                        {meaning.partOfSpeech}
                      </span>
                      {meaning.definitions.map((def, j) => (
                        <div key={j} style={{ fontSize: 11, lineHeight: 1.5, marginTop: 2, paddingLeft: 6 }}>
                          <span style={{ color: 'var(--text-primary, #ccc)' }}>{j + 1}. {def.definition}</span>
                          {def.example && (
                            <div style={{ color: 'var(--text-secondary, #888)', fontStyle: 'italic', paddingLeft: 8 }}>
                              例: "{def.example}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 翻译面板 */}
          {apiTab === 'translate' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  value={transText}
                  onChange={e => setTransText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTranslate()}
                  placeholder={transDirection === 'en-zh' ? '输入英文翻译为中文' : '输入中文翻译为英文'}
                  style={{
                    flex: 1, padding: '5px 10px', border: '1px solid var(--window-border, #444)',
                    borderRadius: 6, background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-primary, #eee)', fontSize: 12, outline: 'none'
                  }}
                />
                <button
                  onClick={() => setTransDirection(d => d === 'en-zh' ? 'zh-en' : 'en-zh')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px',
                    border: '1px solid var(--window-border, #444)', borderRadius: 6,
                    background: 'transparent', color: 'var(--text-secondary, #888)',
                    cursor: 'pointer', fontSize: 11, transition: 'all 0.2s'
                  }}
                  title="切换翻译方向"
                >
                  <ArrowRightLeft size={13} />
                  {transDirection === 'en-zh' ? 'EN→中' : '中→EN'}
                </button>
                <button
                  onClick={handleTranslate}
                  disabled={!transText.trim() || transLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: !transText.trim() || transLoading ? 'rgba(255,255,255,0.05)' : 'var(--accent, #4fc3f7)',
                    color: !transText.trim() || transLoading ? 'var(--text-secondary, #666)' : '#000',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.2s'
                  }}
                >
                  {transLoading ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                  翻译
                </button>
                <span style={{ fontSize: 10, color: 'var(--text-secondary, #555)' }}>
                  MyMemory API
                </span>
              </div>
              {transError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                  borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11
                }}>
                  <AlertCircle size={12} /> {transError}
                </div>
              )}
              {transResult && !transError && (
                <div style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent, #4fc3f7)', marginBottom: 4 }}>
                    翻译结果
                    <span style={{
                      marginLeft: 8, fontWeight: 400, color: 'var(--text-secondary, #888)'
                    }}>
                      匹配度: {Math.round(transResult.match * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {transResult.translatedText}
                  </div>
                  <button
                    onClick={() => handleCopy(transResult.translatedText)}
                    style={{
                      position: 'absolute', top: 6, right: 6, padding: '2px 6px',
                      border: '1px solid var(--window-border, #444)', borderRadius: 4,
                      background: 'transparent', color: 'var(--text-secondary, #888)',
                      cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3
                    }}
                  >
                    <Copy size={10} /> 复制
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
