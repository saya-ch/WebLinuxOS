import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Terminal, Plus, X, ChevronDown, Search, Star,
  Download, Play, Pause, Settings,
  Copy, Check, Filter,
} from 'lucide-react'

interface HistoryEntry {
  id: string
  input: string
  output: string
  timestamp: number
  type: 'input' | 'output' | 'error' | 'system'
}

interface Session {
  id: string
  name: string
  cwd: string
  history: HistoryEntry[]
  commandHistory: string[]
  createdAt: number
  favoriteCommands: string[]
  isRecording: boolean
  recordingEntries: HistoryEntry[]
  filterText: string
}

interface Theme {
  id: string
  name: string
  background: string
  foreground: string
  prompt: string
  accent: string
  fontFamily: string
}

const THEMES: Theme[] = [
  { id: 'matrix', name: '矩阵绿', background: '#0a0a0a', foreground: '#00ff41', prompt: '#00ff41', accent: '#00cc33', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'dracula', name: '吸血鬼', background: '#282a36', foreground: '#f8f8f2', prompt: '#bd93f9', accent: '#ff79c6', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'solarized', name: '日光', background: '#002b36', foreground: '#839496', prompt: '#268bd2', accent: '#b58900', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'nord', name: '北欧', background: '#2e3440', foreground: '#d8dee9', prompt: '#88c0d0', accent: '#81a1c1', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'github', name: 'GitHub', background: '#0d1117', foreground: '#c9d1d9', prompt: '#58a6ff', accent: '#7ee787', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'retro', name: '复古琥珀', background: '#1a0f00', foreground: '#ffb000', prompt: '#ffb000', accent: '#ff8800', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace' },
]

const AVAILABLE_COMMANDS = [
  'help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm',
  'cp', 'mv', 'history', 'alias', 'unalias', 'date', 'whoami', 'hostname',
  'echo', 'neofetch', 'weather', 'calc', 'cowsay', 'banner', 'about', 'version',
  'time', 'timer', 'stopwatch', 'matrix', 'fortune', 'joke', 'uuid', 'password',
  'hash', 'base64', 'urlencode', 'urldecode', 'json', 'markdown', 'translate',
  'currency', 'ascii', 'emoji', 'qr', 'color', 'http-status', 'font',
  'export', 'env', 'which', 'file', 'wc', 'sort', 'grep', 'find',
  'python', 'node', 'js', 'code', 'run', 'install', 'update',
  'git', 'branch', 'commit', 'push', 'pull', 'status', 'log', 'diff',
  'docker', 'ps', 'images', 'logs', 'exec', 'build',
]

const DEFAULT_FAVORITES = ['help', 'ls -la', 'neofetch', 'clear']

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createSession(name?: string): Session {
  return {
    id: generateId(),
    name: name || `会话 ${Math.floor(Math.random() * 1000)}`,
    cwd: '/home/user',
    history: [{
      id: generateId(),
      input: '',
      output: 'WebLinuxOS Terminal Pro v2.0\n输入 "help" 查看命令列表\n💡 提示: Ctrl+Tab 切换标签页 | Ctrl+Shift+F 搜索命令',
      timestamp: Date.now(),
      type: 'system',
    }],
    commandHistory: [],
    createdAt: Date.now(),
    favoriteCommands: [...DEFAULT_FAVORITES],
    isRecording: false,
    recordingEntries: [],
    filterText: '',
  }
}

export default function TerminalPro() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('terminal-pro-sessions')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [createSession('主会话')]
  })
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || ''
  })
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('terminal-pro-theme') || 'matrix'
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('terminal-pro-font-size')) || 14
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandSearch, setCommandSearch] = useState('')
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [recordingStep, setRecordingStep] = useState(-1)

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeSessionId), [sessions, activeSessionId])
  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) || THEMES[0], [themeId])

  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const commandPaletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('terminal-pro-sessions', JSON.stringify(sessions.slice(-10)))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem('terminal-pro-theme', themeId)
  }, [themeId])

  useEffect(() => {
    localStorage.setItem('terminal-pro-font-size', String(fontSize))
  }, [fontSize])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [activeSession?.history.length, activeSession?.filterText])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(e.target as Node)) {
        setShowCommandPalette(false)
      }
    }
    if (showCommandPalette) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCommandPalette])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        switchToNextSession()
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        addSession()
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (sessions.length > 1) closeSession(activeSessionId)
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowCommandPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions, activeSessionId])

  const updateSession = useCallback((id: string, updates: Partial<Session>) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const addSession = useCallback(() => {
    const newSession = createSession()
    setSessions((prev) => [...prev, newSession])
    setActiveSessionId(newSession.id)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const closeSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === 0) {
        const newSession = createSession()
        setActiveSessionId(newSession.id)
        return [newSession]
      }
      if (id === activeSessionId) {
        const idx = prev.findIndex((s) => s.id === id)
        setActiveSessionId(next[Math.min(idx, next.length - 1)].id)
      }
      return next
    })
  }, [activeSessionId])

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const switchToNextSession = useCallback(() => {
    const idx = sessions.findIndex((s) => s.id === activeSessionId)
    const nextIdx = (idx + 1) % sessions.length
    setActiveSessionId(sessions[nextIdx].id)
  }, [sessions, activeSessionId])

  const addHistoryEntry = useCallback((sessionId: string, entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = { ...entry, id: generateId(), timestamp: Date.now() }
    setSessions((prev) => prev.map((s) => {
      if (s.id !== sessionId) return s
      const updates: Partial<Session> = {
        history: [...s.history, newEntry],
      }
      if (entry.input && !entry.input.startsWith('^')) {
        updates.commandHistory = [...s.commandHistory, entry.input]
      }
      if (s.isRecording && entry.input && !entry.input.startsWith('^')) {
        updates.recordingEntries = [...s.recordingEntries, newEntry]
      }
      return { ...s, ...updates }
    }))
  }, [])

  const executeCommand = useCallback(async (cmd: string) => {
    if (!activeSession || !cmd.trim()) return
    const trimmed = cmd.trim()
    const parts = trimmed.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    addHistoryEntry(activeSession.id, { input: cmd, output: '', type: 'input' })

    if (command === 'clear' || command === 'cls') {
      updateSession(activeSession.id, { history: [] })
      return
    }
    if (command === 'help' || command === '?') {
      const helpText = [
        '📚 Terminal Pro 帮助:',
        '',
        '基本命令:',
        '  help                    显示帮助信息',
        '  clear / cls             清空终端',
        '  history                 显示命令历史',
        '  alias [name=cmd]        管理别名',
        '  theme [主题名]           切换主题',
        '  sessions                管理会话',
        '',
        '文件操作:',
        '  ls, cd, pwd, cat, echo',
        '  mkdir, touch, rm, cp, mv',
        '',
        '实用工具:',
        '  calc <表达式>            计算器',
        '  uuid                    生成UUID',
        '  password [长度]          生成密码',
        '  hash <文本>             哈希计算',
        '  base64 <文本>            Base64编码',
        '  qr <文本>               生成二维码',
        '  color [hex]             颜色信息',
        '',
        '趣味命令:',
        '  cowsay <文本>           ASCII奶牛',
        '  fortune                 随机名言',
        '  joke                    随机笑话',
        '  matrix                  矩阵雨',
        '  neofetch                系统信息',
        '',
        '快捷键:',
        '  Ctrl+Tab               切换标签页',
        '  Ctrl+Shift+T           新建标签页',
        '  Ctrl+Shift+W           关闭标签页',
        '  Ctrl+Shift+F           命令面板',
        '  Ctrl+L                 清空终端',
        '  Ctrl+C                 中断输入',
        '  Ctrl+Up/Down           历史命令',
        '  Tab                    命令补全',
      ].join('\n')
      addHistoryEntry(activeSession.id, { input: '', output: helpText, type: 'system' })
      return
    }

    let output = ''
    let outputType: HistoryEntry['type'] = 'output'

    switch (command) {
      case 'echo':
        output = args.join(' ')
        break
      case 'date':
        output = new Date().toLocaleString('zh-CN')
        break
      case 'whoami':
        output = 'user'
        break
      case 'hostname':
        output = 'weblinux-pro'
        break
      case 'pwd':
        output = activeSession.cwd
        break
      case 'ls':
        output = formatLs(args, activeSession.cwd)
        break
      case 'cd':
        updateSession(activeSession.id, { cwd: resolvePath(activeSession.cwd, args[0] || '/home/user') })
        return
      case 'calc':
        try {
          const expr = args.join(' ')
          const sanitized = expr.replace(/[^-()\d/*+.%\s]/g, '')
          const result = eval(sanitized)
          output = `${expr} = ${result}`
        } catch {
          output = '错误: 无效的表达式'
          outputType = 'error'
        }
        break
      case 'uuid':
        output = generateUUID()
        break
      case 'password': {
        const len = parseInt(args[0]) || 16
        output = generateSecurePassword(len)
        break
      }
      case 'hash':
        output = await simpleHash(args.join(' '))
        break
      case 'base64':
        output = btoa(args.join(' '))
        break
      case 'cowsay':
        output = generateCowsay(args.join(' '))
        break
      case 'fortune':
        output = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
        break
      case 'joke':
        output = JOKES[Math.floor(Math.random() * JOKES.length)]
        break
      case 'neofetch':
        output = generateNeofetch()
        break
      case 'theme':
        if (args[0]) {
          const found = THEMES.find((t) => t.id === args[0] || t.name === args[0])
          if (found) { setThemeId(found.id); output = `✓ 主题已切换到 "${found.name}"` }
          else { output = '可用主题: ' + THEMES.map((t) => `${t.id}(${t.name})`).join(', '); outputType = 'error' }
        } else {
          output = '当前主题: ' + theme.name
        }
        break
      case 'sessions':
        output = `活跃会话: ${sessions.length}\n` + sessions.map((s, i) => `  ${i + 1}. ${s.name} [${s.history.length} 条目]${s.id === activeSessionId ? ' ← 活跃' : ''}`).join('\n')
        break
      case 'matrix':
        output = '矩阵雨动画需要渲染环境，请查看设置'
        break
      case 'history':
        output = activeSession.commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n') || '无历史命令'
        break
      case 'clear-history':
        updateSession(activeSession.id, { commandHistory: [] })
        output = '命令历史已清空'
        break
      case 'fav':
        if (args[0] === 'add') {
          const cmdToAdd = args.slice(1).join(' ')
          if (cmdToAdd) {
            updateSession(activeSession.id, { favoriteCommands: [...activeSession.favoriteCommands, cmdToAdd] })
            output = `⭐ 已收藏: ${cmdToAdd}`
          }
        } else if (args[0] === 'list') {
          output = '收藏命令:\n' + activeSession.favoriteCommands.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
        } else if (args[0] === 'rm') {
          const idx = parseInt(args[1]) - 1
          if (idx >= 0 && idx < activeSession.favoriteCommands.length) {
            const favs = [...activeSession.favoriteCommands]
            favs.splice(idx, 1)
            updateSession(activeSession.id, { favoriteCommands: favs })
            output = '已取消收藏'
          }
        }
        break
      case 'record':
        if (args[0] === 'start') {
          updateSession(activeSession.id, { isRecording: true, recordingEntries: [] })
          output = '● 录制已开始，命令将被记录'
        } else if (args[0] === 'stop') {
          updateSession(activeSession.id, { isRecording: false })
          output = `■ 录制已停止，共记录 ${activeSession.recordingEntries.length} 条`
        } else if (args[0] === 'play') {
          output = '▶ 回放功能已启动'
        }
        break
      case 'export':
        output = '会话导出功能'
        break
      case 'font':
        if (args[0]) { setFontSize(parseInt(args[0])); output = `字体大小: ${args[0]}px` }
        else output = `当前字体大小: ${fontSize}px`
        break
      case 'resize':
        if (args[0] === 'small') setFontSize(12)
        else if (args[0] === 'medium') setFontSize(14)
        else if (args[0] === 'large') setFontSize(16)
        else if (args[0] === 'xl') setFontSize(18)
        output = '字体大小已调整'
        break
      case 'about':
      case 'version':
      case 'ver':
        output = 'Terminal Pro v2.0.0\n基于 WebLinuxOS\n增强版终端模拟器'
        break
      case 'banner':
        output = BANNER
        break
      case 'git':
        output = 'git 命令需要在文件系统中执行'
        break
      default:
        output = `bash: ${command}: 未找到命令\n输入 "help" 查看所有可用命令`
        outputType = 'error'
    }

    addHistoryEntry(activeSession.id, { input: '', output, type: outputType })
  }, [activeSession, addHistoryEntry, updateSession, sessions, activeSessionId, theme.name, fontSize])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!activeSession) return

    if (e.key === 'Enter') {
      e.preventDefault()
      const input = (e.target as HTMLInputElement).value
      executeCommand(input)
      ;(e.target as HTMLInputElement).value = ''
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      const hist = activeSession.commandHistory
      if (hist.length > 0) {
        input.value = hist[hist.length - 1]
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      input.value = ''
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      const val = input.value
      const parts = val.split(/\s+/)
      const last = parts[parts.length - 1]
      const matches = AVAILABLE_COMMANDS.filter((c) => c.startsWith(last.toLowerCase()))
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0]
        input.value = parts.join(' ')
      } else if (matches.length > 1) {
        addHistoryEntry(activeSession.id, {
          input: '',
          output: matches.join('  '),
          type: 'system',
        })
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      updateSession(activeSession.id, { history: [] })
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      input.value = ''
    } else if (e.key === 'r' && e.ctrlKey) {
      e.preventDefault()
      setShowCommandPalette(true)
    }
  }, [activeSession, executeCommand, addHistoryEntry, updateSession])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text)
      setTimeout(() => setCopiedText(null), 1500)
    })
  }, [])

  const filteredHistory = useMemo(() => {
    if (!activeSession) return []
    const text = activeSession.filterText.toLowerCase()
    if (!text) return activeSession.history
    return activeSession.history.filter((h) =>
      h.input.toLowerCase().includes(text) || h.output.toLowerCase().includes(text)
    )
  }, [activeSession])

  const filteredCommands = useMemo(() => {
    if (!commandSearch) return AVAILABLE_COMMANDS.slice(0, 30)
    const search = commandSearch.toLowerCase()
    return AVAILABLE_COMMANDS.filter((c) => c.includes(search)).slice(0, 30)
  }, [commandSearch])

  const renderOutput = useCallback((text: string, type: HistoryEntry['type']) => {
    if (type === 'error') {
      return <span style={{ color: '#ff6b6b' }}>{text}</span>
    }
    if (type === 'system') {
      return <span style={{ color: theme.accent }}>{text}</span>
    }
    return <span>{text}</span>
  }, [theme.accent])

  const playRecording = useCallback(() => {
    if (!activeSession || activeSession.recordingEntries.length === 0) return
    const entries = activeSession.recordingEntries
    let i = 0
    setRecordingStep(0)
    const interval = setInterval(() => {
      if (i >= entries.length) {
        clearInterval(interval)
        setRecordingStep(-1)
        return
      }
      const entry = entries[i]
      addHistoryEntry(activeSession.id, { input: '', output: entry.output, type: entry.type })
      i++
      setRecordingStep(i)
    }, 500)
  }, [activeSession, addHistoryEntry])

  const stopRecording = useCallback(() => {
    if (activeSession) {
      updateSession(activeSession.id, { isRecording: false })
    }
  }, [activeSession, updateSession])

  const favoritesList = activeSession?.favoriteCommands || []
  const isRecording = activeSession?.isRecording || false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily, fontSize: fontSize, overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 4px', background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${theme.accent}44`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'auto' }}>
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => switchSession(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: s.id === activeSessionId ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: 12,
                borderBottom: s.id === activeSessionId ? `2px solid ${theme.accent}` : '2px solid transparent',
                whiteSpace: 'nowrap', color: s.id === activeSessionId ? theme.accent : theme.foreground,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{idx + 1}. {s.name}</span>
                <span style={{ fontSize: 9, color: '#666' }}>{s.history.length} 条</span>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeSession(s.id) }}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addSession} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: theme.foreground, cursor: 'pointer', marginLeft: 4 }}>
            <Plus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <ToolbarBtn onClick={() => setShowCommandPalette(!showCommandPalette)} active={showCommandPalette} title="命令面板 (Ctrl+Shift+F)">
            <Search size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowFavorites(!showFavorites)} active={showFavorites} title="收藏">
            <Star size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => { if (activeSession) { updateSession(activeSession.id, { filterText: activeSession.filterText ? '' : 'a' }); } }} active={!!activeSession?.filterText} title="过滤">
            <Filter size={14} />
          </ToolbarBtn>
          {isRecording ? (
            <ToolbarBtn onClick={stopRecording} active title="停止录制">
              <Pause size={14} color="#ff6b6b" />
            </ToolbarBtn>
          ) : (
            <ToolbarBtn onClick={() => { if (activeSession) updateSession(activeSession.id, { isRecording: true }) }} title="开始录制">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b' }} />
            </ToolbarBtn>
          )}
          {activeSession && activeSession.recordingEntries.length > 0 && (
            <ToolbarBtn onClick={playRecording} title="回放录制" active={recordingStep >= 0}>
              <Play size={14} />
            </ToolbarBtn>
          )}
          <ToolbarBtn onClick={() => setShowSettings(!showSettings)} active={showSettings} title="设置">
            <Settings size={14} />
          </ToolbarBtn>
        </div>
      </div>

      {showSettings && (
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${theme.accent}44`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#999' }}>主题:</span>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  title={t.name}
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: t.background, border: t.id === themeId ? `2px solid ${t.accent}` : '2px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', padding: 0, position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: t.accent }} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#999' }}>字号:</span>
              {[12, 14, 16, 18].map((s) => (
                <button key={s} onClick={() => setFontSize(s)} style={{
                  padding: '2px 8px', background: fontSize === s ? theme.accent : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 4, color: fontSize === s ? theme.background : theme.foreground,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>{s}px</button>
              ))}
            </div>
            <button onClick={() => { if (activeSession) { const data = JSON.stringify(activeSession.history, null, 2); navigator.clipboard.writeText(data) } }} style={{ ...exportBtnStyle, color: theme.accent }}>
              <Download size={12} /> 导出会话
            </button>
          </div>
        </div>
      )}

      {showCommandPalette && (
        <div ref={commandPaletteRef} style={{
          position: 'absolute', top: 50, right: 10, width: 340, maxHeight: 400,
          background: theme.background, border: `1px solid ${theme.accent}66`, borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 10000, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <input
              type="text"
              placeholder="搜索命令..."
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                color: theme.foreground, fontSize: 13, outline: 'none',
              }}
            />
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {filteredCommands.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>未找到匹配的命令</div>
            ) : (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => { if (activeSession) { const input = inputRef.current; if (input) { input.value = cmd; input.focus() } }; setShowCommandPalette(false); setCommandSearch('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px',
                    background: 'transparent', border: 'none', color: theme.foreground,
                    cursor: 'pointer', fontSize: 13, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Terminal size={14} style={{ color: theme.accent }} />
                  <span>{cmd}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {showFavorites && (
        <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid ${theme.accent}44`, flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} style={{ color: '#ffd700' }} /> 收藏:</span>
          {favoritesList.length === 0 ? (
            <span style={{ fontSize: 12, color: '#666' }}>暂无收藏</span>
          ) : (
            favoritesList.map((cmd, i) => (
              <button
                key={i}
                onClick={() => { if (inputRef.current) { inputRef.current.value = cmd; inputRef.current.focus() } }}
                style={{
                  padding: '4px 10px', background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6,
                  color: '#ffd700', cursor: 'pointer', fontSize: 12, fontFamily: theme.fontFamily,
                }}
              >
                {cmd}
              </button>
            ))
          )}
        </div>
      )}

      {activeSession?.filterText && (
        <div style={{ padding: '8px 12px', background: 'rgba(255,107,107,0.15)', borderBottom: '1px solid rgba(255,107,107,0.3)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>🔍 过滤模式: "{activeSession.filterText}" - 显示 {filteredHistory.length} / {activeSession.history.length} 条</span>
          <button onClick={() => updateSession(activeSession.id, { filterText: '' })} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div
        ref={outputRef}
        style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', scrollbarWidth: 'thin', scrollbarColor: `${theme.accent}44 transparent`, lineHeight: 1.6 }}
        onClick={() => inputRef.current?.focus()}
      >
        {filteredHistory.map((entry) => (
          <div key={entry.id} style={{ marginBottom: 2 }}>
            {entry.input && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ color: theme.prompt, whiteSpace: 'nowrap', flexShrink: 0 }}>user@weblinux-pro:{activeSession?.cwd}$ </span>
                <span style={{ color: theme.foreground }}>{entry.input}</span>
              </div>
            )}
            {entry.output && (
              <div style={{ paddingLeft: entry.input ? 0 : 0 }}>
                {renderOutput(entry.output, entry.type)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 18px 10px', borderTop: `1px solid ${theme.accent}44`, flexShrink: 0 }}>
        <span style={{ color: theme.prompt, whiteSpace: 'nowrap' }}>user@weblinux-pro:{activeSession?.cwd}$ </span>
        <input
          ref={inputRef}
          type="text"
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            if (e.key === 'r' && e.ctrlKey) {
              e.preventDefault()
              setShowCommandPalette(true)
            }
          }}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.foreground, fontFamily: theme.fontFamily, fontSize: fontSize,
            caretColor: theme.accent,
          }}
          spellCheck={false}
          placeholder={isRecording ? '● 正在录制...' : '输入命令 (Ctrl+Shift+F 打开命令面板)'}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
          <button onClick={() => {
            if (activeSession && activeSession.commandHistory.length > 0) {
              const last = activeSession.commandHistory[activeSession.commandHistory.length - 1]
              if (inputRef.current) inputRef.current.value = last
            }
          }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }} title="上一条命令">
            <ChevronDown size={14} />
          </button>
          <button onClick={() => {
            if (activeSession) {
              const text = activeSession.history.map((h) => `${h.input ? `$ ${h.input}` : ''}${h.output ? `\n${h.output}` : ''}`).join('\n\n')
              copyToClipboard(text)
            }
          }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }} title="复制全部输出">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {copiedText && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', background: theme.accent, color: theme.background, borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 10000, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={14} /> 已复制
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active?: boolean; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28,
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: '1px solid transparent',
        borderRadius: 6, color: 'inherit', cursor: 'pointer', padding: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = active ? 'rgba(255,255,255,0.15)' : 'transparent')}
    >
      {children}
    </button>
  )
}

const exportBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6, color: 'inherit', cursor: 'pointer', fontSize: 11,
}

const BANNER = `
  _________________  ______   _______  ___          
 |_   _|_   _|  ___||_   _| |  ___| |_  |         
   | |   | | | |     | |   | |___   | | |         
   | |   | | | |     | |   |  ___|  | | |         
   | |   | | | |___  | |   | |      | | |         
   |_|   |_| |_____| |_|   |_|      |_|_|         
  __  __    ______   ______  ______  _  _  ______  
 |  \\/  |  |  _  \\ |  ___|/  ____|| || |/  ___| 
 | \\  / |  | |_) ||| |   | | |     | || |\\___ \\ 
 | |\\/| |  |  _  / | |   | | |     | || | ___) | 
 | |  | |  | | \\ \\ | |   | | |____ | || ||___/  
 |_|  |_|  |_|  \\_\\|_|   |_|_____||_||_||_____/  
`

const FORTUNES = [
  '代码如诗，简洁为美。',
  '每一行代码都是通往知识的阶梯。',
  '真正的工程师从不过度设计。',
  '先让它能跑，再让它跑得快，最后让它跑得优雅。',
  '最好的文档是代码本身，但别忘了注释。',
  '调试是消除bug的过程，编程是引入bug的过程。',
  '简洁是可靠的前提。',
  '测试不是可选的，它是必须的。',
  '在代码中，诚实是最好的策略。',
  '键盘比鼠标快，命令比点击强。',
]

const JOKES = [
  '为什么程序员喜欢暗色主题？因为bug都怕光。',
  '程序员的三大谎言：这很简单、马上就好、不会有bug。',
  '世界上只有10种人：懂二进制的和不懂二进制的。',
  '程序员最怕的事：需求变更。',
  'const 从来不是const，let 永远不let。',
  '程序员的日常：git add, git commit, git push, 祈祷。',
  '如果调试是消除bug的过程，那么编程就是引入bug的过程。',
  '产品经理说：这个功能很简单，只要...',
]

function resolvePath(cwd: string, path: string): string {
  if (path.startsWith('/')) return path
  if (path.startsWith('~')) return '/home/user' + path.slice(1)
  const parts = cwd.split('/').filter(Boolean)
  const relParts = path.split('/')
  for (const p of relParts) {
    if (p === '..') parts.pop()
    else if (p !== '.') parts.push(p)
  }
  return '/' + parts.join('/')
}

function formatLs(args: string[], cwd: string): string {
  const isDetailed = args.includes('-l')
  const isAll = args.includes('-a')
  const files = getVirtualFiles(cwd, isAll)
  if (files.length === 0) return ''
  if (isDetailed) {
    return files.map((f) => {
      const permissions = f.isDir ? 'drwxr-xr-x' : '-rw-r--r--'
      const size = f.size || 0
      const time = new Date().toLocaleDateString('en-GB')
      return `${permissions}  user  user  ${String(size).padStart(6)} ${time} ${f.name}${f.isDir ? '/' : ''}`
    }).join('\n')
  }
  return files.map((f) => f.isDir ? `\u001b[34m${f.name}/\u001b[0m` : f.name).join('  ')
}

function getVirtualFiles(path: string, showHidden: boolean): { name: string; isDir: boolean; size: number }[] {
  const fs: Record<string, { name: string; isDir: boolean; size: number }[]> = {
    '/home/user': [
      { name: 'Documents', isDir: true, size: 0 },
      { name: 'Downloads', isDir: true, size: 0 },
      { name: 'Pictures', isDir: true, size: 0 },
      { name: '.bashrc', isDir: false, size: 3500 },
      { name: '.profile', isDir: false, size: 807 },
      { name: 'readme.txt', isDir: false, size: 1024 },
      { name: '.secret', isDir: false, size: 256 },
    ],
    '/home/user/Documents': [
      { name: 'report.pdf', isDir: false, size: 204800 },
      { name: 'notes.md', isDir: false, size: 4096 },
      { name: 'project', isDir: true, size: 0 },
    ],
    '/home/user/Downloads': [
      { name: 'installer.deb', isDir: false, size: 1048576 },
    ],
    '/home/user/Pictures': [
      { name: 'wallpaper.jpg', isDir: false, size: 3145728 },
      { name: 'avatar.png', isDir: false, size: 512000 },
    ],
    '/home/user/Documents/project': [
      { name: 'index.html', isDir: false, size: 8192 },
      { name: 'style.css', isDir: false, size: 4096 },
      { name: 'app.js', isDir: false, size: 16384 },
    ],
  }
  const list = fs[path] || []
  return showHidden ? list : list.filter((f) => !f.name.startsWith('.'))
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateSecurePassword(length: number): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const nums = '0123456789'
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all = upper + lower + nums + syms
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += all[arr[i] % all.length]
  }
  return result
}

async function simpleHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const arr = Array.from(new Uint8Array(hash))
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return '哈希计算失败'
  }
}

function generateCowsay(text: string): string {
  const maxLen = Math.max(text.length, 10)
  const border = '─'.repeat(maxLen + 2)
  const lines: string[] = []
  lines.push(` ${border} `)
  lines.push(`< ${text} >`)
  lines.push(` ${border} `)
  lines.push('        \\   ^__^')
  lines.push('         \\  (oo)\\_______')
  lines.push('            (__)\\       )\\/\\')
  lines.push('                ||----w |')
  lines.push('                ||     ||')
  return lines.join('\n')
}

function generateNeofetch(): string {
  return [
    '       .--.           user@weblinux-pro',
    '      |o_o |          -----------------',
    '      |:_/ |          OS: WebLinuxOS 2.0 Pro',
    '     //   \\ \\         Host: WebLinuxOS Container',
    '    (|     | )        Kernel: 6.1.0-weblinux',
    '   /\'\\_   _/`\\        Uptime: ' + Math.floor(Math.random() * 7200) + ' seconds',
    '   \\___)=(___/        Shell: bash 5.1.16',
    '                      Theme: Terminal Pro',
    '                      CPU: Virtual CPU @ 3.2GHz',
    '                      Memory: ' + Math.floor(Math.random() * 4096 + 1024) + 'MB / 8192MB',
  ].join('\n')
}