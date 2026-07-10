import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('code-highlight', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🎨 代码语法高亮',
          '═'.repeat(40),
          '',
          '用法: code-highlight <语言> <代码>',
          '',
          '支持语言: javascript, typescript, python, java, go, rust, c, cpp, html, css, json, markdown',
          '',
          '示例:',
          '  code-highlight javascript console.log("Hello");',
          '  code-highlight python print("Hello")',
          '',
        ].join('\n')
      }
    }
    
    const lang = args[0].toLowerCase()
    const code = args.slice(1).join(' ')
    
    const languages: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      go: 'Go',
      rust: 'Rust',
      c: 'C',
      cpp: 'C++',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      markdown: 'Markdown',
      bash: 'Bash',
      sql: 'SQL',
      php: 'PHP',
    }
    
    const syntaxColors: Record<string, Record<string, string>> = {
      javascript: {
        keyword: '\x1b[35m',
        string: '\x1b[32m',
        number: '\x1b[31m',
        function: '\x1b[36m',
        comment: '\x1b[33m',
      },
      python: {
        keyword: '\x1b[35m',
        string: '\x1b[32m',
        number: '\x1b[31m',
        function: '\x1b[36m',
        comment: '\x1b[33m',
      },
      typescript: {
        keyword: '\x1b[35m',
        string: '\x1b[32m',
        number: '\x1b[31m',
        function: '\x1b[36m',
        comment: '\x1b[33m',
        type: '\x1b[34m',
      },
    }
    
    const colors = syntaxColors[lang] || syntaxColors.javascript
    
    const highlighted = code
      .replace(/(\/\/.*$)/gm, `${colors.comment}$1\x1b[0m`)
      .replace(/(".*?"|'.*?')/g, `${colors.string}$1\x1b[0m`)
      .replace(/\b(\d+)\b/g, `${colors.number}$1\x1b[0m`)
      .replace(/\b(function|const|let|var|return|if|else|for|while|class|import|export|async|await|new|try|catch)\b/g, `${colors.keyword}$1\x1b[0m`)
      .replace(/\b(console|document|window|Array|Object|String|Number|Boolean)\b/g, `${colors.function}$1\x1b[0m`)
    
    return {
      output: [
        `🎨 ${languages[lang] || lang} 代码高亮`,
        '═'.repeat(40),
        '',
        highlighted,
        '',
      ].join('\n')
    }
  },
  description: '代码语法高亮显示',
  usage: 'code-highlight <语言> <代码>',
  examples: ['code-highlight javascript console.log("Hello");', 'code-highlight python print("Hello")']
})

