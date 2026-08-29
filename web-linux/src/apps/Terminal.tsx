import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { WindowState } from '../types'
import { getCommand, getSuggestions } from './terminal'
import type { CommandContext, CommandResult } from './terminal/commands'
import { findNodeByPath, resolvePath } from '../store/fileUtils'

function useLatest<T>(value: T): { current: T } {
  const ref = useRef<T>(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

interface HistoryEntry {
  input: string
  output: string
}

const ANSI_COLORS: Record<string, string> = {
  '34': '#0066cc',
  '32': '#00aa00',
  '31': '#cc0000',
  '33': '#aaaa00',
  '36': '#00aaaa',
  '35': '#aa00aa',
}

const ANSI_COLORS_DARK: Record<string, string> = {
  '34': '#569cd6',
  '32': '#6a9955',
  '31': '#f44747',
  '33': '#dcdcaa',
  '36': '#4ec9b0',
  '35': '#c586c0',
}

function processOutput(text: string, theme: 'dark' | 'light'): React.ReactNode[] {
  const escapeChar = String.fromCharCode(27)
  const regex = new RegExp(`(${escapeChar}\\[[0-9;]*m)`, 'g')
  const parts = text.split(regex)
  const result: React.ReactNode[] = []
  let currentStyle: React.CSSProperties = {}
  const colors = theme === 'light' ? ANSI_COLORS : ANSI_COLORS_DARK
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(escapeChar + '[')) {
      const code = parts[i].replace(escapeChar + '[', '').replace('m', '')
      if (code === '0') {
        currentStyle = {}
      } else if (code === '1') {
        currentStyle = { ...currentStyle, fontWeight: 'bold' }
      } else if (colors[code]) {
        currentStyle = { ...currentStyle, color: colors[code] }
      }
    } else if (parts[i]) {
      result.push(<span key={i} style={currentStyle}>{parts[i]}</span>)
    }
  }
  return result
}

