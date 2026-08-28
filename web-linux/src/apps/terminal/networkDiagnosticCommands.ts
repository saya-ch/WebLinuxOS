import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

// v133 新增：网络诊断命令集
registerCommand('dig', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: dig <域名> [类型]\n类型: A, AAAA, CNAME, MX, NS, TXT, SOA (默认: A)' }
    }
    const domain = args[0]
    const type = (args[1] || 'A').toUpperCase()
    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA']
    if (!validTypes.includes(type)) {
      return { output: `不支持的记录类型: ${type}\n支持的类型: ${validTypes.join(', ')}` }
    }
    try {
      const start = performance.now()
      const resp = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
        headers: { 'Accept': 'application/dns-json' }
      })
      const data = await resp.json()
      const elapsed = (performance.now() - start).toFixed(0)
      if (data.Status !== 0) {
        return { output: `;; 查询 ${domain} ${type} 失败 (状态码: ${data.Status})\n;; 耗时: ${elapsed}ms` }
      }
      let output = `;; 向 Cloudflare DoH 查询 ${domain} ${type}\n;; 耗时: ${elapsed}ms\n\n`
      if (data.Answer && data.Answer.length > 0) {
        output += `;; ANSWER SECTION:\n`
        for (const ans of data.Answer) {
          output += `${ans.name}\t${ans.TTL}\tIN\t${ans.type === 1 ? 'A' : ans.type === 28 ? 'AAAA' : ans.type === 5 ? 'CNAME' : ans.type === 15 ? 'MX' : ans.type === 2 ? 'NS' : ans.type === 16 ? 'TXT' : ans.type === 6 ? 'SOA' : 'TYPE' + ans.type}\t${ans.data}\n`
        }
        output += `\n;; 查询完成: ${data.Answer.length} 条记录`
      } else {
        output += ';; 无结果'
      }
      return { output }
    } catch (e) {
      return { output: `;; 查询失败: ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },
  description: 'DNS查询 (Cloudflare DoH)',
  usage: 'dig <域名> [类型]',
  examples: ['dig example.com', 'dig github.com AAAA', 'dig google.com MX']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: curl <URL> [-I] [-v]\n选项: -I 仅显示头信息, -v 详细模式' }
    }
    const url = args[0]
    const showHeaders = args.includes('-I') || args.includes('-i')
    const verbose = args.includes('-v')
    try {
      const start = performance.now()
      const resp = await fetch(url, { method: showHeaders ? 'HEAD' : 'GET' })
      const elapsed = (performance.now() - start).toFixed(0)
      let output = `HTTP/1.1 ${resp.status} ${resp.statusText}\n`
      if (verbose) {
        output += `> GET ${new URL(url).pathname} HTTP/1.1\n`
        output += `> Host: ${new URL(url).host}\n>\n`
      }
      resp.headers.forEach((value: string, key: string) => {
        output += `${key}: ${value}\n`
      })
      if (!showHeaders) {
        const text = await resp.text()
        const preview = text.substring(0, 500)
        output += `\n${text.length > 500 ? preview + '\n... (截断，共 ' + text.length + ' 字符)' : text}`
      }
      output += `\n\n--- 耗时: ${elapsed}ms ---`
      return { output }
    } catch (e) {
      return { output: `curl: (${e instanceof Error ? e.message : '网络错误'})` }
    }
  },
  description: 'HTTP请求工具',
  usage: 'curl <URL> [-I] [-v]',
  examples: ['curl https://httpbin.org/get', 'curl -I https://github.com']
})

registerCommand('speedtest', {
  handler: async (_context: CommandContext): Promise<CommandResult> => {
    const output = '正在测试网络速度...\n'
    try {
      // 测试延迟
      const pings: number[] = []
      for (let i = 0; i < 5; i++) {
        const start = performance.now()
        await fetch('https://httpbin.org/get', { cache: 'no-store' })
        pings.push(performance.now() - start)
      }
      const avgPing = (pings.reduce((a, b) => a + b, 0) / pings.length).toFixed(0)
      const minPing = Math.min(...pings).toFixed(0)
      const maxPing = Math.max(...pings).toFixed(0)
      const jitter = (Math.max(...pings) - Math.min(...pings)).toFixed(0)

      // 测试下载速度
      const dlStart = performance.now()
      const resp = await fetch('https://httpbin.org/bytes/1048576', { cache: 'no-store' })
      await resp.blob()
      const dlTime = (performance.now() - dlStart) / 1000
      const speed = (1 / dlTime).toFixed(2)

      const grade = Number(avgPing) < 50 ? 'A' : Number(avgPing) < 100 ? 'B' : Number(avgPing) < 200 ? 'C' : 'D'

      return {
        output: `${output}
╔══════════════════════════════════╗
║       WebLinuxOS Speed Test      ║
╠══════════════════════════════════╣
║  延迟 (Ping)                     ║
║    平均: ${avgPing.padStart(8)}ms              ║
║    最小: ${minPing.padStart(8)}ms              ║
║    最大: ${maxPing.padStart(8)}ms              ║
║    抖动: ${jitter.padStart(8)}ms              ║
╠══════════════════════════════════╣
║  下载速度                        ║
║    ${speed.padStart(8)} MB/s                ║
╠══════════════════════════════════╣
║  网络评级: ${grade.padStart(2)}                      ║
╚══════════════════════════════════╝`
      }
    } catch (e) {
      return { output: `${output}测试失败: ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },
  description: '网络速度测试',
  usage: 'speedtest',
  examples: ['speedtest']
})

