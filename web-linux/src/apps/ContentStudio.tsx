import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  PenTool,
  BookOpen,
  Hash,
  Edit3,
  Languages,
  Type,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type TabKey = 'generator' | 'summarizer' | 'polisher' | 'titles' | 'translator' | 'hashtags'

interface HistoryItem {
  id: string
  type: string
  input: string
  output: string
  timestamp: Date
}

const GENRE_PRESETS = [
  { label: '通用文章', value: '请撰写一篇结构清晰、逻辑严密、内容丰富的文章。' },
  { label: '科技博客', value: '请撰写一篇技术博客文章，风格专业但易懂，适合开发者阅读。' },
  { label: '产品介绍', value: '请撰写一篇产品介绍文案，突出核心功能和卖点，具有说服力。' },
  { label: '社交媒体', value: '请撰写一段社交媒体文案，风格活泼有趣，适合年轻用户。' },
  { label: '学术论文', value: '请撰写一篇学术风格的文章，使用规范的学术用语和引用格式。' },
  { label: '营销文案', value: '请撰写一篇营销推广文案，具有强烈的号召力和吸引力。' },
  { label: '故事创作', value: '请创作一个引人入胜的故事，情节跌宕起伏，人物性格鲜明。' },
  { label: '演讲稿', value: '请撰写一篇演讲稿，结构清晰，有感染力，适合公开演讲。' },
]

const TITLE_STYLES = [
  { label: '新闻式', value: 'news' },
  { label: '悬念式', value: 'curiosity' },
  { label: '数字式', value: 'number' },
  { label: '对比式', value: 'contrast' },
  { label: '提问式', value: 'question' },
  { label: '清单式', value: 'list' },
]

const POLISH_TONES = [
  { label: '正式专业', value: 'formal' },
  { label: '简洁清晰', value: 'concise' },
  { label: '生动活泼', value: 'vivid' },
  { label: '学术严谨', value: 'academic' },
  { label: '营销有力', value: 'marketing' },
]

const HASHTAG_CATEGORIES = [
  { label: '科技', value: 'tech' },
  { label: '设计', value: 'design' },
  { label: '商业', value: 'business' },
  { label: '生活', value: 'lifestyle' },
  { label: '教育', value: 'education' },
  { label: '旅行', value: 'travel' },
  { label: '美食', value: 'food' },
  { label: '健身', value: 'fitness' },
]

