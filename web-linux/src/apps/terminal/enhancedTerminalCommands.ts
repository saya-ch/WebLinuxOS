import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('apt', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: apt <命令> [包名]\n命令: install, remove, list, search, update, info' }
    }
    
    const [cmd, ...pkgArgs] = args
    const pkgName = pkgArgs.join(' ')
    
    const packages = [
      { name: 'bash', version: '5.2.21', size: '1.2M', desc: 'GNU Bourne Again SHell' },
      { name: 'git', version: '2.45.0', size: '8.2M', desc: '分布式版本控制系统' },
      { name: 'python3', version: '3.12.3', size: '28.5M', desc: 'Python 编程语言' },
      { name: 'nodejs', version: '22.2.0', size: '45.1M', desc: 'Node.js JavaScript 运行时' },
      { name: 'vim', version: '9.1', size: '3.5M', desc: 'Vi IMproved 文本编辑器' },
      { name: 'nginx', version: '1.26.0', size: '1.9M', desc: 'HTTP 及反向代理服务器' },
      { name: 'docker', version: '26.1.0', size: '55.3M', desc: '容器虚拟化工具' },
      { name: 'ffmpeg', version: '7.0', size: '18.6M', desc: '多媒体处理工具' },
      { name: 'tmux', version: '3.4', size: '0.7M', desc: '终端复用器' },
      { name: 'htop', version: '3.3.0', size: '0.5M', desc: '交互式进程查看器' },
      { name: 'ripgrep', version: '14.2', size: '8.1M', desc: '递归搜索工具' },
      { name: 'fd', version: '9.0', size: '1.2M', desc: '简单快速的查找替代工具' },
      { name: 'bat', version: '0.24', size: '4.5M', desc: '带语法高亮的 cat 替代' },
      { name: 'jq', version: '1.7.1', size: '3.2M', desc: 'JSON 处理器' },
      { name: 'httpie', version: '3.2', size: '2.1M', desc: 'HTTP 客户端' },
    ]
    
    switch (cmd) {
      case 'list':
        return { output: packages.map(p => `${p.name} ${p.version} - ${p.desc}`).join('\n') }
      case 'search': {
        if (!pkgName) return { output: '请提供搜索关键词\n用法: apt search <关键词>' }
        const results = packages.filter(p => p.name.includes(pkgName) || p.desc.includes(pkgName))
        return results.length > 0 
          ? { output: results.map(p => `${p.name} ${p.version} ${p.size} - ${p.desc}`).join('\n') }
          : { output: `未找到匹配 "${pkgName}" 的包` }
      }
      case 'install':
        return pkgName 
          ? { output: `正在下载 ${pkgName}...\n正在安装 ${pkgName}...\n✓ ${pkgName} 安装成功\n使用 "apt list" 查看已安装包` }
          : { output: '请提供包名\n用法: apt install <包名>' }
      case 'remove':
        return pkgName 
          ? { output: `正在卸载 ${pkgName}...\n✓ ${pkgName} 已卸载` }
          : { output: '请提供包名\n用法: apt remove <包名>' }
      case 'update':
        return { output: '正在更新软件源...\n✓ 软件源已是最新\n2 个包可升级' }
      case 'info': {
        if (!pkgName) return { output: '请提供包名\n用法: apt info <包名>' }
        const pkg = packages.find(p => p.name === pkgName)
        return pkg 
          ? { output: `包名: ${pkg.name}\n版本: ${pkg.version}\n大小: ${pkg.size}\n描述: ${pkg.desc}\n状态: 已安装` }
          : { output: `未找到包: ${pkgName}` }
      }
      default:
        return { output: `未知命令: ${cmd}\n可用命令: install, remove, list, search, update, info` }
    }
  },
  description: '包管理器（模拟）',
  usage: 'apt <命令> [包名]',
  examples: ['apt list', 'apt install nodejs', 'apt search python', 'apt info git']
})

