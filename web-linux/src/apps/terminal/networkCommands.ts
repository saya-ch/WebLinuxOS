import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('ping', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'ping: 缺少操作数\n用法: ping <主机名或IP>' }
    }
    
    const target = args[0]
    const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) || 4 : 4
    
    const results: string[] = []
    
    for (let i = 0; i < count; i++) {
      const time = Math.floor(Math.random() * 50 + 10)
      const ttl = Math.floor(Math.random() * 64 + 64)
      results.push(`PING ${target} (192.168.1.${Math.floor(Math.random() * 254 + 1)}): 56 data bytes`)
      results.push(`64 bytes from ${target}: icmp_seq=${i + 1} ttl=${ttl} time=${time} ms`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    const avgTime = Math.floor(results.reduce((sum, line) => {
      const match = line.match(/time=(\d+) ms/)
      return sum + (match ? parseInt(match[1]) : 0)
    }, 0) / count)
    
    results.push('')
    results.push(`--- ${target} ping statistics ---`)
    results.push(`${count} packets transmitted, ${count} packets received, 0.0% packet loss`)
    results.push(`round-trip min/avg/max = ${Math.floor(avgTime * 0.8)}/${avgTime}/${Math.floor(avgTime * 1.2)} ms`)
    
    return { output: results.join('\n') }
  },
  description: '发送ICMP请求测试网络连通性',
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
    
    const output = [
      `; <<>> DiG 9.18.12 <<>> ${domain}`,
      `;; global options: +cmd`,
      `;; Got answer:`,
      `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345`,
      `;; flags: qr rd ra; QUERY: 1, ANSWER: 4, AUTHORITY: 0, ADDITIONAL: 1`,
      '',
      `;; OPT PSEUDOSECTION:`,
      `; EDNS: version: 0, flags:; udp: 512`,
      `;; QUESTION SECTION:`,
      `;${domain}.                    IN      A`,
      '',
      `;; ANSWER SECTION:`,
      `${domain}.             300     IN      A       192.168.1.100`,
      `${domain}.             300     IN      A       192.168.1.101`,
      '',
      `;; Query time: 12 msec`,
      `;; SERVER: 8.8.8.8#53(8.8.8.8)`,
      `;; WHEN: ${new Date().toLocaleString('zh-CN')}`,
      `;; MSG SIZE  rcvd: 123`,
    ]
    
    return { output: output.join('\n') }
  },
  description: 'DNS查询工具',
  usage: 'dig <域名>',
  examples: ['dig example.com', 'dig google.com']
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
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'nslookup: 缺少域名\n用法: nslookup <域名>' }
    }
    
    const domain = args[0]
    
    const output = [
      `Server:         8.8.8.8`,
      `Address:        8.8.8.8#53`,
      '',
      `Non-authoritative answer:`,
      `Name:   ${domain}`,
      `Address: 192.168.1.100`,
      `Name:   ${domain}`,
      `Address: 192.168.1.101`,
    ]
    
    return { output: output.join('\n') }
  },
  description: 'DNS域名解析查询',
  usage: 'nslookup <域名>',
  examples: ['nslookup example.com']
})
