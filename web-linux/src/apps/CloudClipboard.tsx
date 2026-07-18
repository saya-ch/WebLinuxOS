import { useState, useEffect, memo, useMemo } from 'react'
import {
  loadLocalClipboard,
  addLocalItem,
  updateLocalItem,
  deleteLocalItem,
  createGist,
  importFromGist,
  deleteGist,
  getGithubToken,
  setGithubToken,
  clearGithubToken,
  verifyGithubToken,
  copyToSystemClipboard,
  downloadAsFile,
  generateShareableUrl,
  detectLanguage,
  type ClipboardItem,
} from '../services/clipboardService'

type View = 'list' | 'detail' | 'new' | 'settings'

function CloudClipboard() {
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [view, setView] = useState<View>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [githubUser, setGithubUser] = useState<string | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [gistIdInput, setGistIdInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  // 新建/编辑表单
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')

  // 初始化
  useEffect(() => {
    refreshItems()
    const t = getGithubToken()
    setToken(t)
    if (t) {
      verifyToken(t)
    }
  }, [])

  // 自动隐藏 toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function refreshItems() {
    setItems(loadLocalClipboard())
  }

  async function verifyToken(t: string) {
    setVerifying(true)
    setTokenError('')
    const result = await verifyGithubToken(t)
    setVerifying(false)
    if (result.valid) {
      setGithubUser(result.user || null)
    } else {
      setGithubUser(null)
      setTokenError(result.error || 'Token 无效')
    }
  }

  function handleSaveToken() {
    const t = tokenInput.trim()
    if (!t) {
      setTokenError('请输入 Token')
      return
    }
    setGithubToken(t)
    setToken(t)
    setTokenInput('')
    verifyToken(t)
    showToast('Token 已保存', 'success')
  }

  function handleClearToken() {
    clearGithubToken()
    setToken('')
    setGithubUser(null)
    showToast('Token 已清除', 'info')
  }

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ msg, type })
  }

  function startNew() {
    setEditId(null)
    setEditTitle('')
    setEditContent('')
    setEditTags('')
    setView('new')
  }

  function startEdit(item: ClipboardItem) {
    setEditId(item.id)
    setEditTitle(item.title)
    setEditContent(item.content)
    setEditTags((item.tags || []).join(','))
    setView('new')
  }

  function saveItem() {
    if (!editContent.trim()) {
      showToast('内容不能为空', 'error')
      return
    }
    if (editId) {
      updateLocalItem(editId, editContent)
      showToast('已更新', 'success')
    } else {
      const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean)
      addLocalItem(editContent, editTitle.trim() || undefined, tags)
      showToast('已创建', 'success')
    }
    refreshItems()
    setView('list')
  }

  function handleDelete(id: string, gistId?: string) {
    if (!confirm('确定删除这个剪贴板条目？')) return
    if (gistId && token) {
      deleteGist(gistId, token).catch((e) => {
        showToast(`云端删除失败: ${e.message}`, 'error')
      })
    }
    deleteLocalItem(id)
    refreshItems()
    if (activeId === id) {
      setView('list')
      setActiveId(null)
    }
    showToast('已删除', 'info')
  }

  async function handleCopy(content: string) {
    const ok = await copyToSystemClipboard(content)
    showToast(ok ? '已复制到剪贴板' : '复制失败', ok ? 'success' : 'error')
  }

  async function handleSyncToGist(item: ClipboardItem) {
    if (!token) {
      showToast('请先在设置中配置 GitHub Token', 'error')
      setView('settings')
      return
    }
    try {
      showToast('正在同步到 GitHub Gist...', 'info')
      const result = await createGist(item, token, false)
      // 更新本地条目
      const items = loadLocalClipboard()
      const idx = items.findIndex((i) => i.id === item.id)
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          gistId: result.gistId,
          gistUrl: result.gistUrl,
          isPublic: false,
        }
        // 保存
        try {
          localStorage.setItem('weblinux-cloud-clipboard', JSON.stringify(items))
        } catch {
          /* ignore */
        }
        refreshItems()
      }
      showToast('已同步到 Gist', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(`同步失败: ${msg}`, 'error')
    }
  }

  async function handleImportFromGist() {
    const id = gistIdInput.trim()
    if (!id) {
      setImportError('请输入 Gist ID 或 URL')
      return
    }
    // 从 URL 提取 ID
    const match = id.match(/gist\.github\.com\/[\w-]+\/([\w]+)/)
    const gistId = match ? match[1] : id

    setImporting(true)
    setImportError('')
    try {
      const item = await importFromGist(gistId, token || undefined)
      refreshItems()
      setActiveId(item.id)
      setView('detail')
      setGistIdInput('')
      showToast('已从 Gist 导入', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setImportError(msg)
    } finally {
      setImporting(false)
    }
  }

  function handleShare(item: ClipboardItem) {
    const url = generateShareableUrl(item.content, item.title)
    if (!url) {
      showToast('生成分享链接失败', 'error')
      return
    }
    copyToSystemClipboard(url).then((ok) => {
      showToast(ok ? '分享链接已复制' : '复制失败', ok ? 'success' : 'error')
    })
  }

  // 过滤
  const allTags = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i) => (i.tags || []).forEach((t) => s.add(t)))
    return Array.from(s)
  }, [items])

  const filteredItems = useMemo(() => {
    let list = items
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q),
      )
    }
    if (filterTag) {
      list = list.filter((i) => (i.tags || []).includes(filterTag))
    }
    return list
  }, [items, search, filterTag])

  const activeItem = items.find((i) => i.id === activeId)

  // ============ 视图渲染 ============

  if (view === 'settings') {
    return (
      <div style={S.container}>
        <SettingsView
          token={token}
          githubUser={githubUser}
          tokenInput={tokenInput}
          setTokenInput={setTokenInput}
          verifying={verifying}
          tokenError={tokenError}
          onSave={handleSaveToken}
          onClear={handleClearToken}
          onBack={() => setView('list')}
          gistIdInput={gistIdInput}
          setGistIdInput={setGistIdInput}
          onImport={handleImportFromGist}
          importing={importing}
          importError={importError}
        />
        {toast && <ToastView toast={toast} />}
      </div>
    )
  }

  if (view === 'new') {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setView('list')}>← 返回</button>
          <h2 style={S.headerTitle}>{editId ? '编辑条目' : '新建条目'}</h2>
          <button style={S.primaryBtn} onClick={saveItem}>保存</button>
        </div>
        <div style={S.editForm}>
          <input
            style={S.input}
            placeholder="标题（可选）"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <input
            style={S.input}
            placeholder="标签（用逗号分隔，如：js,snippet,算法）"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
          />
          <textarea
            style={S.textarea}
            placeholder="在此粘贴或输入内容..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div style={S.editHint}>
            检测语言: {detectLanguage(editContent)} · 字数: {editContent.length}
          </div>
        </div>
        {toast && <ToastView toast={toast} />}
      </div>
    )
  }

  if (view === 'detail' && activeItem) {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setView('list')}>← 返回</button>
          <h2 style={S.headerTitle}>{activeItem.title}</h2>
          <div style={S.headerActions}>
            <button style={S.iconBtn} onClick={() => handleCopy(activeItem.content)} title="复制">📋</button>
            <button style={S.iconBtn} onClick={() => startEdit(activeItem)} title="编辑">✏️</button>
            <button style={S.iconBtn} onClick={() => downloadAsFile(activeItem)} title="下载">⬇️</button>
            <button style={S.iconBtn} onClick={() => handleShare(activeItem)} title="生成分享链接">🔗</button>
            <button
              style={S.iconBtn}
              onClick={() => handleSyncToGist(activeItem)}
              title="同步到 GitHub Gist"
              disabled={!token}
            >
              ☁️
            </button>
            <button style={S.iconBtnDanger} onClick={() => handleDelete(activeItem.id, activeItem.gistId)} title="删除">🗑</button>
          </div>
        </div>
        <div style={S.detailMeta}>
          <span>📅 {new Date(activeItem.createdAt).toLocaleString('zh-CN')}</span>
          <span>🔤 {activeItem.language}</span>
          <span>📝 {activeItem.content.length} 字符</span>
          {activeItem.gistUrl && (
            <a href={activeItem.gistUrl} target="_blank" rel="noreferrer" style={S.gistLink}>
              ☁️ 已同步 Gist ↗
            </a>
          )}
          {activeItem.tags && activeItem.tags.length > 0 && (
            <span>🏷 {activeItem.tags.join(', ')}</span>
          )}
        </div>
        <pre style={S.detailContent}>{activeItem.content}</pre>
        {toast && <ToastView toast={toast} />}
      </div>
    )
  }

  // 列表视图
  return (
    <div style={S.container}>
      <div style={S.header}>
        <h2 style={S.headerTitle}>☁️ 云剪贴板</h2>
        <div style={S.headerActions}>
          <button style={S.iconBtn} onClick={() => setView('settings')} title="设置">
            ⚙️ {githubUser ? `(${githubUser})` : ''}
          </button>
          <button style={S.primaryBtn} onClick={startNew}>+ 新建</button>
        </div>
      </div>
      <div style={S.searchBar}>
        <input
          style={S.searchInput}
          placeholder="搜索标题或内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {allTags.length > 0 && (
        <div style={S.tagBar}>
          <button
            style={{ ...S.tagChip, ...(filterTag === null ? S.tagChipActive : {}) }}
            onClick={() => setFilterTag(null)}
          >
            全部
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              style={{ ...S.tagChip, ...(filterTag === t ? S.tagChipActive : {}) }}
              onClick={() => setFilterTag(t === filterTag ? null : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      <div style={S.list}>
        {filteredItems.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>📋</div>
            <div style={S.emptyText}>
              {items.length === 0 ? '暂无剪贴板条目' : '没有匹配的条目'}
            </div>
            <button style={S.primaryBtn} onClick={startNew}>创建第一个条目</button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              style={S.listItem}
              onClick={() => {
                setActiveId(item.id)
                setView('detail')
              }}
            >
              <div style={S.listItemHeader}>
                <div style={S.listItemTitle}>
                  {item.gistId && <span style={S.cloudBadge}>☁️</span>}
                  {item.title}
                </div>
                <div style={S.listItemMeta}>
                  {new Date(item.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={S.listItemPreview}>{item.content.slice(0, 200)}</div>
              <div style={S.listItemFooter}>
                <span style={S.langBadge}>{item.language}</span>
                {item.tags?.map((t) => (
                  <span key={t} style={S.tagBadge}>#{t}</span>
                ))}
                <span style={S.charCount}>{item.content.length} 字符</span>
              </div>
            </div>
          ))
        )}
      </div>
      {toast && <ToastView toast={toast} />}
    </div>
  )
}

