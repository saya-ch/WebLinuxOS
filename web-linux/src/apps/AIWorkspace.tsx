import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Sparkles,
  MessageSquare,
  FileText,
  ListTodo,
  Code2,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  Brain,
  Wand2,
  Lightbulb,
  Save,
  Clock,
  Zap,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type TabKey = 'chat' | 'notes' | 'tasks' | 'code'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NoteItem {
  id: string
  content: string
  summary: string
  createdAt: number
}

interface TaskItem {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  done: boolean
  createdAt: number
}

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  explanation: string
  createdAt: number
}

const STORAGE_KEY = 'ai-workspace-state-v1'

const CHAT_PRESETS = [
  { label: '通用助手', prompt: '你是一位乐于助人的AI助手，擅长回答各种问题。回答要准确、简洁、有条理。' },
  { label: '技术专家', prompt: '你是一位资深的全栈软件工程师，精通前后端开发、架构设计和系统优化。回答要专业、深入、附带代码示例。' },
  { label: '写作顾问', prompt: '你是一位优秀的中文写作顾问，擅长文章润色、文案撰写和创意写作。语言要优美、流畅、有感染力。' },
  { label: '学习导师', prompt: '你是一位耐心的学习导师，擅长将复杂概念用简单易懂的方式解释。回答要循序渐进，适合初学者。' },
]

const SAMPLE_NOTES = [
  'AI正在改变软件开发的方式，从代码补全到自动测试，AI正在重塑整个软件生命周期。',
  'React 18 引入了并发特性、自动批处理、Suspense 等重要功能，显著提升了用户体验。',
  'TypeScript 的类型系统可以在编译时捕获大量错误，大幅提升代码质量和可维护性。',
]

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'SQL', 'CSS', 'Bash']

