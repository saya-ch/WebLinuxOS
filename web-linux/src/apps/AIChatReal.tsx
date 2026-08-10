import { useState, useCallback, useRef, useEffect, memo } from 'react'
import {
  Sparkles,
  Code2,
  Languages,
  FileText,
  GraduationCap,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  Brain,
  ChevronRight,
  Settings,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react'
import { marked } from 'marked'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type Role = 'user' | 'assistant' | 'system'

interface ChatMessage {
  id: string
  role: Role
  content: string
  timestamp: number
  model?: string
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  characterId: string
}

interface AIChatRealProps {
  title?: string
  className?: string
  style?: React.CSSProperties
}

const STORAGE_KEY = 'weblinux-ai-chat-real-conversations'
const MAX_CONVERSATIONS = 30
const MAX_HISTORY_MESSAGES = 20

const CHARACTERS = [
  {
    id: 'general',
    label: '通用助手',
    icon: <Sparkles size={16} />,
    systemPrompt: '你是一个友好、博学的AI助手。你可以回答各种问题，提供准确、有用的信息。回答风格自然、亲切、专业。',
  },
  {
    id: 'code',
    label: '代码专家',
    icon: <Code2 size={16} />,
    systemPrompt: '你是一位资深的编程专家，精通多种编程语言和软件工程最佳实践。提供代码时请确保正确性，并添加必要的注释。优先考虑性能和可维护性。',
  },
  {
    id: 'translator',
    label: '翻译官',
    icon: <Languages size={16} />,
    systemPrompt: '你是一位专业的翻译专家，精通中英互译，也能处理其他常见语言。翻译要求准确、流畅、符合目标语言表达习惯。如需解释，请简明扼要。',
  },
  {
    id: 'writer',
    label: '写作助手',
    icon: <FileText size={16} />,
    systemPrompt: '你是一位才华横溢的写作助手，擅长各种文体的创作和润色。无论是文章、文案、故事还是诗歌，都能提供高质量的文字作品。',
  },
  {
    id: 'tutor',
    label: '学习导师',
    icon: <GraduationCap size={16} />,
    systemPrompt: '你是一位耐心的学习导师，擅长用通俗易懂的方式解释复杂概念。鼓励学习者，循序渐进，注重基础知识的巩固和实际应用能力的培养。',
  },
]

const QUICK_PROMPTS: Record<string, string[]> = {
  general: ['介绍一下自己', '什么是量子计算？', '给我讲个有趣的历史故事', '如何培养良好的学习习惯？'],
  code: ['实现一个防抖函数', '解释设计模式中的观察者模式', '优化 React 性能的技巧', '写一个二叉树的层序遍历'],
  translator: ['把这句话翻译成英文：人工智能正在改变世界', '翻译：今天天气真好，适合出去玩', '帮我翻译这段日语：おはようございます', '翻译成法语：我爱编程'],
  writer: ['写一篇关于秋天的散文', '帮我写一封求职信', '创作一首关于春天的诗', '写一段产品发布的宣传文案'],
  tutor: ['解释什么是递归', '牛顿第二定律是什么？', '如何理解微积分的基本定理？', '请用简单的话解释区块链技术'],
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data
    return []
  } catch {
    return []
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, MAX_CONVERSATIONS)))
  } catch {
    /* ignore quota */
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(content: string): string {
  try {
    return marked.parse(content, { async: false, breaks: true }) as string
  } catch {
    return content.replace(/</g, '&lt;').replace(/\n/g, '<br>')
  }
}

const pollinateText = async (
  prompt: string,
  systemPrompt = '',
  timeout = 60000,
): Promise<string> => {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const url = `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?stream=false`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'text/plain' } }, timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

const simulateTypewriter = (text: string, onChunk: (partial: string) => void, speed = 12) => {
  let i = 0
  const timer = setInterval(() => {
    i += Math.max(1, Math.floor(text.length / 150))
    if (i >= text.length) {
      onChunk(text)
      clearInterval(timer)
    } else {
      onChunk(text.slice(0, i))
    }
  }, speed)
  return () => clearInterval(timer)
}

const ICON_BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'inherit',
  padding: 6,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
}

