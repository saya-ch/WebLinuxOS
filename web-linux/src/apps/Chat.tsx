import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

interface Contact {
  id: string
  name: string
  avatar: string
  online: boolean
  lastSeen: string
}

interface Message {
  id: string
  contactId: string
  text: string
  fromMe: boolean
  time: string
}

const contacts: Contact[] = [
  { id: 'c1', name: '张三', avatar: '👨', online: true, lastSeen: '在线' },
  { id: 'c2', name: '李四', avatar: '👩', online: true, lastSeen: '在线' },
  { id: 'c3', name: '王五', avatar: '👨‍💼', online: false, lastSeen: '10分钟前' },
  { id: 'c4', name: '赵六', avatar: '👩‍💻', online: true, lastSeen: '在线' },
  { id: 'c5', name: '孙七', avatar: '👨‍🎓', online: false, lastSeen: '1小时前' },
  { id: 'c6', name: '周八', avatar: '👩‍🎨', online: true, lastSeen: '在线' },
]

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

export default function Chat() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [activeContactId, setActiveContactId] = useState(contacts[0].id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
  }, [activeMessages])

  const sendMessage = () => {
    if (!inputText.trim()) return
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const newMsg: Message = {
      id: `m${Date.now()}`,
      contactId: activeContactId,
      text: inputText.trim(),
      fromMe: true,
      time,
    }
    setMessages([...messages, newMsg])
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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
          <div ref={messagesEndRef} />
        </div>

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