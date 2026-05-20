import { useState } from 'react'

interface Email {
  id: string
  from: string
  to: string
  subject: string
  body: string
  date: string
  read: boolean
  starred: boolean
  folder: 'inbox' | 'sent' | 'drafts'
}

const initialEmails: Email[] = [
  { id: '1', from: '张三 <zhangsan@example.com>', to: 'me@linux.local', subject: '项目进度更新', body: '你好，\n\n本周项目进展顺利，前端部分已完成80%，预计下周可以进入测试阶段。\n\n请查看附件中的详细进度报告。\n\n此致\n张三', date: '2025-01-15 09:30', read: false, starred: true, folder: 'inbox' },
  { id: '2', from: '李四 <lisi@example.com>', to: 'me@linux.local', subject: '会议邀请：技术评审', body: '你好，\n\n诚邀你参加本周五下午2点的技术评审会议。\n\n会议地点：3号会议室\n议题：新架构方案讨论\n\n请准时参加。\n\n李四', date: '2025-01-14 14:20', read: false, starred: false, folder: 'inbox' },
  { id: '3', from: '系统通知 <noreply@system.local>', to: 'me@linux.local', subject: '您的账户安全提醒', body: '尊敬的用户，\n\n我们检测到您的账户在新设备上登录。如果这不是您本人操作，请立即修改密码。\n\n登录时间：2025-01-14 08:15\n登录地点：北京\nIP地址：192.168.1.100\n\n安全团队', date: '2025-01-14 08:15', read: true, starred: false, folder: 'inbox' },
  { id: '4', from: '王五 <wangwu@example.com>', to: 'me@linux.local', subject: '关于代码审查的反馈', body: '你好，\n\n我已审查了你提交的PR，总体写得很好。有几处建议：\n\n1. 建议将工具函数提取到单独模块\n2. 错误处理可以更完善\n3. 建议增加单元测试\n\n详细评论已在PR中标注。\n\n王五', date: '2025-01-13 16:45', read: true, starred: true, folder: 'inbox' },
  { id: '5', from: 'me@linux.local', to: 'zhangsan@example.com', subject: 'Re: 项目进度更新', body: '张三你好，\n\n收到进度报告，辛苦了！\n\n关于测试阶段，建议提前准备测试用例。我这边会协调QA团队配合。\n\n谢谢', date: '2025-01-15 10:00', read: true, starred: false, folder: 'sent' },
  { id: '6', from: 'me@linux.local', to: 'team@example.com', subject: '团队周报 - 第3周', body: '各位同事，\n\n本周工作总结：\n1. 完成用户模块重构\n2. 修复了5个关键bug\n3. 性能优化提升30%\n\n下周计划：\n1. 完成支付模块开发\n2. 集成测试\n3. 文档更新\n\n谢谢大家的努力！', date: '2025-01-12 18:00', read: true, starred: false, folder: 'sent' },
]

type Folder = 'inbox' | 'sent' | 'drafts'