registerCommand('app', {
  handler: (context: CommandContext): CommandResult => {
    const { args, openApp } = context
    if (args.length === 0) {
      return { output: '用法: app <命令> [参数]\n命令: list, open, search, info' }
    }
    
    const [cmd, ...appArgs] = args
    const appName = appArgs.join(' ')
    
    switch (cmd) {
      case 'list': {
        const event = new CustomEvent('weblinux-get-apps')
        window.dispatchEvent(event)
        return { output: '已发送应用列表请求\n请使用 "app search <关键词>" 搜索特定应用' }
      }
      case 'open': {
        if (!appName) return { output: '请提供应用名\n用法: app open <应用名>' }
        if (openApp) {
          openApp(appName)
          return { output: `正在打开 ${appName}...` }
        }
        return { output: `触发打开应用: ${appName}` }
      }
      case 'search': {
        if (!appName) return { output: '请提供搜索关键词\n用法: app search <关键词>' }
        const searchEvent = new CustomEvent('weblinux-search-apps', { detail: { query: appName } })
        window.dispatchEvent(searchEvent)
        return { output: `搜索应用: ${appName}\n打开全局搜索查看结果` }
      }
      case 'info': {
        if (!appName) return { output: '请提供应用名\n用法: app info <应用名>' }
        return { output: `应用信息: ${appName}\n使用 "app open ${appName}" 打开应用` }
      }
      default:
        return { output: `未知命令: ${cmd}\n可用命令: list, open, search, info` }
    }
  },
  description: '应用管理器',
  usage: 'app <命令> [参数]',
  examples: ['app list', 'app open terminal', 'app search code']
})

registerCommand('theme', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      const saved = localStorage.getItem('weblinux-theme') || 'auto'
      return { output: `当前主题: ${saved}\n可用主题: light, dark, auto` }
    }
    
    const theme = args[0]
    if (!['light', 'dark', 'auto'].includes(theme)) {
      return { output: `无效主题: ${theme}\n可用主题: light, dark, auto` }
    }
    
    localStorage.setItem('weblinux-theme', theme)
    const event = new CustomEvent('weblinux-theme-change', { detail: { theme } })
    window.dispatchEvent(event)
    
    return { output: `✓ 主题已切换为 ${theme}` }
  },
  description: '切换系统主题',
  usage: 'theme [light|dark|auto]',
  examples: ['theme', 'theme dark', 'theme light']
})

registerCommand('shortcut', {
  handler: (): CommandResult => {
    const shortcuts = [
      ['Ctrl/Cmd + Shift + K', '智能搜索'],
      ['Ctrl/Cmd + Shift + P', '命令面板'],
      ['Ctrl/Cmd + T', '终端'],
      ['Ctrl/Cmd + E', '文件管理器'],
      ['Ctrl/Cmd + B', '浏览器'],
      ['Ctrl/Cmd + ,', '设置'],
      ['Ctrl/Cmd + Shift + C', '计算器'],
      ['Ctrl/Cmd + Shift + E', '文本编辑器'],
      ['Ctrl/Cmd + Shift + P', '画图'],
      ['Ctrl/Cmd + I', '图像查看器'],
      ['Ctrl/Cmd + H', '帮助'],
      ['Ctrl/Cmd + Alt + N', '笔记'],
      ['Ctrl/Cmd + Shift + D', '日历'],
      ['Ctrl/Cmd + Shift + M', '音乐播放器'],
      ['Ctrl/Cmd + G', '代码编辑器'],
      ['Ctrl/Cmd + S', '系统监控'],
      ['Ctrl/Cmd + Shift + W', '天气'],
      ['Ctrl/Cmd + Alt + I', '摄像头'],
      ['Ctrl/Cmd + Shift + O', '密码管理器'],
      ['Ctrl/Cmd + Shift + L', '启动器'],
      ['Ctrl/Cmd + Alt + Tab', '切换窗口'],
      ['Ctrl/Cmd + Alt + 1-9', '切换桌面'],
      ['Ctrl/Cmd + Q', '关闭窗口'],
      ['Ctrl/Cmd + M', '最小化窗口'],
      ['Ctrl/Cmd + Shift + N', '新建终端'],
      ['F11', '全屏切换'],
      ['PrintScreen', '截图'],
      ['Ctrl/Cmd + Shift + ?', '快捷键面板'],
      ['Alt + N', '快速笔记'],
    ]
    
    const output = shortcuts.map(([key, desc]) => `${key.padEnd(25)} ${desc}`).join('\n')
    return { output: `WebLinuxOS 键盘快捷键:\n\n${output}` }
  },
  description: '显示所有键盘快捷键',
  usage: 'shortcut',
  examples: ['shortcut', 'shortcuts', 'help-shortcuts']
})

