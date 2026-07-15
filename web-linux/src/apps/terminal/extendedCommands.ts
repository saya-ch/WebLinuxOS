import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath } from '../../store'
import { apiConfigs } from '../../services/aiService'
import type { FileNode } from '../../types'

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands = [
      { cmd: 'ls', desc: '列出目录内容', usage: 'ls [-a] [-l] [-h] [-R] [路径]' },
      { cmd: 'cd', desc: '切换当前工作目录', usage: 'cd [路径]' },
      { cmd: 'pwd', desc: '显示当前工作目录', usage: 'pwd' },
      { cmd: 'cat', desc: '显示文件内容', usage: 'cat [-n] [-b] [-s] <文件>...' },
      { cmd: 'head', desc: '显示文件开头部分', usage: 'head [-n <行数>] <文件>' },
      { cmd: 'tail', desc: '显示文件末尾部分', usage: 'tail [-n <行数>] <文件>' },
      { cmd: 'mkdir', desc: '创建目录', usage: 'mkdir [-p] [-v] <目录名>...' },
      { cmd: 'touch', desc: '创建空文件或更新时间戳', usage: 'touch <文件名>' },
      { cmd: 'rm', desc: '删除文件或目录', usage: 'rm [-f] [-i] [-r] [-v] <文件或目录>...' },
      { cmd: 'cp', desc: '复制文件或目录', usage: 'cp <源> <目标>' },
      { cmd: 'mv', desc: '移动或重命名文件', usage: 'mv <源> <目标>' },
      { cmd: 'tree', desc: '显示目录树结构', usage: 'tree [路径]' },
      { cmd: 'wc', desc: '统计文件行数、字数、字符数', usage: 'wc <文件>' },
      { cmd: 'write', desc: '写入文件内容', usage: 'write <文件名> <内容>' },
      { cmd: 'append', desc: '追加内容到文件', usage: 'append <文件名> <内容>' },
      { cmd: 'echo', desc: '输出文本', usage: 'echo [文本]' },
      { cmd: 'grep', desc: '搜索文件内容', usage: 'grep <关键词> <文件>' },
      { cmd: 'find', desc: '查找文件', usage: 'find [路径] [-name <模式>]' },
      { cmd: 'history', desc: '显示命令历史', usage: 'history' },
      { cmd: 'clear', desc: '清空终端屏幕', usage: 'clear' },
      { cmd: 'whoami', desc: '显示当前用户', usage: 'whoami' },
      { cmd: 'hostname', desc: '显示主机名', usage: 'hostname' },
      { cmd: 'date', desc: '显示当前日期和时间', usage: 'date [格式]' },
      { cmd: 'cal', desc: '显示日历', usage: 'cal [月份] [年份]' },
      { cmd: 'uname', desc: '显示系统信息', usage: 'uname [-a] [-r] [-s] [-n] [-m]' },
      { cmd: 'lsb_release', desc: '显示发行版信息', usage: 'lsb_release [-a]' },
      { cmd: 'neofetch', desc: '显示系统信息（ASCII艺术风格）', usage: 'neofetch' },
      { cmd: 'version', desc: '显示系统版本信息', usage: 'version' },
      { cmd: 'about', desc: '显示关于信息', usage: 'about' },
      { cmd: 'uptime', desc: '显示系统运行时间', usage: 'uptime' },
      { cmd: 'ps', desc: '显示进程列表', usage: 'ps' },
      { cmd: 'top', desc: '显示系统进程和资源使用情况', usage: 'top' },
      { cmd: 'kill', desc: '终止进程', usage: 'kill [-9] <PID>' },
      { cmd: 'killall', desc: '按名称终止进程', usage: 'killall <进程名>' },
      { cmd: 'sysinfo', desc: '显示浏览器与系统详细信息', usage: 'sysinfo' },
      { cmd: 'credits', desc: '显示致谢信息', usage: 'credits' },
      { cmd: 'weather', desc: '获取天气信息', usage: 'weather [城市]' },
      { cmd: 'news', desc: '获取最新新闻', usage: 'news' },
      { cmd: 'crypto', desc: '获取加密货币价格', usage: 'crypto [货币]' },
      { cmd: 'quote', desc: '获取随机名言', usage: 'quote' },
      { cmd: 'curl', desc: '发送HTTP请求', usage: 'curl <URL>' },
    ]

    if (args.length > 0) {
      const target = args[0].toLowerCase()
      const cmd = commands.find(c => c.cmd === target)
      if (cmd) {
        return {
          output: `${cmd.cmd}\n${'='.repeat(cmd.cmd.length)}\n描述: ${cmd.desc}\n用法: ${cmd.usage}`
        }
      }
      return { output: `未找到命令 '${target}'，输入 'help' 查看所有命令` }
    }

    const output = [
      'WebLinuxOS 终端命令帮助',
      '',
      '文件操作:',
      ...commands.filter(c => ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'tree', 'wc', 'write', 'append'].includes(c.cmd))
        .map(c => `  ${c.cmd.padEnd(12)} ${c.desc}`),
      '',
      '文本处理:',
      ...commands.filter(c => ['echo', 'grep', 'find', 'history'].includes(c.cmd))
        .map(c => `  ${c.cmd.padEnd(12)} ${c.desc}`),
      '',
      '系统命令:',
      ...commands.filter(c => ['whoami', 'hostname', 'date', 'cal', 'uname', 'lsb_release', 'neofetch', 'version', 'about', 'uptime', 'ps', 'top', 'kill', 'killall', 'sysinfo', 'credits', 'clear'].includes(c.cmd))
        .map(c => `  ${c.cmd.padEnd(12)} ${c.desc}`),
      '',
      '在线工具:',
      ...commands.filter(c => ['weather', 'news', 'crypto', 'quote', 'curl'].includes(c.cmd))
        .map(c => `  ${c.cmd.padEnd(12)} ${c.desc}`),
      '',
      '输入 "help <命令名>" 查看详细用法'
    ]

    return { output: output.join('\n') }
  },
  description: '显示命令帮助',
  usage: 'help [命令名]',
  examples: ['help', 'help ls', 'help weather']
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

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, files } = context
    
    if (args.length < 2) {
      return { output: 'grep: 缺少操作数\n用法: grep <关键词> <文件>' }
    }
    
    const pattern = args[0]
    const fileArg = args[1]
    const resolved = resolvePath(context.cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `grep: ${fileArg}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const matches = lines.map((line, index) => {
      if (line.includes(pattern)) {
        return `${index + 1}: ${line}`
      }
      return null
    }).filter(Boolean)
    
    if (matches.length === 0) {
      return { output: '' }
    }
    
    return { output: matches.join('\n') }
  },
  description: '搜索文件内容',
  usage: 'grep <关键词> <文件>',
  examples: ['grep hello file.txt']
})

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target
  if (target.startsWith('~')) return target.replace('~', '/home/user')
  if (target === '.') return cwd
  if (target === '..') {
    const parts = cwd.split('/').filter(Boolean)
    parts.pop()
    return parts.length > 0 ? '/' + parts.join('/') : '/'
  }
  return cwd === '/' ? `/${target}` : `${cwd}/${target}`
}

registerCommand('find', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    let targetPath = cwd
    let namePattern: string | undefined
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name') {
        namePattern = args[i + 1]
        i++
      } else if (!args[i].startsWith('-')) {
        targetPath = resolvePath(cwd, args[i])
      }
    }
    
    const node = findNodeByPath(files, targetPath)
    if (!node) {
      return { output: `find: ${targetPath}: 没有那个文件或目录` }
    }
    
    const results: string[] = []
    
    function search(node: FileNode, currentPath: string) {
      const fullPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`
      
      if (namePattern) {
        if (node.name.includes(namePattern)) {
          results.push(fullPath)
        }
      } else {
        if (node.type === 'file') {
          results.push(fullPath)
        }
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach((child: FileNode) => search(child, fullPath))
      }
    }
    
    if (node.type === 'folder') {
      node.children?.forEach((child: FileNode) => search(child, targetPath))
    }
    
    return { output: results.join('\n') || '未找到匹配的文件' }
  },
  description: '查找文件',
  usage: 'find [路径] [-name <模式>]',
  examples: ['find /home/user', 'find -name *.txt']
})