registerCommand('leetcode', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    const difficulties = ['easy', 'medium', 'hard']
    const topics = ['array', 'string', 'linked-list', 'tree', 'dp', 'hash', 'graph', 'binary-search']
    
    if (args.length === 0) {
      return {
        output: [
          '💻 LeetCode 每日一题',
          '═'.repeat(40),
          '',
          '用法: leetcode [难度] [主题]',
          '',
          '难度: easy, medium, hard',
          '主题: array, string, linked-list, tree, dp, hash, graph, binary-search',
          '',
          '示例:',
          '  leetcode',
          '  leetcode easy',
          '  leetcode medium dp',
          '',
        ].join('\n')
      }
    }
    
    const difficulty = difficulties.includes(args[0].toLowerCase()) ? args[0].toLowerCase() : 'all'
    const topic = topics.includes((args[1] || '').toLowerCase()) ? args[1].toLowerCase() : 'all'
    
    const fallbackProblems = [
      { id: 1, title: '两数之和', difficulty: 'easy', topic: 'hash', desc: '给定一个整数数组nums和一个整数目标值target，请你在该数组中找出和为目标值target的那两个整数，并返回它们的数组下标。' },
      { id: 2, title: '两数相加', difficulty: 'medium', topic: 'linked-list', desc: '给你两个非空的链表，表示两个非负的整数。它们每位数字都是按照逆序的方式存储的，并且每个节点只能存储一位数字。请你将两个数相加，并以相同形式返回一个表示和的链表。' },
      { id: 3, title: '无重复字符的最长子串', difficulty: 'medium', topic: 'string', desc: '给定一个字符串s，请你找出其中不含有重复字符的最长子串的长度。' },
      { id: 5, title: '最长回文子串', difficulty: 'medium', topic: 'string', desc: '给你一个字符串s，找到s中最长的回文子串。' },
      { id: 15, title: '三数之和', difficulty: 'medium', topic: 'array', desc: '给你一个整数数组nums，判断是否存在三元组[nums[i], nums[j], nums[k]]满足i!=j、i!=k且j!=k，同时还满足nums[i]+nums[j]+nums[k]==0。' },
      { id: 20, title: '有效的括号', difficulty: 'easy', topic: 'string', desc: '给定一个只包括()、{}、[]的字符串s，判断字符串是否有效。' },
      { id: 53, title: '最大子数组和', difficulty: 'medium', topic: 'dp', desc: '给你一个整数数组nums，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。' },
      { id: 94, title: '二叉树的中序遍历', difficulty: 'easy', topic: 'tree', desc: '给定一个二叉树的根节点root，返回它的中序遍历结果。' },
      { id: 200, title: '岛屿数量', difficulty: 'medium', topic: 'graph', desc: '给你一个由"1"（陆地）和"0"（水）组成的的二维网格，请你计算网格中岛屿的数量。' },
      { id: 33, title: '搜索旋转排序数组', difficulty: 'medium', topic: 'binary-search', desc: '整数数组nums按升序排列，数组中的值互不相同。在传递给函数之前，nums在预先未知的某个下标k上进行了旋转。请你搜索nums中是否存在target。' },
    ]
    
    try {
      let filtered = fallbackProblems
      if (difficulty !== 'all') {
        filtered = filtered.filter(p => p.difficulty === difficulty)
      }
      if (topic !== 'all') {
        filtered = filtered.filter(p => p.topic === topic)
      }
      
      const problem = filtered[Math.floor(Math.random() * filtered.length)] || fallbackProblems[0]
      
      const diffColor = problem.difficulty === 'easy' ? '\x1b[32m' : problem.difficulty === 'medium' ? '\x1b[33m' : '\x1b[31m'
      
      return {
        output: [
          `💻 LeetCode #${problem.id}`,
          '═'.repeat(50),
          '',
          `题目: ${problem.title}`,
          `难度: ${diffColor}${problem.difficulty.toUpperCase()}\x1b[0m`,
          `分类: ${problem.topic}`,
          '',
          '描述:',
          `  ${problem.desc}`,
          '',
          `链接: https://leetcode.cn/problems/${problem.title.toLowerCase().replace(/\s+/g, '-')}`,
          '',
        ].join('\n')
      }
    } catch {
      const problem = fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)]
      
      return {
        output: [
          `💻 LeetCode #${problem.id}`,
          '═'.repeat(50),
          '',
          `题目: ${problem.title}`,
          `难度: ${problem.difficulty}`,
          '',
          '描述:',
          `  ${problem.desc}`,
          '',
        ].join('\n')
      }
    }
  },
  description: '获取LeetCode编程题目',
  usage: 'leetcode [难度] [主题]',
  examples: ['leetcode', 'leetcode easy', 'leetcode medium dp']
})

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 颜色工具',
          '═'.repeat(40),
          '',
          '用法: color <颜色值>',
          '',
          '支持格式:',
          '  RGB: rgb(255, 0, 0)',
          '  RGBA: rgba(255, 0, 0, 0.5)',
          '  HEX: #ff0000',
          '  HSL: hsl(0, 100%, 50%)',
          '',
          '示例:',
          '  color #ff5733',
          '  color rgb(255, 100, 50)',
          '  color hsl(200, 80%, 60%)',
          '',
        ].join('\n')
      }
    }
    
    const input = args.join(' ').toLowerCase()
    
    let r = 0, g = 0, b = 0, a = 1
    
    if (input.startsWith('#')) {
      const hex = input.replace('#', '')
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16)
        g = parseInt(hex[1] + hex[1], 16)
        b = parseInt(hex[2] + hex[2], 16)
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16)
        g = parseInt(hex.slice(2, 4), 16)
        b = parseInt(hex.slice(4, 6), 16)
      }
    } else if (input.startsWith('rgb')) {
      const match = input.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/)
      if (match) {
        r = parseInt(match[1])
        g = parseInt(match[2])
        b = parseInt(match[3])
      }
    } else if (input.startsWith('rgba')) {
      const match = input.match(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\)/)
      if (match) {
        r = parseInt(match[1])
        g = parseInt(match[2])
        b = parseInt(match[3])
        a = parseFloat(match[4])
      }
    } else if (input.startsWith('hsl')) {
      const match = input.match(/hsl\((\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\)/)
      if (match) {
        const h = parseInt(match[1]) / 360
        const s = parseInt(match[2]) / 100
        const l = parseInt(match[3]) / 100
        
        if (s === 0) {
          r = g = b = Math.round(l * 255)
        } else {
          const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
          }
          
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s
          const p = 2 * l - q
          
          r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
          g = Math.round(hue2rgb(p, q, h) * 255)
          b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
        }
      }
    }
    
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    let h = 0, s = 0
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    
    const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 128
    const textColor = isDark ? '#ffffff' : '#000000'
    
    const output: string[] = []
    output.push('🎨 颜色信息')
    output.push('═'.repeat(40))
    output.push('')
    output.push(`输入: ${input}`)
    output.push(`HEX: ${hex.toUpperCase()}`)
    output.push(`RGB: rgb(${r}, ${g}, ${b})`)
    output.push(`RGBA: rgba(${r}, ${g}, ${b}, ${a})`)
    output.push(`HSL: ${hsl}`)
    output.push(`亮度: ${((r * 299 + g * 587 + b * 114) / 1000).toFixed(1)} (${isDark ? '暗色' : '亮色'})`)
    output.push(`对比文字颜色: ${textColor}`)
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '颜色转换和信息查询',
  usage: 'color <颜色值>',
  examples: ['color #ff5733', 'color rgb(255, 100, 50)', 'color hsl(200, 80%, 60%)']
})

