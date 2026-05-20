import { useState, useCallback } from 'react'

interface User {
  id: string
  username: string
  fullName: string
  groups: string[]
  home: string
  shell: string
  lastLogin: string
  accountType: 'admin' | 'standard'
  avatar: string
  locked: boolean
  password: string
}

interface UserGroup {
  id: string
  name: string
  description: string
}

interface ActivityLog {
  id: string
  userId: string
  username: string
  action: 'login' | 'logout' | 'password_change' | 'lock' | 'unlock' | 'create' | 'delete'
  timestamp: string
}

const avatarOptions = ['👤', '👨‍💻', '👩‍💻', '🧑‍🔬', '🧑‍🎨', '🧑‍🚀', '🧑‍🍳', '🧑‍🎓', '🦊', '🐱', '🐶', '🦁', '🐸', '🤖', '👾', '🧙']

const initialGroups: UserGroup[] = [
  { id: 'g1', name: 'root', description: '超级用户组' },
  { id: 'g2', name: 'sudo', description: '管理员权限组' },
  { id: 'g3', name: 'user', description: '普通用户组' },
  { id: 'g4', name: 'dev', description: '开发组' },
  { id: 'g5', name: 'docker', description: 'Docker 用户组' },
  { id: 'g6', name: 'audio', description: '音频设备访问组' },
  { id: 'g7', name: 'video', description: '视频设备访问组' },
  { id: 'g8', name: 'www-data', description: 'Web 服务组' },
  { id: 'g9', name: 'postgres', description: '数据库组' },
]

const initialActivityLogs: ActivityLog[] = [
  { id: 'al1', userId: '1', username: 'root', action: 'login', timestamp: '2024-05-17 08:00' },
  { id: 'al2', userId: '2', username: 'user', action: 'login', timestamp: '2024-05-17 09:30' },
  { id: 'al3', userId: '3', username: 'dev', action: 'login', timestamp: '2024-05-17 07:15' },
  { id: 'al4', userId: '2', username: 'user', action: 'logout', timestamp: '2024-05-17 12:00' },
  { id: 'al5', userId: '1', username: 'root', action: 'password_change', timestamp: '2024-05-16 18:00' },
]

const initialUsers: User[] = [
  { id: '1', username: 'root', fullName: '系统管理员', groups: ['root', 'sudo'], home: '/root', shell: '/bin/bash', lastLogin: '2024-05-17 08:00', accountType: 'admin', avatar: '🧙', locked: false, password: 'root123' },
  { id: '2', username: 'user', fullName: '普通用户', groups: ['user', 'audio', 'video'], home: '/home/user', shell: '/bin/bash', lastLogin: '2024-05-17 09:30', accountType: 'standard', avatar: '👤', locked: false, password: 'user123' },
  { id: '3', username: 'dev', fullName: '开发者', groups: ['dev', 'docker', 'sudo'], home: '/home/dev', shell: '/bin/zsh', lastLogin: '2024-05-17 07:15', accountType: 'admin', avatar: '👨‍💻', locked: false, password: 'dev123' },
  { id: '4', username: 'www-data', fullName: 'Web 服务', groups: ['www-data'], home: '/var/www', shell: '/usr/sbin/nologin', lastLogin: '从未', accountType: 'standard', avatar: '🤖', locked: false, password: '' },
  { id: '5', username: 'postgres', fullName: '数据库管理员', groups: ['postgres'], home: '/var/lib/postgresql', shell: '/bin/bash', lastLogin: '2024-05-16 22:00', accountType: 'standard', avatar: '🧑‍🔬', locked: false, password: 'pg123' },
]

type RightPanel = 'details' | 'add' | 'groups' | 'logs' | 'avatar'