registerCommand('neofetch', {
  handler: (context: CommandContext): CommandResult => {
    const { hostname } = context
    const os = 'WebLinuxOS 103.0'
    const kernel = '6.15.0-web'
    const shell = 'bash 5.2.21'
    const de = 'WebLinux Desktop'
    const theme = localStorage.getItem('weblinux-theme') || 'auto'
    const cpu = 'JavaScript V8 Engine'
    const mem = `${Math.round((performance as any)?.memory?.usedJSHeapSize / 1048576) || 256}MB / ${Math.round((performance as any)?.memory?.jsHeapSizeLimit / 1048576) || 2048}MB`
    const uptime = Math.floor(performance.now() / 1000)
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const mins = Math.floor((uptime % 3600) / 60)
    
    const logo = `       .--.          
      |o_o |         
      |:_/ |         
     //   \\ \\        
    (|     | )       
   /'\\_   _/\`\\       
   \\___)=(___/`
    
    const info = [
      `${os}`,
      '-----------------',
      `OS:       ${os}`,
      `Host:     ${hostname}`,
      `Kernel:   ${kernel}`,
      `Uptime:   ${days}d ${hours}h ${mins}m`,
      `Shell:    ${shell}`,
      `DE:       ${de}`,
      `Theme:    ${theme}`,
      `CPU:      ${cpu}`,
      `Memory:   ${mem}`,
      `Terminal: WebTerminal`,
    ]
    
    const lines = logo.split('\n')
    const maxLen = Math.max(lines.length, info.length)
    const output: string[] = []
    
    for (let i = 0; i < maxLen; i++) {
      const logoLine = lines[i] || ' '.repeat(lines[0].length)
      const infoLine = info[i] || ''
      output.push(`${logoLine}  ${infoLine}`)
    }
    
    return { output: output.join('\n') }
  },
  description: '系统信息展示（仿 neofetch）',
  usage: 'neofetch',
  examples: ['neofetch', 'system-info', 'fetch']
})

registerCommand('speedtest', {
  handler: (): CommandResult => {
    return { 
      output: `测速中...\n\n` +
              `下载速度: ${(10 + Math.random() * 20).toFixed(1)} Mbps\n` +
              `上传速度: ${(5 + Math.random() * 10).toFixed(1)} Mbps\n` +
              `延迟: ${Math.floor(10 + Math.random() * 30)} ms\n` +
              `网络类型: ${(navigator as any).connection?.effectiveType || 'unknown'}\n` +
              `在线状态: ${navigator.onLine ? '✓ 在线' : '✗ 离线'}`
    }
  },
  description: '网络速度测试',
  usage: 'speedtest',
  examples: ['speedtest', 'speed', 'net-speed']
})