registerCommand('http-status', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const statusCodes: Record<string, { description: string; category: string }> = {
      '100': { description: 'Continue', category: '信息响应' },
      '101': { description: 'Switching Protocols', category: '信息响应' },
      '200': { description: 'OK', category: '成功响应' },
      '201': { description: 'Created', category: '成功响应' },
      '202': { description: 'Accepted', category: '成功响应' },
      '204': { description: 'No Content', category: '成功响应' },
      '301': { description: 'Moved Permanently', category: '重定向' },
      '302': { description: 'Found', category: '重定向' },
      '304': { description: 'Not Modified', category: '重定向' },
      '400': { description: 'Bad Request', category: '客户端错误' },
      '401': { description: 'Unauthorized', category: '客户端错误' },
      '403': { description: 'Forbidden', category: '客户端错误' },
      '404': { description: 'Not Found', category: '客户端错误' },
      '405': { description: 'Method Not Allowed', category: '客户端错误' },
      '408': { description: 'Request Timeout', category: '客户端错误' },
      '409': { description: 'Conflict', category: '客户端错误' },
      '422': { description: 'Unprocessable Entity', category: '客户端错误' },
      '429': { description: 'Too Many Requests', category: '客户端错误' },
      '500': { description: 'Internal Server Error', category: '服务器错误' },
      '502': { description: 'Bad Gateway', category: '服务器错误' },
      '503': { description: 'Service Unavailable', category: '服务器错误' },
      '504': { description: 'Gateway Timeout', category: '服务器错误' },
    }
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('📡 HTTP 状态码查询')
      output.push('═'.repeat(40))
      output.push('')
      output.push('用法: http-status <状态码>')
      output.push('')
      output.push('常用状态码:')
      output.push('')
      
      Object.entries(statusCodes).forEach(([code, info]) => {
        output.push(`  ${code} - ${info.description}`)
      })
      
      output.push('')
      output.push('示例: http-status 404, http-status 500')
      
      return { output: output.join('\n') }
    }
    
    const code = args[0]
    const info = statusCodes[code]
    
    if (!info) {
      return { output: `未找到状态码 ${code} 的信息` }
    }
    
    const color = code.startsWith('1') ? '\x1b[36m' : code.startsWith('2') ? '\x1b[32m' : code.startsWith('3') ? '\x1b[33m' : code.startsWith('4') ? '\x1b[35m' : '\x1b[31m'
    
    return {
      output: [
        '📡 HTTP 状态码',
        '═'.repeat(40),
        '',
        `状态码: ${color}${code}\x1b[0m`,
        `分类: ${info.category}`,
        `描述: ${info.description}`,
        '',
      ].join('\n')
    }
  },
  description: '查询HTTP状态码信息',
  usage: 'http-status <状态码>',
  examples: ['http-status 404', 'http-status 500', 'http-status 200']
})