export default function Terminal() {
  const files = useStore((s) => s.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const copyFile = useStore((s) => s.copyFile)
  const moveFile = useStore((s) => s.moveFile)
  const renameFile = useStore((s) => s.renameFile)
  const updateFileContent = useStore((s) => s.updateFileContent)
  const getWindows = useStore((s) => s.windows)
  const closeWindow = useStore((s) => s.closeWindow)
  const theme = useStore((s) => s.resolvedTheme)

  const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '71.0.0'

  const [cwd, setCwd] = useState('/home/user')
  const [prevCwd, setPrevCwd] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([
    { input: '', output: `Web Linux 终端 v${APP_VERSION}\n输入 "help" 查看可用命令\n输入 "welcome" 查看新手指南\n输入 "wiki" 探索维基百科 | "geo" 探索世界地理 | "recipe" 发现美食 | "snippets" 管理代码片段\n💡 提示：输入 'help' 查看所有可用命令\n🔄 增强功能：weather [城市] - 查看实时天气 | js [代码] - 执行JS代码 | share - 分享终端内容 | about - 查看系统信息` },
  ])
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-cmd-history')
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 })
  const [aliases, setAliases] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {
      ll: 'ls -la',
      la: 'ls -a',
      '..': 'cd ..',
      '...': 'cd ../..',
      home: 'cd ~',
      cls: 'clear',
      q: 'exit',
    }
    try {
      const saved = localStorage.getItem('weblinux-aliases')
      const parsed = saved ? JSON.parse(saved) : defaults
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...defaults, ...parsed } : defaults
    } catch {
      return defaults
    }
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const getWindowsRef = useLatest(getWindows)
  const closeWindowRef = useLatest(closeWindow)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus()
    const id = setTimeout(focusInput, 100)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (cmdHistory.length > 0) {
      localStorage.setItem('weblinux-cmd-history', JSON.stringify(cmdHistory.slice(-100)))
    }
  }, [cmdHistory])

  useEffect(() => {
    localStorage.setItem('weblinux-aliases', JSON.stringify(aliases))
  }, [aliases])

  const username = 'user'
  const hostname = 'web-linux'

  const getCompletions = useCallback((partial: string): string[] => {
    const trimmed = partial.trim()
    if (!trimmed) return []
    
    return getSuggestions(trimmed, cwd, files)
  }, [files, cwd])



  // 解析重定向：从命令字符串中提取 > 或 >> 以及目标文件路径
  const parseRedirect = (cmdStr: string): { cmd: string; redirectFile: string | null; append: boolean } => {
    const appendMatch = cmdStr.match(/^(.+?)\s*>>\s*(\S+)\s*$/)
    if (appendMatch) {
      return { cmd: appendMatch[1].trim(), redirectFile: appendMatch[2], append: true }
    }
    const overwriteMatch = cmdStr.match(/^(.+?)\s*(?!>)>(?!\>)\s*(\S+)\s*$/)
    if (overwriteMatch) {
      return { cmd: overwriteMatch[1].trim(), redirectFile: overwriteMatch[2], append: false }
    }
    return { cmd: cmdStr, redirectFile: null, append: false }
  }

  // 将输出写入虚拟文件系统
  const writeOutputToFile = useCallback((filePath: string, content: string, append: boolean): string | null => {
    const resolvedPath = resolvePath(cwd, filePath)
    const dirPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/')) || '/'
    const fileName = resolvedPath.substring(resolvedPath.lastIndexOf('/') + 1)

    if (!fileName) return `重定向错误: 无效的文件名`

    const dirNode = findNodeByPath(files, dirPath)
    if (!dirNode || dirNode.type !== 'folder') {
      return `重定向错误: 目录 '${dirPath}' 不存在`
    }

    const existingFile = dirNode.children?.find(c => c.name === fileName && c.type === 'file')
    if (existingFile) {
      if (append) {
        const newContent = (existingFile.content || '') + content
        updateFileContent(existingFile.id, newContent)
      } else {
        updateFileContent(existingFile.id, content)
      }
    } else {
      addFile(dirNode.id, fileName, 'file')
      const newFiles = useStore.getState().files
      const newDirNode = findNodeByPath(newFiles, dirPath)
      const newFile = newDirNode?.children?.find(c => c.name === fileName && c.type === 'file')
      if (newFile) {
        updateFileContent(newFile.id, content)
      }
    }
    return null
  }, [cwd, files, addFile, updateFileContent])

  // 解析管道：按 | 分割命令，但排除被引号包裹的 |
  const splitPipes = (cmdStr: string): string[] => {
    const parts: string[] = []
    let current = ''
    let inSingleQuote = false
    let inDoubleQuote = false
    for (let i = 0; i < cmdStr.length; i++) {
      const ch = cmdStr[i]
      if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += ch; continue }
      if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += ch; continue }
      if (ch === '|' && !inSingleQuote && !inDoubleQuote) {
        parts.push(current.trim())
        current = ''
        continue
      }
      current += ch
    }
    if (current.trim()) parts.push(current.trim())
    return parts
  }

  // 解析多命令：按 ; 分割，但排除引号包裹的 ;
  const splitSemicolons = (cmdStr: string): string[] => {
    const parts: string[] = []
    let current = ''
    let inSingleQuote = false
    let inDoubleQuote = false
    for (let i = 0; i < cmdStr.length; i++) {
      const ch = cmdStr[i]
      if (ch === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; current += ch; continue }
      if (ch === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; current += ch; continue }
      if (ch === ';' && !inSingleQuote && !inDoubleQuote) {
        parts.push(current.trim())
        current = ''
        continue
      }
      current += ch
    }
    if (current.trim()) parts.push(current.trim())
    return parts
  }

  // 执行单个命令（无管道/重定向），返回输出和 cwd 变更
  const runSingleCommand = useCallback(async (command: string, args: string[], stdin?: string): Promise<{ output: string; newCwd?: string; newPrevCwd?: string | null }> => {
    const cmdDef = getCommand(command)
    if (cmdDef) {
      const context: CommandContext = {
        cwd,
        files,
        username,
        hostname,
        theme,
        args,
        prevCwd,
        stdin,
        addFile,
        deleteFile,
        updateFileContent,
        renameFile,
        copyFile,
        moveFile,
      }
      const result: CommandResult = await cmdDef.handler(context)
      return { output: result.output, newCwd: result.cwd, newPrevCwd: result.prevCwd }
    }
    return { output: `bash: ${command}: 未找到命令 (输入 'help' 查看可用命令)` }
  }, [cwd, files, prevCwd, theme, addFile, deleteFile, updateFileContent, renameFile, copyFile, moveFile])

  // 执行一条命令链（可能含管道），返回最终输出
  const executePipeChain = useCallback(async (cmdStr: string): Promise<string> => {
    const pipeParts = splitPipes(cmdStr)
    let pipeOutput = ''

    for (let i = 0; i < pipeParts.length; i++) {
      let segment = pipeParts[i].trim()

      // 别名替换
      const aliasMatch = segment.match(/^(\S+)/)
      if (aliasMatch && aliases[aliasMatch[1]]) {
        segment = segment.replace(/^\S+/, aliases[aliasMatch[1]])
      }

      // 解析重定向
      const { cmd: pureCmd, redirectFile, append } = parseRedirect(segment)

      const parts = pureCmd.split(/\s+/)
      const command = parts[0].toLowerCase()
      const args = parts.slice(1)

      // 内置命令处理
      if (command === 'clear' || command === 'cls' || command === 'reset') {
        setHistory([])
        return ''
      }

      if (command === 'exit') {
        const windows = getWindowsRef.current
        // 优先关闭当前聚焦的终端窗口，如果没有聚焦的则关闭第一个终端
        const focusedTerminal = windows.find((w: WindowState) => w.appId === 'terminal' && w.focused)
        const terminalWindow = focusedTerminal || windows.find((w: WindowState) => w.appId === 'terminal')
        if (terminalWindow) {
          closeWindowRef.current(terminalWindow.id)
        }
        return ''
      }

      if (command === 'history') {
        return cmdHistory.map((c, idx) => `${idx + 1} ${c}`).join('\n')
      }

      if (command === 'alias') {
        if (args.length === 0) {
          return Object.entries(aliases).map(([k, v]) => `${k}='${v}'`).join('\n')
        }
        const [name, value] = args.join(' ').split('=')
        if (name && value) {
          setAliases(prev => ({ ...prev, [name]: value.replace(/['"]/g, '') }))
          return ''
        }
        return 'alias: 无效的别名定义'
      }

      if (command === 'unalias') {
        if (args.length === 0) {
          return 'unalias: 缺少参数\n用法: unalias <别名名>\n  unalias -a  删除所有别名'
        }
        if (args[0] === '-a') {
          setAliases({})
          return ''
        }
        const name = args[0]
        if (aliases[name]) {
          setAliases(prev => {
            const next = { ...prev }
            delete next[name]
            return next
          })
          return ''
        }
        return `unalias: ${name}: 未找到别名`
      }

      if (command === 'echo') {
        let text = args.join(' ')
        text = text.replace(/\$HOME/g, '/home/user')
        text = text.replace(/\$USER/g, username)
        text = text.replace(/\$HOSTNAME/g, hostname)
        text = text.replace(/\$PWD/g, cwd)
        text = text.replace(/\$SHELL/g, '/bin/bash')
        text = text.replace(/\$PATH/g, '/usr/local/bin:/usr/bin:/bin')
        text = text.replace(/\$LANG/g, 'zh_CN.UTF-8')
        if (!text && pipeOutput) {
          pipeOutput = pipeOutput
          continue
        }
        pipeOutput = text
        continue
      }

      // 通用命令执行
      const stdinData = i > 0 ? pipeOutput : undefined
      try {
        const result = await runSingleCommand(command, args, stdinData)
        if (result.newCwd !== undefined) {
          setCwd(result.newCwd)
        }
        if (result.newPrevCwd !== undefined) {
          setPrevCwd(result.newPrevCwd)
        }
        pipeOutput = result.output
      } catch (error) {
        pipeOutput = `命令执行错误: ${(error as Error).message}`
      }

      // 处理重定向
      if (redirectFile && pipeOutput) {
        const err = writeOutputToFile(redirectFile, pipeOutput, append)
        if (err) {
          pipeOutput = err
        } else {
          pipeOutput = ''
        }
      }
    }

    return pipeOutput
  }, [cwd, files, prevCwd, aliases, cmdHistory, runSingleCommand, writeOutputToFile])

  const executeCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) {
      setHistory(prev => [...prev, { input: cmd, output: '' }])
      return
    }

    setCmdHistory(prev => [...prev.slice(-499), cmd])

    // 帮助命令（特殊处理，不进入管道/多命令逻辑）
    const firstWord = cmd.trim().split(/\s+/)[0].toLowerCase()
    const resolvedFirstWord = aliases[firstWord] ? aliases[firstWord].split(/\s+/)[0].toLowerCase() : firstWord
    if (resolvedFirstWord === 'help' || resolvedFirstWord === '?') {
      const categorizedCommands: Record<string, string[]> = {
        '文件操作': ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'tree', 'wc', 'write', 'tee', 'append', 'grep', 'find', 'chmod', 'gzip', 'gunzip', 'file', 'sort', 'uniq', 'cut', 'paste', 'nl', 'expand', 'tr', 'split'],
        '系统信息': ['whoami', 'hostname', 'date', 'uname', 'uptime', 'cal', 'free', 'df', 'neofetch', 'version', 'about', 'system', 'credits', 'time', 'worldtime', 'env', 'export', 'which', 'who', 'w', 'banner'],
        '系统监控': ['ps', 'top', 'sysinfo'],
        '网络工具': ['ping', 'curl', 'fetch', 'ifconfig', 'ipinfo', 'iplookup', 'dig', 'nslookup', 'ip', 'weather', 'weather-forecast', 'news', 'crypto', 'translate', 'currency'],
        '实用工具': ['calc', 'prime', 'factor', 'roman', 'base64', 'unbase64', 'hash', 'rev', 'json', 'urlencode', 'urldecode', 'uuid', 'password', 'timestamp', 'uuidv4', 'password-strength', 'regex-test', 'base64-url', 'cron-parse', 'url-info', 'converter', 'ascii-table', 'md5sum', 'sha256sum', 'sha1sum', 'sha512sum', 'watch'],
        '开发工具': ['code-highlight', 'color', 'http-status', 'base-convert', 'url-parse', 'markdown', 'dict', 'wikipedia', 'js'],
        '趣味命令': ['cowsay', 'cowthink', 'dog', 'fortune', 'sl', 'banner', 'matrix', 'joke', 'advice', 'flip', 'rps', 'fact', 'emoji', 'nasa', 'randomuser', 'github-trending'],
        '其他': ['search', 'alias', 'unalias', 'history', 'welcome', 'open', 'app', 'motd', 'timer'],
      }

      const helpOutput = [
        '可用命令:',
        '',
        ...Object.entries(categorizedCommands).map(([category, cmds]) => {
          return `${category}:\n  ${cmds.join(', ')}`
        }),
        '',
        'Shell特性:',
        '  管道: cmd1 | cmd2        将cmd1的输出作为cmd2的输入',
        '  重定向: cmd > file       将输出写入文件(覆盖)',
        '  追加: cmd >> file        将输出追加到文件',
        '  多命令: cmd1; cmd2       依次执行多个命令',
        '  别名: alias/unalias      管理命令别名',
        '',
        '快捷键:',
        '  Ctrl+Shift+L - 切换启动器',
        '  Ctrl+Shift+S - 打开设置',
        '  Ctrl+Shift+F - 打开文件管理器',
        '  Ctrl+Shift+T - 打开终端',
        '  Ctrl+N - 新建终端',
        '  Ctrl+W - 关闭窗口',
        '  Ctrl+M - 最小化窗口',
        '  F11 - 全屏/还原窗口',
      ].join('\n')

      setHistory(prev => [...prev, { input: cmd, output: helpOutput }])
      return
    }

    // 多命令(; ) 分割
    const multiCommands = splitSemicolons(cmd.trim())

    if (multiCommands.length === 1) {
      const output = await executePipeChain(multiCommands[0])
      setHistory(prev => [...prev, { input: cmd, output }])
    } else {
      const outputs: string[] = []
      for (const subCmd of multiCommands) {
        if (!subCmd.trim()) continue
        const output = await executePipeChain(subCmd)
        if (output) outputs.push(output)
      }
      setHistory(prev => [...prev, { input: cmd, output: outputs.join('\n') }])
    }
  }, [cwd, files, prevCwd, cmdHistory, aliases, theme, executePipeChain])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input)
      setInput('')
      setHistoryIndex(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(cmdHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= cmdHistory.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(cmdHistory[newIndex])
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.ctrlKey) {
        e.preventDefault()
        const inputRefEl = inputRef.current
        if (inputRefEl) {
          const pos = inputRefEl.selectionStart || 0
          const lastWordStart = input.lastIndexOf(' ', pos - 2) + 1
          inputRefEl.setSelectionRange(lastWordStart, lastWordStart)
        }
      }
    } else if (e.key === 'ArrowRight') {
      if (e.ctrlKey) {
        e.preventDefault()
        const inputRefEl = inputRef.current
        if (inputRefEl) {
          const pos = inputRefEl.selectionStart || 0
          const nextSpace = input.indexOf(' ', pos)
          const newPos = nextSpace === -1 ? input.length : nextSpace + 1
          inputRefEl.setSelectionRange(newPos, newPos)
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const completions = getCompletions(input)
      if (completions.length === 1) {
        setInput(completions[0])
      } else if (completions.length > 1) {
        const prevHistory = [...history]
        if (prevHistory.length > 0 && !prevHistory[prevHistory.length - 1].input) {
          prevHistory.pop()
        }
        const maxLen = Math.max(...completions.map(c => c.length))
        const cols = 3
        const padded = completions.map(c => c.padEnd(maxLen + 2))
        const lines: string[] = []
        for (let i = 0; i < padded.length; i += cols) {
          lines.push(padded.slice(i, i + cols).join(''))
        }
        setHistory([...prevHistory, { input: '', output: lines.join('\n') }])
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setHistory([])
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setInput('')
      setHistory(prev => [...prev, { input: '^C', output: '' }])
    } else if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault()
      setInput('')
    } else if (e.key === 'k' && e.ctrlKey) {
      e.preventDefault()
      const inputRefEl = inputRef.current
      if (inputRefEl) {
        const pos = inputRefEl.selectionStart || 0
        setInput(input.slice(0, pos))
      }
    } else if (e.key === 'y' && e.ctrlKey) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const inputRefEl = inputRef.current
        if (inputRefEl) {
          const pos = inputRefEl.selectionStart || input.length
          setInput(input.slice(0, pos) + text + input.slice(pos))
        } else {
          setInput(input + text)
        }
      }).catch(() => {})
    } else if (e.key === 'r' && e.ctrlKey) {
      e.preventDefault()
      const searchTerm = input.trim()
      if (searchTerm) {
        const found = cmdHistory.filter(cmd => cmd.includes(searchTerm)).reverse()
        if (found.length > 0) {
          setInput(found[0])
        }
      }
    }
  }, [input, executeCommand, cmdHistory, historyIndex, getCompletions, history])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }

  const handleCopy = async () => {
    const selectedText = window.getSelection()?.toString()
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText)
      } catch {
        // 剪贴板权限被拒或不可用，静默忽略
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  const handlePaste = async () => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText()
        setInput(prev => prev + text)
      } catch {
        // 剪贴板权限被拒或不可用，静默忽略
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  const handleClearTerminal = () => {
    setHistory([])
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  return (
    <div className="app-container app-terminal" style={{ 
      background: theme === 'light' ? '#f0f0f0' : '#1e1e1e', 
      color: theme === 'light' ? '#000000' : '#00ff00', 
      fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace', 
      fontSize: 14, 
      overflow: 'hidden',
      position: 'relative'
    }} onClick={() => { inputRef.current?.focus(); setContextMenu({ visible: false, x: 0, y: 0 }) }}>
      <div
        ref={containerRef}
        className="app-terminal-output"
        onContextMenu={handleContextMenu}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '12px 16px', 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-all',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(108, 92, 231, 0.4) transparent'
        }}
      >
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            {entry.input && (
              <div>
                <span style={{ color: theme === 'light' ? '#0066cc' : '#569cd6' }}>{username}@</span>
                <span style={{ color: theme === 'light' ? '#00aa00' : '#6a9955' }}>{hostname}</span>
                <span style={{ color: theme === 'light' ? '#333' : '#d4d4d4' }}>:</span>
                <span style={{ color: theme === 'light' ? '#0066cc' : '#569cd6' }}>{cwd}</span>
                <span style={{ color: theme === 'light' ? '#333' : '#d4d4d4' }}>$ </span>
                <span>{entry.input}</span>
              </div>
            )}
            {entry.output && <div>{processOutput(entry.output, theme)}</div>}
          </div>
        ))}
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '4px 16px 8px', 
        borderTop: `1px solid ${theme === 'light' ? '#d1d1d6' : '#333'}` 
      }}>
        <span style={{ color: theme === 'light' ? '#0066cc' : '#569cd6', whiteSpace: 'nowrap' }}>{username}@</span>
        <span style={{ color: theme === 'light' ? '#00aa00' : '#6a9955', whiteSpace: 'nowrap' }}>{hostname}</span>
        <span style={{ color: theme === 'light' ? '#333' : '#d4d4d4', whiteSpace: 'nowrap' }}>:</span>
        <span style={{ color: theme === 'light' ? '#0066cc' : '#569cd6', whiteSpace: 'nowrap' }}>{cwd}</span>
        <span style={{ color: theme === 'light' ? '#333' : '#d4d4d4', whiteSpace: 'nowrap' }}>$&nbsp;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme === 'light' ? '#000000' : '#00ff00',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            caretColor: theme === 'light' ? '#000000' : '#00ff00',
          }}
          spellCheck={false}
        />
      </div>
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: theme === 'light' ? '#ffffff' : '#2d2d3a',
            border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#444'}`,
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            padding: 4,
            zIndex: 10000,
            minWidth: 180
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
              color: theme === 'light' ? '#000' : '#e0e0e8'
            }}
            onClick={handleCopy}
          >
            复制 (Ctrl+C)
          </div>
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
              color: theme === 'light' ? '#000' : '#e0e0e8'
            }}
            onClick={handlePaste}
          >
            粘贴 (Ctrl+V)
          </div>
          <div style={{ height: 1, background: theme === 'light' ? '#d1d1d6' : '#444', margin: '4px 0' }} />
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
              color: theme === 'light' ? '#000' : '#e0e0e8'
            }}
            onClick={handleClearTerminal}
          >
            清空终端 (Ctrl+L)
          </div>
        </div>
      )}
    </div>
  )
}