registerCommand('sysinfo', {
  handler: (): CommandResult => {
    const nav = navigator as any
    const perf = performance as any
    const mem = perf?.memory
    
    return {
      output: [
        '=== 系统信息 ===',
        '',
        '浏览器:',
        `  名称: ${nav.userAgentData?.brands?.[0]?.brand || 'Unknown'}`,
        `  版本: ${nav.userAgentData?.brands?.[0]?.version || 'Unknown'}`,
        `  平台: ${nav.userAgentData?.platform || 'Unknown'}`,
        '',
        'CPU:',
        `  核心数: ${nav.hardwareConcurrency || 'Unknown'}`,
        '',
        '内存:',
        `  已用: ${mem ? Math.round(mem.usedJSHeapSize / 1048576) + 'MB' : 'N/A'}`,
        `  总量: ${mem ? Math.round(mem.totalJSHeapSize / 1048576) + 'MB' : 'N/A'}`,
        `  限制: ${mem ? Math.round(mem.jsHeapSizeLimit / 1048576) + 'MB' : 'N/A'}`,
        '',
        '屏幕:',
        `  分辨率: ${screen.width}x${screen.height}`,
        `  可用: ${screen.availWidth}x${screen.availHeight}`,
        `  DPI: ${window.devicePixelRatio}x`,
        '',
        '网络:',
        `  类型: ${nav.connection?.effectiveType || 'Unknown'}`,
        `  下行: ${nav.connection?.downlink || 'Unknown'} Mbps`,
        `  RTT: ${nav.connection?.rtt || 'Unknown'} ms`,
        '',
        '特性:',
        `  WebGL: ${document.createElement('canvas').getContext('webgl') ? '✓' : '✗'}`,
        `  WebGPU: ${'gpu' in nav ? '✓' : '✗'}`,
        `  WASM: ${typeof WebAssembly !== 'undefined' ? '✓' : '✗'}`,
        `  Service Worker: ${'serviceWorker' in nav ? '✓' : '✗'}`,
        `  File Access: ${'showDirectoryPicker' in window ? '✓' : '✗'}`,
      ].join('\n')
    }
  },
  description: '详细系统信息',
  usage: 'sysinfo',
  examples: ['sysinfo', 'system', 'about-system']
})

registerCommand('banner', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ') || 'WebLinuxOS'
    
    const fonts: Record<string, (t: string) => string> = {
      standard: (t: string) => {
        const lines = t.split('\n')
        return lines.map(l => {
          const chars: Record<string, string> = {
            'W': '██╗    ██╗███████╗██╗  ██╗██╗     ██████╗     ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗ ',
            'e': '██║    ██║██╔════╝╚██╗██╔╝██║     ██╔══██╗    ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗',
            'b': '██║ █╗ ██║█████╗   ╚███╔╝ ██║     ██████╔╝    ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║',
            'L': '██║███╗██║██╔══╝   ██╔██╗ ██║     ██╔══██╗    ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║',
            'i': '╚███╔███╔╝███████╗██╔╝ ██║███████╗██║  ██║    ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝',
            'n': ' ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝     ╚══╝╚══╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ '
          }
          return l.split('').map(c => chars[c] || ' '.repeat(8)).join(' ')
        }).join('\n')
      }
    }
    
    const result = fonts.standard(text)
    return { output: result }
  },
  description: 'ASCII 横幅生成器',
  usage: 'banner <文字>',
  examples: ['banner Hello', 'banner WebLinuxOS']
})

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length > 0) {
      const cmd = args[0]
      const cmdDef = (window as any).__weblinux_commands?.[cmd]
      if (cmdDef) {
        return {
          output: `命令: ${cmd}\n描述: ${cmdDef.description}\n用法: ${cmdDef.usage || cmd}\n示例:\n${(cmdDef.examples || []).map((e: string) => `  ${e}`).join('\n')}`
        }
      }
      return { output: `未知命令: ${cmd}\n使用 "help" 查看所有命令` }
    }
    
    const categories: Record<string, string[]> = {
      '系统': ['whoami', 'hostname', 'date', 'uptime', 'neofetch', 'sysinfo', 'theme'],
      '文件': ['ls', 'cd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'find'],
      '网络': ['ping', 'curl', 'ifconfig', 'speedtest'],
      '工具': ['echo', 'clear', 'calc', 'hash', 'uuid', 'base64', 'sort'],
      '应用': ['app', 'apt', 'package'],
      '信息': ['help', 'version', 'about', 'shortcut', 'banner'],
      '娱乐': ['cowsay', 'fortune', 'joke', 'matrix'],
    }
    
    let output = 'WebLinuxOS 终端命令帮助\n========================\n\n'
    
    for (const [cat, cmds] of Object.entries(categories)) {
      output += `${cat}:\n  ${cmds.join(', ')}\n\n`
    }
    
    output += '使用 "help <命令名>" 查看详细帮助'
    return { output }
  },
  description: '显示命令帮助',
  usage: 'help [命令名]',
  examples: ['help', 'help ls', 'help apt']
})
