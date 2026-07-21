import { registerCommand, getCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { useStore } from '../../store'
import type { FileNode } from '../../types'

registerCommand('whoami', {
  handler: (context: CommandContext): CommandResult => {
    return { output: context.username }
  },
  description: '显示当前用户',
  usage: 'whoami',
  examples: ['whoami']
})

registerCommand('hostname', {
  handler: (context: CommandContext): CommandResult => {
    return { output: context.hostname }
  },
  description: '显示主机名',
  usage: 'hostname',
  examples: ['hostname']
})

registerCommand('date', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const now = new Date()
    
    const formats: Record<string, string> = {
      '+%Y': now.getFullYear().toString(),
      '+%m': String(now.getMonth() + 1).padStart(2, '0'),
      '+%d': String(now.getDate()).padStart(2, '0'),
      '+%H': String(now.getHours()).padStart(2, '0'),
      '+%M': String(now.getMinutes()).padStart(2, '0'),
      '+%S': String(now.getSeconds()).padStart(2, '0'),
      '+%A': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()],
      '+%a': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()],
      '+%B': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][now.getMonth()],
      '+%b': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][now.getMonth()],
      '+%j': String(Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))).padStart(3, '0'),
      '+%w': now.getDay().toString(),
      '+%Z': Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
    
    if (args.length > 0) {
      let result = args.join(' ')
      for (const [format, value] of Object.entries(formats)) {
        result = result.replace(format, value)
      }
      return { output: result }
    }
    
    return {
      output: [
        `当前时间: ${now.toLocaleString('zh-CN')}`,
        `UTC时间: ${now.toISOString()}`,
        `日期: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        `时间: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
        `星期: ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`,
        `时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      ].join('\n')
    }
  },
  description: '显示当前日期和时间',
  usage: 'date [格式]',
  examples: ['date', 'date +%Y-%m-%d', 'date +%H:%M:%S']
})

registerCommand('uname', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.includes('-a')) {
      return { output: 'Linux web-linux 6.15.0-web #1 SMP PREEMPT_DYNAMIC ' + new Date().toISOString().slice(0, 10) + ' x86_64 GNU/Linux' }
    } else if (args.includes('-r')) {
      return { output: '6.15.0-web' }
    } else if (args.includes('-s')) {
      return { output: 'Linux' }
    } else if (args.includes('-n')) {
      return { output: 'web-linux' }
    } else if (args.includes('-m')) {
      return { output: 'x86_64' }
    }
    
    return { output: 'Linux' }
  },
  description: '显示系统信息',
  usage: 'uname [-a] [-r] [-s] [-n] [-m]',
  examples: ['uname', 'uname -a']
})

registerCommand('lsb_release', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

    if (args.includes('-a')) {
      return { output: `Distributor ID: WebLinux\nDescription:    Web Linux ${version}\nRelease:        ${version}\nCodename:       web` }
    }

    return { output: `Web Linux ${version}` }
  },
  description: '显示发行版信息',
  usage: 'lsb_release [-a]',
  examples: ['lsb_release', 'lsb_release -a']
})

registerCommand('neofetch', {
  handler: (context: CommandContext): CommandResult => {
    const { username, hostname, theme } = context
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

    const output = [
      `            .-/+oossssoo+/-.               ${username}@${hostname}`,
      `        \`:+ssssssssssssssssss+:\`           -------------`,
      `      -+ssssssssssssssssssssssso+-         OS: WebLinuxOS ${version}`,
      `    /osssssssssssssssssssssssssso/        Kernel: 6.15.0-web`,
      `  /ossssssssssssssssssssssssssssso/       Shell: bash 5.2.21`,
      ` :sssssssssssssssssssssssssssssssss:      DE: WebDE ${version}`,
      ` ossssssssssssssssssssssssssssssssso      Theme: ${theme}`,
      ` ossssssssssssssssssssssssssssssssso      Uptime: ${Math.floor(Math.random() * 24)} hours`,
      ` :sssssssssssssssssssssssssssssssss:      Packages: ${Math.floor(Math.random() * 500 + 100)}`,
      `  /ossssssssssssssssssssssssssssso/       Memory: ${Math.floor(Math.random() * 4096 + 1024)}MB / 16384MB`,
      `    /osssssssssssssssssssssssssso/`,
      `      -+ssssssssssssssssssssssso+-`,
      `        \`:+ssssssssssssssssss+:\``,
      `            .-/+oossssoo+/-.`,
    ].join('\n')

    return { output }
  },
  description: '显示系统信息（ASCII艺术风格）',
  usage: 'neofetch',
  examples: ['neofetch']
})