registerCommand('regex-gen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const patterns: Record<string, { regex: string; description: string; example: string }> = {
      email: { regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', description: '邮箱地址', example: 'test@example.com' },
      phone: { regex: '1[3-9]\\d{9}', description: '中国大陆手机号', example: '13812345678' },
      url: { regex: 'https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]+', description: 'URL地址', example: 'https://example.com/path' },
      ipv4: { regex: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}', description: 'IPv4地址', example: '192.168.1.1' },
      ipv6: { regex: '[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7}', description: 'IPv6地址', example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
      date: { regex: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}', description: '日期格式', example: '2024-01-15' },
      time: { regex: '\\d{1,2}:\\d{2}(:\\d{2})?', description: '时间格式', example: '14:30:00' },
      hex: { regex: '#[0-9a-fA-F]{3,6}', description: '十六进制颜色', example: '#ff5733' },
      chinese: { regex: '[\\u4e00-\\u9fa5]+', description: '中文字符', example: '你好世界' },
      idcard: { regex: '\\d{17}[\\dXx]', description: '中国身份证号', example: '110101199001011234' },
      password: { regex: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}', description: '强密码(8位以上，包含大小写字母、数字、特殊字符)', example: 'Password123!' },
      uuid: { regex: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', description: 'UUID格式', example: '550e8400-e29b-41d4-a716-446655440000' },
    }
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('🔧 正则表达式生成器')
      output.push('═'.repeat(40))
      output.push('')
      output.push('用法: regex-gen <模式名称>')
      output.push('')
      output.push('可用模式:')
      output.push('')
      
      Object.entries(patterns).forEach(([name, info]) => {
        output.push(`  ${name.padEnd(12)} ${info.description}`)
      })
      
      output.push('')
      output.push('示例: regex-gen email, regex-gen phone')
      
      return { output: output.join('\n') }
    }
    
    const name = args[0].toLowerCase()
    const pattern = patterns[name]
    
    if (!pattern) {
      return { output: `未找到模式 "${name}"` }
    }
    
    return {
      output: [
        '🔧 正则表达式',
        '═'.repeat(40),
        '',
        `模式: ${pattern.description}`,
        '',
        `正则: ${pattern.regex}`,
        '',
        `示例: ${pattern.example}`,
        '',
        '提示: 使用 regex-test 命令测试正则表达式',
        '',
      ].join('\n')
    }
  },
  description: '生成常用正则表达式',
  usage: 'regex-gen <模式名称>',
  examples: ['regex-gen email', 'regex-gen phone', 'regex-gen url']
})

registerCommand('ascii-table', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 ASCII 表格生成器',
          '═'.repeat(40),
          '',
          '用法: ascii-table <标题1> <标题2> ...',
          '',
          '示例:',
          '  ascii-table Name Age City',
          '  ascii-table 姓名 年龄 城市',
          '',
          '提示: 输入标题后会生成空表格模板',
          '',
        ].join('\n')
      }
    }
    
    const headers = args
    const colWidths = headers.map(h => Math.max(h.length, 10))
    
    const output: string[] = []
    output.push('📊 ASCII 表格')
    output.push('═'.repeat(colWidths.reduce((a, b) => a + b + 3, 1)))
    output.push('')
    
    output.push('| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |')
    
    output.push('|-' + colWidths.map(w => '-'.repeat(w)).join('-|-') + '-|')
    
    output.push('| ' + colWidths.map(w => ' '.repeat(w)).join(' | ') + ' |')
    output.push('| ' + colWidths.map(w => ' '.repeat(w)).join(' | ') + ' |')
    
    output.push('')
    output.push('═'.repeat(colWidths.reduce((a, b) => a + b + 3, 1)))
    
    return { output: output.join('\n') }
  },
  description: '生成ASCII表格模板',
  usage: 'ascii-table <标题1> <标题2> ...',
  examples: ['ascii-table Name Age City', 'ascii-table 姓名 年龄 城市']
})

registerCommand('progress', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const percent = parseInt(args[0]) || 50
    const width = parseInt(args[1]) || 40
    
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return { output: '错误: 百分比必须在0-100之间' }
    }
    
    const filled = Math.round((percent / 100) * width)
    const empty = width - filled
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty)
    
    const color = percent >= 80 ? '\x1b[32m' : percent >= 50 ? '\x1b[33m' : '\x1b[31m'
    
    return {
      output: [
        '📊 进度条',
        '═'.repeat(40),
        '',
        `${color}[${bar}]\x1b[0m ${percent}%`,
        '',
      ].join('\n')
    }
  },
  description: '生成进度条',
  usage: 'progress <百分比> [宽度]',
  examples: ['progress 50', 'progress 75 50', 'progress 100 30']
})

