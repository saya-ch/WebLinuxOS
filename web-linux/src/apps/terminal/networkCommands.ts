import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

async function measureLatency(url: string): Promise<number> {
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    await fetch(url, {
      signal: controller.signal,
      method: 'HEAD',
      mode: 'no-cors',
    })
    clearTimeout(timeoutId)
  } catch {
  }
  return Math.round(performance.now() - start)
}

registerCommand('ping', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'ping: 缺少操作数\n用法: ping <主机名或IP>' }
    }
    
    const target = args[0]
    const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) || 4 : 4
    
    const results: string[] = []
    const times: number[] = []
    
    let resolvedIp = ''
    let dnsResolved = false
    
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(target)
    const isIpv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(target)
    
    if (isIpv4 || isIpv6) {
      resolvedIp = target
      dnsResolved = true
    } else {
      try {
        const url = target.startsWith('http') ? target : `https://${target}`
        const testUrl = url.replace(/^https?:\/\//, '').split('/')[0]
        
        const dnsProviders = [
          `https://dns.google/resolve?name=${encodeURIComponent(testUrl)}&type=A`,
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(testUrl)}&type=A`,
        ]
        
        for (const dnsUrl of dnsProviders) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000)
            const dnsData = await fetch(dnsUrl, { 
              mode: 'cors',
              signal: controller.signal,
              headers: dnsUrl.includes('cloudflare') ? { 'accept': 'application/dns-json' } : {}
            })
            clearTimeout(timeoutId)
            
            if (dnsData.ok) {
              const json = await dnsData.json()
              if (json.Answer && json.Answer[0] && json.Answer[0].data) {
                resolvedIp = json.Answer[0].data
                dnsResolved = true
                break
              }
            }
          } catch {
            continue
          }
        }
      } catch {
        // DNS 解析失败
      }
    }

    if (!dnsResolved) {
      return {
        output: [
          `ping: ${target}: 无法解析主机`,
          '',
          '提示：浏览器环境无法直接进行 ICMP ping，',
          '本命令通过 DNS-over-HTTPS 解析主机，并用 HTTP HEAD 请求测量延迟。',
          '若主机名无效或 DNS 解析失败，将无法继续。',
          '',
          '建议尝试的主机名:',
          '  google.com, github.com, example.com',
        ].join('\n')
      }
    }

    results.push(`PING ${target} (${resolvedIp}): 56 data bytes`)

    for (let i = 0; i < count; i++) {
      let time: number
      let timedOut = false
      try {
        const url = target.startsWith('http') ? target : `https://${target}`
        time = await measureLatency(url)
        if (time >= 3000) timedOut = true
      } catch {
        timedOut = true
        time = 0
      }

      const ttl = Math.floor(Math.random() * 64 + 64)

      if (!timedOut) {
        times.push(time)
        results.push(`64 bytes from ${target} (${resolvedIp}): icmp_seq=${i + 1} ttl=${ttl} time=${time} ms`)
      } else {
        results.push(`Request timeout for icmp_seq ${i + 1}`)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    const validTimes = times.filter(t => t < 3000)
    const received = validTimes.length
    const avgTime = validTimes.length > 0 
      ? Math.round(validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length)
      : 0
    
    results.push('')
    results.push(`--- ${target} ping statistics ---`)
    results.push(`${count} packets transmitted, ${received} packets received, ${Math.round((1 - received / count) * 100)}% packet loss`)
    
    if (validTimes.length > 0) {
      const minTime = Math.min(...validTimes)
      const maxTime = Math.max(...validTimes)
      results.push(`round-trip min/avg/max = ${minTime}/${avgTime}/${maxTime} ms`)
    }
    
    return { output: results.join('\n') }
  },
  description: '测试网络连通性和延迟',
  usage: 'ping [-c <次数>] <主机名或IP>',
  examples: ['ping localhost', 'ping -c 4 google.com']
})