export default function Email() {
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentFolder, setCurrentFolder] = useState<Folder>('inbox')
  const [composing, setComposing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<Email | null>(null)

  const selectedEmail = emails.find(e => e.id === selectedId) || null

  const folderEmails = emails
    .filter(e => e.folder === currentFolder)
    .filter(e => !searchQuery || e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.from.toLowerCase().includes(searchQuery.toLowerCase()) || e.body.toLowerCase().includes(searchQuery.toLowerCase()))

  const unreadCount = emails.filter(e => e.folder === 'inbox' && !e.read).length

  const selectEmail = (id: string) => {
    setSelectedId(id)
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))
  }

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEmails(prev => prev.map(em => em.id === id ? { ...em, starred: !em.starred } : em))
  }

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const startCompose = () => {
    setComposing(true)
    setReplyingTo(null)
    setComposeTo('')
    setComposeSubject('')
    setComposeBody('')
  }

  const startReply = (email: Email) => {
    setComposing(true)
    setReplyingTo(email)
    setComposeTo(email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : email.from)
    setComposeSubject(`Re: ${email.subject.replace(/^Re:\s*/i, '')}`)
    setComposeBody(`\n\n--- 原始邮件 ---\n发件人: ${email.from}\n日期: ${email.date}\n\n${email.body}`)
  }

  const sendEmail = () => {
    if (!composeTo.trim() || !composeSubject.trim()) return
    const newEmail: Email = {
      id: Date.now().toString(),
      from: 'me@linux.local',
      to: composeTo,
      subject: composeSubject,
      body: composeBody,
      date: new Date().toLocaleString('zh-CN'),
      read: true,
      starred: false,
      folder: 'sent',
    }
    setEmails(prev => [newEmail, ...prev])
    setComposing(false)
    setReplyingTo(null)
    setCurrentFolder('sent')
    setSelectedId(newEmail.id)
  }

  const folders: Array<{ key: Folder; label: string; icon: string }> = [
    { key: 'inbox', label: '收件箱', icon: '📥' },
    { key: 'sent', label: '已发送', icon: '📤' },
    { key: 'drafts', label: '草稿箱', icon: '📝' },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', fontFamily: 'sans-serif', fontSize: 13 }}>
      <div style={{ width: 160, background: '#181825', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 12 }}>
          <button onClick={startCompose} style={{
            width: '100%', padding: '8px', background: '#89b4fa', color: '#1e1e2e',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>
            ✉️ 写邮件
          </button>
        </div>
        {folders.map(f => (
          <div key={f.key} onClick={() => { setCurrentFolder(f.key); setSelectedId(null) }}
            style={{
              padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: currentFolder === f.key ? '#313244' : 'transparent',
              borderLeft: currentFolder === f.key ? '3px solid #89b4fa' : '3px solid transparent',
            }}>
            <span>{f.icon} {f.label}</span>
            {f.key === 'inbox' && unreadCount > 0 && (
              <span style={{ background: '#f38ba8', color: '#1e1e2e', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{unreadCount}</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ width: 280, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #313244' }}>
          <input type="text" placeholder="搜索邮件..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #45475a', background: '#181825', color: '#cdd6f4', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {folderEmails.map(email => (
            <div key={email.id} onClick={() => selectEmail(email.id)}
              style={{
                padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #313244',
                background: selectedId === email.id ? '#313244' : (!email.read ? '#1e1e2e' : 'transparent'),
                borderLeft: !email.read ? '3px solid #89b4fa' : '3px solid transparent',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: !email.read ? 700 : 400, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {currentFolder === 'sent' ? email.to : email.from.split('<')[0].trim()}
                </span>
                <span onClick={(e) => toggleStar(email.id, e)} style={{ cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                  {email.starred ? '⭐' : '☆'}
                </span>
              </div>
              <div style={{ fontWeight: !email.read ? 600 : 400, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {email.subject}
              </div>
              <div style={{ fontSize: 11, color: '#6c7086', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.body.split('\n')[0].substring(0, 50)}
              </div>
              <div style={{ fontSize: 10, color: '#585b70', marginTop: 4 }}>{email.date}</div>
            </div>
          ))}
          {folderEmails.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6c7086', fontSize: 12 }}>
              {searchQuery ? '未找到匹配的邮件' : '暂无邮件'}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {composing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{replyingTo ? '回复邮件' : '新邮件'}</span>
              <button onClick={() => { setComposing(false); setReplyingTo(null) }} style={{ background: 'none', border: 'none', color: '#6c7086', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <input type="text" placeholder="收件人" value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #45475a', background: '#181825', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input type="text" placeholder="主题" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #45475a', background: '#181825', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1, marginBottom: 12 }}>
              <textarea placeholder="正文..." value={composeBody} onChange={(e) => setComposeBody(e.target.value)}
                style={{ width: '100%', height: '100%', padding: '10px', borderRadius: 4, border: '1px solid #45475a', background: '#181825', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'none', lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={sendEmail} disabled={!composeTo.trim() || !composeSubject.trim()}
                style={{
                  padding: '8px 20px', background: (!composeTo.trim() || !composeSubject.trim()) ? '#45475a' : '#89b4fa',
                  color: '#1e1e2e', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}>
                发送
              </button>
              <button onClick={() => { setComposing(false); setReplyingTo(null) }}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #45475a', color: '#cdd6f4', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                取消
              </button>
            </div>
          </div>
        ) : selectedEmail ? (
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{selectedEmail.subject}</h2>
                <div style={{ fontSize: 12, color: '#a6adc8' }}>
                  <div>发件人: {selectedEmail.from}</div>
                  <div>收件人: {selectedEmail.to}</div>
                  <div>日期: {selectedEmail.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => toggleStar(selectedEmail.id)} style={emailActionBtn}>
                  {selectedEmail.starred ? '⭐' : '☆'}
                </button>
                <button onClick={() => startReply(selectedEmail)} style={emailActionBtn}>↩ 回复</button>
                <button onClick={() => deleteEmail(selectedEmail.id)} style={{ ...emailActionBtn, color: '#f38ba8' }}>🗑️</button>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #313244', paddingTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 13 }}>
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c7086' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
              <div style={{ fontSize: 14 }}>选择一封邮件查看</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const emailActionBtn: React.CSSProperties = {
  padding: '4px 10px', background: 'transparent', border: '1px solid #45475a',
  color: '#cdd6f4', borderRadius: 4, cursor: 'pointer', fontSize: 12
}
