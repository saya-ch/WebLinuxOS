import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'
import {
  File as FileIcon,
  FolderOpen,
  Save,
  Search,
  Replace,
  Sun,
  Moon,
  WrapText,
} from 'lucide-react'

// ─── File Type Definitions ────────────────────────────────────────────────────

interface FileTypeDefinition {
  name: string
  icon: string
  color: string
}

const FILE_TYPE_DEFINITIONS: Record<string, FileTypeDefinition> = {
  txt: { name: 'Plain Text', icon: '📄', color: '#9e9e9e' },
  md: { name: 'Markdown', icon: '📝', color: '#42a5f5' },
  js: { name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
  jsx: { name: 'JSX', icon: '⚛️', color: '#61dafb' },
  ts: { name: 'TypeScript', icon: '🔷', color: '#3178c6' },
  tsx: { name: 'TSX', icon: '⚛️', color: '#3178c6' },
  py: { name: 'Python', icon: '🐍', color: '#3776ab' },
  rs: { name: 'Rust', icon: '🦀', color: '#dea584' },
  go: { name: 'Go', icon: '🐹', color: '#00add8' },
  java: { name: 'Java', icon: '☕', color: '#ed8b00' },
  c: { name: 'C', icon: '⚙️', color: '#a8b9cc' },
  cpp: { name: 'C++', icon: '⚙️', color: '#f34b7d' },
  h: { name: 'C Header', icon: '⚙️', color: '#a8b9cc' },
  hpp: { name: 'C++ Header', icon: '⚙️', color: '#f34b7d' },
  css: { name: 'CSS', icon: '🎨', color: '#563d7c' },
  scss: { name: 'SCSS', icon: '🎨', color: '#cf649a' },
  html: { name: 'HTML', icon: '🌐', color: '#e34c26' },
  htm: { name: 'HTML', icon: '🌐', color: '#e34c26' },
  sql: { name: 'SQL', icon: '🗃️', color: '#e38c00' },
  sh: { name: 'Shell', icon: '🖥️', color: '#89e051' },
  bash: { name: 'Bash', icon: '🖥️', color: '#89e051' },
  zsh: { name: 'Zsh', icon: '🖥️', color: '#89e051' },
  json: { name: 'JSON', icon: '📋', color: '#292929' },
  yaml: { name: 'YAML', icon: '📄', color: '#cb171e' },
  yml: { name: 'YAML', icon: '📄', color: '#cb171e' },
  toml: { name: 'TOML', icon: '📄', color: '#9c4121' },
  ini: { name: 'INI', icon: '⚙️', color: '#8c8c8c' },
  xml: { name: 'XML', icon: '📰', color: '#0060ac' },
  svg: { name: 'SVG', icon: '🎨', color: '#ffb13b' },
  log: { name: 'Log', icon: '📊', color: '#9e9e9e' },
  conf: { name: 'Config', icon: '⚙️', color: '#8c8c8c' },
  cfg: { name: 'Config', icon: '⚙️', color: '#8c8c8c' },
  env: { name: 'Environment', icon: '⚙️', color: '#ecd53f' },
  gitignore: { name: 'Git Ignore', icon: '🚫', color: '#f05032' },
  dockerignore: { name: 'Docker Ignore', icon: '🚫', color: '#0db7ed' },
  dockerfile: { name: 'Dockerfile', icon: '🐳', color: '#0db7ed' },
  makefile: { name: 'Makefile', icon: '🔧', color: '#427819' },
  svelte: { name: 'Svelte', icon: '🔥', color: '#ff3e00' },
  vue: { name: 'Vue', icon: '💚', color: '#42b883' },
  lock: { name: 'Lock', icon: '🔒', color: '#6c757d' },
}

// Special filename mappings (no duplicate keys allowed)
const SPECIAL_FILENAME_MAP: Record<string, string> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  gnumakefile: 'makefile',
  gemfile: 'ruby',
  rakefile: 'ruby',
  vagrantfile: 'ruby',
  jenkinsfile: 'groovy',
  '.gitignore': 'gitignore',
  '.dockerignore': 'dockerignore',
  '.env': 'env',
  '.env.local': 'env',
  '.env.development': 'env',
  '.env.production': 'env',
  '.env.test': 'env',
  '.env.staging': 'env',
  '.editorconfig': 'ini',
  '.eslintrc': 'json',
  '.eslintrc.js': 'js',
  '.eslintrc.json': 'json',
  '.eslintrc.yml': 'yaml',
  '.prettierrc': 'json',
  '.prettierrc.js': 'js',
  '.prettierrc.json': 'json',
  '.babelrc': 'json',
  '.tsconfig': 'json',
  'tsconfig.json': 'json',
  'package.json': 'json',
  'package-lock.json': 'json',
  'yarn.lock': 'lock',
  'cargo.lock': 'lock',
  'cargo.toml': 'toml',
  'pipfile': 'toml',
  'pipfile.lock': 'lock',
  'readme': 'md',
  'readme.md': 'md',
  'readme.txt': 'txt',
  'license': 'txt',
  'license.md': 'md',
  'changelog': 'md',
  'changelog.md': 'md',
  '.npmrc': 'ini',
  '.npmignore': 'gitignore',
  '.bowerrc': 'json',
}