registerCommand('history', {
  handler: (): CommandResult => {
    return { output: '命令历史功能暂未启用，请直接使用终端的上下箭头查看历史' }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('cal', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    let month = new Date().getMonth()
    let year = new Date().getFullYear()
    
    if (args.length === 1) {
      const num = parseInt(args[0])
      if (!isNaN(num)) {
        if (num >= 1 && num <= 12) {
          month = num - 1
        } else if (num >= 1900 && num <= 2100) {
          year = num
        }
      }
    } else if (args.length === 2) {
      const m = parseInt(args[0])
      const y = parseInt(args[1])
      if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        month = m - 1
        year = y
      }
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const output: string[] = []
    output.push(`${monthNames[month]} ${year}`)
    output.push(dayNames.join(' '))
    
    let line = ' '.repeat(firstDay * 3)
    
    for (let day = 1; day <= daysInMonth; day++) {
      line += String(day).padStart(2, ' ') + ' '
      if ((firstDay + day) % 7 === 0) {
        output.push(line.trim())
        line = ''
      }
    }
    
    if (line) {
      output.push(line.trim())
    }
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'cal [月份] [年份]',
  examples: ['cal', 'cal 2026', 'cal 12 2026']
})

registerCommand('weather', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const city = args[0] || 'Beijing'
    
    try {
      const url = `${apiConfigs.weather.baseUrl}${apiConfigs.weather.endpoints.current}?city=${encodeURIComponent(city)}&key=demo`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.current) {
        return {
          output: `🌤️ ${city} 天气\n\n温度: ${data.current.temperature}°C\n天气: ${data.current.weather}\n湿度: ${data.current.humidity}%\n风速: ${data.current.windSpeed} km/h\n\n更新时间: ${data.current.observationTime}`
        }
      }
      
      return { output: `无法获取 ${city} 的天气信息` }
    } catch {
      return {
        output: `🌤️ ${city} 天气（模拟数据）\n\n温度: ${Math.floor(Math.random() * 15 + 15)}°C\n天气: ${['晴', '多云', '阴', '小雨'][Math.floor(Math.random() * 4)]}\n湿度: ${Math.floor(Math.random() * 40 + 40)}%\n风速: ${Math.floor(Math.random() * 20 + 5)} km/h\n\n注意: 当前未连接真实天气API，显示模拟数据`
      }
    }
  },
  description: '获取天气信息',
  usage: 'weather [城市]',
  examples: ['weather', 'weather Beijing', 'weather Shanghai']
})

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const topStoriesUrl = `${apiConfigs.news.baseUrl}${apiConfigs.news.endpoints.topStories}`
      const response = await fetch(topStoriesUrl)
      const storyIds = await response.json() as number[]
      
      const top5 = storyIds.slice(0, 5)
      const newsItems = await Promise.all(
        top5.map(async id => {
          const itemUrl = `${apiConfigs.news.baseUrl}${apiConfigs.news.endpoints.item}/${id}.json`
          const itemResponse = await fetch(itemUrl)
          return itemResponse.json()
        })
      )
      
      const output = [
        '📰 Hacker News 热门新闻',
        '',
        ...newsItems.map((item, index) => {
          const score = item.score || 0
          const author = item.by || 'unknown'
          return `${index + 1}. ${item.title}\n   评分: ${score} | 作者: ${author}`
        }),
        '',
        '完整内容请访问 https://news.ycombinator.com/'
      ]
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: `📰 今日新闻（模拟数据）\n\n1. WebLinuxOS 2.9.0 发布，新增多项功能\n2. 前端开发趋势：AI辅助编程成为主流\n3. React 19 正式发布，带来全新特性\n4. WebAssembly 性能大幅提升\n5. 开源社区迎来新一波贡献高峰\n\n注意: 当前未连接新闻API，显示模拟数据`
      }
    }
  },
  description: '获取最新新闻',
  usage: 'news',
  examples: ['news']
})

