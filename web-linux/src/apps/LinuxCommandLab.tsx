import { useState, useCallback, useRef, useEffect } from 'react'
import { Terminal, Copy, Trash2, BookOpen, ChevronRight, HelpCircle, User, HardDrive, Wifi, Battery } from 'lucide-react'

interface CommandResult {
  command: string
  output: string
  type: 'success' | 'error' | 'info'
}

interface FileNode {
  name: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
  permissions?: string
  size?: number
  modified?: string
}

const initialFileSystem: FileNode = {
  name: '/',
  type: 'directory',
  children: [
    {
      name: 'home',
      type: 'directory',
      children: [
        {
          name: 'user',
          type: 'directory',
          permissions: 'rwxr-xr-x',
          children: [
            { name: 'documents', type: 'directory', permissions: 'rwxr-xr-x', children: [
              { name: 'report.txt', type: 'file', content: 'Q4 Revenue Report\n\nTotal: $1,234,567\nGrowth: 23%\nTarget: $1,200,000', size: 128, modified: '2025-01-15' },
              { name: 'notes.md', type: 'file', content: '# Meeting Notes\n\n- Project kickoff on Monday\n- Review timeline\n- Assign responsibilities', size: 256, modified: '2025-01-14' },
            ]},
            { name: 'downloads', type: 'directory', permissions: 'rwxr-xr-x', children: [
              { name: 'installer.deb', type: 'file', size: 45000000, modified: '2025-01-10' },
              { name: 'data.csv', type: 'file', content: 'id,name,value\n1,alpha,100\n2,beta,200\n3,gamma,300', size: 1024, modified: '2025-01-12' },
            ]},
            { name: '.bashrc', type: 'file', content: 'export PATH=$PATH:/usr/local/bin\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -la"', size: 256, modified: '2024-12-01' },
            { name: '.profile', type: 'file', content: 'if [ -f ~/.bashrc ]; then\n  . ~/.bashrc\nfi', size: 128, modified: '2024-12-01' },
            { name: 'readme.txt', type: 'file', content: 'Welcome to WebLinuxOS!\n\nThis is a simulated Linux environment.\nTry commands like: ls, cd, cat, echo, mkdir, touch, etc.', size: 256, modified: '2025-01-01' },
          ],
        },
      ],
    },
    {
      name: 'etc',
      type: 'directory',
      children: [
        { name: 'hostname', type: 'file', content: 'weblinux', size: 16 },
        { name: 'os-release', type: 'file', content: 'NAME="WebLinuxOS"\nVERSION="1.0.0"\nID=weblinux', size: 64 },
        { name: 'passwd', type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash', size: 128 },
      ],
    },
    {
      name: 'usr',
      type: 'directory',
      children: [
        { name: 'bin', type: 'directory', children: [] },
        { name: 'lib', type: 'directory', children: [] },
        { name: 'share', type: 'directory', children: [] },
      ],
    },
    {
      name: 'tmp',
      type: 'directory',
      children: [
        { name: '.sock', type: 'file', size: 0 },
      ],
    },
    {
      name: 'var',
      type: 'directory',
      children: [
        { name: 'log', type: 'directory', children: [
          { name: 'syslog', type: 'file', content: '[2025-01-15 10:30:00] System started\n[2025-01-15 10:30:01] Services loaded\n[2025-01-15 10:30:02] Ready', size: 256 },
        ]},
      ],
    },
  ],
}

const COMMAND_DOCS: Record<string, { usage: string; examples: string[]; desc: string }> = {
  ls: { usage: 'ls [options] [path]', desc: '列出目录内容', examples: ['ls', 'ls -la', 'ls /home/user', 'ls -lhS'] },
  cd: { usage: 'cd [directory]', desc: '切换目录', examples: ['cd', 'cd /home/user', 'cd ..', 'cd ~/documents'] },
  pwd: { usage: 'pwd', desc: '显示当前工作目录', examples: ['pwd'] },
  cat: { usage: 'cat [file]', desc: '查看文件内容', examples: ['cat readme.txt', 'cat /etc/hostname'] },
  echo: { usage: 'echo [text]', desc: '输出文本', examples: ['echo Hello World', 'echo $HOME', 'echo "Line1\\nLine2"'] },
  mkdir: { usage: 'mkdir [directory]', desc: '创建目录', examples: ['mkdir newfolder', 'mkdir -p a/b/c'] },
  touch: { usage: 'touch [file]', desc: '创建空文件或更新时间戳', examples: ['touch file.txt', 'touch -d "2025-01-01" file.txt'] },
  rm: { usage: 'rm [options] [file]', desc: '删除文件或目录', examples: ['rm file.txt', 'rm -rf folder'] },
  cp: { usage: 'cp [source] [dest]', desc: '复制文件', examples: ['cp file.txt copy.txt', 'cp -r dir1 dir2'] },
  mv: { usage: 'mv [source] [dest]', desc: '移动/重命名文件', examples: ['mv old.txt new.txt', 'mv file.txt ../'] },
  clear: { usage: 'clear', desc: '清除终端屏幕', examples: ['clear'] },
  help: { usage: 'help [command]', desc: '显示命令帮助', examples: ['help', 'help ls'] },
  date: { usage: 'date', desc: '显示当前日期和时间', examples: ['date', 'date +%Y-%m-%d'] },
  whoami: { usage: 'whoami', desc: '显示当前用户名', examples: ['whoami'] },
  uname: { usage: 'uname [options]', desc: '显示系统信息', examples: ['uname -a', 'uname -r'] },
  df: { usage: 'df [options]', desc: '显示磁盘使用情况', examples: ['df -h'] },
  free: { usage: 'free [options]', desc: '显示内存使用情况', examples: ['free -h'] },
  ps: { usage: 'ps [options]', desc: '显示进程信息', examples: ['ps aux'] },
  history: { usage: 'history [n]', desc: '显示命令历史', examples: ['history', 'history 10'] },
  grep: { usage: 'grep [pattern] [file]', desc: '搜索文件内容', examples: ['grep "error" log.txt', 'grep -r "TODO" .'] },
  find: { usage: 'find [path] [expression]', desc: '搜索文件', examples: ['find . -name "*.txt"', 'find / -size +10M'] },
  wc: { usage: 'wc [options] [file]', desc: '统计行数/字数/字符数', examples: ['wc -l file.txt', 'wc file.txt'] },
  head: { usage: 'head [options] [file]', desc: '显示文件前几行', examples: ['head file.txt', 'head -n 5 file.txt'] },
  tail: { usage: 'tail [options] [file]', desc: '显示文件后几行', examples: ['tail file.txt', 'tail -f app.log'] },
  tree: { usage: 'tree [path]', desc: '显示目录树结构', examples: ['tree', 'tree /home'] },
}

function findNode(path: string, root: FileNode): FileNode | null {
  const parts = path.split('/').filter(Boolean)
  let current: FileNode = root
  for (const part of parts) {
    if (current.type !== 'directory') return null
    const next = current.children?.find(c => c.name === part)
    if (!next) return null
    current = next
  }
  return current
}

function resolvePath(input: string, cwd: string): string {
  if (input.startsWith('/')) return input
  if (input === '~' || input.startsWith('~/')) {
    return '/home/user' + input.slice(1)
  }
  const parts = cwd.split('/').filter(Boolean)
  for (const part of input.split('/')) {
    if (part === '..') parts.pop()
    else if (part === '.' || part === '') continue
    else parts.push(part)
  }
  return '/' + parts.join('/')
}

function formatPermissions(node: FileNode): string {
  if (node.permissions) return node.permissions
  return node.type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--'
}

function formatSize(bytes?: number): string {
  if (!bytes) return '0'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}K`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}M`
  return `${(bytes / 1073741824).toFixed(1)}G`
}

