import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Sparkles,
  Wand2,
  Code,
  Languages,
  FileText,
  Brain,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Download,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Zap,
  ChevronRight,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

/* ───────────────────────── 类型 & 常量 ───────────────────────── */
type TabKey = 'chat' | 'image' | 'code' | 'translate' | 'summarize'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
}

const TEXT_PRESETS = [
  { label: '创意写作', prompt: '你是一位创意写作专家，擅长小说、散文和诗歌创作。请用优美、生动的语言进行创作。' },
  { label: '技术顾问', prompt: '你是一位资深软件工程师和架构师，擅长系统设计、代码优化和技术方案分析。回答请准确、简洁、专业。' },
  { label: '商务写作', prompt: '你是一位专业的商务文案撰写专家，擅长邮件、报告、计划书写作。风格正式、专业、有说服力。' },
  { label: '英语老师', prompt: '你是一位耐心的英语教学专家，擅长语法解释、词汇教学和写作指导。请用中英双语回答。' },
  { label: '翻译官', prompt: '你是一位专业的翻译专家，精通中英互译，也能处理其他常见语言。翻译要求准确、流畅、符合目标语言表达习惯。' },
  { label: '代码审查', prompt: '你是一位资深代码审查专家，擅长发现代码中的 bug、性能问题和架构缺陷。输出请包含问题描述、严重程度和改进建议。' },
]

const IMAGE_STYLES = [
  { label: '写实摄影', value: 'photorealistic, professional photography, 8k, ultra detailed' },
  { label: '赛博朋克', value: 'cyberpunk, neon lights, futuristic city, cinematic lighting, highly detailed' },
  { label: '水彩画', value: 'watercolor painting, soft colors, artistic, painterly' },
  { label: '动漫插画', value: 'anime style, illustration, vibrant colors, detailed, masterpiece' },
  { label: '概念艺术', value: 'concept art, digital painting, epic, cinematic, fantasy' },
  { label: '3D 渲染', value: '3d render, octane render, unreal engine, photorealistic, studio lighting' },
  { label: '像素艺术', value: 'pixel art, 16-bit style, retro game aesthetic, detailed' },
  { label: '极简主义', value: 'minimalist, clean composition, pastel colors, elegant, simple' },
]

const IMAGE_SIZES = [
  { label: '1:1 方形', w: 1024, h: 1024 },
  { label: '3:4 竖图', w: 768, h: 1024 },
  { label: '9:16 手机', w: 720, h: 1280 },
  { label: '4:3 横图', w: 1024, h: 768 },
  { label: '16:9 宽屏', w: 1280, h: 720 },
  { label: '21:9 超宽', w: 1792, h: 768 },
]

const TRANSLATE_LANGS = [
  { label: '中文', code: 'zh' },
  { label: '英语', code: 'en' },
  { label: '日语', code: 'ja' },
  { label: '韩语', code: 'ko' },
  { label: '法语', code: 'fr' },
  { label: '德语', code: 'de' },
  { label: '西班牙语', code: 'es' },
  { label: '俄语', code: 'ru' },
]

