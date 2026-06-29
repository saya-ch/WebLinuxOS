import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { WindowState } from '../types'
import { getCommand, getSuggestions } from './terminal'
import type { CommandContext, CommandResult } from './terminal/commands'

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
  const theme = useStore((s) => s.theme)

  const [cwd, setCwd] = useState('/home/user')
  const [prevCwd, setPrevCwd] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([
    { input: '', output: 'Web Linux 终端 v2.3\n输入 "help" 查看可用命令\n输入 "welcome" 查看新手指南' },
  ])
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('weblinux-cmd-history')
    return saved ? JSON.parse(saved) : []
  })
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 })
  const [aliases, setAliases] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('weblinux-aliases')
    return saved ? JSON.parse(saved) : {
      ll: 'ls -la',
      la: 'ls -a',
      '..': 'cd ..',
      '...': 'cd ../..',
      home: 'cd ~',
      cls: 'clear',
      q: 'exit',
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
    setTimeout(focusInput, 100)
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



  const executeCommand = useCallback(async (cmd: string) => {
    let trimmed = cmd.trim()
    
    const aliasMatch = trimmed.match(/^(\S+)/)
    if (aliasMatch && aliases[aliasMatch[1]]) {
      trimmed = trimmed.replace(/^\S+/, aliases[aliasMatch[1]])
    }
    
    const parts = trimmed.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    if (!cmd.trim()) {
      setHistory(prev => [...prev, { input: cmd, output: '' }])
      return
    }

    setCmdHistory(prev => [...prev, cmd])

    if (command === 'clear' || command === 'cls' || command === 'reset') {
      setHistory([])
      return
    }

    if (command === 'exit') {
      const windows = getWindowsRef.current
      const terminalWindow = windows.find((w: WindowState) => w.id.includes('terminal'))
      if (terminalWindow) {
        closeWindowRef.current(terminalWindow.id)
      }
      return
    }

    if (command === 'help' || command === '?') {
      const categorizedCommands: Record<string, string[]> = {
        '文件操作': ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'tree', 'wc', 'write', 'tee', 'append', 'grep', 'find', 'chmod', 'gzip', 'gunzip', 'file', 'sort', 'uniq', 'cut', 'paste', 'nl', 'expand', 'tr', 'split'],
        '系统信息': ['whoami', 'hostname', 'date', 'uname', 'uptime', 'cal', 'free', 'df', 'neofetch', 'version', 'about', 'credits', 'time', 'worldtime'],
        '系统监控': ['ps', 'top', 'cpu-info', 'memory-info', 'disk-usage', 'network-stats', 'process-list'],
        '网络工具': ['ping', 'weather', 'news', 'crypto', 'translate', 'ipinfo'],
        '实用工具': ['calc', 'prime', 'factor', 'roman', 'base64', 'unbase64', 'hash', 'rev', 'json', 'urlencode', 'urldecode', 'uuid', 'password'],
        '趣味命令': ['cowsay', 'cowthink', 'dog', 'fortune', 'sl', 'banner', 'lolcat', 'starwars', 'matrix', 'asciiart', 'joke', 'advice', 'flip', 'rps'],
        '其他': ['search', 'alias', 'history', 'welcome'],
      }

      const helpOutput = [
        '可用命令:',
        '',
        ...Object.entries(categorizedCommands).map(([category, cmds]) => {
          return `${category}:\n  ${cmds.join(', ')}`
        }),
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

    if (command === 'history') {
      const historyOutput = cmdHistory.map((c, i) => `${i + 1} ${c}`).join('\n')
      setHistory(prev => [...prev, { input: cmd, output: historyOutput }])
      return
    }

    if (command === 'alias') {
      if (args.length === 0) {
        const aliasOutput = Object.entries(aliases).map(([k, v]) => `${k}='${v}'`).join('\n')
        setHistory(prev => [...prev, { input: cmd, output: aliasOutput }])
      } else {
        const [name, value] = args.join(' ').split('=')
        if (name && value) {
          setAliases(prev => ({ ...prev, [name]: value.replace(/['"]/g, '') }))
          setHistory(prev => [...prev, { input: cmd, output: '' }])
        } else {
          setHistory(prev => [...prev, { input: cmd, output: 'alias: 无效的别名定义' }])
        }
      }
      return
    }

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
        addFile,
        deleteFile,
        updateFileContent,
        renameFile,
        copyFile,
        moveFile,
      }

      try {
        const result: CommandResult = await cmdDef.handler(context)
        
        if (result.cwd !== undefined) {
          setCwd(result.cwd)
        }
        if (result.prevCwd !== undefined) {
          setPrevCwd(result.prevCwd)
        }
        
        setHistory(prev => [...prev, { input: cmd, output: result.output }])
      } catch (error) {
        setHistory(prev => [...prev, { input: cmd, output: `命令执行错误: ${(error as Error).message}` }])
      }
      return
    }

    setHistory(prev => [...prev, { input: cmd, output: `bash: ${command}: 未找到命令 (输入 'help' 查看可用命令)` }])
  }, [cwd, files, prevCwd, cmdHistory, aliases, theme])

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
        setHistory([...prevHistory, { input: '', output: completions.join('  ') }])
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setHistory([])
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setInput('')
      setHistory(prev => [...prev, { input: '^C', output: '' }])
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
      await navigator.clipboard.writeText(selectedText)
    }
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  const handlePaste = async () => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText()
      setInput(prev => prev + text)
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