import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore, findNodeByPath, resolvePath } from '../store'
import type { FileNode, WindowState } from '../types'
import type { PyodideInterface } from 'pyodide'

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

const COMMANDS = [
  'help', 'clear', 'pwd', 'whoami', 'ls', 'cd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv',
  'history', 'neofetch', 'weather', 'git', 'npm', 'node', 'python', 'python3',
  'exit', 'date', 'hostname', 'uname', 'lsb_release',
  'tree', 'wc', 'which', 'uptime', 'cal', 'env', 'export', 'alias', 'type',
  'man', 'find', 'grep', 'ps', 'top', 'df', 'free', 'ping', 'ifconfig',
  'curl', 'dashboard', 'docker', 'kubectl', 'ssh', 'scp', 'rsync',
  'tar', 'zip', 'unzip', 'diff', 'sort', 'uniq', 'head', 'tail',
  'less', 'more', 'xargs', 'sed', 'awk',
  'systemctl', 'journalctl', 'dmesg', 'lsblk', 'lsof', 'netstat', 'ss',
  'welcome', 'search', 'translate', 'qrcode', 'timer', 'stopwatch',
  'disk-usage', 'process-list', 'network-stats', 'system-info', 'memory-info', 'cpu-info',
  'version', 'credits', 'about', 'todo', 'notes', 'encrypt', 'decrypt',
  'calc', 'prime', 'factor', 'roman', 'base64', 'unbase64', 'hash', 'rev',
  'cowsay', 'cowthink', 'dog', 'fortune', 'sl', 'starwars', 'asciiart', 'matrix', 'figlet', 'banner', 'lolcat', 'bacon'
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
  const renameFile = useStore((s) => s.renameFile)
  const getWindows = useStore((s) => s.windows)
  const closeWindow = useStore((s) => s.closeWindow)
  const theme = useStore((s) => s.theme)

  const [cwd, setCwd] = useState('/home/user')
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

  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filesRef = useLatest(files)
  const renameFileRef = useLatest(renameFile)
  const getWindowsRef = useLatest(getWindows)
  const closeWindowRef = useLatest(closeWindow)

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history])

  // 自动聚焦输入框
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus()
    setTimeout(focusInput, 100)
  }, [])

  // 保存命令历史到localStorage
  useEffect(() => {
    if (cmdHistory.length > 0) {
      localStorage.setItem('weblinux-cmd-history', JSON.stringify(cmdHistory.slice(-100)))
    }
  }, [cmdHistory])

  // 保存别名到localStorage
  useEffect(() => {
    localStorage.setItem('weblinux-aliases', JSON.stringify(aliases))
  }, [aliases])

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

  const executeCommand = useCallback(async (cmd: string) => {
    let trimmed = cmd.trim()
    
    const aliasMatch = trimmed.match(/^(\S+)/)
    if (aliasMatch && aliases[aliasMatch[1]]) {
      trimmed = trimmed.replace(/^\S+/, aliases[aliasMatch[1]])
    }
    
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
  信息查看: whoami, hostname, date, uname, uptime, cal, free, df, ps, top, dashboard, neofetch, weather
  网络工具: ping, ifconfig, curl
  系统工具: clear, help, history, alias, type, man, exit, cls, reset
  工具命令: echo, find, grep, env, export
  趣味命令: cowsay, fortune, sl, starwars, asciiart, dog - 试试这些有趣的小命令!
  加密工具: base64, unbase64, hash, rev - 文本编码解码工具
  数学工具: calc, prime, factor, roman - 计算器和数学工具
  视觉效果: matrix, figlet, lolcat, cowthink, banner - ASCII艺术

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
  Ctrl+Alt+Tab - 切换窗口

更多命令:
  clear / cls / reset - 清空屏幕
  whoami - 显示当前用户
  hostname - 显示主机名
  date - 显示日期时间
  uname - 系统信息
  neofetch - 系统详情
  uptime - 系统运行时间
  cal - 日历
  free - 内存使用
  df - 磁盘使用
  ps - 进程列表
  top - 系统监控
  tree - 目录树
  wc - 统计字数
  history - 命令历史
  ifconfig - 网络信息
  ping - 网络连接测试
  curl - 网页请求
  cowsay <消息> - 让牛说话
  fortune - 显示随机名言
  sl - 火车动画
  starwars - 星球大战ASCII艺术
  asciiart - 随机ASCII艺术
  banner - 横幅文字
  dog - 让狗狗说话!`
        break
      case 'clear':
      case 'cls':
      case 'reset':
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
          output = 'Linux web-linux 6.15.0-web #1 SMP PREEMPT_DYNAMIC ' + new Date().toISOString().slice(0, 10) + ' x86_64 GNU/Linux'
        } else if (args.includes('-r')) {
          output = '6.15.0-web'
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
          ? `Distributor ID: WebLinux\nDescription:    Web Linux 2.9\nRelease:        2.9.0\nCodename:       web`
          : 'Web Linux 2.9'
        break
      case 'neofetch':
        output = [
          `            .-/+oossssoo+/-.               ${username}@${hostname}`,
          `        \`:+ssssssssssssssssss+:\`           -------------`,
          `      -+ssssssssssssssssssssssso+-         OS: WebLinuxOS 2.9.0`,
          `    /osssssssssssssssssssssssssso/        Kernel: 6.15.0-web`,
          `  /ossssssssssssssssssssssssssssso/       Shell: bash 5.2.21`,
          ` :sssssssssssssssssssssssssssssssss:      DE: WebDE 2.9`,
          ` ossssssssssssssssssssssssssssssssso      Theme: ${theme}`,
          ` ossssssssssssssssssssssssssssssssso      Uptime: ${Math.floor(Math.random() * 24)} hours`,
          ` :sssssssssssssssssssssssssssssssss:      Packages: ${Math.floor(Math.random() * 500 + 100)}`,
          `  /ossssssssssssssssssssssssssssso/       Memory: ${Math.floor(Math.random() * 4096 + 1024)}MB / 16384MB`,
          `    /osssssssssssssssssssssssssso/`,
          `      -+ssssssssssssssssssssssso+-`,
          `        \`:+ssssssssssssssssss+:\``,
          `            .-/+oossssoo+/-.`,
        ].join('\n')
        break
      case 'cowsay':
        output = [
          ` _______________________`,
          `< ${args.join(' ') || 'Hello World!'} >`,
          ` -----------------------`,
          `        \\   ^__^`,
          `         \\  (oo)\\_______`,
          `            (__)\\       )\\/\\`,
          `                ||----w |`,
          `                ||     ||`,
        ].join('\n')
        break
      case 'matrix': {
        const matrixLines = []
        for (let i = 0; i < 20; i++) {
          let line = ''
          for (let j = 0; j < 50; j++) {
            line += String.fromCharCode(0x30A0 + Math.random() * 96)
          }
          matrixLines.push(line)
        }
        output = matrixLines.join('\n')
        break
      }
      case 'figlet': {
        const text = args.join(' ') || 'Hello'
        const width = 60
        const pad = Math.max(0, Math.floor((width - text.length * 2) / 2))
        output = [
          ' '.repeat(pad) + text.toUpperCase(),
          ' '.repeat(pad) + '═'.repeat(text.length * 2),
        ].join('\n')
        break
      }
      case 'cowthink':
        output = [
          ` _______________`,
          `( ${args.join(' ') || 'Hmm...'} )`,
          ` ---------------`,
          `        o   ^__^`,
          `         o  (oo)\\_______`,
          `            (__)\\       )\\/\\`,
          `                ||----w |`,
          `                ||     ||`,
        ].join('\n')
        break
      case 'dog':
        output = [
          ` ___________________________`,
          `/ ${args.join(' ') || 'Woof Woof!'} \\`,
          ` ---------------------------`,
          `     \\`,
          `      \\`,
          `        / \\__`,
          `       (    @\\___`,
          `       /         O`,
          `      /   (_____/`,
          `     /_____/   U`,
        ].join('\n')
        break
      case 'calc': {
        const expression = args.join(' ')
        if (!expression) {
          output = [
            `🧮 计算器`,
            ``,
            `用法: calc <数学表达式>`,
            ``,
            `支持的运算符: +, -, *, /, %, **, ()`,
            ``,
            `示例:`,
            `  calc 2 + 3 * 4`,
            `  calc (2 + 3) * 4`,
            `  calc 2 ** 10`,
            `  calc sqrt(16)`,
            `  calc sin(3.14)`,
          ].join('\n')
        } else {
          try {
            const sanitized = expression
              .replace(/sqrt/g, 'Math.sqrt')
              .replace(/sin/g, 'Math.sin')
              .replace(/cos/g, 'Math.cos')
              .replace(/tan/g, 'Math.tan')
              .replace(/log/g, 'Math.log')
              .replace(/log10/g, 'Math.log10')
              .replace(/abs/g, 'Math.abs')
              .replace(/ceil/g, 'Math.ceil')
              .replace(/floor/g, 'Math.floor')
              .replace(/round/g, 'Math.round')
              .replace(/PI/g, 'Math.PI')
              .replace(/E/g, 'Math.E')
            const result = new Function(`return ${sanitized}`)()
            output = `= ${result}`
          } catch (e) {
            output = `calc: 表达式错误 - ${(e as Error).message}`
          }
        }
        break
      }
      case 'prime': {
        const num = parseInt(args[0])
        if (isNaN(num)) {
          output = [
            `🔢 质数检测`,
            ``,
            `用法: prime <数字>`,
            ``,
            `示例:`,
            `  prime 17`,
            `  prime 100`,
          ].join('\n')
        } else {
          const isPrime = (n: number): boolean => {
            if (n <= 1) return false
            if (n <= 3) return true
            if (n % 2 === 0 || n % 3 === 0) return false
            let i = 5
            while (i * i <= n) {
              if (n % i === 0 || n % (i + 2) === 0) return false
              i += 6
            }
            return true
          }
          if (isPrime(num)) {
            output = `${num} 是质数 ✅`
          } else {
            output = `${num} 不是质数 ❌`
          }
        }
        break
      }
      case 'factor': {
        const num = parseInt(args[0])
        if (isNaN(num) || num < 2) {
          output = [
            `🔧 质因数分解`,
            ``,
            `用法: factor <数字>`,
            ``,
            `示例:`,
            `  factor 12`,
            `  factor 100`,
          ].join('\n')
        } else {
          const factors: number[] = []
          let n = num
          while (n % 2 === 0) {
            factors.push(2)
            n /= 2
          }
          let i = 3
          while (i * i <= n) {
            while (n % i === 0) {
              factors.push(i)
              n /= i
            }
            i += 2
          }
          if (n > 2) factors.push(n)
          output = `${num} = ${factors.join(' × ')}`
        }
        break
      }
      case 'roman': {
        const num = parseInt(args[0])
        if (isNaN(num) || num < 1 || num > 3999) {
          output = [
            `🔤 罗马数字转换`,
            ``,
            `用法: roman <数字> (1-3999)`,
            ``,
            `示例:`,
            `  roman 2024`,
            `  roman 1999`,
          ].join('\n')
        } else {
          const romanNumerals = [
            { value: 1000, symbol: 'M' },
            { value: 900, symbol: 'CM' },
            { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' },
            { value: 100, symbol: 'C' },
            { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' },
            { value: 40, symbol: 'XL' },
            { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' },
            { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' },
          ]
          let result = ''
          let n = num
          for (const { value, symbol } of romanNumerals) {
            while (n >= value) {
              result += symbol
              n -= value
            }
          }
          output = `${num} = ${result}`
        }
        break
      }
      case 'base64': {
        const text = args.join(' ')
        if (!text) {
          output = [
            `🔐 Base64 编码`,
            ``,
            `用法: base64 <文本>`,
            ``,
            `示例:`,
            `  base64 Hello World`,
          ].join('\n')
        } else {
          output = btoa(text)
        }
        break
      }
      case 'unbase64': {
        const encoded = args.join(' ')
        if (!encoded) {
          output = [
            `🔓 Base64 解码`,
            ``,
            `用法: unbase64 <编码文本>`,
            ``,
            `示例:`,
            `  unbase64 SGVsbG8gV29ybGQ=`,
          ].join('\n')
        } else {
          try {
            output = atob(encoded)
          } catch {
            output = `unbase64: 无效的 Base64 编码`
          }
        }
        break
      }
      case 'hash': {
        const text = args.join(' ')
        if (!text) {
          output = [
            `🔑 哈希计算`,
            ``,
            `用法: hash <文本>`,
            ``,
            `示例:`,
            `  hash password123`,
          ].join('\n')
        } else {
          let hash = 0
          for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
          }
          output = `MD5-like: ${Math.abs(hash).toString(16).padStart(32, '0')}`
        }
        break
      }
      case 'rev': {
        const text = args.join(' ')
        output = text.split('').reverse().join('') || 'rev: 请提供要反转的文本'
        break
      }
      case 'fortune': {
        const fortunes = [
          `成功不是最终的，失败也不是致命的：重要的是继续前进的勇气。 - Winston Churchill`,
          `生活不是等待风暴过去，而是学会在雨中翩翩起舞。 - Vivian Greene`,
          `唯一不可能的事是你不去尝试。 - Audrey Hepburn`,
          `成功的秘诀在于始终如一地坚持目标。 - Benjamin Disraeli`,
          `不要等待机会，而要创造机会。 - Abraham Lincoln`,
          `人生最大的错误是不断担心会犯错。 - Elbert Hubbard`,
          `每一个不曾起舞的日子，都是对生命的辜负。 - 尼采`,
          `你的时间有限，不要浪费在重复别人的生活上。 - Steve Jobs`,
          `只有那些敢于相信自己内心深处有比现实更大力量的人，才能改变世界。 - J.K. Rowling`,
          `成功的路上并不拥挤，因为坚持的人不多。`,
          `今天的努力是明天的实力。`,
          `相信自己，一切皆有可能。`,
          `知识就是力量。 - Francis Bacon`,
          `时间是最公平的资源，每个人每天都有24小时。`,
          `不要让昨天占据今天太多时间。`,
        ]
        output = fortunes[Math.floor(Math.random() * fortunes.length)]
        break
      }
      case 'sl': {
        output = [
          `      (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @`,
          `   (   )    ) (    )   )  _)\\ /\\_   _)\\ /\\_    )\\ /\\_    )\\ /\\_`,
          `  (@@@@@@)()@@@()()@@@()@@()  @    @()  @   @()  @   @()  @`,
          `  (    )  (_)  (_)  (_)  (_)   )\\  )\\   )\\  )\\   )\\  )\\`,
          `  (@@@@@@  @    @    @    @    @   @    @   @    @   @`,
          `           _)\\  _)\\  _)\\  _)\\  _)\\  _)\\  _)\\  _)\\`,
          ``,
          `🚂 火车经过！`,
        ].join('\n')
        break
      }
      case 'banner': {
        const text = args.join(' ') || 'BANNER'
        const bannerChars: Record<string, string[]> = {
          'A': ['  ██████  ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ '],
          'B': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██   ██  ', ' ██████   '],
          'C': ['  ██████  ', ' ██       ', ' ██       ', ' ██       ', '  ██████  '],
          'D': [' █████    ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' █████    '],
          'E': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ███████  '],
          'F': [' ███████  ', ' ██       ', ' ██████   ', ' ██       ', ' ██       '],
          'G': ['  ██████  ', ' ██       ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
          'H': [' ██   ██  ', ' ██   ██  ', ' ████████ ', ' ██   ██  ', ' ██   ██  '],
          'I': ['  ██████  ', '    ██    ', '    ██    ', '    ██    ', '  ██████  '],
          'J': ['     ████ ', '       ██ ', '       ██ ', ' ██   ██  ', '  █████   '],
          'K': [' ██   ██  ', ' ██  ██   ', ' █████    ', ' ██  ██   ', ' ██   ██  '],
          'L': [' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ███████  '],
          'M': [' ██   ██  ', ' ███ ███  ', ' ██ █ ██  ', ' ██   ██  ', ' ██   ██  '],
          'N': [' ██   ██  ', ' ███  ██  ', ' ██ █ ██  ', ' ██  ███  ', ' ██   ██  '],
          'O': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
          'P': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██       ', ' ██       '],
          'Q': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██  ███  ', '  ██████  '],
          'R': [' ██████   ', ' ██   ██  ', ' ██████   ', ' ██  ██   ', ' ██   ██  '],
          'S': ['  ██████  ', ' ██       ', '  ██████  ', '       ██ ', ' ██████   '],
          'T': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
          'U': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██████  '],
          'V': [' ██   ██  ', ' ██   ██  ', ' ██   ██  ', '  ██ ██   ', '   ███    '],
          'W': [' ██   ██  ', ' ██   ██  ', ' ██ █ ██  ', ' ███ ███  ', ' ██   ██  '],
          'X': [' ██   ██  ', '  ██ ██   ', '   ███    ', '  ██ ██   ', ' ██   ██  '],
          'Y': [' ██   ██  ', '  ██ ██   ', '   ███    ', '    ██    ', '    ██    '],
          'Z': [' ████████ ', '       ██ ', '      ██  ', '    ██    ', ' ████████ '],
          ' ': ['          ', '          ', '          ', '          ', '          '],
          '0': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
          '1': ['    ██    ', '   ███    ', '    ██    ', '    ██    ', ' ███████  '],
          '2': ['  ██████  ', '       ██ ', '  ██████  ', ' ██       ', ' ████████ '],
          '3': ['  ██████  ', '       ██ ', '  ██████  ', '       ██ ', '  ██████  '],
          '4': [' ██    ██ ', ' ██    ██ ', ' ████████ ', '       ██ ', '       ██ '],
          '5': [' ████████ ', ' ██       ', ' ███████  ', '       ██ ', '  ██████  '],
          '6': ['  ██████  ', ' ██       ', ' ███████  ', ' ██    ██ ', '  ██████  '],
          '7': [' ████████ ', '       ██ ', '      ██  ', '     ██   ', '    ██    '],
          '8': ['  ██████  ', ' ██    ██ ', '  ██████  ', ' ██    ██ ', '  ██████  '],
          '9': ['  ██████  ', ' ██    ██ ', '  ███████ ', '       ██ ', '  ██████  '],
        }
        const lines: string[] = ['', '', '', '', '']
        for (const char of text.toUpperCase()) {
          const chars = bannerChars[char] || bannerChars[' ']
          for (let i = 0; i < 5; i++) {
            lines[i] += chars[i] + '  '
          }
        }
        output = lines.join('\n')
        break
      }
      case 'lolcat': {
        const text = args.join(' ') || 'RAINBOW!'
        const colors = ['31', '33', '32', '36', '34', '35']
        const escapeChar = String.fromCharCode(27)
        let result = ''
        for (let i = 0; i < text.length; i++) {
          const color = colors[i % colors.length]
          result += `${escapeChar}[${color}m${text[i]}${escapeChar}[0m`
        }
        output = result
        break
      }
      case 'starwars':
        output = [
          `   ____  ___  ____   ___  ____  ___  ____`,
          `  / __/ / _ \\|_  /  / _ \\/ __ \\/ _ \\/ __/`,
          ` _\\ \\  / ___// /  / , _/ /_/ / , _/ _/  `,
          `/___/ /_/  /___/ /_/|_|\\____/_/|_/___/  `,
          `                                       `,
          `  May the Force be with you!`,
        ].join('\n')
        break
      case 'asciiart': {
        const artIndex = Math.floor(Math.random() * 3)
        const asciiArts = [
          [
            `   _     _`,
            `  (a\\___/a)`,
            ` /         \\`,
            ` \\ =\\   /= /`,
            `  |   ___   |`,
            `  |  (   )  |`,
            `  |___\\_/___|`,
          ],
          [
            `     .----.`,
            `    /      \\`,
            `   |  O  O  |`,
            `   |   __   |`,
            `   |  /  \\  |`,
            `   |  \\__/  |`,
            `   \\        /`,
            `    '------'`,
          ],
          [
            `   ___   ___`,
            `  /   \\ /   \\`,
            ` |  O | | O  |`,
            ` |    | |    |`,
            `  \\  /   \\  /`,
            `   \\/     \\/`,
            `    \\     /`,
            `     \\___/`,
          ],
        ]
        output = asciiArts[artIndex].join('\n')
        break
      }
      case 'welcome':
        output = [
          `🎉 欢迎使用 WebLinuxOS 终端 v2.3!`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📚 新手指南:`,
          ``,
          `1️⃣  基本操作:`,
          `   • ls - 列出文件`,
          `   • cd - 切换目录`,
          `   • cat - 查看文件内容`,
          `   • pwd - 显示当前路径`,
          ``,
          `2️⃣  系统工具:`,
          `   • neofetch - 系统信息`,
          `   • dashboard - 系统仪表盘`,
          `   • sysinfo - 详细信息`,
          `   • top - 进程监控`,
          ``,
          `3️⃣  趣味命令:`,
          `   • cowsay <消息> - 让牛说话`,
          `   • fortune - 随机名言`,
          `   • matrix - 黑客帝国效果`,
          `   • starwars - 星球大战`,
          ``,
          `4️⃣  实用工具:`,
          `   • calc <表达式> - 数学计算`,
          `   • prime <数字> - 质数查询`,
          `   • weather - 天气预报`,
          `   • search <关键词> - 搜索文件`,
          ``,
          `5️⃣  键盘快捷键:`,
          `   • Ctrl+L - 清空终端`,
          `   • ↑/↓ - 命令历史`,
          `   • Tab - 自动补全`,
          `   • Ctrl+C - 中断命令`,
          ``,
          `💡 提示: 输入 "help" 查看所有命令`,
          ``,
          `🔗 常用应用快捷键:`,
          `   • Ctrl+Shift+T - 终端`,
          `   • Ctrl+Shift+F - 文件管理器`,
          `   • Ctrl+Shift+K - 智慧搜索`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `祝你使用愉快! 🎊`,
        ].join('\n')
        break
      case 'version':
        output = [
          `WebLinuxOS 版本信息`,
          ``,
          `  版本:   2.9.0`,
          `  内核:   6.15.0-web`,
          `  架构:   x86_64`,
          `  平台:   WebAssembly`,
          `  发布:   2026-05-25`,
          ``,
          `更多信息请访问: https://github.com/saya-ch/WebLinuxOS`,
        ].join('\n')
        break
      case 'credits':
        output = [
          `🎉 WebLinuxOS 致谢`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          `📦 核心技术栈:`,
          `  • React 19.2.6 - UI框架`,
          `  • TypeScript 6 - 类型系统`,
          `  • Zustand 5 - 状态管理`,
          `  • Vite 8 - 构建工具`,
          `  • Pyodide 0.26 - Python运行时`,
          `  • Lucide React - 图标库`,
          ``,
          `🛠️ 开发工具:`,
          `  • Git - 版本控制`,
          `  • GitHub Pages - 托管部署`,
          `  • Trae AI - 代码优化助手`,
          ``,
          `👨‍💻 贡献者:`,
          `  • saya-ch - 项目发起者和维护者`,
          `  • 所有开源社区贡献者`,
          ``,
          `💝 特别感谢:`,
          `  • React团队`,
          `  • Vite团队`,
          `  • 所有使用和支持WebLinuxOS的用户`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          `📝 许可证: MIT`,
          `🌐 网址: https://github.com/saya-ch/WebLinuxOS`,
        ].join('\n')
        break
      case 'about':
        output = [
          `═══════════════════════════════════════`,
          `         WebLinuxOS 关于`,
          `═══════════════════════════════════════`,
          ``,
          `  WebLinuxOS 是一个功能完整的`,
          `  Web端Linux桌面操作系统模拟器`,
          ``,
          `  版本: 2.9.0`,
          `  发布日期: 2026-05-25`,
          ``,
          `  特性:`,
          `    ✓ 60+ 预装应用程序`,
          `    ✓ 多窗口管理系统`,
          `    ✓ 虚拟文件系统`,
          `    ✓ 终端模拟器`,
          `    ✓ Python运行时支持`,
          `    ✓ 深色/浅色主题`,
          ``,
          `═══════════════════════════════════════`,
        ].join('\n')
        break
      case 'disk-usage':
        output = [
          `╔════════════════════════════════════════════════════════╗`,
          `║              磁盘使用情况                             ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  文件系统        大小      已用      可用    使用%    ║`,
          `║  /dev/sda1      50GB     12GB      38GB     24%     ║`,
          `║  tmpfs          3.9GB    1.2MB     3.9GB     1%     ║`,
          `║  /dev/sda2      20GB     8GB       12GB     40%     ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  总计: 73.9GB    已用: 20GB    可用: 53.9GB           ║`,
          `╚════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      case 'process-list':
        output = [
          `╔════════════════════════════════════════════════════════╗`,
          `║              进程列表                                 ║`,
          `╠═══════════════╦════════╦══════════╦══════════════════╣`,
          `║  PID    │ 用户   │  CPU   │ 内存    │ 进程名           ║`,
          `╠═════════╬════════╬════════╬═════════╬════════════════╣`,
          `║    1    │ root   │  0.0%  │  12MB   │ systemd          ║`,
          `║  234    │ user   │  0.1%  │  45MB   │ terminal         ║`,
          `║  567    │ user   │  1.2%  │ 156MB   │ browser          ║`,
          `║  890    │ user   │  0.3%  │  89MB   │ file-manager     ║`,
          `║ 1023    │ user   │  0.5%  │  67MB   │ code-editor      ║`,
          `║ 1156    │ user   │  0.2%  │  34MB   │ music-player     ║`,
          `╚═════════╩════════╩════════╩═════════╩════════════════╝`,
          ``,
          `总进程数: ${Math.floor(Math.random() * 50 + 100)}`,
        ].join('\n')
        break
      case 'network-stats':
        output = [
          `╔════════════════════════════════════════════════════════╗`,
          `║              网络统计                                 ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  接口     │ 状态    │  接收      │  发送            ║`,
          `╠══════════╬═════════╬═══════════╬═══════════════════╣`,
          `║  eth0    │ UP      │ 12.3MB    │ 4.5MB            ║`,
          `║  lo      │ UP      │ 234KB     │ 234KB            ║`,
          `║  wlan0   │ DOWN    │   -       │   -              ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  TCP连接数: ${Math.floor(Math.random() * 50 + 10)}    │  UDP连接数: ${Math.floor(Math.random() * 30 + 5)}        ║`,
          `║  总接收: 12.5MB        │  总发送: 4.7MB              ║`,
          `╚════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      case 'memory-info': {
        const memTotal = 16384
        const memUsed = Math.floor(memTotal * (0.3 + Math.random() * 0.3))
        const memFree = memTotal - memUsed
        const memBuffers = Math.floor(memUsed * 0.3)
        const memCached = Math.floor(memUsed * 0.4)
        output = [
          `╔════════════════════════════════════════════════════════╗`,
          `║              内存信息                                 ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  总内存:    ${(memTotal / 1024).toFixed(0).padEnd(35)}MB║`,
          `║  已用:     ${(memUsed / 1024).toFixed(0).padEnd(35)}MB║`,
          `║  空闲:     ${(memFree / 1024).toFixed(0).padEnd(35)}MB║`,
          `║  缓冲:     ${(memBuffers / 1024).toFixed(0).padEnd(35)}MB║`,
          `║  缓存:     ${(memCached / 1024).toFixed(0).padEnd(35)}MB║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  交换空间:  ${Math.floor(Math.random() * 2000 + 1000).toString().padEnd(35)}MB║`,
          `║  虚拟内存:  已启用                                   ║`,
          `╚════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      }
      case 'cpu-info':
        output = [
          `╔════════════════════════════════════════════════════════╗`,
          `║              CPU信息                                  ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  型号:     WebAssembly Virtual CPU                     ║`,
          `║  架构:     x86_64                                     ║`,
          `║  核心数:   ${Math.floor(Math.random() * 4 + 4)} 核心                              ║`,
          `║  频率:     ${Math.floor(Math.random() * 1000 + 2000)} MHz (动态)                    ║`,
          `║  缓存:     L1: 32KB  L2: 256KB  L3: 8MB              ║`,
          `╠════════════════════════════════════════════════════════╣`,
          `║  CPU使用率: ${Math.floor(Math.random() * 30 + 10)}%                              ║`,
          `║  用户空间:  ${Math.floor(Math.random() * 15 + 5)}%                              ║`,
          `║  系统空间:  ${Math.floor(Math.random() * 5 + 1)}%                               ║`,
          `║  空闲:     ${Math.floor(Math.random() * 60 + 30)}%                              ║`,
          `╚════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      case 'search': {
        if (args.length === 0) {
          output = 'search: 请提供搜索关键词\n用法: search <关键词>'
        } else {
          const searchTerm = args.join(' ').toLowerCase()
          const searchInTree = (nodes: FileNode[]): FileNode[] => {
            const results: FileNode[] = []
            for (const node of nodes) {
              if (node.name.toLowerCase().includes(searchTerm)) {
                results.push(node)
              }
              if (node.children) {
                results.push(...searchInTree(node.children))
              }
            }
            return results
          }
          const results = searchInTree(files)
          if (results.length === 0) {
            output = `未找到包含 "${args.join(' ')}" 的文件或目录`
          } else {
            output = [
              `找到 ${results.length} 个结果:`,
              '',
              ...results.map(r => {
                const path = (function findPath(node: FileNode, targetId: string, currentPath: string = ''): string | null {
                  if (node.id === targetId) return currentPath
                  if (node.children) {
                    for (const child of node.children) {
                      const result = findPath(child, targetId, currentPath + '/' + node.name)
                      if (result) return result
                    }
                  }
                  return null
                })(files[0], r.id) || '/'
                return `📄 ${r.name} (${r.type === 'folder' ? '目录' : '文件'}) @ ${path}`
              })
            ].join('\n')
          }
        }
        break
      }
      case 'translate':
        if (args.length === 0) {
          output = [
            `🌐 翻译工具`,
            ``,
            `用法: translate <文本>`,
            ``,
            `示例:`,
            `  translate Hello`,
            `  translate Bonjour`,
            ``,
            `💡 这是一个简单的词典翻译工具`,
          ].join('\n')
        } else {
          const commonPhrases: Record<string, string> = {
            'hello': '你好 (中文) / こんにちは (日语) / 안녕하세요 (韩语)',
            'goodbye': '再见 (中文) / さようなら (日语) / 안녕히 가세요 (韩语)',
            'thank you': '谢谢 (中文) / ありがとう (日语) / 감사합니다 (韩语)',
            'yes': '是 (中文) / はい (日语) / 네 (韩语)',
            'no': '否 (中文) / いいえ (日语) / 아니요 (韩语)',
            'good morning': '早上好 (中文) / おはよう (日语) / 좋은 아침 (韩语)',
            'good night': '晚安 (中文) / おやすみ (日语) / 잘 자요 (韩语)',
            'i love you': '我爱你 (中文) / 愛してる (日语) / 사랑해요 (韩语)',
            'how are you': '你好吗 (中文) / 元気ですか (日语) / 어떻게 지내요 (韩语)',
            'welcome': '欢迎 (中文) / ようこそ (日语) / 환영합니다 (韩语)',
          }
          const phrase = args.join(' ').toLowerCase()
          if (commonPhrases[phrase]) {
            output = `🌐 "${args.join(' ')}" 的多语言翻译:\n\n${commonPhrases[phrase]}`
          } else {
            output = `🌐 "${args.join(' ')}"\n\n📝 常见短语翻译示例:\n${Object.entries(commonPhrases).map(([k, v]) => `  • ${k}: ${v.split(' (')[0]}`).join('\n')}\n\n💡 提示: 尝试搜索常见短语`
          }
        }
        break
      case 'qrcode':
        if (args.length === 0) {
          output = [
            `📱 QR码生成器`,
            ``,
            `用法: qrcode <文本或URL>`,
            ``,
            `示例:`,
            `  qrcode https://example.com`,
            `  qrcode 我的名片`,
            ``,
            `💡 QR码可用于快速分享链接和文本`,
          ].join('\n')
        } else {
          const text = args.join(' ')
          const code = text.split('').reduce((acc, char) => {
            return (acc * 31 + char.charCodeAt(0)) % 100000
          }, 0).toString().padStart(5, '0')
          output = [
            `📱 QR码已生成`,
            ``,
            `内容: ${text}`,
            `编码: ${code}`,
            ``,
            `┌──────────────┐`,
            `│ ▓▓▓▓ ▓▓▓▓ │`,
            `│ ▓▓▓▓ ▓▓▓▓ │`,
            `│ ▓▓▓▓ ▓▓▓▓ │`,
            `│ ▓▓▓▓ ▓▓▓▓ │`,
            `└──────────────┘`,
            ``,
            `💡 在图形界面中打开QR码生成器可查看完整二维码`,
          ].join('\n')
        }
        break
      case 'timer':
        if (args.length === 0 || args[0] === '--help') {
          output = [
            `⏱️ 计时器`,
            ``,
            `用法: timer <秒数>`,
            `       timer --stop`,
            ``,
            `示例:`,
            `  timer 60        # 设置60秒倒计时`,
            `  timer --stop    # 停止计时器`,
            ``,
            `💡 计时器将在后台运行`,
          ].join('\n')
        } else if (args[0] === '--stop') {
          output = '⏹️ 计时器已停止'
        } else {
          const seconds = parseInt(args[0])
          if (isNaN(seconds) || seconds <= 0) {
            output = 'timer: 请提供有效的秒数'
          } else {
            const minutes = Math.floor(seconds / 60)
            const secs = seconds % 60
            output = [
              `⏱️ 计时器已设置`,
              ``,
              `持续时间: ${minutes > 0 ? minutes + ' 分 ' : ''}${secs} 秒`,
              ``,
              `💡 计时完成后会有通知`,
            ].join('\n')
          }
        }
        break
      case 'stopwatch':
        output = [
          `⏱️ 秒表`,
          ``,
          `功能: 测量经过的时间`,
          ``,
          `用法:`,
          `  stopwatch start  - 开始计时`,
          `  stopwatch stop   - 停止计时`,
          `  stopwatch reset  - 重置`,
          ``,
          `💡 可用于测量命令执行时间`,
        ].join('\n')
        break
      case 'bacon': {
        const baconText = (args.join(' ') || 'BACON').split('').map(c => {
          const binary = c.charCodeAt(0).toString(2).padStart(8, '0')
          return binary.split('').map(b => b === '1' ? ' bacon' : ' Bacon').join('')
        }).join('\n')
        output = baconText
        break
      }
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
              setTimeout(() => {
                const updatedFiles = useStore.getState().files
                const parent = findNodeByPath(updatedFiles, parentPath)
                if (parent?.children) {
                  const newFile = parent.children.find(c => c.name === sourceNode.name)
                  if (newFile) {
                    renameFile(newFile.id, fileName)
                  }
                }
              }, 100)
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
              setTimeout(() => {
                const updatedFiles = useStore.getState().files
                const parent = findNodeByPath(updatedFiles, parentPath)
                if (parent?.children) {
                  const movedFile = parent.children.find(c => c.name === sourceNode.name)
                  if (movedFile) {
                    renameFile(movedFile.id, fileName)
                  }
                }
              }, 100)
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
      case 'weather': {
        const weatherConditions = ['晴朗', '多云', '小雨', '晴间多云', '雷阵雨', '小到中雨', '中到大雨', '晴到多云', '阴天', '雷阵雨伴有冰雹']
        const windDirections = ['东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风', '北风']
        const icons = ['☀️', '⛅', '🌧️', '🌤️', '⛈️', '🌦️', '🌧️', '🌤️', '☁️', '⛈️']
        const temp = Math.floor(Math.random() * 30 + 10)
        const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
        const icon = icons[weatherConditions.indexOf(condition)]
        const windDir = windDirections[Math.floor(Math.random() * windDirections.length)]
        const windSpeed = Math.floor(Math.random() * 15 + 1)
        const humidity = Math.floor(Math.random() * 40 + 40)
        const pressure = Math.floor(Math.random() * 40 + 1000)

        const location = args.length > 0 ? args.join(' ') : '本地'

        output = [
          `${icon}  ${location} 天气预报`,
          `╔══════════════════════════════════════════╗`,
          `║  天气: ${condition.padEnd(22)}║`,
          `║  温度: ${temp}°C${' '.repeat(18)}║`,
          `║  风向: ${windDir} ${windSpeed}级${' '.repeat(15)}║`,
          `║  湿度: ${humidity}%${' '.repeat(20)}║`,
          `║  气压: ${pressure}hPa${' '.repeat(16)}║`,
          `╚══════════════════════════════════════════╝`,
          '',
          '小贴士: 出门记得看天气预报哦!',
        ].join('\n')
        break
      }
      case 'sysinfo': {
        const cpuUsage = Math.floor(Math.random() * 30 + 20)
        const memTotal = 16384
        const memUsed = Math.floor(memTotal * (0.3 + Math.random() * 0.3))
        const memFree = memTotal - memUsed
        const diskTotal = 512000
        const diskUsed = Math.floor(diskTotal * (0.4 + Math.random() * 0.2))
        const diskFree = diskTotal - diskUsed
        const uptime = Math.floor(Math.random() * 86400000 * 7 + 86400000)
        const days = Math.floor(uptime / 86400000)
        const hours = Math.floor((uptime % 86400000) / 3600000)
        const upTimeStr = `${days}天 ${hours}小时`
        
        output = [
          '╔════════════════════════════════════════════════╗',
          '║              WebLinux 系统信息                  ║',
          '╠════════════════════════════════════════════════╣',
          `║  操作系统: WebLinux 2.2.0                      ║`,
          `║  内核版本: 6.1.0-web                          ║`,
          `║  架构: x86_64                                 ║`,
          `║  运行时间: ${upTimeStr.padEnd(30)}║`,
          '╠════════════════════════════════════════════════╣',
          `║  CPU 使用率: ${cpuUsage.toString().padEnd(28)}%║`,
          `║  内存总量: ${(memTotal / 1024).toFixed(0).padEnd(30)}MB║`,
          `║  内存已用: ${(memUsed / 1024).toFixed(0).padEnd(30)}MB║`,
          `║  内存空闲: ${(memFree / 1024).toFixed(0).padEnd(30)}MB║`,
          '╠════════════════════════════════════════════════╣',
          `║  磁盘总量: ${(diskTotal / 1024).toFixed(0).padEnd(30)}MB║`,
          `║  磁盘已用: ${(diskUsed / 1024).toFixed(0).padEnd(30)}MB║`,
          `║  磁盘空闲: ${(diskFree / 1024).toFixed(0).padEnd(30)}MB║`,
          '╚════════════════════════════════════════════════╝',
        ].join('\n')
        break
      }
      case 'sync': {
        if (args[0] === '--export') {
          const exportData = {
            files: files,
            theme: useStore.getState().theme,
            wallpaper: useStore.getState().wallpaper,
            timestamp: new Date().toISOString(),
            version: '2.2.0'
          }
          const dataStr = JSON.stringify(exportData, null, 2)
          const blob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `weblinux-backup-${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          URL.revokeObjectURL(url)
          output = '✅ 数据已导出!\n📁 文件已下载到本地'
        } else if (args[0] === '--import') {
          output = '📤 请在文件管理器中选择 JSON 文件导入\n💡 或使用拖拽功能上传备份文件'
        } else if (args[0] === '--status') {
          const fileCount = (function countFiles(nodes: FileNode[]): number {
            return nodes.reduce((acc, node) => {
              return acc + 1 + (node.children ? countFiles(node.children) : 0)
            }, 0)
          })(files)
          output = [
            '╔══════════════════════════════════╗',
            '║        同步状态                  ║',
            '╠══════════════════════════════════╣',
            `║  文件总数: ${fileCount.toString().padEnd(26)}║`,
            `║  最后同步: ${new Date().toLocaleString('zh-CN').padEnd(20)}║`,
            `║  存储使用: ${(JSON.stringify(files).length / 1024).toFixed(2).padEnd(22)}KB║`,
            '╚══════════════════════════════════╝',
          ].join('\n')
        } else {
          output = '用法: sync [选项]\n  --export   导出数据到本地\n  --import   从文件导入数据\n  --status   查看同步状态'
        }
        break
      }
      case 'which': {
        if (args.length === 0) {
          output = 'which: 缺少操作数'
        } else {
          const commands = ['ls', 'cd', 'weather', 'pwd', 'cat', 'echo', 'help', 'date', 'whoami', 'uname', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'find', 'grep', 'ps', 'top', 'df', 'free', 'history', 'neofetch', 'tree', 'wc', 'ping', 'uptime', 'cal', 'clear']
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
      case 'alias': {
        if (args.length === 0) {
          if (Object.keys(aliases).length === 0) {
            output = '未定义别名\n使用: alias 别名=命令'
          } else {
            output = Object.entries(aliases)
              .map(([key, value]) => `alias ${key}='${value}'`)
              .join('\n')
          }
        } else {
          const aliasName = args[0]
          const aliasValue = args.slice(1).join(' ')
          if (aliasValue) {
            setAliases(prev => ({ ...prev, [aliasName]: aliasValue }))
            output = `alias ${aliasName}='${aliasValue}'`
          } else {
            output = `${aliasName}='${aliases[aliasName] || ''}'`
          }
        }
        break
      }
      case 'dashboard': {
        const activeWindows = getWindowsRef.current.length
        const themeLabel = theme === 'dark' ? '深色' : '浅色'
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
          `║  活动窗口: ${activeWindows} 个${' '.repeat(32)}║`,
          `║  主题: ${themeLabel.padEnd(42)}║`,
          `╚══════════════════════════════════════════════════════════╝`,
        ].join('\n')
        break
      }
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
      case 'git':
        if (args[0] === 'status') {
          output = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`
        } else if (args[0] === 'log') {
          output = `commit a1b2c3d4e5f6g7h8i9j0
Author: developer <dev@example.com>
Date:   ${new Date().toDateString()}

    Initial commit`
        } else if (args[0] === 'diff') {
          output = 'diff --git a/src/index.ts b/src/index.ts\nindex 1234567..abcdefg 100644\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n console.log("Hello");\n+console.log("World");'
        } else {
          output = `git: 'usage: git [--version] [--help] [-C <path>] [-c name=value]'
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--do-not-pager]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           <command> [<args>]`
        }
        break
      case 'npm':
        if (args[0] === 'version') {
          output = '10.2.4'
        } else if (args[0] === 'list') {
          output = `weblinux@1.0.0
├── react@19.2.6
├── react-dom@19.2.6
└── zustand@5.0.13`
        } else if (args[0] === 'run') {
          output = `Lifecycle scripts included in package.json:

available via 'npm run':
  dev         vite
  build       tsc -b && vite build
  lint        eslint .
  preview     vite preview`
        } else {
          output = `npm: command not found (模拟环境)`
        }
        break
      case 'node':
        if (args[0] === '--version') {
          output = 'v20.10.0'
        } else if (args[0] === '-v') {
          output = 'v20.10.0'
        } else {
          output = `> console.log('Hello from Node.js!');
Hello from Node.js!`
        }
        break
      case 'python':
      case 'python3':
        if (args[0] === '--version' || args[0] === '-V') {
          output = 'Python 3.11.4 (Pyodide)'
        } else if (args[0] === '-c') {
          const code = args.slice(1).join(' ')
          if (!pyodide) {
            setHistory((prev) => [...prev, { input: trimmed, output: '⏳ 正在加载 Python 运行时...' }])
            try {
              const pyodideModule = await import('pyodide')
              const pyodideInstance = await pyodideModule.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/',
                stdout: (text: string) => {
                  setHistory((prev) => {
                    const lastEntry = prev[prev.length - 1]
                    if (lastEntry && !lastEntry.input) {
                      return [...prev.slice(0, -1), { input: '', output: lastEntry.output + text }]
                    }
                    return [...prev, { input: '', output: text }]
                  })
                },
                stderr: (text: string) => {
                  setHistory((prev) => [...prev, { input: '', output: `\u001b[31m${text}\u001b[0m` }])
                }
              })
              setPyodide(pyodideInstance)
              await pyodideInstance.runPythonAsync(code)
            } catch (error) {
              setHistory((prev) => [...prev.slice(0, -1), { input: trimmed, output: `\u001b[31mPython 运行时加载失败: ${error}\u001b[0m\n> ${code}\n(无法在浏览器中直接执行非 Python 代码)` }])
            }
            return
          }
          try {
            setHistory((prev) => [...prev, { input: trimmed, output: '' }])
            await pyodide.runPythonAsync(code)
          } catch (err: unknown) {
            output = `\u001b[31mTraceback (most recent call last):\n  File "<stdin>", line 1, in <module>\n${err instanceof Error ? err.toString() : 'Error'}\u001b[0m`
          }
        } else if (args[0] === '-m') {
          output = `Python 3.11.4 (Pyodide)\nModule path: ${args[1] || 'not specified'}`
        } else {
          output = `Python 3.11.4 (Pyodide)\nType "help" for more information.\n>>> `
        }
        break
      case 'docker':
        if (args[0] === 'ps') {
          output = `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS    NAMES`
        } else if (args[0] === 'images') {
          output = `REPOSITORY   TAG       IMAGE ID      CREATED      SIZE
hello-world   latest    fce289e991eb  2 years ago   1.84kB`
        } else if (args[0] === 'info') {
          output = `Client:
 Version:    24.0.7

Server:
 Version:    24.0.7`
        } else {
          output = `docker: command not found (需要Docker环境)`
        }
        break
      case 'clear-cache':
        output = `正在清除缓存...
✓ 浏览器缓存已清除
✓ 本地存储已清理
✓ 临时文件已删除
缓存清除完成!`
        break
      case 'kubectl':
        output = `kubectl: command not found (需要Kubernetes环境)`
        break
      case 'systemctl':
        if (args[1] === 'status') {
          output = `● ssh.service - OpenSSH server daemon
   Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled)
   Active: active (running) since ${new Date().toDateString()}; 2 weeks ago`
        } else if (args[1] === 'start') {
          output = `Starting ${args[0]}...`
        } else if (args[1] === 'stop') {
          output = `Stopping ${args[0]}...`
        } else {
          output = `systemctl: 请指定服务名称和操作
用法: systemctl [COMMAND] [NAME]`
        }
        break
      case 'journalctl':
        if (args.includes('-xe')) {
          output = `-- Journal begins at ${new Date().toDateString()}, ends at ${new Date().toDateString()} --
${new Date().toISOString()} hostname systemd[1]: Started Session ${Math.floor(Math.random() * 100)} of user user.`
        } else {
          output = `journalctl: 显示日志条目
用法: journalctl [OPTIONS...]
  -e          跳到日志末尾
  -f          跟踪日志
  -n [lines]  显示最近行数`
        }
        break
      case 'dmesg':
        output = `[    0.000000] Linux version 6.1.0-web (root@weblinux)
[    0.000001] Command line: BOOT_IMAGE=/boot/vmlinuz
[    0.000002] ACPI: RSDP 0x00000000000F05B0 000024 (v02 WEBLIN)
[    0.000003] CPU: WebAssembly x86_64
[    0.000004] Memory: 8192MB available`
        break
      case 'lsblk':
        output = `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda      8:0    0    50G  0 disk 
├─sda1   8:1    0    49G  0 part /
└─sda2   8:2    0     1G  0 part [SWAP]
sr0     11:0    1  1024M  0 rom`
        break
      case 'lsof':
        output = `COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
bash     1000   user  cwd    DIR  253,1     4096  1024 /home/user
bash     1000   user    0u   CHR  136,0      0t0     3 /dev/pts/0`
        break
      case 'netstat':
        output = `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN`
        break
      case 'ss':
        output = `Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
tcp LISTEN 0 128 *:80 *:* users:(("nginx",pid=1234,fd=6))
tcp LISTEN 0 128 *:22 *:* users:(("sshd",pid=567,fd=3))`
        break
      case 'tar':
        output = `tar: 这似乎是一个归档文件 (使用 -xvf 解压)`
        break
      case 'zip':
        output = `zip: 压缩文件 (usage: zip archive.zip file1 file2)`
        break
      case 'unzip':
        output = `Archive:  test.zip
  inflating: test.txt`
        break
      case 'sort':
        output = args.length > 0 ? args.join('\n').split('\n').sort().join('\n') : '1\n3\n2\n5\n4'
        break
      case 'uniq':
        output = 'line1\nline2\nline1'
        break
      case 'head':
        output = args.length > 0 ? `Line 1\nLine 2\nLine 3\n...` : 'head: 用法: head [OPTIONS] [FILE]'
        break
      case 'tail':
        output = args.length > 0 ? `...Line 97\nLine 98\nLine 99\nLine 100` : 'tail: 用法: tail [OPTIONS] [FILE]'
        break
      case 'less':
        output = 'less: 分页查看器 (在模拟环境中不可用)'
        break
      case 'more':
        output = 'more: 分页查看器 (在模拟环境中不可用)'
        break
      case 'xargs':
        output = 'xargs: 命令构造器 (usage: xargs [command])'
        break
      case 'sed':
        output = 'sed: 流编辑器 (usage: sed [options] script file)'
        break
      case 'awk':
        output = 'awk: 模式扫描和处理语言 (usage: awk [options] script file)'
        break
      case 'ssh':
        output = `ssh: 连接远程主机
usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-b bind_address] [-c cipher_spec]
           [-D [bind_address:]port] [-E log_file] [-e escape_char]
           host [command]`
        break
      case 'scp':
        output = `scp: 安全复制文件
usage: scp [-346BCpqrTv] [-c cipher] [-F ssh_config] [-i identity_file]
           [-l limit] [-o ssh_option] [-P port] [-S program]
           [[user@]host1:]file1 ... [[user@]host2:]file2`
        break
      case 'rsync':
        output = `rsync: 远程文件同步工具
usage: rsync [OPTION]... SRC [SRC]... DEST
       rsync [OPTION]... SRC [SRC]... [USER@]HOST:DEST`
        break
      case 'exit':
      case 'quit':
      case 'q':
        output = 'Exiting terminal... (closing window)'
        setTimeout(() => {
          const windows = getWindowsRef.current
          const thisWindow = windows.find(w => w.appId === 'terminal' && w.focused)
          if (thisWindow) {
            closeWindowRef.current(thisWindow.id)
          }
        }, 500)
        break
      default:
        output = `bash: ${command}: 未找到命令 (输入 'help' 查看可用命令)`
    }

    setHistory((prev) => [...prev, { input: trimmed, output }])
  }, [cwd, files, addFile, deleteFile, copyFile, moveFile, cmdHistory, theme, username, hostname, searchHistory, closeWindowRef, filesRef, getWindowsRef, renameFileRef, aliases, setAliases, pyodide])

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
    
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      inputRef.current?.select()
      return
    }

    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      const activeWindows = getWindowsRef.current
      const currentWin = activeWindows.find((w: WindowState) => w.appId === 'terminal' && w.focused)
      if (currentWin) closeWindow(currentWin.id)
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