registerCommand('version', {
  handler: (): CommandResult => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'
    const output = [
      'WebLinuxOS 版本信息',
      '',
      `  版本:   ${version}`,
      '  内核:   6.15.0-web',
      '  架构:   x86_64',
      '  平台:   WebAssembly',
      `  构建:   ${buildTime}`,
      '',
      '更多信息请访问: https://github.com/saya-ch/WebLinuxOS',
    ].join('\n')

    return { output }
  },
  description: '显示系统版本信息',
  usage: 'version',
  examples: ['version']
})

registerCommand('about', {
  handler: (): CommandResult => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'
    const output = [
      '═══════════════════════════════════════',
      '         WebLinuxOS 关于',
      '═══════════════════════════════════════',
      '',
      '  WebLinuxOS 是一个功能完整的',
      '  Web端Linux桌面操作系统模拟器',
      '',
      `  版本: ${version}`,
      `  构建: ${buildTime}`,
      '',
      '  特性:',
      '    ✓ 200+ 预装应用程序',
      '    ✓ 多窗口管理系统',
      '    ✓ 虚拟文件系统',
      '    ✓ 终端模拟器',
      '    ✓ Python运行时支持',
      '    ✓ 真实 AI 集成（Pollinations.ai）',
      '    ✓ 深色/浅色主题',
      '',
      '═══════════════════════════════════════',
    ].join('\n')

    return { output }
  },
  description: '显示关于信息',
  usage: 'about',
  examples: ['about']
})

registerCommand('uptime', {
  handler: (): CommandResult => {
    const now = new Date()
    const start = new Date(now.getTime() - Math.floor(Math.random() * 86400000 * 7))
    
    const diff = now.getTime() - start.getTime()
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    return {
      output: [
        `系统运行时间: ${days > 0 ? `${days}天 ` : ''}${hours}小时${minutes}分钟`,
        `当前时间: ${now.toLocaleTimeString('zh-CN')}`,
        `登录用户: ${Math.floor(Math.random() * 5) + 1}`,
      ].join('\n')
    }
  },
  description: '显示系统运行时间',
  usage: 'uptime',
  examples: ['uptime']
})