export default function UserManager() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [groups, setGroups] = useState<UserGroup[]>(initialGroups)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [newUser, setNewUser] = useState({ username: '', fullName: '', accountType: 'standard' as 'admin' | 'standard', password: '', avatar: '👤' })
  const [searchQuery, setSearchQuery] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [rightPanel, setRightPanel] = useState<RightPanel>('details')

  const addLog = useCallback((userId: string, username: string, action: ActivityLog['action']) => {
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setActivityLogs((prev) => [{ id: `al-${Date.now()}`, userId, username, action, timestamp: ts }, ...prev].slice(0, 100))
  }, [])

  const selectUser = (user: User) => {
    setSelectedUser(user)
    setEditing(false)
    setShowAdd(false)
    setRightPanel('details')
  }

  const startEdit = () => {
    if (selectedUser) {
      setEditForm({ ...selectedUser })
      setEditing(true)
    }
  }

  const saveEdit = () => {
    if (selectedUser && editForm.fullName) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...editForm } as User : u))
      )
      setSelectedUser({ ...selectedUser, ...editForm } as User)
      setEditing(false)
    }
  }

  const deleteUser = (id: string) => {
    const user = users.find((u) => u.id === id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    if (selectedUser?.id === id) setSelectedUser(null)
    if (user) addLog(id, user.username, 'delete')
  }

  const addUser = () => {
    if (!newUser.username) return
    const user: User = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      fullName: newUser.fullName || newUser.username,
      groups: [newUser.username],
      home: `/home/${newUser.username}`,
      shell: '/bin/bash',
      lastLogin: '从未',
      accountType: newUser.accountType,
      avatar: newUser.avatar,
      locked: false,
      password: newUser.password,
    }
    setUsers((prev) => [...prev, user])
    setSelectedUser(user)
    setNewUser({ username: '', fullName: '', accountType: 'standard', password: '', avatar: '👤' })
    setShowAdd(false)
    addLog(user.id, user.username, 'create')
  }

  const toggleLock = (userId: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u
      const locked = !u.locked
      addLog(userId, u.username, locked ? 'lock' : 'unlock')
      return { ...u, locked }
    }))
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, locked: !prev.locked } : null)
    }
  }

  const changePassword = () => {
    if (!selectedUser) return
    setPasswordError('')
    if (passwordForm.oldPassword !== selectedUser.password) {
      setPasswordError('旧密码不正确')
      return
    }
    if (passwordForm.newPassword.length < 4) {
      setPasswordError('新密码至少4个字符')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, password: passwordForm.newPassword } : u))
    setSelectedUser({ ...selectedUser, password: passwordForm.newPassword })
    addLog(selectedUser.id, selectedUser.username, 'password_change')
    setShowPasswordDialog(false)
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
  }

  const selectAvatar = (avatar: string) => {
    if (!selectedUser) return
    setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, avatar } : u))
    setSelectedUser({ ...selectedUser, avatar })
    setShowAvatarPicker(false)
  }

  const createGroup = () => {
    if (!newGroupName) return
    const g: UserGroup = { id: `g-${Date.now()}`, name: newGroupName, description: newGroupDesc }
    setGroups((prev) => [...prev, g])
    setNewGroupName('')
    setNewGroupDesc('')
  }

  const deleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    setUsers((prev) => prev.map((u) => ({
      ...u,
      groups: u.groups.filter((g) => g !== group.name),
    })))
  }

  const addUserToGroup = (userId: string, groupName: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId || u.groups.includes(groupName)) return u
      return { ...u, groups: [...u.groups, groupName] }
    }))
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev && !prev.groups.includes(groupName) ? { ...prev, groups: [...prev.groups, groupName] } : prev)
    }
  }

  const removeUserFromGroup = (userId: string, groupName: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u
      return { ...u, groups: u.groups.filter((g) => g !== groupName) }
    }))
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, groups: prev.groups.filter((g) => g !== groupName) } : null)
    }
  }

  const getGroupMemberCount = (groupName: string) => {
    return users.filter((u) => u.groups.includes(groupName)).length
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)
  })

  const actionLabel: Record<ActivityLog['action'], string> = {
    login: '登录',
    logout: '登出',
    password_change: '修改密码',
    lock: '锁定账户',
    unlock: '解锁账户',
    create: '创建账户',
    delete: '删除账户',
  }

  const actionColor: Record<ActivityLog['action'], string> = {
    login: '#a6e3a1',
    logout: '#a6adc8',
    password_change: '#f9e2af',
    lock: '#f38ba8',
    unlock: '#a6e3a1',
    create: '#89b4fa',
    delete: '#f38ba8',
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ width: '220px', borderRight: '1px solid #313244', padding: '10px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a6adc8' }}>用户列表</span>
          <button
            onClick={() => { setShowAdd(!showAdd); setEditing(false); setRightPanel('add') }}
            style={{
              padding: '3px 8px', background: '#a6e3a1', color: '#1e1e2e',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            }}
          >
            + 添加
          </button>
        </div>
        <input
          placeholder="搜索用户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '6px 8px', background: '#313244', border: '1px solid #45475a',
            borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none', marginBottom: '8px',
          }}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => selectUser(user)}
              style={{
                padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', marginBottom: '3px',
                background: selectedUser?.id === user.id ? '#313244' : 'transparent',
                fontSize: '12px', opacity: user.locked ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>{user.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                  <div style={{ color: '#a6adc8' }}>@{user.username}</div>
                </div>
                {user.locked && <span style={{ fontSize: '10px', color: '#f38ba8' }}>🔒</span>}
              </div>
              <div style={{ fontSize: '10px', color: user.accountType === 'admin' ? '#f9e2af' : '#6c7086', marginLeft: '22px' }}>
                {user.accountType === 'admin' ? '管理员' : '标准用户'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #313244', paddingTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setRightPanel('groups'); setShowAdd(false) }}
            style={{
              padding: '3px 8px', background: rightPanel === 'groups' ? '#89b4fa' : '#313244',
              color: rightPanel === 'groups' ? '#1e1e2e' : '#cdd6f4',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
            }}
          >
            用户组
          </button>
          <button
            onClick={() => { setRightPanel('logs'); setShowAdd(false) }}
            style={{
              padding: '3px 8px', background: rightPanel === 'logs' ? '#89b4fa' : '#313244',
              color: rightPanel === 'logs' ? '#1e1e2e' : '#cdd6f4',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
            }}
          >
            活动日志
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', position: 'relative' }}>
        {showAdd && rightPanel === 'add' ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>添加用户</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a6adc8' }}>头像</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {avatarOptions.map((a) => (
                    <button
                      key={a}
                      onClick={() => setNewUser({ ...newUser, avatar: a })}
                      style={{
                        width: '32px', height: '32px', border: newUser.avatar === a ? '2px solid #89b4fa' : '1px solid #45475a',
                        borderRadius: '6px', background: newUser.avatar === a ? '#45475a' : '#313244',
                        cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <input
                placeholder="用户名"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              />
              <input
                placeholder="全名"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="密码"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              />
              <select
                value={newUser.accountType}
                onChange={(e) => setNewUser({ ...newUser, accountType: e.target.value as 'admin' | 'standard' })}
                style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              >
                <option value="standard">标准用户</option>
                <option value="admin">管理员</option>
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={addUser}
                  style={{ padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  创建用户
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{ padding: '8px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : rightPanel === 'groups' ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>用户组管理</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', maxWidth: '400px' }}>
              <input
                placeholder="组名"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              />
              <input
                placeholder="描述"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
              />
              <button
                onClick={createGroup}
                style={{ padding: '6px 12px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                创建
              </button>
            </div>
            {groups.map((g) => {
              const memberCount = getGroupMemberCount(g.name)
              const members = users.filter((u) => u.groups.includes(g.name))
              return (
                <div key={g.id} style={{ padding: '10px 12px', background: '#313244', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{g.name}</span>
                      <span style={{ fontSize: '11px', color: '#a6adc8', marginLeft: '8px' }}>{g.description}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#89b4fa' }}>{memberCount} 成员</span>
                      <button
                        onClick={() => deleteGroup(g.id)}
                        style={{ padding: '2px 8px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {members.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {members.map((m) => (
                        <span key={m.id} style={{ padding: '2px 8px', background: '#45475a', borderRadius: '10px', fontSize: '10px', color: '#cdd6f4' }}>
                          {m.avatar} {m.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : rightPanel === 'logs' ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>活动日志</div>
            {activityLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#313244', borderRadius: '6px', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ width: '120px', color: '#6c7086' }}>{log.timestamp}</span>
                <span style={{ width: '100px', fontWeight: 500, color: '#89b4fa' }}>{log.username}</span>
                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', background: `${actionColor[log.action]}20`, color: actionColor[log.action] }}>
                  {actionLabel[log.action]}
                </span>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6c7086', fontSize: '12px' }}>暂无活动记录</div>
            )}
          </div>
        ) : selectedUser ? (
          <>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowAvatarPicker(!showAvatarPicker)}>{selectedUser.avatar}</span>
              {editing ? '编辑用户' : selectedUser.fullName}
              {selectedUser.locked && <span style={{ fontSize: '12px', color: '#f38ba8', fontWeight: 400 }}>🔒 已锁定</span>}
            </div>

            {showAvatarPicker && (
              <div style={{ padding: '10px', background: '#313244', borderRadius: '8px', marginBottom: '12px', maxWidth: '280px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>选择头像</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {avatarOptions.map((a) => (
                    <button
                      key={a}
                      onClick={() => selectAvatar(a)}
                      style={{
                        width: '36px', height: '36px', border: selectedUser.avatar === a ? '2px solid #89b4fa' : '1px solid #45475a',
                        borderRadius: '6px', background: selectedUser.avatar === a ? '#45475a' : '#1e1e2e',
                        cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
                <input
                  placeholder="全名"
                  value={editForm.fullName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                />
                <input
                  placeholder="Shell"
                  value={editForm.shell || ''}
                  onChange={(e) => setEditForm({ ...editForm, shell: e.target.value })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                />
                <select
                  value={editForm.accountType || 'standard'}
                  onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value as 'admin' | 'standard' })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                >
                  <option value="standard">标准用户</option>
                  <option value="admin">管理员</option>
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{ padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    保存
                  </button>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: '用户名', value: selectedUser.username },
                    { label: '全名', value: selectedUser.fullName },
                    { label: '主目录', value: selectedUser.home },
                    { label: 'Shell', value: selectedUser.shell },
                    { label: '账户类型', value: selectedUser.accountType === 'admin' ? '管理员' : '标准用户' },
                    { label: '最后登录', value: selectedUser.lastLogin },
                    { label: '账户状态', value: selectedUser.locked ? '已锁定' : '正常' },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: item.label === '账户状态' ? (selectedUser.locked ? '#f38ba8' : '#a6e3a1') : '#cdd6f4' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>用户组</div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {selectedUser.groups.map((g) => (
                      <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: '#45475a', borderRadius: '10px', fontSize: '11px' }}>
                        <span style={{ color: '#89b4fa' }}>{g}</span>
                        <button
                          onClick={() => removeUserFromGroup(selectedUser.id, g)}
                          style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: '10px', padding: '0', lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {groups.filter((g) => !selectedUser.groups.includes(g.name)).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => addUserToGroup(selectedUser.id, g.name)}
                        style={{ padding: '2px 8px', background: '#313244', border: '1px dashed #45475a', borderRadius: '10px', color: '#a6adc8', cursor: 'pointer', fontSize: '10px' }}
                      >
                        + {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={startEdit}
                    style={{ padding: '8px 16px', background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    style={{ padding: '8px 16px', background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    删除用户
                  </button>
                  <button
                    onClick={() => { setShowPasswordDialog(true); setPasswordError(''); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }) }}
                    style={{ padding: '8px 16px', background: '#f9e2af', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    修改密码
                  </button>
                  <button
                    onClick={() => toggleLock(selectedUser.id)}
                    style={{
                      padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                      background: selectedUser.locked ? '#a6e3a1' : '#f38ba8', color: '#1e1e2e',
                    }}
                  >
                    {selectedUser.locked ? '解锁账户' : '锁定账户'}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086' }}>
            选择一个用户查看详情
          </div>
        )}

        {showPasswordDialog && selectedUser && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}>
            <div style={{ background: '#1e1e2e', border: '1px solid #45475a', borderRadius: '12px', padding: '20px', width: '300px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>修改密码 - {selectedUser.username}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="旧密码"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                />
                <input
                  type="password"
                  placeholder="新密码"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                />
                <input
                  type="password"
                  placeholder="确认新密码"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={{ padding: '8px 10px', background: '#313244', border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none' }}
                />
                {passwordError && <div style={{ fontSize: '11px', color: '#f38ba8' }}>{passwordError}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={changePassword}
                    style={{ padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    确认修改
                  </button>
                  <button
                    onClick={() => setShowPasswordDialog(false)}
                    style={{ padding: '8px 16px', background: '#45475a', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
