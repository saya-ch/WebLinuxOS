import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface HistoryEntry {
  input: string
  output: string
}

function findNodeByPath(files: FileNode[], path: string): FileNode | null {
  if (path === '/' || path === '') return files[0]
  const parts = path.replace(/^\//, '').split('/')
  let current: FileNode | null = files[0]
  for (const part of parts) {
    if (!part || !current?.children) continue
    current = current.children.find((c) => c.name === part) || null
    if (!current) return null
  }
  return current
}

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target
  const parts = (cwd + '/' + target).split('/').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '..') {
      resolved.pop()
    } else if (part !== '.') {
      resolved.push(part)
    }
  }
  return '/' + resolved.join('/')
}

function listDir(files: FileNode[], path: string): string {
  const node = findNodeByPath(files, path)
  if (!node || node.type !== 'folder') return `ls: 无法访问'${path}': 没有那个文件或目录`
  if (!node.children || node.children.length === 0) return ''
  const items = node.children.map((c) => {
    const color = c.type === 'folder' ? '\x1b[34m' : '\x1b[0m'
    return `${color}${c.name}\x1b[0m`
  })
  return items.join('  ')
}

function processOutput(text: string): React.ReactNode[] {
  const parts = text.split(/(\x1b\[[0-9;]*m)/)
  const result: React.ReactNode[] = []
  let currentStyle: React.CSSProperties = {}
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('\x1b[')) {
      const code = parts[i].replace('\x1b[', '').replace('m', '')
      if (code === '0') currentStyle = {}
      else if (code === '34') currentStyle = { color: '#569cd6' }
      else if (code === '32') currentStyle = { color: '#6a9955' }
      else if (code === '31') currentStyle = { color: '#f44747' }
      else if (code === '33') currentStyle = { color: '#dcdcaa' }
      else if (code === '1') currentStyle = { ...currentStyle, fontWeight: 'bold' }
    } else {
      result.push(<span key={i} style={currentStyle}>{parts[i]}</span>)
    }
  }
  return result
}