function detectFileType(fileName: string): FileTypeDefinition {
  if (!fileName) return FILE_TYPE_DEFINITIONS.txt

  const lower = fileName.toLowerCase()

  // 1. Check special filename map (exact match)
  if (SPECIAL_FILENAME_MAP[lower]) {
    return FILE_TYPE_DEFINITIONS[SPECIAL_FILENAME_MAP[lower]] || FILE_TYPE_DEFINITIONS.txt
  }

  // 2. Check multi-segment extensions (e.g., .d.ts, .spec.ts)
  const multiSegmentPatterns: Array<[RegExp, string]> = [
    [/\.d\.ts$/, 'ts'],
    [/\.spec\.ts$/, 'ts'],
    [/\.test\.ts$/, 'ts'],
    [/\.spec\.js$/, 'js'],
    [/\.test\.js$/, 'js'],
    [/\.spec\.py$/, 'py'],
    [/\.test\.py$/, 'py'],
    [/\.module\.css$/, 'css'],
    [/\.module\.scss$/, 'scss'],
    [/\.stories\.tsx$/, 'tsx'],
    [/\.stories\.jsx$/, 'jsx'],
    [/\.config\.js$/, 'js'],
    [/\.config\.ts$/, 'ts'],
    [/\.config\.mjs$/, 'js'],
    [/\.config\.cjs$/, 'js'],
    [/\.d\.cts$/, 'ts'],
    [/\.d\.mts$/, 'ts'],
  ]
  for (const [pattern, ext] of multiSegmentPatterns) {
    if (pattern.test(lower)) {
      return FILE_TYPE_DEFINITIONS[ext] || FILE_TYPE_DEFINITIONS.txt
    }
  }

  // 3. Check extension (last segment after final dot)
  const dotIndex = lower.lastIndexOf('.')
  if (dotIndex > 0) {
    const ext = lower.slice(dotIndex + 1)
    if (FILE_TYPE_DEFINITIONS[ext]) {
      return FILE_TYPE_DEFINITIONS[ext]
    }
  }

  return FILE_TYPE_DEFINITIONS.txt
}

// ─── Tab Interface ────────────────────────────────────────────────────────────

interface TabInfo {
  id: string
  name: string
  fileId: string | null
  content: string
  isDirty: boolean
}

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Menu Types ───────────────────────────────────────────────────────────────

interface MenuItem {
  label?: string
  shortcut?: string
  action?: string
  type?: 'separator' | 'info' | 'item'
}

