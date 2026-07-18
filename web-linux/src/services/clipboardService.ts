/**
 * Cloud Clipboard Service — 基于 GitHub Gist 的真实云剪贴板
 *
 * 工作原理:
 *  1. 用户可以选择"匿名模式"（仅本地 + 通过 URL 分享）或"GitHub Token 模式"（持久云存储）
 *  2. 匿名模式：使用 sessionStorage 暂存，导出为可分享的 URL（编码到 hash）
 *  3. Token 模式：通过 GitHub Gist API 创建/读取/更新 Gist，实现真正跨设备同步
 *
 * 安全说明:
 *  - GitHub Token 仅保存在用户浏览器 localStorage 中，不上传到任何第三方
 *  - 所有 Gist 操作直接通过 GitHub API 进行，无中间服务器
 *  - 用户可随时清空 Token
 */

import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig'

export interface ClipboardItem {
  id: string
  title: string
  content: string
  language?: string
  tags?: string[]
  createdAt: number
  updatedAt: number
  /** Gist ID（如果已同步到 GitHub） */
  gistId?: string
  /** Gist URL */
  gistUrl?: string
  /** 是否为公开 Gist */
  isPublic?: boolean
}

export interface GistFile {
  filename: string
  content: string
  language?: string
}

export interface GistCreatePayload {
  description: string
  files: Record<string, { content: string }>
  public: boolean
}

const STORAGE_KEY = 'weblinux-cloud-clipboard'
const TOKEN_KEY = 'weblinux-github-token'

/** 生成唯一 ID */
function uid(): string {
  return 'cb_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/** 检测语言 */
export function detectLanguage(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return 'text'

  // JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      /* not json */
    }
  }

  // HTML
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed) && trimmed.includes('<')) return 'html'

  // CSS
  if (/\.[a-z-]+\s*\{[\s\S]*?\}/i.test(trimmed)) return 'css'

  // JavaScript / TypeScript
  if (/^\s*(import|export|const|let|var|function|class|interface|type)\s+/m.test(trimmed)) {
    return trimmed.includes(': ') && !trimmed.includes('==') ? 'typescript' : 'javascript'
  }

  // Python
  if (/^\s*(def|class|import|from)\s+/m.test(trimmed)) return 'python'

  // Shell
  if (/^\s*(#!\/|npm |yarn |git |cd |ls |cat |echo )/m.test(trimmed)) return 'bash'

  // Markdown
  if (/^#{1,6}\s|^\*\s|^\-\s|```/m.test(trimmed)) return 'markdown'

  return 'text'
}

/** 加载本地剪贴板 */
export function loadLocalClipboard(): ClipboardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** 保存到本地剪贴板 */
export function saveLocalClipboard(items: ClipboardItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)))
  } catch {
    /* localStorage 可能已满 */
  }
}

/** 添加新条目（仅本地） */
export function addLocalItem(content: string, title?: string, tags?: string[]): ClipboardItem {
  const now = Date.now()
  const item: ClipboardItem = {
    id: uid(),
    title: title || content.slice(0, 40).replace(/\n/g, ' '),
    content,
    language: detectLanguage(content),
    tags: tags || [],
    createdAt: now,
    updatedAt: now,
  }
  const items = loadLocalClipboard()
  items.unshift(item)
  saveLocalClipboard(items)
  return item
}

/** 更新本地条目 */
export function updateLocalItem(id: string, content: string): void {
  const items = loadLocalClipboard()
  const idx = items.findIndex((i) => i.id === id)
  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      content,
      language: detectLanguage(content),
      updatedAt: Date.now(),
    }
    saveLocalClipboard(items)
  }
}

/** 删除本地条目 */
export function deleteLocalItem(id: string): void {
  const items = loadLocalClipboard().filter((i) => i.id !== id)
  saveLocalClipboard(items)
}

// ============ GitHub Token 管理 ============

