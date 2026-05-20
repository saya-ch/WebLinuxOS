import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'

interface Contact {
  id: string
  name: string
  avatar: string
  online: boolean
  lastSeen: string
  personality: string
}

interface Message {
  id: string
  contactId: string
  text: string
  fromMe: boolean
  time: string
}

const contacts: Contact[] = [
  { id: 'c1', name: '张三', avatar: '👨', online: true, lastSeen: '在线', personality: 'friendly' },
  { id: 'c2', name: '李四', avatar: '👩', online: true, lastSeen: '在线', personality: 'professional' },
  { id: 'c3', name: '王五', avatar: '👨‍💼', online: false, lastSeen: '10分钟前', personality: 'philosophical' },
  { id: 'c4', name: '赵六', avatar: '👩‍💻', online: true, lastSeen: '在线', personality: 'techy' },
  { id: 'c5', name: '孙七', avatar: '👨‍🎓', online: false, lastSeen: '1小时前', personality: 'humorous' },
  { id: 'c6', name: '周八', avatar: '👩‍🎨', online: true, lastSeen: '在线', personality: 'artistic' },
]

const greetingReplies: Record<string, string[]> = {
  friendly: ['嘿！你好呀！今天过得怎么样？😊', '嗨嗨嗨！好久不见！', '你好呀朋友！今天心情不错吧？'],
  professional: ['您好，很高兴与您交流。', '你好，有什么可以帮您的吗？', '您好，祝您今天工作顺利。'],
  philosophical: ['你好。每一次相遇都是命运的安排。', '你好，今天你思考了什么？', '问候是人与人之间最温暖的桥梁。'],
  techy: ['Hey! 👋 刚在调试一个bug，终于搞定了！', '你好！你用什么编辑器？我最近迷上了Neovim', 'Hi! 刚看完一篇超棒的技术文章！'],
  humorous: ['哟！来啦！我正无聊呢 😄', '你好你好！今天我讲了个笑话，全场冷场 🥶', '嘿！你终于想起我了！'],
  artistic: ['你好～今天的阳光让我想起莫奈的画 🎨', '嗨！灵感来了，你好！', '你好，世界因你的问候更美了一点点 ✨'],
}

const questionReplies: Record<string, string[]> = {
  friendly: ['这个问题嘛，我觉得挺好的！你觉得呢？', '嗯嗯，让我想想...我觉得答案就在心里！', '好问题！我也经常想这个呢！'],
  professional: ['这是一个值得深入探讨的问题。', '从专业角度来看，需要综合考虑多方面因素。', '建议您可以从不同维度来分析这个问题。'],
  philosophical: ['问题的答案往往不在问题本身，而在提问的方式。', '真正的智慧不在于知道答案，而在于懂得提问。', '每个问题都是一扇门，推开它需要勇气。'],
  techy: ['这个问题我查过Stack Overflow，有好几种解法！', '让我用二分法帮你分析一下 🤔', '这个嘛，先看日志，再查文档，基本能解决！'],
  humorous: ['答案是42！别问我为什么 😂', '这个问题嘛...让我翻翻我的"万能答案手册"', '好问题！但我的回答可能更让你困惑 🤪'],
  artistic: ['问题就像画布上的留白，答案在想象中 🎨', '每个问题都是一首未完成的诗。', '答案？也许它藏在风中。'],
}

const emotionReplies: Record<string, string[]> = {
  friendly: ['别担心，我一直都在！💪', '感受是真实的，你的心情我理解！', '无论怎样，我都支持你！❤️'],
  professional: ['情绪管理很重要，建议您适当调整节奏。', '理解您的感受，保持积极心态有助于解决问题。', '建议您给自己一些空间，适当休息。'],
  philosophical: ['情绪是灵魂的波动，接受它，才能超越它。', '快乐与悲伤，都是生命不可或缺的色彩。', '内心的平静，来自于对情绪的觉察。'],
  techy: ['试试深呼吸，就像给大脑做一次GC 🧘', '情绪bug？重启一下心态就好！', '别emo了，来写代码吧，debug能治愈一切 💻'],
  humorous: ['别难过！我给你讲个笑话：为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25 🤣', '开心就好！不开心的话...我给你表演个原地翻跟头！', '人生就像debug，总有解决的办法 😄'],
  artistic: ['把你的情感画出来，它会变成最美的色彩 🌈', '悲伤是蓝色的，快乐是金色的，你现在是哪种颜色？', '艺术就是最好的情感出口 🎵'],
}

