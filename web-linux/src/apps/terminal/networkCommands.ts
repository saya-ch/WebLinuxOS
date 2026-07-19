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
    try {
      const url = target.startsWith('http') ? target : `https://${target}`
      const testUrl = url.replace(/^https?:\/\//, '').split('/')[0]

      const dnsData = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(testUrl)}&type=A`, { mode: 'cors' })
      if (dnsData.ok) {
        const json = await dnsData.json()
        if (json.Answer && json.Answer[0] && json.Answer[0].data) {
          resolvedIp = json.Answer[0].data
          dnsResolved = true
        }
      }
    } catch {
      // DNS 解析失败时不伪造 IP，保留 resolvedIp 为空
    }

    if (!dnsResolved) {
      return {
        output: [
          `ping: ${target}: 无法解析主机`,
          '',
          '提示：浏览器环境无法直接进行 ICMP ping，',
          '本命令通过 DNS-over-HTTPS 解析主机，并用 HTTP HEAD 请求测量延迟。',
          '若主机名无效或 DNS 解析失败，将无法继续。',
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

registerCommand('netstat', {
  handler: (): CommandResult => {
    const output = [
      'Active Internet connections (only servers)',
      'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
      'tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN',
      'tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN',
      'tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN',
      'tcp        0      0 127.0.0.1:5173          0.0.0.0:*               LISTEN',
      'udp        0      0 0.0.0.0:53              0.0.0.0:*',
      '',
      'Active UNIX domain sockets (only servers)',
      'Proto RefCnt Flags       Type       State         I-Node   Path',
      'unix  2      [ ACC ]     STREAM     LISTENING     1234     /run/systemd/private',
      'unix  2      [ ACC ]     STREAM     LISTENING     5678     /var/run/dbus/system_bus_socket',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示网络连接和端口状态',
  usage: 'netstat',
  examples: ['netstat']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'curl: 缺少URL\n用法: curl <URL>' }
    }
    
    const url = args[0]
    
    try {
      const response = await fetch(url)
      const text = await response.text()
      return { output: text.substring(0, 2000) }
    } catch {
      return { output: `curl: 无法连接到 '${url}'\n请检查网络连接或URL是否正确` }
    }
  },
  description: '获取URL内容',
  usage: 'curl <URL>',
  examples: ['curl https://api.example.com']
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