const ICON_BTN_LIGHT: React.CSSProperties = {
  ...ICON_BTN,
  background: 'rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.08)',
  color: '#555',
}

const AIChatReal = memo(function AIChatReal({
  title = 'Pollinations AI 聊天',
  className,
  style: externalStyle,
}: AIChatRealProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState<string | null>(() => loadConversations()[0]?.id || null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loadingRef = useRef(false)

  loadingRef.current = loading

  const activeConv = conversations.find((c) => c.id === activeId) || null

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages])

  const createConversation = useCallback(
    (characterId: string = 'general') => {
      const conv: Conversation = {
        id: uid(),
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        characterId,
      }
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      setInput('')
    },
    [],
  )

  const deleteConversation = useCallback(
    (convId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeId === convId) {
        setActiveId(null)
      }
    },
    [activeId],
  )

  const clearAllConversations = useCallback(() => {
    setConversations([])
    setActiveId(null)
  }, [])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return

    if (!activeConv) {
      createConversation('general')
      setTimeout(() => sendMessage(), 50)
      return
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const title =
      activeConv.messages.length === 0 ? content.slice(0, 30) : activeConv.title

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConv.id
          ? {
              ...conv,
              title,
              messages: [...conv.messages, userMsg],
            }
          : conv,
      ),
    )
    setInput('')
    setLoading(true)

    const character = CHARACTERS.find((c) => c.id === activeConv.characterId) || CHARACTERS[0]

    const historyForPrompt = activeConv.messages.slice(-MAX_HISTORY_MESSAGES)
    let historyText = ''
    for (const m of historyForPrompt) {
      historyText += `<|im_start|>${m.role}\n${m.content}\n<|im_end|>\n`
    }

    const fullPrompt = historyText
      ? `${historyText}<|im_start|>user\n${content}\n<|im_end|>\n<|im_start|>assistant\n`
      : `<|im_start|>user\n${content}\n<|im_end|>\n<|im_start|>assistant\n`

    const pendingId = uid()
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConv.id
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: pendingId,
                  role: 'assistant',
                  content: '',
                  timestamp: Date.now(),
                  model: 'pollinations',
                },
              ],
            }
          : conv,
      ),
    )

    try {
      const resp = await pollinateText(fullPrompt, character.systemPrompt)
      let curText = ''
      const stop = simulateTypewriter(resp, (partial) => {
        curText = partial
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConv.id
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === pendingId ? { ...m, content: partial } : m,
                  ),
                }
              : conv,
          ),
        )
      })

      setTimeout(() => {
        stop()
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConv.id
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === pendingId ? { ...m, content: curText || resp } : m,
                  ),
                }
              : conv,
          ),
        )
        setLoading(false)
      }, Math.min(resp.length * 12, 3000))
    } catch (e) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConv.id
            ? {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === pendingId
                    ? {
                        ...m,
                        content: `⚠️ 请求失败：${handleApiError(e, 'AI 对话')}`,
                      }
                    : m,
                ),
              }
            : conv,
        ),
      )
      setLoading(false)
    }
  }, [input, loading, activeConv, createConversation])

  const retryLastMessage = useCallback(() => {
    if (!activeConv || loading) return
    const assistantMsgs = activeConv.messages.filter((m) => m.role === 'assistant')
    if (assistantMsgs.length === 0) return
    const lastUserMsg = [...activeConv.messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConv.id) return conv
        const newMsgs = [...conv.messages]
        let found = false
        for (let i = newMsgs.length - 1; i >= 0; i--) {
          if (newMsgs[i].role === 'assistant' && !found) {
            newMsgs.splice(i, 1)
            found = true
          }
        }
        return { ...conv, messages: newMsgs }
      }),
    )
    setInput(lastUserMsg.content)
    setTimeout(() => sendMessage(), 100)
  }, [activeConv, loading, sendMessage])

  const copyMessage = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast('已复制到剪贴板')
      } catch {
        showToast('复制失败')
      }
    },
    [showToast],
  )

  const onTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  const character = CHARACTERS.find((c) => c.id === (activeConv?.characterId || 'general')) || CHARACTERS[0]

  const bgStyle: React.CSSProperties = isDark
    ? {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(150deg, #05051a 0%, #0f0f2a 50%, #181040 100%)',
        color: '#e8e8ff',
        fontFamily: 'inherit',
      }
    : {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(150deg, #e0e7ff 0%, #f5f3ff 50%, #fce7f3 100%)',
        color: '#1e1b4b',
        fontFamily: 'inherit',
      }

  const glassHeader: React.CSSProperties = isDark
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(139,92,246,0.18)',
        background: 'rgba(10,10,25,0.6)',
        backdropFilter: 'blur(12px)',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
      }

  const sidebarStyle: React.CSSProperties = isDark
    ? {
        width: 240,
        padding: 16,
        borderRight: '1px solid rgba(139,92,246,0.12)',
        background: 'rgba(10,10,25,0.4)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }
    : {
        width: 240,
        padding: 16,
        borderRight: '1px solid rgba(99,102,241,0.1)',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(10px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }

  const msgAreaStyle: React.CSSProperties = isDark
    ? {
        flex: 1,
        padding: 20,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }
    : {
        flex: 1,
        padding: 20,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }

  const inputAreaStyle: React.CSSProperties = isDark
    ? {
        padding: '12px 16px 16px',
        borderTop: '1px solid rgba(139,92,246,0.12)',
        background: 'rgba(10,10,25,0.5)',
        backdropFilter: 'blur(10px)',
      }
    : {
        padding: '12px 16px 16px',
        borderTop: '1px solid rgba(99,102,241,0.1)',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(10px)',
      }

  const textareaStyle: React.CSSProperties = isDark
    ? {
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
      }
    : {
        flex: 1,
        resize: 'none',
        maxHeight: 180,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#1e1b4b',
        fontSize: 13.5,
        lineHeight: 1.6,
        fontFamily: 'inherit',
        padding: '6px 8px',
      }

  return (
    <div
      className={className}
      style={{ ...bgStyle, ...externalStyle }}
    >
      <div style={glassHeader}>
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
              boxShadow: isDark ? '0 0 22px rgba(168,85,247,0.5)' : '0 0 12px rgba(168,85,247,0.3)',
            }}
          >
            <Brain size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
            <div
              style={{
                fontSize: 11,
                color: isDark ? '#8b8bbf' : '#6b7280',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={11} style={{ color: '#a855f7' }} />
              Pollinations AI · 免费公开 API
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsDark((v) => !v)}
            title={isDark ? '切换到浅色主题' : '切换到深色主题'}
            style={isDark ? ICON_BTN : ICON_BTN_LIGHT}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowSidebar((v) => !v)}
            title="切换侧边栏"
            style={isDark ? ICON_BTN : ICON_BTN_LIGHT}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {showSidebar && (
          <aside style={sidebarStyle}>
            <button
              onClick={() => createConversation(activeConv?.characterId || 'general')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(168,85,247,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} />
              新对话
            </button>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? '#8b8bbf' : '#6b7280',
                marginBottom: -4,
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
              {CHARACTERS.map((c) => {
                const isActive = activeConv?.characterId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (activeConv) {
                        setConversations((prev) =>
                          prev.map((conv) =>
                            conv.id === activeConv.id ? { ...conv, characterId: c.id } : conv,
                          ),
                        )
                      } else {
                        createConversation(c.id)
                      }
                    }}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 10,
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isActive
                        ? isDark ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.4)'
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                      background: isActive
                        ? isDark
                          ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(99,102,241,0.12))'
                          : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
                        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                      color: isActive
                        ? isDark ? '#e9d5ff' : '#4338ca'
                        : isDark ? '#c4c4e5' : '#4b5563',
                      transition: 'all 0.18s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {c.icon}
                    {c.label}
                  </button>
                )
              })}
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isDark ? '#8b8bbf' : '#6b7280',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageSquare size={12} /> 历史对话
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 && (
                <div style={{ fontSize: 12, color: isDark ? '#55558a' : '#9ca3af', padding: '10px 4px' }}>
                  暂无对话，点击上方按钮创建
                </div>
              )}
              {conversations.map((conv) => {
                const isActive = conv.id === activeId
                return (
                  <div
                    key={conv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isActive
                        ? isDark ? 'rgba(168,85,247,0.15)' : 'rgba(99,102,241,0.1)'
                        : 'transparent',
                      border: isActive
                        ? `1px solid ${isDark ? 'rgba(168,85,247,0.35)' : 'rgba(99,102,241,0.25)'}`
                        : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setActiveId(conv.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDark ? '#d1d5ff' : '#1f2937',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {conv.title || '新对话'}
                      </div>
                      <div style={{ fontSize: 10, color: isDark ? '#6a6a9a' : '#9ca3af', marginTop: 2 }}>
                        {CHARACTERS.find((c) => c.id === conv.characterId)?.label || '通用助手'} ·{' '}
                        {new Date(conv.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      title="删除"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#6a6a9a' : '#9ca3af',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isDark ? '#ef4444' : '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? '#6a6a9a' : '#9ca3af'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>

            {conversations.length > 0 && (
              <button
                onClick={clearAllConversations}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)',
                  background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.05)',
                  color: isDark ? '#fca5a5' : '#dc2626',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                <Trash2 size={12} />
                清空所有对话
              </button>
            )}
          </aside>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!activeConv || activeConv.messages.length === 0 ? (
            <WelcomeScreen
              isDark={isDark}
              character={character}
              onPick={(prompt) => {
                if (!activeConv) {
                  createConversation(character.id)
                }
                setInput(prompt)
              }}
              onCreate={() => createConversation(character.id)}
            />
          ) : (
            <div style={msgAreaStyle}>
              {activeConv.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isDark={isDark}
                  onCopy={copyMessage}
                />
              ))}

              {loading && (
                <TypingIndicator isDark={isDark} />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          <div style={inputAreaStyle}>
            {activeConv && activeConv.messages.length > 0 && !loading && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                {(QUICK_PROMPTS[activeConv.characterId] || QUICK_PROMPTS.general).map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 16,
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
                      background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(99,102,241,0.05)',
                      color: isDark ? '#b5b5dd' : '#4b5563',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark
                        ? 'rgba(139,92,246,0.12)'
                        : 'rgba(99,102,241,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark
                        ? 'rgba(139,92,246,0.06)'
                        : 'rgba(99,102,241,0.05)'
                    }}
                  >
                    <ChevronRight size={10} />
                    {q}
                  </button>
                ))}
                <button
                  onClick={retryLastMessage}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)',
                    color: isDark ? '#fcd34d' : '#d97706',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RotateCcw size={10} />
                  重新生成
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: 8,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                borderRadius: 14,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                backdropFilter: 'blur(8px)',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,0,0,0.2)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={onTextareaChange}
                onKeyDown={onKeyDown}
                placeholder="输入你的问题，Enter 发送，Shift+Enter 换行..."
                rows={1}
                style={textareaStyle}
              />
              <button
                onClick={sendMessage}
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
                      : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: input.trim() && !loading ? '#fff' : isDark ? '#6a6a9a' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  boxShadow:
                    input.trim() && !loading ? '0 0 20px rgba(168,85,247,0.4)' : 'none',
                }}
              >
                {loading ? (
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {loading ? '思考中' : '发送'}
              </button>
            </div>
            <div
              style={{
                fontSize: 10,
                color: isDark ? '#6a6a9a' : '#9ca3af',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              当前角色：{character.label} · 对话历史已保存到本地
            </div>
          </div>
        </div>
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
})

function MessageBubble({
  message,
  isDark,
  onCopy,
}: {
  message: ChatMessage
  isDark: boolean
  onCopy: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.content.startsWith('⚠️')
  const isTypingAI = message.role === 'assistant' && !message.content

  const handleCopy = () => {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        maxWidth: '88%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {!isUser && (
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
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            boxShadow: isDark ? '0 0 12px rgba(168,85,247,0.35)' : '0 2px 8px rgba(168,85,247,0.25)',
            color: '#fff',
          }}
        >
          <Brain size={14} />
        </div>
      )}

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 14,
          background: isUser
            ? isDark
              ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
            : isError
              ? isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)'
              : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
          border: `1px solid ${
            isUser
              ? isDark ? 'rgba(139,92,246,0.25)' : 'rgba(99,102,241,0.2)'
              : isError
                ? isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)'
                : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          }`,
          backdropFilter: 'blur(8px)',
          fontSize: 13.5,
          lineHeight: 1.75,
          color: isDark ? '#ececff' : '#1e1b4b',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
          boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        {isTypingAI ? (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', color: isDark ? '#a855f7' : '#7c3aed' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12 }}>AI 正在思考...</span>
          </div>
        ) : isUser ? (
          message.content
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(message.content),
            }}
            style={{
              '& code': {
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: '0.9em',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              },
              '& pre': {
                background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)',
                padding: 12,
                borderRadius: 8,
                overflow: 'auto',
                margin: '8px 0',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
              },
              '& pre code': {
                background: 'transparent',
                padding: 0,
                fontSize: 12,
                lineHeight: 1.6,
              },
              '& blockquote': {
                borderLeft: `3px solid ${isDark ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.5)'}`,
                paddingLeft: 12,
                margin: '8px 0',
                color: isDark ? '#b5b5dd' : '#6b7280',
              },
              '& table': {
                borderCollapse: 'collapse',
                margin: '8px 0',
                width: '100%',
              },
              '& th, & td': {
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                padding: '6px 10px',
                textAlign: 'left',
              },
              '& h1, & h2, & h3, & h4': {
                margin: '12px 0 8px',
                lineHeight: 1.3,
              },
              '& ul, & ol': {
                paddingLeft: 24,
                margin: '8px 0',
              },
              '& a': {
                color: isDark ? '#818cf8' : '#4f46e5',
                textDecoration: 'underline',
              },
            } as React.CSSProperties}
          />
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            fontSize: 10,
            color: isDark ? '#6a6a9a' : '#9ca3af',
          }}
        >
          <span>{formatTime(message.timestamp)}</span>
          {message.model && <span>· {message.model}</span>}
        </div>

        {!isUser && !isError && message.content && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: 10,
              justifyContent: 'flex-end',
              paddingTop: 8,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            <button
              onClick={handleCopy}
              title="复制"
              style={isDark ? ICON_BTN : ICON_BTN_LIGHT}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {isUser && (
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
            background: isDark
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
          }}
        >
          我
        </div>
      )}
    </div>
  )
}

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignSelf: 'flex-start',
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
          background: 'linear-gradient(135deg, #ec4899, #a855f7)',
          color: '#fff',
        }}
      >
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: 5,
          alignItems: 'center',
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
  )
}

