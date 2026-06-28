import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

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
    
    results.push(`PING ${host}:`)
    
    try {
      const latencies: number[] = []
      for (let i = 0; i < 4; i++) {
        const startTime = performance.now()
        try {
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
          const startTime2 = performance.now()
          await fetch(`https://dns.google/resolve?name=${host}`, { 
            method: 'GET',
            mode: 'cors'
          })
          const endTime2 = performance.now()
          const latency = Math.round((endTime2 - startTime2) / 2)
          latencies.push(latency)
          results.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${latency}ms (DNS测试)`)
        }
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
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
    
    output.push('=== 浏览器连接信息 ===')
    
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