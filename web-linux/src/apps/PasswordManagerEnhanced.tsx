import { useState, useEffect, useCallback, memo } from 'react'

interface PasswordEntry {
  id: string
  name: string
  username: string
  password: string
  url?: string
  notes?: string
  category: string
  createdAt: number
  updatedAt: number
  favorite: boolean
}

const CATEGORIES = [
  { name: '社交媒体', icon: '👥', color: '#4299e1' },
  { name: '工作', icon: '💼', color: '#48bb78' },
  { name: '金融', icon: '💰', color: '#ed8936' },
  { name: '购物', icon: '🛒', color: '#f687b3' },
  { name: '邮箱', icon: '📧', color: '#667eea' },
  { name: '开发', icon: '💻', color: '#38b2ac' },
  { name: '娱乐', icon: '🎮', color: '#9f7aea' },
  { name: '其他', icon: '📁', color: '#a0aec0' }
]

const PasswordManager = memo(function PasswordManager() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(() => {
    const saved = localStorage.getItem('weblinux-password-manager')
    const encrypted = saved ? localStorage.getItem(`weblinux-pwd-encrypted-${saved}`) : null
    return saved && encrypted ? JSON.parse(atob(encrypted)) : []
  })
  const [isLocked, setIsLocked] = useState(true)
  const [masterPassword, setMasterPassword] = useState('')
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [newEntry, setNewEntry] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '其他'
  })

  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  })

  const [generatedPassword, setGeneratedPassword] = useState('')

  const generatePassword = useCallback(() => {
    let charset = ''
    if (generatorOptions.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (generatorOptions.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (generatorOptions.includeNumbers) charset += '0123456789'
    if (generatorOptions.includeSymbols) charset += generatorOptions.customSymbols

    if (generatorOptions.excludeAmbiguous) {
      charset = charset.replace(/[0OlI1|]/g, '')
    }

    let password = ''
    for (let i = 0; i < generatorOptions.length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
    setGeneratedPassword(password)
    return password
  }, [generatorOptions])

  useEffect(() => {
    generatePassword()
  }, [generatorOptions, generatePassword])

  const calculateStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (password.length >= 16) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: '弱', color: '#fc8181' }
    if (score <= 4) return { score, label: '中等', color: '#f6ad55' }
    if (score <= 6) return { score, label: '强', color: '#68d391' }
    return { score, label: '非常强', color: '#48bb78' }
  }

  const savePasswords = (newPasswords: PasswordEntry[]) => {
    setPasswords(newPasswords)
    const encrypted = btoa(JSON.stringify(newPasswords))
    localStorage.setItem('weblinux-pwd-encrypted-master', encrypted)
  }

  const unlock = () => {
    const encrypted = localStorage.getItem('weblinux-pwd-encrypted-master')
    if (encrypted) {
      try {
        const decrypted = JSON.parse(atob(encrypted))
        setPasswords(decrypted)
        setIsLocked(false)
      } catch {
        setIsLocked(false)
      }
    } else {
      setIsLocked(false)
    }
  }

  const addPassword = () => {
    if (!newEntry.name || !newEntry.password) return

    const entry: PasswordEntry = {
      id: Date.now().toString(),
      ...newEntry,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      favorite: false
    }

    savePasswords([...passwords, entry])
    setNewEntry({ name: '', username: '', password: '', url: '', notes: '', category: '其他' })
    setShowAddModal(false)
  }

  const updatePassword = (entry: PasswordEntry) => {
    const updated = passwords.map(p => p.id === entry.id ? { ...entry, updatedAt: Date.now() } : p)
    savePasswords(updated)
    setEditingPassword(null)
  }

  const deletePassword = (id: string) => {
    if (confirm('确定要删除这个密码吗？')) {
      savePasswords(passwords.filter(p => p.id !== id))
    }
  }

  const toggleFavorite = (id: string) => {
    const updated = passwords.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p)
    savePasswords(updated)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const filteredPasswords = passwords.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeCategory && p.category !== activeCategory) return false
    return true
  }).sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite ? 1 : -1
    return b.updatedAt - a.updatedAt
  })

  if (isLocked) {
    return (
      <div style={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>密码管理器</h2>
            <p style={{ color: '#718096', fontSize: 14 }}>输入主密码以解锁您的密码库</p>
          </div>
          <input
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && unlock()}
            placeholder="输入主密码"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 16,
              marginBottom: 16,
              outline: 'none'
            }}
          />
          <button
            onClick={unlock}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 8,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            解锁
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', background: '#f7fafc' }}>
      <div style={{ padding: 24, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>密码管理器</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#667eea',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + 添加密码
          </button>
        </div>
        <input
          type="text"
          placeholder="搜索密码..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            outline: 'none'
          }}
        />
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: !activeCategory ? '#667eea' : '#edf2f7',
            color: !activeCategory ? '#fff' : '#4a5568',
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          全部
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name === activeCategory ? null : cat.name)}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              background: cat.name === activeCategory ? cat.color : '#edf2f7',
              color: cat.name === activeCategory ? '#fff' : '#4a5568',
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, overflow: 'auto' }}>
        {filteredPasswords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔐</div>
            <p style={{ fontSize: 18 }}>暂无保存的密码</p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                marginTop: 16,
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#667eea',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              添加第一个密码
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredPasswords.map(entry => {
              const category = CATEGORIES.find(c => c.name === entry.category) || CATEGORIES[7]
              const strength = calculateStrength(entry.password)

              return (
                <div
                  key={entry.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${category.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24
                      }}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {entry.favorite && '⭐'}
                          {entry.name}
                        </h3>
                        <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>{entry.username}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleFavorite(entry.id)}
                        style={{
                          padding: '8px',
                          borderRadius: 6,
                          border: 'none',
                          background: entry.favorite ? '#fef3c7' : '#f7fafc',
                          cursor: 'pointer',
                          fontSize: 16
                        }}
                      >
                        {entry.favorite ? '⭐' : '☆'}
                      </button>
                      <button
                        onClick={() => setEditingPassword(entry)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deletePassword(entry.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#fc8181',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#f7fafc', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#718096' }}>密码:</span>
                        <span style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: 14 }}>
                          {showPassword === entry.id ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setShowPassword(showPassword === entry.id ? null : entry.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          {showPassword === entry.id ? '隐藏' : '显示'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(entry.password, entry.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: 'none',
                            background: copiedId === entry.id ? '#48bb78' : '#667eea',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          {copiedId === entry.id ? '已复制!' : '复制'}
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#718096' }}>强度:</span>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${(strength.score / 7) * 100}%`,
                            height: '100%',
                            background: strength.color,
                            transition: 'all 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    </div>
                  </div>

                  {entry.url && (
                    <div style={{ fontSize: 13, color: '#667eea', marginBottom: 8 }}>
                      🌐 {entry.url}
                    </div>
                  )}
                  {entry.notes && (
                    <div style={{ fontSize: 13, color: '#718096' }}>
                      📝 {entry.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            width: 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>添加新密码</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>名称</label>
              <input
                type="text"
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                placeholder="例如: GitHub"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>用户名/邮箱</label>
              <input
                type="text"
                value={newEntry.username}
                onChange={(e) => setNewEntry({ ...newEntry, username: e.target.value })}
                placeholder="用户名或邮箱"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>密码</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newEntry.password}
                  onChange={(e) => setNewEntry({ ...newEntry, password: e.target.value })}
                  placeholder="输入密码"
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
                <button
                  onClick={() => setNewEntry({ ...newEntry, password: generatePassword() })}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid #667eea',
                    background: '#fff',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  生成
                </button>
              </div>
              {newEntry.password && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(calculateStrength(newEntry.password).score / 7) * 100}%`,
                        height: '100%',
                        background: calculateStrength(newEntry.password).color
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: calculateStrength(newEntry.password).color }}>
                    {calculateStrength(newEntry.password).label}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>网站URL</label>
              <input
                type="text"
                value={newEntry.url}
                onChange={(e) => setNewEntry({ ...newEntry, url: e.target.value })}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>分类</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setNewEntry({ ...newEntry, category: cat.name })}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: 'none',
                      background: newEntry.category === cat.name ? cat.color : '#edf2f7',
                      color: newEntry.category === cat.name ? '#fff' : '#4a5568',
                      cursor: 'pointer',
                      fontSize: 13
                    }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>备注</label>
              <textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="添加备注..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 24, padding: 16, background: '#f7fafc', borderRadius: 8 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>密码生成器</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>长度: {generatorOptions.length}</label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={generatorOptions.length}
                  onChange={(e) => setGeneratorOptions({ ...generatorOptions, length: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { key: 'includeUppercase', label: '大写字母' },
                  { key: 'includeLowercase', label: '小写字母' },
                  { key: 'includeNumbers', label: '数字' },
                  { key: 'includeSymbols', label: '特殊字符' }
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={generatorOptions[opt.key as keyof typeof generatorOptions] as boolean}
                      onChange={(e) => setGeneratorOptions({ ...generatorOptions, [opt.key]: e.target.checked })}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div style={{ background: '#2d3748', color: '#e2e8f0', padding: 12, borderRadius: 6, fontFamily: 'Monaco, monospace', fontSize: 14, marginBottom: 8 }}>
                {generatedPassword}
              </div>
              <button
                onClick={generatePassword}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#667eea',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                重新生成
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                取消
              </button>
              <button
                onClick={addPassword}
                disabled={!newEntry.name || !newEntry.password}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: newEntry.name && newEntry.password ? '#667eea' : '#ccc',
                  color: '#fff',
                  cursor: newEntry.name && newEntry.password ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPassword && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            width: 500
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>编辑密码</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>名称</label>
              <input
                type="text"
                value={editingPassword.name}
                onChange={(e) => setEditingPassword({ ...editingPassword, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>用户名</label>
              <input
                type="text"
                value={editingPassword.username}
                onChange={(e) => setEditingPassword({ ...editingPassword, username: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>密码</label>
              <input
                type="text"
                value={editingPassword.password}
                onChange={(e) => setEditingPassword({ ...editingPassword, password: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingPassword(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={() => updatePassword(editingPassword)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#667eea',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default PasswordManager
