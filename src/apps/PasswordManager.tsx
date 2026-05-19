import { useState } from 'react'
import { useStore } from '../store'

interface PasswordEntry {
  id: string
  website: string
  url: string
  username: string
  password: string
  notes: string
}

const presetEntries: PasswordEntry[] = [
  { id: '1', website: 'GitHub', url: 'github.com', username: 'dev_user', password: 'Gh@12345!Secure', notes: '代码托管平台' },
  { id: '2', website: 'Google', url: 'google.com', username: 'user@gmail.com', password: 'Go0gle#2025!', notes: '邮箱和搜索' },
  { id: '3', website: '阿里云', url: 'aliyun.com', username: 'admin@company.com', password: 'AliYun@2025#Cn', notes: '云服务器控制台' },
  { id: '4', website: '微信公众平台', url: 'mp.weixin.qq.com', username: 'wechat_admin', password: 'WxMp@2025!Plat', notes: '公众号管理' },
]

export default function PasswordManager() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [entries, setEntries] = useState<PasswordEntry[]>(presetEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({ website: '', url: '', username: '', password: '', notes: '' })

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const cardBg = isDark ? '#16213e' : '#fff'
  const accent = isDark ? '#4fc3f7' : '#1976d2'

  const filtered = entries.filter((e) =>
    e.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPasswordStrength = (password: string): { label: string; color: string; level: number } => {
    if (!password) return { label: '无', color: '#ccc', level: 0 }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (score <= 2) return { label: '弱', color: '#e53935', level: 1 }
    if (score <= 4) return { label: '中等', color: '#ff9800', level: 2 }
    return { label: '强', color: '#4caf50', level: 3 }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, password })
  }

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetForm = () => setForm({ website: '', url: '', username: '', password: '', notes: '' })

  const handleAdd = () => {
    if (!form.website.trim() || !form.password.trim()) return
    const entry: PasswordEntry = { ...form, id: `p${Date.now()}`, website: form.website.trim(), password: form.password.trim() }
    setEntries([entry, ...entries])
    setShowAdd(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!editingId || !form.website.trim()) return
    setEntries(entries.map((e) => (e.id === editingId ? { ...e, ...form } : e)))
    setEditingId(null)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id))
  }

  const startEdit = (entry: PasswordEntry) => {
    setEditingId(entry.id)
    setForm({ website: entry.website, url: entry.url, username: entry.username, password: entry.password, notes: entry.notes })
    setShowAdd(false)
  }

  const strength = form.password ? getPasswordStrength(form.password) : null

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 240, background: isDark ? '#16213e' : '#e8e8e8', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10 }}>
          <input
            type="text" placeholder="搜索密码条目..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null); resetForm() }} style={{
          margin: '0 10px 8px', padding: '6px 12px', borderRadius: 6, border: 'none',
          background: accent, color: '#fff', cursor: 'pointer', fontSize: 12,
        }}>+ 添加密码</button>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((e) => (
            <div key={e.id} style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`,
              background: (showAdd || editingId) ? 'transparent' : (isDark ? '#1a3a5c' : '#f0f0f0'),
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.website}</div>
                  <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888' }}>{e.username}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(e)} style={{
                    padding: '2px 8px', borderRadius: 4, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontSize: 11,
                  }}>编辑</button>
                  <button onClick={() => handleDelete(e.id)} style={{
                    padding: '2px 8px', borderRadius: 4, border: `1px solid ${isDark ? '#e53935' : '#d32f2f'}`, background: 'transparent', color: isDark ? '#e53935' : '#d32f2f', cursor: 'pointer', fontSize: 11,
                  }}>删除</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', flex: 1 }}>
                  {visiblePasswords.has(e.id) ? e.password : '•'.repeat(Math.min(e.password.length, 16))}
                </span>
                <button onClick={() => togglePasswordVisibility(e.id)} style={{
                  padding: '2px 6px', borderRadius: 3, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: 11,
                }}>{visiblePasswords.has(e.id) ? '隐藏' : '显示'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {(showAdd || editingId) ? (
          <div style={{ maxWidth: 420, margin: '0 auto', background: cardBg, borderRadius: 10, padding: 20, border: `1px solid ${borderColor}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>{editingId ? '编辑密码条目' : '添加密码条目'}</h3>
            {[
              { key: 'website', label: '网站/服务名称' },
              { key: 'url', label: '网址 (可选)' },
              { key: 'username', label: '用户名 (可选)' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, marginBottom: 3, color: isDark ? '#9ca3af' : '#666' }}>{label}</div>
                <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, marginBottom: 3, color: isDark ? '#9ca3af' : '#666' }}>密码</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                <button onClick={generatePassword} style={{
                  padding: '7px 12px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap',
                }}>🎲 生成</button>
              </div>
              {strength && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3].map((l) => (
                      <div key={l} style={{
                        width: 40, height: 4, borderRadius: 2,
                        background: l <= strength.level ? strength.color : (isDark ? '#2a2a4a' : '#ddd'),
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, marginBottom: 3, color: isDark ? '#9ca3af' : '#666' }}>备注 (可选)</div>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={editingId ? handleEdit : handleAdd} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                {editingId ? '保存' : '添加'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditingId(null); resetForm() }} style={{ flex: 1, padding: '8px', borderRadius: 6, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, cursor: 'pointer', fontSize: 13 }}>取消</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>密码管理器</div>
            <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#888' }}>
              点击「添加密码」来保存新的密码条目，或从左侧列表管理已有条目
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: isDark ? '#6b7280' : '#aaa' }}>
              ⚠ 注意：此密码管理器仅为模拟演示，密码保存在浏览器内存中
            </div>
          </div>
        )}
      </div>
    </div>
  )
}