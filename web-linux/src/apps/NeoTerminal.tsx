import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import { getCommand, getSuggestions } from './terminal'
import type { CommandContext } from './terminal/commands'
import {
  Terminal, Plus, X, Search,
  Bookmark, BookmarkCheck, Sparkles, Lightbulb, Copy,
  Check, Moon, Sun, Zap, Palette, FileText, Clock,
  Trash2, Play, ChevronRight
} from 'lucide-react'

type ThemeType = 'dark' | 'light' | 'cyberpunk' | 'matrix'

interface HistoryEntry {
  id: string
  input: string
  output: string
  isError?: boolean
  isAI?: boolean
  timestamp: number
}

interface TabState {
  id: string
  title: string
  cwd: string
  prevCwd: string | null
  history: HistoryEntry[]
  cmdHistory: string[]
}

interface BookmarkItem {
  id: string
  command: string
  description: string
  createdAt: number
}

interface SnippetItem {
  id: string
  name: string
  command: string
  category: string
}

const THEME_CONFIGS: Record<ThemeType, {
  bg: string
  text: string
  accent: string
  secondary: string
  border: string
  prompt: string
  error: string
  success: string
  tabBg: string
  tabActive: string
  inputBg: string
  glow: string
}> = {
  dark: {
    bg: 'rgba(15, 15, 20, 0.85)',
    text: '#e0e0e0',
    accent: '#7c6cf0',
    secondary: '#888',
    border: 'rgba(255,255,255,0.1)',
    prompt: '#7c6cf0',
    error: '#f44747',
    success: '#6a9955',
    tabBg: 'rgba(255,255,255,0.03)',
    tabActive: 'rgba(124, 108, 240, 0.2)',
    inputBg: 'rgba(255,255,255,0.03)',
    glow: 'rgba(124, 108, 240, 0.3)',
  },
  light: {
    bg: 'rgba(250, 250, 252, 0.9)',
    text: '#1a1a2e',
    accent: '#6366f1',
    secondary: '#6b7280',
    border: 'rgba(0,0,0,0.1)',
    prompt: '#6366f1',
    error: '#dc2626',
    success: '#16a34a',
    tabBg: 'rgba(0,0,0,0.02)',
    tabActive: 'rgba(99, 102, 241, 0.1)',
    inputBg: 'rgba(0,0,0,0.02)',
    glow: 'rgba(99, 102, 241, 0.2)',
  },
  cyberpunk: {
    bg: 'rgba(10, 5, 30, 0.9)',
    text: '#00ffff',
    accent: '#ff00ff',
    secondary: '#ff6600',
    border: 'rgba(255,0,255,0.3)',
    prompt: '#00ff00',
    error: '#ff0066',
    success: '#00ff99',
    tabBg: 'rgba(255,0,255,0.1)',
    tabActive: 'rgba(0,255,255,0.2)',
    inputBg: 'rgba(0,255,255,0.05)',
    glow: 'rgba(255,0,255,0.5)',
  },
  matrix: {
    bg: 'rgba(0, 5, 0, 0.95)',
    text: '#00ff00',
    accent: '#00cc00',
    secondary: '#006600',
    border: 'rgba(0,255,0,0.2)',
    prompt: '#00ff00',
    error: '#ff3300',
    success: '#66ff00',
    tabBg: 'rgba(0,255,0,0.05)',
    tabActive: 'rgba(0,255,0,0.15)',
    inputBg: 'rgba(0,255,0,0.03)',
    glow: 'rgba(0,255,0,0.4)',
  },
}

