import { useState } from 'react'

interface User {
  id: string
  username: string
  fullName: string
  avatar: string
  groups: string[]
  role: 'admin' | 'user' | 'guest'
  locked: boolean
  homeDir: string
  shell: string
  lastLogin: string
  password: string
}

interface UserGroup {
  id: string
  name: string
  members: string[]
  description: string
}

interface ActivityLog {
  id: string
  userId: string
  action: 'login' | 'logout' | 'password_change' | 'lock' | 'unlock' | 'create' | 'delete'
  timestamp: string
  detail: string
}

const AVATARS = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧓', '👴', '🧔', '👱', '🧑‍💻', '👨‍🔧', '👩‍⚕️', '🧑‍🎓', '🦸', '🧙']

const initialUsers: User[] = [
  { id: '1', username: 'root', fullName: '系统管理员', avatar: '🧑‍💻', groups: ['root', 'sudo'], role: 'admin', locked: false, homeDir: '/root', shell: '/bin/bash', lastLogin: '2024-05-20 08:30', password: 'root123' },
  { id: '2', username: 'user', fullName: '普通用户', avatar: '👤', groups: ['users'], role: 'user', locked: false, homeDir: '/home/user', shell: '/bin/bash', lastLogin: '2024-05-20 09:15', password: 'user123' },
  { id: '3', username: 'guest', fullName: '访客用户', avatar: '👧', groups: ['users'], role: 'guest', locked: true, homeDir: '/home/guest', shell: '/bin/sh', lastLogin: '2024-05-19 14:00', password: 'guest123' },
]

const initialGroups: UserGroup[] = [
  { id: 'g1', name: 'root', members: ['1'], description: '超级用户组' },
  { id: 'g2', name: 'users', members: ['2', '3'], description: '普通用户组' },
  { id: 'g3', name: 'sudo', members: ['1'], description: '管理员权限组' },
  { id: 'g4', name: 'docker', members: ['1', '2'], description: 'Docker 用户组' },
]

const initialLogs: ActivityLog[] = [
  { id: 'l1', userId: '1', action: 'login', timestamp: '2024-05-20 08:30', detail: 'root 登录系统' },
  { id: 'l2', userId: '2', action: 'login', timestamp: '2024-05-20 09:15', detail: 'user 登录系统' },
  { id: 'l3', userId: '3', action: 'lock', timestamp: '2024-05-19 16:00', detail: 'guest 账户已被锁定' },
  { id: 'l4', userId: '1', action: 'password_change', timestamp: '2024-05-19 10:00', detail: 'root 修改了密码' },
  { id: 'l5', userId: '2', action: 'logout', timestamp: '2024-05-19 18:00', detail: 'user 登出系统' },
]

const actionColors: Record<string, string> = {
  login: '#a6e3a1', logout: '#f9e2af', password_change: '#fab387', lock: '#f38ba8', unlock: '#89b4fa', create: '#cba6f7', delete: '#f38ba8',
}