async function pollinateText(
  prompt: string,
  systemPrompt = '',
  model = 'openai',
  timeout = 60000,
): Promise<string> {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const res = await fetchWithTimeout(
    `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?model=${model}&seed=-1&temperature=0.7`,
    { headers: { Accept: 'text/plain' } },
    timeout,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

export default function AIWorkspace() {
  const [tab, setTab] = useState<TabKey>('chat')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(150deg, #05051a 0%, #0f0f2a 50%, #181040 100%)',
        color: '#e8e8ff',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(139,92,246,0.18)',
          background: 'rgba(10,10,25,0.6)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 22px rgba(168,85,247,0.5)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
              AI 智能工作台
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#8b8bbf',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Zap size={11} style={{ color: '#a855f7' }} />
              基于 Pollinations.ai 免费 API · 对话 · 笔记 · 任务 · 代码
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid rgba(255,255,255,0.06)',
            gap: 2,
          }}
        >
          {[
            { k: 'chat', label: 'AI 对话', icon: <MessageSquare size={14} /> },
            { k: 'notes', label: '笔记总结', icon: <FileText size={14} /> },
            { k: 'tasks', label: '任务规划', icon: <ListTodo size={14} /> },
            { k: 'code', label: '代码助手', icon: <Code2 size={14} /> },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as TabKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                color: tab === t.k ? '#fff' : '#8b8bbf',
                background:
                  tab === t.k
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.35) 100%)'
                    : 'transparent',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (tab !== t.k) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                if (tab !== t.k) e.currentTarget.style.background = 'transparent'
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'chat' && <ChatPanel showToast={showToast} />}
        {tab === 'notes' && <NotesPanel showToast={showToast} />}
        {tab === 'tasks' && <TasksPanel showToast={showToast} />}
        {tab === 'code' && <CodePanel showToast={showToast} />}
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 20,
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            background: 'rgba(16,185,129,0.95)',
            color: '#fff',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 999,
            animation: 'toastIn 0.25s ease-out',
          }}
        >
          <Check size={14} />
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform: translate(-50%, 10px);} to {opacity:1; transform: translate(-50%,0);} }`}</style>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 共享组件 ───────────────────────── */

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  outline: 'none',
  color: '#ececff',
  fontSize: 12.5,
  fontFamily: 'inherit',
}

const taStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 40,
  lineHeight: 1.6,
}

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

/* ───────────────────────── 1. AI 对话面板 ───────────────────────── */

function ChatPanel({ showToast }: { showToast: (m: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 AI 智能助手。我可以帮你回答问题、写作、编程、规划任务等。试试问我任何问题吧！',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [presetIdx, setPresetIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const resp = await pollinateText(content, CHAT_PRESETS[presetIdx].prompt)
      setMessages((m) => [
        ...m,
        {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: resp || '(空回复)',
          timestamp: new Date(),
        },
      ])
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: `⚠️ 请求失败：${handleApiError(e, 'AI 对话')}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, presetIdx])

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div
        style={{
          width: 220,
          padding: 16,
          borderRight: '1px solid rgba(139,92,246,0.12)',
          background: 'rgba(10,10,25,0.4)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#8b8bbf',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={12} /> 角色预设
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CHAT_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPresetIdx(i)}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: presetIdx === i ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.05)',
                background:
                  presetIdx === i
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(99,102,241,0.12))'
                    : 'rgba(255,255,255,0.02)',
                color: presetIdx === i ? '#e9d5ff' : '#c4c4e5',
                transition: 'all 0.18s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#8b8bbf',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Lightbulb size={12} /> 示例提问
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              '用三句话解释 Transformer 模型',
              '帮我写一段优雅的 TypeScript 单例',
              '以"城市夜景"为题写一首短诗',
              '分析 REST vs GraphQL 的优缺点',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  textAlign: 'left',
                  fontSize: 11,
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.12)',
                  color: '#b5b5dd',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                }}
              >
                <ChevronRight
                  size={11}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}
                />
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 10,
                maxWidth: '88%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'linear-gradient(135deg, #ec4899, #a855f7)',
                }}
              >
                {m.role === 'user' ? '我' : <Brain size={14} />}
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    m.role === 'user' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'
                  }`,
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  color: '#ececff',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  position: 'relative',
                }}
              >
                {m.content}
                {m.role === 'assistant' && !m.content.startsWith('⚠️') && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      marginTop: 10,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <CopyButton text={m.content} showToast={showToast} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                }}
              >
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: 5,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      background: '#a855f7',
                      animation: `bounce 1.2s ${i * 0.15}s infinite`,
                    }}
                  >
                    <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6); opacity:.4} 40%{transform:scale(1); opacity:1} }`}</style>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(139,92,246,0.12)',
            background: 'rgba(10,10,25,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: 8,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                maxHeight: 180,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ececff',
                fontSize: 13.5,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                padding: '6px 8px',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                padding: '0 18px',
                borderRadius: 10,
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 600,
                background:
                  input.trim() && !loading
                    ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'
                    : 'rgba(255,255,255,0.06)',
                color: input.trim() && !loading ? '#fff' : '#6a6a9a',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                boxShadow: input.trim() && !loading ? '0 0 20px rgba(168,85,247,0.4)' : 'none',
              }}
            >
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronRight size={16} />}
              {loading ? '思考中' : '发送'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#6a6a9a', marginTop: 8, textAlign: 'center' }}>
            当前角色：{CHAT_PRESETS[presetIdx].label}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 2. 笔记与总结面板 ───────────────────────── */

function NotesPanel({ showToast }: { showToast: (m: string) => void }) {
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw).notes || []
    } catch {}
    return []
  })
  const [input, setInput] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data.notes) setNotes(data.notes)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }))
    } catch {}
  }, [notes])

  const generateSummary = useCallback(async () => {
    const text = input.trim()
    if (!text) {
      showToast('请输入要总结的文本')
      return
    }
    setLoading(true)
    setSummary('')
    try {
      const resp = await pollinateText(
        `请对以下文本进行简洁、要点清晰的总结，用中文输出，不超过300字：\n\n${text}`,
        '专业摘要写作助手，输出结构清晰、重点突出的摘要。',
      )
      setSummary(resp)
    } catch (e) {
      setSummary(`⚠️ 总结失败：${handleApiError(e, '笔记总结')}`)
    } finally {
      setLoading(false)
    }
  }, [input, showToast])

  const saveNote = useCallback(() => {
    if (!summary) {
      showToast('请先生成总结')
      return
    }
    const note: NoteItem = {
      id: Math.random().toString(36).slice(2),
      content: input.trim(),
      summary,
      createdAt: Date.now(),
    }
    setNotes((prev) => [note, ...prev])
    setInput('')
    setSummary('')
    showToast('笔记已保存')
  }, [input, summary, showToast])

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    showToast('笔记已删除')
  }, [showToast])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: 20,
          borderRight: '1px solid rgba(139,92,246,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} style={{ color: '#a855f7' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>输入文本</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴或输入需要总结的文本..."
          style={{ ...taStyle, flex: 1, fontSize: 13, lineHeight: 1.7 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={generateSummary}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              background: loading
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
              color: loading ? '#6a6a9a' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.3)',
            }}
          >
            {loading ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Wand2 size={15} />
            )}
            {loading ? '总结中...' : '生成 AI 总结'}
          </button>
          <button
            onClick={() => {
              setInput('')
              setSummary('')
            }}
            style={{
              padding: '0 14px',
              borderRadius: 12,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#b5b5dd',
              fontSize: 12,
            }}
          >
            清空
          </button>
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#6a6a9a', fontWeight: 600, marginBottom: 6 }}>
            快速示例：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SAMPLE_NOTES.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                style={{
                  padding: '6px 10px',
                  fontSize: 11,
                  borderRadius: 8,
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  color: '#b5b5dd',
                  cursor: 'pointer',
                  textAlign: 'left',
                  maxWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <ChevronRight
                  size={10}
                  style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}
                />
                {s.slice(0, 20)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>AI 总结</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CopyButton text={summary} showToast={showToast} />
            <button
              onClick={saveNote}
              disabled={!summary}
              style={{
                ...iconBtnStyle,
                color: summary ? '#10b981' : '#6a6a9a',
                borderColor: summary ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
              }}
              title="保存笔记"
            >
              <Save size={14} />
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            borderRadius: 14,
            overflow: 'auto',
            background: 'linear-gradient(180deg, rgba(5,5,15,0.9), rgba(10,10,25,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.75,
              color: '#e0e0ff',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {summary || (loading ? <span style={{ color: '#6a6a9a' }}>AI 正在分析文本...</span> : <span style={{ color: '#55558a' }}>// 在左侧输入文本并点击"生成 AI 总结"</span>)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflow: 'auto' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#b9b9e5',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock size={13} style={{ color: '#8b8bbf' }} />
            历史笔记 ({notes.length})
          </div>
          {notes.length === 0 ? (
            <div style={{ fontSize: 11, color: '#55558a', textAlign: 'center', padding: 16 }}>
              还没有保存的笔记
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      color: '#c4c4e5',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.summary}
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      ...iconBtnStyle,
                      padding: 4,
                      flexShrink: 0,
                    }}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ fontSize: 10, color: '#6a6a9a', marginTop: 4 }}>
                  {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 3. 任务规划面板 ───────────────────────── */

function TasksPanel({ showToast }: { showToast: (m: string) => void }) {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw).tasks || []
    } catch {}
    return []
  })
  const [goal, setGoal] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data.tasks) setTasks(data.tasks)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const data = raw ? JSON.parse(raw) : {}
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, tasks }))
    } catch {}
  }, [tasks])

  const generatePlan = useCallback(async () => {
    const g = goal.trim()
    if (!g) {
      showToast('请输入你的目标')
      return
    }
    setLoading(true)
    setPlan('')
    try {
      const resp = await pollinateText(
        `请为以下目标制定详细的执行计划，将其分解为 5-8 个可执行的任务步骤，按优先级排序。用 Markdown 格式输出，每个任务包含：任务描述、优先级（高/中/低）、简要说明。\n\n目标：${g}`,
        '资深项目经理，擅长任务分解和执行规划。',
      )
      setPlan(resp)
    } catch (e) {
      setPlan(`⚠️ 规划失败：${handleApiError(e, '任务规划')}`)
    } finally {
      setLoading(false)
    }
  }, [goal, showToast])

  const addTask = useCallback((title: string) => {
    if (!title.trim()) return
    const task: TaskItem = {
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      description: '',
      priority: 'medium',
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [task, ...prev])
    showToast('任务已添加')
  }, [showToast])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    showToast('任务已删除')
  }, [showToast])

  const parsePlanToTasks = useCallback(() => {
    if (!plan) return
    const lines = plan.split('\n').filter((l) => l.trim())
    const newTasks: TaskItem[] = []
    for (const line of lines) {
      const match = line.match(/(?:[-*]\s*|\d+[\.\)、]\s*)(.+)/)
      if (match) {
        const title = match[1].replace(/[*_#>`]/g, '').trim()
        if (title.length > 3) {
          const priority = /高|high|urgent/i.test(line)
            ? 'high'
            : /低|low|nice-to-have/i.test(line)
              ? 'low'
              : 'medium'
          newTasks.push({
            id: Math.random().toString(36).slice(2),
            title,
            description: '',
            priority,
            done: false,
            createdAt: Date.now(),
          })
        }
      }
    }
    if (newTasks.length > 0) {
      setTasks((prev) => [...newTasks, ...prev])
      showToast(`已导入 ${newTasks.length} 个任务`)
    } else {
      showToast('未能从规划中解析任务')
    }
  }, [plan, showToast])

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      default:
        return '#10b981'
    }
  }

  const completedCount = tasks.filter((t) => t.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRight: '1px solid rgba(139,92,246,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>AI 规划助手</span>
          </div>
          <div style={{ fontSize: 12, color: '#8b8bbf', lineHeight: 1.6 }}>
            描述你的目标，AI 将为你制定详细的执行计划。
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例如：我要在两周内学会 React Hooks..."
            style={{ ...taStyle, minHeight: 80 }}
          />
          <button
            onClick={generatePlan}
            disabled={loading}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              background: loading
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: loading ? '#6a6a9a' : '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,0.3)',
            }}
          >
            {loading ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <ListTodo size={15} />
            )}
            {loading ? '生成计划中...' : '生成执行计划'}
          </button>

          <div
            style={{
              flex: 1,
              borderRadius: 14,
              overflow: 'auto',
              background: 'linear-gradient(180deg, rgba(5,5,15,0.9), rgba(10,10,25,0.9))',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#c4c4e5' }}>AI 规划结果</div>
              {plan && (
                <button
                  onClick={parsePlanToTasks}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#5eead4',
                  }}
                >
                  导入为任务
                </button>
              )}
            </div>
            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.75,
                color: '#e0e0ff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {plan || (loading ? <span style={{ color: '#6a6a9a' }}>AI 正在制定计划...</span> : <span style={{ color: '#55558a' }}>// 输入目标后点击按钮生成计划</span>)}
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ListTodo size={16} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>我的任务</span>
              <span style={{ fontSize: 11, color: '#6a6a9a' }}>
                ({completedCount}/{tasks.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="添加任务..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask((e.target as HTMLInputElement).value)
                }}
                style={{
                  ...inputStyle,
                  width: 160,
                  fontSize: 11,
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[placeholder="添加任务..."]')
                  if (input) {
                    addTask(input.value)
                    input.value = ''
                  }
                }}
                style={{
                  ...iconBtnStyle,
                  color: '#10b981',
                  borderColor: 'rgba(16,185,129,0.3)',
                }}
                title="添加任务"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.length === 0 ? (
              <div style={{ fontSize: 12, color: '#55558a', textAlign: 'center', padding: 40 }}>
                还没有任务，开始规划你的目标吧！
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: task.done
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${task.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: `2px solid ${task.done ? '#10b981' : '#4a4a7a'}`,
                      background: task.done ? '#10b981' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {task.done && <Check size={12} color="#fff" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: task.done ? '#6a6a9a' : '#e0e0ff',
                        textDecoration: task.done ? 'line-through' : 'none',
                        lineHeight: 1.5,
                      }}
                    >
                      {task.title}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: priorityColor(task.priority),
                      flexShrink: 0,
                    }}
                    title={`优先级: ${task.priority}`}
                  />
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      ...iconBtnStyle,
                      padding: 4,
                      flexShrink: 0,
                    }}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {tasks.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.12)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#8b8bbf',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={11} style={{ color: '#a855f7' }} /> 进度
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#6a6a9a', marginTop: 6 }}>
                {completedCount} / {tasks.length} 已完成
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 4. 代码助手面板 ───────────────────────── */

