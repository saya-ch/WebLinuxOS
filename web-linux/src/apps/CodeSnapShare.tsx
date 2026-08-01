import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'
import {
  Code2, Copy, Share2, Link2, History, Star, Trash2,
  Check, Sun, Moon, Download, Eye, EyeOff,
  FileCode, Zap, Clock, Tag as TagIcon, X, Plus, Sparkles,
  Search, BookOpen, Bookmark,
} from 'lucide-react'

// ============ 类型定义 ============
type LanguageKey =
  | 'javascript' | 'typescript' | 'python' | 'html'
  | 'css' | 'json' | 'sql' | 'bash' | 'go' | 'rust'

interface LanguageDef {
  key: LanguageKey
  label: string
  icon: string
  color: string
  ext: string
  keywords: string[]
  singleLineComment: string
  multiLineCommentStart?: string
  multiLineCommentEnd?: string
}

interface StoredSnapshot {
  id: string
  title: string
  language: LanguageKey
  code: string
  tags: string[]
  emojis: string[]
  createdAt: number
  favorite: boolean
}

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain'
  value: string
}

type TabKey = 'editor' | 'favorites' | 'history'

// ============ 语言定义 ============
const LANGUAGES: LanguageDef[] = [
  {
    key: 'javascript', label: 'JavaScript', icon: 'JS', color: '#f7df1e', ext: 'js',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'yield', 'static', 'super', 'delete', 'void'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'typescript', label: 'TypeScript', icon: 'TS', color: '#3178c6', ext: 'ts',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'implements', 'public', 'private', 'protected', 'readonly', 'abstract', 'as', 'is', 'keyof', 'never', 'unknown', 'any', 'void', 'static', 'super', 'declare', 'module', 'namespace', 'require'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'python', label: 'Python', icon: 'Py', color: '#3776ab', ext: 'py',
    keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'and', 'or', 'not', 'is', 'in', 'True', 'False', 'None', 'global', 'nonlocal', 'assert', 'del', 'async', 'await', 'print', 'self'],
    singleLineComment: '#',
  },
  {
    key: 'html', label: 'HTML', icon: '<>', color: '#e34f26', ext: 'html',
    keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option', 'textarea', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside'],
    singleLineComment: '', multiLineCommentStart: '<!--', multiLineCommentEnd: '-->',
  },
  {
    key: 'css', label: 'CSS', icon: '#', color: '#1572b6', ext: 'css',
    keywords: ['color', 'background', 'margin', 'padding', 'border', 'display', 'position', 'width', 'height', 'font', 'text', 'flex', 'grid', 'align', 'justify', 'overflow', 'opacity', 'transform', 'transition', 'animation', 'box', 'outline', 'cursor', 'z-index', 'top', 'left', 'right', 'bottom', 'float', 'clear', 'content', 'visibility', 'min', 'max', 'gap', 'order', 'place', 'none', 'auto', 'inherit', 'initial', 'unset', 'important'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'json', label: 'JSON', icon: '{}', color: '#292929', ext: 'json',
    keywords: ['true', 'false', 'null'],
    singleLineComment: '',
  },
  {
    key: 'sql', label: 'SQL', icon: 'SQ', color: '#e38c00', ext: 'sql',
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT', 'CHECK', 'UNIQUE', 'CONSTRAINT', 'AUTO_INCREMENT', 'INT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'FLOAT', 'DECIMAL', 'DATE', 'DATETIME', 'TIMESTAMP'],
    singleLineComment: '--', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'bash', label: 'Bash', icon: '#!', color: '#4eaa25', ext: 'sh',
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'in', 'select', 'until', 'echo', 'exit', 'read', 'set', 'unset', 'export', 'source', 'alias', 'local', 'declare', 'typeset', 'readonly', 'true', 'false', 'cd', 'ls', 'grep', 'awk', 'sed', 'find', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'npm', 'git', 'docker'],
    singleLineComment: '#',
  },
  {
    key: 'go', label: 'Go', icon: 'Go', color: '#00add8', ext: 'go',
    keywords: ['func', 'return', 'if', 'else', 'for', 'switch', 'case', 'break', 'continue', 'default', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'select', 'range', 'package', 'import', 'defer', 'fallthrough', 'goto', 'nil', 'true', 'false', 'make', 'new', 'append', 'len', 'cap', 'copy', 'delete', 'close', 'panic', 'recover', 'print', 'println'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'rust', label: 'Rust', icon: 'Rs', color: '#dea584', ext: 'rs',
    keywords: ['fn', 'let', 'mut', 'const', 'if', 'else', 'for', 'while', 'loop', 'match', 'return', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'crate', 'self', 'super', 'where', 'as', 'in', 'ref', 'move', 'type', 'static', 'async', 'await', 'dyn', 'box', 'unsafe', 'extern', 'true', 'false', 'break', 'continue', 'yield', 'Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Option', 'Result', 'println', 'format', 'macro_rules'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
]

const EMOJI_POOL = ['🔥', '💡', '⚡', '🚀', '💎', '🎯', '🛠️', '📦', '🧠', '✨', '🎨', '⚙️', '🔒', '📝', '🌟', '🧩', '🔮', '⚡', '💫', '🎪']

const STORAGE_KEY_FAVORITES = 'weblinux-codesnap-favorites-v1'
const STORAGE_KEY_HISTORY = 'weblinux-codesnap-history-v1'

// ============ 语法高亮 ============
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tokenize(code: string, lang: LanguageDef): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = code.length

  while (i < len) {
    if (lang.multiLineCommentStart && lang.multiLineCommentEnd) {
      if (code.startsWith(lang.multiLineCommentStart, i)) {
        const endIdx = code.indexOf(lang.multiLineCommentEnd, i + lang.multiLineCommentStart.length)
        const end = endIdx === -1 ? len : endIdx + lang.multiLineCommentEnd.length
        tokens.push({ type: 'comment', value: code.slice(i, end) })
        i = end
        continue
      }
    }

    if (lang.singleLineComment && code.startsWith(lang.singleLineComment, i)) {
      const endIdx = code.indexOf('\n', i)
      const end = endIdx === -1 ? len : endIdx
      tokens.push({ type: 'comment', value: code.slice(i, end) })
      i = end
      continue
    }

    if (code[i] === '"') {
      let j = i + 1
      while (j < len && code[j] !== '"') { if (code[j] === '\\') j++; j++ }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    if (code[i] === "'") {
      let j = i + 1
      while (j < len && code[j] !== "'") { if (code[j] === '\\') j++; j++ }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    if (code[i] === '`') {
      let j = i + 1
      while (j < len && code[j] !== '`') { if (code[j] === '\\') j++; j++ }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    if (lang.key === 'html' && code[i] === '<' && (code[i + 1] === '/' || /[a-zA-Z]/.test(code[i + 1] || ''))) {
      let j = i + 1
      if (code[j] === '/') j++
      let tagName = ''
      while (j < len && /[a-zA-Z0-9-]/.test(code[j])) { tagName += code[j]; j++ }
      if (tagName && lang.keywords.includes(tagName.toLowerCase())) {
        tokens.push({ type: 'keyword', value: code.slice(i, j) })
        i = j
        continue
      }
    }

    if (/[0-9]/.test(code[i]) && (i === 0 || !/[a-zA-Z_]/.test(code[i - 1]))) {
      let j = i
      if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
        j += 2
        while (j < len && /[0-9a-fA-F]/.test(code[j])) j++
      } else {
        while (j < len && /[0-9]/.test(code[j])) j++
        if (j < len && code[j] === '.') { j++; while (j < len && /[0-9]/.test(code[j])) j++ }
      }
      tokens.push({ type: 'number', value: code.slice(i, j) })
      i = j
      continue
    }

    if (/[a-zA-Z_$@]/.test(code[i]) || (lang.key === 'css' && code[i] === '-')) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$\-]/.test(code[j])) j++
      const word = code.slice(i, j)
      if (lang.keywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    tokens.push({ type: 'plain', value: code[i] })
    i++
  }

  return tokens
}

function highlightCode(code: string, lang: LanguageDef, isDark: boolean): string {
  const tokens = tokenize(code, lang)
  const darkColors: Record<Token['type'], string> = {
    keyword: '#c792ea',
    string: '#c3e88d',
    comment: '#546e7a',
    number: '#f78c6c',
    plain: '#eeffff',
  }
  const lightColors: Record<Token['type'], string> = {
    keyword: '#af00db',
    string: '#26a269',
    comment: '#6a737d',
    number: '#005cc5',
    plain: '#24292e',
  }
  const colorMap = isDark ? darkColors : lightColors
  return tokens
    .map(t => `<span style="color:${colorMap[t.type]}">${escapeHtml(t.value)}</span>`)
    .join('')
}

// ============ 存储/编码工具 ============
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function encodeSnapshot(data: { title: string; language: LanguageKey; code: string; tags: string[]; emojis: string[] }): string {
  const json = JSON.stringify(data)
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return base64
}

function decodeSnapshot(encoded: string): StoredSnapshot | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const data = JSON.parse(json)
    return {
      id: 'imported-' + Date.now(),
      title: data.title || '未命名片段',
      language: data.language || 'javascript',
      code: data.code || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      emojis: Array.isArray(data.emojis) ? data.emojis : [],
      createdAt: Date.now(),
      favorite: false,
    }
  } catch {
    return null
  }
}

