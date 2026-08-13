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