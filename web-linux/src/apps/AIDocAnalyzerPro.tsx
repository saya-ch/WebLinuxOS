import { useState, useCallback, useEffect, useRef } from 'react'
import {
  FileText, Sparkles, Loader2, Copy, Check, Download, History,
  Trash2, Eye, EyeOff, Languages, ListChecks, Smile,
  UserCog, RefreshCw, X, Type, Zap, AlertCircle,
  BookOpen, PenTool, BarChart3,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type AnalysisMode = 'summary' | 'keypoints' | 'sentiment' | 'entities' | 'translate' | 'rewrite'

interface ModeConfig {
  key: AnalysisMode
  label: string
  icon: React.ReactNode
  prompt: (text: string, extra?: string) => string
  color: string
  desc: string
}

interface HistoryItem {
  id: string
  mode: AnalysisMode
  modeLabel: string
  input: string
  output: string
  timestamp: number
  charCount: number
}

const TRANSLATE_LANGS = [
  { label: '英语', code: 'en' },
  { label: '日语', code: 'ja' },
  { label: '韩语', code: 'ko' },
  { label: '法语', code: 'fr' },
  { label: '德语', code: 'de' },
  { label: '西班牙语', code: 'es' },
  { label: '俄语', code: 'ru' },
  { label: '粤语', code: 'yue' },
]

const HISTORY_KEY = 'ai-doc-analyzer-pro-history'
const MAX_HISTORY = 50

const MODES: ModeConfig[] = [
  {
    key: 'summary',
    label: '智能摘要',
    icon: <BookOpen size={16} />,
    color: '#6366f1',
    desc: '生成简明扼要的文本摘要',
    prompt: (text) => `请对以下文本进行智能摘要，提炼核心内容，生成一段简洁流畅的摘要（200字以内）。\n\n文本：\n${text}`,
  },
  {
    key: 'keypoints',
    label: '关键要点',
    icon: <ListChecks size={16} />,
    color: '#10b981',
    desc: '提取文档核心要点',
    prompt: (text) => `请从以下文本中提取关键要点，以条目形式列出，每条要点用简洁的语句表达，不超过10条。\n\n文本：\n${text}`,
  },
  {
    key: 'sentiment',
    label: '情感分析',
    icon: <Smile size={16} />,
    color: '#f59e0b',
    desc: '分析文本情感倾向',
    prompt: (text) => `请对以下文本进行情感分析，判断情感倾向（正面/负面/中性/混合），并给出置信度和关键情感词。输出格式：\n情感倾向：\n置信度：\n关键情感词：\n详细分析：\n\n文本：\n${text}`,
  },
  {
    key: 'entities',
    label: '实体识别',
    icon: <UserCog size={16} />,
    color: '#8b5cf6',
    desc: '识别人名、地名、组织名',
    prompt: (text) => `请从以下文本中识别所有命名实体，分类列出（人名、地名、组织名、日期、其他）。输出格式：\n【人名】：\n【地名】：\n【组织名】：\n【日期/时间】：\n【其他实体】：\n\n文本：\n${text}`,
  },
  {
    key: 'translate',
    label: '翻译',
    icon: <Languages size={16} />,
    color: '#0ea5e9',
    desc: '多语言翻译支持',
    prompt: (text, targetLang = 'en') => {
      const langName = TRANSLATE_LANGS.find(l => l.code === targetLang)?.label || '英文'
      return `请将以下文本翻译成${langName}，要求准确、自然、符合目标语言表达习惯。仅输出翻译结果，不要解释。\n\n文本：\n${text}`
    },
  },
  {
    key: 'rewrite',
    label: '改写润色',
    icon: <PenTool size={16} />,
    color: '#ec4899',
    desc: '文本优化建议',
    prompt: (text) => `请对以下文本进行改写润色，使其语言更加流畅、专业、优雅。同时提供3条改进建议。输出格式：\n【润色后文本】：\n【改进建议】：\n\n文本：\n${text}`,
  },
]

const SAMPLE_TEXT = `人工智能正在深刻改变我们的生活方式。从智能手机上的语音助手到自动驾驶汽车，从医疗诊断到金融风控，AI技术已经渗透到各个行业。特别是在过去的几年里，大语言模型的突破使得AI具备了理解和生成人类语言的能力。

然而，我们也需要关注AI带来的挑战。数据隐私、算法偏见、就业结构变化等问题都需要认真对待。只有在创新和规范之间找到平衡，才能让AI真正造福人类社会。

未来，人机协作将成为主流趋势。AI不会完全取代人类，而是成为强大的辅助工具，帮助我们做出更好的决策，创造更大的价值。`

async function pollinateText(prompt: string, timeout = 60000): Promise<string> {
  const url = `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(prompt)}?model=${API_CONFIG.pollinations.defaultModel}&seed=-1&temperature=0.7`
  const res = await fetchWithTimeout(url, { headers: { 'Accept': 'text/plain' } }, timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

export default function AIDocAnalyzerPro() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<AnalysisMode>('summary')
  const [output, setOutput] = useState('')
  const [displayedOutput, setDisplayedOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [translateLang, setTranslateLang] = useState('en')
  const [showStats, setShowStats] = useState(true)
  const [autoRun, setAutoRun] = useState(false)
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current)
    }
  }, [])

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, MAX_HISTORY)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {}
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const startTypewriter = useCallback((text: string) => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current)
    setDisplayedOutput('')
    let i = 0
    const speed = Math.max(8, Math.min(25, Math.floor(text.length / 120)))
    const tick = () => {
      if (i < text.length) {
        const chunk = Math.max(1, Math.floor((text.length - i) / Math.max(1, speed * 2)) * speed)
        i = Math.min(text.length, i + chunk)
        setDisplayedOutput(text.slice(0, i))
        typewriterRef.current = setTimeout(tick, 30)
      } else {
        setDisplayedOutput(text)
      }
    }
    tick()
  }, [])

  const runAnalysis = useCallback(async () => {
    const text = input.trim()
    if (!text) {
      setError('请输入文本内容后再开始分析')
      return
    }
    setError('')
    setLoading(true)
    setOutput('')
    setDisplayedOutput('')

    const modeConfig = MODES.find(m => m.key === mode)!
    const prompt = modeConfig.prompt(text, mode === 'translate' ? translateLang : undefined)

    try {
      const result = await pollinateText(prompt)
      const cleanResult = result.trim()
      setOutput(cleanResult)
      startTypewriter(cleanResult)
      saveHistory({
        id: Math.random().toString(36).slice(2),
        mode,
        modeLabel: modeConfig.label,
        input: text.slice(0, 100),
        output: cleanResult,
        timestamp: Date.now(),
        charCount: text.length,
      })
    } catch (e) {
      const errMsg = handleApiError(e, 'AI 文档分析')
      setError(errMsg)
      setOutput('')
      setDisplayedOutput('')
    } finally {
      setLoading(false)
    }
  }, [input, mode, translateLang, startTypewriter, saveHistory])

  const copyOutput = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const exportResult = () => {
    if (!output) return
    const content = `【${MODES.find(m => m.key === mode)?.label}】\n\n原文：\n${input}\n\n结果：\n${output}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-doc-analyzer-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode)
    setInput(item.input)
    setOutput(item.output)
    setDisplayedOutput(item.output)
    setShowHistory(false)
  }

  const charCount = input.length
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0
  const lineCount = input ? input.split('\n').length : 0

  const colors = {
    bg: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2a 50%, #1a0f3a 100%)',
    text: '#e8e8ff',
    textSecondary: '#8080b0',
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(255,255,255,0.08)',
    accent: '#818cf8',
    accent2: '#22d3ee',
  }

  const currentMode = MODES.find(m => m.key === mode)!

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{
      background: colors.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', sans-serif",
      color: colors.text,
    }}>
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{
        background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))',
        borderBottom: `1px solid ${colors.glassBorder}`,
        backdropFilter: 'blur(10px)',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}>
            <FileText size={20} color="#fff" />
          </div>
          <div>
            <div className="text-base font-bold" style={{
              background: 'linear-gradient(135deg, #818cf8, #22d3ee)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              AI 文档分析器 · Pro
            </div>
            <div className="text-[11px]" style={{ color: colors.textSecondary }}>
              Pollinations AI 驱动 · 智能摘要 · 情感分析 · 实体识别 · 翻译润色
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
            style={{
              background: colors.glass,
              color: colors.textSecondary,
              border: `1px solid ${colors.glassBorder}`,
            }}
            title="切换统计信息"
          >
            {showStats ? <EyeOff size={12} /> : <Eye size={12} />}
            统计
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90 relative"
            style={{
              background: colors.glass,
              color: colors.textSecondary,
              border: `1px solid ${colors.glassBorder}`,
            }}
          >
            <History size={12} /> 历史
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center" style={{
                background: '#6366f1',
                color: '#fff',
              }}>
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>
          <button
            onClick={runAnalysis}
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: (loading || !input.trim()) ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              color: '#fff',
              border: 'none',
              boxShadow: (loading || !input.trim()) ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
            {loading ? '分析中...' : '开始分析'}
          </button>
          {output && !loading && (
            <>
              <button
                onClick={copyOutput}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  background: colors.glass,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.glassBorder}`,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={exportResult}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <Download size={12} /> 导出
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ borderRight: `1px solid ${colors.glassBorder}` }}>
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
            <div className="flex items-center gap-2">
              <Type size={14} style={{ color: colors.accent }} />
              <span className="text-sm font-semibold">文本输入</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: colors.glass, color: colors.textSecondary }}>
                {lineCount} 行
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: colors.textSecondary }}>
                <input
                  type="checkbox"
                  checked={autoRun}
                  onChange={e => setAutoRun(e.target.checked)}
                  style={{ accentColor: colors.accent }}
                />
                自动分析
              </label>
              <button
                onClick={() => { setInput(''); setOutput(''); setDisplayedOutput(''); setError('') }}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-all hover:opacity-90"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <Trash2 size={11} /> 清空
              </button>
              <button
                onClick={() => setInput(SAMPLE_TEXT)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-all hover:opacity-90"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  color: colors.accent,
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <BookOpen size={11} /> 示例
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value)
                if (autoRun && e.target.value.trim()) {
                  clearTimeout((window as any).__autoRunTimer)
                  ;(window as any).__autoRunTimer = setTimeout(() => {
                    runAnalysis()
                  }, 1500)
                }
              }}
              spellCheck={false}
              placeholder="粘贴或输入需要分析的文本内容...&#10;&#10;支持多语言，AI 将自动识别并分析"
              className="flex-1 p-4 outline-none resize-none"
              style={{
                fontSize: 14,
                lineHeight: '24px',
                tabSize: 2,
                background: 'transparent',
                color: '#d4d4ff',
                caretColor: colors.accent,
              }}
            />
          </div>

          {showStats && (
            <div className="flex items-center gap-4 px-4 py-2 flex-shrink-0" style={{
              borderTop: `1px solid ${colors.glassBorder}`,
              background: 'rgba(0,0,0,0.25)',
            }}>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                <BarChart3 size={11} />
                字符: <span style={{ color: colors.accent, fontWeight: 600 }}>{charCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                <Zap size={11} />
                词数: <span style={{ color: colors.accent2, fontWeight: 600 }}>{wordCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
                <FileText size={11} />
                行数: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{lineCount}</span>
              </div>
              <div className="flex-1" />
              <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                Pollinations AI · 免费公共 API
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 520 }}>
          <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.glassBorder}` }}>
            <div className="text-sm font-semibold mb-2">选择分析模式</div>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setError('') }}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: mode === m.key ? `linear-gradient(135deg, ${m.color}25, ${m.color}15)` : colors.glass,
                    border: `1px solid ${mode === m.key ? m.color + '60' : colors.glassBorder}`,
                    color: mode === m.key ? m.color : colors.textSecondary,
                    boxShadow: mode === m.key ? `0 0 12px ${m.color}20` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="text-[10px] mt-1.5" style={{ color: colors.textSecondary }}>
              {currentMode.desc}
            </div>

            {mode === 'translate' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px]" style={{ color: colors.textSecondary }}>目标语言：</span>
                <select
                  value={translateLang}
                  onChange={e => setTranslateLang(e.target.value)}
                  className="text-[11px] px-2 py-1 rounded-md outline-none flex-1"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${colors.glassBorder}`,
                    color: colors.accent,
                  }}
                >
                  {TRANSLATE_LANGS.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{
              borderBottom: `1px solid ${colors.glassBorder}`,
              background: 'rgba(0,0,0,0.15)',
            }}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: currentMode.color }} />
                <span className="text-sm font-semibold">分析结果</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                  background: currentMode.color + '20',
                  color: currentMode.color,
                }}>
                  {currentMode.label}
                </span>
              </div>
              {displayedOutput && !loading && displayedOutput.length < (output?.length || 0) && (
                <span className="text-[10px] flex items-center gap-1" style={{ color: colors.textSecondary }}>
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                  打字中...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              {error && (
                <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div className="text-xs leading-relaxed">{error}</div>
                </div>
              )}

              {loading && !displayedOutput && (
                <div className="flex flex-col items-center justify-center py-20" style={{ color: colors.textSecondary }}>
                  <Loader2 size={36} style={{ color: currentMode.color, animation: 'spin 1.5s linear infinite' }} />
                  <div className="mt-3 text-sm font-medium" style={{ color: colors.text }}>
                    AI 正在分析文本...
                  </div>
                  <div className="mt-1 text-[11px]">
                    使用 Pollinations AI 引擎
                  </div>
                  <div className="flex gap-1.5 mt-4">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: currentMode.color,
                          animation: `bounce 1.2s ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!loading && !displayedOutput && !error && (
                <div className="flex flex-col items-center justify-center py-20" style={{ color: colors.textSecondary }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{
                    background: `linear-gradient(135deg, ${colors.glass}, ${colors.glass})`,
                    border: `1px solid ${colors.glassBorder}`,
                  }}>
                    {currentMode.icon}
                  </div>
                  <div className="text-sm font-medium" style={{ color: colors.text }}>
                    {currentMode.label}
                  </div>
                  <div className="mt-1 text-[12px] text-center max-w-[240px]">
                    在左侧输入文本，选择分析模式，点击"开始分析"按钮
                  </div>
                </div>
              )}

              {displayedOutput && (
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: '#e0e0ff' }}
                >
                  {displayedOutput}
                  {loading && displayedOutput.length >= (output?.length || 0) && (
                    <span className="inline-block w-2 h-4 ml-0.5" style={{
                      background: currentMode.color,
                      animation: 'blink 1s step-end infinite',
                    }} />
                  )}
                </div>
              )}
            </div>

            {displayedOutput && !loading && (
              <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{
                borderTop: `1px solid ${colors.glassBorder}`,
                background: 'rgba(0,0,0,0.15)',
              }}>
                <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                  结果共 {displayedOutput.length} 字符
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startTypewriter(output)}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-all hover:opacity-90"
                    style={{
                      background: colors.glass,
                      color: colors.textSecondary,
                      border: `1px solid ${colors.glassBorder}`,
                    }}
                  >
                    <RefreshCw size={11} /> 重播
                  </button>
                  <button
                    onClick={() => setDisplayedOutput(output)}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-all hover:opacity-90"
                    style={{
                      background: colors.glass,
                      color: colors.textSecondary,
                      border: `1px solid ${colors.glassBorder}`,
                    }}
                  >
                    跳过
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="absolute top-[60px] right-4 bottom-4 w-80 rounded-xl overflow-hidden flex flex-col" style={{
          background: 'linear-gradient(180deg, #12122a, #0f0f20)',
          border: `1px solid ${colors.glassBorder}`,
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{
            borderBottom: `1px solid ${colors.glassBorder}`,
          }}>
            <div className="flex items-center gap-2">
              <History size={16} style={{ color: colors.accent }} />
              <span className="text-sm font-semibold">历史记录</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                background: colors.glass,
                color: colors.textSecondary,
              }}>
                {history.length} 条
              </span>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <Trash2 size={10} /> 清空
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center justify-center w-6 h-6 rounded-md transition-all hover:opacity-90"
                style={{
                  background: colors.glass,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.glassBorder}`,
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4" style={{ color: colors.textSecondary }}>
                <History size={32} style={{ opacity: 0.4 }} />
                <div className="mt-3 text-xs">暂无历史记录</div>
                <div className="mt-1 text-[10px] text-center">分析过的文本将会自动保存在这里</div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg transition-all cursor-pointer group"
                    style={{
                      background: colors.glass,
                      border: `1px solid ${colors.glassBorder}`,
                    }}
                    onClick={() => loadHistoryItem(item)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = colors.glass
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{
                        background: `${getModeColor(item.mode)}20`,
                        color: getModeColor(item.mode),
                      }}>
                        {item.modeLabel}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id) }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <div className="text-xs line-clamp-2" style={{ color: colors.textSecondary }}>
                      {item.input}
                    </div>
                    <div className="text-[10px] mt-1 flex items-center justify-between" style={{ color: colors.textSecondary }}>
                      <span>{new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                      <span>{item.charCount} 字</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      `}</style>
    </div>
  )
}

function getModeColor(mode: AnalysisMode): string {
  return MODES.find(m => m.key === mode)?.color || '#6366f1'
}