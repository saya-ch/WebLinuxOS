import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands: Record<string, { description: string; usage: string }> = {
      'ls': { description: '列出目录内容', usage: 'ls [选项] [目录]' },
      'cd': { description: '切换目录', usage: 'cd [目录]' },
      'pwd': { description: '显示当前目录', usage: 'pwd' },
      'mkdir': { description: '创建目录', usage: 'mkdir [选项] 目录...' },
      'touch': { description: '创建空文件或更新时间戳', usage: 'touch 文件...' },
      'cat': { description: '显示文件内容', usage: 'cat [选项] 文件...' },
      'rm': { description: '删除文件或目录', usage: 'rm [选项] 文件...' },
      'cp': { description: '复制文件或目录', usage: 'cp [选项] 源 目标' },
      'mv': { description: '移动或重命名文件', usage: 'mv [选项] 源 目标' },
      'grep': { description: '搜索文本', usage: 'grep [选项] 模式 文件...' },
      'find': { description: '查找文件', usage: 'find [路径] [选项]' },
      'whoami': { description: '显示当前用户', usage: 'whoami' },
      'hostname': { description: '显示主机名', usage: 'hostname' },
      'date': { description: '显示日期时间', usage: 'date [格式]' },
      'uname': { description: '显示系统信息', usage: 'uname [选项]' },
      'neofetch': { description: '显示系统信息(ASCII风格)', usage: 'neofetch' },
      'version': { description: '显示版本信息', usage: 'version' },
      'about': { description: '显示关于信息', usage: 'about' },
      'uptime': { description: '显示运行时间', usage: 'uptime' },
      'ps': { description: '显示进程列表', usage: 'ps' },
      'top': { description: '显示进程和资源使用', usage: 'top' },
      'curl': { description: '获取URL内容', usage: 'curl [选项] URL' },
      'fetch': { description: '获取URL内容(简化版)', usage: 'fetch URL' },
      'ping': { description: '测试网络连接', usage: 'ping 主机' },
      'ip': { description: '显示网络接口信息', usage: 'ip [选项]' },
      'env': { description: '显示环境变量', usage: 'env' },
      'echo': { description: '输出文本', usage: 'echo [选项] 文本' },
      'clear': { description: '清空终端', usage: 'clear' },
      'history': { description: '显示命令历史', usage: 'history' },
      'python': { description: '运行Python脚本', usage: 'python [文件]' },
      'credits': { description: '显示致谢信息', usage: 'credits' },
    }
    
    if (args.length > 0) {
      const cmd = args[0].toLowerCase()
      if (commands[cmd]) {
        const { description, usage } = commands[cmd]
        return {
          output: [
            `命令: ${cmd}`,
            `描述: ${description}`,
            `用法: ${usage}`,
          ].join('\n')
        }
      }
      return { output: `未找到命令: ${cmd}` }
    }
    
    const output = [
      '可用命令列表:',
      '',
      ...Object.entries(commands).map(([name, info]) => 
        `  ${name.padEnd(12)} ${info.description}`
      ),
      '',
      '使用 "help 命令名" 查看详细信息',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令名]',
  examples: ['help', 'help ls']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '输出文本',
  usage: 'echo [文本]',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('env', {
  handler: (): CommandResult => {
    const envVars = {
      HOME: '/home/user',
      PATH: '/usr/local/bin:/usr/bin:/bin',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      USER: 'user',
      LANG: 'zh_CN.UTF-8',
      EDITOR: 'nano',
      PWD: '/home/user',
    }
    
    return {
      output: Object.entries(envVars).map(([key, value]) => 
        `${key}=${value}`
      ).join('\n')
    }
  },
  description: '显示环境变量',
  usage: 'env',
  examples: ['env']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('history', {
  handler: (): CommandResult => {
    const history = [
      'ls -la',
      'cd documents',
      'cat README.md',
      'neofetch',
      'python script.py',
      'git status',
      'npm run build',
      'help',
    ]
    
    return {
      output: history.map((cmd, i) => 
        `${(i + 1).toString().padStart(4)} ${cmd}`
      ).join('\n')
    }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: curl [选项] URL' }
    }
    
    const url = args[args.length - 1]
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: `curl: (3) URL使用错误: ${url}` }
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'curl/8.0.0',
        },
        mode: 'cors',
      })
      
      if (!response.ok) {
        return { output: `curl: (${response.status}) ${response.statusText}` }
      }
      
      const text = await response.text()
      const maxLength = 5000
      const truncated = text.length > maxLength 
        ? text.slice(0, maxLength) + '\n\n[输出已截断]'
        : text
      
      return { output: truncated }
    } catch (error) {
      return { output: `curl: (6) 无法解析主机或连接失败: ${url}` }
    }
  },
  description: '获取URL内容',
  usage: 'curl [选项] URL',
  examples: ['curl https://api.example.com', 'curl -I https://example.com']
})

registerCommand('fetch', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: fetch URL' }
    }
    
    const url = args[0]
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { output: `错误: URL必须以http://或https://开头` }
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      })
      
      const json = await response.json()
      return { output: JSON.stringify(json, null, 2) }
    } catch (error) {
      return { output: `fetch: 无法获取 ${url}` }
    }
  },
  description: '获取URL JSON内容',
  usage: 'fetch URL',
  examples: ['fetch https://api.example.com/data']
})

registerCommand('ping', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: ping 主机' }
    }
    
    const host = args[0]
    const results: string[] = []
    
    results.push(`PING ${host} (模拟):`)
    
    for (let i = 0; i < 4; i++) {
      const latency = Math.floor(Math.random() * 100) + 10
      results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    results.push(`--- ${host} ping statistics ---`)
    results.push('4 packets transmitted, 4 received, 0% packet loss')
    
    return { output: results.join('\n') }
  },
  description: '测试网络连接(模拟)',
  usage: 'ping 主机',
  examples: ['ping google.com', 'ping localhost']
})

registerCommand('ip', {
  handler: (): CommandResult => {
    const interfaces = [
      { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', gateway: '192.168.1.1' },
      { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', gateway: '' },
      { name: 'wlan0', ip: '10.0.0.5', mask: '255.255.255.0', gateway: '10.0.0.1' },
    ]
    
    const output = [
      '网络接口信息:',
      '',
      ...interfaces.map(iface => [
        `接口: ${iface.name}`,
        `  IP地址: ${iface.ip}`,
        `  子网掩码: ${iface.mask}`,
        iface.gateway ? `  默认网关: ${iface.gateway}` : '',
      ].filter(Boolean).join('\n')),
      '',
      'DNS服务器: 8.8.8.8, 1.1.1.1',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示网络接口信息',
  usage: 'ip',
  examples: ['ip']
})
