import type { FileNode } from '../../types'

export type CommandContext = {
  cwd: string
  files: FileNode[]
  username: string
  hostname: string
  theme: 'dark' | 'light' | 'auto'
  args: string[]
  prevCwd: string | null
  stdin?: string
  addFile?: (parentId: string, name: string, type: 'file' | 'folder') => void
  deleteFile?: (id: string) => void
  updateFileContent?: (id: string, content: string) => void
  renameFile?: (id: string, name: string) => void
  copyFile?: (sourceId: string, targetParentId: string) => void
  moveFile?: (sourceId: string, targetParentId: string) => void
  openApp?: (appId: string) => void
}

export type CommandResult = {
  output: string
  cwd?: string
  prevCwd?: string | null
}

export type CommandHandler = (context: CommandContext) => CommandResult | Promise<CommandResult>

export interface CommandDefinition {
  handler: CommandHandler
  description: string
  usage?: string
  examples?: string[]
}

export const COMMANDS: Record<string, CommandDefinition> = {}

const REGISTERED = new Set<string>()
const WARNED = new Set<string>()

interface RegisterOptions {
  force?: boolean
  source?: string
}

export function registerCommand(name: string, definition: CommandDefinition, options?: RegisterOptions) {
  const normalizedName = name.toLowerCase()
  const source = options?.source || 'unknown'
  const key = `${normalizedName}::${source}`

  if (COMMANDS[normalizedName]) {
    if (options?.force) {
      COMMANDS[normalizedName] = definition
      REGISTERED.add(key)
      return
    }

    if (REGISTERED.has(key)) {
      return
    }

    if (import.meta.env.DEV) {
      if (!WARNED.has(normalizedName)) {
        WARNED.add(normalizedName)
        console.warn(`[terminal] 命令 "${normalizedName}" 重复注册被跳过 (来源: ${source})`)
      }
    }
    return
  }

  COMMANDS[normalizedName] = definition
  REGISTERED.add(key)
}

export function getCommand(name: string): CommandDefinition | undefined {
  return COMMANDS[name.toLowerCase()]
}

export function listCommands(): string[] {
  return Object.keys(COMMANDS)
}

export function getCommandSuggestions(prefix: string): string[] {
  return Object.keys(COMMANDS).filter(cmd => cmd.startsWith(prefix))
}

export function getSuggestions(input: string, cwd: string, files: FileNode[]): string[] {
  const parts = input.split(' ')
  const lastPart = parts[parts.length - 1]
  
  if (parts.length === 1) {
    return getCommandSuggestions(lastPart)
  }
  
  const resolved = lastPart.startsWith('/') ? lastPart : (lastPart.startsWith('~') ? lastPart.replace('~', '/home/user') : `${cwd}/${lastPart}`)
  const dirPath = resolved.lastIndexOf('/') !== -1 ? resolved.substring(0, resolved.lastIndexOf('/')) : '/'
  const searchPrefix = resolved.lastIndexOf('/') !== -1 ? resolved.substring(resolved.lastIndexOf('/') + 1) : resolved
  
  const findNodeByPath = (nodes: FileNode[], path: string): FileNode | undefined => {
    if (path === '/') return nodes[0]
    const parts = path.split('/').filter(Boolean)
    let current: FileNode | undefined = nodes[0]
    for (const part of parts) {
      if (!current || current.type !== 'folder') return undefined
      current = current.children?.find(child => child.name === part)
    }
    return current
  }
  
  const targetDir = findNodeByPath(files, dirPath)
  
  if (!targetDir || targetDir.type !== 'folder' || !targetDir.children) {
    return []
  }
  
  return targetDir.children
    .filter(child => child.name.startsWith(searchPrefix))
    .map(child => {
      const fullPath = dirPath === '/' ? `/${child.name}` : `${dirPath}/${child.name}`
      return child.type === 'folder' ? `${fullPath}/` : fullPath
    })
}