// ============ 示例代码 ============
const SAMPLE_CODE: Record<LanguageKey, string> = {
  javascript: `// Hello World
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const result = greet('World');
console.log(result);`,
  typescript: `interface User {
  id: number;
  name: string;
  email?: string;
}

function getUser(id: number): User {
  return { id, name: 'Alice' };
}

const user = getUser(1);
console.log(user.name);`,
  python: `# Hello World
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

for i in range(10):
    print(fibonacci(i))`,
  html: `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>示例</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>这是一个示例页面</p>
</body>
</html>`,
  css: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.card {
  padding: 2rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}`,
  json: `{
  "name": "CodeSnapShare",
  "version": "1.0.0",
  "features": ["syntax-highlight", "share-link", "favorites"],
  "config": {
    "theme": "dark",
    "language": "auto"
  }
}`,
  sql: `-- 查询示例
SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10;`,
  bash: `#!/bin/bash
# 备份脚本
set -e

BACKUP_DIR="/var/backups"
DATE=$(date +%Y%m%d)

echo "开始备份..."
tar -czf "\${BACKUP_DIR}/backup-\${DATE}.tar.gz" /home/data
echo "备份完成: backup-\${DATE}.tar.gz"`,
  go: `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Println(fibonacci(i))
    }
}`,
  rust: `fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    for i in 0..10 {
        println!("fibonacci({}) = {}", i, fibonacci(i));
    }
}`,
}

// ============ 组件 ============
export default function CodeSnapShare() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const addNotification = useStore((s) => s.addNotification)

  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<TabKey>('editor')
  const [language, setLanguage] = useState<LanguageKey>('javascript')
  const [code, setCode] = useState(SAMPLE_CODE.javascript)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [emojis, setEmojis] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLPreElement>(null)

  const [favorites, setFavorites] = useState<StoredSnapshot[]>(() =>
    loadFromStorage<StoredSnapshot[]>(STORAGE_KEY_FAVORITES, [])
  )
  const [history, setHistory] = useState<StoredSnapshot[]>(() =>
    loadFromStorage<StoredSnapshot[]>(STORAGE_KEY_HISTORY, [])
  )

  const currentLang = useMemo(() => LANGUAGES.find(l => l.key === language)!, [language])

  const highlightedPreview = useMemo(() => {
    if (!code) return ''
    return highlightCode(code, currentLang, isDark)
  }, [code, currentLang, isDark])

  const stats = useMemo(() => ({
    lines: code ? code.split('\n').length : 0,
    chars: code.length,
    words: code.trim() ? code.trim().split(/\s+/).length : 0,
  }), [code])

  // 检测 hash 路由中的分享链接
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#/share/')) {
      const encoded = hash.slice(8)
      const snapshot = decodeSnapshot(encoded)
      if (snapshot) {
        setLanguage(snapshot.language)
        setCode(snapshot.code)
        setTitle(snapshot.title)
        setTags(snapshot.tags)
        setEmojis(snapshot.emojis)
        addNotification({
          title: '导入成功',
          message: `已从分享链接导入代码片段: ${snapshot.title}`,
          type: 'success',
        })
      }
    }
  }, [])

  const persistFavorites = useCallback((next: StoredSnapshot[]) => {
    setFavorites(next)
    saveToStorage(STORAGE_KEY_FAVORITES, next)
  }, [])

  const persistHistory = useCallback((next: StoredSnapshot[]) => {
    setHistory(next)
    saveToStorage(STORAGE_KEY_HISTORY, next)
  }, [])

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
  }, [])

  const generateShareLink = useCallback(() => {
    if (!code) return
    const encoded = encodeSnapshot({
      title: title || '未命名片段',
      language,
      code,
      tags,
      emojis,
    })
    const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`
    setShareUrl(url)
    setShowShareModal(true)

    const snapshot: StoredSnapshot = {
      id: 'snap-' + Date.now(),
      title: title || '未命名片段',
      language,
      code,
      tags,
      emojis,
      createdAt: Date.now(),
      favorite: false,
    }
    const next = [snapshot, ...history.filter(h => h.code !== code)].slice(0, 50)
    persistHistory(next)
  }, [code, title, language, tags, emojis, history, persistHistory])

  const toggleFavorite = useCallback(() => {
    const existing = favorites.find(f => f.code === code && f.language === language)
    if (existing) {
      persistFavorites(favorites.filter(f => f.id !== existing.id))
      addNotification({ title: '已取消收藏', message: title || '未命名片段', type: 'info' })
    } else {
      const snapshot: StoredSnapshot = {
        id: 'fav-' + Date.now(),
        title: title || '未命名片段',
        language,
        code,
        tags,
        emojis,
        createdAt: Date.now(),
        favorite: true,
      }
      persistFavorites([snapshot, ...favorites])
      addNotification({ title: '已收藏', message: title || '未命名片段', type: 'success' })
    }
  }, [favorites, code, language, title, tags, emojis, persistFavorites, addNotification])

  const isFavorited = useMemo(
    () => favorites.some(f => f.code === code && f.language === language),
    [favorites, code, language]
  )

  const addTag = useCallback(() => {
    const t = tagInput.trim()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t])
    }
    setTagInput('')
  }, [tagInput, tags])

  const removeTag = useCallback((t: string) => {
    setTags(tags.filter(x => x !== t))
  }, [tags])

  const addEmoji = useCallback((emoji: string) => {
    if (!emojis.includes(emoji) && emojis.length < 6) {
      setEmojis([...emojis, emoji])
    }
    setShowEmojiPicker(false)
  }, [emojis])

  const removeEmoji = useCallback((e: string) => {
    setEmojis(emojis.filter(x => x !== e))
  }, [emojis])

  const loadSnapshot = useCallback((s: StoredSnapshot) => {
    setLanguage(s.language)
    setCode(s.code)
    setTitle(s.title)
    setTags(s.tags)
    setEmojis(s.emojis)
    setActiveTab('editor')
  }, [])

  const deleteFavorite = useCallback((id: string) => {
    persistFavorites(favorites.filter(f => f.id !== id))
  }, [favorites, persistFavorites])

  const deleteHistoryItem = useCallback((id: string) => {
    persistHistory(history.filter(h => h.id !== id))
  }, [history, persistHistory])

  const filteredFavorites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return favorites
    return favorites.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [favorites, searchQuery])

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return history
    return history.filter(h =>
      h.title.toLowerCase().includes(q) ||
      h.code.toLowerCase().includes(q) ||
      h.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [history, searchQuery])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleDownload = () => {
    if (!code) return
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'code'}.${currentLang.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSyncScroll = () => {
    if (textareaRef.current && previewRef.current) {
      previewRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const clearAll = () => {
    setCode(SAMPLE_CODE[language])
    setTitle('')
    setTags([])
    setEmojis([])
  }

  // ============ 样式 ============
  const colors = useMemo(() => {
    if (isDark) {
      return {
        bg: '#0d0d1a',
        bgSecondary: '#141428',
        bgPanel: '#1a1d2e',
        border: 'rgba(124, 108, 240, 0.2)',
        borderStrong: 'rgba(124, 108, 240, 0.35)',
        textPrimary: '#f0f0ff',
        textSecondary: '#9090c0',
        textMuted: '#6a6a8a',
        accent: '#9b8af0',
        accentHover: '#b8a8ff',
        accentBg: 'rgba(155, 138, 240, 0.15)',
        codeBg: '#0a0a18',
        codeText: '#eeffff',
        inputBg: 'rgba(10, 10, 24, 0.6)',
        success: '#4ade80',
        danger: '#f87171',
        warning: '#fbbf24',
        highlight: 'rgba(155, 138, 240, 0.08)',
      }
    }
    return {
      bg: '#f7f8fa',
      bgSecondary: '#ffffff',
      bgPanel: '#ffffff',
      border: 'rgba(0, 0, 0, 0.08)',
      borderStrong: 'rgba(0, 0, 0, 0.15)',
      textPrimary: '#1f2328',
      textSecondary: '#5f6b7a',
      textMuted: '#8a94a4',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentBg: 'rgba(99, 102, 241, 0.1)',
      codeBg: '#1e222c',
      codeText: '#e6e8ef',
      inputBg: '#f0f2f5',
      success: '#22c55e',
      danger: '#ef4444',
      warning: '#f59e0b',
      highlight: 'rgba(99, 102, 241, 0.06)',
    }
  }, [isDark])

  const s = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: 13,
      overflow: 'hidden',
    },
    header: {
      padding: '14px 20px',
      background: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 17,
      fontWeight: 700,
      background: `linear-gradient(135deg, ${colors.accent}, #ec4899)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    headerRight: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: (active?: boolean): React.CSSProperties => ({
      padding: '7px',
      border: `1px solid ${active ? colors.accent : colors.border}`,
      borderRadius: 8,
      background: active ? colors.accentBg : 'transparent',
      color: active ? colors.accent : colors.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    }),
    tabBtn: (active: boolean): React.CSSProperties => ({
      padding: '7px 16px',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      background: active ? colors.accent : 'transparent',
      color: active ? '#fff' : colors.textSecondary,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }),
    toolbar: {
      padding: '10px 20px',
      background: colors.bgPanel,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap' as const,
      flexShrink: 0,
    },
    select: {
      padding: '6px 10px',
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    btn: (variant: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties => ({
      padding: '6px 14px',
      border: variant === 'primary' ? 'none' : variant === 'danger' ? `1px solid ${colors.danger}` : `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 500,
      background: variant === 'primary' ? colors.accent : variant === 'danger' ? 'transparent' : 'transparent',
      color: variant === 'danger' ? colors.danger : variant === 'primary' ? '#fff' : colors.textPrimary,
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'inherit',
    }),
    mainArea: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      minHeight: 0,
    },
    editorPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
      borderRight: showPreview ? `1px solid ${colors.border}` : 'none',
    },
    previewPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
    },
    panelHeader: {
      padding: '8px 14px',
      background: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
      fontSize: 11,
      fontWeight: 600,
      color: colors.textSecondary,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
    },
    textarea: {
      flex: 1,
      padding: 14,
      border: 'none',
      resize: 'none' as const,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.65,
      background: colors.codeBg,
      color: colors.codeText,
      outline: 'none',
      tabSize: 2,
      spellCheck: false,
    },
    prePreview: {
      flex: 1,
      padding: 14,
      margin: 0,
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.65,
      background: colors.codeBg,
      color: colors.codeText,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
    },
    statusBar: {
      padding: '6px 20px',
      background: colors.bgSecondary,
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      gap: 20,
      fontSize: 11,
      color: colors.textSecondary,
      alignItems: 'center',
      flexShrink: 0,
    },
    langBadge: (color: string): React.CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: isDark ? color + '30' : color + '20',
      color,
      border: `1px solid ${color}50`,
      letterSpacing: '0.3px',
    }),
    divider: {
      width: 1,
      height: 20,
      background: colors.border,
    },
    input: {
      padding: '6px 10px',
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 13,
      outline: 'none',
      fontFamily: 'inherit',
    },
    tag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      borderRadius: 12,
      background: colors.accentBg,
      color: colors.accent,
      fontSize: 12,
      fontWeight: 500,
      border: `1px solid ${colors.border}`,
    },
    emojiBtn: {
      padding: '5px 8px',
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      background: colors.inputBg,
      cursor: 'pointer',
      fontSize: 16,
      transition: 'all 0.15s',
    },
  }

  // ============ 渲染 ============
  return (
    <div style={s.container}>
      {/* ====== 顶部标题栏 ====== */}
      <div style={s.header}>
        <div style={s.title}>
          <Sparkles size={20} />
          <span>CodeSnapShare</span>
        </div>
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          代码片段快速分享平台
        </span>

        <div style={s.headerRight}>
          {/* Tab 切换 */}
          <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
            <button
              style={s.tabBtn(activeTab === 'editor')}
              onClick={() => setActiveTab('editor')}
            >
              <Code2 size={14} />
              编辑器
            </button>
            <button
              style={s.tabBtn(activeTab === 'favorites')}
              onClick={() => setActiveTab('favorites')}
            >
              <Bookmark size={14} />
              收藏 ({favorites.length})
            </button>
            <button
              style={s.tabBtn(activeTab === 'history')}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} />
              历史 ({history.length})
            </button>
          </div>

          <div style={s.divider} />

          <button style={s.iconBtn()} onClick={toggleTheme} title="切换主题">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* ====== 工具栏 ====== */}
      {activeTab === 'editor' && (
        <div style={s.toolbar}>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as LanguageKey)}
            style={s.select}
          >
            {LANGUAGES.map(l => (
              <option key={l.key} value={l.key}>{l.icon} {l.label}</option>
            ))}
          </select>

          <div style={s.divider} />

          <input
            type="text"
            placeholder="输入片段标题..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ ...s.input, width: 200 }}
          />

          <div style={s.divider} />

          {/* Emoji 选择 */}
          <div style={{ position: 'relative' }}>
            <button
              style={s.emojiBtn}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="添加 emoji"
            >
              😀
            </button>
            {showEmojiPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: colors.bgPanel,
                  border: `1px solid ${colors.borderStrong}`,
                  borderRadius: 8,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 6,
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
              >
                {EMOJI_POOL.map(e => (
                  <button
                    key={e}
                    onClick={() => addEmoji(e)}
                    style={{
                      width: 28,
                      height: 28,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 16,
                      borderRadius: 4,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = colors.accentBg }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent' }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {emojis.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {emojis.map(e => (
                <span
                  key={e}
                  onClick={() => removeEmoji(e)}
                  style={{
                    ...s.tag,
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 6px',
                  }}
                  title="点击移除"
                >
                  {e}
                </span>
              ))}
            </div>
          )}

          <div style={s.divider} />

          {/* 标签输入 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TagIcon size={13} style={{ color: colors.textSecondary }} />
            <input
              type="text"
              placeholder="添加标签..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              style={{ ...s.input, width: 130 }}
            />
            {tagInput && (
              <button style={s.btn('secondary')} onClick={addTag}>
                <Plus size={12} /> 添加
              </button>
            )}
          </div>

          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tags.map(t => (
                <span key={t} style={s.tag}>
                  #{t}
                  <X
                    size={10}
                    style={{ cursor: 'pointer' }}
                    onClick={() => removeTag(t)}
                  />
                </span>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <button
            style={s.iconBtn(showPreview)}
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? '隐藏预览' : '显示预览'}
          >
            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            style={s.btn('secondary')}
            onClick={() => handleCopy(code, 'code')}
            disabled={!code}
          >
            <Copy size={13} />
            {copiedId === 'code' ? '已复制' : '复制代码'}
          </button>

          <button
            style={s.btn('secondary')}
            onClick={toggleFavorite}
            disabled={!code}
          >
            {isFavorited ? <Star size={13} fill="currentColor" /> : <Star size={13} />}
            {isFavorited ? '已收藏' : '收藏'}
          </button>

          <button
            style={s.btn('secondary')}
            onClick={handleDownload}
            disabled={!code}
          >
            <Download size={13} />
            下载
          </button>

          <button
            style={s.btn('primary')}
            onClick={generateShareLink}
            disabled={!code}
          >
            <Share2 size={13} />
            生成分享链接
          </button>

          <button
            style={s.btn('danger')}
            onClick={clearAll}
          >
            <Trash2 size={13} />
            清空
          </button>
        </div>
      )}

      {activeTab !== 'editor' && (
        <div style={{ ...s.toolbar, padding: '10px 20px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }}
            />
            <input
              type="text"
              placeholder={activeTab === 'favorites' ? '搜索收藏...' : '搜索历史...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...s.input, width: '100%', paddingLeft: 32 }}
            />
          </div>
          {activeTab === 'favorites' && favorites.length > 0 && (
            <button
              style={s.btn('danger')}
              onClick={() => { if (confirm('确定清空所有收藏？')) persistFavorites([]) }}
            >
              <Trash2 size={13} /> 清空全部
            </button>
          )}
          {activeTab === 'history' && history.length > 0 && (
            <button
              style={s.btn('danger')}
              onClick={() => { if (confirm('确定清空所有历史？')) persistHistory([]) }}
            >
              <Trash2 size={13} /> 清空全部
            </button>
          )}
        </div>
      )}

      {/* ====== 主内容区 ====== */}
      {activeTab === 'editor' && (
        <div style={s.mainArea}>
          <div style={s.editorPanel}>
            <div style={s.panelHeader}>
              <span style={s.langBadge(currentLang.color)}>
                {currentLang.icon} {currentLang.label}
              </span>
              <span>代码编辑器</span>
              <div style={{ flex: 1 }} />
              <span style={{ color: colors.textMuted }}>
                {stats.lines} 行 · {stats.chars} 字符
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onScroll={handleSyncScroll}
              placeholder={`在此输入 ${currentLang.label} 代码...`}
              spellCheck={false}
              style={s.textarea}
            />
          </div>

          {showPreview && (
            <div style={s.previewPanel}>
              <div style={s.panelHeader}>
                <FileCode size={13} />
                <span>语法高亮预览</span>
                <div style={{ flex: 1 }} />
                <span style={{ color: colors.textMuted }}>
                  {stats.words} 词
                </span>
              </div>
              <pre ref={previewRef} style={s.prePreview}>
                {code ? (
                  <code dangerouslySetInnerHTML={{ __html: highlightedPreview }} />
                ) : (
                  <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                    在左侧输入代码后，此处将显示语法高亮预览
                  </span>
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <SnapshotList
          items={filteredFavorites}
          colors={colors}
          formatTime={formatTime}
          onLoad={loadSnapshot}
          onDelete={deleteFavorite}
          type="favorites"
        />
      )}

      {activeTab === 'history' && (
        <SnapshotList
          items={filteredHistory}
          colors={colors}
          formatTime={formatTime}
          onLoad={loadSnapshot}
          onDelete={deleteHistoryItem}
          type="history"
        />
      )}

      {/* ====== 状态栏 ====== */}
      {activeTab === 'editor' && (
        <div style={s.statusBar}>
          <span>
            <Zap size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {stats.lines} 行
          </span>
          <span>{stats.chars} 字符</span>
          <span>{stats.words} 词</span>
          <span style={s.langBadge(currentLang.color)}>
            {currentLang.icon} {currentLang.label}
          </span>
          {emojis.length > 0 && (
            <span style={{ color: colors.textSecondary }}>
              {emojis.join(' ')}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, opacity: 0.6 }}>
            CodeSnapShare · 代码片段快速分享
          </span>
        </div>
      )}

      {/* ====== 分享链接弹窗 ====== */}
      {showShareModal && (
        <ShareModal
          url={shareUrl}
          colors={colors}
          onClose={() => setShowShareModal(false)}
          onCopy={handleCopy}
          copiedId={copiedId}
        />
      )}
    </div>
  )
}

// ============ 子组件：分享弹窗 ============
interface ShareModalProps {
  url: string
  colors: {
    bg: string
    bgSecondary: string
    bgPanel: string
    border: string
    borderStrong: string
    textPrimary: string
    textSecondary: string
    accent: string
    accentBg: string
    danger: string
    success: string
  }
  onClose: () => void
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}

function ShareModal({ url, colors, onClose, onCopy, copiedId }: ShareModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: colors.bgPanel,
          border: `1px solid ${colors.borderStrong}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: colors.accentBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={16} style={{ color: colors.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>分享链接已生成</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                代码已编码到 URL 中，可直接分享
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            <Link2 size={14} style={{ color: colors.accent, flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
                color: colors.textPrimary,
                wordBreak: 'break-all',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={url}
            >
              {url}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onCopy(url, 'share')}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: copiedId === 'share' ? colors.success : colors.accent,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {copiedId === 'share' ? (
                <>
                  <Check size={14} /> 已复制!
                </>
              ) : (
                <>
                  <Copy size={14} /> 复制链接
                </>
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: `1px solid ${colors.borderStrong}`,
                borderRadius: 8,
                color: colors.textPrimary,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              完成
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: colors.bg,
              borderRadius: 8,
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            💡 <strong style={{ color: colors.textPrimary }}>使用提示：</strong>
            将此链接发送给他人，他们访问后会自动导入代码到编辑器。
            链接使用 Base64 编码，数据直接存储在 URL 中，无需服务器。
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ 子组件：片段列表 ============
interface SnapshotListProps {
  items: StoredSnapshot[]
  colors: {
    bg: string
    bgSecondary: string
    bgPanel: string
    border: string
    borderStrong: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    accent: string
    accentBg: string
    danger: string
    success: string
  }
  formatTime: (ts: number) => string
  onLoad: (s: StoredSnapshot) => void
  onDelete: (id: string) => void
  type: 'favorites' | 'history'
}

function SnapshotList({ items, colors, formatTime, onLoad, onDelete, type }: SnapshotListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* ignore */ }
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textMuted,
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>{type === 'favorites' ? '📑' : '🕐'}</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          {type === 'favorites' ? '暂无收藏' : '暂无历史记录'}
        </div>
        <div style={{ fontSize: 13 }}>
          {type === 'favorites'
            ? '在编辑器中点击"收藏"按钮保存代码片段'
            : '生成分享链接后会自动保存历史记录'}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        {items.map(item => {
          const lang = LANGUAGES.find(l => l.key === item.language)!
          const expanded = expandedId === item.id
          const isFav = type === 'favorites'

          return (
            <div
              key={item.id}
              style={{
                background: colors.bgPanel,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: expanded ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!expanded) e.currentTarget.style.borderColor = colors.borderStrong
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isFav ? 'rgba(251, 191, 36, 0.15)' : colors.accentBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isFav ? (
                    <Star size={16} style={{ color: '#fbbf24' }} fill="currentColor" />
                  ) : (
                    <Clock size={16} style={{ color: colors.accent }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: colors.textPrimary,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.emojis.length > 0 && <span style={{ marginRight: 4 }}>{item.emojis.join(' ')}</span>}
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: colors.textSecondary }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: lang.color + '30',
                        color: lang.color,
                      }}
                    >
                      {lang.icon}
                    </span>
                    <span>{lang.label}</span>
                    <span>·</span>
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  background: colors.bg,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: 12,
                  color: '#a0a0b8',
                  maxHeight: expanded ? 240 : 60,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => setExpandedId(expanded ? null : item.id)}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }}>
                    {expanded ? item.code : item.code.slice(0, 120) + (item.code.length > 120 ? '...' : '')}
                  </pre>
                  {!expanded && item.code.length > 120 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 30,
                        background: `linear-gradient(transparent, ${colors.bg})`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>

                {(item.tags.length > 0 || item.emojis.length > 0) && (
                  <div style={{ padding: '8px 14px 4px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {item.emojis.map(e => (
                      <span key={e} style={{ fontSize: 14 }}>{e}</span>
                    ))}
                    {item.tags.map(t => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          padding: '1px 8px',
                          borderRadius: 8,
                          background: colors.accentBg,
                          color: colors.accent,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    borderTop: `1px solid ${colors.border}`,
                    background: colors.bgSecondary,
                  }}
                >
                  <button
                    onClick={() => onLoad(item)}
                    style={{
                      flex: 1,
                      padding: '5px 10px',
                      border: `1px solid ${colors.borderStrong}`,
                      borderRadius: 6,
                      background: 'transparent',
                      color: colors.textPrimary,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <BookOpen size={12} /> 加载
                  </button>
                  <button
                    onClick={() => handleCopy(item.code, item.id)}
                    style={{
                      padding: '5px 10px',
                      border: `1px solid ${colors.borderStrong}`,
                      borderRadius: 6,
                      background: 'transparent',
                      color: copiedId === item.id ? colors.success : colors.textPrimary,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === item.id ? '已复制' : '复制'}
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{
                      padding: '5px 10px',
                      border: `1px solid ${colors.danger}40`,
                      borderRadius: 6,
                      background: 'transparent',
                      color: colors.danger,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}