registerCommand('crypto', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const crypto = args[0] || 'bitcoin'
    
    try {
      const url = `${apiConfigs.crypto.baseUrl}${apiConfigs.crypto.endpoints.prices}?ids=${crypto}&vs_currencies=usd,cnc&include_market_cap=true&include_24hr_change=true`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data[crypto]) {
        const info = data[crypto]
        return {
          output: `💰 ${crypto.toUpperCase()} 价格\n\nUSD: $${info.usd.toLocaleString()}\nCNY: ¥${info.cny.toLocaleString()}\n市值: $${info.usd_market_cap.toLocaleString()}\n24h变化: ${info.usd_24h_change > 0 ? '+' : ''}${info.usd_24h_change.toFixed(2)}%`
        }
      }
      
      return { output: `无法获取 ${crypto} 的价格信息` }
    } catch {
      const prices: Record<string, { usd: number; change: number }> = {
        bitcoin: { usd: 67500, change: 2.5 },
        ethereum: { usd: 3500, change: -1.2 },
        solana: { usd: 178, change: 5.8 },
        dogecoin: { usd: 0.12, change: 1.1 }
      }
      
      const info = prices[crypto.toLowerCase()] || { usd: Math.floor(Math.random() * 10000 + 100), change: (Math.random() - 0.5) * 10 }
      
      return {
        output: `💰 ${crypto.toUpperCase()} 价格（模拟数据）\n\nUSD: $${info.usd.toLocaleString()}\nCNY: ¥${(info.usd * 7.2).toLocaleString()}\n24h变化: ${info.change > 0 ? '+' : ''}${info.change.toFixed(2)}%\n\n注意: 当前未连接加密货币API，显示模拟数据`
      }
    }
  },
  description: '获取加密货币价格',
  usage: 'crypto [货币]',
  examples: ['crypto', 'crypto bitcoin', 'crypto ethereum']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const url = `${apiConfigs.quotes.baseUrl}${apiConfigs.quotes.endpoints.random}`
      const response = await fetch(url)
      const data = await response.json()
      
      return {
        output: `💭 "${data.content}"\n\n—— ${data.author}`
      }
    } catch {
      const quotes = [
        { content: '代码是写给人看的，只是顺便给机器执行', author: 'Donald Knuth' },
        { content: '优秀的程序员像优秀的魔术师一样，让复杂的事情看起来很简单', author: 'Robert C. Martin' },
        { content: '测试是证明错误存在的过程，而不是证明错误不存在', author: 'Edsger Dijkstra' },
        { content: '在计算机科学中，没有什么问题是不能通过增加一个间接层来解决的', author: 'David Wheeler' },
        { content: '简单胜于复杂，复杂胜于混乱', author: 'The Zen of Python' }
      ]
      
      const quote = quotes[Math.floor(Math.random() * quotes.length)]
      return {
        output: `💭 "${quote.content}"\n\n—— ${quote.author}`
      }
    }
  },
  description: '获取随机名言',
  usage: 'quote',
  examples: ['quote']
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
      
      if (text.length > 2000) {
        return { output: `${text.slice(0, 2000)}...\n\n（内容过长，已截断）` }
      }
      
      return { output: text }
    } catch (error) {
      return { output: `curl: 无法访问 '${url}': ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '发送HTTP请求',
  usage: 'curl <URL>',
  examples: ['curl https://example.com']
})

registerCommand('who', {
  handler: (context: CommandContext): CommandResult => {
    return {
      output: `${context.username} pts/0 ${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN')}`
    }
  },
  description: '显示当前登录用户',
  usage: 'who',
  examples: ['who']
})

registerCommand('hostnamectl', {
  handler: (): CommandResult => {
    return {
      output: [
        '   Static hostname: web-linux',
        '         Icon name: computer-vm',
        '           Chassis: vm',
        '        Machine ID: web-linux-2026',
        '           Boot ID: web-linux-boot-2026',
        '    Operating System: WebLinuxOS 2.9.0',
        '              Kernel: Linux 6.15.0-web',
        '        Architecture: x86-64',
        '',
        'WebLinuxOS 是一个基于 Web 的虚拟操作系统。'
      ].join('\n')
    }
  },
  description: '显示主机信息',
  usage: 'hostnamectl',
  examples: ['hostnamectl']
})

registerCommand('reset', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[HWebLinuxOS 终端已重置\n输入 "help" 查看可用命令' }
  },
  description: '重置终端',
  usage: 'reset',
  examples: ['reset']
})