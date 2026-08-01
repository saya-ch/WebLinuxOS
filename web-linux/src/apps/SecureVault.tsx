import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useStore } from '../store'

interface PasswordEntry {
  id: string
  name: string
  username: string
  password: string
  url?: string
  notes?: string
  icon?: string
  category: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
}

interface EncryptedData {
  ciphertext: string
  iv: string
  salt: string
}

const STORAGE_KEY = 'securevault_encrypted_data'
const META_KEY = 'securevault_meta'

const DEFAULT_CATEGORIES = [
  { name: '社交媒体', icon: '👥', color: '#4299e1' },
  { name: '工作', icon: '💼', color: '#48bb78' },
  { name: '金融', icon: '💰', color: '#ed8936' },
  { name: '购物', icon: '🛒', color: '#f687b3' },
  { name: '邮箱', icon: '📧', color: '#667eea' },
  { name: '开发', icon: '💻', color: '#38b2ac' },
  { name: '娱乐', icon: '🎮', color: '#9f7aea' },
  { name: '医疗', icon: '🏥', color: '#f56565' },
  { name: '教育', icon: '🎓', color: '#667eea' },
  { name: '其他', icon: '📁', color: '#a0aec0' }
]

const ICON_OPTIONS = ['🔐', '🌐', '📧', '💼', '💰', '🛒', '🎮', '📱', '🏥', '🎓', '💻', '📁', '🚀', '⭐', '🔑', '🎨', '📰', '🎵', '📷', '⚙️']

const STRENGTH_LEVELS = [
  { min: 0, max: 20, label: '极弱', color: '#ef4444' },
  { min: 20, max: 40, label: '弱', color: '#f97316' },
  { min: 40, max: 60, label: '中等', color: '#f59e0b' },
  { min: 60, max: 80, label: '强', color: '#22c55e' },
  { min: 80, max: 101, label: '极强', color: '#10b981' }
]

function getStrength(pwd: string) {
  if (!pwd) return { score: 0, level: STRENGTH_LEVELS[0] }
  let score = 0
  if (pwd.length >= 6) score += 10
  if (pwd.length >= 10) score += 15
  if (pwd.length >= 14) score += 15
  if (pwd.length >= 20) score += 10
  if (/[a-z]/.test(pwd)) score += 10
  if (/[A-Z]/.test(pwd)) score += 10
  if (/[0-9]/.test(pwd)) score += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 15
  if (new Set(pwd).size >= pwd.length * 0.6) score += 5
  const level = STRENGTH_LEVELS.find(l => score >= l.min && score < l.max) || STRENGTH_LEVELS[0]
  return { score, level }
}