const defaultReplies: Record<string, string[]> = {
  friendly: ['哈哈，说得对！👍', '嗯嗯，继续说！我在听呢', '真的吗？太有意思了！', '哦？然后呢？', '我也有同感！'],
  professional: ['收到，我了解了。', '明白了，请继续。', '好的，我记录一下。', '理解，我们继续推进。', '好的，有进展随时沟通。'],
  philosophical: ['世间万物皆有因果。', '有意思，这让我想到了存在的意义。', '每一个当下，都是永恒的缩影。', '生活就是不断发现的过程。', '嗯，值得深思。'],
  techy: ['收到！就像git commit一样，保存一下 📝', '了解了，我来处理！', 'OK，这个逻辑我懂了 👍', '嗯嗯，就像API返回200一样顺畅！', '收到，解析完毕！✅'],
  humorous: ['哈哈哈，笑死我了 🤣', '等等，让我笑完再回复... 😂', '你说的太对了，我无法反驳！', '妙啊！给你点个赞 👏', '我竟无言以对...但很赞同！'],
  artistic: ['这句话好有画面感 🖼️', '像一首即兴的小诗', '嗯，有种说不出的美感 ✨', '你的表达很有韵味', '这让我想起了印象派的笔触 🎨'],
}

function classifyMessage(text: string): 'greeting' | 'question' | 'emotion' | 'default' {
  const lower = text.toLowerCase()
  if (/你好|hi|hello|嗨|hey|哈喽|早|晚上好|下午好|早安|晚安/.test(lower)) return 'greeting'
  if (/什么|为什么|怎么|如何|哪|吗|？|\?|多少|几|谁|哪里|when|what|why|how|where|who/.test(lower)) return 'question'
  if (/开心|难过|生气|伤心|高兴|快乐|悲伤|焦虑|紧张|害怕|郁闷|烦躁|委屈|感动|幸福|痛苦|无聊|累|烦|emo|sad|happy|angry/.test(lower)) return 'emotion'
  return 'default'
}