export default function ContentStudio() {
  const [tab, setTab] = useState<TabKey>('generator')
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [genPrompt, setGenPrompt] = useState('')
  const [genGenre, setGenGenre] = useState(GENRE_PRESETS[0].value)
  const [genLength, setGenLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [genResult, setGenResult] = useState('')

  const [sumText, setSumText] = useState('')
  const [sumLength, setSumLength] = useState<'brief' | 'standard' | 'detailed'>('standard')
  const [sumResult, setSumResult] = useState('')

  const [polishText, setPolishText] = useState('')
  const [polishTone, setPolishTone] = useState(POLISH_TONES[0].value)
  const [polishResult, setPolishResult] = useState('')

  const [titleTopic, setTitleTopic] = useState('')
  const [titleStyle, setTitleStyle] = useState(TITLE_STYLES[0].value)
  const [titleCount, setTitleCount] = useState(5)
  const [titleResult, setTitleResult] = useState('')

  const [transText, setTransText] = useState('')
  const [transFrom, setTransFrom] = useState('auto')
  const [transTo, setTransTo] = useState('zh')
  const [transResult, setTransResult] = useState('')

  const [hashtagText, setHashtagText] = useState('')
  const [hashtagCategory, setHashtagCategory] = useState(HASHTAG_CATEGORIES[0].value)
  const [hashtagCount, setHashtagCount] = useState(10)
  const [hashtagResult, setHashtagResult] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('content-studio-history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const addHistory = useCallback((type: string, input: string, output: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      type,
      input: input.slice(0, 100),
      output: output.slice(0, 200),
      timestamp: new Date(),
    }
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 30)
      try { localStorage.setItem('content-studio-history', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const callPollinations = useCallback(async (prompt: string): Promise<string> => {
    const url = `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(prompt)}?model=${API_CONFIG.pollinations.defaultModel}`
    const response = await fetchWithTimeout(url, {}, 30000)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.text()
  }, [])

  const handleGenerate = async () => {
    if (!genPrompt.trim()) { showToast('请输入创作主题'); return }
    setLoading(true); setError(null); setGenResult('')
    try {
      const lengthMap = { short: '约200字', medium: '约500字', long: '约1000字' }
      const prompt = `${genGenre}\n\n主题：${genPrompt}\n\n请创作${lengthMap[genLength]}的内容。要求：结构完整、逻辑清晰、内容丰富。`
      const result = await callPollinations(prompt)
      setGenResult(result.trim())
      addHistory('文章生成', genPrompt, result)
    } catch (e) { setError(handleApiError(e, 'AI生成')) }
    finally { setLoading(false) }
  }

  const handleSummarize = async () => {
    if (!sumText.trim()) { showToast('请输入要总结的文本'); return }
    setLoading(true); setError(null); setSumResult('')
    try {
      const lengthMap = { brief: '3句话', standard: '一段', detailed: '详细段落' }
      const prompt = `请总结以下文本，生成${lengthMap[sumLength]}的摘要：\n\n${sumText.slice(0, 4000)}`
      const result = await callPollinations(prompt)
      setSumResult(result.trim())
      addHistory('文本摘要', sumText.slice(0, 100), result)
    } catch (e) { setError(handleApiError(e, '摘要')) }
    finally { setLoading(false) }
  }

  const handlePolish = async () => {
    if (!polishText.trim()) { showToast('请输入要润色的文本'); return }
    setLoading(true); setError(null); setPolishResult('')
    try {
      const toneMap: Record<string, string> = {
        formal: '正式专业', concise: '简洁清晰', vivid: '生动活泼', academic: '学术严谨', marketing: '营销有力'
      }
      const prompt = `请将以下文本润色为${toneMap[polishTone]}的风格，保持原意但提升表达质量：\n\n${polishText.slice(0, 4000)}`
      const result = await callPollinations(prompt)
      setPolishResult(result.trim())
      addHistory('文本润色', polishText.slice(0, 100), result)
    } catch (e) { setError(handleApiError(e, '润色')) }
    finally { setLoading(false) }
  }

  const handleTitles = async () => {
    if (!titleTopic.trim()) { showToast('请输入主题'); return }
    setLoading(true); setError(null); setTitleResult('')
    try {
      const styleMap: Record<string, string> = {
        news: '新闻式（包含关键信息）',
        curiosity: '悬念式（激发好奇心）',
        number: '数字式（包含数字）',
        contrast: '对比式（制造反差）',
        question: '提问式（引发思考）',
        list: '清单式（使用编号）',
      }
      const prompt = `请为"${titleTopic}"生成${titleCount}个${styleMap[titleStyle]}的标题。每个标题不超过20字，一行一个。`
      const result = await callPollinations(prompt)
      setTitleResult(result.trim())
      addHistory('标题生成', titleTopic, result)
    } catch (e) { setError(handleApiError(e, '标题生成')) }
    finally { setLoading(false) }
  }

  const handleTranslate = async () => {
    if (!transText.trim()) { showToast('请输入要翻译的文本'); return }
    setLoading(true); setError(null); setTransResult('')
    try {
      const prompt = `请将以下文本${transFrom === 'auto' ? '自动识别语言并' : `从${transFrom}`}翻译为${transTo}：\n\n${transText.slice(0, 2000)}`
      const result = await callPollinations(prompt)
      setTransResult(result.trim())
      addHistory('翻译', transText.slice(0, 50), result)
    } catch (e) { setError(handleApiError(e, '翻译')) }
    finally { setLoading(false) }
  }

  const handleHashtags = async () => {
    if (!hashtagText.trim()) { showToast('请输入内容描述'); return }
    setLoading(true); setError(null); setHashtagResult([])
    try {
      const prompt = `请根据"${hashtagText}"生成${hashtagCount}个相关的社交媒体标签(hashtags)，适用于${hashtagCategory}领域。只输出标签名（不含#号），用逗号分隔。`
      const result = await callPollinations(prompt)
      const tags = result
        .replace(/[#＃]/g, '')
        .split(/[,，\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.length < 20)
      setHashtagResult(tags)
      addHistory('标签生成', hashtagText, tags.join(', '))
    } catch (e) { setError(handleApiError(e, '标签生成')) }
    finally { setLoading(false) }
  }

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('已复制到剪贴板')
    } catch { showToast('复制失败') }
  }, [showToast])

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('content-studio-history') } catch {}
    showToast('历史已清空')
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'generator', label: '文章生成', icon: <PenTool size={16} /> },
    { key: 'summarizer', label: '文本摘要', icon: <BookOpen size={16} /> },
    { key: 'polisher', label: '文本润色', icon: <Edit3 size={16} /> },
    { key: 'titles', label: '标题生成', icon: <Hash size={16} /> },
    { key: 'translator', label: '智能翻译', icon: <Languages size={16} /> },
    { key: 'hashtags', label: '标签生成', icon: <Type size={16} /> },
  ]

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(150deg, #0f0a1a 0%, #1a1030 50%, #201040 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid rgba(139,92,246,0.18)',
        background: 'rgba(10,10,25,0.6)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>AI 内容创作工作室</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Powered by Pollinations AI</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {history.length > 0 && (
            <button onClick={clearHistory} style={styles.secondaryBtn}>
              清空历史
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', padding: '10px 16px', gap: 4,
        background: 'rgba(10,10,25,0.4)', overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            ...styles.tabBtn,
            ...(tab === t.key ? styles.tabActive : {}),
          }}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          margin: '12px 16px', padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {tab === 'generator' && (
          <div style={styles.panel}>
            <div style={styles.section}>
              <label style={styles.label}>创作主题</label>
              <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)}
                placeholder="描述你想创作的内容主题，例如：人工智能在医疗领域的应用"
                style={styles.textarea} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ ...styles.section, flex: 1, minWidth: 200 }}>
                <label style={styles.label}>写作风格</label>
                <select value={genGenre} onChange={e => setGenGenre(e.target.value)} style={styles.select}>
                  {GENRE_PRESETS.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ ...styles.section, flex: 1, minWidth: 150 }}>
                <label style={styles.label}>内容长度</label>
                <select value={genLength} onChange={e => setGenLength(e.target.value as 'short' | 'medium' | 'long')} style={styles.select}>
                  <option value="short">短篇 (~200字)</option>
                  <option value="medium">中篇 (~500字)</option>
                  <option value="long">长篇 (~1000字)</option>
                </select>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading} style={styles.primaryBtn}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> 生成中...</> : <><Wand2 size={16} /> AI 生成内容</>}
            </button>
            {genResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>生成结果</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => copyToClipboard(genResult)} style={styles.iconBtn}><Copy size={14} /></button>
                    <button onClick={handleGenerate} style={styles.iconBtn}><RefreshCw size={14} /></button>
                  </div>
                </div>
                <div style={styles.resultText}>{genResult}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'summarizer' && (
          <div style={styles.panel}>
            <div style={styles.section}>
              <label style={styles.label}>输入文本</label>
              <textarea value={sumText} onChange={e => setSumText(e.target.value)}
                placeholder="粘贴需要摘要的长文本..."
                style={styles.textarea} rows={8} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ ...styles.section, flex: '0 0 auto' }}>
                <label style={styles.label}>摘要长度</label>
                <select value={sumLength} onChange={e => setSumLength(e.target.value as 'brief' | 'standard' | 'detailed')} style={styles.select}>
                  <option value="brief">简短 (3句话)</option>
                  <option value="standard">标准 (一段)</option>
                  <option value="detailed">详细 (多段)</option>
                </select>
              </div>
              <button onClick={handleSummarize} disabled={loading} style={styles.primaryBtn}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> 摘要中...</> : <><BookOpen size={16} /> 生成摘要</>}
              </button>
            </div>
            {sumResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>摘要结果</span>
                  <button onClick={() => copyToClipboard(sumResult)} style={styles.iconBtn}><Copy size={14} /></button>
                </div>
                <div style={styles.resultText}>{sumResult}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'polisher' && (
          <div style={styles.panel}>
            <div style={styles.section}>
              <label style={styles.label}>待润色文本</label>
              <textarea value={polishText} onChange={e => setPolishText(e.target.value)}
                placeholder="输入需要润色的文本..."
                style={styles.textarea} rows={6} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ ...styles.section, flex: '0 0 auto' }}>
                <label style={styles.label}>目标风格</label>
                <select value={polishTone} onChange={e => setPolishTone(e.target.value)} style={styles.select}>
                  {POLISH_TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button onClick={handlePolish} disabled={loading} style={styles.primaryBtn}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> 润色中...</> : <><Edit3 size={16} /> 智能润色</>}
              </button>
            </div>
            {polishResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>润色结果</span>
                  <button onClick={() => copyToClipboard(polishResult)} style={styles.iconBtn}><Copy size={14} /></button>
                </div>
                <div style={styles.resultText}>{polishResult}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'titles' && (
          <div style={styles.panel}>
            <div style={styles.section}>
              <label style={styles.label}>主题描述</label>
              <input value={titleTopic} onChange={e => setTitleTopic(e.target.value)}
                placeholder="输入内容主题，如：远程办公的未来趋势"
                style={styles.input} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ ...styles.section, flex: 1, minWidth: 180 }}>
                <label style={styles.label}>标题风格</label>
                <select value={titleStyle} onChange={e => setTitleStyle(e.target.value)} style={styles.select}>
                  {TITLE_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ ...styles.section, flex: 1, minWidth: 150 }}>
                <label style={styles.label}>生成数量 ({titleCount})</label>
                <input type="range" min={3} max={15} value={titleCount}
                  onChange={e => setTitleCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8b5cf6' }} />
              </div>
            </div>
            <button onClick={handleTitles} disabled={loading} style={styles.primaryBtn}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> 生成中...</> : <><Hash size={16} /> 生成标题</>}
            </button>
            {titleResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>标题列表</span>
                  <button onClick={() => copyToClipboard(titleResult)} style={styles.iconBtn}><Copy size={14} /></button>
                </div>
                <div style={styles.resultText}>
                  {titleResult.split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', marginBottom: 6, borderRadius: 6,
                      background: 'rgba(139,92,246,0.1)', borderLeft: '3px solid #8b5cf6',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 600, fontSize: 13 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13 }}>{line.replace(/^\d+[\.\)、]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'translator' && (
          <div style={styles.panel}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ ...styles.section, flex: 1 }}>
                <label style={styles.label}>源文本</label>
                <textarea value={transText} onChange={e => setTransText(e.target.value)}
                  placeholder="输入要翻译的文本..."
                  style={styles.textarea} rows={5} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={styles.section}>
                <label style={styles.label}>源语言</label>
                <select value={transFrom} onChange={e => setTransFrom(e.target.value)} style={styles.select}>
                  <option value="auto">自动检测</option>
                  <option value="zh">中文</option>
                  <option value="en">英语</option>
                  <option value="ja">日语</option>
                  <option value="ko">韩语</option>
                  <option value="fr">法语</option>
                  <option value="de">德语</option>
                </select>
              </div>
              <ChevronRight size={20} style={{ color: '#8b5cf6' }} />
              <div style={styles.section}>
                <label style={styles.label}>目标语言</label>
                <select value={transTo} onChange={e => setTransTo(e.target.value)} style={styles.select}>
                  <option value="zh">中文</option>
                  <option value="en">英语</option>
                  <option value="ja">日语</option>
                  <option value="ko">韩语</option>
                  <option value="fr">法语</option>
                  <option value="de">德语</option>
                  <option value="es">西班牙语</option>
                </select>
              </div>
              <button onClick={handleTranslate} disabled={loading} style={styles.primaryBtn}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> 翻译中...</> : <><Languages size={16} /> 开始翻译</>}
              </button>
            </div>
            {transResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>翻译结果</span>
                  <button onClick={() => copyToClipboard(transResult)} style={styles.iconBtn}><Copy size={14} /></button>
                </div>
                <div style={styles.resultText}>{transResult}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'hashtags' && (
          <div style={styles.panel}>
            <div style={styles.section}>
              <label style={styles.label}>内容描述</label>
              <textarea value={hashtagText} onChange={e => setHashtagText(e.target.value)}
                placeholder="描述你的内容，如：一款极简风格的移动应用界面设计"
                style={styles.textarea} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ ...styles.section, flex: 1, minWidth: 180 }}>
                <label style={styles.label}>领域分类</label>
                <select value={hashtagCategory} onChange={e => setHashtagCategory(e.target.value)} style={styles.select}>
                  {HASHTAG_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ ...styles.section, flex: 1, minWidth: 150 }}>
                <label style={styles.label}>标签数量 ({hashtagCount})</label>
                <input type="range" min={5} max={20} value={hashtagCount}
                  onChange={e => setHashtagCount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8b5cf6' }} />
              </div>
            </div>
            <button onClick={handleHashtags} disabled={loading} style={styles.primaryBtn}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> 生成中...</> : <><Hash size={16} /> 生成标签</>}
            </button>
            {hashtagResult.length > 0 && (
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>推荐标签</span>
                  <button onClick={() => copyToClipboard(hashtagResult.map(t => '#' + t).join(' '))} style={styles.iconBtn}><Copy size={14} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16 }}>
                  {hashtagResult.map((tag, i) => (
                    <span key={i} style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12,
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))',
                      border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onClick={() => copyToClipboard('#' + tag)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.7 }}>
              历史记录
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 10).map(item => (
                <div key={item.id} style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 500, marginBottom: 4 }}>
                      {item.type}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.output}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 12, flexShrink: 0 }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 8,
          background: 'rgba(139,92,246,0.95)', color: '#fff',
          fontSize: 13, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, fontSize: 13,
    border: 'none', background: 'transparent', color: 'rgba(232,232,255,0.6)',
    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))',
    color: '#fff',
  },
  panel: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, opacity: 0.7 },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8e8ff', fontSize: 13, resize: 'vertical',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8e8ff', fontSize: 13,
    outline: 'none', fontFamily: 'inherit',
  },
  select: {
    padding: '8px 12px', borderRadius: 6,
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8e8ff', fontSize: 13, outline: 'none',
    cursor: 'pointer', minWidth: 140,
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#fff', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
  },
  secondaryBtn: {
    padding: '6px 14px', borderRadius: 6,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(232,232,255,0.7)', fontSize: 12, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  resultBox: {
    background: 'rgba(0,0,0,0.3)', borderRadius: 8,
    border: '1px solid rgba(139,92,246,0.2)', overflow: 'hidden',
  },
  resultHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', background: 'rgba(139,92,246,0.1)',
    borderBottom: '1px solid rgba(139,92,246,0.2)',
  },
  resultText: { padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  iconBtn: {
    padding: 4, borderRadius: 4, border: 'none',
    background: 'rgba(255,255,255,0.1)', color: '#e8e8ff',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
  },
}