const NL_TO_COMMAND: Array<{ pattern: RegExp; command: string | ((m: RegExpMatchArray) => string); explanation: string }> = [
  { pattern: /find all (.*) files/i, command: (m) => `find . -name "*.${m[1]}"`, explanation: '查找所有指定扩展名的文件' },
  { pattern: /find (.*) files/i, command: (m) => `find . -name "*${m[1]}*"`, explanation: '查找包含关键词的文件' },
  { pattern: /search for (.*) in files/i, command: (m) => `grep -r "${m[1]}" .`, explanation: '在文件中递归搜索文本' },
  { pattern: /list files/i, command: () => 'ls -la', explanation: '列出所有文件（含隐藏文件）' },
  { pattern: /show current directory/i, command: () => 'pwd', explanation: '显示当前工作目录' },
  { pattern: /go to (.*)/i, command: (m) => `cd ${m[1]}`, explanation: '切换到指定目录' },
  { pattern: /create (file|directory|folder) (.*)/i, command: (m) => m[1] === 'file' ? `touch ${m[2]}` : `mkdir ${m[2]}`, explanation: '创建文件或目录' },
  { pattern: /delete (file|folder|directory) (.*)/i, command: (m) => m[1] === 'file' ? `rm ${m[2]}` : `rm -rf ${m[2]}`, explanation: '删除文件或目录' },
  { pattern: /copy (.*) to (.*)/i, command: (m) => `cp ${m[1]} ${m[2]}`, explanation: '复制文件' },
  { pattern: /move (.*) to (.*)/i, command: (m) => `mv ${m[1]} ${m[2]}`, explanation: '移动文件' },
  { pattern: /view (file|content of) (.*)/i, command: (m) => `cat ${m[2]}`, explanation: '查看文件内容' },
  { pattern: /disk usage|space used/i, command: () => 'du -sh .', explanation: '显示当前目录磁盘使用情况' },
  { pattern: /system info|system information/i, command: () => 'neofetch', explanation: '显示系统信息' },
  { pattern: /network info|ip address/i, command: () => 'ifconfig', explanation: '显示网络配置信息' },
  { pattern: /ping (.*)/i, command: (m) => `ping ${m[1]}`, explanation: '测试网络连通性' },
  { pattern: /what(?:'s| is) my ip/i, command: () => 'curl ifconfig.me', explanation: '获取公网IP地址' },
  { pattern: /today'?s date|what date is it/i, command: () => 'date', explanation: '显示当前日期时间' },
  { pattern: /clear (screen|terminal)/i, command: () => 'clear', explanation: '清空终端屏幕' },
  { pattern: /help|what can you do/i, command: () => 'help', explanation: '显示帮助信息' },
]

const COMMAND_EXPLANATIONS: Record<string, string> = {
  ls: '列出目录内容。常用选项：-l 详细列表，-a 显示隐藏文件，-h 人类可读大小，-t 按时间排序',
  cd: '切换当前工作目录。cd .. 返回上级，cd ~ 返回家目录，cd - 返回上次目录',
  pwd: '显示当前工作目录的完整路径',
  mkdir: '创建新目录。mkdir -p 可递归创建多级目录',
  rm: '删除文件或目录。rm -r 递归删除目录，rm -f 强制删除',
  cp: '复制文件或目录。cp -r 递归复制目录',
  mv: '移动或重命名文件/目录',
  touch: '创建空文件或更新文件时间戳',
  cat: '连接并显示文件内容',
  grep: '在文件中搜索匹配的行。-r 递归搜索，-i 忽略大小写，-n 显示行号',
  find: '在目录树中搜索文件。-name 按名称搜索，-type 按类型搜索',
  echo: '输出文本到终端',
  clear: '清空终端屏幕',
  history: '显示命令历史记录',
  whoami: '显示当前用户名',
  hostname: '显示主机名',
  neofetch: '显示系统信息和发行版Logo',
  ping: '向目标主机发送ICMP回显请求，测试网络连通性',
  curl: '传输数据，支持多种协议。常用于获取网页内容或调用API',
  ifconfig: '显示和配置网络接口信息',
  du: '估算文件空间使用量。-h 人类可读格式，-s 仅显示总计',
  df: '显示文件系统磁盘空间使用情况',
  ps: '显示当前进程状态。ps aux 显示所有进程详细信息',
  kill: '终止进程。kill -9 强制终止',
  chmod: '修改文件权限',
  chown: '修改文件所有者',
  tail: '显示文件末尾内容。-f 实时跟踪文件变化',
  head: '显示文件开头内容',
  wc: '统计文件行数、单词数和字符数',
  sort: '对文本行进行排序',
  uniq: '删除重复的行',
  base64: 'Base64编码/解码',
  date: '显示或设置系统日期和时间',
  cal: '显示日历',
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function naturalLanguageToCommand(input: string): { command: string; explanation: string } | null {
  for (const item of NL_TO_COMMAND) {
    const match = input.match(item.pattern)
    if (match) {
      const cmd = typeof item.command === 'function' ? item.command(match) : item.command
      return { command: cmd, explanation: item.explanation }
    }
  }
  return null
}

function explainCommand(input: string): string {
  const parts = input.replace(/^explain:\s*/i, '').trim().split(/\s+/)
  const cmdName = parts[0]?.toLowerCase()
  const args = parts.slice(1).join(' ')
  
  const baseExplanation = COMMAND_EXPLANATIONS[cmdName]
  if (!baseExplanation) {
    return `命令 "${cmdName}" 暂无详细解释。\n请尝试: help ${cmdName} 查看官方帮助信息。`
  }
  
  let result = `命令: ${cmdName}\n${'='.repeat(cmdName.length + 4)}\n\n${baseExplanation}`
  
  if (args) {
    result += `\n\n参数分析: ${args}\n`
    if (args.includes('-r')) result += '  - -r: 递归操作\n'
    if (args.includes('-f')) result += '  - -f: 强制操作\n'
    if (args.includes('-l')) result += '  - -l: 详细列表格式\n'
    if (args.includes('-a')) result += '  - -a: 显示所有（含隐藏）\n'
    if (args.includes('-h')) result += '  - -h: 人类可读格式\n'
  }
  
  return result
}

function getErrorSuggestion(errorOutput: string): string[] {
  const suggestions: string[] = []
  
  if (errorOutput.includes('command not found') || errorOutput.includes('未找到命令')) {
    suggestions.push('检查命令拼写是否正确')
    suggestions.push('尝试输入 "help" 查看所有可用命令')
    suggestions.push('可能需要先安装相应的软件包')
  }
  
  if (errorOutput.includes('No such file or directory') || errorOutput.includes('没有那个文件')) {
    suggestions.push('检查文件/目录路径是否正确')
    suggestions.push('使用 "ls" 查看当前目录内容')
    suggestions.push('尝试使用绝对路径')
  }
  
  if (errorOutput.includes('Permission denied') || errorOutput.includes('权限')) {
    suggestions.push('检查文件/目录权限')
    suggestions.push('使用 "chmod" 修改权限')
  }
  
  if (errorOutput.includes('Is a directory')) {
    suggestions.push('目标是一个目录，请添加 -r 选项递归操作')
  }
  
  if (errorOutput.includes('Not a directory')) {
    suggestions.push('路径中某部分不是目录，请检查路径')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('检查命令参数是否正确')
    suggestions.push('尝试输入 "help" 查看命令列表')
  }
  
  return suggestions
}

const syntaxHighlight = (text: string, theme: ThemeType): React.ReactNode[] => {
  const lines = text.split('\n')
  const config = THEME_CONFIGS[theme]
  
  return lines.map((line, lineIdx) => {
    const patterns: Array<{ regex: RegExp; color: string }> = [
      { regex: /^(\S+@\S+:\S+[#$] )/, color: config.prompt },
      { regex: /(\/[^\s]+)/g, color: config.accent },
      { regex: /("[^"]*")/g, color: config.success },
      { regex: /(\d+)/g, color: config.secondary },
      { regex: /(-{1,2}[a-zA-Z]+)/g, color: config.accent },
    ]
    
    const matches: Array<{ start: number; end: number; color: string; text: string }> = []
    for (const p of patterns) {
      let m
      const regex = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g')
      while ((m = regex.exec(line)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, color: p.color, text: m[0] })
      }
    }
    
    matches.sort((a, b) => a.start - b.start)
    
    let current = 0
    const result: React.ReactNode[] = []
    
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].start >= current) {
        if (matches[i].start > current) {
          result.push(line.substring(current, matches[i].start))
        }
        result.push(
          <span key={`${lineIdx}-${i}`} style={{ color: matches[i].color }}>
            {matches[i].text}
          </span>
        )
        current = matches[i].end
      }
    }
    
    if (current < line.length) {
      result.push(line.substring(current))
    }
    
    return (
      <div key={lineIdx}>
        {result.length > 0 ? result : line}
      </div>
    )
  })
}

export default function NeoTerminal() {
  const files = useStore((s) => s.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const copyFile = useStore((s) => s.copyFile)
  const moveFile = useStore((s) => s.moveFile)
  const renameFile = useStore((s) => s.renameFile)
  const updateFileContent = useStore((s) => s.updateFileContent)

  const [theme, setTheme] = useState<ThemeType>('dark')
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [tabs, setTabs] = useState<TabState[]>([])
  const [input, setInput] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'bookmarks' | 'snippets' | 'search' | 'history'>('bookmarks')
  const [searchQuery, setSearchQuery] = useState('')
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showAIHelper, setShowAIHelper] = useState(true)
  
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('neoterm-bookmarks')
    return saved ? JSON.parse(saved) : []
  })
  
  const [snippets, _setSnippets] = useState<SnippetItem[]>(() => {
    const saved = localStorage.getItem('neoterm-snippets')
    return saved ? JSON.parse(saved) : [
      { id: '1', name: '查找大文件', command: 'find . -type f -size +100M', category: '文件' },
      { id: '2', name: '统计代码行数', command: 'find . -name "*.ts" -o -name "*.tsx" | xargs wc -l', category: '开发' },
      { id: '3', name: '压缩目录', command: 'tar -czf backup.tar.gz ./', category: '文件' },
      { id: '4', name: '查看端口占用', command: 'netstat -tulpn', category: '网络' },
    ]
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  
  const config = THEME_CONFIGS[theme]

  useEffect(() => {
    if (tabs.length === 0) {
      const initialTab: TabState = {
        id: generateId(),
        title: '终端 1',
        cwd: '/home/user',
        prevCwd: null,
        history: [
          {
            id: generateId(),
            input: '',
            output: '╔══════════════════════════════════════════════════════╗\n║          NeoTerminal 增强终端 v1.0                   ║\n║      AI 增强 · 多标签页 · 主题切换                    ║\n╠══════════════════════════════════════════════════════╣\n║  输入 "help" 查看所有命令                             ║\n║  输入自然语言自动生成命令 (如: find all txt files)    ║\n║  输入 "explain: 命令" 解释命令含义                    ║\n║  Ctrl+T 新建标签页 | Ctrl+W 关闭当前标签页            ║\n╚══════════════════════════════════════════════════════╝',
            timestamp: Date.now(),
          },
        ],
        cmdHistory: [],
      }
      setTabs([initialTab])
      setActiveTabId(initialTab.id)
    }
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [tabs, activeTabId])

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus()
    setTimeout(focusInput, 100)
  }, [activeTabId, tabs.length])

  useEffect(() => {
    localStorage.setItem('neoterm-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  useEffect(() => {
    localStorage.setItem('neoterm-snippets', JSON.stringify(snippets))
  }, [snippets])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeTab = tabs.find(t => t.id === activeTabId)

  const addTab = useCallback(() => {
    const newTab: TabState = {
      id: generateId(),
      title: `终端 ${tabs.length + 1}`,
      cwd: '/home/user',
      prevCwd: null,
      history: [
        {
          id: generateId(),
          input: '',
          output: '欢迎使用 NeoTerminal 新标签页\n输入 "help" 查看可用命令',
          timestamp: Date.now(),
        },
      ],
      cmdHistory: [],
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [tabs.length])

  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (tabs.length <= 1) return
    
    const idx = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    
    if (tabId === activeTabId) {
      const newIdx = Math.min(idx, newTabs.length - 1)
      setActiveTabId(newTabs[newIdx].id)
    }
  }, [tabs, activeTabId])

  const updateTab = useCallback((tabId: string, updates: Partial<TabState>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t))
  }, [])

  const executeCommand = useCallback(async (cmd: string, tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    let trimmed = cmd.trim()
    if (!trimmed) return

    setIsTyping(true)
    setAiSuggestion(null)

    if (trimmed.toLowerCase().startsWith('explain:')) {
      const explanation = explainCommand(trimmed)
      const entry: HistoryEntry = {
        id: generateId(),
        input: trimmed,
        output: explanation,
        isAI: true,
        timestamp: Date.now(),
      }
      updateTab(tabId, {
        history: [...tab.history, entry],
        cmdHistory: [...tab.cmdHistory, trimmed],
      })
      setIsTyping(false)
      setHistoryIndex(-1)
      return
    }

    const nlResult = naturalLanguageToCommand(trimmed)
    if (nlResult && !getCommand(trimmed.split(' ')[0])) {
      const aiEntry: HistoryEntry = {
        id: generateId(),
        input: trimmed,
        output: `[AI 识别] 检测到自然语言输入\n  意图: ${nlResult.explanation}\n  生成命令: ${nlResult.command}\n\n正在执行...`,
        isAI: true,
        timestamp: Date.now(),
      }
      updateTab(tabId, {
        history: [...tab.history, aiEntry],
        cmdHistory: [...tab.cmdHistory, trimmed],
      })
      trimmed = nlResult.command
    }

    const parts = trimmed.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    if (command === 'clear' || command === 'cls') {
      updateTab(tabId, { history: [], cmdHistory: [...tab.cmdHistory, trimmed] })
      setIsTyping(false)
      setHistoryIndex(-1)
      return
    }

    const cmdDef = getCommand(command)
    let output: string
    let isError = false
    let newCwd = tab.cwd
    let newPrevCwd = tab.prevCwd

    if (cmdDef) {
      try {
        const ctx: CommandContext = {
          cwd: tab.cwd,
          files,
          username: 'user',
          hostname: 'web-linux',
          theme: theme === 'light' ? 'light' : 'dark',
          args,
          prevCwd: tab.prevCwd,
          addFile,
          deleteFile,
          updateFileContent,
          renameFile,
          copyFile,
          moveFile,
        }
        const result = await cmdDef.handler(ctx)
        output = result.output
        if (result.cwd !== undefined) {
          newPrevCwd = tab.cwd
          newCwd = result.cwd
        }
        if (result.prevCwd !== undefined) {
          newPrevCwd = result.prevCwd
        }
      } catch (err) {
        output = `${command}: 执行出错: ${err instanceof Error ? err.message : String(err)}`
        isError = true
      }
    } else {
      output = `${command}: 命令未找到\n输入 "help" 查看可用命令列表`
      isError = true
    }

    const entry: HistoryEntry = {
      id: generateId(),
      input: trimmed,
      output,
      isError,
      timestamp: Date.now(),
    }

    if (isError) {
      const suggestions = getErrorSuggestion(output)
      const suggestionEntry: HistoryEntry = {
        id: generateId(),
        input: '',
        output: `\n[AI 建议] 可能的解决方案:\n${suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
        isAI: true,
        timestamp: Date.now(),
      }
      updateTab(tabId, {
        history: [...tab.history, entry, suggestionEntry],
        cmdHistory: [...tab.cmdHistory, cmd],
        cwd: newCwd,
        prevCwd: newPrevCwd,
      })
    } else {
      updateTab(tabId, {
        history: [...tab.history, entry],
        cmdHistory: [...tab.cmdHistory, cmd],
        cwd: newCwd,
        prevCwd: newPrevCwd,
      })
    }

    setIsTyping(false)
    setHistoryIndex(-1)
  }, [tabs, files, theme, addFile, deleteFile, updateFileContent, renameFile, copyFile, moveFile, updateTab])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const tab = activeTab
    if (!tab) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        executeCommand(input, activeTabId)
        setInput('')
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (tab.cmdHistory.length > 0) {
        const newIndex = historyIndex < tab.cmdHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        if (newIndex >= 0 && newIndex < tab.cmdHistory.length) {
          setInput(tab.cmdHistory[tab.cmdHistory.length - 1 - newIndex])
        }
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(tab.cmdHistory[tab.cmdHistory.length - 1 - newIndex])
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const completions = getSuggestions(input, tab.cwd, files)
      if (completions.length === 1) {
        const parts = input.split(' ')
        parts[parts.length - 1] = completions[0]
        setInput(parts.join(' '))
      } else if (completions.length > 1) {
        const entry: HistoryEntry = {
          id: generateId(),
          input: input,
          output: completions.join('  '),
          timestamp: Date.now(),
        }
        updateTab(activeTabId, { history: [...tab.history, entry] })
      }
      return
    }

    if (e.ctrlKey && e.key === 't') {
      e.preventDefault()
      addTab()
      return
    }

    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault()
      closeTab(activeTabId)
      return
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      updateTab(activeTabId, { history: [] })
      return
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setHistoryIndex(-1)

    if (value.trim().length > 2 && !getCommand(value.trim().split(' ')[0])) {
      const nlResult = naturalLanguageToCommand(value.trim())
      if (nlResult) {
        setAiSuggestion(nlResult.command)
      } else {
        setAiSuggestion(null)
      }
    } else {
      setAiSuggestion(null)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const toggleBookmark = (command: string) => {
    const existing = bookmarks.find(b => b.command === command)
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.id !== existing.id))
    } else {
      setBookmarks(prev => [{
        id: generateId(),
        command,
        description: command.split(' ')[0],
        createdAt: Date.now(),
      }, ...prev])
    }
  }

  const isBookmarked = (command: string) => {
    return bookmarks.some(b => b.command === command)
  }

  const runBookmark = (command: string) => {
    setInput(command)
    setShowSidebar(false)
    inputRef.current?.focus()
  }

  const filteredHistory = useMemo(() => {
    if (!activeTab) return []
    if (!searchQuery) return activeTab.history
    return activeTab.history.filter(h => 
      h.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.output.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeTab, searchQuery])

  const smartSuggestions = useMemo(() => {
    if (!activeTab || activeTab.cmdHistory.length === 0) return []
    const recent = [...activeTab.cmdHistory].reverse().slice(0, 20)
    const freq: Record<string, number> = {}
    recent.forEach(cmd => {
      const base = cmd.split(' ')[0]
      freq[base] = (freq[base] || 0) + 1
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd]) => cmd)
  }, [activeTab])

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        background: config.bg,
        backdropFilter: 'blur(20px)',
        color: config.text,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
        fontSize: '13px',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        className="flex items-center px-2 py-1.5 border-b shrink-0"
        style={{ borderColor: config.border, background: config.tabBg }}
      >
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer whitespace-nowrap transition-all duration-200 ${
                tab.id === activeTabId ? '' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                background: tab.id === activeTabId ? config.tabActive : 'transparent',
                minWidth: '100px',
              }}
              onClick={() => setActiveTabId(tab.id)}
            >
              <Terminal size={12} style={{ color: config.accent }} />
              <span className="text-xs truncate max-w-24">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  className="ml-1 p-0.5 rounded hover:opacity-80 transition-opacity"
                  onClick={(e) => closeTab(tab.id, e)}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            className="p-1.5 rounded-md hover:opacity-80 transition-all ml-1"
            onClick={addTab}
            style={{ color: config.accent }}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1" ref={themeMenuRef}>
          <button
            className="p-1.5 rounded-md hover:opacity-80 transition-all"
            onClick={() => setShowSidebar(!showSidebar)}
            style={{ color: config.accent }}
            title="侧边栏"
          >
            <Bookmark size={14} />
          </button>
          <div className="relative">
            <button
              className="p-1.5 rounded-md hover:opacity-80 transition-all"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              style={{ color: config.accent }}
              title="主题"
            >
              <Palette size={14} />
            </button>
            {showThemeMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-xl z-50 min-w-32"
                style={{
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                {(['dark', 'light', 'cyberpunk', 'matrix'] as ThemeType[]).map((t) => (
                  <button
                    key={t}
                    className="w-full px-3 py-1.5 text-left text-sm hover:opacity-80 transition-opacity flex items-center gap-2"
                    style={{ background: theme === t ? config.tabActive : 'transparent' }}
                    onClick={() => { setTheme(t); setShowThemeMenu(false) }}
                  >
                    {t === 'dark' && <Moon size={13} />}
                    {t === 'light' && <Sun size={13} />}
                    {t === 'cyberpunk' && <Zap size={13} />}
                    {t === 'matrix' && <Terminal size={13} />}
                    <span>
                      {t === 'dark' && '深色'}
                      {t === 'light' && '浅色'}
                      {t === 'cyberpunk' && '赛博朋克'}
                      {t === 'matrix' && '矩阵'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto px-4 py-3"
            style={{ scrollbarWidth: 'thin' }}
          >
            {(searchQuery ? filteredHistory : activeTab?.history || []).map((entry) => (
              <div key={entry.id} className="mb-2 group">
                {entry.input && (
                  <div className="flex items-start gap-2 mb-1">
                    <span style={{ color: config.prompt }} className="shrink-0">
                      ❯
                    </span>
                    <span className="flex-1 break-all">{entry.input}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        className="p-1 hover:opacity-80 rounded"
                        onClick={(e) => { e.stopPropagation(); setInput(entry.input) }}
                        title="使用此命令"
                      >
                        <Play size={11} style={{ color: config.accent }} />
                      </button>
                      <button
                        className="p-1 hover:opacity-80 rounded"
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(entry.input) }}
                        title={isBookmarked(entry.input) ? '取消收藏' : '收藏'}
                      >
                        {isBookmarked(entry.input) ? (
                          <BookmarkCheck size={11} style={{ color: config.accent, fill: config.accent }} />
                        ) : (
                          <Bookmark size={11} style={{ color: config.secondary }} />
                        )}
                      </button>
                      <button
                        className="p-1 hover:opacity-80 rounded"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(entry.input, entry.id + '-in') }}
                        title="复制"
                      >
                        {copiedId === entry.id + '-in' ? (
                          <Check size={11} style={{ color: config.success }} />
                        ) : (
                          <Copy size={11} style={{ color: config.secondary }} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {entry.output && (
                  <div
                    className="pl-5 whitespace-pre-wrap break-all"
                    style={{
                      color: entry.isError ? config.error : entry.isAI ? config.accent : config.text,
                      opacity: entry.isAI ? 0.9 : 1,
                      fontStyle: entry.isAI ? 'italic' : 'normal',
                    }}
                  >
                    {syntaxHighlight(entry.output, theme)}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: config.accent }}>
                  <Sparkles size={14} className="animate-pulse" />
                </span>
                <span style={{ color: config.secondary }} className="animate-pulse">
                  AI 正在处理...
                </span>
              </div>
            )}
          </div>

          {showAIHelper && activeTab && smartSuggestions.length > 0 && input === '' && (
            <div
              className="px-4 py-2 border-t flex items-center gap-2 flex-wrap"
              style={{ borderColor: config.border, background: config.tabBg }}
            >
              <Lightbulb size={13} style={{ color: config.accent }} />
              <span style={{ color: config.secondary, fontSize: '11px' }}>智能建议:</span>
              {smartSuggestions.slice(0, 4).map((cmd, i) => (
                <button
                  key={i}
                  className="px-2 py-0.5 rounded text-xs hover:opacity-80 transition-opacity"
                  style={{ background: config.tabActive, color: config.accent }}
                  onClick={() => setInput(cmd + ' ')}
                >
                  {cmd}
                </button>
              ))}
              <button
                className="ml-auto p-1 hover:opacity-80"
                onClick={() => setShowAIHelper(false)}
                style={{ color: config.secondary }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div
            className="border-t px-4 py-2.5 flex items-end gap-2 shrink-0"
            style={{ borderColor: config.border, background: config.inputBg }}
          >
            <span style={{ color: config.prompt }} className="shrink-0 font-medium">
              {activeTab ? `user@web-linux:${activeTab.cwd === '/home/user' ? '~' : activeTab.cwd}$` : ''}
            </span>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none"
                style={{
                  color: config.text,
                  caretColor: config.accent,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                }}
                spellCheck={false}
                autoComplete="off"
              />
              {aiSuggestion && (
                <div
                  className="absolute left-0 top-full mt-1 px-2 py-1 rounded text-xs flex items-center gap-2"
                  style={{
                    background: config.tabActive,
                    color: config.accent,
                    border: `1px solid ${config.border}`,
                  }}
                >
                  <Sparkles size={11} />
                  <span>AI 建议: {aiSuggestion}</span>
                  <button
                    className="ml-1 hover:opacity-80"
                    onClick={() => { setInput(aiSuggestion) }}
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSidebar && (
          <div
            className="w-64 border-l flex flex-col shrink-0"
            style={{ borderColor: config.border, background: config.tabBg }}
          >
            <div className="flex border-b" style={{ borderColor: config.border }}>
              {(['bookmarks', 'snippets', 'search', 'history'] as const).map((t) => (
                <button
                  key={t}
                  className="flex-1 py-2 text-xs hover:opacity-80 transition-opacity"
                  style={{
                    color: sidebarTab === t ? config.accent : config.secondary,
                    borderBottom: sidebarTab === t ? `2px solid ${config.accent}` : '2px solid transparent',
                  }}
                  onClick={() => setSidebarTab(t)}
                >
                  {t === 'bookmarks' && '收藏'}
                  {t === 'snippets' && '片段'}
                  {t === 'search' && '搜索'}
                  {t === 'history' && '历史'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {sidebarTab === 'bookmarks' && (
                <div className="space-y-1">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-8" style={{ color: config.secondary, fontSize: '11px' }}>
                      <Bookmark size={24} className="mx-auto mb-2 opacity-30" />
                      暂无收藏命令
                    </div>
                  ) : (
                    bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="p-2 rounded-lg hover:opacity-80 transition-opacity cursor-pointer group"
                        style={{ background: config.inputBg }}
                        onClick={() => runBookmark(bm.command)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate">{bm.description}</span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(bm.command) }}
                          >
                            <Trash2 size={11} style={{ color: config.error }} />
                          </button>
                        </div>
                        <div
                          className="text-xs truncate font-mono"
                          style={{ color: config.accent }}
                        >
                          {bm.command}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'snippets' && (
                <div className="space-y-1">
                  {snippets.map((sn) => (
                    <div
                      key={sn.id}
                      className="p-2 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ background: config.inputBg }}
                      onClick={() => runBookmark(sn.command)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{sn.name}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: config.tabActive, color: config.accent, fontSize: '10px' }}
                        >
                          {sn.category}
                        </span>
                      </div>
                      <div
                        className="text-xs truncate font-mono"
                        style={{ color: config.secondary }}
                      >
                        {sn.command}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sidebarTab === 'search' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: config.secondary }} />
                    <input
                      type="text"
                      placeholder="搜索输出内容..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{
                        background: config.inputBg,
                        color: config.text,
                        border: `1px solid ${config.border}`,
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {searchQuery && (
                    <div className="text-xs" style={{ color: config.secondary }}>
                      找到 {filteredHistory.length} 条结果
                    </div>
                  )}
                </div>
              )}

              {sidebarTab === 'history' && (
                <div className="space-y-1">
                  {activeTab && [...activeTab.cmdHistory].reverse().slice(0, 50).map((cmd, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg hover:opacity-80 transition-opacity cursor-pointer group flex items-center gap-2"
                      style={{ background: config.inputBg }}
                      onClick={() => runBookmark(cmd)}
                    >
                      <Clock size={11} style={{ color: config.secondary }} className="shrink-0" />
                      <span className="text-xs truncate font-mono flex-1">{cmd}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className="px-3 py-1 flex items-center justify-between text-xs border-t shrink-0"
        style={{ borderColor: config.border, color: config.secondary, background: config.tabBg }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Terminal size={11} />
            {activeTab?.cwd === '/home/user' ? '~' : activeTab?.cwd}
          </span>
          <span>|</span>
          <span>{tabs.length} 个标签页</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FileText size={11} />
            {activeTab?.history.length || 0} 条记录
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Sparkles size={11} style={{ color: config.accent }} />
            AI 已启用
          </span>
        </div>
      </div>
    </div>
  )
}