function generateReply(contact: Contact, userText: string): string {
  const category = classifyMessage(userText)
  const personality = contact.personality
  let pool: string[]
  switch (category) {
    case 'greeting': pool = greetingReplies[personality]; break
    case 'question': pool = questionReplies[personality]; break
    case 'emotion': pool = emotionReplies[personality]; break
    default: pool = defaultReplies[personality]; break
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

const initialMessages: Message[] = [
  { id: 'm1', contactId: 'c1', text: '你好！最近怎么样？', fromMe: false, time: '10:30' },
  { id: 'm2', contactId: 'c1', text: '挺好的，你呢？', fromMe: true, time: '10:31' },
  { id: 'm3', contactId: 'c1', text: '我也很好！周末一起吃饭吧', fromMe: false, time: '10:32' },
  { id: 'm4', contactId: 'c1', text: '好啊，去哪里？', fromMe: true, time: '10:33' },
  { id: 'm5', contactId: 'c1', text: '去那家新开的川菜馆怎么样', fromMe: false, time: '10:34' },
  { id: 'm6', contactId: 'c2', text: '明天的会议几点？', fromMe: false, time: '09:15' },
  { id: 'm7', contactId: 'c2', text: '下午2点', fromMe: true, time: '09:16' },
  { id: 'm8', contactId: 'c2', text: '好的，收到', fromMe: false, time: '09:17' },
  { id: 'm9', contactId: 'c3', text: '文件我已经发你邮箱了', fromMe: false, time: '昨天' },
  { id: 'm10', contactId: 'c3', text: '收到，谢谢！', fromMe: true, time: '昨天' },
  { id: 'm11', contactId: 'c4', text: '下班一起走吗', fromMe: false, time: '17:30' },
  { id: 'm12', contactId: 'c4', text: '好的', fromMe: true, time: '17:31' },
]

function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export default function Chat() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [activeContactId, setActiveContactId] = useState(contacts[0].id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typingContactId, setTypingContactId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const sidebarBg = isDark ? '#16213e' : '#e8e8e8'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const bubbleMe = isDark ? '#0f3460' : '#4fc3f7'
  const bubbleOther = isDark ? '#1a3a5c' : '#e0e0e0'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const hoverBg = isDark ? '#1a3a5c' : '#ddd'

  const activeContact = contacts.find((c) => c.id === activeContactId)
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const activeMessages = messages.filter((m) => m.contactId === activeContactId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages, typingContactId])

  const triggerAutoReply = useCallback((contactId: string, userText: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    if (!contact) return

    setTypingContactId(contactId)

    const typingDelay = 800 + Math.random() * 1200
    typingTimerRef.current = setTimeout(() => {
      const replyText = generateReply(contact, userText)
      const replyMsg: Message = {
        id: `m${Date.now()}`,
        contactId,
        text: replyText,
        fromMe: false,
        time: getCurrentTime(),
      }
      setMessages((prev) => [...prev, replyMsg])
      setTypingContactId(null)
    }, typingDelay)
  }, [])

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  const sendMessage = () => {
    if (!inputText.trim()) return
    const time = getCurrentTime()
    const newMsg: Message = {
      id: `m${Date.now()}`,
      contactId: activeContactId,
      text: inputText.trim(),
      fromMe: true,
      time,
    }
    const userText = inputText.trim()
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
    triggerAutoReply(activeContactId, userText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isTypingThisContact = typingContactId === activeContactId

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 220, background: sidebarBg, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px' }}>
          <input
            type="text"
            placeholder="搜索联系人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`,
              background: inputBg, color: textColor, fontSize: 12, boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredContacts.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveContactId(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                background: activeContactId === c.id ? (isDark ? '#0f3460' : '#d0d0d0') : 'transparent',
                borderLeft: activeContactId === c.id ? `3px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (activeContactId !== c.id) (e.currentTarget as HTMLElement).style.background = hoverBg
              }}
              onMouseLeave={(e) => {
                if (activeContactId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 28, position: 'relative' }}>
                {c.avatar}
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                  borderRadius: '50%', background: c.online ? '#4caf50' : '#999',
                  border: `2px solid ${sidebarBg}`, display: 'inline-block',
                }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888' }}>{c.lastSeen}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${borderColor}`, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, background: sidebarBg,
        }}>
          <span style={{ fontSize: 22 }}>{activeContact?.avatar}</span>
          <span>{activeContact?.name}</span>
          <span style={{ fontSize: 11, color: activeContact?.online ? '#4caf50' : '#999', marginLeft: 'auto' }}>
            {activeContact?.online ? '● 在线' : activeContact?.lastSeen}
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeMessages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.fromMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
              {!msg.fromMe && <span style={{ fontSize: 22, flexShrink: 0 }}>{activeContact?.avatar}</span>}
              <div style={{
                maxWidth: '70%', padding: '8px 12px', borderRadius: msg.fromMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.fromMe ? bubbleMe : bubbleOther, color: msg.fromMe && !isDark ? '#fff' : textColor,
                fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
              }}>
                {msg.text}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: msg.fromMe ? 'right' : 'left' }}>{msg.time}</div>
              </div>
            </div>
          ))}
          {isTypingThisContact && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{activeContact?.avatar}</span>
              <div style={{
                padding: '8px 14px', borderRadius: '12px 12px 12px 4px',
                background: bubbleOther, color: textColor, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span className="typing-dot" style={{
                    width: 6, height: 6, borderRadius: '50%', background: isDark ? '#8899aa' : '#888',
                    animation: 'typingBounce 1.2s infinite ease-in-out',
                  }} />
                  <span className="typing-dot" style={{
                    width: 6, height: 6, borderRadius: '50%', background: isDark ? '#8899aa' : '#888',
                    animation: 'typingBounce 1.2s infinite ease-in-out 0.2s',
                  }} />
                  <span className="typing-dot" style={{
                    width: 6, height: 6, borderRadius: '50%', background: isDark ? '#8899aa' : '#888',
                    animation: 'typingBounce 1.2s infinite ease-in-out 0.4s',
                  }} />
                </span>
                <span style={{ marginLeft: 4, opacity: 0.6 }}>正在输入</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <style>{`
          @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>

        <div style={{ padding: '10px 16px', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: 8, background: sidebarBg }}>
          <input
            type="text"
            placeholder="输入消息..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 20, border: `1px solid ${borderColor}`,
              background: inputBg, color: textColor, fontSize: 13, outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', background: isDark ? '#0f3460' : '#1976d2',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}