export default function Terminal() {
  const files = useStore((s) => s.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const theme = useStore((s) => s.theme)

  const [cwd, setCwd] = useState('/home/user')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([
    { input: '', output: 'Web Linux 终端 v1.0\n输入 "help" 查看可用命令' },
  ])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const username = 'user'
  const hostname = 'web-linux'

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim()
    const parts = trimmed.split(/\s+/)
    const command = parts[0]
    const args = parts.slice(1)

    let output = ''

    switch (command) {
      case '':
        break
      case 'help':
        output = `可用命令:\n  ls, cd, pwd, cat, echo, clear, help, date, whoami, uname,\n  mkdir, touch, rm, cp, mv, find, grep, ps, top, df, free,\n  history, neofetch, lsb_release, hostname, ping`
        break
      case 'clear':
        setHistory([])
        return
      case 'pwd':
        output = cwd
        break
      case 'whoami':
        output = username
        break
      case 'hostname':
        output = hostname
        break
      case 'date':
        output = new Date().toString()
        break
      case 'uname':
        output = args.includes('-a') ? `Linux web-linux 6.1.0-web ${new Date().toISOString().slice(0, 10)} x86_64 GNU/Linux` : 'Linux'
        break
      case 'lsb_release':
        output = args.includes('-a')
          ? `Distributor ID: WebLinux\nDescription:    Web Linux 1.0\nRelease:        1.0\nCodename:       web`
          : 'Web Linux 1.0'
        break
      case 'neofetch':
        output = [
          `            .-/+oossssoo+/-.               ${username}@${hostname}`,
          `        \`:+ssssssssssssssssss+:\`           -------------`,
          `      -+ssssssssssssssssssssssso+-         OS: Web Linux 1.0`,
          `    /osssssssssssssssssssssssssso/        Kernel: 6.1.0-web`,
          `  /ossssssssssssssssssssssssssssso/       Shell: bash 5.2`,
          ` :sssssssssssssssssssssssssssssssss:      DE: WebDE`,
          ` ossssssssssssssssssssssssssssssssso      Theme: ${theme}`,
          ` ossssssssssssssssssssssssssssssssso      Uptime: ${Math.floor(Math.random() * 24)} hours`,
          ` :sssssssssssssssssssssssssssssssss:      Packages: ${Math.floor(Math.random() * 500 + 100)}`,
          `  /ossssssssssssssssssssssssssssso/       Memory: ${Math.floor(Math.random() * 4096 + 1024)}MB / 8192MB`,
          `    /osssssssssssssssssssssssssso/`,
          `      -+ssssssssssssssssssssssso+-`,
          `        \`:+ssssssssssssssssss+:\``,
          `            .-/+oossssoo+/-.`,
        ].join('\n')
        break
      case 'ls': {
        const target = args[0] ? resolvePath(cwd, args[0]) : cwd
        output = listDir(files, target)
        break
      }
      case 'cd': {
        if (args.length === 0) {
          setCwd('/home/user')
        } else {
          const resolved = resolvePath(cwd, args[0])
          const node = findNodeByPath(files, resolved)
          if (node && node.type === 'folder') {
            setCwd(resolved)
          } else {
            output = `cd: ${args[0]}: 没有那个文件或目录`
          }
        }
        break
      }
      case 'cat': {
        if (args.length === 0) {
          output = 'cat: 缺少操作数'
        } else {
          const resolved = resolvePath(cwd, args[0])
          const node = findNodeByPath(files, resolved)
          if (node && node.type === 'file') {
            output = node.content || ''
          } else {
            output = `cat: ${args[0]}: 没有那个文件或目录`
          }
        }
        break
      }
      case 'echo':
        output = args.join(' ')
        break
      case 'mkdir': {
        if (args.length === 0) {
          output = 'mkdir: 缺少操作数'
        } else {
          const resolved = resolvePath(cwd, args[0])
          const parts1 = resolved.split('/').filter(Boolean)
          const parentPath = '/' + parts1.slice(0, -1).join('/') || '/'
          const dirName = parts1[parts1.length - 1]
          const parentNode = findNodeByPath(files, parentPath)
          if (parentNode) {
            addFile(parentNode.id, dirName, 'folder')
            output = ''
          } else {
            output = `mkdir: 无法创建目录'${args[0]}': 没有那个文件或目录`
          }
        }
        break
      }
      case 'touch': {
        if (args.length === 0) {
          output = 'touch: 缺少操作数'
        } else {
          const resolved = resolvePath(cwd, args[0])
          const parts1 = resolved.split('/').filter(Boolean)
          const parentPath = '/' + parts1.slice(0, -1).join('/') || '/'
          const fileName = parts1[parts1.length - 1]
          const parentNode = findNodeByPath(files, parentPath)
          const existing = findNodeByPath(files, resolved)
          if (existing) {
            output = ''
          } else if (parentNode) {
            addFile(parentNode.id, fileName, 'file')
            output = ''
          } else {
            output = `touch: 无法创建'${args[0]}': 没有那个文件或目录`
          }
        }
        break
      }
      case 'rm': {
        if (args.length === 0) {
          output = 'rm: 缺少操作数'
        } else {
          const resolved = resolvePath(cwd, args[0])
          const node = findNodeByPath(files, resolved)
          if (node) {
            deleteFile(node.id)
            output = ''
          } else {
            output = `rm: 无法删除'${args[0]}': 没有那个文件或目录`
          }
        }
        break
      }
      case 'cp':
        output = 'cp: 已模拟复制操作'
        break
      case 'mv':
        output = 'mv: 已模拟移动操作'
        break
      case 'find':
        output = args.length > 0
          ? `./${args[0]}\n./home/user/documents/${args[0] || 'results'}`
          : 'find: 缺少操作数'
        break
      case 'grep':
        output = args.length >= 2
          ? `匹配到 3 行结果:\n  第10行: ...包含"${args[1]}"的内容...\n  第25行: ...包含"${args[1]}"的内容...\n  第42行: ...包含"${args[1]}"的内容...`
          : 'grep: 用法: grep [选项] 模式 [文件...]'
        break
      case 'ps':
        output = '  PID TTY          TIME CMD\n    1 ?        00:00:01 systemd\n  234 ?        00:00:00 terminal\n  567 ?        00:00:05 browser\n  890 ?        00:00:02 file-manager'
        break
      case 'top':
        output = `top - ${new Date().toLocaleTimeString()} up ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}, 1 user\nTasks: ${Math.floor(Math.random() * 50 + 50)} total\n%Cpu(s): ${(Math.random() * 20 + 5).toFixed(1)} us, ${(Math.random() * 5).toFixed(1)} sy\nMiB Mem: ${(Math.random() * 2000 + 6000).toFixed(1)} total, ${(Math.random() * 3000).toFixed(1)} free`
        break
      case 'df':
        output = '文件系统           大小  已用  可用 使用%\n/dev/sda1          50G   12G   38G   24%\ntmpfs             3.9G  1.2M  3.9G    1%'
        break
      case 'free':
        output = `              总计         已用         空闲\n内存:       ${Math.floor(Math.random() * 4000 + 4000)}MB      ${Math.floor(Math.random() * 3000)}MB      ${Math.floor(Math.random() * 3000)}MB\n交换:       ${Math.floor(Math.random() * 2000 + 1000)}MB           0MB      ${Math.floor(Math.random() * 2000 + 1000)}MB`
        break
      case 'history':
        output = cmdHistory.map((h, i) => `  ${i + 1}  ${h}`).join('\n')
        break
      case 'ping':
        if (args.length === 0) {
          output = 'ping: 用法: ping 目标地址'
        } else {
          output = `PING ${args[0]} 56(84) bytes of data.\n64 bytes from ${args[0]}: icmp_seq=1 ttl=64 time=${(Math.random() * 30 + 10).toFixed(1)} ms\n64 bytes from ${args[0]}: icmp_seq=2 ttl=64 time=${(Math.random() * 30 + 10).toFixed(1)} ms\n64 bytes from ${args[0]}: icmp_seq=3 ttl=64 time=${(Math.random() * 30 + 10).toFixed(1)} ms`
        }
        break
      default:
        output = `bash: ${command}: 未找到命令`
    }

    setHistory((prev) => [...prev, { input: trimmed, output }])
  }, [cwd, files, addFile, deleteFile, cmdHistory, theme, username, hostname])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input.trim()
      if (cmd) {
        setCmdHistory((prev) => [...prev, cmd])
        setHistoryIndex(-1)
      }
      executeCommand(cmd)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIndex = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(cmdHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= cmdHistory.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(cmdHistory[newIndex])
        }
      }
    }
  }

  return (
    <div className="app-container app-terminal" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace', fontSize: 14, overflow: 'hidden' }} onClick={() => inputRef.current?.focus()}>
      <div
        ref={containerRef}
        className="app-terminal-output"
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            {entry.input && (
              <div>
                <span style={{ color: '#569cd6' }}>{username}@</span>
                <span style={{ color: '#6a9955' }}>{hostname}</span>
                <span style={{ color: '#d4d4d4' }}>:</span>
                <span style={{ color: '#569cd6' }}>{cwd}</span>
                <span style={{ color: '#d4d4d4' }}>$ </span>
                <span>{entry.input}</span>
              </div>
            )}
            {entry.output && <div>{processOutput(entry.output)}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px 8px', borderTop: '1px solid #333' }}>
        <span style={{ color: '#569cd6', whiteSpace: 'nowrap' }}>{username}@</span>
        <span style={{ color: '#6a9955', whiteSpace: 'nowrap' }}>{hostname}</span>
        <span style={{ color: '#d4d4d4', whiteSpace: 'nowrap' }}>:</span>
        <span style={{ color: '#569cd6', whiteSpace: 'nowrap' }}>{cwd}</span>
        <span style={{ color: '#d4d4d4', whiteSpace: 'nowrap' }}>$&nbsp;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff00',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            caretColor: '#00ff00',
          }}
          spellCheck={false}
        />
      </div>
    </div>
  )
}