registerCommand('ps', {
  handler: (): CommandResult => {
    const windows = useStore.getState().windows
    const processes = [
      { pid: 1, tty: '?', time: '00:00:01', cmd: 'init' },
      { pid: 2, tty: '?', time: '00:00:00', cmd: 'kthreadd' },
      { pid: 100, tty: 'pts/0', time: '00:00:02', cmd: 'bash' },
      { pid: 101, tty: 'pts/0', time: '00:00:01', cmd: 'terminal' },
      ...windows.map((win, index) => ({
        pid: 200 + index,
        tty: '?',
        time: `00:00:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`,
        cmd: win.appId,
      })),
    ]
    
    const output = [
      '  PID TTY          TIME CMD',
      ...processes.map(p => `${p.pid.toString().padStart(5)} ${p.tty.padEnd(8)} ${p.time.padEnd(10)} ${p.cmd}`),
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示进程列表',
  usage: 'ps',
  examples: ['ps']
})

registerCommand('top', {
  handler: (): CommandResult => {
    const windows = useStore.getState().windows
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const totalMemory = deviceMemory ? deviceMemory * 1024 : 16384
    const perfMemory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
    
    const usedMemory = Math.floor((perfMemory?.usedJSHeapSize || 0) / (1024 * 1024) || Math.random() * 1000 + 500)
    const freeMemory = totalMemory - usedMemory
    
    const cpuUsage = Math.min(100, Math.floor(((perfMemory?.usedJSHeapSize || 0) / (perfMemory?.totalJSHeapSize || 1)) * 100) || Math.floor(Math.random() * 30 + 5))
    
    const processes = [
      { pid: 1, user: 'root', cpu: 0.1, mem: 0.5, cmd: 'init', time: '00:01:23' },
      { pid: 2, user: 'root', cpu: 0.0, mem: 0.1, cmd: 'kthreadd', time: '00:00:01' },
      { pid: 3, user: 'root', cpu: 0.2, mem: 0.3, cmd: 'systemd', time: '00:00:45' },
      ...windows.map((win, index) => ({
        pid: 100 + index,
        user: 'user',
        cpu: Math.min(100, Math.floor(Math.random() * 15 + 0.5)),
        mem: Math.min(100, Math.floor(Math.random() * 8 + 1)),
        cmd: win.appId,
        time: `00:0${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      })),
      { pid: 998, user: 'root', cpu: 2.5, mem: 4.0, cmd: 'window-manager', time: '00:05:32' },
      { pid: 999, user: 'root', cpu: 1.2, mem: 3.5, cmd: 'desktop', time: '00:04:18' },
    ].sort((a, b) => b.cpu - a.cpu)
    
    const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0)
    
    const output = [
      `top - ${new Date().toLocaleTimeString('zh-CN')} up ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')},  1 user,  load average: ${(0.1 + Math.random() * 0.5).toFixed(2)}, ${(0.1 + Math.random() * 0.4).toFixed(2)}, ${(0.1 + Math.random() * 0.3).toFixed(2)}`,
      '',
      `Tasks: ${processes.length} total,   1 running,  ${processes.length - 1} sleeping,   0 stopped,   0 zombie`,
      `%Cpu(s): ${totalCpu.toFixed(1)} us,  ${(cpuUsage - totalCpu).toFixed(1)} sy,  0.0 ni, ${(100 - cpuUsage).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`,
      `MiB Mem :   ${totalMemory}.0 total,    ${freeMemory.toFixed(1)} free,    ${usedMemory.toFixed(1)} used,    ${(totalMemory - usedMemory - freeMemory).toFixed(1)} buff/cache`,
      `MiB Swap:      0.0 total,      0.0 free,      0.0 used.   ${(totalMemory * 0.8).toFixed(1)} avail Mem`,
      '',
      '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      ...processes.slice(0, 10).map(p => `${p.pid.toString().padStart(6)} ${p.user.padEnd(8)}  20   0 ${(p.mem * 100).toFixed(0).padStart(8)} ${(p.mem * 50).toFixed(0).padStart(8)} ${(p.mem * 30).toFixed(0).padStart(8)} S  ${p.cpu.toString().padStart(5)} ${p.mem.toString().padStart(5)} ${p.time.padEnd(10)} ${p.cmd}`),
      '',
      `提示: 使用 'kill <PID>' 关闭进程，'q' 退出，'h' 查看帮助`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示系统进程和资源使用情况',
  usage: 'top',
  examples: ['top']
})

registerCommand('kill', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'kill: 缺少进程ID\n用法: kill [-9] <PID>' }
    }
    
    const force = args.includes('-9') || args.includes('-KILL')
    const pidArg = args.find(arg => !arg.startsWith('-'))
    
    if (!pidArg) {
      return { output: 'kill: 缺少进程ID\n用法: kill [-9] <PID>' }
    }
    
    const pid = parseInt(pidArg)
    
    if (isNaN(pid)) {
      return { output: `kill: ${pidArg}: 参数必须是数字` }
    }
    
    const windows = useStore.getState().windows
    const closeWindow = useStore.getState().closeWindow
    
    const systemPids = [1, 2, 3, 997, 998, 999]
    if (systemPids.includes(pid)) {
      return { output: `kill: 无法终止系统进程 ${pid}` }
    }
    
    const windowIndex = pid - 100
    if (windowIndex >= 0 && windowIndex < windows.length) {
      const window = windows[windowIndex]
      closeWindow(window.id)
      const signal = force ? 'KILL' : 'TERM'
      return { output: `已发送 ${signal} 信号到进程 ${pid} (${window.appId})` }
    }
    
    return { output: `kill: ${pid}: 没有那个进程` }
  },
  description: '终止进程',
  usage: 'kill [-9] <PID>',
  examples: ['kill 100', 'kill -9 101']
})

registerCommand('killall', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'killall: 缺少进程名称\n用法: killall <进程名>' }
    }
    
    const processName = args[0]
    const windows = useStore.getState().windows
    const closeWindow = useStore.getState().closeWindow
    
    const matchingWindows = windows.filter(win => win.appId.toLowerCase() === processName.toLowerCase())
    
    if (matchingWindows.length === 0) {
      return { output: `killall: ${processName}: 没有找到匹配的进程` }
    }
    
    matchingWindows.forEach(win => closeWindow(win.id))
    
    return { output: `已终止 ${matchingWindows.length} 个名为 '${processName}' 的进程` }
  },
  description: '按名称终止进程',
  usage: 'killall <进程名>',
  examples: ['killall terminal', 'killall browser']
})