export default function LinuxCommandLab() {
  const [fileSystem, setFileSystem] = useState<FileNode>(initialFileSystem)
  const [cwd, setCwd] = useState('/home/user')
  const [history, setHistory] = useState<string[]>([])
  const [output, setOutput] = useState<CommandResult[]>([])
  const [input, setInput] = useState('')
  const [user] = useState('user')
  const [hostname] = useState('weblinux')
  const [showHelp, setShowHelp] = useState(false)
  const [commandIndex, setCommandIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const addOutput = useCallback((command: string, out: string, type: CommandResult['type'] = 'success') => {
    setOutput(prev => [...prev, { command, output: out, type }])
  }, [])

  const executeCommand = useCallback((rawCmd: string) => {
    const trimmed = rawCmd.trim()
    if (!trimmed) return

    setHistory(prev => [...prev, trimmed])
    setCommandIndex(-1)

    const parts = trimmed.split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)

    switch (cmd) {
      case 'help': {
        if (args.length > 0) {
          const doc = COMMAND_DOCS[args[0]]
          if (doc) {
            addOutput(trimmed, `${doc.desc}\n用法: ${doc.usage}\n示例:\n  ${doc.examples.join('\n  ')}`)
          } else {
            addOutput(trimmed, `help: 未知命令 '${args[0]}'`, 'error')
          }
        } else {
          const available = Object.keys(COMMAND_DOCS).sort()
          addOutput(trimmed, `WebLinuxOS 命令帮助 (共 ${available.length} 个命令)\n\n${available.map(c => {
            const doc = COMMAND_DOCS[c]
            return `  ${c.padEnd(12)} ${doc.desc}`
          }).join('\n')}\n\n使用 'help <命令>' 查看详细帮助`, 'info')
          setShowHelp(true)
        }
        break
      }

      case 'ls': {
        const showAll = args.includes('-a')
        const useLong = args.some(a => a.startsWith('-') && a.includes('l'))
        const useHuman = args.some(a => a.startsWith('-') && a.includes('h'))
        const pathArg = args.find(a => !a.startsWith('-')) || cwd
        const targetPath = resolvePath(pathArg, cwd)
        const node = findNode(targetPath, fileSystem)
        if (!node) {
          addOutput(trimmed, `ls: 无法访问 '${pathArg}': 没有那个文件或目录`, 'error')
          break
        }
        if (node.type === 'file') {
          addOutput(trimmed, node.name)
          break
        }
        let children = node.children || []
        if (!showAll) {
          children = children.filter(c => !c.name.startsWith('.'))
        }
        if (useLong) {
          const rows = children.map(c => {
            const perm = formatPermissions(c)
            const num = c.type === 'directory' ? '2' : '1'
            const owner = user
            const group = user
            const size = useHuman ? formatSize(c.size) : String(c.size || 0)
            const date = c.modified || 'Jan  1 2025'
            const name = c.type === 'directory' ? `${c.name}/` : c.name
            return `${perm} ${num} ${owner} ${group} ${size.padStart(6)} ${date} ${name}`
          })
          addOutput(trimmed, `total ${children.length}\n${rows.join('\n')}`)
        } else {
          const names = children.map(c => c.type === 'directory' ? `\x1b[34m${c.name}/\x1b[0m` : c.name)
          addOutput(trimmed, names.join('  '))
        }
        break
      }

      case 'cd': {
        const pathArg = args[0] || '~'
        const newPath = resolvePath(pathArg, cwd)
        const node = findNode(newPath, fileSystem)
        if (!node) {
          addOutput(trimmed, `cd: 没有那个文件或目录`, 'error')
        } else if (node.type !== 'directory') {
          addOutput(trimmed, `cd: '${pathArg}' 不是目录`, 'error')
        } else {
          setCwd(newPath)
          addOutput(trimmed, '', 'success')
        }
        break
      }

      case 'pwd':
        addOutput(trimmed, cwd)
        break

      case 'cat': {
        if (args.length === 0) {
          addOutput(trimmed, 'cat: 缺少文件操作数', 'error')
          break
        }
        const results: string[] = []
        for (const arg of args) {
          const targetPath = resolvePath(arg, cwd)
          const node = findNode(targetPath, fileSystem)
          if (!node) {
            results.push(`cat: ${arg}: 没有那个文件或目录`)
          } else if (node.type === 'directory') {
            results.push(`cat: ${arg}: 是一个目录`)
          } else {
            results.push(node.content || '')
          }
        }
        addOutput(trimmed, results.join('\n'), results.some(r => r.includes('没有')) ? 'error' : 'success')
        break
      }

      case 'echo': {
        const text = args.join(' ')
        const expanded = text.replace(/\$HOME/g, '/home/user').replace(/\$USER/g, user).replace(/\$PWD/g, cwd)
        addOutput(trimmed, expanded)
        break
      }

      case 'mkdir': {
        if (args.length === 0) {
          addOutput(trimmed, 'mkdir: 缺少操作数', 'error')
          break
        }
        const makeParents = args.includes('-p')
        const targets = args.filter(a => a !== '-p')
        const newFs = { ...fileSystem }
        let success = true
        for (const target of targets) {
          const targetPath = resolvePath(target, cwd)
          const pathParts = targetPath.split('/').filter(Boolean)
          let current: FileNode = newFs
          for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i]
            if (current.type !== 'directory') {
              success = false
              break
            }
            let child = current.children?.find(c => c.name === part)
            if (!child) {
              if (i === pathParts.length - 1) {
                child = { name: part, type: 'directory', permissions: 'rwxr-xr-x', children: [] }
                current.children = [...(current.children || []), child]
              } else if (makeParents) {
                child = { name: part, type: 'directory', permissions: 'rwxr-xr-x', children: [] }
                current.children = [...(current.children || []), child]
              } else {
                success = false
                break
              }
            }
            current = child
          }
        }
        if (success) {
          setFileSystem(newFs)
          addOutput(trimmed, '')
        } else {
          addOutput(trimmed, `mkdir: 无法创建目录`, 'error')
        }
        break
      }

      case 'touch': {
        if (args.length === 0) {
          addOutput(trimmed, 'touch: 缺少操作数', 'error')
          break
        }
        const newFs = JSON.parse(JSON.stringify(fileSystem))
        for (const target of args) {
          const targetPath = resolvePath(target, cwd)
          const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/'
          const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1)
          const parent = findNode(parentPath, newFs)
          if (parent && parent.type === 'directory') {
            const existing = parent.children?.find(c => c.name === fileName)
            if (!existing) {
              parent.children = [...(parent.children || []), {
                name: fileName, type: 'file', content: '', size: 0, modified: new Date().toISOString().split('T')[0]
              }]
            } else {
              existing.modified = new Date().toISOString().split('T')[0]
            }
          }
        }
        setFileSystem(newFs)
        addOutput(trimmed, '')
        break
      }

      case 'rm': {
        const recursive = args.some(a => a.startsWith('-') && a.includes('r'))
        const targets = args.filter(a => !a.startsWith('-'))
        if (targets.length === 0) {
          addOutput(trimmed, 'rm: 缺少操作数', 'error')
          break
        }
        const newFs = JSON.parse(JSON.stringify(fileSystem))
        for (const target of targets) {
          const targetPath = resolvePath(target, cwd)
          const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/'
          const name = targetPath.substring(targetPath.lastIndexOf('/') + 1)
          const parent = findNode(parentPath, newFs)
          if (parent && parent.type === 'directory') {
            const node = parent.children?.find(c => c.name === name)
            if (node) {
              if (node.type === 'directory' && !recursive) {
                addOutput(trimmed, `rm: 无法删除 '${target}': 是一个目录`, 'error')
              } else {
                parent.children = (parent.children || []).filter(c => c.name !== name)
              }
            }
          }
        }
        setFileSystem(newFs)
        addOutput(trimmed, '')
        break
      }

      case 'clear':
        setOutput([])
        break

      case 'date':
        addOutput(trimmed, new Date().toString())
        break

      case 'whoami':
        addOutput(trimmed, user)
        break

      case 'uname':
        if (args.includes('-a')) {
          addOutput(trimmed, 'WebLinuxOS weblinux 1.0.0 #1 SMP x86_64 GNU/Linux')
        } else if (args.includes('-r')) {
          addOutput(trimmed, '1.0.0')
        } else {
          addOutput(trimmed, 'WebLinuxOS')
        }
        break

      case 'df':
        addOutput(trimmed, 'Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/root       10240000 5242880   4997120  52% /\ntmpfs            512000      12    511988   1% /tmp\n/dev/sda1        2048000  102400   1945600   5% /home')
        break

      case 'free':
        addOutput(trimmed, '              total        used        free      shared  buff/cache   available\nMem:        2048000     524288    1048576      12288     475136    1523712\nSwap:        524288           0      524288')
        break

      case 'ps':
        addOutput(trimmed, '  PID TTY          TIME CMD\n    1 ?        00:00:00 systemd\n  128 ?        00:00:00 bash\n  256 ?        00:00:00 python3\n  512 pts/0    00:00:00 node\n 1024 pts/0    00:00:00 ps')
        break

      case 'history': {
        const n = args[0] ? parseInt(args[0]) : history.length
        const h = history.slice(-n)
        addOutput(trimmed, h.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n'))
        break
      }

      case 'tree': {
        const targetPath = args[0] ? resolvePath(args[0], cwd) : cwd
        const node = findNode(targetPath, fileSystem)
        if (!node) {
          addOutput(trimmed, `tree: ${args[0]}: 没有那个目录`, 'error')
          break
        }
        const renderTree = (n: FileNode, prefix: string, isLast: boolean, depth: number): string => {
          if (depth > 3) return ''
          let result = prefix + (isLast ? '└── ' : '├── ') + n.name + '\n'
          if (n.type === 'directory' && n.children) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ')
            n.children.forEach((child, i) => {
              result += renderTree(child, newPrefix, i === n.children!.length - 1, depth + 1)
            })
          }
          return result
        }
        let treeOutput = targetPath + '\n'
        if (node.type === 'directory' && node.children) {
          node.children.forEach((child, i) => {
            treeOutput += renderTree(child, '', i === node.children!.length - 1, 0)
          })
        }
        treeOutput += `\n${node.children?.length || 0} directories, ${(node.children || []).filter(c => c.type === 'file').length} files`
        addOutput(trimmed, treeOutput)
        break
      }

      case 'grep': {
        if (args.length < 2) {
          addOutput(trimmed, '用法: grep <pattern> <file>', 'error')
          break
        }
        const pattern = args[0]
        const fileArg = args[1]
        const targetPath = resolvePath(fileArg, cwd)
        const node = findNode(targetPath, fileSystem)
        if (!node) {
          addOutput(trimmed, `grep: ${fileArg}: 没有那个文件`, 'error')
          break
        }
        const content = node.content || ''
        const lines = content.split('\n').filter(l => l.toLowerCase().includes(pattern.toLowerCase()))
        addOutput(trimmed, lines.length > 0 ? lines.join('\n') : '', lines.length === 0 ? 'info' : 'success')
        break
      }

      case 'wc': {
        if (args.length === 0) {
          addOutput(trimmed, 'wc: 缺少文件操作数', 'error')
          break
        }
        const node = findNode(resolvePath(args[0], cwd), fileSystem)
        if (!node || node.type !== 'file') {
          addOutput(trimmed, `wc: ${args[0]}: 没有那个文件`, 'error')
          break
        }
        const content = node.content || ''
        const lines = content.split('\n').length
        const words = content.split(/\s+/).filter(Boolean).length
        const chars = content.length
        addOutput(trimmed, `${lines} ${words} ${chars} ${args[0]}`)
        break
      }

      case 'head': {
        if (args.length === 0) {
          addOutput(trimmed, 'head: 缺少文件操作数', 'error')
          break
        }
        const node = findNode(resolvePath(args[args.length - 1], cwd), fileSystem)
        if (!node || node.type !== 'file') {
          addOutput(trimmed, `head: ${args[args.length - 1]}: 没有那个文件`, 'error')
          break
        }
        const content = node.content || ''
        const lines = content.split('\n').slice(0, 10).join('\n')
        addOutput(trimmed, lines)
        break
      }

      case 'tail': {
        if (args.length === 0) {
          addOutput(trimmed, 'tail: 缺少文件操作数', 'error')
          break
        }
        const node = findNode(resolvePath(args[args.length - 1], cwd), fileSystem)
        if (!node || node.type !== 'file') {
          addOutput(trimmed, `tail: ${args[args.length - 1]}: 没有那个文件`, 'error')
          break
        }
        const content = node.content || ''
        const lines = content.split('\n').slice(-10).join('\n')
        addOutput(trimmed, lines)
        break
      }

      case 'cp':
      case 'mv':
        addOutput(trimmed, `${cmd}: 文件系统操作已模拟（演示环境）`, 'info')
        break

      case 'exit':
      case 'logout':
        addOutput(trimmed, '退出 WebLinuxOS Shell', 'info')
        break

      default:
        addOutput(trimmed, `${cmd}: 命令未找到。使用 'help' 查看可用命令列表`, 'error')
    }
  }, [fileSystem, cwd, history, user, addOutput])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    executeCommand(input)
    setInput('')
  }, [input, executeCommand])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = commandIndex === -1 ? history.length - 1 : Math.max(0, commandIndex - 1)
        setCommandIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (commandIndex === -1) return
      const newIndex = commandIndex + 1
      if (newIndex >= history.length) {
        setCommandIndex(-1)
        setInput('')
      } else {
        setCommandIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const parts = input.split(/\s+/)
      const last = parts[parts.length - 1]
      const matches = Object.keys(COMMAND_DOCS).filter(c => c.startsWith(last))
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0]
        setInput(parts.join(' '))
      }
    }
  }, [input, history, commandIndex])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const copyOutput = useCallback(async () => {
    const text = output.map(o => `${user}@${hostname}:${cwd}$ ${o.command}\n${o.output}`).join('\n')
    await navigator.clipboard.writeText(text)
  }, [output, cwd])

  const prompt = `${user}@${hostname}:${cwd.replace('/home/user', '~')}$`
  void prompt

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      color: '#e0e0e0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <Terminal size={16} color="#4ade80" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>WebLinuxOS Shell</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>交互式命令行环境</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={12} /> 命令列表
          </button>
          <button
            onClick={copyOutput}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Copy size={12} /> 复制
          </button>
          <button
            onClick={() => setOutput([])}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} /> 清空
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        <div
          ref={terminalRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            flex: 1,
            padding: '16px',
            overflow: 'auto',
            cursor: 'text',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 12, color: '#4ade80' }}>
            欢迎使用 <strong>WebLinuxOS Shell v1.0</strong>
          </div>
          <div style={{ marginBottom: 16, color: '#64748b', fontSize: 12 }}>
            输入 <span style={{ color: '#4ade80' }}>help</span> 查看所有可用命令。支持 Tab 补全和上下箭头历史。
          </div>

          {output.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 4 }}>
              <div style={{ color: '#94a3b8' }}>
                <span style={{ color: '#4ade80' }}>{user}@{hostname}</span>
                <span style={{ color: '#64748b' }}>:</span>
                <span style={{ color: '#60a5fa' }}>{cwd.replace('/home/user', '~')}</span>
                <span style={{ color: '#64748b' }}>$</span>
                <span style={{ marginLeft: 6 }}>{item.command}</span>
              </div>
              {item.output && (
                <pre style={{
                  margin: 0,
                  padding: '4px 0 4px 0',
                  color: item.type === 'error' ? '#fca5a5' : item.type === 'info' ? '#93c5fd' : '#e0e0e0',
                  whiteSpace: 'pre-wrap',
                  fontSize: 12,
                  fontFamily: 'inherit',
                }}>{item.output}</pre>
              )}
            </div>
          ))}

          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <span style={{ color: '#4ade80', whiteSpace: 'nowrap' }}>{user}@{hostname}</span>
            <span style={{ color: '#64748b' }}>:</span>
            <span style={{ color: '#60a5fa' }}>{cwd.replace('/home/user', '~')}</span>
            <span style={{ color: '#64748b', marginRight: 4 }}>$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e0e0e0',
                fontSize: 13,
                fontFamily: 'inherit',
                caretColor: '#4ade80',
              }}
              placeholder=""
            />
            <span style={{
              width: 8,
              height: 16,
              background: '#4ade80',
              animation: 'blink 1s step-end infinite',
            }} />
          </form>
        </div>

        {showHelp && (
          <div style={{
            width: 300,
            padding: '16px',
            background: 'rgba(0,0,0,0.4)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={16} color="#60a5fa" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>命令速查</span>
            </div>
            {Object.entries(COMMAND_DOCS).map(([cmd, doc]) => (
              <div
                key={cmd}
                onClick={() => setInput(cmd)}
                style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                  transition: 'background 0.2s',
                  fontSize: 12,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChevronRight size={10} color="#64748b" />
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{cmd}</span>
                </div>
                <div style={{ marginLeft: 16, color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{doc.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        padding: '6px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#64748b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={11} /> {user}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HardDrive size={11} /> /dev/sda1
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wifi size={11} /> 已连接
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Battery size={11} /> 87%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>当前: {cwd}</span>
          <span>历史: {history.length} 条</span>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  )
}