registerCommand('whois', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: whois <域名>' }
    }
    const domain = args[0]
    try {
      const resp = await fetch(`https://rdap.verisign.com/com/v1/domain/${domain}`)
      if (!resp.ok) {
        return { output: `whois: 未找到 ${domain} 的注册信息 (HTTP ${resp.status})` }
      }
      const data = await resp.json()
      let output = `Domain Name: ${data.ldhName || domain}\n`
      if (data.status) output += `Status: ${data.status.join(', ')}\n`
      if (data.events) {
        for (const evt of data.events) {
          if (evt.eventAction === 'registration') output += `Created: ${evt.eventDate}\n`
          if (evt.eventAction === 'expiration') output += `Expires: ${evt.eventDate}\n`
          if (evt.eventAction === 'last update of RDAP database') output += `Updated: ${evt.eventDate}\n`
        }
      }
      if (data.nameservers) {
        output += `Name Servers:\n${data.nameservers.map((ns: { ldhName: string }) => `  ${ns.ldhName}`).join('\n')}\n`
      }
      return { output }
    } catch (e) {
      return { output: `whois: 查询失败 - ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },
  description: '域名注册信息查询 (RDAP)',
  usage: 'whois <域名>',
  examples: ['whois google.com', 'whois github.com']
})

registerCommand('wikipedia', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (args.length === 0) {
      return { output: '用法: wikipedia <搜索词>' }
    }
    const query = args.join(' ')
    try {
      const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      if (!resp.ok) {
        // 尝试搜索API
        const searchResp = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`)
        const searchData = await searchResp.json()
        if (searchData.query?.search?.length > 0) {
          const results = searchData.query.search.slice(0, 5)
          return {
            output: `Wikipedia 搜索: "${query}"\n\n${results.map((r: { title: string; snippet: string }, i: number) =>
              `${i + 1}. ${r.title}\n   ${r.snippet.replace(/<[^>]+>/g, '')}\n`
            ).join('\n')}`
          }
        }
        return { output: `Wikipedia: 未找到 "${query}" 的相关结果` }
      }
      const data = await resp.json()
      let output = `═══ ${data.title} ═══\n\n`
      if (data.extract) {
        output += data.extract.length > 600 ? data.extract.substring(0, 600) + '...' : data.extract
      }
      if (data.content_urls?.desktop?.page) {
        output += `\n\n链接: ${data.content_urls.desktop.page}`
      }
      return { output }
    } catch (e) {
      return { output: `wikipedia: 查询失败 - ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },
  description: 'Wikipedia 百科查询',
  usage: 'wikipedia <搜索词>',
  examples: ['wikipedia Linux', 'wikipedia React']
})

registerCommand('QR', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args, openApp } = context
    if (openApp) {
      openApp('qr-generator')
    }
    return { output: args.length > 0
      ? `正在生成 QR 码: ${args.join(' ')}\n已打开 QR 生成器应用`
      : '已打开 QR 生成器应用'
    }
  },
  description: '打开 QR 码生成器',
  usage: 'qr [内容]',
  examples: ['qr https://example.com']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args, openApp } = context
    if (openApp) {
      openApp('weather')
    }
    const city = args.join(' ') || '当前位置'
    return { output: `正在获取 ${city} 的天气信息...\n已打开天气应用` }
  },
  description: '打开天气应用',
  usage: 'weather [城市名]',
  examples: ['weather Beijing', 'weather']
})