registerCommand('credits', {
  handler: (): CommandResult => {
    const output = [
      '🎉 WebLinuxOS 致谢',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '📦 核心技术栈:',
      '  • React 19.2.6 - UI框架',
      '  • TypeScript 6 - 类型系统',
      '  • Zustand 5 - 状态管理',
      '  • Vite 8 - 构建工具',
      '  • Pyodide 0.26 - Python运行时',
      '  • Lucide React - 图标库',
      '',
      '🛠️ 开发工具:',
      '  • Git - 版本控制',
      '  • GitHub Pages - 托管部署',
      '  • Trae AI - 代码优化助手',
      '',
      '👨‍💻 贡献者:',
      '  • saya-ch - 项目发起者和维护者',
      '  • 所有开源社区贡献者',
      '',
      '💝 特别感谢:',
      '  • React团队',
      '  • Vite团队',
      '  • 所有使用和支持WebLinuxOS的用户',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '📝 许可证: MIT',
      '🌐 网址: https://github.com/saya-ch/WebLinuxOS',
    ].join('\n')

    return { output }
  },
  description: '显示致谢信息',
  usage: 'credits',
  examples: ['credits']
})

function parseBrowser(ua: string): { name: string; version: string } {
  if (/Edg\/([\d.]+)/.test(ua)) {
    return { name: 'Microsoft Edge', version: RegExp.$1 }
  }
  if (/OPR\/([\d.]+)/.test(ua) || /Opera\/([\d.]+)/.test(ua)) {
    return { name: 'Opera', version: RegExp.$1 }
  }
  if (/Firefox\/([\d.]+)/.test(ua)) {
    return { name: 'Mozilla Firefox', version: RegExp.$1 }
  }
  if (/Chrome\/([\d.]+)/.test(ua)) {
    return { name: 'Google Chrome', version: RegExp.$1 }
  }
  if (/Version\/([\d.]+).*Safari/.test(ua)) {
    return { name: 'Safari', version: RegExp.$1 }
  }
  return { name: '未知浏览器', version: '未知' }
}

function parseOS(ua: string): string {
  if (/Windows NT ([\d.]+)/.test(ua)) {
    const ver = RegExp.$1
    const winMap: Record<string, string> = {
      '10.0': 'Windows 10/11',
      '6.3': 'Windows 8.1',
      '6.2': 'Windows 8',
      '6.1': 'Windows 7',
    }
    return winMap[ver] || `Windows NT ${ver}`
  }
  if (/iPhone OS ([\d_]+)/.test(ua) || /CPU OS ([\d_]+)/.test(ua)) {
    return `iOS ${RegExp.$1.replace(/_/g, '.')}`
  }
  if (/Android ([\d.]+)/.test(ua)) {
    return `Android ${RegExp.$1}`
  }
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    return `macOS ${RegExp.$1.replace(/_/g, '.')}`
  }
  if (/Linux/.test(ua)) {
    return 'Linux'
  }
  return '未知系统'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function countFileSystem(nodes: FileNode[]): { files: number; folders: number; size: number } {
  let files = 0
  let folders = 0
  let size = 0
  for (const node of nodes) {
    if (node.type === 'folder') {
      folders++
      if (node.children) {
        const child = countFileSystem(node.children)
        files += child.files
        folders += child.folders
        size += child.size
      }
    } else {
      files++
      size += (node.content?.length || 0) * 2
    }
  }
  return { files, folders, size }
}

