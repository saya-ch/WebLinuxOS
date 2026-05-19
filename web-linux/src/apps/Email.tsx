import { useState } from 'react'

interface EmailData {
  id: string
  from: string
  fromAvatar: string
  subject: string
  preview: string
  date: string
  read: boolean
  starred: boolean
  folder: 'inbox' | 'sent' | 'drafts' | 'spam'
  body: string
}

const PRESET_EMAILS: EmailData[] = [
  {
    id: 'e1', from: '张伟', fromAvatar: '👨', subject: '项目进度更新', preview: '本周项目进展顺利，已经完成了前端界面的初步设计...',
    date: '10:30', read: false, starred: true, folder: 'inbox',
    body: '你好！\n\n本周项目进展顺利，已经完成了前端界面的初步设计。\n\n我们计划在下周开始后端API的集成工作。如果你有任何建议或疑问，欢迎随时提出。\n\n祝好，\n张伟'
  },
  {
    id: 'e2', from: '李娜', fromAvatar: '👩', subject: '会议纪要 - 2024年Q2规划', preview: '感谢大家参加今天的会议，以下是会议要点总结...',
    date: '09:15', read: false, starred: false, folder: 'inbox',
    body: '大家好，\n\n感谢大家参加今天的会议。以下是会议要点总结：\n\n1. Q2目标：完成核心功能开发\n2. 时间节点：6月底前完成测试\n3. 资源分配：增加2名开发人员\n\n请各团队按照分工推进。\n\n李娜'
  },
  {
    id: 'e3', from: '王强', fromAvatar: '🧔', subject: '代码审查请求', preview: '请帮忙审查一下我提交的代码，主要涉及用户认证模块...',
    date: '昨天', read: true, starred: false, folder: 'inbox',
    body: '你好，\n\n请帮忙审查一下我提交的代码，主要涉及用户认证模块的重构。\n\nPR链接：https://github.com/example/pr/123\n\n主要改动：\n- 重构了登录逻辑\n- 添加了JWT token刷新机制\n- 修复了remember me功能\n\n谢谢！\n王强'
  },
  {
    id: 'e4', from: '赵敏', fromAvatar: '👱', subject: '设计稿已更新', preview: '根据上次反馈，我已经更新了首页的设计稿，请查看附件...',
    date: '昨天', read: true, starred: true, folder: 'inbox',
    body: 'Hi，\n\n根据上次反馈，我已经更新了首页的设计稿。\n\n主要调整：\n1. 优化了导航栏的布局\n2. 调整了配色方案\n3. 增加了动画过渡效果\n\n设计稿链接：https://figma.com/example\n\n期待你的反馈！\n赵敏'
  },
  {
    id: 'e5', from: '系统通知', fromAvatar: '🧑', subject: '安全更新提醒', preview: '您的系统有3个安全更新等待安装，请及时更新...',
    date: '周一', read: true, starred: false, folder: 'inbox',
    body: '系统通知\n\n您的系统有3个安全更新等待安装：\n\n1. OpenSSL 安全补丁 (CVE-2024-1234)\n2. 内核更新 5.15.0-91\n3. 系统库 libc 更新\n\n请及时更新以确保系统安全。\n\n-- Web Linux 系统管理'
  },
  {
    id: 'e6', from: '陈明', fromAvatar: '👴', subject: '生日快乐！', preview: '祝生日快乐！希望新的一年里事事顺心，阖家幸福...',
    date: '周一', read: true, starred: false, folder: 'inbox',
    body: '生日快乐！🎂\n\n希望新的一年里事事顺心，阖家幸福。\n\n有空一起吃饭聚聚！\n\n陈明'
  },
  {
    id: 'e7', from: '你', fromAvatar: '👤', subject: 'Re: 项目进度更新', preview: '收到，整体进展不错，继续保持这个节奏...',
    date: '10:45', read: true, starred: false, folder: 'sent',
    body: '收到，整体进展不错，继续保持这个节奏。\n\n后端API方面有什么需要协调的随时沟通。\n\n另外请关注一下性能优化的需求。'
  },
  {
    id: 'e8', from: '你', fromAvatar: '👤', subject: '草稿：周报', preview: '本周工作总结：1.完成前端框架搭建 2.修复了3个...',
    date: '未发送', read: true, starred: false, folder: 'drafts',
    body: '本周工作总结：\n1.完成前端框架搭建\n2.修复了3个关键bug\n3.代码审查完成\n4.下周计划...\n\n（待补充）'
  },
  {
    id: 'e9', from: '未知发件人', fromAvatar: '👵', subject: '恭喜！您中奖了！', preview: '恭喜您获得了100万大奖！请点击链接领取...',
    date: '3天前', read: true, starred: false, folder: 'spam',
    body: '恭喜！您中奖了！\n\n您获得了我们平台的100万大奖！\n\n请点击以下链接领取：\nhttp://fake-spam-site.example.com\n\n（此为垃圾邮件示例）'
  },
]