interface MenuDef {
  name: string
  items: MenuItem[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TextEditor() {
  // ── Store ──
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)
  const addFile = useStore((s) => s.addFile)

  // ── State ──
  const [tabs, setTabs] = useState<TabInfo[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('Untitled')
  const [fileId, setFileId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [showFind, setShowFind] = useState<boolean>(false)
  const [showReplace, setShowReplace] = useState<boolean>(false)
  const [findText, setFindText] = useState<string>('')
  const [replaceText, setReplaceText] = useState<string>('')
  const [matchCount, setMatchCount] = useState<number>(0)
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [showAbout, setShowAbout] = useState<boolean>(false)
  const [showGoToLine, setShowGoToLine] = useState<boolean>(false)
  const [goToLineNum, setGoToLineNum] = useState<string>('1')
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark')
  const [wordWrap, setWordWrap] = useState<boolean>(true)
  const [cursorLine, setCursorLine] = useState<number>(1)
  const [cursorCol, setCursorCol] = useState<number>(1)

  // ── Refs ──
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<string>(content)
  const activeTabIdRef = useRef<string>(activeTabId)
  const tabsRef = useRef<TabInfo[]>(tabs)

  // Sync refs
  useEffect(() => {
    contentRef.current = content
  }, [content])
  useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])
  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])

  // ── Computed ──
  const fileTypeDef = useMemo(() => detectFileType(fileName), [fileName])

  const editorFontSize = useMemo(() => Math.round((13 * zoomLevel) / 100), [zoomLevel])
  const editorLineHeight = useMemo(
    () => Math.round(1.5 * editorFontSize * 10) / 10,
    [editorFontSize]
  )

  const lineCount = useMemo(() => {
    if (!content) return 1
    return content.split('\n').length
  }, [content])

  const statusMessage = useMemo(() => {
    if (isDirty) return 'Modified'
    return fileId ? 'Saved' : 'New File'
  }, [isDirty, fileId])

  // ── Tab Operations ──
  const createTab = useCallback(
    (name: string = 'Untitled', newFileId: string | null = null, initialContent: string = '') => {
      const id = generateId()
      const newTab: TabInfo = {
        id,
        name,
        fileId: newFileId,
        content: initialContent,
        isDirty: false,
      }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(id)
      setContent(initialContent)
      setFileName(name)
      setFileId(newFileId)
      setIsDirty(false)
      setShowFind(false)
      setShowReplace(false)
      return id
    },
    []
  )

  const switchToTab = useCallback(
    (id: string) => {
      // Save current tab state
      const currentId = activeTabIdRef.current
      if (currentId) {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === currentId
              ? { ...t, content: contentRef.current, isDirty: isDirty }
              : t
          )
        )
      }
      // Load new tab state
      const tab = tabsRef.current.find((t) => t.id === id)
      if (tab) {
        setActiveTabId(id)
        setContent(tab.content)
        setFileName(tab.name)
        setFileId(tab.fileId)
        setIsDirty(tab.isDirty)
        setShowFind(false)
        setShowReplace(false)
      }
    },
    [isDirty]
  )

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id)
        if (idx === -1) return prev

        const remaining = prev.filter((t) => t.id !== id)

        // If closing the active tab, switch to another
        if (activeTabIdRef.current === id) {
          if (remaining.length === 0) {
            // Create a fresh tab
            const newId = generateId()
            const newTab: TabInfo = {
              id: newId,
              name: 'Untitled',
              fileId: null,
              content: '',
              isDirty: false,
            }
            setActiveTabId(newId)
            setContent('')
            setFileName('Untitled')
            setFileId(null)
            setIsDirty(false)
            return [newTab]
          } else {
            const newIdx = Math.min(idx, remaining.length - 1)
            const newActive = remaining[newIdx]
            setActiveTabId(newActive.id)
            setContent(newActive.content)
            setFileName(newActive.name)
            setFileId(newActive.fileId)
            setIsDirty(newActive.isDirty)
          }
        }

        return remaining
      })
    },
    []
  )

  const closeOtherTabs = useCallback((id: string) => {
    const tab = tabsRef.current.find((t) => t.id === id)
    if (!tab) return
    setTabs([tab])
    setActiveTabId(id)
    setContent(tab.content)
    setFileName(tab.name)
    setFileId(tab.fileId)
    setIsDirty(tab.isDirty)
  }, [])

  const closeAllTabs = useCallback(() => {
    const newId = generateId()
    const newTab: TabInfo = {
      id: newId,
      name: 'Untitled',
      fileId: null,
      content: '',
      isDirty: false,
    }
    setTabs([newTab])
    setActiveTabId(newId)
    setContent('')
    setFileName('Untitled')
    setFileId(null)
    setIsDirty(false)
  }, [])

  // ── Cursor Position ──
  const updateCursorInfo = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const pos = textarea.selectionStart
    const textBefore = contentRef.current.substring(0, pos)
    const lines = textBefore.split('\n')
    setCursorLine(lines.length)
    setCursorCol(lines[lines.length - 1].length + 1)
  }, [])

  // ── File Operations ──
  const newFile = useCallback(() => {
    createTab()
  }, [createTab])

  // Helper to find a file node by id
  const findFileNode = useCallback(
    (nodes: FileNode[], id: string): FileNode | undefined => {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children) {
          const f = findFileNode(n.children, id)
          if (f) return f
        }
      }
      return undefined
    },
    []
  )

  // Helper to find a folder by name
  const findFolderByName = useCallback(
    (nodes: FileNode[], name: string): FileNode | undefined => {
      for (const n of nodes) {
        if (n.name === name && n.type === 'folder') return n
        if (n.children) {
          const f = findFolderByName(n.children, name)
          if (f) return f
        }
      }
      return undefined
    },
    []
  )

  const loadFileById = useCallback(
    (id: string) => {
      const file = findFileNode(files, id)
      if (!file || file.type !== 'file') return

      // Check if already open
      const existingTab = tabsRef.current.find((t) => t.fileId === id)
      if (existingTab) {
        switchToTab(existingTab.id)
        return
      }

      createTab(file.name, file.id, file.content || '')
    },
    [files, findFileNode, createTab, switchToTab]
  )

  const saveFile = useCallback(() => {
    if (fileId) {
      updateFileContent(fileId, content)
      setIsDirty(false)
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabIdRef.current ? { ...t, isDirty: false } : t))
      )
    } else {
      // Try to add file to a documents folder
      const documentsFolder =
        findFolderByName(files, '文档') || findFolderByName(files, 'documents')
      if (documentsFolder) {
        addFile(documentsFolder.id, fileName, 'file')
      } else {
        // Fallback: download as a file
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
      setIsDirty(false)
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabIdRef.current ? { ...t, isDirty: false } : t))
      )
    }
  }, [fileId, content, fileName, files, updateFileContent, addFile, findFolderByName])

  const saveFileAs = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    setIsDirty(false)
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabIdRef.current ? { ...t, isDirty: false } : t))
    )
  }, [content, fileName])

  // ── Edit Operations ──
  const cut = useCallback(async () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content.substring(start, end)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard access denied
    }
    const newContent = content.substring(0, start) + content.substring(end)
    setContent(newContent)
    setIsDirty(true)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start
      }
    })
  }, [content])

  const copy = useCallback(async () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content.substring(start, end)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard access denied
    }
  }, [content])

  const paste = useCallback(async () => {
    let text = ''
    try {
      text = await navigator.clipboard.readText()
    } catch {
      return
    }
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    setContent(newContent)
    setIsDirty(true)
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + text.length
        updateCursorInfo()
      }
    })
  }, [content, updateCursorInfo])

  const selectAll = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.select()
    }
  }, [])

  const performGoToLine = useCallback(() => {
    const lineNum = parseInt(goToLineNum, 10)
    if (isNaN(lineNum) || lineNum < 1 || lineNum > lineCount) return

    const textarea = textareaRef.current
    if (!textarea) return

    const lines = content.split('\n')
    let pos = 0
    for (let i = 0; i < lineNum - 1; i++) {
      pos += lines[i].length + 1
    }
    textarea.focus()
    textarea.setSelectionRange(pos, pos)
    updateCursorInfo()
    setShowGoToLine(false)
  }, [goToLineNum, lineCount, content, updateCursorInfo])

  // ── Find & Replace ──
  const performFind = useCallback(() => {
    if (!findText) {
      setMatchCount(0)
      setCurrentMatchIndex(-1)
      return
    }
    const matches: number[] = []
    const text = content
    const search = findText
    let pos = 0
    while (true) {
      const found = text.indexOf(search, pos)
      if (found === -1) break
      matches.push(found)
      pos = found + 1
    }
    setMatchCount(matches.length)

    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => {
        const idx = prev < 0 || prev >= matches.length ? 0 : prev
        const textarea = textareaRef.current
        if (textarea) {
          const start = matches[idx]
          textarea.focus()
          textarea.setSelectionRange(start, start + search.length)
          updateCursorInfo()
        }
        return idx
      })
    } else {
      setCurrentMatchIndex(-1)
    }
  }, [findText, content, updateCursorInfo])

  const findNext = useCallback(() => {
    if (matchCount <= 0) return
    setCurrentMatchIndex((prev) => {
      const next = (prev + 1) % matchCount
      // Apply selection for the new index
      const matches: number[] = []
      const text = content
      const search = findText
      let p = 0
      while (true) {
        const f = text.indexOf(search, p)
        if (f === -1) break
        matches.push(f)
        p = f + 1
      }
      const textarea = textareaRef.current
      if (textarea && matches[next] !== undefined) {
        const start = matches[next]
        textarea.focus()
        textarea.setSelectionRange(start, start + search.length)
        updateCursorInfo()
      }
      return next
    })
  }, [matchCount, content, findText, updateCursorInfo])

  const findPrev = useCallback(() => {
    if (matchCount <= 0) return
    setCurrentMatchIndex((prev) => {
      const prevIdx = (prev - 1 + matchCount) % matchCount
      const matches: number[] = []
      const text = content
      const search = findText
      let p = 0
      while (true) {
        const f = text.indexOf(search, p)
        if (f === -1) break
        matches.push(f)
        p = f + 1
      }
      const textarea = textareaRef.current
      if (textarea && matches[prevIdx] !== undefined) {
        const start = matches[prevIdx]
        textarea.focus()
        textarea.setSelectionRange(start, start + search.length)
        updateCursorInfo()
      }
      return prevIdx
    })
  }, [matchCount, content, findText, updateCursorInfo])

  const replaceCurrent = useCallback(() => {
    if (!findText || currentMatchIndex < 0) return
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)

    if (selected === findText) {
      const newContent =
        content.substring(0, start) + replaceText + content.substring(end)
      setContent(newContent)
      setIsDirty(true)
      requestAnimationFrame(() => {
        performFind()
      })
    } else {
      performFind()
    }
  }, [findText, replaceText, content, currentMatchIndex, performFind])

  const replaceAll = useCallback(() => {
    if (!findText) return
    const newContent = content.split(findText).join(replaceText)
    setContent(newContent)
    setIsDirty(true)
    setMatchCount(0)
    setCurrentMatchIndex(-1)
  }, [findText, replaceText, content])

  // ── Zoom ──
  const zoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(200, z + 10))
  }, [])
  const zoomOut = useCallback(() => {
    setZoomLevel((z) => Math.max(50, z - 10))
  }, [])
  const zoomReset = useCallback(() => {
    setZoomLevel(100)
  }, [])

  // ── Theme ──
  const toggleTheme = useCallback(() => {
    setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }, [])

  // ── Word Wrap ──
  const toggleWordWrap = useCallback(() => {
    setWordWrap((w) => !w)
  }, [])

  // ── Menu ──
  const toggleMenu = useCallback((menuName: string) => {
    setShowMenu((m) => (m === menuName ? null : menuName))
  }, [])

  const handleMenuAction = useCallback(
    (action: string) => {
      setShowMenu(null)
      switch (action) {
        case 'new':
          newFile()
          break
        case 'save':
          saveFile()
          break
        case 'save-as':
          saveFileAs()
          break
        case 'cut':
          cut()
          break
        case 'copy':
          copy()
          break
        case 'paste':
          paste()
          break
        case 'select-all':
          selectAll()
          break
        case 'find':
          setShowFind(true)
          setShowReplace(false)
          break
        case 'replace':
          setShowFind(true)
          setShowReplace(true)
          break
        case 'go-to-line':
          setShowGoToLine(true)
          setGoToLineNum('1')
          break
        case 'zoom-in':
          zoomIn()
          break
        case 'zoom-out':
          zoomOut()
          break
        case 'zoom-reset':
          zoomReset()
          break
        case 'theme':
          toggleTheme()
          break
        case 'word-wrap':
          toggleWordWrap()
          break
        case 'about':
          setShowAbout(true)
          break
        case 'close-tab':
          closeTab(activeTabIdRef.current)
          break
        case 'close-others':
          closeOtherTabs(activeTabIdRef.current)
          break
        case 'close-all':
          closeAllTabs()
          break
        default:
          break
      }
    },
    [
      newFile,
      saveFile,
      saveFileAs,
      cut,
      copy,
      paste,
      selectAll,
      zoomIn,
      zoomOut,
      zoomReset,
      toggleTheme,
      toggleWordWrap,
      closeTab,
      closeOtherTabs,
      closeAllTabs,
    ]
  )

  // ── Content Change Handler ──
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      setIsDirty(true)
      // Update tab content & dirty flag
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabIdRef.current
            ? { ...t, content: newContent, isDirty: true }
            : t
        )
      )
    },
    []
  )

  // ── Scroll Sync ──
  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = textarea.scrollTop
    }
  }, [])

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'f') {
        e.preventDefault()
        setShowFind(true)
        setShowReplace(false)
      }
      if (ctrl && e.key === 'h') {
        e.preventDefault()
        setShowFind(true)
        setShowReplace(true)
      }
      if (ctrl && e.key === 's') {
        e.preventDefault()
        saveFile()
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault()
        newFile()
      }
      if (ctrl && e.key === '=') {
        e.preventDefault()
        zoomIn()
      }
      if (ctrl && e.key === '-') {
        e.preventDefault()
        zoomOut()
      }
      if (ctrl && e.key === '0') {
        e.preventDefault()
        zoomReset()
      }
      if (ctrl && e.key === 'g') {
        e.preventDefault()
        setShowGoToLine(true)
        setGoToLineNum('1')
      }
      if (e.key === 'Escape') {
        setShowFind(false)
        setShowReplace(false)
        setShowMenu(null)
        setShowGoToLine(false)
        setShowAbout(false)
      }
      if (e.key === 'F3') {
        e.preventDefault()
        if (findText) {
          if (e.shiftKey) findPrev()
          else findNext()
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeydown)
    return () => document.removeEventListener('keydown', handleGlobalKeydown)
  }, [
    saveFile,
    newFile,
    zoomIn,
    zoomOut,
    zoomReset,
    findText,
    findNext,
    findPrev,
  ])

  // ── Click Outside Handler for Menus ──
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // ── Listen for open-file events ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { appId?: string; fileId?: string }
      if (detail.appId === 'texteditor' && detail.fileId) {
        loadFileById(detail.fileId)
      }
    }
    window.addEventListener('open-file', handler)
    return () => window.removeEventListener('open-file', handler)
  }, [loadFileById])

  // ── Initialize first tab on mount ──
  useEffect(() => {
    if (tabs.length === 0) {
      createTab()
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Menu Definitions ──
  const menus: MenuDef[] = useMemo(
    () => [
      {
        name: 'File',
        items: [
          { label: 'New File', shortcut: 'Ctrl+N', action: 'new', type: 'item' },
          { label: 'Save', shortcut: 'Ctrl+S', action: 'save', type: 'item' },
          { label: 'Save As…', shortcut: 'Ctrl+Shift+S', action: 'save-as', type: 'item' },
          { type: 'separator' },
          { label: 'Close Tab', shortcut: 'Ctrl+W', action: 'close-tab', type: 'item' },
          { label: 'Close Others', action: 'close-others', type: 'item' },
          { label: 'Close All', action: 'close-all', type: 'item' },
        ],
      },
      {
        name: 'Edit',
        items: [
          { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut', type: 'item' },
          { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy', type: 'item' },
          { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste', type: 'item' },
          { type: 'separator' },
          { label: 'Select All', shortcut: 'Ctrl+A', action: 'select-all', type: 'item' },
        ],
      },
      {
        name: 'Find',
        items: [
          { label: 'Find…', shortcut: 'Ctrl+F', action: 'find', type: 'item' },
          { label: 'Replace…', shortcut: 'Ctrl+H', action: 'replace', type: 'item' },
          { label: 'Go to Line…', shortcut: 'Ctrl+G', action: 'go-to-line', type: 'item' },
        ],
      },
      {
        name: 'View',
        items: [
          { label: 'Zoom In', shortcut: 'Ctrl++', action: 'zoom-in', type: 'item' },
          { label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoom-out', type: 'item' },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'zoom-reset', type: 'item' },
          { label: `Zoom: ${zoomLevel}%`, type: 'info' },
          { type: 'separator' },
          {
            label: `Word Wrap${wordWrap ? ' ✓' : ''}`,
            action: 'word-wrap',
            type: 'item',
          },
          { type: 'separator' },
          {
            label: themeMode === 'dark' ? '☀️ Light Theme' : '🌙 Dark Theme',
            action: 'theme',
            type: 'item',
          },
        ],
      },
      {
        name: 'Help',
        items: [{ label: 'About Text Editor', action: 'about', type: 'item' }],
      },
    ],
    [zoomLevel, wordWrap, themeMode]
  )

  // ── Render ──
  const themeClass = themeMode === 'dark' ? 'te-theme-dark' : 'te-theme-light'

  const btnStyle: React.CSSProperties = {
    padding: '2px 8px',
    fontSize: 11,
    background: 'transparent',
    border: '1px solid var(--te-border)',
    borderRadius: 4,
    color: 'var(--te-text)',
    cursor: 'pointer',
  }

  const menuBtnStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    background: 'transparent',
    border: 'none',
  }

  return (
    <div
      className={`te-root ${themeClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowMenu(null)
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--te-bg)',
        color: 'var(--te-text)',
        fontFamily:
          "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <style>{`
        .te-theme-dark {
          --te-bg: #1e1e2e;
          --te-text: #cdd6f4;
          --te-text-muted: #6c7086;
          --te-accent: #89b4fa;
          --te-border: #313244;
          --te-menubar-bg: #181825;
          --te-menu-bg: #1e1e2e;
          --te-menu-hover-bg: rgba(137, 180, 250, 0.15);
          --te-tab-bg: #11111b;
          --te-statusbar-bg: #181825;
          --te-gutter-bg: #181825;
          --te-line-num-color: #45475a;
          --te-input-bg: #11111b;
        }
        .te-theme-light {
          --te-bg: #eff1f5;
          --te-text: #4c4f69;
          --te-text-muted: #7c7f93;
          --te-accent: #1e66f5;
          --te-border: #ccd0da;
          --te-menubar-bg: #e6e9ef;
          --te-menu-bg: #eff1f5;
          --te-menu-hover-bg: rgba(30, 102, 245, 0.1);
          --te-tab-bg: #dce0e8;
          --te-statusbar-bg: #e6e9ef;
          --te-gutter-bg: #e6e9ef;
          --te-line-num-color: #9ca0b0;
          --te-input-bg: #ffffff;
        }
        .te-menu-item:hover {
          background: var(--te-menu-hover-bg);
        }
        .te-tab-close:hover {
          opacity: 1 !important;
          background: var(--te-menu-hover-bg);
        }
        .te-input:focus {
          border-color: var(--te-accent) !important;
          box-shadow: 0 0 0 1px var(--te-accent);
          outline: none;
        }
        .te-btn:hover:not(:disabled) {
          opacity: 0.85;
        }
        .te-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .te-textarea::selection {
          background: rgba(137, 180, 250, 0.3);
        }
        .te-theme-light .te-textarea::selection {
          background: rgba(30, 102, 245, 0.25);
        }
        .te-line-numbers::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ── Menu Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 28,
          minHeight: 28,
          background: 'var(--te-menubar-bg)',
          borderBottom: '1px solid var(--te-border)',
          padding: '0 4px',
          userSelect: 'none',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '0 6px', fontSize: 14, display: 'flex', alignItems: 'center' }}>
          📝
        </div>

        {menus.map((menu) => (
          <div
            key={menu.name}
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                ...menuBtnStyle,
                color:
                  showMenu === menu.name ? 'var(--te-accent)' : 'var(--te-text)',
                background:
                  showMenu === menu.name ? 'var(--te-menu-hover-bg)' : 'transparent',
              }}
              onClick={() => toggleMenu(menu.name)}
              onMouseEnter={() => {
                if (showMenu) setShowMenu(menu.name)
              }}
            >
              {menu.name}
            </button>

            {showMenu === menu.name && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: 220,
                  background: 'var(--te-menu-bg)',
                  border: '1px solid var(--te-border)',
                  borderRadius: 6,
                  padding: '4px 0',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  zIndex: 200,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {menu.items.map((item, idx) => {
                  if (item.type === 'separator') {
                    return (
                      <div
                        key={idx}
                        style={{
                          height: 1,
                          background: 'var(--te-border)',
                          margin: '4px 8px',
                        }}
                      />
                    )
                  }
                  if (item.type === 'info') {
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '4px 12px',
                          fontSize: 11,
                          color: 'var(--te-text-muted)',
                          textAlign: 'center',
                        }}
                      >
                        {item.label}
                      </div>
                    )
                  }
                  return (
                    <div
                      key={idx}
                      className="te-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 12px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        margin: '0 4px',
                        fontSize: 12,
                      }}
                      onClick={() => item.action && handleMenuAction(item.action)}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span
                          style={{
                            color: 'var(--te-text-muted)',
                            fontSize: 11,
                            marginLeft: 24,
                          }}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Quick action icons */}
        <button
          style={menuBtnStyle}
          title="New File"
          onClick={() => handleMenuAction('new')}
        >
          <FileIcon size={14} />
        </button>
        <button
          style={menuBtnStyle}
          title="Open (use File Manager)"
          onClick={() => handleMenuAction('save')}
        >
          <FolderOpen size={14} />
        </button>
        <button style={menuBtnStyle} title="Save" onClick={() => handleMenuAction('save')}>
          <Save size={14} />
        </button>

        {/* File type badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '1px 8px',
            borderRadius: 4,
            fontSize: 11,
            background: fileTypeDef.color + '22',
            color: fileTypeDef.color,
            border: `1px solid ${fileTypeDef.color}44`,
            marginLeft: 6,
          }}
        >
          <span>{fileTypeDef.icon}</span>
          <span>{fileTypeDef.name}</span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 36,
          minHeight: 36,
          background: 'var(--te-tab-bg)',
          borderBottom: '1px solid var(--te-border)',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={tab.id === activeTabId ? 'te-tab-active' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: '100%',
              minWidth: 120,
              maxWidth: 200,
              cursor: 'pointer',
              borderBottom:
                tab.id === activeTabId
                  ? '2px solid var(--te-accent)'
                  : '2px solid transparent',
              background: tab.id === activeTabId ? 'var(--te-bg)' : 'transparent',
              color: tab.id === activeTabId ? 'var(--te-text)' : 'var(--te-text-muted)',
              fontSize: 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'relative',
            }}
            onClick={() => switchToTab(tab.id)}
          >
            {tab.isDirty && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--te-accent)',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.name}</span>
            <span
              className="te-tab-close"
              style={{
                marginLeft: 'auto',
                opacity: 0.5,
                padding: 2,
                borderRadius: 3,
                flexShrink: 0,
                fontSize: 14,
                lineHeight: 1,
              }}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>

      {/* ── Find & Replace Bar ── */}
      {showFind && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '6px 12px',
            background: 'var(--te-menubar-bg)',
            borderBottom: '1px solid var(--te-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--te-text-muted)',
                width: 44,
                textAlign: 'right',
              }}
            >
              <Search size={11} style={{ display: 'inline' }} /> Find:
            </span>
            <input
              className="te-input"
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                // Defer find to next tick to use updated value
                requestAnimationFrame(() => performFind())
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) findPrev()
                  else findNext()
                }
                if (e.key === 'Escape') setShowFind(false)
              }}
              style={{
                flex: 1,
                padding: '3px 8px',
                fontSize: 12,
                fontFamily: 'inherit',
                background: 'var(--te-input-bg)',
                border: '1px solid var(--te-border)',
                borderRadius: 4,
                color: 'var(--te-text)',
                outline: 'none',
              }}
              placeholder="Search…"
            />
            {findText && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--te-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {matchCount > 0
                  ? `${currentMatchIndex + 1}/${matchCount}`
                  : 'No results'}
              </span>
            )}
            <button className="te-btn" style={btnStyle} onClick={findPrev} disabled={matchCount === 0}>
              ↑
            </button>
            <button className="te-btn" style={btnStyle} onClick={findNext} disabled={matchCount === 0}>
              ↓
            </button>
            <button
              className="te-btn"
              style={{
                padding: '2px 6px',
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                color: 'var(--te-text-muted)',
                cursor: 'pointer',
              }}
              onClick={() => {
                setShowFind(false)
                setShowReplace(false)
              }}
            >
              ×
            </button>
          </div>

          {showReplace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--te-text-muted)',
                  width: 44,
                  textAlign: 'right',
                }}
              >
                <Replace size={11} style={{ display: 'inline' }} /> Repl:
              </span>
              <input
                className="te-input"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') replaceCurrent()
                }}
                style={{
                  flex: 1,
                  padding: '3px 8px',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: 'var(--te-input-bg)',
                  border: '1px solid var(--te-border)',
                  borderRadius: 4,
                  color: 'var(--te-text)',
                  outline: 'none',
                }}
                placeholder="Replace with…"
              />
              <button
                className="te-btn"
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  background: 'var(--te-accent)',
                  border: 'none',
                  borderRadius: 4,
                  color: 'white',
                  cursor: 'pointer',
                }}
                onClick={replaceCurrent}
              >
                Replace
              </button>
              <button className="te-btn" style={btnStyle} onClick={replaceAll}>
                All
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Go To Line ── */}
      {showGoToLine && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--te-menubar-bg)',
            borderBottom: '1px solid var(--te-border)',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--te-text-muted)' }}>Go to line:</span>
          <input
            className="te-input"
            value={goToLineNum}
            onChange={(e) => setGoToLineNum(e.target.value)}
            type="number"
            min={1}
            max={lineCount}
            onKeyDown={(e) => {
              if (e.key === 'Enter') performGoToLine()
              if (e.key === 'Escape') setShowGoToLine(false)
            }}
            style={{
              width: 80,
              padding: '3px 8px',
              fontSize: 12,
              fontFamily: 'inherit',
              background: 'var(--te-input-bg)',
              border: '1px solid var(--te-border)',
              borderRadius: 4,
              color: 'var(--te-text)',
              outline: 'none',
            }}
          />
          <button
            className="te-btn"
            style={{
              padding: '2px 12px',
              fontSize: 11,
              background: 'var(--te-accent)',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={performGoToLine}
          >
            Go
          </button>
          <span style={{ fontSize: 11, color: 'var(--te-text-muted)' }}>
            (1–{lineCount})
          </span>
        </div>
      )}

      {/* ── Editor Area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Line Numbers */}
        <div
          ref={lineNumRef}
          className="te-line-numbers"
          style={{
            width: 52,
            minWidth: 52,
            background: 'var(--te-gutter-bg)',
            borderRight: '1px solid var(--te-border)',
            overflow: 'hidden',
            paddingTop: editorLineHeight * 0.5,
            userSelect: 'none',
            textAlign: 'right',
            color: 'var(--te-line-num-color)',
            fontSize: editorFontSize,
            lineHeight: `${editorLineHeight}px`,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i + 1}
              style={{
                paddingRight: 12,
                color: i + 1 === cursorLine ? 'var(--te-accent)' : 'var(--te-line-num-color)',
                fontWeight: i + 1 === cursorLine ? 600 : 400,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="te-textarea"
          value={content}
          onChange={handleContentChange}
          onScroll={handleScroll}
          onClick={updateCursorInfo}
          onKeyUp={updateCursorInfo}
          onSelect={updateCursorInfo}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            flex: 1,
            margin: 0,
            padding: `${editorLineHeight * 0.5}px 12px`,
            overflow: 'auto',
            fontSize: editorFontSize,
            lineHeight: `${editorLineHeight}px`,
            fontFamily: 'inherit',
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            wordBreak: wordWrap ? 'break-all' : 'normal',
            background: 'var(--te-bg)',
            color: 'var(--te-text)',
            caretColor: 'var(--te-accent)',
            border: 'none',
            outline: 'none',
            resize: 'none',
          }}
          placeholder="Start typing…"
        />
      </div>

      {/* ── Status Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 22,
          minHeight: 22,
          background: 'var(--te-statusbar-bg)',
          borderTop: '1px solid var(--te-border)',
          padding: '0 8px',
          userSelect: 'none',
          fontSize: 11,
          color: 'var(--te-text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              color:
                statusMessage === 'Modified'
                  ? '#fa5252'
                  : statusMessage === 'Saved'
                  ? '#40c057'
                  : 'var(--te-text-muted)',
            }}
          >
            {statusMessage === 'Modified' ? '●' : statusMessage === 'Saved' ? '✓' : '○'}{' '}
            {statusMessage}
          </span>
          <span>
            Ln {cursorLine}, Col {cursorCol}
          </span>
          <span>{lineCount} lines</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{fileTypeDef.name}</span>
          <span>{fileTypeDef.icon}</span>
          <span>UTF-8</span>
          <span>{zoomLevel}%</span>
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={toggleWordWrap}
            title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
          >
            <WrapText size={11} />
            {wordWrap ? 'Wrap' : 'No Wrap'}
          </span>
          <span
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {themeMode === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
            {themeMode === 'dark' ? 'Dark' : 'Light'}
          </span>
        </div>
      </div>

      {/* ── About Dialog ── */}
      {showAbout && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAbout(false)
          }}
        >
          <div
            style={{
              background: 'var(--te-menu-bg)',
              border: '1px solid var(--te-border)',
              borderRadius: 12,
              padding: '28px 32px',
              minWidth: 320,
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <h2
              style={{
                margin: '0 0 4px',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--te-text)',
              }}
            >
              Text Editor
            </h2>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--te-text-muted)' }}>
              Version 2.1.0
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--te-text-muted)' }}>
              Simple & fast text editing
            </p>

            <div
              style={{
                textAlign: 'left',
                background: 'var(--te-input-bg)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <div
                style={{
                  color: 'var(--te-text-muted)',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Features
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2px 12px',
                  color: 'var(--te-text)',
                }}
              >
                <span>🔍 Find &amp; Replace</span>
                <span>📐 Line Numbers</span>
                <span>📏 Word Wrap</span>
                <span>🔎 Zoom Controls</span>
                <span>🌙 Light/Dark Theme</span>
                <span>📑 Multiple Tabs</span>
                <span>⌨️ Keyboard Shortcuts</span>
                <span>📁 File Handling</span>
              </div>
            </div>

            <button
              style={{
                padding: '6px 24px',
                background: 'var(--te-accent)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
              onClick={() => setShowAbout(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