registerCommand('sysinfo', {
  handler: (context: CommandContext): CommandResult => {
    const cyan = '\x1b[36m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const magenta = '\x1b[35m'
    const bold = '\x1b[1m'
    const reset = '\x1b[0m'

    const ua = navigator.userAgent
    const browser = parseBrowser(ua)
    const os = parseOS(ua)
    const nav = navigator as Navigator & { deviceMemory?: number }
    const deviceMemory = nav.deviceMemory ? `${nav.deviceMemory} GB` : '不可用'
    const cpuCores = navigator.hardwareConcurrency || '不可用'
    const languages = navigator.languages?.join(', ') || navigator.language
    const screenRes = `${screen.width} × ${screen.height}`
    const colorDepth = `${screen.colorDepth} 位`
    const online = navigator.onLine ? `${green}在线${reset}` : `${yellow}离线${reset}`
    const cookieEnabled = navigator.cookieEnabled ? '是' : '否'
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const { windows, currentDesktop, totalDesktops } = useStore.getState()

    const fsStats = countFileSystem(context.files)

    const output: string[] = []
    output.push(`${bold}${cyan}╔══════════════════════════════════════════╗${reset}`)
    output.push(`${bold}${cyan}║       WebLinuxOS 系统信息 (sysinfo)       ║${reset}`)
    output.push(`${bold}${cyan}╚══════════════════════════════════════════╝${reset}`)
    output.push('')

    output.push(`${bold}${magenta}【浏览器信息】${reset}`)
    output.push(`  浏览器:     ${green}${browser.name}${reset} ${browser.version}`)
    output.push(`  操作系统:   ${os}`)
    output.push(`  屏幕分辨率: ${screenRes} (${colorDepth}色彩)`)
    output.push(`  设备内存:   ${deviceMemory}`)
    output.push(`  CPU核心数:  ${cpuCores}`)
    output.push(`  语言偏好:   ${languages}`)
    output.push(`  在线状态:   ${online}`)
    output.push(`  Cookie:     ${cookieEnabled}`)
    output.push(`  时区:       ${timezone}`)
    output.push('')

    output.push(`${bold}${magenta}【虚拟文件系统】${reset}`)
    output.push(`  文件数:     ${green}${fsStats.files}${reset}`)
    output.push(`  文件夹数:   ${green}${fsStats.folders}${reset}`)
    output.push(`  总大小:     ${yellow}${formatBytes(fsStats.size)}${reset} (估算)`)
    output.push('')

    output.push(`${bold}${magenta}【窗口管理】${reset}`)
    output.push(`  打开窗口数: ${green}${windows.length}${reset}`)
    output.push(`  当前桌面:   ${currentDesktop} / ${totalDesktops}`)
    output.push('')

    output.push(`${bold}${magenta}【系统信息】${reset}`)
    output.push(`  用户:       ${context.username}@${context.hostname}`)
    output.push(`  主题:       ${context.theme}`)
    output.push(`  工作目录:   ${context.cwd}`)
    output.push('')

    output.push(`${'─'.repeat(44)}`)
    output.push(`数据采集时间: ${new Date().toLocaleString('zh-CN')}`)

    return { output: output.join('\n') }
  },
  description: '显示浏览器与系统详细信息',
  usage: 'sysinfo',
  examples: ['sysinfo']
})

registerCommand('free', {
  handler: (): CommandResult => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }
    
    const deviceMemory = nav.deviceMemory ? nav.deviceMemory * 1024 * 1024 * 1024 : 16 * 1024 * 1024 * 1024
    const usedJS = perf.memory?.usedJSHeapSize || Math.floor(Math.random() * 1024 * 1024 * 500 + 100 * 1024 * 1024)
    const totalJS = perf.memory?.totalJSHeapSize || Math.floor(deviceMemory * 0.5)
    const limitJS = perf.memory?.jsHeapSizeLimit || deviceMemory
    
    const usedPercent = ((usedJS / totalJS) * 100).toFixed(1)
    const freeJS = totalJS - usedJS
    
    const formatMem = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}K`
      return bytes.toString()
    }
    
    const output = [
      '              total        used        free      shared  buff/cache   available',
      `Mem:     ${formatMem(deviceMemory).padStart(12)} ${formatMem(usedJS).padStart(12)} ${formatMem(freeJS).padStart(12)} ${formatMem(0).padStart(10)} ${formatMem(totalJS - usedJS).padStart(12)} ${formatMem(limitJS - usedJS).padStart(12)}`,
      `Swap:            0B          0B          0B`,
      '',
      `内存使用率: ${usedPercent}%`,
      `JS堆大小限制: ${formatMem(limitJS)}`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示内存使用情况',
  usage: 'free',
  examples: ['free']
})

registerCommand('df', {
  handler: (context: CommandContext): CommandResult => {
    const fsStats = countFileSystem(context.files)
    const totalSpace = 5 * 1024 * 1024 * 1024
    const usedSpace = fsStats.size + Math.floor(Math.random() * 100 * 1024 * 1024)
    const freeSpace = totalSpace - usedSpace
    const usedPercent = ((usedSpace / totalSpace) * 100).toFixed(1)
    
    const formatSize = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}K`
      return bytes.toString()
    }
    
    const output = [
      '文件系统        总容量    已用    可用    已用%  挂载点',
      `weblinux-vfs    ${formatSize(totalSpace)}   ${formatSize(usedSpace)}   ${formatSize(freeSpace)}   ${usedPercent}%   /`,
      `browser-cache   2.0G      512M    1.5G    25%    /cache`,
      `localstorage    512M      ${formatSize(fsStats.size)}   ${formatSize(512 * 1024 * 1024 - fsStats.size)}   ${((fsStats.size / (512 * 1024 * 1024)) * 100).toFixed(1)}%   /home/user`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示磁盘使用情况',
  usage: 'df',
  examples: ['df']
})

