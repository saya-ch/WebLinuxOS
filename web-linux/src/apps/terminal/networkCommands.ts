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