export function getGithubToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setGithubToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token.trim())
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function clearGithubToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** 验证 Token 是否有效 */
export async function verifyGithubToken(token: string): Promise<{ valid: boolean; user?: string; error?: string }> {
  if (!token) return { valid: false, error: 'Token 为空' }
  try {
    const response = await fetchWithTimeout(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      },
      10_000,
    )
    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    const data = await response.json()
    return { valid: true, user: data?.login }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ============ Gist 同步操作 ============

/** 创建 Gist */
export async function createGist(
  item: ClipboardItem,
  token: string,
  isPublic = false,
): Promise<{ gistId: string; gistUrl: string }> {
  if (!token) throw new Error('未设置 GitHub Token')

  const filename = `${item.title || 'snippet'}.${getFileExtension(item.language)}`.replace(/[^\w.-]/g, '_')
  const payload: GistCreatePayload = {
    description: `WebLinuxOS Cloud Clipboard · ${item.title || 'Untitled'}`,
    files: { [filename]: { content: item.content } },
    public: isPublic,
  }

  const response = await fetchWithTimeout(
    API_CONFIG.githubGist.baseUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    15_000,
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText)
    throw new Error(`创建 Gist 失败: ${response.status} ${errText}`)
  }

  const data = await response.json()
  return {
    gistId: data.id,
    gistUrl: data.html_url,
  }
}

/** 读取 Gist */
export async function getGist(
  gistId: string,
  token?: string,
): Promise<{ title: string; content: string; url: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetchWithTimeout(
    `${API_CONFIG.githubGist.baseUrl}/${gistId}`,
    { headers },
    10_000,
  )

  if (!response.ok) {
    throw new Error(`读取 Gist 失败: HTTP ${response.status}`)
  }

  const data = await response.json()
  const files = data.files || {}
  const firstFile = Object.values(files)[0] as { content: string; filename: string } | undefined
  return {
    title: data.description || firstFile?.filename || 'Untitled',
    content: firstFile?.content || '',
    url: data.html_url,
  }
}

/** 通过 Gist ID 导入到本地 */
export async function importFromGist(gistId: string, token?: string): Promise<ClipboardItem> {
  const gist = await getGist(gistId, token)
  const now = Date.now()
  const item: ClipboardItem = {
    id: uid(),
    title: gist.title.replace(/^WebLinuxOS Cloud Clipboard ·\s*/, ''),
    content: gist.content,
    language: detectLanguage(gist.content),
    gistId,
    gistUrl: gist.url,
    createdAt: now,
    updatedAt: now,
  }
  const items = loadLocalClipboard()
  items.unshift(item)
  saveLocalClipboard(items)
  return item
}

/** 删除 Gist */
export async function deleteGist(gistId: string, token: string): Promise<void> {
  if (!token) throw new Error('未设置 GitHub Token')
  const response = await fetchWithTimeout(
    `${API_CONFIG.githubGist.baseUrl}/${gistId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    },
    10_000,
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`删除 Gist 失败: HTTP ${response.status}`)
  }
}

// ============ 工具函数 ============

function getFileExtension(language?: string): string {
  const map: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    python: 'py',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    ruby: 'rb',
    php: 'php',
    swift: 'swift',
    kotlin: 'kt',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yml',
    xml: 'xml',
    markdown: 'md',
    sql: 'sql',
    bash: 'sh',
    shell: 'sh',
    text: 'txt',
  }
  return map[language || 'text'] || 'txt'
}

/** 生成可分享的 URL（将内容编码到 hash 中，适合小段文本） */
export function generateShareableUrl(content: string, title?: string): string {
  const data = { t: title || '', c: content }
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    return `${window.location.origin}${window.location.pathname}#share=${encoded}`
  } catch {
    return ''
  }
}

/** 从 URL hash 解析分享内容 */
export function parseShareableUrl(): { title: string; content: string } | null {
  try {
    const hash = window.location.hash
    const match = hash.match(/share=([^&]+)/)
    if (!match) return null
    const decoded = decodeURIComponent(escape(atob(match[1])))
    const data = JSON.parse(decoded)
    return {
      title: data.t || '',
      content: data.c || '',
    }
  } catch {
    return null
  }
}

/** 下载为本地文件 */
export function downloadAsFile(item: ClipboardItem): void {
  const ext = getFileExtension(item.language)
  const filename = `${item.title || 'snippet'}.${ext}`.replace(/[^\w.-]/g, '_')
  const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 复制到系统剪贴板 */
export async function copyToSystemClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