function generateStrongPassword(
  length: number,
  opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean }
): string {
  let charset = ''
  if (opts.upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (opts.lower) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (opts.numbers) charset += '0123456789'
  if (opts.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
  if (opts.excludeAmbiguous) {
    charset = charset.replace(/[0OlI1|`'"]/g, '')
  }
  if (!charset) return ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length]
  }
  return result
}

async function deriveKey(masterPassword: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(masterPassword), 'PBKDF2', false, ['deriveKey'])
  const saltBuffer = new Uint8Array(JSON.parse(atob(salt)))
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function randomSalt(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return btoa(JSON.stringify(Array.from(buf)))
}

function randomIV(): string {
  const buf = new Uint8Array(12)
  crypto.getRandomValues(buf)
  return btoa(JSON.stringify(Array.from(buf)))
}

async function encryptData(key: CryptoKey, data: string): Promise<EncryptedData> {
  const ivStr = randomIV()
  const iv = new Uint8Array(JSON.parse(atob(ivStr)))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(data))
  return { ciphertext: bufToB64(ciphertext), iv: ivStr, salt: '' }
}

async function decryptData(key: CryptoKey, enc: EncryptedData): Promise<string> {
  const iv = new Uint8Array(JSON.parse(atob(enc.iv)))
  const cipherBuf = b64ToBuf(enc.ciphertext)
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf)
  return new TextDecoder().decode(dec)
}

const SecureVault = memo(function SecureVault() {
  const { theme } = useStore()
  const isDark = theme === 'dark'

  const [entries, setEntries] = useState<PasswordEntry[]>([])
  const [isLocked, setIsLocked] = useState(true)
  const [, setIsInitialized] = useState(false)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [masterPassword, setMasterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [, setClipboardTimers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false
  })

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    icon: '🔐',
    category: '社交媒体',
    tags: ''
  })

  const [generatedPwd, setGeneratedPwd] = useState('')
  const [showGenerator, setShowGenerator] = useState(false)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importPassword, setImportPassword] = useState('')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const meta = localStorage.getItem(META_KEY)
      const data = localStorage.getItem(STORAGE_KEY)
      if (meta && data) {
        setIsInitialized(true)
      } else {
        setIsInitialized(false)
        setIsCreating(true)
      }
    } catch {
      setIsCreating(true)
    }
  }, [])

  const saveEntries = useCallback(async (newEntries: PasswordEntry[]) => {
    if (!cryptoKey) return
    setEntries(newEntries)
    try {
      const jsonStr = JSON.stringify(newEntries)
      const meta = localStorage.getItem(META_KEY)
      let salt: string
      if (meta) {
        salt = JSON.parse(meta).salt
      } else {
        salt = randomSalt()
        localStorage.setItem(META_KEY, JSON.stringify({ salt, version: 1 }))
      }
      const encrypted = await encryptData(cryptoKey, jsonStr)
      encrypted.salt = salt
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted))
    } catch (err) {
      console.error('保存失败:', err)
    }
  }, [cryptoKey])

  const createVault = useCallback(async () => {
    if (!masterPassword || masterPassword.length < 4) {
      setErrorMsg('主密码至少需要4位')
      return
    }
    if (masterPassword !== confirmPassword) {
      setErrorMsg('两次输入的密码不一致')
      return
    }
    try {
      const salt = randomSalt()
      localStorage.setItem(META_KEY, JSON.stringify({ salt, version: 1 }))
      const key = await deriveKey(masterPassword, salt)
      setCryptoKey(key)
      setEntries([])
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ciphertext: '', iv: '', salt }))
      setIsLocked(false)
      setIsInitialized(true)
      setIsCreating(false)
      setMasterPassword('')
      setConfirmPassword('')
      setErrorMsg('')
    } catch (err) {
      setErrorMsg('初始化失败，请重试')
      console.error(err)
    }
  }, [masterPassword, confirmPassword])

  const unlockVault = useCallback(async () => {
    if (!masterPassword) {
      setErrorMsg('请输入主密码')
      return
    }
    try {
      const metaStr = localStorage.getItem(META_KEY)
      const dataStr = localStorage.getItem(STORAGE_KEY)
      if (!metaStr || !dataStr) {
        setIsCreating(true)
        return
      }
      const meta = JSON.parse(metaStr)
      const key = await deriveKey(masterPassword, meta.salt)
      const data: EncryptedData = JSON.parse(dataStr)
      if (data.ciphertext) {
        const decrypted = await decryptData(key, data)
        const parsed = JSON.parse(decrypted)
        setEntries(Array.isArray(parsed) ? parsed : [])
      } else {
        setEntries([])
      }
      setCryptoKey(key)
      setIsLocked(false)
      setMasterPassword('')
      setErrorMsg('')
    } catch {
      setErrorMsg('主密码错误，请重试')
      setMasterPassword('')
    }
  }, [masterPassword])

  const lockVault = useCallback(() => {
    setCryptoKey(null)
    setIsLocked(true)
    setMasterPassword('')
    setConfirmPassword('')
    setSearchQuery('')
    setActiveCategory(null)
    setActiveTags([])
    setShowFavoritesOnly(false)
    setRevealedIds(new Set())
    setCopiedId(null)
  }, [])

  const generatePassword = useCallback(() => {
    const pwd = generateStrongPassword(
      generatorOptions.length,
      {
        upper: generatorOptions.upper,
        lower: generatorOptions.lower,
        numbers: generatorOptions.numbers,
        symbols: generatorOptions.symbols,
        excludeAmbiguous: generatorOptions.excludeAmbiguous
      }
    )
    setGeneratedPwd(pwd)
    return pwd
  }, [generatorOptions])

  useEffect(() => {
    generatePassword()
  }, [generatorOptions, generatePassword])

  const addEntry = useCallback(() => {
    if (!formData.name || !formData.password) return
    const entry: PasswordEntry = {
      id: `p${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      url: formData.url,
      notes: formData.notes,
      icon: formData.icon,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    saveEntries([...entries, entry])
    resetForm()
    setShowAddModal(false)
  }, [formData, entries, saveEntries])

  const updateEntry = useCallback(() => {
    if (!editingEntry) return
    const updated = entries.map(e =>
      e.id === editingEntry.id
        ? {
            ...e,
            name: formData.name,
            username: formData.username,
            password: formData.password,
            url: formData.url,
            notes: formData.notes,
            icon: formData.icon,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: Date.now()
          }
        : e
    )
    saveEntries(updated)
    resetForm()
    setEditingEntry(null)
  }, [editingEntry, formData, entries, saveEntries])

  const deleteEntry = useCallback((id: string) => {
    if (confirm('确定要删除此密码条目吗？此操作无法撤销。')) {
      saveEntries(entries.filter(e => e.id !== id))
    }
  }, [entries, saveEntries])

  const toggleFavorite = useCallback((id: string) => {
    const updated = entries.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e)
    saveEntries(updated)
  }, [entries, saveEntries])

  const toggleReveal = useCallback((id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      const timer = setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {})
        setCopiedId(null)
        setClipboardTimers(prev => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
      }, 30000)
      setClipboardTimers(prev => {
        const next = new Map(prev)
        if (prev.has(id)) clearTimeout(prev.get(id)!)
        next.set(id, timer)
        return next
      })
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [])

  const resetForm = () => {
    setFormData({ name: '', username: '', password: '', url: '', notes: '', icon: '🔐', category: '社交媒体', tags: '' })
    setGeneratedPwd('')
    setShowGenerator(false)
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
    setEditingEntry(null)
  }

  const openEditModal = (entry: PasswordEntry) => {
    setEditingEntry(entry)
    setFormData({
      name: entry.name,
      username: entry.username,
      password: entry.password,
      url: entry.url || '',
      notes: entry.notes || '',
      icon: entry.icon || '🔐',
      category: entry.category,
      tags: entry.tags.join(', ')
    })
    setShowAddModal(true)
  }

  const filteredEntries = entries.filter(e => {
    if (showFavoritesOnly && !e.favorite) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!e.name.toLowerCase().includes(q) &&
          !e.username.toLowerCase().includes(q) &&
          !(e.url || '').toLowerCase().includes(q) &&
          !(e.notes || '').toLowerCase().includes(q) &&
          !e.tags.some(t => t.toLowerCase().includes(q))) return false
    }
    if (activeCategory && e.category !== activeCategory) return false
    if (activeTags.length > 0) {
      const hasAll = activeTags.every(t => e.tags.includes(t))
      if (!hasAll) return false
    }
    return true
  }).sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite ? 1 : -1
    return b.updatedAt - a.updatedAt
  })

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort()

  const stats = {
    total: entries.length,
    favorites: entries.filter(e => e.favorite).length,
    categories: new Set(entries.map(e => e.category)).size,
    weakCount: entries.filter(e => getStrength(e.password).score < 40).length
  }

  const doExport = async () => {
    if (!exportPassword || exportPassword.length < 4) {
      alert('导出密码至少需要4位')
      return
    }
    try {
      const salt = randomSalt()
      const key = await deriveKey(exportPassword, salt)
      const jsonStr = JSON.stringify(entries)
      const encrypted = await encryptData(key, jsonStr)
      const exportObj = {
        version: 1,
        app: 'SecureVault',
        salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext
      }
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `securevault-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setShowExportModal(false)
      setExportPassword('')
    } catch (err) {
      alert('导出失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const doImport = async () => {
    if (!importText || !importPassword) {
      alert('请输入有效的导出数据和密码')
      return
    }
    try {
      const importObj = JSON.parse(importText)
      if (!importObj.salt || !importObj.iv || !importObj.ciphertext) {
        alert('无效的导出文件格式')
        return
      }
      const key = await deriveKey(importPassword, importObj.salt)
      const encrypted: EncryptedData = { ciphertext: importObj.ciphertext, iv: importObj.iv, salt: importObj.salt }
      const decrypted = await decryptData(key, encrypted)
      const imported = JSON.parse(decrypted)
      if (!Array.isArray(imported)) {
        alert('导入数据格式错误')
        return
      }
      if (confirm(`即将导入 ${imported.length} 条密码记录，是否合并到当前库中？\n点击"确定"合并，点击"取消"取消导入。`)) {
        saveEntries([...entries, ...imported])
      }
      setShowImportModal(false)
      setImportText('')
      setImportPassword('')
    } catch {
      alert('导入失败：密码错误或文件已损坏')
    }
  }

  const clearAllData = () => {
    if (confirm('此操作将清除所有密码数据并重置保险库，确定继续吗？')) {
      if (confirm('再次确认：所有数据将永久丢失，无法恢复！')) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(META_KEY)
        location.reload()
      }
    }
  }

  if (isLocked) {
    return (
      <div style={{
        height: '100%',
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(circle at 20% 80%, rgba(102,126,234,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(118,75,162,0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          background: isDark ? 'rgba(20,20,40,0.6)' : 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: 40,
          width: 420,
          boxShadow: isDark
            ? '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 25px 50px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)',
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(102,126,234,0.4))' }}>🔐</div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            margin: '0 0 8px',
            color: isDark ? '#fff' : '#fff',
            letterSpacing: '0.5px'
          }}>
            SecureVault
          </h1>
          <p style={{
            fontSize: 14,
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.85)',
            margin: '0 0 28px'
          }}>
            {isCreating ? '创建新的保险库 — 请设置主密码' : '请输入主密码以解锁您的保险库'}
          </p>

          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => { setMasterPassword(e.target.value); setErrorMsg('') }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isCreating) createVault()
                  else unlockVault()
                }
              }}
              placeholder="输入主密码"
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 12,
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)',
                color: isDark ? '#fff' : '#fff',
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                caretColor: isDark ? '#667eea' : '#fff'
              }}
              autoFocus
            />
          </div>

          {isCreating && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg('') }}
                onKeyDown={(e) => e.key === 'Enter' && createVault()}
                placeholder="确认主密码"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)',
                  color: isDark ? '#fff' : '#fff',
                  fontSize: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                  caretColor: isDark ? '#667eea' : '#fff'
                }}
              />
              {masterPassword && (
                <div style={{ marginTop: 10 }}>
                  {(() => {
                    const s = getStrength(masterPassword)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${s.score}%`, height: '100%', background: s.level.color, transition: 'all 0.3s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: s.level.color, fontWeight: 600 }}>{s.level.label}</span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div style={{
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 16,
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.15)',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.3)'
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          <button
            onClick={isCreating ? createVault : unlockVault}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
              transition: 'all 0.2s',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {isCreating ? '创建保险库' : '解锁保险库'}
          </button>

          {!isCreating && (
            <button
              onClick={() => { setIsCreating(true); setErrorMsg('') }}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              创建新保险库
            </button>
          )}

          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.15)',
            borderRadius: 10,
            fontSize: 12,
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)',
            lineHeight: 1.6,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span>🛡️</span>
              <span style={{ fontWeight: 600 }}>本地加密保护</span>
            </div>
            数据使用 AES-256-GCM 加密存储在本地浏览器，主密码从未离开您的设备。
          </div>
        </div>
      </div>
    )
  }

  const sidebarBg = isDark ? 'rgba(20,20,35,0.7)' : 'rgba(255,255,255,0.6)'
  const mainBg = isDark ? 'rgba(15,15,25,0.5)' : 'rgba(255,255,255,0.3)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b'
  const textSecondary = isDark ? 'rgba(241,245,249,0.6)' : 'rgba(30,41,59,0.6)'
  const textMuted = isDark ? 'rgba(241,245,249,0.4)' : 'rgba(30,41,59,0.4)'
  const accentGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      color: textPrimary,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 13,
      background: isDark
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isDark
          ? 'radial-gradient(circle at 15% 85%, rgba(102,126,234,0.1) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(118,75,162,0.1) 0%, transparent 40%)'
          : 'radial-gradient(circle at 15% 85%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.4) 0%, transparent 40%)',
        pointerEvents: 'none'
      }} />

      <aside style={{
        width: sidebarCollapsed ? 60 : 260,
        background: sidebarBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: `1px solid ${glassBorder}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          padding: '16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${glassBorder}`
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🔐</span>
              <span style={{ fontSize: 15, fontWeight: 700, background: accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SecureVault
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              padding: 4,
              background: 'transparent',
              border: 'none',
              color: textSecondary,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div style={{ padding: 12 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 16
            }}>
              {[
                { label: '总条目', value: stats.total, icon: '📦' },
                { label: '收藏', value: stats.favorites, icon: '⭐' },
                { label: '分类', value: stats.categories, icon: '📂' },
                { label: '弱密码', value: stats.weakCount, icon: '⚠️' }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    borderRadius: 10,
                    padding: '10px 8px',
                    textAlign: 'center',
                    border: `1px solid ${glassBorder}`
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{stat.icon}</div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: idx === 3 && stat.value > 0 ? '#f87171' : textPrimary
                  }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: textMuted }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: showFavoritesOnly ? 'none' : `1px solid ${glassBorder}`,
                background: showFavoritesOnly ? 'linear-gradient(135deg, rgba(102,126,234,0.4) 0%, rgba(118,75,162,0.4) 100%)' : 'transparent',
                color: showFavoritesOnly ? '#fff' : textPrimary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                transition: 'all 0.2s'
              }}
            >
              <span>{showFavoritesOnly ? '⭐' : '☆'}</span>
              <span>仅显示收藏</span>
            </button>

            <div style={{ fontSize: 11, color: textMuted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              分类
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: activeCategory === null ? (isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)') : 'transparent',
                  color: activeCategory === null ? (isDark ? '#a5b4fc' : '#4f46e5') : textPrimary,
                  cursor: 'pointer',
                  fontSize: 13,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s'
                }}
              >
                <span>📋</span>
                <span>全部</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: textMuted }}>{entries.length}</span>
              </button>
              {DEFAULT_CATEGORIES.map(cat => {
                const count = entries.filter(e => e.category === cat.name).length
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: activeCategory === cat.name ? `${cat.color}30` : 'transparent',
                      color: activeCategory === cat.name ? cat.color : textPrimary,
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: textMuted }}>{count}</span>
                  </button>
                )
              })}
            </div>

            {allTags.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  标签
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        )
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        border: activeTags.includes(tag) ? 'none' : `1px solid ${glassBorder}`,
                        background: activeTags.includes(tag) ? '#667eea' : 'transparent',
                        color: activeTags.includes(tag) ? '#fff' : textSecondary,
                        cursor: 'pointer',
                        fontSize: 11,
                        transition: 'all 0.15s'
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: 12, borderTop: `1px solid ${glassBorder}` }}>
          {!sidebarCollapsed && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => setShowExportModal(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${glassBorder}`,
                    background: 'transparent',
                    color: textSecondary,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  <span>📤</span><span>导出</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${glassBorder}`,
                    background: 'transparent',
                    color: textSecondary,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  <span>📥</span><span>导入</span>
                </button>
                <button
                  onClick={lockVault}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  <span>🔒</span><span>锁定</span>
                </button>
                <button
                  onClick={clearAllData}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: textMuted,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontStyle: 'italic',
                    transition: 'all 0.15s'
                  }}
                >
                  清除所有数据
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        <header style={{
          padding: '16px 20px',
          background: mainBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${glassBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索密码、用户名、网址、备注或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 12,
                border: `1px solid ${glassBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: textPrimary,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
            />
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: textMuted,
              fontSize: 14,
              pointerEvents: 'none'
            }}>🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: textMuted,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={openAddModal}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: accentGradient,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>+</span><span>添加</span>
          </button>
        </header>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
          background: mainBg
        }}>
          {filteredEntries.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: textMuted
            }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.6 }}>
                {searchQuery || activeCategory || activeTags.length > 0 || showFavoritesOnly ? '🔍' : '📭'}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: textSecondary }}>
                {searchQuery || activeCategory || activeTags.length > 0
                  ? '没有找到匹配的密码'
                  : '保险库是空的'}
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: 14 }}>
                {searchQuery || activeCategory || activeTags.length > 0
                  ? '尝试调整搜索条件或筛选器'
                  : '点击「添加」按钮创建第一个密码条目'}
              </p>
              {!searchQuery && !activeCategory && activeTags.length === 0 && !showFavoritesOnly && (
                <button
                  onClick={openAddModal}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 12,
                    border: 'none',
                    background: accentGradient,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
                  }}
                >
                  + 添加第一个密码
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 14
            }}>
              {filteredEntries.map(entry => {
                const category = DEFAULT_CATEGORIES.find(c => c.name === entry.category) || DEFAULT_CATEGORIES[9]
                const strength = getStrength(entry.password)
                const isRevealed = revealedIds.has(entry.id)
                const isCopied = copiedId === entry.id

                return (
                  <div
                    key={entry.id}
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderRadius: 16,
                      padding: 16,
                      border: `1px solid ${glassBorder}`,
                      transition: 'all 0.25s ease',
                      animation: 'fadeInUp 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = isDark
                        ? '0 8px 30px rgba(0,0,0,0.3)'
                        : '0 8px 30px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg, ${category.color} 0%, transparent 100%)`,
                      opacity: 0.6
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${category.color}30 0%, ${category.color}15 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        flexShrink: 0
                      }}>
                        {entry.icon || category.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 600,
                            color: textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {entry.favorite && <span style={{ color: '#fbbf24' }}>⭐ </span>}
                            {entry.name}
                          </h3>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: textSecondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {entry.username}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => toggleFavorite(entry.id)}
                          style={{
                            padding: 6,
                            borderRadius: 8,
                            border: 'none',
                            background: entry.favorite ? 'rgba(251,191,36,0.2)' : 'transparent',
                            color: entry.favorite ? '#fbbf24' : textMuted,
                            cursor: 'pointer',
                            fontSize: 14,
                            transition: 'all 0.15s'
                          }}
                          title={entry.favorite ? '取消收藏' : '收藏'}
                        >
                          {entry.favorite ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>

                    <div style={{
                      background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      marginBottom: 10,
                      border: `1px solid ${glassBorder}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: textMuted, flexShrink: 0 }}>密码</span>
                        <code style={{
                          fontSize: 13,
                          fontFamily: 'Monaco, Consolas, monospace',
                          color: textPrimary,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.5px'
                        }}>
                          {isRevealed ? entry.password : '•'.repeat(Math.min(entry.password.length, 20))}
                        </code>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => toggleReveal(entry.id)}
                            style={{
                              padding: '3px 6px',
                              borderRadius: 6,
                              border: `1px solid ${glassBorder}`,
                              background: 'transparent',
                              color: textSecondary,
                              cursor: 'pointer',
                              fontSize: 12,
                              transition: 'all 0.15s'
                            }}
                            title={isRevealed ? '隐藏密码' : '显示密码'}
                          >
                            {isRevealed ? '🙈' : '👁️'}
                          </button>
                          <button
                            onClick={() => copyToClipboard(entry.password, entry.id)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              border: 'none',
                              background: isCopied ? '#10b981' : '#667eea',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 12,
                              transition: 'all 0.15s',
                              fontWeight: 500
                            }}
                            title="复制到剪贴板（30秒后清除）"
                          >
                            {isCopied ? '✓ 已复制' : '📋 复制'}
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            width: `${strength.score}%`,
                            height: '100%',
                            background: strength.level.color,
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: strength.level.color, fontWeight: 600 }}>
                          {strength.level.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: `${category.color}25`,
                        color: category.color,
                        fontSize: 11,
                        fontWeight: 500
                      }}>
                        {category.icon} {entry.category}
                      </span>
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            color: textSecondary,
                            fontSize: 10
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {entry.url && (
                      <div style={{
                        fontSize: 12,
                        color: '#667eea',
                        marginBottom: 6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        🌐 {entry.url}
                      </div>
                    )}
                    {entry.notes && (
                      <div style={{
                        fontSize: 12,
                        color: textSecondary,
                        marginBottom: 10,
                        lineHeight: 1.4,
                        maxHeight: 40,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        📝 {entry.notes}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: 6,
                      paddingTop: 10,
                      borderTop: `1px solid ${glassBorder}`
                    }}>
                      <button
                        onClick={() => openEditModal(entry)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: `1px solid ${glassBorder}`,
                          background: 'transparent',
                          color: textSecondary,
                          cursor: 'pointer',
                          fontSize: 12,
                          transition: 'all 0.15s'
                        }}
                      >
                        ✏️ 编辑
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 12,
                          transition: 'all 0.15s'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); resetForm(); setEditingEntry(null) } }}>
          <div style={{
            background: isDark ? 'rgba(20,20,35,0.85)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: 28,
            width: '100%',
            maxWidth: 560,
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${glassBorder}`,
            boxShadow: isDark
              ? '0 25px 50px rgba(0,0,0,0.5)'
              : '0 25px 50px rgba(0,0,0,0.2)',
            color: textPrimary
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                {editingEntry ? '编辑密码条目' : '添加新密码'}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); setEditingEntry(null) }}
                style={{
                  padding: 6,
                  background: 'transparent',
                  border: 'none',
                  color: textSecondary,
                  cursor: 'pointer',
                  fontSize: 18
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                    站点名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：GitHub"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${glassBorder}`,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                      color: textPrimary,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                    图标
                  </label>
                  <button
                    onClick={() => {
                      const currentIdx = ICON_OPTIONS.indexOf(formData.icon)
                      const next = ICON_OPTIONS[(currentIdx + 1) % ICON_OPTIONS.length]
                      setFormData({ ...formData, icon: next })
                    }}
                    style={{
                      width: 50,
                      height: 40,
                      borderRadius: 10,
                      border: `1px solid ${glassBorder}`,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                      color: textPrimary,
                      fontSize: 20,
                      cursor: 'pointer'
                    }}
                  >
                    {formData.icon}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  用户名 / 邮箱
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  密码 *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="输入或生成密码"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${glassBorder}`,
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                      color: textPrimary,
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'Monaco, Consolas, monospace',
                      letterSpacing: '0.5px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={() => setShowGenerator(!showGenerator)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: accentGradient,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🎲
                  </button>
                </div>
                {formData.password && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${getStrength(formData.password).score}%`,
                        height: '100%',
                        background: getStrength(formData.password).level.color,
                        transition: 'all 0.3s'
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: getStrength(formData.password).level.color, fontWeight: 600 }}>
                      {getStrength(formData.password).level.label}
                    </span>
                  </div>
                )}
              </div>

              {showGenerator && (
                <div style={{
                  padding: 14,
                  borderRadius: 12,
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${glassBorder}`
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>密码生成器</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11, color: textSecondary, marginBottom: 4 }}>
                      长度: {generatorOptions.length}
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="64"
                      value={generatorOptions.length}
                      onChange={(e) => setGeneratorOptions({ ...generatorOptions, length: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#667eea' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {[
                      { key: 'upper', label: '大写字母' },
                      { key: 'lower', label: '小写字母' },
                      { key: 'numbers', label: '数字' },
                      { key: 'symbols', label: '特殊字符' }
                    ].map(opt => (
                      <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={generatorOptions[opt.key as keyof typeof generatorOptions] as boolean}
                          onChange={(e) => setGeneratorOptions({ ...generatorOptions, [opt.key]: e.target.checked })}
                          style={{ accentColor: '#667eea' }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginBottom: 10 }}>
                    <input
                      type="checkbox"
                      checked={generatorOptions.excludeAmbiguous}
                      onChange={(e) => setGeneratorOptions({ ...generatorOptions, excludeAmbiguous: e.target.checked })}
                      style={{ accentColor: '#667eea' }}
                    />
                    排除易混淆字符 (0, O, l, 1, I)
                  </label>
                  <div style={{
                    background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
                    color: textPrimary,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: 13,
                    marginBottom: 8,
                    wordBreak: 'break-all',
                    border: `1px solid ${glassBorder}`
                  }}>
                    {generatedPwd || '点击生成按钮'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setGeneratedPwd(generatePassword())}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: accentGradient,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      🔄 重新生成
                    </button>
                    <button
                      onClick={() => {
                        if (generatedPwd) {
                          setFormData({ ...formData, password: generatedPwd })
                          setShowGenerator(false)
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${glassBorder}`,
                        background: 'transparent',
                        color: textPrimary,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      ✅ 使用此密码
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  网址 (可选)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name} style={{ background: isDark ? '#1a1a2e' : '#fff' }}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="例如: 重要, 工作, 个人"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: textSecondary, marginBottom: 6, fontWeight: 600 }}>
                  备注 (可选)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="添加备注..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    color: textPrimary,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); setEditingEntry(null) }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: `1px solid ${glassBorder}`,
                    background: 'transparent',
                    color: textSecondary,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  取消
                </button>
                <button
                  onClick={editingEntry ? updateEntry : addEntry}
                  disabled={!formData.name || !formData.password}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: formData.name && formData.password ? accentGradient : '#666',
                    color: '#fff',
                    cursor: formData.name && formData.password ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {editingEntry ? '保存更改' : '保存密码'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false) }}>
          <div style={{
            background: isDark ? 'rgba(20,20,35,0.9)' : 'rgba(255,255,255,0.95)',
            borderRadius: 20,
            padding: 28,
            width: '100%',
            maxWidth: 400,
            border: `1px solid ${glassBorder}`,
            color: textPrimary
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>📤 导出保险库</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
              导出的数据将使用您提供的密码进行 AES-256-GCM 加密。请妥善保管导出文件和密码。
            </p>
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              placeholder="设置导出密码 (至少4位)"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${glassBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: textPrimary,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 14
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                  background: 'transparent',
                  color: textSecondary,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                取消
              </button>
              <button
                onClick={doExport}
                disabled={!exportPassword || exportPassword.length < 4}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: exportPassword && exportPassword.length >= 4 ? accentGradient : '#666',
                  color: '#fff',
                  cursor: exportPassword && exportPassword.length >= 4 ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false) }}>
          <div style={{
            background: isDark ? 'rgba(20,20,35,0.9)' : 'rgba(255,255,255,0.95)',
            borderRadius: 20,
            padding: 28,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `1px solid ${glassBorder}`,
            color: textPrimary
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>📥 导入保险库</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
              粘贴加密的导出 JSON 数据，然后输入导出时使用的密码。
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='粘贴导出的 JSON 数据...'
              rows={6}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${glassBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: textPrimary,
                fontSize: 12,
                fontFamily: 'Monaco, Consolas, monospace',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
                resize: 'vertical'
              }}
            />
            <input
              type="password"
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              placeholder="导出密码"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${glassBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: textPrimary,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 14
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                  background: 'transparent',
                  color: textSecondary,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                取消
              </button>
              <button
                onClick={doImport}
                disabled={!importText || !importPassword}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: importText && importPassword ? accentGradient : '#666',
                  color: '#fff',
                  cursor: importText && importPassword ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'};
        }
        input[type="range"]::-webkit-slider-thumb {
          background: #667eea;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          background: #667eea;
          cursor: pointer;
          border: none;
        }
        select option {
          background: ${isDark ? '#1a1a2e' : '#fff'};
          color: ${isDark ? '#fff' : '#1e293b'};
        }
      `}</style>
    </div>
  )
})

export default SecureVault