function CodePanel({ showToast }: { showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'generate' | 'explain'>('generate')
  const [lang, setLang] = useState('TypeScript')
  const [req, setReq] = useState('实现一个防抖函数 debounce，支持立即执行模式')
  const [code, setCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw).snippets || []
    } catch {}
    return []
  })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data.snippets) setSnippets(data.snippets)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const data = raw ? JSON.parse(raw) : {}
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, snippets }))
    } catch {}
  }, [snippets])

  const execute = useCallback(async () => {
    const text = req.trim()
    if (!text) {
      showToast('请输入需求或代码')
      return
    }
    setLoading(true)
    setCode('')
    setExplanation('')
    try {
      if (mode === 'generate') {
        const resp = await pollinateText(
          `请使用 ${lang} 实现以下需求，仅输出完整代码和必要注释，不要额外解释：\n\n${text}`,
          '资深程序员，输出规范、高效、可读的代码。',
        )
        setCode(resp)
      } else {
        const resp = await pollinateText(
          `请解释以下 ${lang} 代码的工作原理，说明关键逻辑、时间复杂度和可能的改进建议：\n\n\`\`\`${lang.toLowerCase()}\n${text}\n\`\`\``,
          '资深代码审查专家，擅长代码解释和分析。',
        )
        setExplanation(resp)
      }
    } catch (e) {
      if (mode === 'generate') {
        setCode(`// 生成失败：${handleApiError(e, '代码生成')}`)
      } else {
        setExplanation(`⚠️ 解释失败：${handleApiError(e, '代码解释')}`)
      }
    } finally {
      setLoading(false)
    }
  }, [mode, lang, req, showToast])

  const saveSnippet = useCallback(() => {
    const content = mode === 'generate' ? code : explanation
    if (!content) {
      showToast('没有可保存的内容')
      return
    }
    const snippet: CodeSnippet = {
      id: Math.random().toString(36).slice(2),
      title: req.trim().slice(0, 50) || '未命名',
      language: mode === 'generate' ? lang : 'markdown',
      code: mode === 'generate' ? code : '',
      explanation: mode === 'explain' ? explanation : '',
      createdAt: Date.now(),
    }
    setSnippets((prev) => [snippet, ...prev])
    showToast('代码片段已保存')
  }, [mode, lang, req, code, explanation, showToast])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
    showToast('片段已删除')
  }, [showToast])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: 20,
          borderRight: '1px solid rgba(139,92,246,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code2 size={16} style={{ color: '#06b6d4' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>代码助手</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
          }}
        >
          {[
            { k: 'generate', label: '生成代码', icon: <Wand2 size={13} /> },
            { k: 'explain', label: '解释代码', icon: <Brain size={13} /> },
          ].map((m) => (
            <button
              key={m.k}
              onClick={() => setMode(m.k as 'generate' | 'explain')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: mode === m.k ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.06)',
                background:
                  mode === m.k
                    ? 'rgba(6,182,212,0.15)'
                    : 'rgba(255,255,255,0.03)',
                color: mode === m.k ? '#67e8f9' : '#b5b5dd',
              }}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'generate' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#c4c4e5' }}>
              编程语言
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
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
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#c4c4e5' }}>
            {mode === 'generate' ? '需求描述' : '粘贴代码'}
          </div>
          <textarea
            value={req}
            onChange={(e) => setReq(e.target.value)}
            placeholder={
              mode === 'generate'
                ? '描述你想实现的功能...'
                : '粘贴需要解释的代码...'
            }
            style={{ ...taStyle, flex: 1, fontSize: 13 }}
          />
        </div>

        <button
          onClick={execute}
          disabled={loading}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            background: loading
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            color: loading ? '#6a6a9a' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: loading ? 'none' : '0 8px 24px rgba(14,165,233,0.3)',
          }}
        >
          {loading ? (
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : mode === 'generate' ? (
            <Code2 size={15} />
          ) : (
            <Brain size={15} />
          )}
          {loading ? '处理中...' : mode === 'generate' ? '生成代码' : '解释代码'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#6a6a9a', fontWeight: 600 }}>快捷需求：</div>
          {(mode === 'generate'
            ? [
                '实现防抖 debounce 函数，支持立即执行模式',
                '实现节流 throttle 函数，控制执行频率',
                '手写 Promise.all / Promise.race',
                '实现 LRU 缓存，get/put 复杂度 O(1)',
              ]
            : [
                '解释这段代码的工作原理和时间复杂度',
                '分析这段代码的递归逻辑',
                '说明这个算法的空间复杂度',
                '帮我找出潜在的 Bug 和性能问题',
              ]
          ).map((q) => (
            <button
              key={q}
              onClick={() => setReq(q)}
              style={{
                padding: '7px 10px',
                fontSize: 11,
                textAlign: 'left',
                borderRadius: 8,
                background: 'rgba(0,214,193,0.05)',
                border: '1px solid rgba(0,214,193,0.1)',
                color: '#a5a5d5',
                cursor: 'pointer',
                lineHeight: 1.5,
              }}
            >
              <ChevronRight
                size={11}
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}
              />
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#c4c4e5' }}>
              {mode === 'generate' ? '生成结果' : '代码解释'}
              <span style={{ fontSize: 10, color: '#6a6a9a', marginLeft: 6, fontWeight: 500 }}>
                · {mode === 'generate' ? lang : 'Markdown'}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <CopyButton text={mode === 'generate' ? code : explanation} showToast={showToast} />
            <button
              onClick={saveSnippet}
              disabled={mode === 'generate' ? !code : !explanation}
              style={{
                ...iconBtnStyle,
                color: (mode === 'generate' ? code : explanation) ? '#10b981' : '#6a6a9a',
                borderColor: (mode === 'generate' ? code : explanation) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
              }}
              title="保存代码片段"
            >
              <Save size={14} />
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            borderRadius: 14,
            overflow: 'auto',
            background: 'linear-gradient(180deg, rgba(5,5,15,0.9), rgba(10,10,25,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 18,
            marginBottom: 16,
          }}
        >
          {mode === 'generate' ? (
            <pre
              style={{
                margin: 0,
                fontSize: 12.5,
                lineHeight: 1.75,
                color: '#e0e0ff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            >
              {code || (loading ? <span style={{ color: '#6a6a9a' }}>AI 正在编写 {lang} 代码...</span> : <span style={{ color: '#55558a' }}>// 代码将在这里显示\n// 点击左侧"生成代码"开始</span>)}
            </pre>
          ) : (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: '#e0e0ff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {explanation || (loading ? <span style={{ color: '#6a6a9a' }}>AI 正在分析代码...</span> : <span style={{ color: '#55558a' }}>// 在左侧粘贴代码并点击"解释代码"</span>)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflow: 'auto' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#b9b9e5',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Code2 size={13} style={{ color: '#06b6d4' }} />
            保存的代码片段 ({snippets.length})
          </div>
          {snippets.length === 0 ? (
            <div style={{ fontSize: 11, color: '#55558a', textAlign: 'center', padding: 16 }}>
              还没有保存的代码片段
            </div>
          ) : (
            snippets.map((snippet) => (
              <div
                key={snippet.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: '#c4c4e5',
                        fontWeight: 600,
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {snippet.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#6a6a9a', marginTop: 4 }}>
                      {snippet.language} · {new Date(snippet.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <CopyButton
                      text={snippet.code || snippet.explanation}
                      showToast={showToast}
                    />
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      style={{ ...iconBtnStyle, padding: 4 }}
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}