registerCommand('ifconfig', {
  handler: (): CommandResult => {
    const output = [
      'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
      '        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255',
      '        inet6 fe80::a00:27ff:fe12:3456  prefixlen 64  scopeid 0x20<link>',
      '        ether 08:00:27:12:34:56  txqueuelen 1000  (Ethernet)',
      '        RX packets 12345  bytes 6789012 (6.4 MiB)',
      '        RX errors 0  dropped 0  overruns 0  frame 0',
      '        TX packets 54321  bytes 9876543 (9.4 MiB)',
      '        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0',
      '',
      'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
      '        inet 127.0.0.1  netmask 255.0.0.0',
      '        inet6 ::1  prefixlen 128  scopeid 0x10<host>',
      '        loop  txqueuelen 1000  (Local Loopback)',
      '        RX packets 0  bytes 0 (0.0 B)',
      '        RX errors 0  dropped 0  overruns 0  frame 0',
      '        TX packets 0  bytes 0 (0.0 B)',
      '        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0',
      '',
      'wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
      '        inet 10.0.0.5  netmask 255.255.255.0  broadcast 10.0.0.255',
      '        ether aa:bb:cc:dd:ee:ff  txqueuelen 1000  (Ethernet)',
      '        RX packets 54321  bytes 12345678 (11.7 MiB)',
      '        TX packets 12345  bytes 9876543 (9.4 MiB)',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示网络接口配置',
  usage: 'ifconfig',
  examples: ['ifconfig']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'curl - 获取URL内容',
          '',
          '用法: curl <URL> [-i] [-X <方法>] [-H <头>] [-d <数据>] [-s]',
          '',
          '选项:',
          '  -i    显示响应头',
          '  -s    静默模式（不显示进度）',
          '  -X    指定HTTP方法 (GET/POST/PUT/DELETE等)',
          '  -H    添加HTTP请求头',
          '  -d    发送POST数据',
          '',
          '示例:',
          '  curl https://api.github.com',
          '  curl -i https://example.com',
          '  curl -X POST -d "key=value" https://api.example.com',
        ].join('\n')
      }
    }
    
    const showHeaders = args.includes('-i')
    const silent = args.includes('-s')
    const methodIndex = args.indexOf('-X')
    const method = methodIndex !== -1 ? args[methodIndex + 1].toUpperCase() : 'GET'
    const headersIndex = args.indexOf('-H')
    const headers: Record<string, string> = {}
    if (headersIndex !== -1 && args[headersIndex + 1]) {
      const [key, value] = args[headersIndex + 1].split(':')
      if (key && value) headers[key.trim()] = value.trim()
    }
    const dataIndex = args.indexOf('-d')
    const body = dataIndex !== -1 ? args.slice(dataIndex + 1).join(' ') : undefined
    
    const urlArg = args.find(arg => arg.startsWith('http')) || args[0]
    
    try {
      const requestHeaders: Record<string, string> = { ...headers }
      if (body) {
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      }
      const response = await fetch(urlArg, {
        method,
        headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
        body,
      })
      
      const output: string[] = []
      
      if (showHeaders) {
        output.push(`HTTP/${response.type === 'cors' ? '2.0' : '1.1'} ${response.status} ${response.statusText}`)
        response.headers.forEach((value, key) => {
          output.push(`${key}: ${value}`)
        })
        output.push('')
      }
      
      const text = await response.text()
      output.push(text.substring(0, 5000))
      
      if (!silent && text.length > 5000) {
        output.push(`\n(内容已截断，显示前5000字符)`)
      }
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `curl: 无法连接到 '${urlArg}'\n错误: ${(error as Error).message}` }
    }
  },
  description: '获取URL内容',
  usage: 'curl <URL> [-i] [-X <方法>] [-H <头>] [-d <数据>]',
  examples: ['curl https://api.github.com', 'curl -i https://example.com']
})

