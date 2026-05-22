import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore, findNodeByPath, resolvePath } from '../store'
import type { FileNode } from '../types'

interface HistoryEntry {
  input: string
  output: string
}

const COMMANDS = [
  'help', 'clear', 'pwd', 'whoami', 'hostname', 'date', 'uname', 'lsb_release',
  'neofetch', 'ls', 'cd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv',
  'tree', 'wc', 'which', 'uptime', 'cal', 'env', 'export', 'alias', 'type',
  'man', 'find', 'grep', 'ps', 'top', 'df', 'free', 'history', 'ping', 'ifconfig',
  'curl', 'exit', 'dashboard'
]

function listDir(files: FileNode[], path: string): string {
  const node = findNodeByPath(files, path)
  if (!node || node.type !== 'folder') return `ls: 无法访问'${path}': 没有那个文件或目录`
  if (!node.children || node.children.length === 0) return ''
  const escapeChar = String.fromCharCode(27)
  const items = node.children.map((c) => {
    const color = c.type === 'folder' ? `${escapeChar}[34m` : `${escapeChar}[0m`
    return `${color}${c.name}${escapeChar}[0m`
  })
  return items.join('  ')
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

  const searchHistory = useCallback((query: string): string[] => {
    if (!query) return cmdHistory
    return cmdHistory.filter(cmd => cmd.toLowerCase().includes(query.toLowerCase()))
  }, [cmdHistory])

  const getCompletions = useCallback((partial: string): string[] => {
    const trimmed = partial.trim()
    if (!trimmed) return []
    
    const parts = trimmed.split(/\s+/)
    if (parts.length === 1) {
      return COMMANDS.filter(cmd => cmd.startsWith(parts[0]))
    } else if (parts[0] === 'cd' || parts[0] === 'cat' || parts[0] === 'rm' || parts[0] === 'ls') {
      const currentPartial = parts[parts.length - 1]
      const currentFiles = findNodeByPath(files, cwd)?.children || []
      const matches = currentFiles.filter((f: FileNode) => f.name.startsWith(currentPartial)).map((f: FileNode) => f.name)
      if (matches.length === 1) {
        return [parts.slice(0, -1).join(' ') + ' ' + matches[0]]
      }
      return matches
    }
    return []
  }, [files, cwd])

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim()
    const parts = trimmed.split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    let output = ''

    switch (command) {
      case '':
        break
      case 'help':
      case '?':
        output = `可用命令:
  文件操作: ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, wc
  信息查看: whoami, hostname, date, uname, uptime, cal, free, df, ps, top, dashboard
  网络工具: ping, ifconfig, curl
  系统工具: clear, help, history, neofetch, alias, type, man, exit
  工具命令: echo, find, grep, env, export, pwd

快捷键:
  Ctrl+Shift+L - 切换启动器
  Ctrl+Shift+S - 打开设置
  Ctrl+Shift+F - 打开文件管理器
  Ctrl+Shift+T - 打开终端
  Ctrl+Shift+M - 最大化/还原窗口
  Ctrl+N - 新建终端
  Ctrl+W - 关闭窗口
  Ctrl+M - 最小化窗口
  Ctrl+E - 打开文件管理器
  Ctrl+B - 打开浏览器
  Ctrl+T - 打开文本编辑器
  Ctrl+P - 打开画图
  Ctrl+A - 打开计算器
  F11 - 全屏/还原窗口
  PrintScreen - 打开截图工具
  Ctrl+Alt+Tab - 切换窗口`
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
        if (args.includes('-a')) {
          output = 'Linux web-linux 6.1.0-web #1 SMP PREEMPT_DYNAMIC ' + new Date().toISOString().slice(0, 10) + ' x86_64 GNU/Linux'
        } else if (args.includes('-r')) {
          output = '6.1.0-web'
        } else if (args.includes('-s')) {
          output = 'Linux'
        } else if (args.includes('-n')) {
          output = 'web-linux'
        } else if (args.includes('-m')) {
          output = 'x86_64'
        } else {
          output = 'Linux'
        }
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
        const showAll = args.includes('-a') || args.includes('-l')
        output = listDir(files, target)
        if (showAll) {
          const escapeChar = String.fromCharCode(27)
          output = `${escapeChar}[34m.\n${escapeChar}[34m..\n` + output
        }
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
      case 'cp': {
        if (args.length < 2) {
          output = 'cp: 缺少操作数\n用法: cp 源文件 目标路径'
        } else {
          const source = resolvePath(cwd, args[0])
          const target = resolvePath(cwd, args[1])
          const sourceNode = findNodeByPath(files, source)
          const targetNode = findNodeByPath(files, target)
          
          if (!sourceNode) {
            output = `cp: 无法访问'${args[0]}': 没有那个文件或目录`
          } else if (sourceNode.type === 'folder' && targetNode?.type === 'folder') {
            copyFile(sourceNode.id, targetNode.id)
            output = ''
          } else if (sourceNode.type === 'file' && targetNode?.type === 'folder') {
            copyFile(sourceNode.id, targetNode.id)
            output = ''
          } else if (sourceNode.type === 'file' && !targetNode) {
            const parts = target.split('/').filter(Boolean)
            const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
            const fileName = parts[parts.length - 1]
            const parentNode = findNodeByPath(files, parentPath)
            if (parentNode) {
              copyFile(sourceNode.id, parentNode.id)
              const updatedFiles = useStore.getState().files
              const newFile = findNodeByPath(updatedFiles, target)
              if (newFile) {
                useStore.getState().renameFile(newFile.id, fileName)
              }
              output = ''
            } else {
              output = `cp: 无法创建'${args[1]}': 没有那个文件或目录`
            }
          } else {
            output = `cp: 无法复制'${args[0]}': 无效的目标`
          }
        }
        break
      }
      case 'mv': {
        if (args.length < 2) {
          output = 'mv: 缺少操作数\n用法: mv 源文件 目标路径'
        } else {
          const source = resolvePath(cwd, args[0])
          const target = resolvePath(cwd, args[1])
          const sourceNode = findNodeByPath(files, source)
          const targetNode = findNodeByPath(files, target)
          
          if (!sourceNode) {
            output = `mv: 无法访问'${args[0]}': 没有那个文件或目录`
          } else if (sourceNode.type === 'folder' && targetNode?.type === 'folder') {
            moveFile(sourceNode.id, targetNode.id)
            output = ''
          } else if (sourceNode.type === 'file' && targetNode?.type === 'folder') {
            moveFile(sourceNode.id, targetNode.id)
            output = ''
          } else if (sourceNode.type === 'file' && !targetNode) {
            const parts = target.split('/').filter(Boolean)
            const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
            const fileName = parts[parts.length - 1]
            const parentNode = findNodeByPath(files, parentPath)
            if (parentNode) {
              moveFile(sourceNode.id, parentNode.id)
              const updatedFiles = useStore.getState().files
              const movedFile = findNodeByPath(updatedFiles, target)
              if (movedFile) {
                useStore.getState().renameFile(movedFile.id, fileName)
              }
              output = ''
            } else {
              output = `mv: 无法移动'${args[1]}': 没有那个文件或目录`
            }
          } else {
            output = `mv: 无法移动'${args[0]}': 无效的目标`
          }
        }
        break
      }
      case 'tree': {
        const target = args[0] ? resolvePath(cwd, args[0]) : cwd
        const node = findNodeByPath(files, target)
        if (node && node.type === 'folder') {
          const buildTree = (n: FileNode, prefix = '', isLast = true): string => {
            const connector = isLast ? '└── ' : '├── '
            let result = prefix + connector + n.name + (n.type === 'folder' ? '/' : '') + '\n'
            if (n.children) {
              const newPrefix = prefix + (isLast ? '    ' : '│   ')
              n.children.forEach((child, idx) => {
                result += buildTree(child, newPrefix, idx === n.children!.length - 1)
              })
            }
            return result
          }
          output = target + '/\n' + (node.children || []).map((child, idx) => 
            buildTree(child, '', idx === (node.children?.length || 0) - 1)
          ).join('')
        } else {
          output = `tree: ${args[0] || target}: 没有那个文件或目录`
        }
        break
      }
      case 'wc': {
        if (args.length === 0) {
          output = 'wc: 缺少操作数'
        } else {
          const resolved = resolvePath(cwd, args[0])
          const node = findNodeByPath(files, resolved)
          if (node && node.type === 'file') {
            const lines = (node.content || '').split('\n').length
            const words = (node.content || '').split(/\s+/).filter(w => w).length
            const chars = (node.content || '').length
            output = `  ${lines}  ${words}  ${chars} ${node.name}`
          } else {
            output = `wc: ${args[0]}: 没有那个文件或目录`
          }
        }
        break
      }
      case 'which': {
        if (args.length === 0) {
          output = 'which: 缺少操作数'
        } else {
          const commands = ['ls', 'cd', 'pwd', 'cat', 'echo', 'help', 'date', 'whoami', 'uname', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'find', 'grep', 'ps', 'top', 'df', 'free', 'history', 'neofetch', 'tree', 'wc', 'ping', 'uptime', 'cal', 'clear']
          if (commands.includes(args[0])) {
            output = `/usr/bin/${args[0]}`
          } else {
            output = `${args[0]}: 未找到命令`
          }
        }
        break
      }
      case 'uptime':
        output = `${new Date().toLocaleString('zh-CN')} - 系统运行中\n负载平均值: ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}`
        break
      case 'cal': {
        const now = new Date()
        const year = args[0] ? parseInt(args[0]) : now.getFullYear()
        const month = args[1] ? parseInt(args[1]) : now.getMonth() + 1
        const daysInMonth = new Date(year, month, 0).getDate()
        const firstDay = new Date(year, month - 1, 1).getDay()
        output = `     ${year}年 ${month}月\n日 一 二 三 四 五 六\n${'   '.repeat(firstDay)}`
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = (firstDay + day - 1) % 7
          const prefix = dayOfWeek === 0 && day > 1 ? '\n' : ''
          output += `${prefix}${day.toString().padStart(2)} `
        }
        output += '\n'
        break
      }
      case 'env':
        output = `HOME=/home/${username}\nUSER=${username}\nSHELL=/bin/bash\nPWD=${cwd}\nHOSTNAME=${hostname}\nTERM=xterm-256color`
        break
      case 'export': {
        if (args.length === 0) {
          output = `HOME=/home/${username}\nUSER=${username}\nSHELL=/bin/bash\nPWD=${cwd}\nHOSTNAME=${hostname}`
        } else {
          output = `已设置环境变量: ${args.join(' ')}`
        }
        break
      }
      case 'alias':
        if (args.length === 0) {
          output = '未定义别名'
        } else {
          output = `alias ${args[0]}='${args.slice(1).join(' ')}'`
        }
        break
      case 'dashboard':
        output = [
          `╔══════════════════════════════════════════════════════════╗`,
          `║           Web Linux System Dashboard                    ║`,
          `╠══════════════════════════════════════════════════════════╣`,
          `║  主机名: ${hostname.padEnd(42)}║`,
          `║  用户名: ${username.padEnd(42)}║`,
          `║  当前时间: ${new Date().toLocaleString('zh-CN').padEnd(35)}║`,
          `║  系统运行时间: ${Math.floor(Math.random() * 24)} 小时 ${Math.floor(Math.random() * 60)} 分钟${' '.repeat(23)}║`,
          `╠══════════════════════════════════════════════════════════╣`,
          `║  CPU: WebAssembly x86_64 (模拟)                         ║`,
          `║  内存: ${Math.floor(Math.random() * 4000 + 4000)}MB / ${Math.floor(Math.random() * 2000 + 6000)}MB${' '.repeat(25)}║`,
          `║  磁盘: ${Math.floor(Math.random() * 30 + 10)}% 使用中${' '.repeat(31)}║`,
          `║  负载: ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 2).toFixed(2)}${' '.repeat(29)}║`,
          `╠══════════════════════════════════════════════════════════╣`,
          `║  活动窗口: ${useStore.getState().windows.length} 个${' '.repeat(32)}║`,
          `║  主题: ${theme === 'dark' ? '深色' : '浅色'.padEnd(42)}║`,
          `╚══════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      case 'type': {
        if (args.length === 0) {
          output = 'type: 缺少操作数'
        } else {
          const builtins = ['ls', 'cd', 'pwd', 'echo', 'help', 'date', 'mkdir', 'touch', 'rm', 'cat', 'clear']
          if (builtins.includes(args[0])) {
            output = `${args[0]} 是 shell 内建命令`
          } else {
            output = `${args[0]}: 未找到`
          }
        }
        break
      }
      case 'man': {
        if (args.length === 0) {
          output = 'what manual page do you want?\n例如: man ls, man cd, man cat'
        } else {
          output = `Manual page ${args[0]}(1)\n\nNAME\n       ${args[0]} - ${args[0]} 命令的手册页\n\nSYNOPSIS\n       ${args[0]} [OPTION]... [FILE]...\n\nDESCRIPTION\n       显示 ${args[0]} 命令的帮助信息。`
        }
        break
      }
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
        if (args.length > 0 && args[0] === '-c') {
          setCmdHistory([])
          output = '历史记录已清除'
        } else if (args.length > 0) {
          const searchTerm = args[0].replace(/^-+/, '')
          const results = searchHistory(searchTerm)
          output = results.length > 0
            ? results.map((h, i) => `  ${i + 1}  ${h}`).join('\n')
            : `未找到包含 "${searchTerm}" 的命令`
        } else {
          output = cmdHistory.map((h, i) => `  ${i + 1}  ${h}`).join('\n')
        }
        break
      case 'ping':
        if (args.length === 0) {
          output = 'ping: 用法: ping 目标地址'
        } else {
          const times = []
          for (let i = 0; i < 4; i++) {
            times.push(`${(Math.random() * 30 + 10).toFixed(2)} ms`)
          }
          output = `PING ${args[0]} 56(84) bytes of data.\n64 bytes from ${args[0]}: icmp_seq=1 ttl=64 time=${times[0]}\n64 bytes from ${args[0]}: icmp_seq=2 ttl=64 time=${times[1]}\n64 bytes from ${args[0]}: icmp_seq=3 ttl=64 time=${times[2]}\n64 bytes from ${args[0]}: icmp_seq=4 ttl=64 time=${times[3]}\n\n--- ${args[0]} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`
        }
        break
      case 'ifconfig':
        output = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe8e:8aa8  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:8e:8a:a8  txqueuelen 1000  (Ethernet)
        RX packets 12345  bytes 12345678 (11.7 MiB)
        TX packets 5432  bytes 987654 (964.5 KiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 234  bytes 23456 (22.9 KiB)
        TX packets 234  bytes 23456 (22.9 KiB)`
        break
      case 'curl':
        if (args.length === 0) {
          output = 'curl: 请指定 URL'
        } else {
          output = `<!DOCTYPE html>
<html>
<head><title>WebLinuxOS Test</title></head>
<body>
  <h1>Hello from WebLinuxOS!</h1>
  <p>You requested: ${args[0]}</p>
</body>
</html>`
        }
        break
      case 'exit':
      case 'quit':
      case 'q':
        output = 'Exiting terminal... (closing window)'
        setTimeout(() => {
          const state = useStore.getState()
          const thisWindow = state.windows.find(w => w.appId === 'terminal' && w.focused)
          if (thisWindow) {
            state.closeWindow(thisWindow.id)
          }
        }, 500)
        break
      default:
        output = `bash: ${command}: 未找到命令 (输入 'help' 查看可用命令)`
    }

    setHistory((prev) => [...prev, { input: trimmed, output }])
  }, [cwd, files, addFile, deleteFile, copyFile, moveFile, cmdHistory, theme, username, hostname, searchHistory])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      const cmd = input.trim()
      if (cmd) {
        setCmdHistory((prev) => {
          const filtered = prev.filter(c => c !== cmd)
          return [...filtered, cmd]
        })
        setHistoryIndex(-1)
      }
      setHistory((prev) => [...prev, { input: `^C`, output: '' }])
      setInput('')
      return
    }
    
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault()
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          setInput(prev => prev + text)
        }).catch(() => {
          setInput(prev => prev)
        })
      }
      return
    }
    
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      setHistory([])
      return
    }
    
    if (e.key === 'Enter') {
      const cmd = input.trim()
      if (cmd) {
        setCmdHistory((prev) => {
          const filtered = prev.filter(c => c !== cmd)
          return [...filtered, cmd]
        })
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
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const completions = getCompletions(input)
      if (completions.length === 1) {
        setInput(completions[0])
      } else if (completions.length > 1) {
        setHistory((prev) => [...prev, { 
          input: '', 
          output: completions.join('  ') 
        }])
      }
    }
  }

  return (
    <div className="app-container app-terminal" style={{ 
      background: theme === 'light' ? '#f0f0f0' : '#1e1e1e', 
      color: theme === 'light' ? '#000000' : '#00ff00', 
      fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace', 
      fontSize: 14, 
      overflow: 'hidden' 
    }} onClick={() => inputRef.current?.focus()}>
      <div
        ref={containerRef}
        className="app-terminal-output"
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
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
    </div>
  )
}