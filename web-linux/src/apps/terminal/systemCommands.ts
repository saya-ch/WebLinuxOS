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
  handler: (): CommandResult => {
    return { output: new Date().toString() }
  },
  description: '显示当前日期和时间',
  usage: 'date',
  examples: ['date']
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