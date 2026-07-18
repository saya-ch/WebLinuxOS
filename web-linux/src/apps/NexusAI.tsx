import { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
  chat,
  streamChat,
  generateImage,
  AVAILABLE_TEXT_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  type AIMessage,
} from '../services/aiService'
import { marked } from 'marked'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
  pending?: boolean
  error?: boolean
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

const STORAGE_KEY = 'weblinux-nexus-ai-conversations'

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 20)))
  } catch {
    /* localStorage 可能已满，忽略 */
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PRESET_PROMPTS = [
  { icon: '💡', label: '解释概念', prompt: '用 200 字以内解释什么是闭包（Closure），并给出一个 JavaScript 示例' },
  { icon: '⚡', label: '优化代码', prompt: '请帮我把这段代码优化得更高效：\n\n```js\nfor (let i = 0; i < arr.length; i++) {\n  result += arr[i]\n}\n```' },
  { icon: '🌐', label: '翻译', prompt: '请把"今天的天气真好，我们一起去公园散步吧"翻译成英文、日文、法文' },
  { icon: '📝', label: '写文案', prompt: '为一款 WebLinuxOS 写一段产品宣传文案，强调它运行在浏览器中、无需安装' },
  { icon: '🐛', label: '调试', prompt: '我的 React 组件 useEffect 死循环了，可能的原因有哪些？如何排查？' },
  { icon: '🎨', label: '画图', prompt: '/image 一只赛博朋克风格的猫，戴着 VR 眼镜，霓虹色背景' },
]

function NexusAI() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const convs = loadConversations()
    return convs[0]?.id || null
  })
  const [input, setInput] = useState('')
  const [model, setModel] = useState('openai')
  const [temperature, setTemperature] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId) || null

  // 持久化
  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  // 自适应输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setInput('')
    inputRef.current?.focus()
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (id === activeId) {
        setActiveId(next[0]?.id || null)
      }
      return next
    })
  }, [activeId])

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    // 自动创建对话
    let convId = activeId
    if (!convId) {
      const conv: Conversation = {
        id: uid(),
        title: text.slice(0, 30),
        messages: [],
        createdAt: Date.now(),
      }
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      convId = conv.id
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model,
      pending: true,
    }

    updateConversation(convId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? text.slice(0, 30) : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }))
    setInput('')
    setLoading(true)

    // 处理图像生成命令 /image <prompt>
    const imageMatch = text.match(/^\/image\s+(.+)/i)
    if (imageMatch) {
      const prompt = imageMatch[1].trim()
      const url = generateImage(prompt, { width: 1024, height: 1024 })
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                pending: false,
                content: `![${prompt}](${url})\n\n> 模型: FLUX.1 · 1024×1024\n> 提示词: ${prompt}`,
              }
            : m,
        ),
      }))
      setLoading(false)
      return
    }

    // 构造 OpenAI 风格 messages
    const history = (conversations.find((c) => c.id === convId)?.messages || [])
      .filter((m) => !m.pending && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })) as AIMessage[]

    const apiMessages: AIMessage[] = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: text },
    ]

    try {
      if (streaming) {
        await streamChat(
          apiMessages,
          (delta) => {
            updateConversation(convId!, (c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + delta, pending: false }
                  : m,
              ),
            }))
          },
          { model, temperature },
        )
      } else {
        const content = await chat(apiMessages, { model, temperature })
        updateConversation(convId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsg.id ? { ...m, content, pending: false } : m,
          ),
        }))
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      updateConversation(convId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                pending: false,
                error: true,
                content: `⚠️ 调用 AI 服务失败：${errorMsg}\n\n可能原因：\n- 网络连接问题\n- 模型暂时不可用\n- 请求频率限制\n\n请稍后重试或更换模型。`,
              }
            : m,
        ),
      }))
    } finally {
      setLoading(false)
    }
  }, [input, loading, activeId, model, temperature, streaming, conversations, updateConversation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderContent = (content: string) => {
    try {
      const html = marked.parse(content, { async: false, breaks: true }) as string
      return { __html: html }
    } catch {
      return { __html: content.replace(/</g, '&lt;') }
    }
  }

  return (
    <div style={styles.container}>
      {/* 侧边栏：会话列表 */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>N</div>
            <div>
              <div style={styles.brandName}>Nexus AI</div>
              <div style={styles.brandSub}>真实联网大模型</div>
            </div>
          </div>
          <button style={styles.newBtn} onClick={newConversation} title="新对话">
            ＋
          </button>
        </div>
        <div style={styles.convList}>
          {conversations.length === 0 && (
            <div style={styles.emptySidebar}>点击 + 开始第一个对话</div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              style={{
                ...styles.convItem,
                ...(c.id === activeId ? styles.convItemActive : {}),
              }}
              onClick={() => setActiveId(c.id)}
            >
              <div style={styles.convTitle}>{c.title || '新对话'}</div>
              <div style={styles.convMeta}>{c.messages.length} 条消息</div>
              <button
                style={styles.convDel}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(c.id)
                }}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={styles.sidebarFooter}>
          <div style={styles.poweredBy}>
            Powered by Pollinations.ai · 免费、无需 API Key
          </div>
        </div>
      </div>

      {/* 主区域：聊天 */}
      <div style={styles.main}>
        {/* 顶部工具栏 */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <select
              style={styles.select}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              title="选择 AI 模型"
            >
              {AVAILABLE_TEXT_MODELS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                  {m.vision ? ' · 视觉' : ''}
                  {m.reasoning ? ' · 推理' : ''}
                </option>
              ))}
            </select>
            <button
              style={{ ...styles.toolBtn, ...(showSettings ? styles.toolBtnActive : {}) }}
              onClick={() => setShowSettings((v) => !v)}
              title="参数设置"
            >
              ⚙ 设置
            </button>
            <button
              style={{ ...styles.toolBtn, ...(streaming ? styles.toolBtnActive : {}) }}
              onClick={() => setStreaming((v) => !v)}
              title="流式输出"
            >
              ⚡ 流式
            </button>
            <button
              style={{ ...styles.toolBtn, ...(imageMode ? styles.toolBtnActive : {}) }}
              onClick={() => setImageMode((v) => !v)}
              title="图像模式：使用 /image 命令生成图像"
            >
              🎨 图像
            </button>
          </div>
          <div style={styles.toolbarRight}>
            {activeConversation && (
              <button
                style={styles.toolBtn}
                onClick={() => {
                  if (activeConversation) {
                    updateConversation(activeConversation.id, (c) => ({ ...c, messages: [] }))
                  }
                }}
                title="清空当前对话"
              >
                🗑 清空
              </button>
            )}
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div style={styles.settingsPanel}>
            <div style={styles.settingRow}>
              <label style={styles.settingLabel}>温度（Temperature）: {temperature.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.settingHint}>越低越确定，越高越发散</span>
            </div>
            <div style={styles.settingRow}>
              <label style={styles.settingLabel}>可用模型（仅供参考）:</label>
              <div style={styles.modelGrid}>
                {AVAILABLE_TEXT_MODELS.map((m) => (
                  <div
                    key={m.name}
                    style={{
                      ...styles.modelCard,
                      ...(m.name === model ? styles.modelCardActive : {}),
                    }}
                    onClick={() => setModel(m.name)}
                  >
                    <div style={styles.modelName}>{m.name}</div>
                    <div style={styles.modelDesc}>{m.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 消息列表 */}
        <div style={styles.messages}>
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div style={styles.welcome}>
              <div style={styles.welcomeIcon}>✨</div>
              <h2 style={styles.welcomeTitle}>Nexus AI — 真实联网大模型</h2>
              <p style={styles.welcomeSub}>
                基于 Pollinations.ai 的免费 AI 服务，支持 GPT-4o、DeepSeek、Llama、Mistral 等多个模型。
                无需 API Key，无需登录，所有对话直接在浏览器中完成。
              </p>
              <div style={styles.presets}>
                {PRESET_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    style={styles.presetBtn}
                    onClick={() => {
                      setInput(p.prompt)
                      inputRef.current?.focus()
                    }}
                  >
                    <span style={styles.presetIcon}>{p.icon}</span>
                    <span style={styles.presetLabel}>{p.label}</span>
                  </button>
                ))}
              </div>
              {imageMode && (
                <div style={styles.imageHint}>
                  🎨 图像模式已开启：在输入框中使用 <code>/image 你的描述</code> 生成图片
                </div>
              )}
            </div>
          ) : (
            activeConversation.messages.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                gap: '12px',
                padding: '8px 24px',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: m.role === 'user' ? 'rgba(0, 214, 193, 0.18)' : 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
                  color: m.role === 'user' ? '#00d6c1' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {m.role === 'user' ? '我' : '✨'}
                </div>
                <div style={{
                  maxWidth: '72%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? 'rgba(0, 214, 193, 0.12)' : 'rgba(124, 108, 240, 0.08)',
                  border: m.role === 'user' ? '1px solid rgba(0, 214, 193, 0.25)' : '1px solid rgba(124, 108, 240, 0.18)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}>
                  {m.pending && !m.content && (
                    <div style={styles.thinking}>
                      <span style={styles.dot} />
                      <span style={styles.dot} />
                      <span style={styles.dot} />
                    </div>
                  )}
                  <div
                    style={styles.msgContent}
                    className="nexus-md"
                    dangerouslySetInnerHTML={renderContent(m.content)}
                  />
                  {m.model && !m.pending && (
                    <div style={styles.msgMeta}>
                      {m.model} · {new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrap}>
            <textarea
              ref={inputRef}
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                imageMode
                  ? '使用 /image 描述图片，例如：/image 赛博朋克城市夜景...'
                  : '输入消息，Enter 发送，Shift+Enter 换行'
              }
              rows={1}
              disabled={loading}
            />
            <button
              style={{
                ...styles.sendBtn,
                ...(loading ? styles.sendBtnDisabled : {}),
              }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? '⏸' : '↑'}
            </button>
          </div>
          <div style={styles.inputHint}>
            按 Enter 发送 · Shift+Enter 换行 · {streaming ? '流式输出' : '整段输出'} · 当前模型: {model}
          </div>
        </div>
      </div>

      <style>{`
        .nexus-md h1, .nexus-md h2, .nexus-md h3 { margin: 0.5em 0 0.3em; font-weight: 600; }
        .nexus-md h1 { font-size: 1.3em; }
        .nexus-md h2 { font-size: 1.15em; }
        .nexus-md h3 { font-size: 1em; }
        .nexus-md p { margin: 0.4em 0; }
        .nexus-md ul, .nexus-md ol { margin: 0.4em 0; padding-left: 1.4em; }
        .nexus-md li { margin: 0.2em 0; }
        .nexus-md code {
          background: rgba(124, 108, 240, 0.15);
          color: #c4b5fd;
          padding: 1px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.9em;
        }
        .nexus-md pre {
          background: rgba(8, 8, 15, 0.8);
          border: 1px solid rgba(124, 108, 240, 0.3);
          border-radius: 8px;
          padding: 12px 14px;
          margin: 0.6em 0;
          overflow-x: auto;
        }
        .nexus-md pre code {
          background: transparent;
          color: #e0e0ff;
          padding: 0;
        }
        .nexus-md blockquote {
          border-left: 3px solid #7c6cf0;
          padding-left: 10px;
          margin: 0.5em 0;
          color: #9090c0;
        }
        .nexus-md img {
          max-width: 100%;
          border-radius: 8px;
          margin: 0.5em 0;
        }
        .nexus-md table {
          border-collapse: collapse;
          margin: 0.5em 0;
        }
        .nexus-md th, .nexus-md td {
          border: 1px solid rgba(124, 108, 240, 0.3);
          padding: 6px 10px;
        }
        .nexus-md a { color: #00d6c1; text-decoration: none; }
        .nexus-md a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1f 100%)',
    color: '#f0f0ff',
    fontFamily: "'Geist', 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    background: 'rgba(8, 8, 15, 0.7)',
    borderRight: '1px solid rgba(124, 108, 240, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '14px',
    borderBottom: '1px solid rgba(124, 108, 240, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    background: 'linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '18px',
    boxShadow: '0 4px 14px rgba(124, 108, 240, 0.4)',
  },
  brandName: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: '10px',
    color: '#9090c0',
    letterSpacing: '0.05em',
  },
  newBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    background: 'rgba(124, 108, 240, 0.1)',
    color: '#c4b5fd',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  emptySidebar: {
    padding: '20px 10px',
    color: '#606080',
    fontSize: '12px',
    textAlign: 'center',
  },
  convItem: {
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    position: 'relative',
    transition: 'background 0.15s',
  },
  convItemActive: {
    background: 'rgba(124, 108, 240, 0.18)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
  },
  convTitle: {
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: '20px',
  },
  convMeta: {
    fontSize: '10px',
    color: '#606080',
    marginTop: '3px',
  },
  convDel: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#606080',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  sidebarFooter: {
    padding: '10px 14px',
    borderTop: '1px solid rgba(124, 108, 240, 0.12)',
  },
  poweredBy: {
    fontSize: '10px',
    color: '#606080',
    lineHeight: 1.4,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(124, 108, 240, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(8, 8, 15, 0.4)',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  select: {
    background: 'rgba(20, 20, 35, 0.9)',
    color: '#f0f0ff',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
  },
  toolBtn: {
    background: 'rgba(124, 108, 240, 0.08)',
    border: '1px solid rgba(124, 108, 240, 0.18)',
    color: '#c4b5fd',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  toolBtnActive: {
    background: 'rgba(124, 108, 240, 0.25)',
    borderColor: 'rgba(124, 108, 240, 0.5)',
    color: '#fff',
  },
  settingsPanel: {
    padding: '14px',
    background: 'rgba(8, 8, 15, 0.5)',
    borderBottom: '1px solid rgba(124, 108, 240, 0.12)',
  },
  settingRow: {
    marginBottom: '12px',
  },
  settingLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#c4b5fd',
    marginBottom: '6px',
    fontWeight: 500,
  },
  settingHint: {
    fontSize: '11px',
    color: '#606080',
    marginTop: '4px',
  },
  slider: {
    width: '100%',
    accentColor: '#7c6cf0',
  },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  modelCard: {
    padding: '10px',
    background: 'rgba(20, 20, 35, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modelCardActive: {
    background: 'rgba(124, 108, 240, 0.2)',
    borderColor: 'rgba(124, 108, 240, 0.5)',
  },
  modelName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },
  modelDesc: {
    fontSize: '11px',
    color: '#9090c0',
    marginTop: '3px',
    lineHeight: 1.4,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 0',
  },
  welcome: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 40px',
    textAlign: 'center',
  },
  welcomeIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #f5f3ff 0%, #c4b5fd 40%, #7dd3fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  welcomeSub: {
    fontSize: '14px',
    color: '#9090c0',
    maxWidth: '560px',
    lineHeight: 1.7,
    marginBottom: '30px',
  },
  presets: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '10px',
    maxWidth: '640px',
    width: '100%',
  },
  presetBtn: {
    padding: '12px 14px',
    background: 'rgba(20, 20, 35, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.18)',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#e0e0ff',
    fontSize: '12px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'all 0.2s',
  },
  presetIcon: {
    fontSize: '20px',
  },
  presetLabel: {
    fontWeight: 500,
  },
  imageHint: {
    marginTop: '20px',
    padding: '10px 14px',
    background: 'rgba(0, 214, 193, 0.1)',
    border: '1px solid rgba(0, 214, 193, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#00d6c1',
  },
  msgContent: {
    overflowWrap: 'break-word' as const,
  },
  msgMeta: {
    marginTop: '6px',
    fontSize: '10px',
    color: '#606080',
    textAlign: 'right',
  },
  thinking: {
    display: 'flex',
    gap: '4px',
    padding: '6px 0',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#7c6cf0',
    animation: 'nexusThinking 1.4s ease-in-out infinite',
  },
  inputArea: {
    padding: '12px 20px 16px',
    borderTop: '1px solid rgba(124, 108, 240, 0.18)',
    background: 'rgba(8, 8, 15, 0.6)',
  },
  inputWrap: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    background: 'rgba(20, 20, 35, 0.7)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    borderRadius: '12px',
    padding: '8px 10px',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f0f0ff',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.5,
    resize: 'none',
    padding: '6px 4px',
    maxHeight: '200px',
  },
  sendBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    border: 'none',
    background: 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(124, 108, 240, 0.4)',
  },
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  inputHint: {
    marginTop: '6px',
    fontSize: '11px',
    color: '#606080',
    textAlign: 'center',
  },
}

export default memo(NexusAI)

// 注入 thinking 动画
if (typeof document !== 'undefined' && !document.getElementById('nexus-thinking-style')) {
  const style = document.createElement('style')
  style.id = 'nexus-thinking-style'
  style.textContent = `
    @keyframes nexusThinking {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }
    .nexus-md pre::-webkit-scrollbar { height: 6px; }
    .nexus-md pre::-webkit-scrollbar-track { background: transparent; }
    .nexus-md pre::-webkit-scrollbar-thumb { background: rgba(124, 108, 240, 0.4); border-radius: 3px; }
  `
  document.head.appendChild(style)
}