// 新增命令：weather (使用 wttr.in API)
registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const city = context.args.join(' ') || 'Beijing'
    try {
      const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`)
      const text = await resp.text()
      return { output: text }
    } catch {
      return { output: `❌ 获取天气失败，请检查网络连接` }
    }
  },
  description: '查看实时天气 (使用 wttr.in API)',
  usage: 'weather [城市名]',
}, { force: true, source: 'commands.ts' })

// 新增命令：js
registerCommand('js', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const code = context.args.join(' ')
    if (!code) {
      return { output: '❌ 请提供要执行的代码，例如: js Math.PI * 2' }
    }
    try {
      const result = new Function('return ' + code)()
      return { output: String(result) }
    } catch (err: any) {
      return { output: `❌ 执行错误: ${err.message}` }
    }
  },
  description: '执行 JavaScript 代码',
  usage: 'js <代码表达式>',
}, { source: 'commands.ts' })

registerCommand('about', {
  handler: (): CommandResult => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'
    const output = [
      '╔═══════════════════════════════════════════╗',
      '║          WebLinuxOS 关于                  ║',
      '╠═══════════════════════════════════════════╣',
      '║                                           ║',
      '║  WebLinuxOS 是一个功能完整的 Web 端       ║',
      '║  Linux 桌面操作系统模拟器                 ║',
      '║                                           ║',
      `║  版本:  ${version.padEnd(38)}║`,
      `║  构建:  ${buildTime.padEnd(38)}║`,
      '║                                           ║',
      '║  特性:                                    ║',
      '║    • 200+ 预装应用程序                    ║',
      '║    • 多窗口管理系统                       ║',
      '║    • 虚拟文件系统                         ║',
      '║    • 终端模拟器                           ║',
      '║    • Python 运行时支持                    ║',
      '║    • 真实 AI 集成 (Pollinations.ai)       ║',
      '║    • 深色/浅色主题                        ║',
      '║                                           ║',
      '║  致谢:                                    ║',
      '║    • React 团队                           ║',
      '║    • Vite 团队                            ║',
      '║    • 所有开源社区贡献者                   ║',
      '║                                           ║',
      '║  许可证: MIT                              ║',
      '║  网址: https://github.com/saya-ch/WebLinuxOS',
      '║                                           ║',
      '╚═══════════════════════════════════════════╝',
    ].join('\n')
    return { output }
  },
  description: '显示 WebLinuxOS 关于信息',
  usage: 'about',
  examples: ['about']
}, { source: 'commands.ts' })

registerCommand('system', {
  handler: (context: CommandContext): CommandResult => {
    try {
    const ua = navigator.userAgent
    const cpuCores = navigator.hardwareConcurrency || 0
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number; rtt?: number } }
    const deviceMemory = nav.deviceMemory || 0
    const screenInfo = window.screen
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }

    const usedJS = perf.memory?.usedJSHeapSize || 0
    const totalJS = perf.memory?.totalJSHeapSize || 0
    const limitJS = perf.memory?.jsHeapSizeLimit || 0

    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
      return `${bytes} B`
    }

    const parseBrowser = (userAgent: string): { name: string; version: string } => {
      if (/Edg\/([\d.]+)/.test(userAgent)) return { name: 'Microsoft Edge', version: RegExp.$1 }
      if (/OPR\/([\d.]+)/.test(userAgent)) return { name: 'Opera', version: RegExp.$1 }
      if (/Firefox\/([\d.]+)/.test(userAgent)) return { name: 'Mozilla Firefox', version: RegExp.$1 }
      if (/Chrome\/([\d.]+)/.test(userAgent)) return { name: 'Google Chrome', version: RegExp.$1 }
      if (/Version\/([\d.]+).*Safari/.test(userAgent)) return { name: 'Safari', version: RegExp.$1 }
      return { name: '未知', version: '未知' }
    }

    const parseOS = (userAgent: string): string => {
      if (/Windows NT ([\d.]+)/.test(userAgent)) return `Windows NT ${RegExp.$1}`
      if (/iPhone OS ([\d_]+)/.test(userAgent)) return `iOS ${RegExp.$1.replace(/_/g, '.')}`
      if (/Android ([\d.]+)/.test(userAgent)) return `Android ${RegExp.$1}`
      if (/Mac OS X ([\d_]+)/.test(userAgent)) return `macOS ${RegExp.$1.replace(/_/g, '.')}`
      if (/Linux/.test(userAgent)) return 'Linux'
      return '未知'
    }

    const browser = parseBrowser(ua)
    const os = parseOS(ua)
    const connection = nav.connection
    const languages = navigator.languages?.join(', ') || navigator.language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const color = '\x1b[36m'
    const bold = '\x1b[1m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const reset = '\x1b[0m'

    const lines: string[] = []
    lines.push(`${bold}${color}╔══════════════════════════════════════════════╗${reset}`)
    lines.push(`${bold}${color}║       WebLinuxOS 系统信息 (system)            ║${reset}`)
    lines.push(`${bold}${color}╚══════════════════════════════════════════════╝${reset}`)
    lines.push('')

    lines.push(`${bold}── 浏览器 ──${reset}`)
    lines.push(`  名称:       ${green}${browser.name}${reset} ${browser.version}`)
    lines.push(`  操作系统:   ${os}`)
    lines.push(`  User-Agent: ${ua.slice(0, 80)}${ua.length > 80 ? '...' : ''}`)
    lines.push('')

    lines.push(`${bold}── 硬件 ──${reset}`)
    lines.push(`  CPU 核心数: ${green}${cpuCores}${reset}`)
    lines.push(`  设备内存:   ${deviceMemory ? `${deviceMemory} GB` : '不可用 (需 HTTPS)'}`)
    lines.push(`  屏幕分辨率: ${screenInfo.width} × ${screenInfo.height}${screenInfo.colorDepth ? ` (${screenInfo.colorDepth}-bit)` : ''}`)
    lines.push(`  视口大小:   ${window.innerWidth} × ${window.innerHeight}`)
    lines.push(`  像素比:     ${window.devicePixelRatio}`)
    lines.push('')

    lines.push(`${bold}── 内存 ──${reset}`)
    if (perf.memory) {
      lines.push(`  JS 堆已用:  ${yellow}${formatBytes(usedJS)}${reset}`)
      lines.push(`  JS 堆总量:  ${formatBytes(totalJS)}`)
      lines.push(`  JS 堆限制:  ${formatBytes(limitJS)}`)
      lines.push(`  使用率:     ${((usedJS / totalJS) * 100).toFixed(1)}%`)
    } else {
      lines.push(`  ${yellow}JS 堆信息不可用${reset} (需 HTTPS 或 localhost)`)
    }
    lines.push('')

    lines.push(`${bold}── 网络 ──${reset}`)
    lines.push(`  在线状态:   ${navigator.onLine ? `${green}在线${reset}` : `${yellow}离线${reset}`}`)
    if (connection) {
      lines.push(`  连接类型:   ${connection.effectiveType || '未知'}`)
      lines.push(`  下行速率:   ${connection.downlink ? `${connection.downlink} Mbps` : '未知'}`)
      lines.push(`  往返延迟:   ${connection.rtt ? `${connection.rtt} ms` : '未知'}`)
    } else {
      lines.push(`  ${yellow}网络信息不可用${reset}`)
    }
    lines.push('')

    lines.push(`${bold}── 环境 ──${reset}`)
    lines.push(`  语言:       ${languages}`)
    lines.push(`  时区:       ${timezone}`)
    lines.push(`  Cookie:     ${navigator.cookieEnabled ? '启用' : '禁用'}`)
    lines.push(`  暗色模式:   ${window.matchMedia('(prefers-color-scheme: dark)').matches ? '是' : '否'}`)
    lines.push(`  用户:       ${context.username}@${context.hostname}`)
    lines.push(`  主题:       ${context.theme}`)
    lines.push(`  工作目录:   ${context.cwd}`)
    lines.push('')

    lines.push(`${bold}── 时间 ──${reset}`)
    lines.push(`  当前时间:   ${new Date().toLocaleString('zh-CN')}`)
    lines.push(`  时区偏移:   ${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60}`)
    lines.push('')

    lines.push('─'.repeat(46))
    lines.push(`采集时间: ${new Date().toLocaleString('zh-CN')}`)

    return { output: lines.join('\n') }
    } catch (e) {
      return { output: `system 命令错误: ${e instanceof Error ? e.message : String(e)}` }
    }
  },
  description: '显示详细系统信息（CPU/内存/屏幕/浏览器/网络）',
  usage: 'system',
  examples: ['system']
}, { source: 'commands.ts' })

registerCommand('banner', {
  handler: (context: CommandContext): CommandResult => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    const hostname = context.hostname
    const username = context.username

    const output = [
      '',
      ' ██╗    ██╗███████╗██████╗ ██╗     ██████╗     ██╗      ██████╗ ███████╗███████╗',
      ' ██║    ██║██╔════╝██╔══██╗██║     ██╔══██╗    ██║     ██╔═══██╗██╔════╝██╔════╝',
      ' ██║ █╗ ██║█████╗  ██████╔╝██║     ██║  ██║    ██║     ██║   ██║███████╗█████╗  ',
      ' ██║███╗██║██╔══╝  ██╔══██╗██║     ██║  ██║    ██║     ██║   ██║╚════██║██╔══╝  ',
      ' ╚███╔███╔╝███████╗██████╔╝███████╗██████╔╝    ███████╗╚██████╔╝███████║███████╗',
      '  ╚══╝╚══╝ ╚══════╝╚═════╝ ╚══════╝╚═════╝      ╚══════╝ ╚═════╝ ╚══════╝╚══════╝',
      '',
      `  版本 ${version}  ·  ${username}@${hostname}  ·  输入 help 查看所有命令`,
      '',
    ].join('\n')

    return { output }
  },
  description: '显示欢迎横幅',
  usage: 'banner',
  examples: ['banner']
}, { source: 'commands.ts' })

// ─── json 命令 ───────────────────────────────────────────
registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const input = context.args.join(' ')
    if (!input) {
      if (context.stdin) {
        try {
          const parsed = JSON.parse(context.stdin)
          const formatted = JSON.stringify(parsed, null, 2)
          return { output: formatted }
        } catch (err: any) {
          return { output: `\x1b[31m❌ JSON 解析错误: ${err.message}\x1b[0m` }
        }
      }
      return { output: '用法: json <JSON字符串> 或通过管道传入: echo \'{"a":1}\' | json\n\n支持选项:\n  json <data>       格式化 JSON\n  json -m <data>    压缩为单行\n  json -k <data>    仅输出所有键\n  json -v <data>    仅输出所有值\n  json -t <data>    显示类型结构\n  json -i <data>    缩进 4 空格' }
    }

    const data = context.stdin || input

    if (context.args[0] === '-m') {
      try {
        const raw = context.stdin || context.args.slice(1).join(' ')
        const parsed = JSON.parse(raw)
        return { output: JSON.stringify(parsed) }
      } catch (err: any) {
        return { output: `\x1b[31m❌ JSON 解析错误: ${err.message}\x1b[0m` }
      }
    }

    if (context.args[0] === '-k') {
      try {
        const parsed = JSON.parse(data)
        const keys = Object.keys(parsed).join('\n')
        return { output: keys || '(无键)' }
      } catch (err: any) {
        return { output: `\x1b[31m❌ ${err.message}\x1b[0m` }
      }
    }

    if (context.args[0] === '-v') {
      try {
        const parsed = JSON.parse(data)
        const values = Object.values(parsed).map(v => JSON.stringify(v)).join('\n')
        return { output: values || '(无值)' }
      } catch (err: any) {
        return { output: `\x1b[31m❌ ${err.message}\x1b[0m` }
      }
    }

    if (context.args[0] === '-t') {
      try {
        const parsed = JSON.parse(data)
        const getType = (obj: unknown, depth = 0): string => {
          if (obj === null) return 'null'
          if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]'
            return `[${getType(obj[0], depth + 1)} × ${obj.length}]`
          }
          if (typeof obj === 'object') {
            const keys = Object.keys(obj as Record<string, unknown>)
            if (keys.length === 0) return '{}'
            const indent = '  '.repeat(depth + 1)
            const inner = keys.map(k => `${indent}${k}: ${getType((obj as Record<string, unknown>)[k], depth + 1)}`).join('\n')
            return `{\n${inner}\n${'  '.repeat(depth)}}`
          }
          return typeof obj
        }
        return { output: getType(parsed) }
      } catch (err: any) {
        return { output: `\x1b[31m❌ ${err.message}\x1b[0m` }
      }
    }

    const indent = context.args[0] === '-i' ? 4 : 2
    const rawData = context.args[0] === '-i' ? context.args.slice(1).join(' ') : data

    try {
      const parsed = JSON.parse(rawData)
      const formatted = JSON.stringify(parsed, null, indent)
      return { output: formatted }
    } catch (err: any) {
      return { output: `\x1b[31m❌ JSON 解析错误: ${err.message}\x1b[0m\n\n输入内容: ${rawData.slice(0, 200)}` }
    }
  },
  description: 'JSON 格式化/验证/解析工具',
  usage: 'json [-m|-k|-v|-t|-i] <JSON数据>',
  examples: [
    'json \'{"name":"test","value":42}\'',
    'json -m \'{"a":1,"b":2}\'',
    'json -k \'{"name":"test","age":25}\'',
    'json -t \'{"users":[{"id":1}]}\'',
  ],
}, { source: 'commands.ts' })

// ─── stats 命令 ──────────────────────────────────────────
registerCommand('stats', {
  handler: (context: CommandContext): CommandResult => {
    const text = context.stdin || context.args.join(' ')
    if (!text) {
      return { output: '用法: stats <文本> 或通过管道传入\n\n显示文本的字符数、行数、单词数、字节数等统计信息' }
    }

    const lines = text.split('\n')
    const words = text.split(/\s+/).filter(Boolean)
    const chars = text.length
    const bytes = new TextEncoder().encode(text).length
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const digits = (text.match(/[0-9]/g) || []).length
    const letters = (text.match(/[a-zA-Z]/g) || []).length
    const symbols = (text.match(/[^a-zA-Z0-9\u4e00-\u9fff\s]/g) || []).length
    const uppercase = (text.match(/[A-Z]/g) || []).length
    const lowercase = (text.match(/[a-z]/g) || []).length

    const bold = '\x1b[1m'
    const cyan = '\x1b[36m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const reset = '\x1b[0m'

    const output = [
      `${bold}${cyan}╔══════════════════════════════════╗${reset}`,
      `${bold}${cyan}║        文本统计信息               ║${reset}`,
      `${bold}${cyan}╚══════════════════════════════════╝${reset}`,
      '',
      `${bold}── 基本统计 ──${reset}`,
      `  行数:       ${green}${lines.length}${reset}`,
      `  单词数:     ${green}${words.length}${reset}`,
      `  字符数:     ${green}${chars}${reset}`,
      `  字节数:     ${green}${bytes}${reset}`,
      '',
      `${bold}── 字符分析 ──${reset}`,
      `  字母:       ${yellow}${letters}${reset} (大写 ${uppercase} / 小写 ${lowercase})`,
      `  数字:       ${yellow}${digits}${reset}`,
      `  中文字符:   ${yellow}${chineseChars}${reset}`,
      `  符号:       ${yellow}${symbols}${reset}`,
      `  空白:       ${yellow}${chars - letters - digits - chineseChars - symbols}${reset}`,
      '',
      `${bold}── 额外信息 ──${reset}`,
      `  最长行:     ${lines.reduce((a, b) => a.length > b.length ? a : b, '').length} 字符`,
      `  平均行长:   ${(chars / lines.length).toFixed(1)} 字符`,
      `  平均词长:   ${words.length > 0 ? (chars / words.length).toFixed(1) : 0} 字符`,
    ].join('\n')

    return { output }
  },
  description: '文本统计分析',
  usage: 'stats <文本> 或 echo "文本" | stats',
  examples: ['stats "Hello World 你好世界"', 'echo "test" | stats'],
}, { source: 'commands.ts' })

// ─── uuid 命令 ───────────────────────────────────────────
registerCommand('uuid', {
  handler: (context: CommandContext): CommandResult => {
    const count = parseInt(context.args[0]) || 1
    if (count < 1 || count > 100) {
      return { output: '数量必须在 1-100 之间' }
    }

    const generateUUID = (): string => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const uuids = Array.from({ length: count }, () => generateUUID())
    return { output: uuids.join('\n') }
  },
  description: '生成 UUID v4',
  usage: 'uuid [数量]',
  examples: ['uuid', 'uuid 5'],
}, { source: 'commands.ts' })

// ─── colors 命令 ─────────────────────────────────────────
registerCommand('colors', {
  handler: (): CommandResult => {
    const output = [
      '\x1b[1m── 终端颜色调色板 ──\x1b[0m',
      '',
      '\x1b[30m■■■ \x1b[31m■■■ \x1b[32m■■■ \x1b[33m■■■\x1b[0m  (30-33: 黑/红/绿/黄)',
      '\x1b[34m■■■ \x1b[35m■■■ \x1b[36m■■■ \x1b[37m■■■\x1b[0m  (34-37: 蓝/紫/青/白)',
      '',
      '\x1b[90m■■■ \x1b[91m■■■ \x1b[92m■■■ \x1b[93m■■■\x1b[0m  (90-93: 亮黑/亮红/亮绿/亮黄)',
      '\x1b[94m■■■ \x1b[95m■■■ \x1b[96m■■■ \x1b[97m■■■\x1b[0m  (94-97: 亮蓝/亮紫/亮青/亮白)',
      '',
      '\x1b[1m── 样式 ──\x1b[0m',
      '\x1b[1m粗体\x1b[0m  \x1b[2m暗淡\x1b[0m  \x1b[3m斜体\x1b[0m  \x1b[4m下划线\x1b[0m  \x1b[9m删除线\x1b[0m',
      '',
      '\x1b[1m── 背景色 ──\x1b[0m',
      '\x1b[41m  \x1b[42m  \x1b[43m  \x1b[44m  \x1b[45m  \x1b[46m  \x1b[47m  \x1b[0m',
      '',
      '\x1b[38;2;255;128;0m■■■\x1b[0m 256色示例: \x1b[38;5;208m███████\x1b[0m',
    ].join('\n')
    return { output }
  },
  description: '显示终端颜色调色板',
  usage: 'colors',
}, { source: 'commands.ts' })

// ─── checksum 命令 ───────────────────────────────────────
registerCommand('checksum', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const text = context.stdin || context.args.join(' ')
    if (!text) {
      return { output: '用法: checksum <文本> 或 echo "text" | checksum\n\n计算文本的多种哈希值 (SHA-256, SHA-384, SHA-512, MD5)' }
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(text)

    const formatHex = (buffer: ArrayBuffer): string => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }

    // Simple MD5 implementation
    const md5 = (message: string): string => {
      const rotateLeft = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift))
      const addUnsigned = (x: number, y: number) => {
        const x8 = (x & 0x80000000)
        const y8 = (y & 0x80000000)
        const x4 = (x & 0x40000000)
        const y4 = (y & 0x40000000)
        const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF)
        if (x4 & y4) return (result ^ 0x80000000 ^ x8 ^ y8)
        if (x4 | y4) {
          return (result & 0x40000000) ? (result ^ 0xC0000000 ^ x8 ^ y8) : (result ^ 0x40000000 ^ x8 ^ y8)
        }
        return (result ^ x8 ^ y8)
      }

      const f = (x: number, y: number, z: number) => (x & y) | (~x & z)
      const g = (x: number, y: number, z: number) => (x & z) | (y & ~z)
      const h = (x: number, y: number, z: number) => (x ^ y ^ z)
      const i = (x: number, y: number, z: number) => (y ^ (x | ~z))

      const transform = (fn: (x: number, y: number, z: number) => number, a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
        a = addUnsigned(a, addUnsigned(addUnsigned(fn(b, c, d), x), ac))
        return addUnsigned(rotateLeft(a, s), b)
      }

      let msgLen = message.length
      const msgWords: number[] = []
      for (let i = 0; i < msgLen; i++) {
        msgWords[i >> 2] |= (message.charCodeAt(i) & 0xFF) << ((i % 4) << 3)
      }
      msgWords[msgLen >> 2] |= 0x80 << ((msgLen % 4) << 3)
      if (msgLen > 55) {
        msgWords[16] = msgLen
      } else {
        msgWords[14] = msgLen
      }

      let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476

      for (let k = 0; k < msgWords.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d

        a = transform(f, a, b, c, d, msgWords[k], 7, 0xD76AA478)
        d = transform(f, d, a, b, c, msgWords[k+1], 12, 0xE8C7B756)
        c = transform(f, c, d, a, b, msgWords[k+2], 17, 0x242070DB)
        b = transform(f, b, c, d, a, msgWords[k+3], 22, 0xC1BDCEEE)
        a = transform(f, a, b, c, d, msgWords[k+4], 7, 0xF57C0FAF)
        d = transform(f, d, a, b, c, msgWords[k+5], 12, 0x4787C62A)
        c = transform(f, c, d, a, b, msgWords[k+6], 17, 0xA8304613)
        b = transform(f, b, c, d, a, msgWords[k+7], 22, 0xFD469501)
        a = transform(f, a, b, c, d, msgWords[k+8], 7, 0x698098D8)
        d = transform(f, d, a, b, c, msgWords[k+9], 12, 0x8B44F7AF)
        c = transform(f, c, d, a, b, msgWords[k+10], 17, 0xFFFF5BB1)
        b = transform(f, b, c, d, a, msgWords[k+11], 22, 0x895CD7BE)
        a = transform(f, a, b, c, d, msgWords[k+12], 7, 0x6B901122)
        d = transform(f, d, a, b, c, msgWords[k+13], 12, 0xFD987193)
        c = transform(f, c, d, a, b, msgWords[k+14], 17, 0xA679438E)
        b = transform(f, b, c, d, a, msgWords[k+15], 22, 0x49B40821)

        a = transform(g, a, b, c, d, msgWords[k+1], 5, 0xF61E2562)
        d = transform(g, d, a, b, c, msgWords[k+6], 9, 0xC040B340)
        c = transform(g, c, d, a, b, msgWords[k+11], 14, 0x265E5A51)
        b = transform(g, b, c, d, a, msgWords[k], 20, 0xE9B6C7AA)
        a = transform(g, a, b, c, d, msgWords[k+5], 5, 0xD62F105D)
        d = transform(g, d, a, b, c, msgWords[k+10], 9, 0x2441453)
        c = transform(g, c, d, a, b, msgWords[k+15], 14, 0xD8A1E681)
        b = transform(g, b, c, d, a, msgWords[k+4], 20, 0xE7D3FBC8)
        a = transform(g, a, b, c, d, msgWords[k+9], 5, 0x21E1CDE6)
        d = transform(g, d, a, b, c, msgWords[k+14], 9, 0xC33707D6)
        c = transform(g, c, d, a, b, msgWords[k+3], 14, 0xF4D50D87)
        b = transform(g, b, c, d, a, msgWords[k+8], 20, 0x455A14ED)
        a = transform(g, a, b, c, d, msgWords[k+13], 5, 0xA9E3E905)
        d = transform(g, d, a, b, c, msgWords[k+2], 9, 0xFCEFA3F8)
        c = transform(g, c, d, a, b, msgWords[k+7], 14, 0x676F02D9)
        b = transform(g, b, c, d, a, msgWords[k+12], 20, 0x8D2A4C8A)

        a = transform(h, a, b, c, d, msgWords[k], 4, 0xFFFA3942)
        d = transform(h, d, a, b, c, msgWords[k+7], 11, 0x8771F681)
        c = transform(h, c, d, a, b, msgWords[k+14], 16, 0x6D9D6122)
        b = transform(h, b, c, d, a, msgWords[k+5], 23, 0xFDE5380C)
        a = transform(h, a, b, c, d, msgWords[k+12], 4, 0xA4BEEA44)
        d = transform(h, d, a, b, c, msgWords[k+3], 11, 0x4BDECFA9)
        c = transform(h, c, d, a, b, msgWords[k+10], 16, 0xF6BB4B60)
        b = transform(h, b, c, d, a, msgWords[k+1], 23, 0xBEBFBC70)
        a = transform(h, a, b, c, d, msgWords[k+8], 4, 0x289B7EC6)
        d = transform(h, d, a, b, c, msgWords[k+15], 11, 0xEAA127FA)
        c = transform(h, c, d, a, b, msgWords[k+6], 16, 0xD4EF3085)
        b = transform(h, b, c, d, a, msgWords[k+13], 23, 0x4881D05)
        a = transform(h, a, b, c, d, msgWords[k+4], 4, 0xD9D4D039)
        d = transform(h, d, a, b, c, msgWords[k+11], 11, 0xE6DB99E5)
        c = transform(h, c, d, a, b, msgWords[k+2], 16, 0x1FA27CF8)
        b = transform(h, b, c, d, a, msgWords[k+9], 23, 0xC4AC5665)

        a = transform(i, a, b, c, d, msgWords[k], 6, 0xF4292244)
        d = transform(i, d, a, b, c, msgWords[k+7], 10, 0x432AFF97)
        c = transform(i, c, d, a, b, msgWords[k+14], 15, 0xAB9423A7)
        b = transform(i, b, c, d, a, msgWords[k+5], 21, 0xFC93A039)
        a = transform(i, a, b, c, d, msgWords[k+12], 6, 0x655B59C3)
        d = transform(i, d, a, b, c, msgWords[k+3], 10, 0x8F0CCC92)
        c = transform(i, c, d, a, b, msgWords[k+10], 15, 0xFFEFF47D)
        b = transform(i, b, c, d, a, msgWords[k+1], 21, 0x85845DD1)
        a = transform(i, a, b, c, d, msgWords[k+8], 6, 0x6FA87E4F)
        d = transform(i, d, a, b, c, msgWords[k+15], 10, 0xFE2CE6E0)
        c = transform(i, c, d, a, b, msgWords[k+6], 15, 0xA3014314)
        b = transform(i, b, c, d, a, msgWords[k+13], 21, 0x4E0811A1)
        a = transform(i, a, b, c, d, msgWords[k+4], 6, 0xF7537E82)
        d = transform(i, d, a, b, c, msgWords[k+11], 10, 0xBD3AF235)
        c = transform(i, c, d, a, b, msgWords[k+2], 15, 0x2AD7D2BB)
        b = transform(i, b, c, d, a, msgWords[k+9], 21, 0xEB86D391)

        a = addUnsigned(a, AA)
        b = addUnsigned(b, BB)
        c = addUnsigned(c, CC)
        d = addUnsigned(d, DD)
      }

      const toHex = (val: number) => {
        let result = ''
        for (let i = 0; i < 4; i++) {
          result += ((val >> (i * 8)) & 0xFF).toString(16).padStart(2, '0')
        }
        return result
      }

      return toHex(a) + toHex(b) + toHex(c) + toHex(d)
    }

    const bold = '\x1b[1m'
    const cyan = '\x1b[36m'
    const yellow = '\x1b[33m'
    const green = '\x1b[32m'
    const reset = '\x1b[0m'

    const md5Hash = md5(text)

    // For SHA hashes, try Web Crypto API
    let sha256 = '(需要 HTTPS)'
    let sha384 = '(需要 HTTPS)'
    let sha512 = '(需要 HTTPS)'

    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
        sha256 = formatHex(sha256Buffer)

        const sha384Buffer = await crypto.subtle.digest('SHA-384', data)
        sha384 = formatHex(sha384Buffer)

        const sha512Buffer = await crypto.subtle.digest('SHA-512', data)
        sha512 = formatHex(sha512Buffer)
      }
    } catch {
      // Fallback
    }

    const output = [
      `${bold}${cyan}── 哈希校验和 ──${reset}`,
      '',
      `  ${yellow}MD5:    ${reset}${md5Hash}`,
      `  ${yellow}SHA-256:${reset} ${sha256}`,
      `  ${yellow}SHA-384:${reset} ${sha384}`,
      `  ${yellow}SHA-512:${reset} ${sha512}`,
      '',
      `${green}输入长度: ${text.length} 字符 / ${data.length} 字节${reset}`,
    ].join('\n')

    return { output }
  },
  description: '计算文本的哈希校验和 (MD5, SHA-256, SHA-384, SHA-512)',
  usage: 'checksum <文本> 或 echo "text" | checksum',
  examples: ['checksum "Hello World"', 'echo "test" | checksum'],
}, { source: 'commands.ts' })

// ─── repeat 命令 ─────────────────────────────────────────
registerCommand('repeat', {
  handler: (context: CommandContext): CommandResult => {
    const args = context.args
    if (args.length < 2) {
      return { output: '用法: repeat <次数> <文本>\n\n重复输出文本指定次数\n\n示例:\n  repeat 3 "Hello"\n  repeat 5 "*"' }
    }
    const count = parseInt(args[0])
    if (isNaN(count) || count < 1 || count > 10000) {
      return { output: '次数必须是 1-10000 之间的数字' }
    }
    const text = args.slice(1).join(' ')
    const result = Array.from({ length: count }, () => text).join('\n')
    return { output: result }
  },
  description: '重复输出文本指定次数',
  usage: 'repeat <次数> <文本>',
  examples: ['repeat 3 "Hello"', 'repeat 10 "---"'],
}, { source: 'commands.ts' })