registerCommand('fetch', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'fetch - 获取JSON数据',
          '',
          '用法: fetch <URL> [-p]',
          '',
          '选项:',
          '  -p    格式化输出（pretty print）',
          '',
          '示例:',
          '  fetch https://api.github.com/users/octocat',
          '  fetch https://api.github.com/users/octocat -p',
        ].join('\n')
      }
    }
    
    const pretty = args.includes('-p')
    const url = args.find(arg => arg.startsWith('http')) || args[0]
    
    try {
      const response = await fetch(url)
      const json = await response.json()
      
      const output = pretty 
        ? JSON.stringify(json, null, 2)
        : JSON.stringify(json)
      
      return { output: output.substring(0, 5000) }
    } catch (error) {
      return { output: `fetch: 无法获取 '${url}'\n错误: ${(error as Error).message}` }
    }
  },
  description: '获取JSON数据',
  usage: 'fetch <URL> [-p]',
  examples: ['fetch https://api.github.com/users/octocat']
})

registerCommand('ipinfo', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetch('https://ipinfo.io/json')
      const data = await response.json()
      
      const output = [
        '当前IP信息',
        '',
        `IP地址:   ${data.ip || '未知'}`,
        `城市:     ${data.city || '未知'}`,
        `地区:     ${data.region || '未知'}`,
        `国家:     ${data.country || '未知'}`,
        `经纬度:   ${data.loc || '未知'}`,
        `ISP:      ${data.org || '未知'}`,
        `时区:     ${data.timezone || '未知'}`,
        `邮编:     ${data.postal || '未知'}`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          '无法获取IP信息',
          '',
          '当前网络状态:',
          `  在线: ${navigator.onLine ? '是' : '否'}`,
          `  用户代理: ${navigator.userAgent.substring(0, 100)}...`,
        ].join('\n')
      }
    }
  },
  description: '显示当前IP地址信息',
  usage: 'ipinfo',
  examples: ['ipinfo']
})

registerCommand('iplookup', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'iplookup: 缺少IP地址\n用法: iplookup <IP地址>' }
    }
    
    const ip = args[0]
    
    try {
      const response = await fetch(`https://ipinfo.io/${ip}/json`)
      const data = await response.json()
      
      if (data.bogon) {
        return { output: `iplookup: ${ip} 是保留IP地址` }
      }
      
      const output = [
        `IP地址: ${ip}`,
        '',
        `城市:   ${data.city || '未知'}`,
        `地区:   ${data.region || '未知'}`,
        `国家:   ${data.country || '未知'}`,
        `经纬度: ${data.loc || '未知'}`,
        `ISP:    ${data.org || '未知'}`,
        `时区:   ${data.timezone || '未知'}`,
      ]
      
      return { output: output.join('\n') }
    } catch {
      return { output: `iplookup: 无法查询 IP '${ip}'` }
    }
  },
  description: '查询IP地址信息',
  usage: 'iplookup <IP地址>',
  examples: ['iplookup 8.8.8.8', 'iplookup 1.1.1.1']
})