/* ───────────────────────── 主组件 ───────────────────────── */
export default function PollinationsAI() {
  const [tab, setTab] = useState<TabKey>('chat')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(150deg, #05051a 0%, #0f0f2a 50%, #181040 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(139,92,246,0.18)',
        background: 'rgba(10,10,25,0.6)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(168,85,247,0.5)',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Pollinations · 智能创作中心
            </div>
            <div style={{ fontSize: 11, color: '#8b8bbf', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={11} style={{ color: '#a855f7' }} />
              基于 pollinations.ai 免费公开 API · 零配置直连
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: 12, padding: 4,
          border: '1px solid rgba(255,255,255,0.06)',
          gap: 2,
        }}>
          {[
            { k: 'chat', label: '智能对话', icon: <MessageSquare size={14} /> },
            { k: 'image', label: 'AI 绘图', icon: <ImageIcon size={14} /> },
            { k: 'code', label: '代码生成', icon: <Code size={14} /> },
            { k: 'translate', label: '翻译', icon: <Languages size={14} /> },
            { k: 'summarize', label: '总结/写作', icon: <FileText size={14} /> },
          ].map(t => (
            <button key={t.k}
              onClick={() => setTab(t.k as TabKey)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9, fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                border: 'none', color: tab === t.k ? '#fff' : '#8b8bbf',
                background: tab === t.k
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.35) 100%)'
                  : 'transparent',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (tab !== t.k) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                if (tab !== t.k) e.currentTarget.style.background = 'transparent'
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'chat' && <ChatPanel showToast={showToast} />}
        {tab === 'image' && <ImagePanel showToast={showToast} />}
        {tab === 'code' && <CodePanel showToast={showToast} />}
        {tab === 'translate' && <TranslatePanel showToast={showToast} />}
        {tab === 'summarize' && <SummarizePanel showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)',
          padding: '10px 16px', background: 'rgba(16,185,129,0.95)',
          color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          display: 'flex', alignItems: 'center', gap: 6, zIndex: 999,
          animation: 'toastIn 0.25s ease-out',
        }}>
          <Check size={14} />
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform: translate(-50%, 10px);} to {opacity:1; transform: translate(-50%,0);} }`}</style>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 共享组件 ───────────────────────── */
function CopyButton({ text, showToast }: { text: string; showToast: (m: string) => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showToast('已复制到剪贴板')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('复制失败')
    }
  }
  return (
    <button onClick={copy} title="复制" style={iconBtnStyle}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#b9b9e5',
  padding: 6,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
}

/* ───────────────────────── 文本生成辅助（Pollinations Text API） ───────────────────────── */
async function pollinateText(prompt: string, systemPrompt = '', model = 'openai', timeout = 60000): Promise<string> {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const res = await fetchWithTimeout(
    `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?model=${model}&seed=-1&temperature=0.7`,
    { headers: { 'Accept': 'text/plain' } },
    timeout,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

/* ───────────────────────── 1. 对话面板 ───────────────────────── */
function ChatPanel({ showToast }: { showToast: (m: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 Pollinations AI 智能助手。我可以回答问题、帮你写作、写代码、翻译等等。试试问我任何问题吧！',
      timestamp: new Date(),
      model: 'openai',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [systemIdx, setSystemIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user', content, timestamp: new Date(),
    }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const resp = await pollinateText(content, TEXT_PRESETS[systemIdx].prompt)
      setMessages(m => [...m, {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: resp || '(空回复)',
        timestamp: new Date(),
        model: 'pollinations',
      }])
    } catch (e) {
      setMessages(m => [...m, {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: `⚠️ 请求失败：${handleApiError(e, 'AI 对话')}`,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, systemIdx])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧预设 */}
      <div style={{
        width: 220, padding: 16,
        borderRight: '1px solid rgba(139,92,246,0.12)',
        background: 'rgba(10,10,25,0.4)',
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#8b8bbf',
          marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Settings size={12} /> 角色预设
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TEXT_PRESETS.map((p, i) => (
            <button key={p.label}
              onClick={() => setSystemIdx(i)}
              style={{
                padding: '9px 12px', borderRadius: 10, textAlign: 'left',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: '1px solid',
                borderColor: systemIdx === i ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.05)',
                background: systemIdx === i
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(99,102,241,0.12))'
                  : 'rgba(255,255,255,0.02)',
                color: systemIdx === i ? '#e9d5ff' : '#c4c4e5',
                transition: 'all 0.18s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#8b8bbf',
            marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Lightbulb size={12} /> 示例提问
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '用三句话解释什么是 Transformer 模型',
              '写一段优雅的 TypeScript 单例模式实现',
              '以"月光下的城市"为题写一首短诗',
              '帮我分析 REST vs GraphQL 的优缺点',
            ].map(q => (
              <button key={q}
                onClick={() => setInput(q)}
                style={{
                  padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                  fontSize: 11, background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.12)',
                  color: '#b5b5dd', cursor: 'pointer',
                  lineHeight: 1.5,
                }}
              >
                <ChevronRight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 中间对话区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div ref={scrollRef} style={{
          flex: 1, padding: 20, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {messages.map(m => (
            <div key={m.id} style={{
              display: 'flex', gap: 10, maxWidth: '88%',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'linear-gradient(135deg, #ec4899, #a855f7)',
              }}>
                {m.role === 'user' ? '我' : <Brain size={14} />}
              </div>
              <div style={{
                padding: '12px 14px', borderRadius: 14,
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${m.role === 'user' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                fontSize: 13.5, lineHeight: 1.75, color: '#ececff',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                position: 'relative',
              }}>
                {m.content}
                {m.role === 'assistant' && !m.content.startsWith('⚠️') && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
                    <CopyButton text={m.content} showToast={showToast} />
                    <button onClick={() => showToast('感谢反馈！')} style={iconBtnStyle} title="有用"><ThumbsUp size={14} /></button>
                    <button onClick={() => showToast('感谢反馈！')} style={iconBtnStyle} title="有待改进"><ThumbsDown size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 5,
              }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 7, height: 7, borderRadius: 99,
                    background: '#a855f7',
                    animation: `bounce 1.2s ${i*0.15}s infinite`,
                  }}>
                    <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6); opacity:.4} 40%{transform:scale(1); opacity:1} }`}</style>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid rgba(139,92,246,0.12)',
          background: 'rgba(10,10,25,0.5)',
        }}>
          <div style={{
            display: 'flex', gap: 10, padding: 8,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              }}
              placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
              rows={1}
              style={{
                flex: 1, resize: 'none', maxHeight: 180,
                background: 'transparent', border: 'none', outline: 'none',
                color: '#ececff', fontSize: 13.5, lineHeight: 1.6,
                fontFamily: 'inherit', padding: '6px 8px',
              }}
            />
            <button
              onClick={send} disabled={!input.trim() || loading}
              style={{
                padding: '0 18px', borderRadius: 10,
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 600,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                  : 'rgba(255,255,255,0.06)',
                color: input.trim() && !loading ? '#fff' : '#6a6a9a',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
                boxShadow: input.trim() && !loading ? '0 0 20px rgba(168,85,247,0.4)' : 'none',
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronRight size={16} />}
              {loading ? '思考中' : '发送'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#6a6a9a', marginTop: 8, textAlign: 'center' }}>
            当前角色：{TEXT_PRESETS[systemIdx].label} · 每次对话独立无历史，如需上下文请在提问中说明
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 2. AI 绘画面板 ───────────────────────── */
function ImagePanel({ showToast }: { showToast: (m: string) => void }) {
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('low quality, blurry, distorted, ugly, watermark, text')
  const [styleIdx, setStyleIdx] = useState(0)
  const [sizeIdx, setSizeIdx] = useState(0)
  const [seed, setSeed] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<{ url: string; prompt: string; time: number } | null>(null)
  const [history, setHistory] = useState<{ url: string; prompt: string; time: number }[]>([])

  const size = IMAGE_SIZES[sizeIdx]
  const style = IMAGE_STYLES[styleIdx]

  const generate = useCallback(async () => {
    const p = prompt.trim()
    if (!p) { showToast('请输入提示词'); return }
    setLoading(true)
    const realSeed = seed === -1 ? Math.floor(Math.random() * 1_000_000) : seed
    const fullPrompt = `${p}, ${style.value}`
    const url = `${API_CONFIG.pollinations.imageBaseUrl}/${encodeURIComponent(fullPrompt)}?width=${size.w}&height=${size.h}&seed=${realSeed}&model=${API_CONFIG.pollinations.imageModel}&nologo=true&enhance=true`
    try {
      // 预加载，等图片加载完再展示
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        const t = setTimeout(() => reject(new Error('图片加载超时')), 60000)
        img.onload = () => { clearTimeout(t); resolve() }
        img.onerror = () => { clearTimeout(t); reject(new Error('图片加载失败')) }
        img.src = url
      })
      const rec = { url, prompt: p, time: Date.now() }
      setCurrent(rec)
      setHistory(h => [rec, ...h].slice(0, 12))
      showToast('图像生成成功！')
    } catch (e) {
      showToast(`生成失败：${handleApiError(e, 'AI 绘图')}`)
    } finally {
      setLoading(false)
    }
  }, [prompt, style, size, seed, showToast])

  const download = () => {
    if (!current) return
    const a = document.createElement('a')
    a.href = current.url
    a.download = `pollinations-${current.time}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('开始下载图片')
  }

  return (
    <div style={{
      display: 'grid', gap: 0, height: '100%',
      gridTemplateColumns: '360px 1fr',
    }}>
      {/* 左侧参数 */}
      <div style={{
        padding: 20, overflowY: 'auto',
        borderRight: '1px solid rgba(139,92,246,0.12)',
        background: 'rgba(10,10,25,0.4)',
      }}>
        <Field label="提示词 (Prompt)" required>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="描述你想生成的图像，例如：一只穿着宇航服的柴犬在月球上漫步，电影感光线..."
            rows={4}
            style={taStyle}
          />
        </Field>

        <Field label="负面提示词 (Negative)">
          <textarea
            value={negative}
            onChange={e => setNegative(e.target.value)}
            rows={2}
            placeholder="不希望出现在画面中的元素..."
            style={taStyle}
          />
        </Field>

        <Field label={`风格预设 · ${style.label}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {IMAGE_STYLES.map((s, i) => (
              <button key={s.label} onClick={() => setStyleIdx(i)}
                style={{
                  padding: '8px 10px', fontSize: 11, borderRadius: 8,
                  fontWeight: 500, cursor: 'pointer',
                  background: styleIdx === i ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${styleIdx === i ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: styleIdx === i ? '#f9a8d4' : '#b5b5dd',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`尺寸 · ${size.label} (${size.w}×${size.h})`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {IMAGE_SIZES.map((s, i) => (
              <button key={s.label} onClick={() => setSizeIdx(i)}
                style={{
                  padding: '6px 8px', fontSize: 10, borderRadius: 6,
                  background: sizeIdx === i ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${sizeIdx === i ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: sizeIdx === i ? '#c7d2fe' : '#9a9acf',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`随机种子 ${seed === -1 ? '(随机)' : seed}`}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number" value={seed}
              onChange={e => setSeed(parseInt(e.target.value) || -1)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => setSeed(-1)} style={{
              padding: '0 12px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#b5b5dd', fontSize: 12,
            }} title="重置为随机">
              <RefreshCw size={13} />
            </button>
          </div>
        </Field>

        <button
          onClick={generate} disabled={loading}
          style={{
            width: '100%', marginTop: 8,
            padding: '14px 18px', borderRadius: 12,
            border: 'none', fontSize: 14, fontWeight: 700,
            background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
            color: loading ? '#6a6a9a' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 8px 28px rgba(168,85,247,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 生成中，约需 10-30 秒...</>
          ) : (
            <><Wand2 size={16} /> 立即生成图像</>
          )}
        </button>

        <div style={{
          marginTop: 14, padding: 10, borderRadius: 10,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.12)',
          fontSize: 11, color: '#8b8bbf', lineHeight: 1.65,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertCircle size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
          图像生成完全免费，由 Pollinations.ai 提供算力，不消耗本地资源。建议提示词包含：主体 + 风格 + 光线 + 细节。
        </div>
      </div>

      {/* 右侧展示 */}
      <div style={{
        padding: 20, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* 当前图 */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10,10,25,0.75)', zIndex: 5, gap: 12,
            }}>
              <Loader2 size={36} style={{ animation: 'spin 1.5s linear infinite', color: '#a855f7' }} />
              <div style={{ fontSize: 13, color: '#c4b5fd' }}>AI 正在创作 · 请稍候</div>
              <div style={{ fontSize: 11, color: '#8b8bbf' }}>一般需要 10 - 30 秒</div>
            </div>
          )}
          {current ? (
            <img src={current.url} alt={current.prompt} style={{
              maxWidth: '100%', maxHeight: '52vh',
              objectFit: 'contain', display: 'block',
            }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#6a6a9a', padding: '60px 20px' }}>
              <ImageIcon size={44} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
              <div style={{ fontSize: 13 }}>输入提示词，点击「立即生成图像」开始创作</div>
            </div>
          )}
        </div>

        {/* 当前操作栏 */}
        {current && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 11, color: '#6a6a9a', marginBottom: 4 }}>当前提示词</div>
              <div style={{
                padding: '10px 12px', borderRadius: 10, fontSize: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: '#c4c4e5', lineHeight: 1.65,
              }}>
                {current.prompt}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <CopyButton text={current.prompt} showToast={showToast} />
              <button onClick={() => { setPrompt(current.prompt); showToast('已载入提示词') }} style={iconBtnStyle} title="载入提示词">
                <RefreshCw size={14} />
              </button>
              <a href={current.url} target="_blank" rel="noreferrer" style={{ ...iconBtnStyle, textDecoration: 'none' }} title="在新窗口打开">
                <ImageIcon size={14} />
              </a>
              <button onClick={download} style={{
                ...iconBtnStyle, color: '#f9a8d4', borderColor: 'rgba(236,72,153,0.3)',
              }} title="下载">
                <Download size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 历史 */}
        {history.length > 1 && (
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#b9b9e5', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Sparkles size={13} style={{ color: '#f472b6' }} />
              生成历史（最近 {history.length} 张）
            </div>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))' }}>
              {history.slice(1).map((h, i) => (
                <button key={i} onClick={() => setCurrent(h)}
                  style={{
                    borderRadius: 10, overflow: 'hidden', padding: 0, border: 'none',
                    cursor: 'pointer', aspectRatio: `${size.w}/${size.h}`,
                    background: '#000', position: 'relative',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    transition: 'transform 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >
                  <img src={h.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{
      fontSize: 11, fontWeight: 600, color: '#a5a5d5',
      marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {label}
      {required && <span style={{ color: '#ec4899' }}>*</span>}
    </div>
    {children}
  </div>
)

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, outline: 'none',
  color: '#ececff', fontSize: 12.5,
  fontFamily: 'inherit',
}

const taStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical',
  minHeight: 40, lineHeight: 1.6,
}

/* ───────────────────────── 3. 代码生成面板 ───────────────────────── */
function CodePanel({ showToast }: { showToast: (m: string) => void }) {
  const [lang, setLang] = useState('TypeScript')
  const [req, setReq] = useState('实现一个 LRU 缓存类，支持 get / put，复杂度 O(1)')
  const [out, setOut] = useState('')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    if (!req.trim()) { showToast('请输入需求描述'); return }
    setLoading(true)
    try {
      const resp = await pollinateText(
        `请使用 ${lang} 实现以下需求，仅输出完整代码和必要注释，不要额外解释：\n\n${req}`,
        '你是一位资深程序员，擅长多种语言，输出规范、高效、可读的代码。',
      )
      setOut(resp)
      showToast('代码生成完成')
    } catch (e) {
      setOut(`// 生成失败：${handleApiError(e, '代码生成')}`)
    } finally {
      setLoading(false)
    }
  }, [lang, req, showToast])

  return (
    <div style={{
      display: 'grid', gap: 0, height: '100%',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* 输入 */}
      <div style={{
        padding: 20, borderRight: '1px solid rgba(139,92,246,0.12)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#c4c4e5' }}>
            编程语言
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'SQL', 'Bash', 'CSS'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  padding: '6px 12px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: lang === l ? 'rgba(0,214,193,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${lang === l ? 'rgba(0,214,193,0.45)' : 'rgba(255,255,255,0.06)'}`,
                  color: lang === l ? '#5eead4' : '#b5b5dd',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#c4c4e5' }}>
            需求描述
          </div>
          <textarea
            value={req} onChange={e => setReq(e.target.value)}
            style={{
              ...taStyle, flex: 1, fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={run} disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: 'none', fontSize: 13, fontWeight: 700,
              background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #10b981 0%, #00d6c1 100%)',
              color: loading ? '#6a6a9a' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,0.3)',
            }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Code size={15} />}
            {loading ? '代码生成中...' : '生成代码'}
          </button>
          <button onClick={() => setReq('')} style={{
            padding: '0 14px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#b5b5dd', fontSize: 12,
          }}>清空</button>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 11, color: '#6a6a9a', fontWeight: 600 }}>快捷需求：</div>
          {[
            '实现防抖和节流函数，并给出使用示例',
            '实现一个 Promise.all / Promise.race 的 Polyfill',
            '编写二分查找算法（含递归与迭代两种）',
            '设计一个线程安全的单例模式（使用你所选语言的惯用写法）',
          ].map(q => (
            <button key={q} onClick={() => setReq(q)}
              style={{
                padding: '7px 10px', fontSize: 11, textAlign: 'left',
                borderRadius: 8, background: 'rgba(0,214,193,0.05)',
                border: '1px solid rgba(0,214,193,0.1)',
                color: '#a5a5d5', cursor: 'pointer', lineHeight: 1.5,
              }}
            >
              <ChevronRight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 输出 */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#c4c4e5' }}>
            生成结果 {lang && <span style={{ fontSize: 10, color: '#6a6a9a', marginLeft: 6, fontWeight: 500 }}>· {lang}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CopyButton text={out} showToast={showToast} />
            <button onClick={run} disabled={loading} style={iconBtnStyle} title="重新生成">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div style={{
          flex: 1, borderRadius: 14, overflow: 'auto',
          background: 'linear-gradient(180deg, rgba(5,5,15,0.9), rgba(10,10,25,0.9))',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: 18,
        }}>
          <pre style={{
            margin: 0, fontSize: 12.5, lineHeight: 1.75,
            color: '#e0e0ff', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>{out || (loading ? (
            <span style={{ color: '#6a6a9a' }}>AI 正在编写 {lang} 代码...</span>
          ) : (
            <span style={{ color: '#55558a' }}>// 代码将在这里显示\n// 点击左侧「生成代码」开始</span>
          ))}</pre>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 4. 翻译面板 ───────────────────────── */
function TranslatePanel({ showToast }: { showToast: (m: string) => void }) {
  const [src, setSrc] = useState('auto')
  const [tgt, setTgt] = useState('en')
  const [input, setInput] = useState('人工智能正在深刻改变软件开发的方式。从代码补全到自动测试，从需求分析到部署运维，AI 正在重塑整个软件生命周期。')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    const q = input.trim()
    if (!q) { showToast('请输入待翻译文本'); return }
    setLoading(true)
    try {
      const sys = `你是一位专业翻译。请将用户输入从${src === 'auto' ? '自动识别的语言' : TRANSLATE_LANGS.find(l => l.code === src)?.label || ''}翻译成${TRANSLATE_LANGS.find(l => l.code === tgt)?.label || '目标语言'}。仅输出翻译后的文字，不要解释，不要加引号。`
      const resp = await pollinateText(q, sys)
      setOutput(resp.trim())
      showToast('翻译完成')
    } catch (e) {
      setOutput(`翻译失败：${handleApiError(e, 'AI 翻译')}`)
    } finally {
      setLoading(false)
    }
  }, [input, src, tgt, showToast])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
      height: '100%',
    }}>
      {/* 源 */}
      <div style={{
        padding: 20, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(139,92,246,0.12)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <select value={src} onChange={e => setSrc(e.target.value)}
            style={selectStyle}>
            <option value="auto">自动识别</option>
            {TRANSLATE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <div style={{ fontSize: 11, color: '#6a6a9a' }}>{input.length} 字</div>
        </div>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="在这里输入要翻译的文本..."
          style={{ ...taStyle, flex: 1, fontSize: 14, lineHeight: 1.75 }}
        />
      </div>

      {/* 目标 */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <select value={tgt} onChange={e => setTgt(e.target.value)}
            style={selectStyle}>
            {TRANSLATE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <CopyButton text={output} showToast={showToast} />
            <button onClick={() => { setInput(output); setOutput('') }} style={iconBtnStyle} title="交换">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div
          onClick={() => !loading && run()}
          style={{
            ...taStyle, flex: 1, cursor: loading ? 'wait' : (output ? 'text' : 'pointer'),
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontSize: 14, lineHeight: 1.75,
            display: 'flex', flexDirection: 'column',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', color: '#a855f7' }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              <span>AI 翻译中...</span>
            </div>
          ) : (
            output || <span style={{ color: '#55558a' }}>点击这里 / 使用下方按钮开始翻译</span>
          )}
        </div>
      </div>

      <div style={{
        gridColumn: '1 / span 2',
        padding: '10px 20px 20px',
        display: 'flex', gap: 10, justifyContent: 'center',
      }}>
        <button onClick={run} disabled={loading}
          style={{
            padding: '12px 32px', borderRadius: 12,
            border: 'none', fontSize: 13, fontWeight: 700,
            background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: loading ? '#6a6a9a' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.35)',
          }}
        >
          {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Languages size={15} />}
          {loading ? '翻译中...' : '立即翻译'}
        </button>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#ececff', padding: '6px 10px',
  borderRadius: 8, fontSize: 12, fontWeight: 600,
  outline: 'none', cursor: 'pointer',
}

/* ───────────────────────── 5. 总结 / 写作面板 ───────────────────────── */
function SummarizePanel({ showToast }: { showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'sum' | 'blog' | 'outline' | 'rewrite'>('sum')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    const q = input.trim()
    if (!q) { showToast('请输入文本'); return }
    setLoading(true)
    const prompts = {
      sum: ['请用中文对以下文本进行简洁、要点清晰的总结，不超过 300 字：\n\n' + q, '专业摘要写作助手，输出结构清晰、重点突出的摘要'],
      blog: ['请将以下核心内容扩展成一篇结构完整、有感染力的中文博客文章，包含标题、引言、分节要点和结语：\n\n' + q, '资深中文科技博客作者，擅长深入浅出的写作'],
      outline: ['请为以下主题设计一份条理清晰的文章/演讲大纲，分 3 个层级：\n\n' + q, '资深内容策划与编辑'],
      rewrite: ['请润色并重写以下文本，使其更加流畅、专业、优雅：\n\n' + q, '中文写作润色专家'],
    } as const
    try {
      const resp = await pollinateText(prompts[mode][0], prompts[mode][1])
      setOutput(resp)
      showToast('处理完成')
    } catch (e) {
      setOutput(`处理失败：${handleApiError(e, 'AI 写作')}`)
    } finally {
      setLoading(false)
    }
  }, [input, mode, showToast])

  const modes = [
    { k: 'sum', label: '文本摘要', icon: <FileText size={13} /> },
    { k: 'blog', label: '生成博文', icon: <Sparkles size={13} /> },
    { k: 'outline', label: '大纲规划', icon: <Lightbulb size={13} /> },
    { k: 'rewrite', label: '润色改写', icon: <Wand2 size={13} /> },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center', padding: '14px 20px',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
      }}>
        {modes.map(m => (
          <button key={m.k}
            onClick={() => setMode(m.k)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: mode === m.k
                ? 'linear-gradient(135deg, rgba(250,204,21,0.22), rgba(245,158,11,0.18))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === m.k ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.06)'}`,
              color: mode === m.k ? '#fde68a' : '#b5b5dd',
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        flex: 1, minHeight: 0,
      }}>
        <div style={{
          padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
          borderRight: '1px solid rgba(139,92,246,0.12)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#c4c4e5' }}>
              输入文本
            </span>
            <span style={{ fontSize: 11, color: '#6a6a9a' }}>{input.length} 字</span>
          </div>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder={
              mode === 'sum' ? '粘贴需要总结的长文本...'
              : mode === 'blog' ? '输入核心观点、关键词或摘要，让 AI 扩写为完整博文...'
              : mode === 'outline' ? '输入文章或演讲的主题，AI 会输出结构大纲...'
              : '粘贴需要润色的文本...'
            }
            style={{ ...taStyle, flex: 1, fontSize: 13, lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={run} disabled={loading}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                border: 'none', fontSize: 13, fontWeight: 700,
                background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                color: loading ? '#6a6a9a' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.3)',
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={15} />}
              {loading ? '处理中...' : (mode === 'sum' ? '生成摘要' : mode === 'blog' ? '生成博文' : mode === 'outline' ? '生成大纲' : '开始润色')}
            </button>
            <button onClick={() => { setInput(''); setOutput('') }} style={{
              padding: '0 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              color: '#b5b5dd', fontSize: 12,
            }}>清空</button>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#c4c4e5' }}>
              输出结果
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <CopyButton text={output} showToast={showToast} />
              <button onClick={run} disabled={loading} style={iconBtnStyle} title="重新生成">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div style={{
            flex: 1, borderRadius: 14, overflow: 'auto',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 20,
          }}>
            <div style={{
              fontSize: 13.5, lineHeight: 1.85, color: '#ececff',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {loading ? (
                <span style={{ color: '#a855f7', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  AI 正在工作中...
                </span>
              ) : output || (
                <span style={{ color: '#55558a' }}>处理结果将显示在这里。\n\n提示：\n• 摘要 — 适合论文、新闻、长文档、报告\n• 博文 — 输入少量关键词，AI 会完整扩写\n• 大纲 — 为文章 / 分享 / 培训课程建立结构\n• 润色 — 修复语病并提升文字质感</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
