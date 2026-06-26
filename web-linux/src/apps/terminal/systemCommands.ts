import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

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
    
    if (args.includes('-a')) {
      return { output: `Distributor ID: WebLinux\nDescription:    Web Linux 2.9\nRelease:        2.9.0\nCodename:       web` }
    }
    
    return { output: 'Web Linux 2.9' }
  },
  description: '显示发行版信息',
  usage: 'lsb_release [-a]',
  examples: ['lsb_release', 'lsb_release -a']
})

registerCommand('neofetch', {
  handler: (context: CommandContext): CommandResult => {
    const { username, hostname, theme } = context
    
    const output = [
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
    
    return { output }
  },
  description: '显示系统信息（ASCII艺术风格）',
  usage: 'neofetch',
  examples: ['neofetch']
})

registerCommand('version', {
  handler: (): CommandResult => {
    const output = [
      'WebLinuxOS 版本信息',
      '',
      '  版本:   2.9.0',
      '  内核:   6.15.0-web',
      '  架构:   x86_64',
      '  平台:   WebAssembly',
      '  发布:   2026-05-25',
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
    const output = [
      '═══════════════════════════════════════',
      '         WebLinuxOS 关于',
      '═══════════════════════════════════════',
      '',
      '  WebLinuxOS 是一个功能完整的',
      '  Web端Linux桌面操作系统模拟器',
      '',
      '  版本: 2.9.0',
      '  发布日期: 2026-05-25',
      '',
      '  特性:',
      '    ✓ 60+ 预装应用程序',
      '    ✓ 多窗口管理系统',
      '    ✓ 虚拟文件系统',
      '    ✓ 终端模拟器',
      '    ✓ Python运行时支持',
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
    const processes = [
      { pid: 1, tty: '?', time: '00:00:01', cmd: 'init' },
      { pid: 2, tty: '?', time: '00:00:00', cmd: 'kthreadd' },
      { pid: 100, tty: 'pts/0', time: '00:00:02', cmd: 'bash' },
      { pid: 101, tty: 'pts/0', time: '00:00:01', cmd: 'terminal' },
      { pid: 200, tty: '?', time: '00:00:03', cmd: 'window-manager' },
      { pid: 201, tty: '?', time: '00:00:02', cmd: 'desktop' },
      { pid: 300, tty: '?', time: '00:00:01', cmd: 'file-manager' },
      { pid: 400, tty: '?', time: '00:00:00', cmd: 'code-editor' },
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
    const processes = [
      { pid: 100, user: 'user', cpu: 2.3, mem: 1.2, cmd: 'terminal' },
      { pid: 200, user: 'root', cpu: 1.8, mem: 2.5, cmd: 'window-manager' },
      { pid: 201, user: 'root', cpu: 1.5, mem: 1.8, cmd: 'desktop' },
      { pid: 300, user: 'user', cpu: 1.2, mem: 3.2, cmd: 'file-manager' },
      { pid: 400, user: 'user', cpu: 0.8, mem: 4.5, cmd: 'code-editor' },
      { pid: 500, user: 'user', cpu: 0.5, mem: 2.1, cmd: 'browser' },
      { pid: 600, user: 'user', cpu: 0.3, mem: 1.5, cmd: 'music-player' },
      { pid: 1, user: 'root', cpu: 0.1, mem: 0.5, cmd: 'init' },
    ]
    
    const totalCpu = processes.reduce((sum, p) => sum + p.cpu, 0)
    const totalMem = processes.reduce((sum, p) => sum + p.mem, 0)
    
    const output = [
      `top - ${new Date().toLocaleTimeString('zh-CN')} up ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')},  1 user,  load average: 0.15, 0.20, 0.18`,
      '',
      'Tasks: 15 total,   1 running,  14 sleeping,   0 stopped,   0 zombie',
      `%Cpu(s): ${totalCpu.toFixed(1)} us,  2.0 sy,  0.0 ni, ${(100 - totalCpu - 2).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`,
      `MiB Mem :   16384.0 total,    ${(16384 - totalMem * 100).toFixed(1)} free,    ${totalMem * 100} used,    2048.0 buff/cache`,
      '',
      '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      ...processes.map(p => `${p.pid.toString().padStart(6)} ${p.user.padEnd(8)}  20   0 ${(p.mem * 100).toFixed(0).padStart(8)} ${(p.mem * 50).toFixed(0).padStart(8)} ${(p.mem * 30).toFixed(0).padStart(8)} S  ${p.cpu.toString().padStart(5)} ${p.mem.toString().padStart(5)} 00:00:${String(Math.floor(Math.random() * 30)).padStart(2, '0')} ${p.cmd}`),
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示系统进程和资源使用情况',
  usage: 'top',
  examples: ['top']
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