// ============ Settings View ============
interface SettingsViewProps {
  token: string
  githubUser: string | null
  tokenInput: string
  setTokenInput: (v: string) => void
  verifying: boolean
  tokenError: string
  onSave: () => void
  onClear: () => void
  onBack: () => void
  gistIdInput: string
  setGistIdInput: (v: string) => void
  onImport: () => void
  importing: boolean
  importError: string
}

function SettingsView(props: SettingsViewProps) {
  return (
    <div style={S.container}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={props.onBack}>← 返回</button>
        <h2 style={S.headerTitle}>设置</h2>
        <div />
      </div>
      <div style={S.settingsContent}>
        <section style={S.section}>
          <h3 style={S.sectionTitle}>🔑 GitHub Token 配置</h3>
          <p style={S.sectionDesc}>
            配置 GitHub Token 后，可以将剪贴板条目同步到 GitHub Gist，实现跨设备访问。
            <br />
            Token 仅保存在你的浏览器本地，不会上传到任何第三方服务器。
          </p>
          <p style={S.sectionDesc}>
            创建 Token: <a href="https://github.com/settings/tokens/new?scopes=gist&description=WebLinuxOS%20Cloud%20Clipboard" target="_blank" rel="noreferrer" style={S.link}>点此前往 GitHub ↗</a>
            ，勾选 <code style={S.code}>gist</code> 权限即可。
          </p>
          {props.githubUser ? (
            <div style={S.tokenStatusOk}>
              ✓ 已认证为 <strong>@{props.githubUser}</strong>
            </div>
          ) : props.token ? (
            <div style={S.tokenStatusErr}>
              ⚠ Token 已配置但验证失败：{props.tokenError}
            </div>
          ) : (
            <div style={S.tokenStatusWarn}>未配置 Token（仅本地模式）</div>
          )}
          <div style={S.inputRow}>
            <input
              type="password"
              style={S.input}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={props.tokenInput}
              onChange={(e) => props.setTokenInput(e.target.value)}
            />
            <button style={S.primaryBtn} onClick={props.onSave} disabled={props.verifying}>
              {props.verifying ? '验证中...' : '保存'}
            </button>
            {props.token && (
              <button style={S.dangerBtn} onClick={props.onClear}>清除</button>
            )}
          </div>
        </section>

        <section style={S.section}>
          <h3 style={S.sectionTitle}>📥 从 Gist 导入</h3>
          <p style={S.sectionDesc}>
            输入 Gist ID 或完整 URL，将 Gist 内容导入到本地剪贴板。
            公开 Gist 无需 Token 即可导入。
          </p>
          <div style={S.inputRow}>
            <input
              style={S.input}
              placeholder="Gist ID 或 URL，如 https://gist.github.com/user/abc123"
              value={props.gistIdInput}
              onChange={(e) => props.setGistIdInput(e.target.value)}
            />
            <button style={S.primaryBtn} onClick={props.onImport} disabled={props.importing}>
              {props.importing ? '导入中...' : '导入'}
            </button>
          </div>
          {props.importError && (
            <div style={S.tokenStatusErr}>⚠ {props.importError}</div>
          )}
        </section>

        <section style={S.section}>
          <h3 style={S.sectionTitle}>📚 使用说明</h3>
          <ul style={S.helpList}>
            <li>本地模式：所有条目保存在浏览器 localStorage，无需任何配置</li>
            <li>同步模式：配置 GitHub Token 后，可将条目同步到 Gist 实现跨设备访问</li>
            <li>分享链接：生成包含内容的 URL（base64 编码），适合小段文本分享</li>
            <li>支持代码语法检测：自动识别 JSON / JS / TS / Python / HTML / CSS / Markdown</li>
            <li>所有数据保存在本地，不会上传到任何服务器（除非主动同步到 Gist）</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function ToastView({ toast }: { toast: { msg: string; type: 'success' | 'error' | 'info' } }) {
  return (
    <div style={{
      ...S.toast,
      ...(toast.type === 'success' ? S.toastSuccess : {}),
      ...(toast.type === 'error' ? S.toastError : {}),
    }}>
      {toast.msg}
    </div>
  )
}

// ============ Styles ============

const S: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1f 100%)',
    color: '#f0f0ff',
    fontFamily: "'Geist', 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(124, 108, 240, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(8, 8, 15, 0.6)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: 600,
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9090c0',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '4px 8px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(124, 108, 240, 0.3)',
  },
  dangerBtn: {
    background: 'rgba(232, 17, 35, 0.2)',
    border: '1px solid rgba(232, 17, 35, 0.4)',
    color: '#ff8090',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  iconBtn: {
    background: 'rgba(124, 108, 240, 0.08)',
    border: '1px solid rgba(124, 108, 240, 0.18)',
    color: '#c4b5fd',
    padding: '6px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  iconBtnDanger: {
    background: 'rgba(232, 17, 35, 0.1)',
    border: '1px solid rgba(232, 17, 35, 0.3)',
    color: '#ff8090',
    padding: '6px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  searchBar: {
    padding: '10px 16px',
    borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(20, 20, 35, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.2)',
    color: '#f0f0ff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tagBar: {
    padding: '6px 16px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
  },
  tagChip: {
    background: 'rgba(124, 108, 240, 0.08)',
    border: '1px solid rgba(124, 108, 240, 0.18)',
    color: '#c4b5fd',
    padding: '3px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  tagChipActive: {
    background: 'rgba(124, 108, 240, 0.25)',
    borderColor: 'rgba(124, 108, 240, 0.5)',
    color: '#fff',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 16px',
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#606080',
  },
  emptyIcon: { fontSize: '48px' },
  emptyText: { fontSize: '14px' },
  listItem: {
    padding: '12px 14px',
    background: 'rgba(20, 20, 35, 0.5)',
    border: '1px solid rgba(124, 108, 240, 0.12)',
    borderRadius: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  listItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  listItemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cloudBadge: {
    fontSize: '11px',
  },
  listItemMeta: {
    fontSize: '11px',
    color: '#606080',
  },
  listItemPreview: {
    fontSize: '12px',
    color: '#a0a0c0',
    lineHeight: 1.5,
    marginBottom: '8px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  listItemFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    color: '#606080',
  },
  langBadge: {
    background: 'rgba(0, 214, 193, 0.15)',
    color: '#00d6c1',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  tagBadge: {
    color: '#c4b5fd',
  },
  charCount: {
    marginLeft: 'auto',
  },
  editForm: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    background: 'rgba(20, 20, 35, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.2)',
    color: '#f0f0ff',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    minWidth: 0,
  },
  textarea: {
    flex: 1,
    background: 'rgba(8, 8, 15, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.2)',
    color: '#e0e0ff',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: 'none',
    resize: 'none',
    lineHeight: 1.6,
  },
  editHint: {
    fontSize: '11px',
    color: '#606080',
  },
  detailMeta: {
    padding: '10px 16px',
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    fontSize: '11px',
    color: '#9090c0',
    borderBottom: '1px solid rgba(124, 108, 240, 0.1)',
  },
  gistLink: {
    color: '#00d6c1',
    textDecoration: 'none',
  },
  detailContent: {
    flex: 1,
    padding: '16px',
    margin: 0,
    background: 'rgba(8, 8, 15, 0.6)',
    color: '#e0e0ff',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '13px',
    lineHeight: 1.6,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  settingsContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  section: {
    marginBottom: '24px',
    padding: '16px',
    background: 'rgba(20, 20, 35, 0.4)',
    border: '1px solid rgba(124, 108, 240, 0.12)',
    borderRadius: '10px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 10px 0',
    color: '#c4b5fd',
  },
  sectionDesc: {
    fontSize: '12px',
    color: '#9090c0',
    lineHeight: 1.6,
    marginBottom: '10px',
  },
  link: {
    color: '#00d6c1',
    textDecoration: 'none',
  },
  code: {
    background: 'rgba(124, 108, 240, 0.15)',
    color: '#c4b5fd',
    padding: '1px 6px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  tokenStatusOk: {
    padding: '8px 12px',
    background: 'rgba(0, 232, 150, 0.1)',
    border: '1px solid rgba(0, 232, 150, 0.3)',
    color: '#00e896',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '10px',
  },
  tokenStatusErr: {
    padding: '8px 12px',
    background: 'rgba(255, 77, 95, 0.1)',
    border: '1px solid rgba(255, 77, 95, 0.3)',
    color: '#ff8090',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '10px',
  },
  tokenStatusWarn: {
    padding: '8px 12px',
    background: 'rgba(255, 196, 0, 0.1)',
    border: '1px solid rgba(255, 196, 0, 0.3)',
    color: '#ffc400',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '10px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  helpList: {
    fontSize: '12px',
    color: '#9090c0',
    lineHeight: 1.8,
    paddingLeft: '20px',
    margin: 0,
  },
  toast: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 18px',
    background: 'rgba(20, 20, 35, 0.95)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    color: '#f0f0ff',
    borderRadius: '8px',
    fontSize: '13px',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  toastSuccess: {
    borderColor: 'rgba(0, 232, 150, 0.4)',
    color: '#00e896',
  },
  toastError: {
    borderColor: 'rgba(255, 77, 95, 0.4)',
    color: '#ff8090',
  },
}

export default memo(CloudClipboard)