export default function Email() {
  const [emails] = useState<EmailData[]>(PRESET_EMAILS)
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'drafts' | 'spam'>('inbox')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [readEmails, setReadEmails] = useState<Set<string>>(new Set(emails.filter((e) => e.read).map((e) => e.id)))

  const filteredEmails = emails
    .filter((e) => e.folder === selectedFolder)
    .filter((e) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return e.subject.toLowerCase().includes(q) || e.from.toLowerCase().includes(q) || e.preview.toLowerCase().includes(q)
    })

  const selectedEmailData = selectedEmail ? emails.find((e) => e.id === selectedEmail) : null

  const folders: { id: string; name: string; icon: string; count: number }[] = [
    { id: 'inbox', name: '收件箱', icon: '📥', count: emails.filter((e) => e.folder === 'inbox' && !readEmails.has(e.id)).length },
    { id: 'sent', name: '已发送', icon: '📤', count: emails.filter((e) => e.folder === 'sent').length },
    { id: 'drafts', name: '草稿箱', icon: '📝', count: emails.filter((e) => e.folder === 'drafts').length },
    { id: 'spam', name: '垃圾邮件', icon: '🚫', count: emails.filter((e) => e.folder === 'spam').length },
  ]

  const selectEmail = (id: string) => {
    setSelectedEmail(id)
    setReadEmails((prev) => new Set([...prev, id]))
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ width: 180, background: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            onClick={() => setShowCompose(!showCompose)}
            style={{ width: '100%', padding: '8px 16px', background: '#007acc', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            ✏️ 新建邮件
          </button>
        </div>

        <div style={{ padding: '0 8px' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索邮件..."
            style={{
              width: '100%', padding: '5px 10px', border: '1px solid #444', borderRadius: 4,
              background: '#1e1e1e', color: '#ccc', fontSize: 12, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
          {folders.map((f) => (
            <div
              key={f.id}
              style={{
                padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: selectedFolder === f.id ? '#094771' : 'transparent',
                borderLeft: selectedFolder === f.id ? '3px solid #007acc' : '3px solid transparent',
                fontSize: 13
              }}
              onClick={() => { setSelectedFolder(f.id as typeof selectedFolder); setSelectedEmail(null) }}
              onMouseEnter={(e) => { if (selectedFolder !== f.id) e.currentTarget.style.background = '#2a2d2e' }}
              onMouseLeave={(e) => { if (selectedFolder !== f.id) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{f.icon}</span>
              <span style={{ flex: 1 }}>{f.name}</span>
              {f.count > 0 && (
                <span style={{
                  background: '#007acc', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600
                }}>
                  {f.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 320, background: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{folders.find((f) => f.id === selectedFolder)?.name}</span>
          <span style={{ fontSize: 11, color: '#888' }}>{filteredEmails.length} 封</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #333',
                background: selectedEmail === email.id ? '#094771' : 'transparent',
                display: 'flex', gap: 10
              }}
              onClick={() => selectEmail(email.id)}
              onMouseEnter={(e) => { if (selectedEmail !== email.id) e.currentTarget.style.background = '#252526' }}
              onMouseLeave={(e) => { if (selectedEmail !== email.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontSize: 20, flexShrink: 0 }}>{email.fromAvatar}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: readEmails.has(email.id) ? 400 : 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {email.from}
                  </span>
                  {email.starred && <span style={{ fontSize: 12 }}>⭐</span>}
                  {!readEmails.has(email.id) && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#007acc', flexShrink: 0 }} />}
                  <span style={{ fontSize: 10, color: '#888', flexShrink: 0 }}>{email.date}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: readEmails.has(email.id) ? 400 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                  {email.subject}
                </div>
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.preview}
                </div>
              </div>
            </div>
          ))}
          {filteredEmails.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: '#666', fontSize: 13 }}>
              没有邮件
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedEmailData && !showCompose ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #333' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{selectedEmailData.subject}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{selectedEmailData.fromAvatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedEmailData.from}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{selectedEmailData.date}</div>
                </div>
                <button onClick={() => setSelectedEmail(null)} style={actionBtn}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8 }}>
              {selectedEmailData.body}
            </div>
          </>
        ) : showCompose ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>新建邮件</div>
            <input placeholder="收件人" style={composeInput} />
            <input placeholder="主题" style={composeInput} />
            <textarea placeholder="邮件内容..." style={{ ...composeInput, flex: 1, resize: 'none', fontFamily: 'sans-serif' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setShowCompose(false)} style={{ ...composeInput, width: 'auto', padding: '8px 24px', background: '#007acc', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 4 }}>
                发送
              </button>
              <button onClick={() => setShowCompose(false)} style={{ ...composeInput, width: 'auto', padding: '8px 24px', background: '#555', border: 'none', color: '#ccc', cursor: 'pointer', borderRadius: 4 }}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: 14, flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>📧</div>
            <div>选择一封邮件查看内容</div>
            <div style={{ fontSize: 11, color: '#444' }}>或点击"新建邮件"开始撰写</div>
          </div>
        )}
      </div>
    </div>
  )
}

const actionBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #555', color: '#aaa', cursor: 'pointer',
  padding: '3px 10px', borderRadius: 3, fontSize: 14
}

const composeInput: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #444', borderRadius: 4,
  background: '#2d2d2d', color: '#d4d4d4', fontSize: 13, outline: 'none',
  marginBottom: 8, boxSizing: 'border-box'
}