registerCommand('base-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '🔢 进制转换器',
          '═'.repeat(40),
          '',
          '用法: base-convert <数值> <源进制> <目标进制>',
          '',
          '支持进制: 2-36',
          '',
          '示例:',
          '  base-convert 10 10 2',
          '  base-convert 1010 2 10',
          '  base-convert FF 16 10',
          '  base-convert 255 10 16',
          '',
        ].join('\n')
      }
    }
    
    const value = args[0]
    const fromBase = parseInt(args[1])
    const toBase = parseInt(args[2])
    
    if (isNaN(fromBase) || isNaN(toBase) || fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
      return { output: '错误: 进制必须在2-36之间' }
    }
    
    try {
      const decimal = parseInt(value, fromBase)
      const result = decimal.toString(toBase).toUpperCase()
      
      return {
        output: [
          '🔢 进制转换',
          '═'.repeat(40),
          '',
          `${value} (${fromBase}进制) = ${result} (${toBase}进制)`,
          `十进制: ${decimal}`,
          '',
        ].join('\n')
      }
    } catch {
      return { output: `错误: 无法将 "${value}" 从 ${fromBase} 进制转换` }
    }
  },
  description: '进制转换器',
  usage: 'base-convert <数值> <源进制> <目标进制>',
  examples: ['base-convert 10 10 2', 'base-convert FF 16 10', 'base-convert 1010 2 10']
})

registerCommand('url-parse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔗 URL 解析器',
          '═'.repeat(40),
          '',
          '用法: url-parse <URL>',
          '',
          '示例:',
          '  url-parse https://example.com/path?query=1#hash',
          '  url-parse http://api.example.com/v2/users?id=123',
          '',
        ].join('\n')
      }
    }
    
    const urlStr = args.join(' ')
    
    try {
      const url = new URL(urlStr)
      
      const output: string[] = []
      output.push('🔗 URL 解析结果')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`完整URL: ${url.href}`)
      output.push(`协议: ${url.protocol}`)
      output.push(`主机: ${url.host}`)
      output.push(`域名: ${url.hostname}`)
      output.push(`端口: ${url.port || '默认'}`)
      output.push(`路径: ${url.pathname}`)
      output.push(`查询: ${url.search || '无'}`)
      output.push(`哈希: ${url.hash || '无'}`)
      output.push(`用户名: ${url.username || '无'}`)
      output.push(`密码: ${url.password || '无'}`)
      
      if (url.searchParams.size > 0) {
        output.push('')
        output.push('查询参数:')
        url.searchParams.forEach((val, key) => {
          output.push(`  ${key}: ${val}`)
        })
      }
      
      output.push('')
      
      return { output: output.join('\n') }
    } catch (e) {
      return { output: `URL解析失败: ${(e as Error).message}` }
    }
  },
  description: '解析URL并提取各部分信息',
  usage: 'url-parse <URL>',
  examples: ['url-parse https://example.com/path?query=1', 'url-parse http://api.example.com/v2/users']
})

registerCommand('encode-url', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔐 URL 编码/解码',
          '═'.repeat(40),
          '',
          '用法: encode-url <encode|decode> <文本>',
          '',
          '示例:',
          '  encode-url encode Hello World!',
          '  encode-url decode Hello%20World%21',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (action === 'encode') {
      const encoded = encodeURIComponent(text)
      return {
        output: [
          '🔐 URL 编码',
          '═'.repeat(40),
          '',
          `原文: ${text}`,
          `编码: ${encoded}`,
          '',
        ].join('\n')
      }
    } else if (action === 'decode') {
      try {
        const decoded = decodeURIComponent(text)
        return {
          output: [
            '🔐 URL 解码',
            '═'.repeat(40),
            '',
            `编码: ${text}`,
            `原文: ${decoded}`,
            '',
          ].join('\n')
        }
      } catch (e) {
        return { output: `解码失败: ${(e as Error).message}` }
      }
    } else {
      return { output: '错误: 操作类型必须是 encode 或 decode' }
    }
  },
  description: 'URL编码和解码',
  usage: 'encode-url <encode|decode> <文本>',
  examples: ['encode-url encode Hello World!', 'encode-url decode Hello%20World']
})