const actionLabels: Record<string, string> = {
  login: '登录', logout: '登出', password_change: '改密', lock: '锁定', unlock: '解锁', create: '创建', delete: '删除',
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [groups, setGroups] = useState<UserGroup[]>(initialGroups)
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
  const [selectedUserId, setSelectedUserId] = useState<string | null>('1')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailTab, setDetailTab] = useState<'info' | 'groups' | 'logs'>('info')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', fullName: '', role: 'user' as 'admin' | 'user' | 'guest', password: '', avatar: '👤' })
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const userLogs = logs.filter((l) => l.userId === selectedUserId)

  const addLog = (userId: string, action: ActivityLog['action'], detail: string) => {
    setLogs((prev) => [{ id: Date.now().toString(), userId, action, timestamp: new Date().toLocaleString('zh-CN'), detail }, ...prev])
  }

  const handleAddUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return
    const id = Date.now().toString()
    const user: User = {
      id, username: newUser.username, fullName: newUser.fullName || newUser.username,
      avatar: newUser.avatar, groups: ['users'], role: newUser.role, locked: false,
      homeDir: `/home/${newUser.username}`, shell: '/bin/bash',
      lastLogin: '-', password: newUser.password,
    }
    setUsers((prev) => [...prev, user])
    setGroups((prev) => prev.map((g) => g.name === 'users' ? { ...g, members: [...g.members, id] } : g))
    addLog(id, 'create', `${newUser.username} 账户已创建`)
    setShowAddUser(false)
    setNewUser({ username: '', fullName: '', role: 'user', password: '', avatar: '👤' })
  }

  const handleDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (!user || user.username === 'root') return
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setGroups((prev) => prev.map((g) => ({ ...g, members: g.members.filter((m) => m !== id) })))
    addLog(id, 'delete', `${user.username} 账户已删除`)
    if (selectedUserId === id) setSelectedUserId(null)
  }

  const toggleLock = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, locked: !u.locked } : u))
    const user = users.find((u) => u.id === id)
    if (user) {
      addLog(id, user.locked ? 'unlock' : 'lock', `${user.username} 账户${user.locked ? '已解锁' : '已锁定'}`)
    }
  }

  const handleChangePassword = () => {
    setPasswordError('')
    if (!selectedUser) return
    if (passwordForm.old !== selectedUser.password) { setPasswordError('旧密码不正确'); return }
    if (passwordForm.new.length < 6) { setPasswordError('新密码至少6个字符'); return }
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('两次输入的密码不一致'); return }
    setUsers((prev) => prev.map((u) => u.id === selectedUserId ? { ...u, password: passwordForm.new } : u))
    addLog(selectedUserId!, 'password_change', `${selectedUser.username} 修改了密码`)
    setShowPasswordDialog(false)
    setPasswordForm({ old: '', new: '', confirm: '' })
  }

  const toggleUserGroup = (userId: string, groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    const isMember = group.members.includes(userId)
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, members: isMember ? g.members.filter((m) => m !== userId) : [...g.members, userId] } : g))
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, groups: isMember ? u.groups.filter((g) => g !== group.name) : [...u.groups, group.name] } : u))
  }

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return
    const id = Date.now().toString()
    setGroups((prev) => [...prev, { id, name: newGroupName, members: [], description: newGroupDesc || newGroupName }])
    setShowAddGroup(false)
    setNewGroupName('')
    setNewGroupDesc('')
  }

  const handleDeleteGroup = (id: string) => {
    const group = groups.find((g) => g.id === id)
    if (!group || group.name === 'root' || group.name === 'users') return
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setUsers((prev) => prev.map((u) => ({ ...u, groups: u.groups.filter((g) => g !== group.name) })))
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ width: 260, borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244' }}>
          <input
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户..."
            style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => { setSelectedUserId(u.id); setDetailTab('info') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                background: selectedUserId === u.id ? '#313244' : 'transparent',
                borderRadius: 6, cursor: 'pointer', marginBottom: 2, fontSize: 13,
                opacity: u.locked ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 20 }}>{u.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {u.username} {u.locked && <span>🔒</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6c7086' }}>{u.fullName} · {u.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
          <button onClick={() => setShowAddUser(true)} style={{ flex: 1, padding: '6px 0', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>添加用户</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 36, cursor: 'pointer' }} onClick={() => setShowAvatarPicker(true)}>{selectedUser.avatar}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedUser.fullName} {selectedUser.locked && <span style={{ fontSize: 12, color: '#f38ba8' }}>已锁定</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6c7086' }}>@{selectedUser.username} · {selectedUser.role === 'admin' ? '管理员' : selectedUser.role === 'user' ? '普通用户' : '访客'}</div>
              </div>
              <button onClick={() => toggleLock(selectedUser.id)} style={{ padding: '5px 12px', background: selectedUser.locked ? '#a6e3a1' : '#f9e2af', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                {selectedUser.locked ? '解锁' : '锁定'}
              </button>
              <button onClick={() => setShowPasswordDialog(true)} style={{ padding: '5px 12px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>修改密码</button>
              {selectedUser.username !== 'root' && (
                <button onClick={() => handleDeleteUser(selectedUser.id)} style={{ padding: '5px 12px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>删除</button>
              )}
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
              {(['info', 'groups', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'transparent', border: 'none', borderBottom: detailTab === tab ? '2px solid #89b4fa' : '2px solid transparent',
                    color: detailTab === tab ? '#89b4fa' : '#6c7086', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  {tab === 'info' ? '信息' : tab === 'groups' ? '用户组' : '活动日志'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {detailTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: '用户名', value: selectedUser.username },
                    { label: '全名', value: selectedUser.fullName },
                    { label: '角色', value: selectedUser.role === 'admin' ? '管理员' : selectedUser.role === 'user' ? '普通用户' : '访客' },
                    { label: '主目录', value: selectedUser.homeDir },
                    { label: 'Shell', value: selectedUser.shell },
                    { label: '最后登录', value: selectedUser.lastLogin },
                    { label: '用户组', value: selectedUser.groups.join(', ') },
                    { label: '状态', value: selectedUser.locked ? '已锁定' : '活跃' },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: '10px 12px', background: '#313244', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: '#6c7086', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'groups' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>用户组管理</span>
                    <button onClick={() => setShowAddGroup(true)} style={{ padding: '4px 12px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>新建组</button>
                  </div>
                  {groups.map((group) => {
                    const isMember = group.members.includes(selectedUser.id)
                    return (
                      <div key={group.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#313244', borderRadius: 6, marginBottom: 6, gap: 10 }}>
                        <button
                          onClick={() => toggleUserGroup(selectedUser.id, group.id)}
                          style={{ padding: '4px 10px', background: isMember ? '#a6e3a1' : '#45475a', color: isMember ? '#1e1e2e' : '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                        >
                          {isMember ? '已加入' : '加入'}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{group.name}</div>
                          <div style={{ fontSize: 11, color: '#6c7086' }}>{group.description} · {group.members.length} 成员</div>
                        </div>
                        {group.name !== 'root' && group.name !== 'users' && (
                          <button onClick={() => handleDeleteGroup(group.id)} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid #f38ba8', color: '#f38ba8', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>删除</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {detailTab === 'logs' && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>活动日志</div>
                  {userLogs.length === 0 && <div style={{ fontSize: 12, color: '#6c7086', textAlign: 'center' }}>暂无活动记录</div>}
                  {userLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#313244', borderRadius: 6, marginBottom: 4, gap: 10, fontSize: 12 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: actionColors[log.action] + '30', color: actionColors[log.action] }}>
                        {actionLabels[log.action]}
                      </span>
                      <span style={{ flex: 1 }}>{log.detail}</span>
                      <span style={{ color: '#6c7086', fontSize: 11 }}>{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086', fontSize: 14 }}>选择一个用户查看详情</div>
        )}
      </div>

      {showAddUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddUser(false)}>
          <div style={{ background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 12, padding: 20, width: 360 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>添加新用户</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>头像</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {AVATARS.map((a) => (
                  <span key={a} onClick={() => setNewUser((p) => ({ ...p, avatar: a }))} style={{ fontSize: 22, cursor: 'pointer', padding: 2, borderRadius: 4, background: newUser.avatar === a ? '#45475a' : 'transparent' }}>{a}</span>
                ))}
              </div>
            </div>
            {[
              { label: '用户名', value: newUser.username, onChange: (v: string) => setNewUser((p) => ({ ...p, username: v })) },
              { label: '全名', value: newUser.fullName, onChange: (v: string) => setNewUser((p) => ({ ...p, fullName: v })) },
              { label: '密码', value: newUser.password, onChange: (v: string) => setNewUser((p) => ({ ...p, password: v })) },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>{field.label}</label>
                <input value={field.value} onChange={(e) => field.onChange(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>角色</label>
              <select value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as User['role'] }))} style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
                <option value="admin">管理员</option><option value="user">普通用户</option><option value="guest">访客</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddUser(false)} style={{ padding: '6px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>取消</button>
              <button onClick={handleAddUser} style={{ padding: '6px 16px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordDialog && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowPasswordDialog(false); setPasswordError('') }}>
          <div style={{ background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 12, padding: 20, width: 340 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>修改密码 - {selectedUser.username}</div>
            {[
              { label: '旧密码', value: passwordForm.old, onChange: (v: string) => setPasswordForm((p) => ({ ...p, old: v })) },
              { label: '新密码', value: passwordForm.new, onChange: (v: string) => setPasswordForm((p) => ({ ...p, new: v })) },
              { label: '确认密码', value: passwordForm.confirm, onChange: (v: string) => setPasswordForm((p) => ({ ...p, confirm: v })) },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>{field.label}</label>
                <input type="password" value={field.value} onChange={(e) => field.onChange(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {passwordError && <div style={{ fontSize: 12, color: '#f38ba8', marginBottom: 8 }}>{passwordError}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPasswordDialog(false); setPasswordError('') }} style={{ padding: '6px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>取消</button>
              <button onClick={handleChangePassword} style={{ padding: '6px 16px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showAvatarPicker && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAvatarPicker(false)}>
          <div style={{ background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 12, padding: 20, width: 300 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>选择头像</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AVATARS.map((a) => (
                <span
                  key={a}
                  onClick={() => { setUsers((prev) => prev.map((u) => u.id === selectedUserId ? { ...u, avatar: a } : u)); setShowAvatarPicker(false) }}
                  style={{ fontSize: 28, cursor: 'pointer', padding: 6, borderRadius: 8, background: selectedUser.avatar === a ? '#45475a' : 'transparent' }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddGroup(false)}>
          <div style={{ background: '#1e1e2e', border: '1px solid #45475a', borderRadius: 12, padding: 20, width: 300 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>新建用户组</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>组名</label>
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#a6adc8', display: 'block', marginBottom: 4 }}>描述</label>
              <input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} style={{ width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddGroup(false)} style={{ padding: '6px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>取消</button>
              <button onClick={handleAddGroup} style={{ padding: '6px 16px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
