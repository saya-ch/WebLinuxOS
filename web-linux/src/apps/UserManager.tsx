import { useState } from 'react'

interface User {
  id: string
  username: string
  fullName: string
  groups: string[]
  home: string
  shell: string
  lastLogin: string
  accountType: 'admin' | 'standard'
}

const initialUsers: User[] = [
  { id: '1', username: 'root', fullName: '系统管理员', groups: ['root', 'sudo'], home: '/root', shell: '/bin/bash', lastLogin: '2024-05-17 08:00', accountType: 'admin' },
  { id: '2', username: 'user', fullName: '普通用户', groups: ['user', 'audio', 'video'], home: '/home/user', shell: '/bin/bash', lastLogin: '2024-05-17 09:30', accountType: 'standard' },
  { id: '3', username: 'dev', fullName: '开发者', groups: ['dev', 'docker', 'sudo'], home: '/home/dev', shell: '/bin/zsh', lastLogin: '2024-05-17 07:15', accountType: 'admin' },
  { id: '4', username: 'www-data', fullName: 'Web 服务', groups: ['www-data'], home: '/var/www', shell: '/usr/sbin/nologin', lastLogin: '从未', accountType: 'standard' },
  { id: '5', username: 'postgres', fullName: '数据库管理员', groups: ['postgres'], home: '/var/lib/postgresql', shell: '/bin/bash', lastLogin: '2024-05-16 22:00', accountType: 'standard' },
]

export default function UserManager() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [newUser, setNewUser] = useState({ username: '', fullName: '', accountType: 'standard' as 'admin' | 'standard', password: '' })

  const selectUser = (user: User) => {
    setSelectedUser(user)
    setEditing(false)
    setShowAdd(false)
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
    setUsers((prev) => prev.filter((u) => u.id !== id))
    if (selectedUser?.id === id) setSelectedUser(null)
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
    }
    setUsers((prev) => [...prev, user])
    setSelectedUser(user)
    setNewUser({ username: '', fullName: '', accountType: 'standard', password: '' })
    setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ width: '220px', borderRight: '1px solid #313244', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a6adc8' }}>用户列表</span>
          <button
            onClick={() => { setShowAdd(!showAdd); setEditing(false) }}
            style={{
              padding: '3px 8px', background: '#a6e3a1', color: '#1e1e2e',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            }}
          >
            + 添加
          </button>
        </div>
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => selectUser(user)}
            style={{
              padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', marginBottom: '3px',
              background: selectedUser?.id === user.id ? '#313244' : 'transparent',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600 }}>{user.fullName}</div>
            <div style={{ color: '#a6adc8' }}>@{user.username}</div>
            <div style={{ fontSize: '10px', color: user.accountType === 'admin' ? '#f9e2af' : '#6c7086' }}>
              {user.accountType === 'admin' ? '管理员' : '标准用户'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {showAdd ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>添加用户</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
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
        ) : selectedUser ? (
          <>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              👤 {editing ? '编辑用户' : selectedUser.fullName}
            </div>

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
                    { label: '用户组', value: selectedUser.groups.join(', ') },
                    { label: '账户类型', value: selectedUser.accountType === 'admin' ? '管理员' : '标准用户' },
                    { label: '最后登录', value: selectedUser.lastLogin },
                  ].map((item) => (
                    <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 10px' }}>
                      <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
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
                  <button style={{ padding: '8px 16px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    修改密码
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
      </div>
    </div>
  )
}