registerCommand('dig', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'dig: 缺少域名\n用法: dig <域名>' }
    }
    
    const domain = args[0]
    const type = args[1]?.toUpperCase() || 'A'
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, { mode: 'cors' })
      const data = await response.json()
      
      const output: string[] = []
      output.push(`; <<>> DiG 9.18.12 <<>> ${domain} ${type}`)
      output.push(`;; global options: +cmd`)
      output.push(`;; Got answer:`)
      output.push(`;; ->>HEADER<<- opcode: QUERY, status: ${data.Status === 0 ? 'NOERROR' : 'ERROR'}, id: ${Math.floor(Math.random() * 65535)}`)
      output.push(`;; flags: qr rd ra; QUERY: 1, ANSWER: ${data.Answer?.length || 0}, AUTHORITY: 0, ADDITIONAL: 1`)
      output.push('')
      output.push(`;; OPT PSEUDOSECTION:`)
      output.push(`; EDNS: version: 0, flags:; udp: 512`)
      output.push(`;; QUESTION SECTION:`)
      output.push(`;${domain}.                    IN      ${type}`)
      output.push('')
      
      if (data.Answer && data.Answer.length > 0) {
        output.push(`;; ANSWER SECTION:`)
        const typeMap: Record<number, string> = { 1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX', 16: 'TXT', 2: 'NS' }
        
        data.Answer.forEach((record: { name: string; type: number; TTL: number; data: string }) => {
          const recType = typeMap[record.type] || `TYPE${record.type}`
          output.push(`${record.name.padEnd(20)} ${record.TTL.toString().padStart(8)} IN      ${recType.padEnd(6)} ${record.data}`)
        })
      } else {
        output.push(';; ANSWER SECTION:')
        output.push('(空)')
      }
      
      output.push('')
      output.push(`;; Query time: ${Math.floor(Math.random() * 50 + 5)} msec`)
      output.push(`;; SERVER: 8.8.8.8#53(8.8.8.8)`)
      output.push(`;; WHEN: ${new Date().toLocaleString('zh-CN')}`)
      output.push(`;; MSG SIZE  rcvd: ${Math.floor(Math.random() * 100 + 50)}`)
      
      return { output: output.join('\n') }
    } catch {
      const fallbackOutput = [
        `; <<>> DiG 9.18.12 <<>> ${domain} ${type}`,
        `;; global options: +cmd`,
        `;; Got answer:`,
        `;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 12345`,
        '',
        `;; QUESTION SECTION:`,
        `;${domain}.                    IN      ${type}`,
        '',
        `;; Query time: 12 msec`,
        `;; SERVER: 8.8.8.8#53(8.8.8.8)`,
        `;; WHEN: ${new Date().toLocaleString('zh-CN')}`,
        `;; MSG SIZE  rcvd: 123`,
      ]
      return { output: fallbackOutput.join('\n') }
    }
  },
  description: 'DNS查询工具',
  usage: 'dig <域名> [类型]',
  examples: ['dig example.com', 'dig google.com AAAA', 'dig github.com MX']
})

registerCommand('hostnamectl', {
  handler: (): CommandResult => {
    const output = [
      '   Static hostname: web-linux',
      '         Icon name: computer-desktop',
      '           Chassis: desktop',
      '        Machine ID: web-linux-20260525',
      '           Boot ID: web-linux-boot-01',
      '  Operating System: WebLinuxOS 2.9.0',
      '            Kernel: Linux 6.15.0-web',
      '      Architecture: x86-64',
      '',
      'Hostname: web-linux',
      'Domain: local',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示主机名和系统信息',
  usage: 'hostnamectl',
  examples: ['hostnamectl']
})

registerCommand('nslookup', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'nslookup: 缺少域名\n用法: nslookup <域名>' }
    }
    
    const domain = args[0]
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { mode: 'cors' })
      const data = await response.json()
      
      const output: string[] = []
      output.push(`Server:         8.8.8.8`)
      output.push(`Address:        8.8.8.8#53`)
      output.push('')
      
      if (data.Answer && data.Answer.length > 0) {
        output.push(`Non-authoritative answer:`)
        output.push(`Name:   ${domain}`)
        
        const addresses = data.Answer.filter((r: { type: number }) => r.type === 1)
        addresses.forEach((addr: { data: string }) => {
          output.push(`Address: ${addr.data}`)
        })
        
        const cnames = data.Answer.filter((r: { type: number }) => r.type === 5)
        cnames.forEach((cname: { data: string }) => {
          output.push(`Name:   ${cname.data}`)
        })
      } else {
        output.push(`*** Can't find ${domain}: No answer`)
      }
      
      return { output: output.join('\n') }
    } catch {
      const output = [
        `Server:         8.8.8.8`,
        `Address:        8.8.8.8#53`,
        '',
        `*** Can't find ${domain}: Server failed`,
      ]
      return { output: output.join('\n') }
    }
  },
  description: 'DNS域名解析查询',
  usage: 'nslookup <域名>',
  examples: ['nslookup example.com', 'nslookup github.com']
})
