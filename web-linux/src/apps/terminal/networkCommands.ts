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
    
    // 使用真实网络请求测试延迟
    results.push(`PING ${host}:`)
    
    try {
      // 测试4次连接延迟
      const latencies: number[] = []
      for (let i = 0; i < 4; i++) {
        const startTime = performance.now()
        try {
          // 使用fetch测试真实网络延迟（no-cors模式下response不可读，仅用于计时）
          await fetch(`https://${host}`, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-store'
          })
          const endTime = performance.now()
          const latency = Math.round(endTime - startTime)
          latencies.push(latency)
          results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms`)
        } catch {
          // 如果直接fetch失败，尝试DNS解析延迟测试
          const startTime = performance.now()
          await fetch(`https://dns.google/resolve?name=${host}`, { 
            method: 'GET',
            mode: 'cors'
          })
          const endTime = performance.now()
          const latency = Math.round((endTime - startTime) / 2)
          latencies.push(latency)
          results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms (DNS测试)`)
        }
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // 统计结果
      const avg = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
      const min = latencies.length > 0 ? Math.min(...latencies) : 0
      const max = latencies.length > 0 ? Math.max(...latencies) : 0
      
      results.push(`--- ${host} ping statistics ---`)
      results.push(`4 packets transmitted, ${latencies.length} received, ${((4 - latencies.length) / 4 * 100).toFixed(1)}% packet loss`)
      results.push(`rtt min/avg/max = ${min}/${avg}/${max} ms`)
    } catch (error) {
      results.push(`ping: 无法连接到 ${host}`)
      results.push('提示: 某些网站可能阻止跨域请求，尝试使用 ipinfo 命令获取网络信息')
    }
    
    return { output: results.join('\n') }
  },
  description: '测试网络连接延迟',
  usage: 'ping 主机',
  examples: ['ping google.com', 'ping github.com']
})

registerCommand('ip', {
  handler: async (): Promise<CommandResult> => {
    const output: string[] = ['网络信息:', '']
    
    try {
      // 使用真实IP信息API
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        output.push(`IP地址: ${data.ip || '未知'}`)
        output.push(`城市: ${data.city || '未知'}`)
        output.push(`地区: ${data.region || '未知'}`)
        output.push(`国家: ${data.country_name || '未知'} (${data.country_code || 'N/A'})`)
        output.push(`ISP: ${data.org || '未知'}`)
        output.push(`ASN: ${data.asn || '未知'}`)
        output.push(`时区: ${data.timezone || '未知'}`)
        output.push(`经纬度: ${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}`)
        output.push('')
      } else {
        output.push('无法获取公网IP信息')
        output.push('')
      }
    } catch (error) {
      output.push('网络请求失败，使用备用方法...')
      output.push('')
    }
    
    // 显示浏览器网络信息
    output.push('=== 浏览器连接信息 ===')
    
    // 检测连接类型
    if ('connection' in navigator) {
      const conn = (navigator as unknown as { connection: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean } }).connection
      if (conn) {
        output.push(`连接类型: ${conn.effectiveType || '未知'}`)
        output.push(`下行带宽: ${conn.downlink ? `${conn.downlink} Mbps` : '未知'}`)
        output.push(`往返时间(RTT): ${conn.rtt ? `${conn.rtt} ms` : '未知'}`)
        output.push(`数据节省模式: ${conn.saveData ? '启用' : '未启用'}`)
      }
    } else {
      output.push('连接类型: 无法检测 (浏览器不支持)')
    }
    
    output.push('')
    output.push('=== 本地虚拟接口 ===')
    const virtualInterfaces = [
      { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', gateway: '192.168.1.1' },
      { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', gateway: '' },
      { name: 'wlan0', ip: '10.0.0.5', mask: '255.255.255.0', gateway: '10.0.0.1' },
    ]
    
    virtualInterfaces.forEach(iface => {
      output.push(`接口: ${iface.name}`)
      output.push(`  IP地址: ${iface.ip}`)
      output.push(`  子网掩码: ${iface.mask}`)
      if (iface.gateway) output.push(`  默认网关: ${iface.gateway}`)
    })
    
    output.push('')
    output.push('DNS服务器: 8.8.8.8 (Google), 1.1.1.1 (Cloudflare)')
    
    return { output: output.join('\n') }
  },
  description: '显示真实网络接口信息',
  usage: 'ip',
  examples: ['ip']
})