registerCommand('who', {
  handler: (context: CommandContext): CommandResult => {
    const windows = useStore.getState().windows
    const terminalWindows = windows.filter(w => w.appId === 'terminal')
    
    const output = [
      `${context.username}    pts/0        ${new Date().toLocaleString('zh-CN')}`,
      ...terminalWindows.slice(1).map((_, i) => `${context.username}    pts/${i + 1}        ${new Date().toLocaleString('zh-CN')}`),
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示登录用户',
  usage: 'who',
  examples: ['who']
})

registerCommand('w', {
  handler: (context: CommandContext): CommandResult => {
    const windows = useStore.getState().windows
    const now = new Date()
    const uptimeHours = Math.floor(Math.random() * 24)
    const uptimeMins = Math.floor(Math.random() * 60)
    const loadAvg = [
      (0.1 + Math.random() * 0.5).toFixed(2),
      (0.1 + Math.random() * 0.4).toFixed(2),
      (0.1 + Math.random() * 0.3).toFixed(2),
    ]
    
    const output = [
      `${now.toLocaleTimeString('zh-CN')} up ${uptimeHours}小时${uptimeMins}分钟,  ${windows.length} 个用户,  平均负载: ${loadAvg.join(', ')}`,
      '',
      'USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT',
      `${context.username}  pts/0    -                ${now.toLocaleTimeString('zh-CN')}    0.00s  0.00s  0.00s w`,
      ...windows.filter(w => w.appId !== 'terminal').slice(0, 3).map((w) => 
        `${context.username}  ?        -                ${now.toLocaleTimeString('zh-CN')}    0.00s  0.00s  0.00s ${w.appId}`
      ),
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示系统负载和用户信息',
  usage: 'w',
  examples: ['w']
})

registerCommand('cal', {
  handler: (context: CommandContext): CommandResult => {
    const args = context.args
    let year = new Date().getFullYear()
    let month = new Date().getMonth()
    
    if (args.length === 1) {
      const num = parseInt(args[0])
      if (!isNaN(num)) {
        if (num >= 1 && num <= 12) {
          month = num - 1
        } else if (num >= 1900 && num <= 2100) {
          year = num
        }
      }
    } else if (args.length === 2) {
      const m = parseInt(args[0])
      const y = parseInt(args[1])
      if (!isNaN(m) && m >= 1 && m <= 12 && !isNaN(y) && y >= 1900 && y <= 2100) {
        month = m - 1
        year = y
      }
    }
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    
    const output: string[] = []
    output.push(`${monthNames[month]} ${year}`)
    output.push(weekDays.join('  '))
    
    let line = ''
    for (let i = 0; i < firstDay; i++) {
      line += '   '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      line += String(day).padStart(2) + ' '
      if ((day + firstDay) % 7 === 0) {
        output.push(line.trim())
        line = ''
      }
    }
    
    if (line) {
      output.push(line.trim())
    }
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'cal [月份] [年份]',
  examples: ['cal', 'cal 12', 'cal 12 2024']
})

registerCommand('time', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'time: 缺少命令参数\n用法: time <命令>' }
    }
    
    const commandStr = args.join(' ')
    const parts = commandStr.split(/\s+/)
    const command = parts[0].toLowerCase()
    const cmdArgs = parts.slice(1)
    
    const startTime = performance.now()
    
    const cmdDef = getCommand(command)
    let output = ''
    
    if (cmdDef) {
      try {
        const result = await cmdDef.handler({ ...context, args: cmdArgs })
        output = result.output
      } catch (error) {
        output = `命令执行错误: ${(error as Error).message}`
      }
    } else {
      output = `bash: ${command}: 未找到命令`
    }
    
    const endTime = performance.now()
    const elapsed = ((endTime - startTime) / 1000).toFixed(4)
    
    return {
      output: `${output}\n\nreal    ${elapsed}s\nuser    0.000s\nsys     0.000s`
    }
  },
  description: '测量命令执行时间',
  usage: 'time <命令>',
  examples: ['time ls -la', 'time neofetch']
})

registerCommand('env', {
  handler: (context: CommandContext): CommandResult => {
    const envVars: Record<string, string> = {
      HOME: '/home/user',
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games',
      SHELL: '/bin/bash',
      USER: context.username,
      LOGNAME: context.username,
      HOSTNAME: context.hostname,
      TERM: 'xterm-256color',
      LANG: 'zh_CN.UTF-8',
      LC_ALL: 'zh_CN.UTF-8',
      PWD: context.cwd,
      OLDPWD: context.prevCwd || '',
      EDITOR: 'nano',
      BROWSER: 'browser',
      DISPLAY: ':0',
      COLORTERM: 'truecolor',
      XDG_SESSION_TYPE: 'web',
      XDG_SEAT: 'seat0',
      WEB_LINUX_VERSION: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    }
    
    const output = Object.entries(envVars)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    
    return { output }
  },
  description: '显示环境变量',
  usage: 'env',
  examples: ['env']
})

registerCommand('export', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'export: 缺少参数\n用法: export VAR=value' }
    }
    
    const [varDef] = args
    const [name, value] = varDef.split('=')
    
    if (!name || value === undefined) {
      return { output: 'export: 无效的变量定义\n用法: export VAR=value' }
    }
    
    return { output: `已设置环境变量: ${name}=${value}` }
  },
  description: '设置环境变量',
  usage: 'export VAR=value',
  examples: ['export EDITOR=nano', 'export PATH=$PATH:/custom/bin']
})

registerCommand('which', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'which: 缺少参数\n用法: which <命令>' }
    }
    
    const command = args[0].toLowerCase()
    const cmdDef = getCommand(command)
    
    if (cmdDef) {
      return { output: `/usr/bin/${command}` }
    }
    
    return { output: `which: ${command}: 未找到` }
  },
  description: '查找命令位置',
  usage: 'which <命令>',
  examples: ['which ls', 'which neofetch']
})