function WelcomeScreen({
  isDark,
  character,
  onPick,
  onCreate,
}: {
  isDark: boolean
  character: typeof CHARACTERS[number]
  onPick: (prompt: string) => void
  onCreate: () => void
}) {
  const quickPrompts = QUICK_PROMPTS[character.id] || QUICK_PROMPTS.general

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 24,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 0 40px rgba(168,85,247,0.5)'
            : '0 8px 32px rgba(168,85,247,0.3)',
        }}
      >
        <Brain size={36} style={{ color: '#fff' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            background: isDark
              ? 'linear-gradient(135deg, #e8e8ff, #c4c4e5)'
              : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Pollinations AI 智能对话
        </div>
        <div
          style={{
            fontSize: 13,
            color: isDark ? '#8b8bbf' : '#6b7280',
            marginTop: 8,
            maxWidth: 360,
            lineHeight: 1.6,
          }}
        >
          基于 Pollinations 免费公开 API 的真实 AI 对话，支持多轮上下文、代码生成、翻译写作等功能
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onCreate}
          style={{
            padding: '14px 32px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 28px rgba(168,85,247,0.4)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Sparkles size={16} />
          开始对话
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 500 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isDark ? '#8b8bbf' : '#6b7280',
            marginBottom: 10,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ChevronRight size={12} />
          试试这些问题（{character.label}）
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
                background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(99,102,241,0.06)',
                color: isDark ? '#c4c4e5' : '#4b5563',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = isDark
                  ? '0 4px 12px rgba(139,92,246,0.2)'
                  : '0 4px 12px rgba(99,102,241,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 8,
          fontSize: 11,
          color: isDark ? '#6a6a9a' : '#9ca3af',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10b981' }} /> 免费 API
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#3b82f6' }}>
          </span> 无需注册
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#a855f7' }} /> 多轮对话
        </span>
      </div>
    </div>
  )
}

export default AIChatReal